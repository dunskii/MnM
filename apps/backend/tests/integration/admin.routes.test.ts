// ===========================================
// Admin Routes Integration Tests
// ===========================================

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const routes = require('../../src/routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  app.use('/api/v1', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

// Test data
const TEST_SCHOOL_1 = {
  name: 'Test School 1',
  slug: 'test-school-1',
  email: 'test1@testschool.com',
};

const TEST_SCHOOL_2 = {
  name: 'Test School 2',
  slug: 'test-school-2',
  email: 'test2@testschool.com',
};

const ADMIN_USER = {
  email: 'admin@testschool.com',
  password: 'AdminPassword123!',
  firstName: 'Admin',
  lastName: 'User',
};

describe('Admin Routes Integration Tests', () => {
  let school1Id: string;
  let school2Id: string;
  let admin1Token: string;
  let admin2Token: string;
  let term1Id: string;
  let location1Id: string;
  let instrument1Id: string;

  const app = createTestApp();

  beforeAll(async () => {
    // Create two schools
    const school1 = await prisma.school.create({ data: TEST_SCHOOL_1 });
    const school2 = await prisma.school.create({ data: TEST_SCHOOL_2 });
    school1Id = school1.id;
    school2Id = school2.id;

    // Create admin users for each school
    const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);

    await prisma.user.create({
      data: {
        schoolId: school1Id,
        email: ADMIN_USER.email,
        passwordHash,
        firstName: ADMIN_USER.firstName,
        lastName: ADMIN_USER.lastName,
        role: 'ADMIN',
        emailVerified: true,
        passwordHistory: JSON.stringify([passwordHash]),
      },
    });

    await prisma.user.create({
      data: {
        schoolId: school2Id,
        email: ADMIN_USER.email,
        passwordHash,
        firstName: 'Admin2',
        lastName: 'User2',
        role: 'ADMIN',
        emailVerified: true,
        passwordHistory: JSON.stringify([passwordHash]),
      },
    });

    // Login to get tokens
    const login1 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
        schoolSlug: TEST_SCHOOL_1.slug,
      });
    admin1Token = login1.body.data.accessToken;

    const login2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
        schoolSlug: TEST_SCHOOL_2.slug,
      });
    admin2Token = login2.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.teacherInstrument.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.parent.deleteMany({});
    await prisma.family.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.lessonDuration.deleteMany({});
    await prisma.lessonType.deleteMany({});
    await prisma.instrument.deleteMany({});
    await prisma.term.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.loginAttempt.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.school.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Terms API', () => {
    describe('POST /api/v1/admin/terms', () => {
      it('should create a term for the admin\'s school', async () => {
        const response = await request(app)
          .post('/api/v1/admin/terms')
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({
            name: 'Term 1 2025',
            startDate: '2025-01-27',
            endDate: '2025-04-04',
          });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('Term 1 2025');
        term1Id = response.body.data.id;
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/v1/admin/terms')
          .send({
            name: 'Unauthorized Term',
            startDate: '2025-01-27',
            endDate: '2025-04-04',
          });

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/v1/admin/terms', () => {
      it('should only return terms for the admin\'s school', async () => {
        // Admin 1 should see their term
        const response1 = await request(app)
          .get('/api/v1/admin/terms')
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response1.status).toBe(200);
        expect(response1.body.data.length).toBe(1);
        expect(response1.body.data[0].id).toBe(term1Id);

        // Admin 2 should see no terms
        const response2 = await request(app)
          .get('/api/v1/admin/terms')
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response2.status).toBe(200);
        expect(response2.body.data.length).toBe(0);
      });
    });

    describe('GET /api/v1/admin/terms/:id', () => {
      it('should return term for owner school', async () => {
        const response = await request(app)
          .get(`/api/v1/admin/terms/${term1Id}`)
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(term1Id);
      });

      it('should return 404 for term from different school (multi-tenancy)', async () => {
        const response = await request(app)
          .get(`/api/v1/admin/terms/${term1Id}`)
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PATCH /api/v1/admin/terms/:id', () => {
      it('should update term for owner school', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/terms/${term1Id}`)
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({ name: 'Updated Term 1 2025' });

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Updated Term 1 2025');
      });

      it('should not update term from different school', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/terms/${term1Id}`)
          .set('Authorization', `Bearer ${admin2Token}`)
          .send({ name: 'Hacked Term' });

        expect(response.status).toBe(404);
      });
    });
  });

  describe('Locations API', () => {
    describe('POST /api/v1/admin/locations', () => {
      it('should create a location for the admin\'s school', async () => {
        const response = await request(app)
          .post('/api/v1/admin/locations')
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({
            name: 'Main Campus',
            address: '123 Music Street',
            phone: '(02) 1234 5678',
          });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('Main Campus');
        location1Id = response.body.data.id;
      });
    });

    describe('GET /api/v1/admin/locations', () => {
      it('should only return locations for the admin\'s school', async () => {
        // Admin 1 should see their location
        const response1 = await request(app)
          .get('/api/v1/admin/locations')
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response1.status).toBe(200);
        expect(response1.body.data.length).toBe(1);

        // Admin 2 should see no locations
        const response2 = await request(app)
          .get('/api/v1/admin/locations')
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response2.status).toBe(200);
        expect(response2.body.data.length).toBe(0);
      });
    });

    describe('Multi-tenancy for locations', () => {
      it('should not allow access to location from different school', async () => {
        const response = await request(app)
          .get(`/api/v1/admin/locations/${location1Id}`)
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response.status).toBe(404);
      });

      it('should not allow update of location from different school', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/locations/${location1Id}`)
          .set('Authorization', `Bearer ${admin2Token}`)
          .send({ name: 'Hacked Location' });

        expect(response.status).toBe(404);
      });

      it('should not allow delete of location from different school', async () => {
        const response = await request(app)
          .delete(`/api/v1/admin/locations/${location1Id}`)
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response.status).toBe(404);
      });
    });
  });

  describe('Instruments API', () => {
    describe('POST /api/v1/admin/instruments', () => {
      it('should create an instrument for the admin\'s school', async () => {
        const response = await request(app)
          .post('/api/v1/admin/instruments')
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({ name: 'Piano' });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('Piano');
        instrument1Id = response.body.data.id;
      });
    });

    describe('Multi-tenancy for instruments', () => {
      it('should not return instruments from other schools', async () => {
        // Admin 2 should not see school 1's instruments
        const response = await request(app)
          .get('/api/v1/admin/instruments')
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(0);
      });

      it('should not allow update of instrument from different school', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/instruments/${instrument1Id}`)
          .set('Authorization', `Bearer ${admin2Token}`)
          .send({ name: 'Hacked Piano' });

        expect(response.status).toBe(404);
      });
    });
  });

  describe('Lesson Types API', () => {
    let lessonType1Id: string;

    describe('POST /api/v1/admin/lesson-types', () => {
      it('should create a lesson type for the admin\'s school', async () => {
        const response = await request(app)
          .post('/api/v1/admin/lesson-types')
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({
            name: 'Individual Piano',
            type: 'INDIVIDUAL',
            defaultDuration: 45,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('Individual Piano');
        expect(response.body.data.type).toBe('INDIVIDUAL');
        lessonType1Id = response.body.data.id;
      });
    });

    describe('Multi-tenancy for lesson types', () => {
      it('should isolate lesson types by school', async () => {
        // Create lesson type for school 2
        await request(app)
          .post('/api/v1/admin/lesson-types')
          .set('Authorization', `Bearer ${admin2Token}`)
          .send({
            name: 'Group Drums',
            type: 'GROUP',
            defaultDuration: 60,
          });

        // School 1 should only see their lesson type
        const response1 = await request(app)
          .get('/api/v1/admin/lesson-types')
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response1.body.data.length).toBe(1);
        expect(response1.body.data[0].name).toBe('Individual Piano');

        // School 2 should only see their lesson type
        const response2 = await request(app)
          .get('/api/v1/admin/lesson-types')
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response2.body.data.length).toBe(1);
        expect(response2.body.data[0].name).toBe('Group Drums');
      });
    });
  });

  describe('Lesson Durations API', () => {
    describe('POST /api/v1/admin/lesson-durations', () => {
      it('should create a duration for the admin\'s school', async () => {
        const response = await request(app)
          .post('/api/v1/admin/lesson-durations')
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({ minutes: 45 });

        expect(response.status).toBe(201);
        expect(response.body.data.minutes).toBe(45);
      });

      it('should allow same duration in different schools', async () => {
        // School 2 can also have 45 minute duration
        const response = await request(app)
          .post('/api/v1/admin/lesson-durations')
          .set('Authorization', `Bearer ${admin2Token}`)
          .send({ minutes: 45 });

        expect(response.status).toBe(201);
      });

      it('should reject duplicate duration in same school', async () => {
        const response = await request(app)
          .post('/api/v1/admin/lesson-durations')
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({ minutes: 45 });

        expect(response.status).toBe(409);
      });
    });
  });

  describe('Parents API', () => {
    let parent1Id: string;

    describe('POST /api/v1/admin/parents', () => {
      it('should create a parent for the admin\'s school', async () => {
        const response = await request(app)
          .post('/api/v1/admin/parents')
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({
            email: 'parent@testschool.com',
            firstName: 'Test',
            lastName: 'Parent',
            phone: '0412345678',
            contact1Name: 'Primary Contact',
            contact1Email: 'contact1@test.com',
            contact1Phone: '0412345679',
            contact1Relationship: 'Father',
            emergencyName: 'Emergency Contact',
            emergencyPhone: '0412345680',
            emergencyRelationship: 'Grandmother',
          });

        expect(response.status).toBe(201);
        expect(response.body.data.user.firstName).toBe('Test');
        expect(response.body.data.contact1Name).toBe('Primary Contact');
        parent1Id = response.body.data.id;
      });

      it('should auto-create family for parent', async () => {
        const response = await request(app)
          .get(`/api/v1/admin/parents/${parent1Id}`)
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.family).not.toBeNull();
        expect(response.body.data.family.name).toBe('The Parent Family');
      });

      it('should reject duplicate email in same school', async () => {
        const response = await request(app)
          .post('/api/v1/admin/parents')
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({
            email: 'parent@testschool.com', // Same email
            firstName: 'Another',
            lastName: 'Parent',
            contact1Name: 'Contact',
            contact1Email: 'another@test.com',
            contact1Phone: '0400000000',
            contact1Relationship: 'Mother',
            emergencyName: 'Emergency',
            emergencyPhone: '0400000001',
            emergencyRelationship: 'Aunt',
          });

        expect(response.status).toBe(409);
      });
    });

    describe('GET /api/v1/admin/parents', () => {
      it('should only return parents for the admin\'s school', async () => {
        // Admin 1 should see their parent
        const response1 = await request(app)
          .get('/api/v1/admin/parents')
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response1.status).toBe(200);
        expect(response1.body.data.length).toBeGreaterThanOrEqual(1);

        // Admin 2 should see no parents
        const response2 = await request(app)
          .get('/api/v1/admin/parents')
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response2.status).toBe(200);
        expect(response2.body.data.length).toBe(0);
      });
    });

    describe('Multi-tenancy for parents', () => {
      it('should not allow access to parent from different school', async () => {
        const response = await request(app)
          .get(`/api/v1/admin/parents/${parent1Id}`)
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response.status).toBe(404);
      });

      it('should not allow update of parent from different school', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/parents/${parent1Id}`)
          .set('Authorization', `Bearer ${admin2Token}`)
          .send({ firstName: 'Hacked' });

        expect(response.status).toBe(404);
      });

      it('should not allow delete of parent from different school', async () => {
        const response = await request(app)
          .delete(`/api/v1/admin/parents/${parent1Id}`)
          .set('Authorization', `Bearer ${admin2Token}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PATCH /api/v1/admin/parents/:id', () => {
      it('should update parent for owner school', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/parents/${parent1Id}`)
          .set('Authorization', `Bearer ${admin1Token}`)
          .send({ contact1Name: 'Updated Contact' });

        expect(response.status).toBe(200);
        expect(response.body.data.contact1Name).toBe('Updated Contact');
      });
    });
  });

  describe('Authorization', () => {
    it('should reject non-admin users', async () => {
      // Create a teacher user
      const passwordHash = await bcrypt.hash('TeacherPass123!', 10);
      await prisma.user.create({
        data: {
          schoolId: school1Id,
          email: 'teacher@testschool.com',
          passwordHash,
          firstName: 'Teacher',
          lastName: 'User',
          role: 'TEACHER',
          emailVerified: true,
          passwordHistory: JSON.stringify([passwordHash]),
        },
      });

      // Login as teacher
      const login = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'teacher@testschool.com',
          password: 'TeacherPass123!',
          schoolSlug: TEST_SCHOOL_1.slug,
        });

      const teacherToken = login.body.data.accessToken;

      // Try to access admin endpoints
      const response = await request(app)
        .get('/api/v1/admin/terms')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
