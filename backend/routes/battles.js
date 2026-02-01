const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { resolveBattle } = require('../logic/battleEngine');
const { generateItem } = require('../logic/lootSystem');
const { calculateEloChange } = require('../logic/eloSystem');
const { awardXP } = require('../logic/xpSystem');
const { getFighter } = require('./fighters');

function awardAchievement(agentId, id) {
  const existing = db.prepare('SELECT 1 FROM achievements WHERE fighter_id = ? AND achievement_id = ?').get(agentId, id);
  if (!existing) {
    db.prepare('INSERT INTO achievements (fighter_id, achievement_id, earned_at) VALUES (?, ?, ?)').run(agentId, id, new Date().toISOString());
    return true;
  }
  return false;
}

function checkAchievements(fighter, battleResult, wasWinner, loot) {
  const earned = [];
  const id = fighter.agent_id;

  if (wasWinner) {
    if (fighter.wins === 1 && awardAchievement(id, 'first_blood')) earned.push('first_blood');

    const opId = battleResult.challenger === id ? battleResult.defender : battleResult.challenger;
    const op = db.prepare('SELECT elo FROM fighters WHERE agent_id = ?').get(opId);
    if (op) {
      const opEloBefore = op.elo - battleResult.elo_loser;
      const myEloBefore = fighter.elo - battleResult.elo_winner;
      if (opEloBefore - myEloBefore >= 300 && awardAchievement(id, 'underdog')) earned.push('underdog');
    }

    if (fighter.winstreak >= 10 && awardAchievement(id, 'streak_master')) earned.push('streak_master');
    if (loot && loot.rarity === 'legendary' && awardAchievement(id, 'legendary_hunter')) earned.push('legendary_hunter');
  }

  if (fighter.level >= 10 && awardAchievement(id, 'level_10')) earned.push('level_10');
  if (fighter.level >= 50 && awardAchievement(id, 'level_50')) earned.push('level_50');
  if (fighter.level >= 100 && awardAchievement(id, 'level_100')) earned.push('level_100');
  if (fighter.elo >= 1500 && awardAchievement(id, 'elo_1500')) earned.push('elo_1500');
  if (fighter.elo >= 2100 && awardAchievement(id, 'elo_2100')) earned.push('elo_2100');

  const activeRecruits = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ? AND level >= 10').get(id)?.count || 0;
  if (activeRecruits >= 10 && awardAchievement(id, 'recruiter')) earned.push('recruiter');

  return earned;
}

