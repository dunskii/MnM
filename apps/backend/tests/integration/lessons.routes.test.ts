// ===========================================
// Lessons Routes Integration Tests
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
  const lessonsRoutes = require('../../src/routes/lessons.routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  // Mount routes without CSRF
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/lessons', lessonsRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

// Test data
const TEST_SCHOOL_1 = {
  name: 'Lesson Test School 1',
  slug: 'lesson-test-school-1',
  email: 'lesson-test1@testschool.com',
};

const TEST_SCHOOL_2 = {
  name: 'Lesson Test School 2',
  slug: 'lesson-test-school-2',
  email: 'lesson-test2@testschool.com',
};

const ADMIN_USER = {
  email: 'lessonadmin@testschool.com',
  password: 'AdminPassword123!',
  firstName: 'Lesson',
  lastName: 'Admin',
};

const TEACHER_USER = {
  email: 'lessonteacher@testschool.com',
  password: 'TeacherPass123!',
  firstName: 'Lesson',
  lastName: 'Teacher',
};

describe('Lessons Routes Integration Tests', () => {
  let school1Id: string;
  let school2Id: string;
  let admin1Token: string;
  let admin2Token: string;
  let teacher1Token: string;
  let term1Id: string;
  let location1Id: string;
  let room1Id: string;
  let room2Id: string;
  let teacher1Id: string;
  let teacher2Id: string;
  let lessonType1Id: string;
  let lessonTypeHybridId: string;
  let instrument1Id: string;
  let student1Id: string;
  let student2Id: string;
  let lesson1Id: string;
  let family1Id: string;

  const app = createTestApp();

  // Helper function to make authenticated requests
  const authRequest = (method: 'post' | 'patch' | 'delete', url: string, token: string) => {
    return request(app)[method](url)
      .set('Authorization', `Bearer ${token}`);
  };

  const authGet = (url: string, token: string) => {
    return request(app)
      .get(url)
      .set('Authorization', `Bearer ${token}`);
  };

  beforeAll(async () => {
    // Clear any existing login attempts that might trigger rate limiting
    await prisma.loginAttempt.deleteMany({});

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
        email: 'admin2@testschool.com',
        passwordHash,
        firstName: 'Admin2',
        lastName: 'User2',
        role: 'ADMIN',
        emailVerified: true,
        passwordHistory: JSON.stringify([passwordHash]),
      },
    });

    // Create teacher user for school 1
    const teacherPasswordHash = await bcrypt.hash(TEACHER_USER.password, 10);
    const teacherUser1 = await prisma.user.create({
      data: {
        schoolId: school1Id,
        email: TEACHER_USER.email,
        passwordHash: teacherPasswordHash,
        firstName: TEACHER_USER.firstName,
        lastName: TEACHER_USER.lastName,
        role: 'TEACHER',
        emailVerified: true,
        passwordHistory: JSON.stringify([teacherPasswordHash]),
      },
    });

    // Create teacher records
    const teacher1 = await prisma.teacher.create({
      data: {
        schoolId: school1Id,
        userId: teacherUser1.id,
        bio: 'Test teacher 1',
      },
    });
    teacher1Id = teacher1.id;

    // Create another teacher for school 1
    const teacherUser2 = await prisma.user.create({
      data: {
        schoolId: school1Id,
        email: 'teacher2@testschool.com',
        passwordHash: teacherPasswordHash,
        firstName: 'Second',
        lastName: 'Teacher',
        role: 'TEACHER',
        emailVerified: true,
        passwordHistory: JSON.stringify([teacherPasswordHash]),
      },
    });
    const teacher2 = await prisma.teacher.create({
      data: {
        schoolId: school1Id,
        userId: teacherUser2.id,
        bio: 'Test teacher 2',
      },
    });
    teacher2Id = teacher2.id;

    // Create terms
    const term1 = await prisma.term.create({
      data: {
        schoolId: school1Id,
        name: 'Lesson Test Term 1',
        startDate: new Date('2025-01-27'),
        endDate: new Date('2025-04-04'),
        isActive: true,
      },
    });
    term1Id = term1.id;

    await prisma.term.create({
      data: {
        schoolId: school2Id,
        name: 'Lesson Test Term 2',
        startDate: new Date('2025-01-27'),
        endDate: new Date('2025-04-04'),
        isActive: true,
      },
    });

    // Create location and rooms
    const location1 = await prisma.location.create({
      data: {
        schoolId: school1Id,
        name: 'Lesson Test Location',
        address: '123 Test St',
      },
    });
    location1Id = location1.id;

    const room1 = await prisma.room.create({
      data: {
        locationId: location1Id,
        name: 'Room 1',
        capacity: 10,
      },
    });
    room1Id = room1.id;

    const room2 = await prisma.room.create({
      data: {
        locationId: location1Id,
        name: 'Room 2',
        capacity: 5,
      },
    });
    room2Id = room2.id;

    // Create lesson types
    const lessonType1 = await prisma.lessonType.create({
      data: {
        schoolId: school1Id,
        name: 'Individual Piano',
        type: 'INDIVIDUAL',
        defaultDuration: 45,
      },
    });
    lessonType1Id = lessonType1.id;

    const lessonTypeHybrid = await prisma.lessonType.create({
      data: {
        schoolId: school1Id,
        name: 'Hybrid Piano',
        type: 'HYBRID',
        defaultDuration: 60,
      },
    });
    lessonTypeHybridId = lessonTypeHybrid.id;

    // Create instrument
    const instrument1 = await prisma.instrument.create({
      data: {
        schoolId: school1Id,
        name: 'Piano',
      },
    });
    instrument1Id = instrument1.id;

    // Create duration
    await prisma.lessonDuration.create({
      data: {
        schoolId: school1Id,
        minutes: 45,
      },
    });

    // Create family and students for enrollment tests
    const family1 = await prisma.family.create({
      data: {
        schoolId: school1Id,
        name: 'Test Family',
      },
    });
    family1Id = family1.id;

    const student1 = await prisma.student.create({
      data: {
        schoolId: school1Id,
        familyId: family1Id,
        firstName: 'Test',
        lastName: 'Student1',
        birthDate: new Date('2015-05-01'),
        ageGroup: 'KIDS',
      },
    });
    student1Id = student1.id;

    const student2 = await prisma.student.create({
      data: {
        schoolId: school1Id,
        familyId: family1Id,
        firstName: 'Test',
        lastName: 'Student2',
        birthDate: new Date('2016-06-01'),
        ageGroup: 'KIDS',
      },
    });
    student2Id = student2.id;

    // Login to get tokens
    const login1 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
        schoolSlug: TEST_SCHOOL_1.slug,
      });
    admin1Token = login1.body.data?.accessToken || '';

    const login2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin2@testschool.com',
        password: ADMIN_USER.password,
        schoolSlug: TEST_SCHOOL_2.slug,
      });
    admin2Token = login2.body.data?.accessToken || '';

    const loginTeacher = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: TEACHER_USER.email,
        password: TEACHER_USER.password,
        schoolSlug: TEST_SCHOOL_1.slug,
      });
    teacher1Token = loginTeacher.body.data?.accessToken || '';
  });

  afterAll(async () => {
    // Clean up test data in correct order (respecting foreign keys)
    await prisma.lessonEnrollment.deleteMany({
      where: {
        lesson: {
          schoolId: { in: [school1Id, school2Id] },
        },
      },
    });
    await prisma.hybridLessonPattern.deleteMany({
      where: {
        lesson: {
          schoolId: { in: [school1Id, school2Id] },
        },
      },
    });
    await prisma.lesson.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.student.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.family.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.teacherInstrument.deleteMany({
      where: {
        teacher: {
          schoolId: { in: [school1Id, school2Id] },
        },
      },
    });
    await prisma.teacher.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.room.deleteMany({
      where: {
        location: {
          schoolId: { in: [school1Id, school2Id] },
        },
      },
    });
    await prisma.location.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.lessonDuration.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.lessonType.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.instrument.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.term.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.refreshToken.deleteMany({
      where: {
        user: {
          schoolId: { in: [school1Id, school2Id] },
        },
      },
    });
    await prisma.loginAttempt.deleteMany({});
    await prisma.user.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.school.deleteMany({
      where: { id: { in: [school1Id, school2Id] } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/lessons', () => {
    it('should create a lesson for the admin\'s school', async () => {
      const response = await authRequest('post', '/api/v1/lessons', admin1Token)
        .send({
          name: 'Monday Piano Individual',
          lessonTypeId: lessonType1Id,
          termId: term1Id,
          teacherId: teacher1Id,
          roomId: room1Id,
          instrumentId: instrument1Id,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '09:45',
          durationMins: 45,
          maxStudents: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Monday Piano Individual');
      expect(response.body.data.dayOfWeek).toBe(1);
      expect(response.body.data.maxStudents).toBe(1);
      lesson1Id = response.body.data.id;
    });

    it('should create a hybrid lesson with pattern', async () => {
      const response = await authRequest('post', '/api/v1/lessons', admin1Token)
        .send({
          name: 'Wednesday Hybrid Piano',
          lessonTypeId: lessonTypeHybridId,
          termId: term1Id,
          teacherId: teacher1Id,
          roomId: room2Id,
          instrumentId: instrument1Id,
          dayOfWeek: 3,
          startTime: '14:00',
          endTime: '15:00',
          durationMins: 60,
          maxStudents: 5,
          hybridPattern: {
            patternType: 'ALTERNATING',
            groupWeeks: [1, 3, 5, 7, 9],
            individualWeeks: [2, 4, 6, 8, 10],
            individualSlotDuration: 30,
            bookingDeadlineHours: 24,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.hybridPattern).not.toBeNull();
      expect(response.body.data.hybridPattern.patternType).toBe('ALTERNATING');
      expect(response.body.data.hybridPattern.groupWeeks).toEqual([1, 3, 5, 7, 9]);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/lessons')
        .send({
          name: 'Unauthorized Lesson',
          lessonTypeId: lessonType1Id,
          termId: term1Id,
          teacherId: teacher1Id,
          roomId: room1Id,
          dayOfWeek: 1,
          startTime: '10:00',
          endTime: '10:45',
          durationMins: 45,
          maxStudents: 1,
        });

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const response = await authRequest('post', '/api/v1/lessons', teacher1Token)
        .send({
          name: 'Teacher Created Lesson',
          lessonTypeId: lessonType1Id,
          termId: term1Id,
          teacherId: teacher1Id,
          roomId: room1Id,
          dayOfWeek: 2,
          startTime: '10:00',
          endTime: '10:45',
          durationMins: 45,
          maxStudents: 1,
        });

      expect(response.status).toBe(403);
    });

    it('should detect room conflicts', async () => {
      const response = await authRequest('post', '/api/v1/lessons', admin1Token)
        .send({
          name: 'Conflicting Lesson',
          lessonTypeId: lessonType1Id,
          termId: term1Id,
          teacherId: teacher2Id, // Different teacher
          roomId: room1Id, // Same room as lesson1
          dayOfWeek: 1, // Same day
          startTime: '09:00', // Same time
          endTime: '09:45',
          durationMins: 45,
          maxStudents: 1,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Room');
    });

    it('should detect teacher conflicts', async () => {
      const response = await authRequest('post', '/api/v1/lessons', admin1Token)
        .send({
          name: 'Teacher Conflict Lesson',
          lessonTypeId: lessonType1Id,
          termId: term1Id,
          teacherId: teacher1Id, // Same teacher as lesson1
          roomId: room2Id, // Different room
          dayOfWeek: 1, // Same day
          startTime: '09:15', // Overlapping time
          endTime: '10:00',
          durationMins: 45,
          maxStudents: 1,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Teacher');
    });

    it('should reject invalid references from other schools', async () => {
      // Admin 2 trying to use school 1's term
      const response = await authRequest('post', '/api/v1/lessons', admin2Token)
        .send({
          name: 'Cross-school Lesson',
          lessonTypeId: lessonType1Id, // School 1's lesson type
          termId: term1Id, // School 1's term
          teacherId: teacher1Id, // School 1's teacher
          roomId: room1Id, // School 1's room
          dayOfWeek: 5,
          startTime: '09:00',
          endTime: '09:45',
          durationMins: 45,
          maxStudents: 1,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/lessons', () => {
    it('should return lessons for the user\'s school', async () => {
      const response = await authGet('/api/v1/lessons', admin1Token);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].schoolId).toBe(school1Id);
    });

    it('should return no lessons for school without any', async () => {
      const response = await authGet('/api/v1/lessons', admin2Token);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it('should allow teacher access', async () => {
      const response = await authGet('/api/v1/lessons', teacher1Token);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by termId', async () => {
      const response = await request(app)
        .get('/api/v1/lessons')
        .query({ termId: term1Id })
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((lesson: { termId: string }) => {
        expect(lesson.termId).toBe(term1Id);
      });
    });

    it('should filter by dayOfWeek', async () => {
      const response = await request(app)
        .get('/api/v1/lessons')
        .query({ dayOfWeek: 1 })
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((lesson: { dayOfWeek: number }) => {
        expect(lesson.dayOfWeek).toBe(1);
      });
    });
  });

  describe('GET /api/v1/lessons/:id', () => {
    it('should return lesson for owner school', async () => {
      const response = await authGet(`/api/v1/lessons/${lesson1Id}`, admin1Token);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(lesson1Id);
    });

    it('should return 404 for lesson from different school (multi-tenancy)', async () => {
      const response = await authGet(`/api/v1/lessons/${lesson1Id}`, admin2Token);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/lessons/:id', () => {
    it('should update lesson for owner school', async () => {
      const response = await authRequest('patch', `/api/v1/lessons/${lesson1Id}`, admin1Token)
        .send({ name: 'Updated Monday Piano' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Monday Piano');
    });

    it('should not update lesson from different school', async () => {
      const response = await authRequest('patch', `/api/v1/lessons/${lesson1Id}`, admin2Token)
        .send({ name: 'Hacked Lesson' });

      expect(response.status).toBe(404);
    });

    it('should require admin role', async () => {
      const response = await authRequest('patch', `/api/v1/lessons/${lesson1Id}`, teacher1Token)
        .send({ name: 'Teacher Updated' });

      expect(response.status).toBe(403);
    });
  });

  describe('Enrollment Operations', () => {
    describe('POST /api/v1/lessons/:id/enrollments', () => {
      it('should enroll a student', async () => {
        const response = await authRequest('post', `/api/v1/lessons/${lesson1Id}/enrollments`, admin1Token)
          .send({ studentId: student1Id });

        expect(response.status).toBe(201);
        expect(response.body.data.studentId).toBe(student1Id);
        expect(response.body.data.lessonId).toBe(lesson1Id);
      });

      it('should reject duplicate enrollment', async () => {
        const response = await authRequest('post', `/api/v1/lessons/${lesson1Id}/enrollments`, admin1Token)
          .send({ studentId: student1Id });

        expect(response.status).toBe(409);
      });

      it('should enforce capacity limits', async () => {
        // Lesson 1 has maxStudents: 1, already has student1
        const response = await authRequest('post', `/api/v1/lessons/${lesson1Id}/enrollments`, admin1Token)
          .send({ studentId: student2Id });

        expect(response.status).toBe(409);
        expect(response.body.message).toContain('capacity');
      });
    });

    describe('POST /api/v1/lessons/:id/enrollments/bulk', () => {
      it('should bulk enroll students', async () => {
        // Use the hybrid lesson which has higher capacity (maxStudents: 5)
        const hybridLessons = await authGet('/api/v1/lessons', admin1Token);
        const hybridLesson = hybridLessons.body.data?.find(
          (l: { lessonTypeId: string }) => l.lessonTypeId === lessonTypeHybridId
        );

        if (hybridLesson) {
          const response = await authRequest('post', `/api/v1/lessons/${hybridLesson.id}/enrollments/bulk`, admin1Token)
            .send({ studentIds: [student1Id, student2Id] });

          expect(response.status).toBe(201);
          expect(response.body.data.length).toBe(2);
        }
      });
    });

    describe('GET /api/v1/lessons/:id/enrollments', () => {
      it('should return enrollments for lesson', async () => {
        const response = await authGet(`/api/v1/lessons/${lesson1Id}/enrollments`, admin1Token);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      });

      it('should return 404 for lesson from different school', async () => {
        const response = await authGet(`/api/v1/lessons/${lesson1Id}/enrollments`, admin2Token);

        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /api/v1/lessons/:id/enrollments/:studentId', () => {
      it('should unenroll a student', async () => {
        const response = await authRequest('delete', `/api/v1/lessons/${lesson1Id}/enrollments/${student1Id}`, admin1Token);

        expect(response.status).toBe(200);

        // Verify student is no longer enrolled
        const enrollments = await authGet(`/api/v1/lessons/${lesson1Id}/enrollments`, admin1Token);

        const stillEnrolled = enrollments.body.data.find(
          (e: { studentId: string }) => e.studentId === student1Id
        );
        expect(stillEnrolled).toBeUndefined();
      });
    });

    describe('GET /api/v1/lessons/:id/capacity', () => {
      it('should return capacity info', async () => {
        const response = await authGet(`/api/v1/lessons/${lesson1Id}/capacity`, admin1Token);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('current');
        expect(response.body.data).toHaveProperty('max');
        expect(response.body.data).toHaveProperty('available');
      });
    });
  });

  describe('Availability Checks', () => {
    describe('GET /api/v1/lessons/check/room-availability', () => {
      it('should return available when no conflict', async () => {
        const response = await request(app)
          .get('/api/v1/lessons/check/room-availability')
          .query({
            roomId: room1Id,
            dayOfWeek: 5, // Friday - no lessons
            startTime: '09:00',
            endTime: '09:45',
          })
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.available).toBe(true);
      });

      it('should return unavailable when conflict exists', async () => {
        const response = await request(app)
          .get('/api/v1/lessons/check/room-availability')
          .query({
            roomId: room1Id,
            dayOfWeek: 1, // Monday - has lesson1
            startTime: '09:00',
            endTime: '09:45',
          })
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.available).toBe(false);
      });
    });

    describe('GET /api/v1/lessons/check/teacher-availability', () => {
      it('should return available when no conflict', async () => {
        const response = await request(app)
          .get('/api/v1/lessons/check/teacher-availability')
          .query({
            teacherId: teacher1Id,
            dayOfWeek: 5, // Friday - no lessons
            startTime: '09:00',
            endTime: '09:45',
          })
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.available).toBe(true);
      });

      it('should return unavailable when conflict exists', async () => {
        const response = await request(app)
          .get('/api/v1/lessons/check/teacher-availability')
          .query({
            teacherId: teacher1Id,
            dayOfWeek: 1, // Monday - has lesson1
            startTime: '09:00',
            endTime: '09:45',
          })
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.available).toBe(false);
      });
    });
  });

  describe('DELETE /api/v1/lessons/:id', () => {
    it('should soft delete lesson for owner school', async () => {
      const response = await authRequest('delete', `/api/v1/lessons/${lesson1Id}`, admin1Token);

      expect(response.status).toBe(200);

      // Verify lesson is inactive
      const lesson = await authGet(`/api/v1/lessons/${lesson1Id}`, admin1Token);

      expect(lesson.body.data.isActive).toBe(false);
    });

    it('should not delete lesson from different school', async () => {
      const response = await authRequest('delete', `/api/v1/lessons/${lesson1Id}`, admin2Token);

      expect(response.status).toBe(404);
    });
  });
});
