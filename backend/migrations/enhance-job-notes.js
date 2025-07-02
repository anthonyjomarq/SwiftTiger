const { pool } = require('../database');

async function enhanceJobNotes() {
  console.log('Enhancing job notes/comments system...');
  
  try {
    await pool.query('BEGIN');
    
    // Add new columns to job_updates table for enhanced notes functionality
    await pool.query(`
      ALTER TABLE job_updates 
      ADD COLUMN IF NOT EXISTS note_type VARCHAR(50) DEFAULT 'general' 
        CHECK (note_type IN ('general', 'technical', 'customer', 'internal', 'status_change')),
      ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS edited_by INTEGER REFERENCES users(id)
    `);
    
    // Create index for better performance on job notes queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_job_updates_job_id_created 
      ON job_updates(job_id, created_at DESC)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_job_updates_pinned 
      ON job_updates(job_id) WHERE is_pinned = true
    `);
    
    // Update existing records to use the new note_type system
    await pool.query(`
      UPDATE job_updates 
      SET note_type = CASE 
        WHEN update_type = 'status_change' THEN 'status_change'
        WHEN update_type = 'assignment' THEN 'internal'
        ELSE 'general'
      END
      WHERE note_type IS NULL
    `);
    
    await pool.query('COMMIT');
    console.log('Job notes enhancement completed successfully');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error enhancing job notes:', error);
    throw error;
  }
}

module.exports = { enhanceJobNotes };

if (require.main === module) {
  enhanceJobNotes()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}