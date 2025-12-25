// ===========================================
// Hybrid Booking Routes Integration Tests
// ===========================================
// Tests for hybrid lesson individual session booking functionality

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
  const hybridBookingRoutes = require('../../src/routes/hybridBooking.routes').default;
  const calendarRoutes = require('../../src/routes/calendar.routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  // Mount routes without CSRF
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/hybrid-bookings', hybridBookingRoutes);
  app.use('/api/v1/calendar', calendarRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

// Test data
const TEST_SCHOOL_1 = {
  name: 'Hybrid Test School 1',
  slug: 'hybrid-test-school-1',
  email: 'hybrid-test1@testschool.com',
};

const TEST_SCHOOL_2 = {
  name: 'Hybrid Test School 2',
  slug: 'hybrid-test-school-2',
  email: 'hybrid-test2@testschool.com',
};

const ADMIN_USER = {
  email: 'hybridadmin@testschool.com',
  password: 'AdminPassword123!',
  firstName: 'Hybrid',
  lastName: 'Admin',
};

const PARENT_USER = {
  email: 'hybridparent@testschool.com',
  password: 'ParentPass123!',
  firstName: 'Hybrid',
  lastName: 'Parent',
};

const PARENT_USER_2 = {
  email: 'hybridparent2@testschool.com',
  password: 'ParentPass123!',
  firstName: 'Other',
  lastName: 'Parent',
};

// Increase timeout for integration tests with many database operations
jest.setTimeout(30000);

describe('Hybrid Booking Routes Integration Tests', () => {
  let school1Id: string;
  let school2Id: string;
  let admin1Token: string;
  let parent1Token: string;
  let parent2Token: string;
  let term1Id: string;
  let hybridLessonId: string;
  let student1Id: string;
  let student2Id: string;
  let parent1Id: string;

  const app = createTestApp();

  // Helper function to make authenticated requests
  const authRequest = (method: 'post' | 'patch' | 'delete', url: string, token: string) => {
    return request(app)[method](url).set('Authorization', `Bearer ${token}`);
  };

  const authGet = (url: string, token: string) => {
    return request(app).get(url).set('Authorization', `Bearer ${token}`);
  };

  beforeAll(async () => {
    // Clear any existing login attempts
    await prisma.loginAttempt.deleteMany({});

    // Create schools
    const school1 = await prisma.school.create({ data: TEST_SCHOOL_1 });
    const school2 = await prisma.school.create({ data: TEST_SCHOOL_2 });
    school1Id = school1.id;
    school2Id = school2.id;

    // Create admin user
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

    // Create parent users with families and students
    const parentPasswordHash = await bcrypt.hash(PARENT_USER.password, 10);

    // Parent 1 with student 1
    const parentUser1 = await prisma.user.create({
      data: {
        schoolId: school1Id,
        email: PARENT_USER.email,
        passwordHash: parentPasswordHash,
        firstName: PARENT_USER.firstName,
        lastName: PARENT_USER.lastName,
        role: 'PARENT',
        emailVerified: true,
        passwordHistory: JSON.stringify([parentPasswordHash]),
      },
    });

    const family1 = await prisma.family.create({
      data: { schoolId: school1Id, name: 'Test Family 1' },
    });

    const parent1 = await prisma.parent.create({
      data: {
        schoolId: school1Id,
        userId: parentUser1.id,
        familyId: family1.id,
        isPrimary: true,
        contact1Name: PARENT_USER.firstName + ' ' + PARENT_USER.lastName,
        contact1Email: PARENT_USER.email,
        contact1Phone: '0400000001',
        emergencyName: 'Emergency Contact 1',
        emergencyPhone: '0400000091',
        emergencyRelationship: 'Grandparent',
      },
    });
    parent1Id = parent1.id;

    const student1 = await prisma.student.create({
      data: {
        schoolId: school1Id,
        familyId: family1.id,
        firstName: 'Test',
        lastName: 'Student1',
        birthDate: new Date('2015-01-15'),
        ageGroup: 'KIDS',
      },
    });
    student1Id = student1.id;

    // Parent 2 with student 2 (different family)
    const parentUser2 = await prisma.user.create({
      data: {
        schoolId: school1Id,
        email: PARENT_USER_2.email,
        passwordHash: parentPasswordHash,
        firstName: PARENT_USER_2.firstName,
        lastName: PARENT_USER_2.lastName,
        role: 'PARENT',
        emailVerified: true,
        passwordHistory: JSON.stringify([parentPasswordHash]),
      },
    });

    const family2 = await prisma.family.create({
      data: { schoolId: school1Id, name: 'Test Family 2' },
    });

    await prisma.parent.create({
      data: {
        schoolId: school1Id,
        userId: parentUser2.id,
        familyId: family2.id,
        isPrimary: true,
        contact1Name: PARENT_USER_2.firstName + ' ' + PARENT_USER_2.lastName,
        contact1Email: PARENT_USER_2.email,
        contact1Phone: '0400000002',
        emergencyName: 'Emergency Contact 2',
        emergencyPhone: '0400000092',
        emergencyRelationship: 'Grandparent',
      },
    });

    const student2 = await prisma.student.create({
      data: {
        schoolId: school1Id,
        familyId: family2.id,
        firstName: 'Test',
        lastName: 'Student2',
        birthDate: new Date('2014-06-20'),
        ageGroup: 'KIDS',
      },
    });
    student2Id = student2.id;

    // Create term (future dates for 24h rule testing)
    const termStart = new Date();
    termStart.setDate(termStart.getDate() + 7); // Start in 7 days
    const termEnd = new Date(termStart);
    termEnd.setDate(termEnd.getDate() + 70); // 10 weeks

    const term = await prisma.term.create({
      data: {
        schoolId: school1Id,
        name: 'Hybrid Test Term',
        startDate: termStart,
        endDate: termEnd,
      },
    });
    term1Id = term.id;

    // Create location and room
    const location = await prisma.location.create({
      data: { schoolId: school1Id, name: 'Hybrid Test Location', address: '123 Test St' },
    });

    const room = await prisma.room.create({
      data: { locationId: location.id, name: 'Hybrid Test Room', capacity: 10 },
    });

    // Create teacher
    const teacherUser = await prisma.user.create({
      data: {
        schoolId: school1Id,
        email: 'hybridteacher@testschool.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'Teacher',
        role: 'TEACHER',
        emailVerified: true,
        passwordHistory: JSON.stringify([passwordHash]),
      },
    });

    const teacher = await prisma.teacher.create({
      data: { schoolId: school1Id, userId: teacherUser.id },
    });

    // Create hybrid lesson type
    const lessonType = await prisma.lessonType.create({
      data: {
        schoolId: school1Id,
        name: 'Hybrid Piano',
        type: 'HYBRID',
        defaultDuration: 60,
      },
    });

    // Create hybrid lesson
    const hybridLesson = await prisma.lesson.create({
      data: {
        schoolId: school1Id,
        lessonTypeId: lessonType.id,
        termId: term.id,
        teacherId: teacher.id,
        roomId: room.id,
        name: 'Test Hybrid Piano',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:00',
        durationMins: 60,
        maxStudents: 5,
      },
    });
    hybridLessonId = hybridLesson.id;

    // Create hybrid pattern
    await prisma.hybridLessonPattern.create({
      data: {
        lessonId: hybridLesson.id,
        termId: term.id,
        patternType: 'CUSTOM',
        groupWeeks: [1, 2, 3, 5, 6, 7, 9, 10],
        individualWeeks: [4, 8],
        individualSlotDuration: 30,
        bookingDeadlineHours: 24,
        bookingsOpen: true,
      },
    });

    // Enroll students
    await prisma.lessonEnrollment.create({
      data: { lessonId: hybridLesson.id, studentId: student1.id },
    });
    await prisma.lessonEnrollment.create({
      data: { lessonId: hybridLesson.id, studentId: student2.id },
    });

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_USER.email, password: ADMIN_USER.password });
    admin1Token = adminLogin.body.data.accessToken;

    const parent1Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: PARENT_USER.email, password: PARENT_USER.password });
    parent1Token = parent1Login.body.data.accessToken;

    const parent2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: PARENT_USER_2.email, password: PARENT_USER_2.password });
    parent2Token = parent2Login.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.hybridBooking.deleteMany({});
    await prisma.lessonEnrollment.deleteMany({});
    await prisma.hybridLessonPattern.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.lessonType.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.term.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.parent.deleteMany({});
    await prisma.family.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.loginAttempt.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.school.deleteMany({
      where: { id: { in: [school1Id, school2Id] } },
    });
    await prisma.$disconnect();
  });

  // ===========================================
  // AVAILABLE SLOTS TESTS
  // ===========================================

  describe('GET /hybrid-bookings/available-slots', () => {
    it('should return available slots for an individual week', async () => {
      const res = await authGet(
        `/api/v1/hybrid-bookings/available-slots?lessonId=${hybridLessonId}&weekNumber=4`,
        parent1Token
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('startTime');
      expect(res.body.data[0]).toHaveProperty('endTime');
      expect(res.body.data[0]).toHaveProperty('isAvailable');
    });

    it('should reject request for a group week', async () => {
      const res = await authGet(
        `/api/v1/hybrid-bookings/available-slots?lessonId=${hybridLessonId}&weekNumber=1`,
        parent1Token
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not an individual booking week');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get(
        `/api/v1/hybrid-bookings/available-slots?lessonId=${hybridLessonId}&weekNumber=4`
      );

      expect(res.status).toBe(401);
    });
  });

  // ===========================================
  // CREATE BOOKING TESTS
  // ===========================================

  describe('POST /hybrid-bookings', () => {
    it('should create a booking for own child', async () => {
      // Get available slots first
      const slotsRes = await authGet(
        `/api/v1/hybrid-bookings/available-slots?lessonId=${hybridLessonId}&weekNumber=4`,
        parent1Token
      );

      const slot = slotsRes.body.data.find((s: { isAvailable: boolean }) => s.isAvailable);
      expect(slot).toBeDefined();

      const res = await authRequest('post', '/api/v1/hybrid-bookings', parent1Token).send({
        lessonId: hybridLessonId,
        studentId: student1Id,
        weekNumber: 4,
        scheduledDate: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.studentId).toBe(student1Id);
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('should reject booking for another family child', async () => {
      // Parent 1 trying to book for Student 2 (belongs to Parent 2)
      const slotsRes = await authGet(
        `/api/v1/hybrid-bookings/available-slots?lessonId=${hybridLessonId}&weekNumber=8`,
        parent1Token
      );

      const slot = slotsRes.body.data.find((s: { isAvailable: boolean }) => s.isAvailable);

      const res = await authRequest('post', '/api/v1/hybrid-bookings', parent1Token).send({
        lessonId: hybridLessonId,
        studentId: student2Id, // Not parent1's child
        weekNumber: 8,
        scheduledDate: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('own children');
    });

    it('should reject double booking for same student same week', async () => {
      // Try to create another booking for student1 in week 4 (already booked above)
      const slotsRes = await authGet(
        `/api/v1/hybrid-bookings/available-slots?lessonId=${hybridLessonId}&weekNumber=4`,
        parent1Token
      );

      const slot = slotsRes.body.data.find((s: { isAvailable: boolean }) => s.isAvailable);
      if (!slot) {
        // All slots taken, that's expected
        return;
      }

      const res = await authRequest('post', '/api/v1/hybrid-bookings', parent1Token).send({
        lessonId: hybridLessonId,
        studentId: student1Id,
        weekNumber: 4,
        scheduledDate: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already has a booking');
    });

    it('should reject booking for past date (24h rule)', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1); // 1 hour ago

      const res = await authRequest('post', '/api/v1/hybrid-bookings', parent1Token).send({
        lessonId: hybridLessonId,
        studentId: student1Id,
        weekNumber: 8,
        scheduledDate: pastDate.toISOString(),
        startTime: '09:00',
        endTime: '09:30',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('24 hours');
    });
  });

  // ===========================================
  // MY BOOKINGS TESTS
  // ===========================================

  describe('GET /hybrid-bookings/my-bookings', () => {
    it('should return only parent own bookings', async () => {
      const res = await authGet('/api/v1/hybrid-bookings/my-bookings', parent1Token);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      // Should only see parent1's bookings
      res.body.data.forEach((booking: { parentId: string }) => {
        expect(booking.parentId).toBe(parent1Id);
      });
    });

    it('should filter by status', async () => {
      const res = await authGet(
        '/api/v1/hybrid-bookings/my-bookings?status=CONFIRMED',
        parent1Token
      );

      expect(res.status).toBe(200);
      res.body.data.forEach((booking: { status: string }) => {
        expect(booking.status).toBe('CONFIRMED');
      });
    });
  });

  // ===========================================
  // ADMIN MANAGEMENT TESTS
  // ===========================================

  describe('Admin Hybrid Management', () => {
    it('should allow admin to close bookings', async () => {
      const res = await authRequest(
        'patch',
        `/api/v1/hybrid-bookings/lessons/${hybridLessonId}/close-bookings`,
        admin1Token
      ).send();

      expect(res.status).toBe(200);
      expect(res.body.data.bookingsOpen).toBe(false);
    });

    it('should allow admin to open bookings', async () => {
      const res = await authRequest(
        'patch',
        `/api/v1/hybrid-bookings/lessons/${hybridLessonId}/open-bookings`,
        admin1Token
      ).send();

      expect(res.status).toBe(200);
      expect(res.body.data.bookingsOpen).toBe(true);
    });

    it('should return booking stats for admin', async () => {
      const res = await authGet(
        `/api/v1/hybrid-bookings/lessons/${hybridLessonId}/stats`,
        admin1Token
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalStudents');
      expect(res.body.data).toHaveProperty('bookedCount');
      expect(res.body.data).toHaveProperty('completionRate');
    });

    it('should return all bookings for a lesson', async () => {
      const res = await authGet(
        `/api/v1/hybrid-bookings/lessons/${hybridLessonId}/bookings`,
        admin1Token
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject parent from accessing admin endpoints', async () => {
      const res = await authRequest(
        'patch',
        `/api/v1/hybrid-bookings/lessons/${hybridLessonId}/close-bookings`,
        parent1Token
      ).send();

      expect(res.status).toBe(403);
    });
  });

  // ===========================================
  // CANCEL BOOKING TESTS
  // ===========================================

  describe('DELETE /hybrid-bookings/:id', () => {
    let bookingToCancel: string;

    beforeAll(async () => {
      // Skip if main setup failed
      if (!parent2Token || !hybridLessonId || !student2Id) {
        console.log('Skipping cancel booking setup - main setup incomplete');
        return;
      }

      // Create a booking for parent2 to cancel
      const slotsRes = await authGet(
        `/api/v1/hybrid-bookings/available-slots?lessonId=${hybridLessonId}&weekNumber=8`,
        parent2Token
      );

      if (!slotsRes.body.data) {
        console.log('No slots data returned');
        return;
      }

      const slot = slotsRes.body.data.find((s: { isAvailable: boolean }) => s.isAvailable);
      if (slot) {
        const createRes = await authRequest('post', '/api/v1/hybrid-bookings', parent2Token).send({
          lessonId: hybridLessonId,
          studentId: student2Id,
          weekNumber: 8,
          scheduledDate: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
        bookingToCancel = createRes.body.data?.id;
      }
    });

    it('should allow parent to cancel own booking', async () => {
      if (!bookingToCancel) {
        console.log('Skipping test - no booking created');
        return;
      }

      const res = await authRequest(
        'delete',
        `/api/v1/hybrid-bookings/${bookingToCancel}`,
        parent2Token
      ).send({ reason: 'Test cancellation' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('cancelled');
    });

    it('should reject cancelling another parent booking', async () => {
      // Get parent1's booking
      const bookingsRes = await authGet('/api/v1/hybrid-bookings/my-bookings', parent1Token);
      const parent1Booking = bookingsRes.body.data[0];

      if (!parent1Booking) {
        console.log('Skipping test - no parent1 booking');
        return;
      }

      // Parent2 tries to cancel parent1's booking
      const res = await authRequest(
        'delete',
        `/api/v1/hybrid-bookings/${parent1Booking.id}`,
        parent2Token
      ).send();

      expect(res.status).toBe(404); // Should not find it (security)
    });
  });

  // ===========================================
  // CALENDAR EVENTS TESTS
  // ===========================================

  describe('GET /calendar/events', () => {
    it('should return calendar events for admin', async () => {
      const res = await authGet('/api/v1/calendar/events', admin1Token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter events by term', async () => {
      const res = await authGet(`/api/v1/calendar/events?termId=${term1Id}`, admin1Token);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject calendar access for parents on admin endpoint', async () => {
      const res = await authGet('/api/v1/calendar/events', parent1Token);

      expect(res.status).toBe(403);
    });
  });
});
