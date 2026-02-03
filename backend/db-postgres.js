const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('🐘 Using PostgreSQL database');

// Initialize schema
async function initSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fighters (
        agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
        name TEXT,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        base_attack INTEGER,
        base_defense INTEGER,
        base_speed INTEGER,
        base_luck INTEGER,
        elo INTEGER DEFAULT 1000,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        winstreak INTEGER DEFAULT 0,
        last_active TEXT,
        referrer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        avatar_seed INTEGER
      );

      CREATE TABLE IF NOT EXISTS equipment (
        id TEXT PRIMARY KEY,
        fighter_id TEXT REFERENCES fighters(agent_id) ON DELETE CASCADE,
        slot TEXT,
        name TEXT,
        rarity TEXT,
        attack_bonus INTEGER DEFAULT 0,
        defense_bonus INTEGER DEFAULT 0,
        speed_bonus INTEGER DEFAULT 0,
        luck_bonus INTEGER DEFAULT 0,
        xp_bonus_percent INTEGER DEFAULT 0,
        crit_chance INTEGER DEFAULT 0,
        dodge_chance INTEGER DEFAULT 0,
        damage_reduction INTEGER DEFAULT 0,
        passive TEXT,
        unique_effect TEXT
      );

      CREATE TABLE IF NOT EXISTS battles (
        id TEXT PRIMARY KEY,
        challenger TEXT,
        defender TEXT,
        winner TEXT,
        loser TEXT,
        elo_winner INTEGER,
        elo_loser INTEGER,
        rounds TEXT,
        loot TEXT,
        xp_winner INTEGER,
        xp_loser INTEGER,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS achievements (
        fighter_id TEXT,
        achievement_id TEXT,
        earned_at TEXT,
        PRIMARY KEY (fighter_id, achievement_id)
      );

      CREATE TABLE IF NOT EXISTS queue (
        id TEXT PRIMARY KEY,
        fighter_id TEXT REFERENCES fighters(agent_id) ON DELETE CASCADE,
        min_elo INTEGER,
        max_elo INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_fighters_elo ON fighters(elo DESC);
      CREATE INDEX IF NOT EXISTS idx_battles_created ON battles(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_equipment_fighter ON equipment(fighter_id);
      CREATE INDEX IF NOT EXISTS idx_queue_expires ON queue(expires_at);
    `);
    
    console.log('✅ PostgreSQL schema initialized');
  } catch (error) {
    console.error('❌ PostgreSQL schema initialization failed:', error);
    throw error;
  }
}

// Synchronous-style wrapper to match better-sqlite3 API
// Uses blocking operations (OK for MVP, should be made async later)
const db = {
  prepare: (sql) => {
    // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
    let pgSql = sql;
    let paramCount = 0;
    pgSql = pgSql.replace(/\?/g, () => `$${++paramCount}`);
    
    return {
      run: (...params) => {
        try {
          const result = pool.query(pgSql, params);
          // Block until promise resolves (sync wrapper)
          let done = false;
          let res;
          result.then(r => { res = r; done = true; }).catch(e => { res = { error: e }; done = true; });
          const deasync = require('deasync');
          deasync.loopWhile(() => !done);
          if (res.error) throw res.error;
          return { changes: res.rowCount || 0 };
        } catch (error) {
          console.error('PostgreSQL run error:', error);
          throw error;
        }
      },
      get: (...params) => {
        try {
          const result = pool.query(pgSql, params);
          let done = false;
          let res;
          result.then(r => { res = r; done = true; }).catch(e => { res = { error: e }; done = true; });
          const deasync = require('deasync');
          deasync.loopWhile(() => !done);
          if (res.error) throw res.error;
          return res.rows[0];
        } catch (error) {
          console.error('PostgreSQL get error:', error);
          throw error;
        }
      },
      all: (...params) => {
        try {
          const result = pool.query(pgSql, params);
          let done = false;
          let res;
          result.then(r => { res = r; done = true; }).catch(e => { res = { error: e }; done = true; });
          const deasync = require('deasync');
          deasync.loopWhile(() => !done);
          if (res.error) throw res.error;
          return res.rows;
        } catch (error) {
          console.error('PostgreSQL all error:', error);
          throw error;
        }
      }
    };
  },
  exec: (sql) => {
    try {
      const result = pool.query(sql);
      let done = false;
      let res;
      result.then(r => { res = r; done = true; }).catch(e => { res = { error: e }; done = true; });
      const deasync = require('deasync');
      deasync.loopWhile(() => !done);
      if (res.error) throw res.error;
    } catch (error) {
      console.error('PostgreSQL exec error:', error);
      throw error;
    }
  }
};

// Initialize schema on import
initSchema().catch(console.error);

module.exports = db;
