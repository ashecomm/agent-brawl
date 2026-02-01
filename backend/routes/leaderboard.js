const express = require('express');
const router = express.Router();
const db = require('../db');
const { getLeague } = require('../logic/eloSystem');

router.get('/', (req, res) => {
  const sort = ['elo', 'wins', 'level'].includes(req.query.sort) ? req.query.sort : 'elo';
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);

  const fighters = db.prepare(`SELECT * FROM fighters ORDER BY ${sort} DESC LIMIT ?`).all(limit);

  res.json(fighters.map((f, i) => ({
    rank: i + 1,
    wallet: f.wallet,
    level: f.level,
    elo: f.elo,
    league: getLeague(f.elo),
    wins: f.wins,
    losses: f.losses,
    winstreak: f.winstreak,
    avatar_seed: f.avatar_seed,
    isHallOfFame: sort === 'elo' && i < 10
  })));
});

module.exports = router;
