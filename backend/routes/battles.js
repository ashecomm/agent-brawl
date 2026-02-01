const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { resolveBattle } = require('../logic/battleEngine');
const { generateItem } = require('../logic/lootSystem');
const { calculateEloChange } = require('../logic/eloSystem');
const { awardXP } = require('../logic/xpSystem');
const { getFighterWithDecay } = require('./fighters');

const ACHIEVEMENTS = {
  first_blood: { name: 'First Blood', desc: 'Win your first battle', icon: '🩸' },
  underdog: { name: 'Underdog', desc: 'Beat someone 300+ ELO higher', icon: '🐉' },
  streak_master: { name: 'Streak Master', desc: '10 consecutive wins', icon: '🔥' },
  legendary_hunter: { name: 'Legendary Hunter', desc: 'Drop a legendary item', icon: '⭐' },
  recruiter: { name: 'Recruiter', desc: '10 active recruits (level 10+)', icon: '👥' },
  level_10: { name: 'Rising Star', desc: 'Reach level 10', icon: '⬆️' },
  level_50: { name: 'Veteran', desc: 'Reach level 50', icon: '🏅' },
  level_100: { name: 'Legend', desc: 'Reach level 100', icon: '👑' },
  elo_1500: { name: 'Gold Standard', desc: 'Reach 1500 ELO', icon: '🥇' },
  elo_2100: { name: 'Champion', desc: 'Reach Champion league', icon: '🏆' },
  perfect_run: { name: 'Perfect Run', desc: 'Win 5 battles taking less than 50% damage', icon: '✨' }
};

function awardAchievement(wallet, id) {
  const existing = db.prepare('SELECT 1 FROM achievements WHERE fighter_wallet = ? AND achievement_id = ?').get(wallet, id);
  if (!existing) {
    db.prepare('INSERT INTO achievements (fighter_wallet, achievement_id, earned_at) VALUES (?, ?, ?)').run(wallet, id, new Date().toISOString());
    return true;
  }
  return false;
}

function checkAchievements(fighter, battleResult, wasWinner, loot) {
  const earned = [];

  if (wasWinner) {
    if (fighter.wins === 1 && awardAchievement(fighter.wallet, 'first_blood')) earned.push('first_blood');

    // Underdog: opponent had 300+ ELO higher before battle
    const opWallet = battleResult.challenger === fighter.wallet ? battleResult.defender : battleResult.challenger;
    const op = db.prepare('SELECT elo FROM fighters WHERE wallet = ?').get(opWallet);
    if (op) {
      const opEloBefore = op.elo - battleResult.elo_loser;
      const myEloBefore = fighter.elo - battleResult.elo_winner;
      if (opEloBefore - myEloBefore >= 300 && awardAchievement(fighter.wallet, 'underdog')) earned.push('underdog');
    }

    if (fighter.winstreak >= 10 && awardAchievement(fighter.wallet, 'streak_master')) earned.push('streak_master');
    if (loot && loot.rarity === 'legendary' && awardAchievement(fighter.wallet, 'legendary_hunter')) earned.push('legendary_hunter');
  }

  if (fighter.level >= 10 && awardAchievement(fighter.wallet, 'level_10')) earned.push('level_10');
  if (fighter.level >= 50 && awardAchievement(fighter.wallet, 'level_50')) earned.push('level_50');
  if (fighter.level >= 100 && awardAchievement(fighter.wallet, 'level_100')) earned.push('level_100');
  if (fighter.elo >= 1500 && awardAchievement(fighter.wallet, 'elo_1500')) earned.push('elo_1500');
  if (fighter.elo >= 2100 && awardAchievement(fighter.wallet, 'elo_2100')) earned.push('elo_2100');

  const activeRecruits = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ? AND level >= 10').get(fighter.wallet)?.count || 0;
  if (activeRecruits >= 10 && awardAchievement(fighter.wallet, 'recruiter')) earned.push('recruiter');

  return earned;
}

