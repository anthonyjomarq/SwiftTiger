const { pool } = require("../database");

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Add email_verified column to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE
    `);

    // Create user_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(64) UNIQUE NOT NULL,
        refresh_token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_activity TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      )
    `);

    // Create password_resets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Create email_verifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        verified_at TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Create activity_log table for session tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id INTEGER,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at)
    `);

    await client.query("COMMIT");
    console.log("✅ Auth enhancements migration completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Auth enhancements migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrate };
