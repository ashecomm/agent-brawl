const express = require('express');
const router = express.Router();
const db = require('../db');
const { applyEloDecay, getLeague } = require('../logic/eloSystem');
const { xpToNextLevel } = require('../logic/xpSystem');

function getFighterWithDecay(wallet) {
  const fighter = db.prepare('SELECT * FROM fighters WHERE wallet = ?').get(wallet);
  if (!fighter) return null;
  const decayedElo = applyEloDecay(fighter.elo, fighter.last_active);
  if (decayedElo !== fighter.elo) {
    db.prepare('UPDATE fighters SET elo = ? WHERE wallet = ?').run(decayedElo, wallet);
    fighter.elo = decayedElo;
  }
  return fighter;
}

function enrichFighter(fighter) {
  const equipment = db.prepare('SELECT * FROM equipment WHERE fighter_wallet = ?').all(fighter.wallet);
  const achievements = db.prepare('SELECT * FROM achievements WHERE fighter_wallet = ?').all(fighter.wallet);
  const referralCount = db.prepare('SELECT COUNT(*) as count FROM fighters WHERE referrer = ?').get(fighter.wallet)?.count || 0;

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

// GET /fighters/:wallet
router.get('/:wallet', (req, res) => {
  const fighter = getFighterWithDecay(req.params.wallet.toLowerCase());
  if (!fighter) return res.status(404).json({ error: 'Fighter not found' });
  res.json(enrichFighter(fighter));
});

// POST /fighters/create
router.post('/create', (req, res) => {
  const { wallet, referrer } = req.body;
  if (!wallet) return res.status(400).json({ error: 'Wallet required' });

  const w = wallet.toLowerCase();

  const existing = db.prepare('SELECT wallet FROM fighters WHERE wallet = ?').get(w);
  if (existing) {
    const fighter = getFighterWithDecay(w);
    return res.json(enrichFighter(fighter));
  }

  let validReferrer = null;
  if (referrer) {
    const r = referrer.toLowerCase();
    const ref = db.prepare('SELECT wallet FROM fighters WHERE wallet = ?').get(r);
    if (ref && r !== w) validReferrer = r;
  }

  const baseAttack = 5 + Math.floor(Math.random() * 11);
  const baseDefense = 5 + Math.floor(Math.random() * 11);
  const baseSpeed = 5 + Math.floor(Math.random() * 11);
  const baseLuck = 5 + Math.floor(Math.random() * 11);
  const avatarSeed = Math.floor(Math.random() * 1000000);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO fighters (wallet, level, xp, base_attack, base_defense, base_speed, base_luck, elo, wins, losses, winstreak, last_active, referrer, created_at, avatar_seed)
    VALUES (?, 1, 0, ?, ?, ?, ?, 1000, 0, 0, 0, ?, ?, ?, ?)
  `).run(w, baseAttack, baseDefense, baseSpeed, baseLuck, now, validReferrer, now, avatarSeed);

  const fighter = getFighterWithDecay(w);
  res.status(201).json(enrichFighter(fighter));
});

// GET /fighters - list all fighters
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const league = req.query.league;

  let query = 'SELECT * FROM fighters';
  const params = [];
  if (league) {
    query += ' WHERE wallet IN (SELECT wallet FROM fighters)'; // we filter in JS
  }
  query += ' ORDER BY elo DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  let fighters = db.prepare(query).all(...params);

  if (league) {
    fighters = fighters.filter(f => getLeague(f.elo) === league);
  }

  const total = db.prepare('SELECT COUNT(*) as count FROM fighters').get().count;

  res.json({
    fighters: fighters.map(f => enrichFighter(f)),
    total,
    limit,
    offset
  });
});

module.exports = router;
module.exports.getFighterWithDecay = getFighterWithDecay;
module.exports.enrichFighter = enrichFighter;
