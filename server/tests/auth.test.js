const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

// Load env before tests
require('dotenv').config();

// We test against a real DB connection (Atlas)
// In a larger project you'd use an in-memory MongoDB (mongodb-memory-server)
// For this assessment, real DB is fine

let token;
let testEmail;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  // Use a unique email each run so tests don't conflict
  testEmail = `testuser_${Date.now()}@example.com`;
});

afterAll(async () => {
  // Clean up test user
  await mongoose.connection.collection('users').deleteMany({ email: testEmail });
  await mongoose.connection.close();
});

describe('Auth API', () => {
  // ---- REGISTER ----
  describe('POST /api/auth/register', () => {
    it('should register a new user and return token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Jest Tester',
        email: testEmail,
        password: 'test1234',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.password).toBeUndefined(); // password must never be returned

      token = res.body.token; // save for later tests
    });

    it('should fail with 409 if email already exists', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Jest Tester',
        email: testEmail,
        password: 'test1234',
      });
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should fail with 400 if required fields missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'missing@name.com',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ---- LOGIN ----
  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'test1234',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should fail with 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'wrongpassword',
      });
      expect(res.statusCode).toBe(401);
    });

    it('should fail with 401 for non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@nowhere.com',
        password: 'test1234',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ---- GET ME ----
  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe(testEmail);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.statusCode).toBe(401);
    });
  });
});
