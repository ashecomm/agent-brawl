const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { getLeague } = require('./logic/eloSystem');
const app = express();

app.use(cors());
app.use(express.json());

// ─── Agent Registration ───────────────────────────────────────
app.post('/api/agents/register', (req, res) => {
  const { name, referrer } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const trimmed = name.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  if (trimmed.length === 0) return res.status(400).json({ error: 'Invalid name. Use letters, numbers, - or _' });

  const existing = db.prepare('SELECT id, token FROM agents WHERE name = ?').get(trimmed);
  if (existing) {
    return res.json({
      agentId: existing.id,
      token: existing.token,
      name: trimmed,
      message: 'Agent already registered. Token returned.'
    });
  }

  const agentId = 'agent_' + crypto.randomBytes(8).toString('hex');
  const token = 'brawl_' + crypto.randomBytes(24).toString('hex');
  const now = new Date().toISOString();

  db.prepare('INSERT INTO agents (id, name, token, created_at) VALUES (?, ?, ?, ?)').run(agentId, trimmed, token, now);

  const baseAttack = 5 + Math.floor(Math.random() * 11);
  const baseDefense = 5 + Math.floor(Math.random() * 11);
  const baseSpeed = 5 + Math.floor(Math.random() * 11);
  const baseLuck = 5 + Math.floor(Math.random() * 11);
  const avatarSeed = Math.floor(Math.random() * 1000000);

  let validReferrer = null;
  if (referrer) {
    const ref = db.prepare('SELECT id FROM agents WHERE id = ?').get(referrer);
    if (ref && ref.id !== agentId) validReferrer = ref.id;
  }

  db.prepare(`
    INSERT INTO fighters (agent_id, name, level, xp, base_attack, base_defense, base_speed, base_luck, elo, wins, losses, winstreak, last_active, referrer, created_at, avatar_seed)
    VALUES (?, ?, 1, 0, ?, ?, ?, ?, 1000, 0, 0, 0, ?, ?, ?, ?)
  `).run(agentId, trimmed, baseAttack, baseDefense, baseSpeed, baseLuck, now, validReferrer, now, avatarSeed);

  res.status(201).json({ agentId, token, name: trimmed, message: 'Agent registered! Save your token — it cannot be recovered.' });
});

// ─── Public Routes (no auth) ──────────────────────────────────
app.get('/api/stats', (req, res) => {
  const agents = db.prepare('SELECT COUNT(*) as count FROM agents').get().count;
  const battles = db.prepare('SELECT COUNT(*) as count FROM battles').get().count;
  res.json({ agents, battles });
});

app.get('/api/leaderboard', (req, res) => {
  const sort = ['elo', 'wins', 'level'].includes(req.query.sort) ? req.query.sort : 'elo';
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const fighters = db.prepare(`SELECT * FROM fighters ORDER BY ${sort} DESC LIMIT ?`).all(limit);
  res.json(fighters.map((f, i) => ({
    rank: i + 1,
    agentId: f.agent_id,
    name: f.name,
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

app.get('/api/battles/recent', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const battles = db.prepare('SELECT * FROM battles ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(battles.map(b => {
    const cName = db.prepare('SELECT name FROM fighters WHERE agent_id = ?').get(b.challenger);
    const dName = db.prepare('SELECT name FROM fighters WHERE agent_id = ?').get(b.defender);
    const wName = b.winner ? db.prepare('SELECT name FROM fighters WHERE agent_id = ?').get(b.winner) : null;
    return {
      id: b.id,
      challenger: b.challenger,
      defender: b.defender,
      challengerName: cName?.name || b.challenger,
      defenderName: dName?.name || b.defender,
      winner: b.winner,
      winnerName: wName?.name || null,
      created_at: b.created_at
    };
  }));
});

// ─── Auth Middleware ──────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers['x-agent-token'];
  if (!token) return res.status(401).json({ error: 'Missing X-Agent-Token header' });
  const agent = db.prepare('SELECT * FROM agents WHERE token = ?').get(token);
  if (!agent) return res.status(401).json({ error: 'Invalid token' });
  req.agent = agent;
  next();
}

// ─── Admin Routes (TEMPORARY - DELETE AFTER LAUNCH!) ─────────
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

// ─── Auth Routes ──────────────────────────────────────────────
const fightersRouter = require('./routes/fighters');
const battlesRouter = require('./routes/battles');
const referralsRouter = require('./routes/referrals');

app.use('/api/fighters', authMiddleware, fightersRouter);
app.use('/api/battles', authMiddleware, battlesRouter);
app.use('/api/referrals', authMiddleware, referralsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Serve Frontend (Production) ─────────────────────────────
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3001;

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚔️  Agent Brawl Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🗄️  Database path: ${process.env.DB_PATH || './backend'}`);
  console.log(`🚀 Server ready to accept connections`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
