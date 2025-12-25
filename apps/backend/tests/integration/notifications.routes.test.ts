// ===========================================
// Notifications Routes Integration Tests
// ===========================================

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Create test app without CSRF protection for integration tests
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Import individual route modules to avoid CSRF protection
  const authRoutes = require('../../src/routes/auth.routes').default;
  const notificationsRoutes = require('../../src/routes/notifications.routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  // Mount routes without CSRF
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

// Test data
const TEST_SCHOOL = {
  name: 'Notification Test School',
  slug: 'notification-test-school',
  email: 'notification-test@testschool.com',
};

const PARENT_USER = {
  email: 'notifparent@testschool.com',
  password: 'ParentPass123!',
  firstName: 'Notif',
  lastName: 'Parent',
};

const OTHER_SCHOOL = {
  name: 'Other Notification School',
  slug: 'other-notification-school',
  email: 'other-notification@testschool.com',
};

let app: express.Express;
let school1Id: string;
let school2Id: string;
let parentUser: any;
let parentToken: string;
let parent2User: any;
let parent2Token: string;

// Helper to login and get JWT token
async function getAuthToken(app: express.Express, email: string, password: string, schoolSlug: string): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password, schoolSlug });
  return response.body.data?.accessToken || '';
}

describe('Notifications Routes', () => {
  beforeAll(async () => {
    app = createTestApp();

    // Clean up any existing test data
    await prisma.notificationPreference.deleteMany({
      where: { user: { email: { contains: 'notif' } } },
    });
    await prisma.parent.deleteMany({
      where: { user: { email: { contains: 'notif' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'notif' } },
    });
    await prisma.school.deleteMany({
      where: {
        OR: [
          { slug: { contains: 'notification-test' } },
          { slug: { contains: 'other-notification' } },
        ]
      },
    });

    // Create test schools
    const school1 = await prisma.school.create({
      data: {
        ...TEST_SCHOOL,
        settings: {},
      },
    });
    school1Id = school1.id;

    const school2 = await prisma.school.create({
      data: {
        ...OTHER_SCHOOL,
        settings: {},
      },
    });
    school2Id = school2.id;

    // Create parent user in school 1
    const hashedPassword = await bcrypt.hash(PARENT_USER.password, 12);
    parentUser = await prisma.user.create({
      data: {
        email: PARENT_USER.email,
        passwordHash: hashedPassword,
        firstName: PARENT_USER.firstName,
        lastName: PARENT_USER.lastName,
        role: 'PARENT',
        schoolId: school1Id,
        emailVerified: true,
        isActive: true,
        passwordHistory: JSON.stringify([hashedPassword]),
      },
    });

    // Create parent record
    await prisma.parent.create({
      data: {
        userId: parentUser.id,
        schoolId: school1Id,
        contact1Name: `${PARENT_USER.firstName} ${PARENT_USER.lastName}`,
        contact1Email: PARENT_USER.email,
        contact1Phone: '0400000000',
        isPrimary: true,
        emergencyName: 'Emergency Contact',
        emergencyPhone: '0400999999',
        emergencyRelationship: 'Grandparent',
      },
    });

    // Create second parent in school 2
    const hashedPassword2 = await bcrypt.hash(PARENT_USER.password, 12);
    parent2User = await prisma.user.create({
      data: {
        email: 'notifparent2@testschool.com',
        passwordHash: hashedPassword2,
        firstName: 'Notif2',
        lastName: 'Parent',
        role: 'PARENT',
        schoolId: school2Id,
        emailVerified: true,
        isActive: true,
        passwordHistory: JSON.stringify([hashedPassword2]),
      },
    });

    await prisma.parent.create({
      data: {
        userId: parent2User.id,
        schoolId: school2Id,
        contact1Name: 'Notif2 Parent',
        contact1Email: 'notifparent2@testschool.com',
        contact1Phone: '0400000001',
        isPrimary: true,
        emergencyName: 'Emergency Contact 2',
        emergencyPhone: '0400999998',
        emergencyRelationship: 'Uncle',
      },
    });

    // Get auth tokens
    parentToken = await getAuthToken(app, PARENT_USER.email, PARENT_USER.password, TEST_SCHOOL.slug);
    parent2Token = await getAuthToken(app, 'notifparent2@testschool.com', PARENT_USER.password, OTHER_SCHOOL.slug);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.notificationPreference.deleteMany({
      where: { user: { email: { contains: 'notif' } } },
    });
    await prisma.parent.deleteMany({
      where: { user: { email: { contains: 'notif' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'notif' } },
    });
    await prisma.school.deleteMany({
      where: {
        OR: [
          { slug: { contains: 'notification-test' } },
          { slug: { contains: 'other-notification' } },
        ]
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /notifications/preferences', () => {
    it('should return default preferences for user without existing preferences', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.emailNotificationsEnabled).toBe(true);
      expect(response.body.data.quietHoursEnabled).toBe(true);
      expect(response.body.data.quietHoursStart).toBe('21:00');
      expect(response.body.data.quietHoursEnd).toBe('07:00');
      expect(response.body.data.userId).toBe(parentUser.id);
      expect(response.body.data.schoolId).toBe(school1Id);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/preferences');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /notifications/preferences', () => {
    it('should update email notifications toggle', async () => {
      const response = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ emailNotificationsEnabled: false });

      expect(response.status).toBe(200);
      expect(response.body.data.emailNotificationsEnabled).toBe(false);
    });

    it('should update notification types', async () => {
      const response = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          notificationTypes: {
            LESSON_REMINDER: false,
            ATTENDANCE_SUMMARY: true,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.notificationTypes.LESSON_REMINDER).toBe(false);
      expect(response.body.data.notificationTypes.ATTENDANCE_SUMMARY).toBe(true);
    });

    it('should update quiet hours settings', async () => {
      const response = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.quietHoursEnabled).toBe(false);
      expect(response.body.data.quietHoursStart).toBe('22:00');
      expect(response.body.data.quietHoursEnd).toBe('06:00');
    });

    it('should validate time format', async () => {
      const response = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ quietHoursStart: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch('/api/v1/notifications/preferences')
        .send({ emailNotificationsEnabled: false });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /notifications/preferences/reset', () => {
    it('should reset preferences to defaults', async () => {
      // First, update some preferences
      await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          emailNotificationsEnabled: false,
          quietHoursEnabled: false,
        });

      // Reset to defaults
      const response = await request(app)
        .post('/api/v1/notifications/preferences/reset')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.emailNotificationsEnabled).toBe(true);
      expect(response.body.data.quietHoursEnabled).toBe(true);
      expect(response.body.data.quietHoursStart).toBe('21:00');
      expect(response.body.data.quietHoursEnd).toBe('07:00');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/preferences/reset');

      expect(response.status).toBe(401);
    });
  });

  describe('Multi-tenancy', () => {
    it('should isolate preferences between schools', async () => {
      // Update preferences for parent 1 in school 1
      await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ emailNotificationsEnabled: false });

      // Get preferences for parent 2 in school 2
      const response = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${parent2Token}`);

      // Parent 2 should have default preferences, not affected by parent 1
      expect(response.status).toBe(200);
      expect(response.body.data.emailNotificationsEnabled).toBe(true);
      expect(response.body.data.schoolId).toBe(school2Id);
    });

    it('should not allow accessing preferences from different school', async () => {
      // Parent 1 tries to access - should only get their own preferences
      const response = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.schoolId).toBe(school1Id);
      expect(response.body.data.userId).toBe(parentUser.id);
    });
  });
});
