const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /referrals/leaderboard
router.get('/leaderboard', (req, res) => {
  const results = db.prepare(`
    SELECT referrer, COUNT(*) as total, SUM(CASE WHEN level >= 10 THEN 1 ELSE 0 END) as active
    FROM fighters WHERE referrer IS NOT NULL
    GROUP BY referrer ORDER BY active DESC, total DESC LIMIT 50
  `).all();

  // Enrich with names
  res.json(results.map(r => {
    const fighter = db.prepare('SELECT name FROM fighters WHERE agent_id = ?').get(r.referrer);
    return { ...r, name: fighter?.name || r.referrer };
  }));
});

// GET /referrals/me
router.get('/me', (req, res) => {
  const agentId = req.agent.id;
  const recruits = db.prepare('SELECT agent_id, name, level, wins, created_at FROM fighters WHERE referrer = ? ORDER BY level DESC').all(agentId);
  const activeRecruits = recruits.filter(r => r.level >= 10).length;

  res.json({
    agentId,
    totalRecruits: recruits.length,
    activeRecruits,
    boostPercent: Math.min(recruits.length, 10),
    recruits
  });
});

module.exports = router;