function equipItem(agentId, loot) {
  const current = db.prepare('SELECT * FROM equipment WHERE fighter_id = ? AND slot = ?').get(agentId, loot.slot);
  let equipped = false;

  const insertItem = () => {
    db.prepare(`INSERT INTO equipment (id, fighter_id, slot, name, rarity, attack_bonus, defense_bonus, speed_bonus, luck_bonus, xp_bonus_percent, crit_chance, dodge_chance, damage_reduction, passive, unique_effect)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      loot.id, agentId, loot.slot, loot.name, loot.rarity,
      loot.attack_bonus, loot.defense_bonus, loot.speed_bonus, loot.luck_bonus,
      loot.xp_bonus_percent, loot.crit_chance, loot.dodge_chance, loot.damage_reduction,
      loot.passive, loot.unique_effect
    );
  };

  if (!current) {
    insertItem();
    equipped = true;
  } else {
    const curTotal = current.attack_bonus + current.defense_bonus + current.speed_bonus + current.luck_bonus;
    const newTotal = loot.attack_bonus + loot.defense_bonus + loot.speed_bonus + loot.luck_bonus;
    if (newTotal > curTotal || loot.rarity === 'legendary') {
      db.prepare('DELETE FROM equipment WHERE id = ?').run(current.id);
      insertItem();
      equipped = true;
    }
  }
  return equipped;
}

// POST /battles/challenge
router.post('/challenge', (req, res) => {
  const challenger = req.agent.id;
  const { defender } = req.body;

  if (!defender) return res.status(400).json({ error: 'Defender agent ID required' });
  if (challenger === defender) return res.status(400).json({ error: 'Cannot fight yourself' });

  const cFighter = getFighter(challenger);
  const dFighter = getFighter(defender);
  if (!cFighter) return res.status(404).json({ error: 'Your fighter not found' });
  if (!dFighter) return res.status(404).json({ error: 'Opponent not found' });

  const cEquip = db.prepare('SELECT * FROM equipment WHERE fighter_id = ?').all(challenger);
  const dEquip = db.prepare('SELECT * FROM equipment WHERE fighter_id = ?').all(defender);
  const cRef = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ?').get(challenger)?.count || 0;
  const dRef = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ?').get(defender)?.count || 0;

  const result = resolveBattle(cFighter, cEquip, cRef, dFighter, dEquip, dRef);

  const now = new Date().toISOString();
  const battleId = uuidv4();

  // DRAW
  if (!result.winner) {
    db.prepare('UPDATE fighters SET elo = MAX(0, elo - 10), last_active = ? WHERE agent_id = ?').run(now, challenger);
    db.prepare('UPDATE fighters SET elo = MAX(0, elo - 10), last_active = ? WHERE agent_id = ?').run(now, defender);
    db.prepare(`INSERT INTO battles VALUES (?, ?, ?, NULL, NULL, -10, -10, ?, NULL, 25, 25, ?)`).run(
      battleId, challenger, defender, JSON.stringify(result.rounds), now
    );
    return res.json({ id: battleId, draw: true, rounds: result.rounds, f1MaxHp: result.f1MaxHp, f2MaxHp: result.f2MaxHp, challengerName: cFighter.name, defenderName: dFighter.name });
  }

  const winId = result.winner === 'f1' ? challenger : defender;
  const loseId = result.winner === 'f1' ? defender : challenger;
  const winFighter = result.winner === 'f1' ? cFighter : dFighter;
  const loseFighter = result.winner === 'f1' ? dFighter : cFighter;
  const winEquip = result.winner === 'f1' ? cEquip : dEquip;
  const loseEquip = result.winner === 'f1' ? dEquip : cEquip;

  const eloChanges = calculateEloChange(winFighter.elo, loseFighter.elo);

  const wHelmXp = winEquip.find(e => e.slot === 'helmet')?.xp_bonus_percent || 0;
  const lHelmXp = loseEquip.find(e => e.slot === 'helmet')?.xp_bonus_percent || 0;
  const wXp = awardXP(winFighter, 100, wHelmXp);
  const lXp = awardXP(loseFighter, 25, lHelmXp);

  const loot = generateItem();
  const equipped = equipItem(winId, loot);
  loot.equipped = equipped;

  // Update winner
  db.prepare(`UPDATE fighters SET elo=?, wins=wins+1, winstreak=winstreak+1, level=?, xp=?,
    base_attack=base_attack+?, base_defense=base_defense+?, base_speed=base_speed+?, base_luck=base_luck+?, last_active=? WHERE agent_id=?`).run(
    winFighter.elo + eloChanges.winner, wXp.newLevel, wXp.newXp,
    wXp.statGains.attack, wXp.statGains.defense, wXp.statGains.speed, wXp.statGains.luck, now, winId
  );

  // Update loser
  db.prepare(`UPDATE fighters SET elo=MAX(0,?), losses=losses+1, winstreak=0, level=?, xp=?,
    base_attack=base_attack+?, base_defense=base_defense+?, base_speed=base_speed+?, base_luck=base_luck+?, last_active=? WHERE agent_id=?`).run(
    loseFighter.elo + eloChanges.loser, lXp.newLevel, lXp.newXp,
    lXp.statGains.attack, lXp.statGains.defense, lXp.statGains.speed, lXp.statGains.luck, now, loseId
  );

  // Save battle
  db.prepare(`INSERT INTO battles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    battleId, challenger, defender, winId, loseId, eloChanges.winner, eloChanges.loser,
    JSON.stringify(result.rounds), JSON.stringify(loot), wXp.effectiveXpAwarded, lXp.effectiveXpAwarded, now
  );

  // Achievements
  const updWin = db.prepare('SELECT * FROM fighters WHERE agent_id = ?').get(winId);
  const updLose = db.prepare('SELECT * FROM fighters WHERE agent_id = ?').get(loseId);
  const bRecord = { challenger, defender, elo_winner: eloChanges.winner, elo_loser: eloChanges.loser };
  const wAch = checkAchievements(updWin, bRecord, true, loot);
  const lAch = checkAchievements(updLose, bRecord, false, null);

  // Referral bonus on level 10
  if (wXp.leveledUp && updWin.level >= 10 && updWin.referrer) {
    equipItem(updWin.referrer, generateItem());
  }

  res.json({
    id: battleId,
    winner: winId,
    loser: loseId,
    challengerName: cFighter.name,
    defenderName: dFighter.name,
    rounds: result.rounds,
    f1MaxHp: result.f1MaxHp,
    f2MaxHp: result.f2MaxHp,
    eloWinner: eloChanges.winner,
    eloLoser: eloChanges.loser,
    loot,
    xpWinner: wXp.effectiveXpAwarded,
    xpLoser: lXp.effectiveXpAwarded,
    winnerLeveledUp: wXp.leveledUp,
    loserLeveledUp: lXp.leveledUp,
    winnerLevel: updWin.level,
    loserLevel: updLose.level,
    winnerAchievements: wAch,
    loserAchievements: lAch
  });
});

// GET /battles/me — my last 50 battles
router.get('/me', (req, res) => {
  const id = req.agent.id;
  const battles = db.prepare('SELECT * FROM battles WHERE challenger = ? OR defender = ? ORDER BY created_at DESC LIMIT 50').all(id, id);
  res.json(battles.map(b => ({
    ...b,
    rounds: JSON.parse(b.rounds),
    loot: b.loot ? JSON.parse(b.loot) : null
  })));
});

module.exports = router;
