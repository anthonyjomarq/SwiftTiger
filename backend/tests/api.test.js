/**
 * SwiftTiger Backend API Tests
 * Comprehensive test suite for all API endpoints
 */

const request = require('supertest');
const { app, server } = require('../server');
const { pool } = require('../database');

// Test configuration
const testUser = {
  email: 'test@swifttiger.com',
  password: 'testpass123',
  name: 'Test User',
  role: 'admin'
};

const testTechnician = {
  email: 'tech@swifttiger.com',
  password: 'techpass123',
  name: 'Test Technician',
  role: 'technician'
};

let adminToken = '';
let techToken = '';
let testJobId = '';
let testCustomerId = '';

describe('SwiftTiger API Tests', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await pool.query('DELETE FROM users WHERE email LIKE \'%@swifttiger.com\'');
      await pool.query('DELETE FROM jobs WHERE title LIKE \'Test Job%\'');
      await pool.end();
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
    
    if (server && server.listening) {
      server.close();
    }
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register - Register admin user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);
      adminToken = response.body.data.token;
    });

    test('POST /api/auth/register - Register technician user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testTechnician)
        .expect(201);

      expect(response.body.success).toBe(true);
      techToken = response.body.data.token;
    });

    test('POST /api/auth/login - Login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    test('POST /api/auth/login - Fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/auth/profile - Get user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });
  });

  describe('User Management Endpoints', () => {
    test('GET /api/users - Get all users (admin)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/users - Forbidden for non-admin', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${techToken}`)
        .expect(403);
    });
  });

  describe('Job Management Endpoints', () => {
    test('POST /api/jobs - Create new job', async () => {
      const jobData = {
        title: 'Test Job - API Test',
        description: 'Test job description',
        address: '123 Test St, Test City, TS 12345',
        priority: 'normal',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '10:00',
        estimated_duration: 120,
        price: 150.00
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(jobData.title);
      testJobId = response.body.data.id;
    });

    test('GET /api/jobs - Get all jobs', async () => {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/jobs/:id - Get specific job', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testJobId);
    });

    test('PUT /api/jobs/:id - Update job', async () => {
      const updateData = {
        title: 'Updated Test Job',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
    });
  });

  describe('Admin Dashboard Endpoints', () => {
    test('GET /api/admin/dashboard/stats - Get dashboard stats', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('totalJobs');
    });

    test('GET /api/admin/analytics - Get analytics data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('revenue');
      expect(response.body.data).toHaveProperty('jobs');
    });

    test('GET /api/admin/settings - Get admin settings', async () => {
      const response = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('company');
      expect(response.body.data).toHaveProperty('operational');
    });

    test('PUT /api/admin/settings - Update settings', async () => {
      const settingsUpdate = {
        category: 'company',
        settings: {
          name: 'Updated Company Name',
          phone: '(555) 999-8888'
        }
      };

      const response = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(settingsUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /api/admin/reports/financial - Get financial report', async () => {
      const response = await request(app)
        .get('/api/admin/reports/financial')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('revenue');
      expect(response.body.data).toHaveProperty('expenses');
    });

    test('GET /api/admin/system/health - Get system health', async () => {
      const response = await request(app)
        .get('/api/admin/system/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('database');
    });
  });

  describe('Route Optimization Endpoints', () => {
    test('GET /api/routes - Get routes', async () => {
      const response = await request(app)
        .get('/api/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /api/routes/optimize - Optimize routes', async () => {
      const optimizeData = {
        date: new Date().toISOString().split('T')[0],
        options: {
          prioritizeSkills: true,
          minimizeFuelCost: true
        }
      };

      const response = await request(app)
        .post('/api/routes/optimize')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(optimizeData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Support Ticket Endpoints', () => {
    test('GET /api/support/tickets - Get support tickets', async () => {
      const response = await request(app)
        .get('/api/support/tickets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent - 404 for non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    test('GET /api/jobs - 401 without token', async () => {
      await request(app)
        .get('/api/jobs')
        .expect(401);
    });

    test('GET /api/admin/settings - 403 without admin permissions', async () => {
      await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${techToken}`)
        .expect(403);
    });
  });
});

// Helper function to check if server is running
async function checkServerHealth() {
  try {
    const response = await request(app).get('/api/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

module.exports = { checkServerHealth };