import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import bcrypt from 'bcryptjs';

describe('Customer Routes', () => {
  let userToken: string;
  let testUser: any;
  let testCustomer: any;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'dispatcher',
      isActive: true,
      isMainAdmin: false
    });

    // Get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    userToken = loginResponse.body.token;

    // Create test customer
    testCustomer = await Customer.create({
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '555-0123',
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'TC',
        zipCode: '12345',
        country: 'USA'
      },
      isActive: true
    });
  });

  describe('GET /api/customers', () => {
    it('should return all active customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
    });

    it('should support search query', async () => {
      const response = await request(app)
        .get('/api/customers?search=Test Customer')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toContain('Test Customer');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/customers', () => {
    const newCustomerData = {
      name: 'New Customer',
      email: 'new@example.com',
      phone: '555-0456',
      address: {
        street: '456 Oak Ave',
        city: 'New City',
        state: 'NC',
        zipCode: '67890',
        country: 'USA'
      }
    };

    it('should create new customer with valid data', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newCustomerData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newCustomerData.name);
      expect(response.body.email).toBe(newCustomerData.email);
      expect(response.body.isActive).toBe(true);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Incomplete Customer'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...newCustomerData,
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send(newCustomerData);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/customers/:id', () => {
    const updateData = {
      name: 'Updated Customer Name',
      phone: '555-9999'
    };

    it('should update customer with valid data', async () => {
      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.phone).toBe(updateData.phone);
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .put('/api/customers/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/customers/${testCustomer.id}`)
        .send(updateData);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should soft delete customer (set isActive to false)', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomer.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);

      // Verify customer is soft deleted (not in active list)
      const getResponse = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${userToken}`);
      
      const customerExists = getResponse.body.some((c: any) => c.id === testCustomer.id);
      expect(customerExists).toBe(false);
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .delete('/api/customers/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomer.id}`);

      expect(response.status).toBe(401);
    });
  });
});