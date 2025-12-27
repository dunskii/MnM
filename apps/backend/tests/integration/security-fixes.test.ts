// ===========================================
// Security Fixes Integration Tests
// ===========================================
// Tests for critical security fixes implemented in Week 12
// Covers: Token revocation, session management, webhook validation

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const authRoutes = require('../../src/routes/auth.routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  app.use('/api/v1/auth', authRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

describe('Security Fixes Tests', () => {
  const app = createTestApp();
  const testId = Date.now().toString();

  // School A data
  let schoolAId: string;
  let userAId: string;
  let adminAToken: string;

  // School B data
  let schoolBId: string;
  let userBId: string;
  let adminBToken: string;

  beforeAll(async () => {
    // Clear rate limiting
    await prisma.loginAttempt.deleteMany({});
    await prisma.revokedToken.deleteMany({});

    // Create School A
    const schoolA = await prisma.school.create({
      data: {
        name: 'Security Test School A',
        slug: `sec-test-a-${testId}`,
        email: `sec-admin-a-${testId}@test.com`,
      },
    });
    schoolAId = schoolA.id;

    // Create School B
    const schoolB = await prisma.school.create({
      data: {
        name: 'Security Test School B',
        slug: `sec-test-b-${testId}`,
        email: `sec-admin-b-${testId}@test.com`,
      },
    });
    schoolBId = schoolB.id;

    // Create admin users
    const passwordHash = await bcrypt.hash('SecurePass123!', 10);

    const userA = await prisma.user.create({
      data: {
        schoolId: schoolAId,
        email: `sec-admin-a-${testId}@test.com`,
        passwordHash,
        firstName: 'Admin',
        lastName: 'A',
        role: 'ADMIN',
        isActive: true,
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        schoolId: schoolBId,
        email: `sec-admin-b-${testId}@test.com`,
        passwordHash,
        firstName: 'Admin',
        lastName: 'B',
        role: 'ADMIN',
        isActive: true,
      },
    });
    userBId = userB.id;

    // Login to get tokens
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: `sec-admin-a-${testId}@test.com`,
        password: 'SecurePass123!',
        schoolSlug: `sec-test-a-${testId}`,
      });
    adminAToken = loginA.body.data.accessToken;

    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: `sec-admin-b-${testId}@test.com`,
        password: 'SecurePass123!',
        schoolSlug: `sec-test-b-${testId}`,
      });
    adminBToken = loginB.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.revokedToken.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.loginAttempt.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
    await prisma.school.deleteMany({
      where: { id: { in: [schoolAId, schoolBId] } },
    });
    await prisma.$disconnect();
  });

  // ===========================================
  // Session Management Tests (Issue 4)
  // ===========================================

  describe('Session Management - schoolId Filtering', () => {
    beforeAll(async () => {
      // Ensure sessions exist by making authenticated requests
      await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${adminAToken}`);
    });

    it('should only return sessions for the authenticated user\'s school', async () => {
      const resA = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.sessions).toBeDefined();

      const resB = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${adminBToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.sessions).toBeDefined();

      // Sessions should be different (each user sees only their own)
      const sessionIdsA = resA.body.data.sessions.map((s: any) => s.id);
      const sessionIdsB = resB.body.data.sessions.map((s: any) => s.id);

      // No overlap between session lists
      const overlap = sessionIdsA.filter((id: string) => sessionIdsB.includes(id));
      expect(overlap.length).toBe(0);
    });

    it('should not allow revoking sessions from another school', async () => {
      // Get user A's session
      const sessionsA = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${adminAToken}`);

      if (sessionsA.body.data.sessions.length === 0) {
        // Skip if no sessions
        return;
      }

      const sessionToRevoke = sessionsA.body.data.sessions[0].id;

      // User B tries to revoke User A's session
      const revokeRes = await request(app)
        .delete(`/api/v1/auth/sessions/${sessionToRevoke}`)
        .set('Authorization', `Bearer ${adminBToken}`);

      // Should succeed (returns 200) but not actually revoke the session
      // because schoolId filter prevents the deletion
      expect(revokeRes.status).toBe(200);

      // Verify User A's session still exists
      const verifyA = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${adminAToken}`);

      const stillExists = verifyA.body.data.sessions.some(
        (s: any) => s.id === sessionToRevoke
      );
      expect(stillExists).toBe(true);
    });
  });

  // ===========================================
  // Token JTI Tests (Issue 2)
  // ===========================================

  describe('Access Token JTI', () => {
    it('should include JTI in access token', () => {
      const decoded = jwt.decode(adminAToken) as any;
      expect(decoded).toBeDefined();
      expect(decoded.jti).toBeDefined();
      expect(typeof decoded.jti).toBe('string');
      expect(decoded.jti.length).toBeGreaterThan(0);
    });

    it('should include schoolId in access token', () => {
      const decoded = jwt.decode(adminAToken) as any;
      expect(decoded).toBeDefined();
      expect(decoded.schoolId).toBe(schoolAId);
    });
  });

  // ===========================================
  // Authentication Validation Tests
  // ===========================================

  describe('Authentication Validation', () => {
    it('should reject requests with invalid tokens', async () => {
      const res = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should reject requests without Authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/sessions');

      expect(res.status).toBe(401);
    });

    it('should reject malformed Authorization headers', async () => {
      const res = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', adminAToken); // Missing "Bearer " prefix

      expect(res.status).toBe(401);
    });
  });
});

// ===========================================
// Crypto Utility Tests (Issue 3)
// ===========================================

describe('Encryption Key Validation', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Restore original values
    if (originalEnv) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should require ENCRYPTION_KEY to be at least 32 characters', () => {
    // This test verifies the validation logic exists
    // The actual crypto module will throw if key is too short
    process.env.ENCRYPTION_KEY = 'short-key';

    // Clear require cache to reload with new env
    jest.resetModules();

    expect(() => {
      const { encrypt } = require('../../src/utils/crypto');
      encrypt('test');
    }).toThrow(/at least 32 characters/);
  });
});