function equipItem(wallet, loot) {
  const current = db.prepare('SELECT * FROM equipment WHERE fighter_wallet = ? AND slot = ?').get(wallet, loot.slot);
  let equipped = false;

  const insertItem = () => {
    db.prepare(`INSERT INTO equipment (id, fighter_wallet, slot, name, rarity, attack_bonus, defense_bonus, speed_bonus, luck_bonus, xp_bonus_percent, crit_chance, dodge_chance, damage_reduction, passive, unique_effect)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      loot.id, wallet, loot.slot, loot.name, loot.rarity,
      loot.attack_bonus, loot.defense_bonus, loot.speed_bonus, loot.luck_bonus,
      loot.xp_bonus_percent, loot.crit_chance, loot.dodge_chance, loot.damage_reduction,
      loot.passive, loot.unique_effect
    );
  };

  if (!current) {
    insertItem();
    equipped = true;
  } else {
    const currentTotal = current.attack_bonus + current.defense_bonus + current.speed_bonus + current.luck_bonus;
    const newTotal = loot.attack_bonus + loot.defense_bonus + loot.speed_bonus + loot.luck_bonus;
    if (newTotal > currentTotal || loot.rarity === 'legendary') {
      db.prepare('DELETE FROM equipment WHERE id = ?').run(current.id);
      insertItem();
      equipped = true;
    }
  }
  return equipped;
}

// POST /battles/challenge
router.post('/challenge', (req, res) => {
  const { challenger, defender } = req.body;
  if (!challenger || !defender) return res.status(400).json({ error: 'Challenger and defender required' });

  const cW = challenger.toLowerCase();
  const dW = defender.toLowerCase();
  if (cW === dW) return res.status(400).json({ error: 'Cannot fight yourself' });

  const cFighter = getFighterWithDecay(cW);
  const dFighter = getFighterWithDecay(dW);
  if (!cFighter) return res.status(404).json({ error: 'Challenger not found' });
  if (!dFighter) return res.status(404).json({ error: 'Defender not found' });

  const cEquip = db.prepare('SELECT * FROM equipment WHERE fighter_wallet = ?').all(cW);
  const dEquip = db.prepare('SELECT * FROM equipment WHERE fighter_wallet = ?').all(dW);
  const cRef = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ?').get(cW)?.count || 0;
  const dRef = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ?').get(dW)?.count || 0;

  const result = resolveBattle(cFighter, cEquip, cRef, dFighter, dEquip, dRef);

  const now = new Date().toISOString();
  const battleId = uuidv4();

  // DRAW
  if (!result.winner) {
    db.prepare('UPDATE fighters SET elo = MAX(0, elo - 10), last_active = ? WHERE wallet = ?').run(now, cW);
    db.prepare('UPDATE fighters SET elo = MAX(0, elo - 10), last_active = ? WHERE wallet = ?').run(now, dW);
    db.prepare(`INSERT INTO battles (id, challenger, defender, winner, loser, elo_winner, elo_loser, rounds, loot, xp_winner, xp_loser, created_at) VALUES (?, ?, ?, NULL, NULL, -10, -10, ?, NULL, 25, 25, ?)`).run(
      battleId, cW, dW, JSON.stringify(result.rounds), now
    );
    return res.json({ id: battleId, draw: true, rounds: result.rounds, f1MaxHp: result.f1MaxHp, f2MaxHp: result.f2MaxHp });
  }

  const winnerWallet = result.winner === 'f1' ? cW : dW;
  const loserWallet = result.winner === 'f1' ? dW : cW;
  const winnerFighter = result.winner === 'f1' ? cFighter : dFighter;
  const loserFighter = result.winner === 'f1' ? dFighter : cFighter;
  const winnerEquip = result.winner === 'f1' ? cEquip : dEquip;
  const loserEquip = result.winner === 'f1' ? dEquip : cEquip;

  // ELO
  const eloChanges = calculateEloChange(winnerFighter.elo, loserFighter.elo);

  // XP
  const wHelmXp = winnerEquip.find(e => e.slot === 'helmet')?.xp_bonus_percent || 0;
  const lHelmXp = loserEquip.find(e => e.slot === 'helmet')?.xp_bonus_percent || 0;
  const wXpRes = awardXP(winnerFighter, 100, wHelmXp);
  const lXpRes = awardXP(loserFighter, 25, lHelmXp);

  // Loot
  const loot = generateItem();
  const equipped = equipItem(winnerWallet, loot);
  loot.equipped = equipped;

  // Update winner
  db.prepare(`UPDATE fighters SET elo = ?, wins = wins + 1, winstreak = winstreak + 1, level = ?, xp = ?,
    base_attack = base_attack + ?, base_defense = base_defense + ?, base_speed = base_speed + ?, base_luck = base_luck + ?, last_active = ? WHERE wallet = ?`).run(
    winnerFighter.elo + eloChanges.winner, wXpRes.newLevel, wXpRes.newXp,
    wXpRes.statGains.attack, wXpRes.statGains.defense, wXpRes.statGains.speed, wXpRes.statGains.luck, now, winnerWallet
  );

  // Update loser
  db.prepare(`UPDATE fighters SET elo = MAX(0, ?), losses = losses + 1, winstreak = 0, level = ?, xp = ?,
    base_attack = base_attack + ?, base_defense = base_defense + ?, base_speed = base_speed + ?, base_luck = base_luck + ?, last_active = ? WHERE wallet = ?`).run(
    loserFighter.elo + eloChanges.loser, lXpRes.newLevel, lXpRes.newXp,
    lXpRes.statGains.attack, lXpRes.statGains.defense, lXpRes.statGains.speed, lXpRes.statGains.luck, now, loserWallet
  );

  // Save battle
  db.prepare(`INSERT INTO battles (id, challenger, defender, winner, loser, elo_winner, elo_loser, rounds, loot, xp_winner, xp_loser, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    battleId, cW, dW, winnerWallet, loserWallet, eloChanges.winner, eloChanges.loser,
    JSON.stringify(result.rounds), JSON.stringify(loot), wXpRes.effectiveXpAwarded, lXpRes.effectiveXpAwarded, now
  );

  // Achievements
  const updatedWinner = db.prepare('SELECT * FROM fighters WHERE wallet = ?').get(winnerWallet);
  const updatedLoser = db.prepare('SELECT * FROM fighters WHERE wallet = ?').get(loserWallet);
  const battleRecord = { challenger: cW, defender: dW, elo_winner: eloChanges.winner, elo_loser: eloChanges.loser };
  const wAchievements = checkAchievements(updatedWinner, battleRecord, true, loot);
  const lAchievements = checkAchievements(updatedLoser, battleRecord, false, null);

  // Referral bonus: if winner just hit level 10 and has a referrer, give referrer a loot box
  if (wXpRes.leveledUp && updatedWinner.level >= 10 && updatedWinner.referrer) {
    const bonusLoot = generateItem();
    equipItem(updatedWinner.referrer, bonusLoot);
  }

  res.json({
    id: battleId,
    winner: winnerWallet,
    loser: loserWallet,
    rounds: result.rounds,
    f1MaxHp: result.f1MaxHp,
    f2MaxHp: result.f2MaxHp,
    eloWinner: eloChanges.winner,
    eloLoser: eloChanges.loser,
    loot,
    xpWinner: wXpRes.effectiveXpAwarded,
    xpLoser: lXpRes.effectiveXpAwarded,
    winnerLeveledUp: wXpRes.leveledUp,
    loserLeveledUp: lXpRes.leveledUp,
    winnerLevel: updatedWinner.level,
    loserLevel: updatedLoser.level,
    winnerAchievements: wAchievements,
    loserAchievements: lAchievements
  });
});

// GET /battles/:wallet — last 50 battles
router.get('/:wallet', (req, res) => {
  const w = req.params.wallet.toLowerCase();
  const battles = db.prepare('SELECT * FROM battles WHERE challenger = ? OR defender = ? ORDER BY created_at DESC LIMIT 50').all(w, w);
  res.json(battles.map(b => ({
    ...b,
    rounds: JSON.parse(b.rounds),
    loot: b.loot ? JSON.parse(b.loot) : null
  })));
});

module.exports = router;
module.exports.ACHIEVEMENTS = ACHIEVEMENTS;
