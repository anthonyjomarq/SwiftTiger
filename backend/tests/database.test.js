/**
 * Database Connection and Schema Tests
 */

const { pool } = require('../database');

describe('Database Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('Database connection is working', async () => {
    const result = await pool.query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
  });

  test('Users table exists and has correct structure', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    
    const columns = result.rows.map(row => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('email');
    expect(columns).toContain('password');
    expect(columns).toContain('name');
    expect(columns).toContain('role');
  });

  test('Jobs table exists and has correct structure', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      ORDER BY ordinal_position
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    
    const columns = result.rows.map(row => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('title');
    expect(columns).toContain('description');
    expect(columns).toContain('status');
    expect(columns).toContain('priority');
  });

  test('Route assignments table exists', async () => {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'route_assignments'
    `);
    
    expect(result.rows.length).toBe(1);
  });

  test('Support tickets table exists', async () => {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'support_tickets'
    `);
    
    expect(result.rows.length).toBe(1);
  });

  test('Database foreign key constraints are working', async () => {
    // Test that foreign key constraints exist
    const result = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY'
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
  });

  test('Can insert and retrieve test data', async () => {
    // Insert test user
    const userResult = await pool.query(`
      INSERT INTO users (email, password, name, role) 
      VALUES ('dbtest@test.com', 'hashedpassword', 'DB Test User', 'customer')
      RETURNING id, email, name
    `);
    
    expect(userResult.rows[0].email).toBe('dbtest@test.com');
    const userId = userResult.rows[0].id;
    
    // Insert test job
    const jobResult = await pool.query(`
      INSERT INTO jobs (title, description, customer_id, status, priority) 
      VALUES ('DB Test Job', 'Test job description', $1, 'pending', 'normal')
      RETURNING id, title
    `, [userId]);
    
    expect(jobResult.rows[0].title).toBe('DB Test Job');
    
    // Cleanup test data
    await pool.query('DELETE FROM jobs WHERE id = $1', [jobResult.rows[0].id]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  });
});