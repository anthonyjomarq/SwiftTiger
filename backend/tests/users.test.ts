import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

describe('User Routes', () => {
  let adminToken: string;
  let regularToken: string;
  let adminUser: any;
  let regularUser: any;

  beforeEach(async () => {
    // Create admin user
    const adminHashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminHashedPassword,
      role: 'admin',
      isActive: true,
      isMainAdmin: true
    });

    // Create regular user
    const regularHashedPassword = await bcrypt.hash('user123', 10);
    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: regularHashedPassword,
      role: 'technician',
      isActive: true,
      isMainAdmin: false
    });

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'user123' });
    regularToken = userLogin.body.token;
  });

  describe('GET /api/users', () => {
    it('should allow admin to get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    const newUserData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'newuser123',
      role: 'technician'
    };

    it('should allow admin to create new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(newUserData.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(newUserData);

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete User'
          // Missing email, password, role
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should prevent duplicate emails', async () => {
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should allow admin to update user', async () => {
      const updateData = {
        name: 'Updated Name',
        role: 'manager'
      };

      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.role).toBe(updateData.role);
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ name: 'Hacker' });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should allow admin to delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Verify user is deleted
      const getResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const userExists = getResponse.body.some((u: any) => u.id === regularUser.id);
      expect(userExists).toBe(false);
    });

    it('should prevent deletion of main admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('main admin');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });
});