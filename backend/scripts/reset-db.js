/**
 * Database Reset Script
 * WARNING: This will DELETE ALL DATA!
 * Use only before production launch.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetDatabase() {
  try {
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('Starting in 3 seconds... (Ctrl+C to cancel)');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🗑️  Deleting all data...\n');
    
    // Delete in correct order (respecting foreign keys)
    await pool.query('DELETE FROM queue');
    console.log('✅ Queue cleared');
    
    await pool.query('DELETE FROM battles');
    console.log('✅ Battles cleared');
    
    await pool.query('DELETE FROM achievements');
    console.log('✅ Achievements cleared');
    
    await pool.query('DELETE FROM equipment');
    console.log('✅ Equipment cleared');
    
    await pool.query('DELETE FROM fighters');
    console.log('✅ Fighters cleared');
    
    await pool.query('DELETE FROM agents');
    console.log('✅ Agents cleared');
    
    // Reset sequences if using SERIAL
    await pool.query('ALTER SEQUENCE IF EXISTS equipment_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS battles_id_seq RESTART WITH 1');
    console.log('✅ Sequences reset');
    
    console.log('\n🎉 Database reset complete! Ready for production launch.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
