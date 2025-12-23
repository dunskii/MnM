// ===========================================
// Authentication Integration Tests
// ===========================================

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Create test app
const createTestApp = () => {
  // Import after setting env vars
  const app = express();
  app.use(express.json());

  // Import routes after app setup
  const routes = require('../../src/routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  app.use('/api/v1', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

// Test database client
const prisma = new PrismaClient();

// Test data
const TEST_SCHOOL = {
  name: 'Test School',
  slug: 'test-school',
  email: 'test@testschool.com',
};

const TEST_USER = {
  email: 'testuser@testschool.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

describe('Authentication API', () => {
  let schoolId: string;
  let userId: string;

  beforeAll(async () => {
    // Clear any existing login attempts to prevent rate limiting
    await prisma.loginAttempt.deleteMany({});

    // Create test school
    const school = await prisma.school.create({
      data: TEST_SCHOOL,
    });
    schoolId = school.id;

    // Create test user
    const passwordHash = await bcrypt.hash(TEST_USER.password, 10);
    const user = await prisma.user.create({
      data: {
        schoolId,
        email: TEST_USER.email,
        passwordHash,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        role: 'ADMIN',
        emailVerified: true,
        passwordHistory: JSON.stringify([passwordHash]),
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.loginAttempt.deleteMany({ where: { userId } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { schoolId } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    const app = createTestApp();

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
          schoolSlug: TEST_SCHOOL.slug,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(TEST_USER.email);
      expect(response.body.data.user.role).toBe('ADMIN');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'WrongPassword123!',
          schoolSlug: TEST_SCHOOL.slug,
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password.');
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@testschool.com',
          password: TEST_USER.password,
          schoolSlug: TEST_SCHOOL.slug,
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password.');
    });

    it('should reject non-existent school', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
          schoolSlug: 'nonexistent-school',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password.');
    });

    it('should require email validation', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: TEST_USER.password,
        });

      expect(response.status).toBe(400);
    });

    it('should require password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    const app = createTestApp();
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
          schoolSlug: TEST_SCHOOL.slug,
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      // Token should be rotated (different from original)
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });

    it('should reject used refresh token (rotation)', async () => {
      // Use the refresh token once
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      // Try to use the same token again
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    const app = createTestApp();
    let accessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
          schoolSlug: TEST_SCHOOL.slug,
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe(TEST_USER.email);
      expect(response.body.data.user.firstName).toBe(TEST_USER.firstName);
      expect(response.body.data.user.lastName).toBe(TEST_USER.lastName);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    const app = createTestApp();
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
          schoolSlug: TEST_SCHOOL.slug,
        });

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should logout and invalidate refresh token', async () => {
      // Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutResponse.status).toBe(200);

      // Try to use the refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });

  describe('Multi-tenancy Security', () => {
    const app = createTestApp();
    const testId = Date.now().toString();
    let otherSchoolId: string;
    const otherSchoolSlug = `auth-other-school-${testId}`;

    beforeAll(async () => {
      // Create another school with same email user
      const otherSchool = await prisma.school.create({
        data: {
          name: 'Auth Other School',
          slug: otherSchoolSlug,
          email: `auth-other-${testId}@otherschool.com`,
        },
      });
      otherSchoolId = otherSchool.id;

      const passwordHash = await bcrypt.hash('OtherPassword123!', 10);
      await prisma.user.create({
        data: {
          schoolId: otherSchoolId,
          email: TEST_USER.email, // Same email, different school
          passwordHash,
          firstName: 'Other',
          lastName: 'User',
          role: 'PARENT',
          emailVerified: true,
          passwordHistory: JSON.stringify([passwordHash]),
        },
      });
    });

    afterAll(async () => {
      await prisma.refreshToken.deleteMany({ where: { user: { schoolId: otherSchoolId } } });
      await prisma.loginAttempt.deleteMany({ where: { user: { schoolId: otherSchoolId } } });
      await prisma.user.deleteMany({ where: { schoolId: otherSchoolId } });
      await prisma.school.deleteMany({ where: { id: otherSchoolId } });
    });

    it('should require school slug when email exists in multiple schools', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
          // No schoolSlug - should require disambiguation
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('multiple schools');
    });

    it('should login to correct school with school slug', async () => {
      // Login to first school
      const response1 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
          schoolSlug: TEST_SCHOOL.slug,
        });

      expect(response1.status).toBe(200);
      expect(response1.body.data.user.schoolName).toBe(TEST_SCHOOL.name);

      // Login to other school
      const response2 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'OtherPassword123!',
          schoolSlug: otherSchoolSlug,
        });

      expect(response2.status).toBe(200);
      expect(response2.body.data.user.schoolName).toBe('Auth Other School');
    });

    it('should not allow cross-school password', async () => {
      // Try to login to other school with first school's password
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password, // Wrong password for other school
          schoolSlug: otherSchoolSlug,
        });

      expect(response.status).toBe(401);
    });
  });
});
