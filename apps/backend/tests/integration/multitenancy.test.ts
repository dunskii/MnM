// ===========================================
// Multi-Tenancy Security Integration Tests
// ===========================================
// Comprehensive tests to verify data isolation between schools

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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

describe('Multi-Tenancy Security Tests', () => {
  const app = createTestApp();

  // School A data
  let schoolAId: string;
  let adminAToken: string;
  let termAId: string;
  let locationAId: string;
  let roomAId: string;
  let instrumentAId: string;
  let teacherAId: string;
  let familyAId: string;
  let studentAId: string;

  // School B data
  let schoolBId: string;
  let adminBToken: string;

  beforeAll(async () => {
    // Create School A
    const schoolA = await prisma.school.create({
      data: {
        name: 'School A',
        slug: 'school-a',
        email: 'admin@schoola.com',
      },
    });
    schoolAId = schoolA.id;

    // Create School B
    const schoolB = await prisma.school.create({
      data: {
        name: 'School B',
        slug: 'school-b',
        email: 'admin@schoolb.com',
      },
    });
    schoolBId = schoolB.id;

    // Create admins
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);

    await prisma.user.create({
      data: {
        schoolId: schoolAId,
        email: 'admin@school.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'A',
        role: 'ADMIN',
        emailVerified: true,
        passwordHistory: JSON.stringify([passwordHash]),
      },
    });

    await prisma.user.create({
      data: {
        schoolId: schoolBId,
        email: 'admin@school.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'B',
        role: 'ADMIN',
        emailVerified: true,
        passwordHistory: JSON.stringify([passwordHash]),
      },
    });

    // Login admins
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@school.com',
        password: 'AdminPass123!',
        schoolSlug: 'school-a',
      });
    adminAToken = loginA.body.data.accessToken;

    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@school.com',
        password: 'AdminPass123!',
        schoolSlug: 'school-b',
      });
    adminBToken = loginB.body.data.accessToken;

    // Create test data for School A
    const termRes = await request(app)
      .post('/api/v1/admin/terms')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: 'School A Term',
        startDate: '2025-01-01',
        endDate: '2025-04-01',
      });
    termAId = termRes.body.data.id;

    const locationRes = await request(app)
      .post('/api/v1/admin/locations')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ name: 'School A Location' });
    locationAId = locationRes.body.data.id;

    const roomRes = await request(app)
      .post('/api/v1/admin/rooms')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ name: 'Room A1', locationId: locationAId, capacity: 10 });
    roomAId = roomRes.body.data.id;

    const instrumentRes = await request(app)
      .post('/api/v1/admin/instruments')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ name: 'School A Piano' });
    instrumentAId = instrumentRes.body.data.id;

    const teacherRes = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        email: 'teacher@schoola.com',
        firstName: 'Teacher',
        lastName: 'A',
        instrumentIds: [instrumentAId],
      });
    teacherAId = teacherRes.body.data.id;

    const familyRes = await request(app)
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ name: 'Family A' });
    familyAId = familyRes.body.data.id;

    const studentRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        firstName: 'Student',
        lastName: 'A',
        familyId: familyAId,
      });
    studentAId = studentRes.body.data.id;
  });

  afterAll(async () => {
    // Clean up
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

  describe('Cross-School Data Access Prevention', () => {
    describe('Terms', () => {
      it('School B cannot read School A term', async () => {
        const response = await request(app)
          .get(`/api/v1/admin/terms/${termAId}`)
          .set('Authorization', `Bearer ${adminBToken}`);

        expect(response.status).toBe(404);
      });

      it('School B cannot update School A term', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/terms/${termAId}`)
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({ name: 'Hacked Term' });

        expect(response.status).toBe(404);
      });

      it('School B cannot delete School A term', async () => {
        const response = await request(app)
          .delete(`/api/v1/admin/terms/${termAId}`)
          .set('Authorization', `Bearer ${adminBToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('Locations', () => {
      it('School B cannot read School A location', async () => {
        const response = await request(app)
          .get(`/api/v1/admin/locations/${locationAId}`)
          .set('Authorization', `Bearer ${adminBToken}`);

        expect(response.status).toBe(404);
      });

      it('School B cannot update School A location', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/locations/${locationAId}`)
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({ name: 'Hacked Location' });

        expect(response.status).toBe(404);
      });
    });

    describe('Rooms', () => {
      it('School B cannot read School A room', async () => {
        const response = await request(app)
          .get(`/api/v1/admin/rooms/${roomAId}`)
          .set('Authorization', `Bearer ${adminBToken}`);

        expect(response.status).toBe(404);
      });

      it('School B cannot create room in School A location', async () => {
        const response = await request(app)
          .post('/api/v1/admin/rooms')
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({
            name: 'Injected Room',
            locationId: locationAId, // School A's location
            capacity: 5,
          });

        expect(response.status).toBe(404);
      });
    });

    describe('Instruments', () => {
      it('School B cannot read School A instrument', async () => {
        const response = await request(app)
          .get('/api/v1/admin/instruments')
          .set('Authorization', `Bearer ${adminBToken}`);

        expect(response.status).toBe(200);
        const instrumentIds = response.body.data.map((i: { id: string }) => i.id);
        expect(instrumentIds).not.toContain(instrumentAId);
      });

      it('School B cannot update School A instrument', async () => {
        const response = await request(app)
          .patch(`/api/v1/admin/instruments/${instrumentAId}`)
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({ name: 'Hacked Piano' });

        expect(response.status).toBe(404);
      });
    });

    describe('Teachers', () => {
      it('School B cannot read School A teacher', async () => {
        const response = await request(app)
          .get(`/api/v1/teachers/${teacherAId}`)
          .set('Authorization', `Bearer ${adminBToken}`);

        expect(response.status).toBe(404);
      });

      it('School B cannot update School A teacher', async () => {
        const response = await request(app)
          .patch(`/api/v1/teachers/${teacherAId}`)
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({ bio: 'Hacked bio' });

        expect(response.status).toBe(404);
      });

      it('School B cannot delete School A teacher', async () => {
        const response = await request(app)
          .delete(`/api/v1/teachers/${teacherAId}`)
          .set('Authorization', `Bearer ${adminBToken}`);

        expect(response.status).toBe(404);
      });

      it('School B cannot assign School A instrument to their teacher', async () => {
        // First create a teacher in School B
        const teacherBRes = await request(app)
          .post('/api/v1/teachers')
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({
            email: 'teacher@schoolb.com',
            firstName: 'Teacher',
            lastName: 'B',
          });

        const teacherBId = teacherBRes.body.data.id;

        // Try to assign School A's instrument
        const response = await request(app)
          .post(`/api/v1/teachers/${teacherBId}/instruments`)
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({ instrumentId: instrumentAId });

        expect(response.status).toBe(404);
      });
    });

    describe('Families', () => {
      it('School B cannot read School A family', async () => {
        const response = await request(app)
          .get(`/api/v1/families/${familyAId}`)
          .set('Authorization', `Bearer ${adminBToken}`);

        expect(response.status).toBe(404);
      });

      it('School B cannot add student to School A family', async () => {
        // Create a student in School B
        const studentBRes = await request(app)
          .post('/api/v1/students')
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({
            firstName: 'Student',
            lastName: 'B',
          });

        const studentBId = studentBRes.body.data.id;

        // Try to add to School A's family
        const response = await request(app)
          .post(`/api/v1/families/${familyAId}/students`)
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({ studentId: studentBId });

        expect(response.status).toBe(404);
      });
    });

    describe('Students', () => {
      it('School B cannot read School A student', async () => {
        const response = await request(app)
          .get(`/api/v1/students/${studentAId}`)
          .set('Authorization', `Bearer ${adminBToken}`);

        expect(response.status).toBe(404);
      });

      it('School B cannot assign School A student to their family', async () => {
        // Create a family in School B
        const familyBRes = await request(app)
          .post('/api/v1/families')
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({ name: 'Family B' });

        const familyBId = familyBRes.body.data.id;

        // Try to add School A's student
        const response = await request(app)
          .post(`/api/v1/families/${familyBId}/students`)
          .set('Authorization', `Bearer ${adminBToken}`)
          .send({ studentId: studentAId });

        expect(response.status).toBe(404);
      });
    });
  });

  describe('Data Isolation in List Endpoints', () => {
    it('List terms should only return current school data', async () => {
      // Create term in School B
      await request(app)
        .post('/api/v1/admin/terms')
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({
          name: 'School B Term',
          startDate: '2025-01-01',
          endDate: '2025-04-01',
        });

      // School A should only see their terms
      const responseA = await request(app)
        .get('/api/v1/admin/terms')
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(responseA.body.data.every((t: { name: string }) => t.name.includes('School A'))).toBe(
        true
      );

      // School B should only see their terms
      const responseB = await request(app)
        .get('/api/v1/admin/terms')
        .set('Authorization', `Bearer ${adminBToken}`);

      expect(responseB.body.data.every((t: { name: string }) => t.name.includes('School B'))).toBe(
        true
      );
    });

    it('List teachers should only return current school data', async () => {
      const responseA = await request(app)
        .get('/api/v1/teachers')
        .set('Authorization', `Bearer ${adminAToken}`);

      const responseB = await request(app)
        .get('/api/v1/teachers')
        .set('Authorization', `Bearer ${adminBToken}`);

      // No overlap in IDs
      const idsA = responseA.body.data.map((t: { id: string }) => t.id);
      const idsB = responseB.body.data.map((t: { id: string }) => t.id);

      const intersection = idsA.filter((id: string) => idsB.includes(id));
      expect(intersection.length).toBe(0);
    });

    it('List students should only return current school data', async () => {
      const responseA = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${adminAToken}`);

      const responseB = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${adminBToken}`);

      // No overlap in IDs
      const idsA = responseA.body.data.map((s: { id: string }) => s.id);
      const idsB = responseB.body.data.map((s: { id: string }) => s.id);

      const intersection = idsA.filter((id: string) => idsB.includes(id));
      expect(intersection.length).toBe(0);
    });

    it('List families should only return current school data', async () => {
      const responseA = await request(app)
        .get('/api/v1/families')
        .set('Authorization', `Bearer ${adminAToken}`);

      const responseB = await request(app)
        .get('/api/v1/families')
        .set('Authorization', `Bearer ${adminBToken}`);

      // No overlap in IDs
      const idsA = responseA.body.data.map((f: { id: string }) => f.id);
      const idsB = responseB.body.data.map((f: { id: string }) => f.id);

      const intersection = idsA.filter((id: string) => idsB.includes(id));
      expect(intersection.length).toBe(0);
    });
  });

  describe('Authentication School Binding', () => {
    it('User should be bound to their school context', async () => {
      // Get current user info
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(response.body.data.user.schoolName).toBe('School A');
    });

    it('Same email different schools should have different contexts', async () => {
      const meA = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminAToken}`);

      const meB = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminBToken}`);

      expect(meA.body.data.user.schoolName).toBe('School A');
      expect(meB.body.data.user.schoolName).toBe('School B');
      expect(meA.body.data.user.id).not.toBe(meB.body.data.user.id);
    });
  });

  describe('ID Guessing Attack Prevention', () => {
    it('Should not leak existence of resources in other schools', async () => {
      // Get School A's term ID
      const existingTermId = termAId;

      // School B trying to access should get 404 (not 403)
      // This prevents attackers from knowing if a resource exists
      const response = await request(app)
        .get(`/api/v1/admin/terms/${existingTermId}`)
        .set('Authorization', `Bearer ${adminBToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).not.toContain('permission');
      expect(response.body.message).not.toContain('unauthorized');
    });

    it('Random UUID should return 404', async () => {
      const randomId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      const response = await request(app)
        .get(`/api/v1/admin/terms/${randomId}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(response.status).toBe(404);
    });
  });
});
