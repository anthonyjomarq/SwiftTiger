const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('User Management Endpoints', () => {
  let adminToken;
  let technicianToken;
  let adminUserId;

  beforeEach(async () => {
    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'AdminPass123!',
      role: 'admin',
      isMainAdmin: true,
      isActive: true
    });
    adminUserId = adminUser.id;

    // Create technician user
    await User.create({
      name: 'Tech User',
      email: 'tech@example.com',
      password: 'TechPass123!',
      role: 'technician',
      isActive: true
    });

    // Get admin token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!'
      });
    adminToken = adminLoginRes.body.token;

    // Get technician token
    const techLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'tech@example.com',
        password: 'TechPass123!'
      });
    technicianToken = techLoginRes.body.token;
  });

  describe('GET /api/users', () => {
    it('should allow admin to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).not.toHaveProperty('password');
    });

    it('should reject technician access', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Access denied. Insufficient permissions.');
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    it('should allow admin to create new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'NewUserPass123!',
        role: 'dispatcher'
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe(newUser.name);
      expect(res.body.email).toBe('newuser@example.com');
      expect(res.body.role).toBe(newUser.role);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User'
          // Missing email, password, role
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Validation failed');
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'TestPass123!',
          role: 'technician'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Validation failed');
    });

    it('should validate password strength', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak',
          role: 'technician'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Validation failed');
    });

    it('should prevent duplicate email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'admin@example.com', // Already exists
          password: 'TestPass123!',
          role: 'technician'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'User with this email already exists');
    });

    it('should reject technician access', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPass123!',
          role: 'technician'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    let userToUpdate;

    beforeEach(async () => {
      userToUpdate = await User.create({
        name: 'Update User',
        email: 'update@example.com',
        password: 'UpdatePass123!',
        role: 'technician',
        isActive: true,
        createdBy: adminUserId
      });
    });

    it('should allow admin to update user', async () => {
      const updates = {
        name: 'Updated Name',
        role: 'manager'
      };

      const res = await request(app)
        .put(`/api/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe(updates.name);
      expect(res.body.role).toBe(updates.role);
    });

    it('should prevent main admin deactivation', async () => {
      const res = await request(app)
        .put(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Cannot deactivate main admin');
    });

    it('should reject technician access', async () => {
      const res = await request(app)
        .put(`/api/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ name: 'New Name' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let userToDelete;

    beforeEach(async () => {
      userToDelete = await User.create({
        name: 'Delete User',
        email: 'delete@example.com',
        password: 'DeletePass123!',
        role: 'technician',
        isActive: true,
        createdBy: adminUserId
      });
    });

    it('should allow main admin to delete user', async () => {
      const res = await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'User deactivated successfully');

      // Verify user was soft deleted
      const deletedUser = await User.findByPk(userToDelete.id);
      expect(deletedUser.isActive).toBe(false);
    });

    it('should prevent main admin deletion', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Cannot delete main admin');
    });

    it('should reject technician access', async () => {
      const res = await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});