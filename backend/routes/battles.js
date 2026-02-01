const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db');
const { resolveBattle } = require('../logic/battleEngine');
const { generateItem } = require('../logic/lootSystem');
const { calculateEloChange } = require('../logic/eloSystem');
const { awardXP } = require('../logic/xpSystem');
const { getFighter } = require('./fighters');

// ─── Achievements ─────────────────────────────────────────────
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
  if (!current) { insertItem(); equipped = true; }
  else {
    const curTotal = current.attack_bonus + current.defense_bonus + current.speed_bonus + current.luck_bonus;
    const newTotal = loot.attack_bonus + loot.defense_bonus + loot.speed_bonus + loot.luck_bonus;
    if (newTotal > curTotal || loot.rarity === 'legendary') {
      db.prepare('DELETE FROM equipment WHERE id = ?').run(current.id);
      insertItem(); equipped = true;
    }
  }
  return equipped;
}

// ─── Core battle execution ────────────────────────────────────
function executeBattle(challengerId, defenderId) {
  const cFighter = getFighter(challengerId);
  const dFighter = getFighter(defenderId);
  if (!cFighter || !dFighter) return null;

  const cEquip = db.prepare('SELECT * FROM equipment WHERE fighter_id = ?').all(challengerId);
  const dEquip = db.prepare('SELECT * FROM equipment WHERE fighter_id = ?').all(defenderId);
  const cRef = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ?').get(challengerId)?.count || 0;
  const dRef = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ?').get(defenderId)?.count || 0;

  const result = resolveBattle(cFighter, cEquip, cRef, dFighter, dEquip, dRef);
  const now = new Date().toISOString();
  const battleId = uuidv4();

  // DRAW
  if (!result.winner) {
    db.prepare('UPDATE fighters SET elo = MAX(0, elo - 10), last_active = ? WHERE agent_id = ?').run(now, challengerId);
    db.prepare('UPDATE fighters SET elo = MAX(0, elo - 10), last_active = ? WHERE agent_id = ?').run(now, defenderId);
    db.prepare(`INSERT INTO battles VALUES (?, ?, ?, NULL, NULL, -10, -10, ?, NULL, 25, 25, ?)`).run(
      battleId, challengerId, defenderId, JSON.stringify(result.rounds), now
    );
    return { id: battleId, draw: true, rounds: result.rounds, f1MaxHp: result.f1MaxHp, f2MaxHp: result.f2MaxHp, challengerName: cFighter.name, defenderName: dFighter.name };
  }

  const winId = result.winner === 'f1' ? challengerId : defenderId;
  const loseId = result.winner === 'f1' ? defenderId : challengerId;
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

  db.prepare(`UPDATE fighters SET elo=?, wins=wins+1, winstreak=winstreak+1, level=?, xp=?,
    base_attack=base_attack+?, base_defense=base_defense+?, base_speed=base_speed+?, base_luck=base_luck+?, last_active=? WHERE agent_id=?`).run(
    winFighter.elo + eloChanges.winner, wXp.newLevel, wXp.newXp,
    wXp.statGains.attack, wXp.statGains.defense, wXp.statGains.speed, wXp.statGains.luck, now, winId
  );
  db.prepare(`UPDATE fighters SET elo=MAX(0,?), losses=losses+1, winstreak=0, level=?, xp=?,
    base_attack=base_attack+?, base_defense=base_defense+?, base_speed=base_speed+?, base_luck=base_luck+?, last_active=? WHERE agent_id=?`).run(
    loseFighter.elo + eloChanges.loser, lXp.newLevel, lXp.newXp,
    lXp.statGains.attack, lXp.statGains.defense, lXp.statGains.speed, lXp.statGains.luck, now, loseId
  );

  db.prepare(`INSERT INTO battles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    battleId, challengerId, defenderId, winId, loseId, eloChanges.winner, eloChanges.loser,
    JSON.stringify(result.rounds), JSON.stringify(loot), wXp.effectiveXpAwarded, lXp.effectiveXpAwarded, now
  );

  const updWin = db.prepare('SELECT * FROM fighters WHERE agent_id = ?').get(winId);
  const updLose = db.prepare('SELECT * FROM fighters WHERE agent_id = ?').get(loseId);
  const bRecord = { challenger: challengerId, defender: defenderId, elo_winner: eloChanges.winner, elo_loser: eloChanges.loser };
  const wAch = checkAchievements(updWin, bRecord, true, loot);
  const lAch = checkAchievements(updLose, bRecord, false, null);

  if (wXp.leveledUp && updWin.level >= 10 && updWin.referrer) {
    equipItem(updWin.referrer, generateItem());
  }

  return {
    id: battleId, winner: winId, loser: loseId,
    challengerName: cFighter.name, defenderName: dFighter.name,
    rounds: result.rounds, f1MaxHp: result.f1MaxHp, f2MaxHp: result.f2MaxHp,
    eloWinner: eloChanges.winner, eloLoser: eloChanges.loser,
    loot, xpWinner: wXp.effectiveXpAwarded, xpLoser: lXp.effectiveXpAwarded,
    winnerLeveledUp: wXp.leveledUp, loserLeveledUp: lXp.leveledUp,
    winnerLevel: updWin.level, loserLevel: updLose.level,
    winnerAchievements: wAch, loserAchievements: lAch
  };
}

// ─── POST /challenge ──────────────────────────────────────────
router.post('/challenge', (req, res) => {
  const challenger = req.agent.id;
  const { defender } = req.body;
  if (!defender) return res.status(400).json({ error: 'Defender agent ID required' });
  if (challenger === defender) return res.status(400).json({ error: 'Cannot fight yourself' });
  const dFighter = db.prepare('SELECT * FROM fighters WHERE agent_id = ?').get(defender);
  if (!dFighter) return res.status(404).json({ error: 'Opponent not found' });

  const result = executeBattle(challenger, defender);
  if (!result) return res.status(500).json({ error: 'Battle failed' });
  res.json(result);
});

// ─── POST /queue — enter matchmaking ──────────────────────────
router.post('/queue', (req, res) => {
  const agentId = req.agent.id;
  const fighter = getFighter(agentId);
  if (!fighter) return res.status(404).json({ error: 'Fighter not found' });

  // Clean expired entries (>60s)
  db.prepare(`DELETE FROM queue WHERE created_at < datetime('now', '-60 seconds')`).run();

  // Already queued?
  const existing = db.prepare('SELECT * FROM queue WHERE agent_id = ?').get(agentId);
  if (existing) return res.status(409).json({ error: 'Already in queue' });

  const myElo = fighter.elo;
  const range = Math.max(50, Math.floor(myElo * 0.1));

  // 1. Find match within ±10% ELO
  let match = db.prepare(`
    SELECT q.* FROM queue q
    JOIN fighters f ON q.agent_id = f.agent_id
    WHERE q.agent_id != ? AND q.status = 'waiting'
    AND f.elo BETWEEN ? AND ?
    ORDER BY ABS(f.elo - ?) ASC
    LIMIT 1
  `).get(agentId, myElo - range, myElo + range, myElo);

  // 2. Fallback: closest ELO in entire queue
  if (!match) {
    match = db.prepare(`
      SELECT q.* FROM queue q
      JOIN fighters f ON q.agent_id = f.agent_id
      WHERE q.agent_id != ? AND q.status = 'waiting'
      ORDER BY ABS(f.elo - ?) ASC
      LIMIT 1
    `).get(agentId, myElo);
  }

  if (match) {
    // Match found — I'm challenger, match is defender
    const result = executeBattle(agentId, match.agent_id);
    if (!result) {
      db.prepare('DELETE FROM queue WHERE agent_id = ?').run(match.agent_id);
      return res.status(500).json({ error: 'Battle failed' });
    }
    // Store result for the waiting agent to pick up on poll
    db.prepare('UPDATE queue SET status = ?, result = ? WHERE agent_id = ?').run('matched', JSON.stringify(result), match.agent_id);
    return res.json({ status: 'matched', result });
  }

  // No match — enter queue
  const queueId = 'q_' + crypto.randomBytes(6).toString('hex');
  db.prepare('INSERT INTO queue (id, agent_id, elo, status, created_at) VALUES (?, ?, ?, ?, ?)').run(
    queueId, agentId, myElo, 'waiting', new Date().toISOString()
  );
  res.json({ status: 'waiting', queueId });
});

// ─── GET /queue/:queueId — poll for match ─────────────────────
router.get('/queue/:queueId', (req, res) => {
  const agentId = req.agent.id;
  const entry = db.prepare('SELECT * FROM queue WHERE id = ? AND agent_id = ?').get(req.params.queueId, agentId);

  if (!entry) return res.json({ status: 'not_found' });

  if (entry.status === 'matched') {
    db.prepare('DELETE FROM queue WHERE id = ?').run(entry.id);
    return res.json({ status: 'matched', result: JSON.parse(entry.result) });
  }

  // Timeout check
  const age = (Date.now() - new Date(entry.created_at).getTime()) / 1000;
  if (age > 60) {
    db.prepare('DELETE FROM queue WHERE id = ?').run(entry.id);
    return res.json({ status: 'timeout' });
  }

  res.json({ status: 'waiting' });
});

// ─── DELETE /queue — leave queue ───────────────────────────────
router.delete('/queue', (req, res) => {
  db.prepare('DELETE FROM queue WHERE agent_id = ?').run(req.agent.id);
  res.json({ status: 'left' });
});

// ─── GET /me ──────────────────────────────────────────────────
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
