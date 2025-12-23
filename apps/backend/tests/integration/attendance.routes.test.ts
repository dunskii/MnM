// ===========================================
// Attendance Routes Integration Tests
// ===========================================
// Tests for attendance marking functionality
// CRITICAL: Tests verify multi-tenancy security (schoolId filtering)

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
  const attendanceRoutes = require('../../src/routes/attendance.routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  // Mount routes without CSRF
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/attendance', attendanceRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

// Test data
const TEST_SCHOOL_1 = {
  name: 'Attendance Test School 1',
  slug: 'attendance-test-school-1',
  email: 'attendance-test1@testschool.com',
};

const TEST_SCHOOL_2 = {
  name: 'Attendance Test School 2',
  slug: 'attendance-test-school-2',
  email: 'attendance-test2@testschool.com',
};

const TEACHER_USER = {
  email: 'attendance-teacher@testschool.com',
  password: 'TeacherPass123!',
  firstName: 'Test',
  lastName: 'Teacher',
};

const ADMIN_USER = {
  email: 'attendance-admin@testschool.com',
  password: 'AdminPassword123!',
  firstName: 'Attendance',
  lastName: 'Admin',
};

describe('Attendance Routes Integration Tests', () => {
  let school1Id: string;
  let school2Id: string;
  let teacherToken: string;
  let lessonId: string;
  let student1Id: string;
  let student2Id: string;
  let locationId: string;

  const app = createTestApp();

  // Helper functions
  const authPost = (url: string, token: string, body?: object) => {
    const req = request(app).post(url).set('Authorization', `Bearer ${token}`);
    return body ? req.send(body) : req;
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

    // Create admin user for school1
    const hashedAdminPassword = await bcrypt.hash(ADMIN_USER.password, 10);
    await prisma.user.create({
      data: {
        email: ADMIN_USER.email,
        passwordHash: hashedAdminPassword,
        firstName: ADMIN_USER.firstName,
        lastName: ADMIN_USER.lastName,
        role: 'ADMIN',
        schoolId: school1Id,
        isActive: true,
        emailVerified: true,
      },
    });

    // Create teacher user for school1
    const hashedTeacherPassword = await bcrypt.hash(TEACHER_USER.password, 10);
    const teacherUser = await prisma.user.create({
      data: {
        email: TEACHER_USER.email,
        passwordHash: hashedTeacherPassword,
        firstName: TEACHER_USER.firstName,
        lastName: TEACHER_USER.lastName,
        role: 'TEACHER',
        schoolId: school1Id,
        isActive: true,
        emailVerified: true,
      },
    });

    // Create teacher record
    const teacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        schoolId: school1Id,
      },
    });

    // Create a term
    const term = await prisma.term.create({
      data: {
        name: 'Test Term',
        schoolId: school1Id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        isActive: true,
      },
    });

    // Create a location and room
    const location = await prisma.location.create({
      data: {
        name: 'Test Location',
        schoolId: school1Id,
        address: '123 Test St',
      },
    });
    locationId = location.id;

    const room = await prisma.room.create({
      data: {
        name: 'Test Room',
        locationId: location.id,
        capacity: 10,
      },
    });

    // Create lesson type
    const lessonType = await prisma.lessonType.create({
      data: {
        name: 'Test Group',
        type: 'GROUP',
        schoolId: school1Id,
        defaultDuration: 60,
      },
    });

    // Create a lesson
    const lesson = await prisma.lesson.create({
      data: {
        name: 'Test Lesson',
        schoolId: school1Id,
        termId: term.id,
        teacherId: teacher.id,
        roomId: room.id,
        lessonTypeId: lessonType.id,
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:00',
        durationMins: 60,
        maxStudents: 10,
      },
    });
    lessonId = lesson.id;

    // Create students
    const student1 = await prisma.student.create({
      data: {
        firstName: 'Test',
        lastName: 'Student1',
        schoolId: school1Id,
        ageGroup: 'KIDS',
        birthDate: new Date('2015-01-01'),
      },
    });
    student1Id = student1.id;

    const student2 = await prisma.student.create({
      data: {
        firstName: 'Test',
        lastName: 'Student2',
        schoolId: school1Id,
        ageGroup: 'KIDS',
        birthDate: new Date('2015-06-15'),
      },
    });
    student2Id = student2.id;

    // Enroll students in lesson
    await prisma.lessonEnrollment.createMany({
      data: [
        { lessonId, studentId: student1Id },
        { lessonId, studentId: student2Id },
      ],
    });

    // Login to get tokens
    const teacherLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEACHER_USER.email, password: TEACHER_USER.password });
    teacherToken = teacherLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data (delete in correct order to respect foreign keys)
    await prisma.attendance.deleteMany({ where: { lesson: { schoolId: school1Id } } });
    await prisma.lessonEnrollment.deleteMany({ where: { lesson: { schoolId: school1Id } } });
    await prisma.lesson.deleteMany({ where: { schoolId: school1Id } });
    await prisma.lessonType.deleteMany({ where: { schoolId: school1Id } });
    await prisma.room.deleteMany({ where: { locationId } });
    await prisma.location.deleteMany({ where: { schoolId: school1Id } });
    await prisma.term.deleteMany({ where: { schoolId: school1Id } });
    await prisma.student.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.teacher.deleteMany({ where: { schoolId: school1Id } });
    await prisma.user.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.school.deleteMany({ where: { id: { in: [school1Id, school2Id] } } });
    await prisma.$disconnect();
  });

  describe('POST /attendance', () => {
    it('should allow teacher to mark attendance', async () => {
      const res = await authPost('/api/v1/attendance', teacherToken, {
        lessonId,
        studentId: student1Id,
        date: '2024-01-08',
        status: 'PRESENT',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('PRESENT');
    });

    it('should require absence reason for ABSENT status', async () => {
      const res = await authPost('/api/v1/attendance', teacherToken, {
        lessonId,
        studentId: student2Id,
        date: '2024-01-08',
        status: 'ABSENT',
      });

      expect(res.status).toBe(400);
    });

    it('should accept absence reason for ABSENT status', async () => {
      const res = await authPost('/api/v1/attendance', teacherToken, {
        lessonId,
        studentId: student2Id,
        date: '2024-01-08',
        status: 'ABSENT',
        absenceReason: 'Sick',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('ABSENT');
      expect(res.body.data.absenceReason).toBe('Sick');
    });
  });

  describe('POST /attendance/batch', () => {
    it('should allow batch marking attendance', async () => {
      const res = await authPost('/api/v1/attendance/batch', teacherToken, {
        lessonId,
        date: '2024-01-15',
        attendances: [
          { studentId: student1Id, status: 'PRESENT' },
          { studentId: student2Id, status: 'LATE' },
        ],
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /attendance/lesson/:lessonId', () => {
    it('should return attendance for a lesson', async () => {
      const res = await authGet(`/api/v1/attendance/lesson/${lessonId}?date=2024-01-15`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /attendance/lesson/:lessonId/students', () => {
    it('should return enrolled students with attendance', async () => {
      const res = await authGet(`/api/v1/attendance/lesson/${lessonId}/students?date=2024-01-15`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.students).toHaveLength(2);
    });
  });

  describe('GET /attendance/student/:studentId', () => {
    it('should return attendance history for a student', async () => {
      const res = await authGet(`/api/v1/attendance/student/${student1Id}`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /attendance/student/:studentId/stats', () => {
    it('should return attendance statistics for a student', async () => {
      const res = await authGet(`/api/v1/attendance/student/${student1Id}/stats`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('totalSessions');
      expect(res.body.data).toHaveProperty('attendanceRate');
    });
  });

  describe('Multi-tenancy security', () => {
    it('should not return attendance from another school', async () => {
      // Create data in school2
      const school2Student = await prisma.student.create({
        data: {
          firstName: 'School2',
          lastName: 'Student',
          schoolId: school2Id,
          ageGroup: 'KIDS',
          birthDate: new Date('2015-03-20'),
        },
      });

      // Try to access school2 student from school1 teacher
      const res = await authGet(`/api/v1/attendance/student/${school2Student.id}`, teacherToken);

      // Should return empty or 404, not the data
      expect(res.status === 200 && res.body.data.length === 0 || res.status === 404).toBe(true);

      // Cleanup
      await prisma.student.delete({ where: { id: school2Student.id } });
    });
  });
});
