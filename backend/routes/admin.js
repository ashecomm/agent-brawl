const express = require('express');
const router = express.Router();

// TEMPORARY ADMIN ENDPOINT - DELETE AFTER LAUNCH!
// Simple secret key protection
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'temp_reset_key_delete_me';

// Reset database (DELETE ALL DATA)
router.post('/reset-database', async (req, res) => {
  const { secret } = req.body;
  
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    // If PostgreSQL, use async
    if (process.env.DATABASE_URL) {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      await pool.query('DELETE FROM queue');
      await pool.query('DELETE FROM battles');
      await pool.query('DELETE FROM achievements');
      await pool.query('DELETE FROM equipment');
      await pool.query('DELETE FROM fighters');
      await pool.query('DELETE FROM agents');
      
      // Reset sequences
      await pool.query('ALTER SEQUENCE IF EXISTS equipment_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE IF EXISTS battles_id_seq RESTART WITH 1');
      
      await pool.end();
      
      return res.json({ 
        success: true, 
        message: 'Database reset complete',
        tables_cleared: ['queue', 'battles', 'achievements', 'equipment', 'fighters', 'agents']
      });
    } else {
      // SQLite fallback
      const db = require('../db');
      db.prepare('DELETE FROM queue').run();
      db.prepare('DELETE FROM battles').run();
      db.prepare('DELETE FROM achievements').run();
      db.prepare('DELETE FROM equipment').run();
      db.prepare('DELETE FROM fighters').run();
      db.prepare('DELETE FROM agents').run();
      
      return res.json({ 
        success: true, 
        message: 'Database reset complete (SQLite)',
        tables_cleared: ['queue', 'battles', 'achievements', 'equipment', 'fighters', 'agents']
      });
    }
  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({ error: 'Reset failed', details: error.message });
  }
});

module.exports = router;
