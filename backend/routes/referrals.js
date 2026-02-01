const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /referrals/leaderboard — must be before /:wallet
router.get('/leaderboard', (req, res) => {
  const results = db.prepare(`
    SELECT referrer as wallet, COUNT(*) as total, SUM(CASE WHEN level >= 10 THEN 1 ELSE 0 END) as active
    FROM fighters
    WHERE referrer IS NOT NULL
    GROUP BY referrer
    ORDER BY active DESC, total DESC
    LIMIT 50
  `).all();
  res.json(results);
});

// GET /referrals/:wallet
router.get('/:wallet', (req, res) => {
  const wallet = req.params.wallet.toLowerCase();
  const recruits = db.prepare('SELECT wallet, level, wins, created_at FROM fighters WHERE referrer = ? ORDER BY level DESC').all(wallet);
  const activeRecruits = recruits.filter(r => r.level >= 10).length;
  const boostPercent = Math.min(recruits.length, 10);

  res.json({
    wallet,
    totalRecruits: recruits.length,
    activeRecruits,
    boostPercent,
    recruits
  });
});

module.exports = router;
