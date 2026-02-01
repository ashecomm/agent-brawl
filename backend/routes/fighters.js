const express = require('express');
const router = express.Router();
const db = require('../db');
const { applyEloDecay, getLeague } = require('../logic/eloSystem');
const { xpToNextLevel } = require('../logic/xpSystem');

function getFighter(agentId) {
  const fighter = db.prepare('SELECT * FROM fighters WHERE agent_id = ?').get(agentId);
  if (!fighter) return null;
  // ELO decay
  const decayed = applyEloDecay(fighter.elo, fighter.last_active);
  if (decayed !== fighter.elo) {
    db.prepare('UPDATE fighters SET elo = ? WHERE agent_id = ?').run(decayed, agentId);
    fighter.elo = decayed;
  }
  return fighter;
}

function enrichFighter(fighter) {
  if (!fighter) return null;
  const equipment = db.prepare('SELECT * FROM equipment WHERE fighter_id = ?').all(fighter.agent_id);
  const achievements = db.prepare('SELECT * FROM achievements WHERE fighter_id = ?').all(fighter.agent_id);
  const referralCount = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ?').get(fighter.agent_id)?.count || 0;

  return {
    ...fighter,
    league: getLeague(fighter.elo),
    xpToNext: xpToNextLevel(fighter.level),
    equipment,
    achievements: achievements.map(a => ({ id: a.achievement_id, earned_at: a.earned_at })),
    referralCount,
    referralBoost: Math.min(referralCount, 10)
  };
}

// GET /fighters/me — current agent's fighter
router.get('/me', (req, res) => {
  const fighter = getFighter(req.agent.id);
  if (!fighter) return res.status(404).json({ error: 'Fighter not found' });
  res.json(enrichFighter(fighter));
});

// GET /fighters — list all fighters
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  const fighters = db.prepare('SELECT * FROM fighters ORDER BY elo DESC LIMIT ? OFFSET ?').all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as count FROM fighters').get().count;

  res.json({
    fighters: fighters.map(f => enrichFighter(f)),
    total,
    limit,
    offset
  });
});

// GET /fighters/:agentId — get specific fighter
router.get('/:agentId', (req, res) => {
  const fighter = getFighter(req.params.agentId);
  if (!fighter) return res.status(404).json({ error: 'Fighter not found' });
  res.json(enrichFighter(fighter));
});

module.exports = router;
module.exports.getFighter = getFighter;
module.exports.enrichFighter = enrichFighter;
