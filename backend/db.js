const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'brawl.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS fighters (
    wallet TEXT PRIMARY KEY,
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
    created_at TEXT,
    avatar_seed INTEGER
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    fighter_wallet TEXT,
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
    unique_effect TEXT,
    FOREIGN KEY (fighter_wallet) REFERENCES fighters(wallet)
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
    fighter_wallet TEXT,
    achievement_id TEXT,
    earned_at TEXT,
    PRIMARY KEY (fighter_wallet, achievement_id)
  );
`);

module.exports = db;
