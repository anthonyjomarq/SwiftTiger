const { pool } = require('../database');

async function enhanceJobWorkflow() {
  console.log('Enhancing job workflow system...');
  
  try {
    await pool.query('BEGIN');
    
    // Add workflow tracking fields to jobs table
    await pool.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS actual_duration INTEGER,
      ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS status_changed_by INTEGER REFERENCES users(id)
    `);
    
    // Create job status history table for detailed workflow tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_status_history (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        from_status VARCHAR(50),
        to_status VARCHAR(50) NOT NULL,
        changed_by INTEGER REFERENCES users(id),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration_in_status INTEGER, -- minutes spent in previous status
        comment TEXT,
        is_automated BOOLEAN DEFAULT false,
        metadata JSONB DEFAULT '{}'
      )
    `);
    
    // Create workflow rules table for dynamic business rules
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_rules (
        id SERIAL PRIMARY KEY,
        rule_name VARCHAR(100) UNIQUE NOT NULL,
        from_status VARCHAR(50),
        to_status VARCHAR(50) NOT NULL,
        requires_comment BOOLEAN DEFAULT false,
        requires_assignment BOOLEAN DEFAULT false,
        allowed_roles JSONB DEFAULT '[]',
        conditions JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_job_status_history_job_id 
      ON job_status_history(job_id, changed_at DESC)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_job_status_history_status 
      ON job_status_history(to_status, changed_at DESC)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_workflow_rules_status 
      ON workflow_rules(from_status, to_status) WHERE is_active = true
    `);
    
    // Insert default workflow rules
    await pool.query(`
      INSERT INTO workflow_rules (rule_name, from_status, to_status, requires_comment, requires_assignment, allowed_roles)
      VALUES 
        ('start_job', 'pending', 'in_progress', false, true, '["technician", "dispatcher", "manager", "admin"]'),
        ('complete_job', 'in_progress', 'completed', true, true, '["technician", "dispatcher", "manager", "admin"]'),
        ('cancel_job', null, 'cancelled', true, false, '["dispatcher", "manager", "admin"]'),
        ('hold_job', null, 'on_hold', true, false, '["technician", "dispatcher", "manager", "admin"]'),
        ('reopen_job', 'completed', 'in_progress', true, false, '["manager", "admin"]')
      ON CONFLICT (rule_name) DO NOTHING
    `);
    
    // Update existing jobs to have proper status tracking
    await pool.query(`
      UPDATE jobs 
      SET status_changed_at = COALESCE(last_activity, created_at)
      WHERE status_changed_at IS NULL
    `);
    
    await pool.query('COMMIT');
    console.log('Job workflow enhancement completed successfully');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error enhancing job workflow:', error);
    throw error;
  }
}

module.exports = { enhanceJobWorkflow };

if (require.main === module) {
  enhanceJobWorkflow()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}