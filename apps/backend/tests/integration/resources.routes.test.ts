// ===========================================
// Resources Routes Integration Tests
// ===========================================
// Tests for file upload and resource management functionality
// CRITICAL: Tests verify multi-tenancy security (schoolId filtering)

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';

// Create test app without CSRF protection for integration tests
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Import individual route modules to avoid CSRF protection
  const authRoutes = require('../../src/routes/auth.routes').default;
  const resourcesRoutes = require('../../src/routes/resources.routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  // Mount routes without CSRF
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/resources', resourcesRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

// Test data - use unique slugs with timestamp to avoid collisions
const testId = Date.now();
const TEST_SCHOOL_1 = {
  name: 'Resources Test School 1',
  slug: `resources-test-school-1-${testId}`,
  email: `resources-test1-${testId}@testschool.com`,
};

const TEST_SCHOOL_2 = {
  name: 'Resources Test School 2',
  slug: `resources-test-school-2-${testId}`,
  email: `resources-test2-${testId}@testschool.com`,
};

const TEACHER_USER = {
  email: `resources-teacher-${testId}@testschool.com`,
  password: 'TeacherPass123!',
  firstName: 'Resources',
  lastName: 'Teacher',
};

const ADMIN_USER = {
  email: `resources-admin-${testId}@testschool.com`,
  password: 'AdminPassword123!',
  firstName: 'Resources',
  lastName: 'Admin',
};

const PARENT_USER = {
  email: `resources-parent-${testId}@testschool.com`,
  password: 'ParentPass123!',
  firstName: 'Resources',
  lastName: 'Parent',
};

describe('Resources Routes Integration Tests', () => {
  let school1Id: string;
  let school2Id: string;
  let teacherToken: string;
  let adminToken: string;
  let parentToken: string;
  let lessonId: string;
  let studentId: string;
  let teacherId: string;
  let resourceId: string;

  const app = createTestApp();

  // Helper functions
  const authPost = (url: string, token: string) => {
    return request(app).post(url).set('Authorization', `Bearer ${token}`);
  };

  const authGet = (url: string, token: string) => {
    return request(app).get(url).set('Authorization', `Bearer ${token}`);
  };

  const authPatch = (url: string, token: string, body: object) => {
    return request(app).patch(url).set('Authorization', `Bearer ${token}`).send(body);
  };

  const authDelete = (url: string, token: string) => {
    return request(app).delete(url).set('Authorization', `Bearer ${token}`);
  };

  // Create a test file buffer
  const createTestFile = (content: string = 'Test file content') => {
    return Buffer.from(content);
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
    teacherId = teacher.id;

    // Create parent user for school1
    const hashedParentPassword = await bcrypt.hash(PARENT_USER.password, 10);
    await prisma.user.create({
      data: {
        email: PARENT_USER.email,
        passwordHash: hashedParentPassword,
        firstName: PARENT_USER.firstName,
        lastName: PARENT_USER.lastName,
        role: 'PARENT',
        schoolId: school1Id,
        isActive: true,
        emailVerified: true,
      },
    });

    // Create a term
    const term = await prisma.term.create({
      data: {
        name: 'Resources Test Term',
        schoolId: school1Id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        isActive: true,
      },
    });

    // Create a location and room
    const location = await prisma.location.create({
      data: {
        name: 'Resources Test Location',
        schoolId: school1Id,
        address: '123 Test St',
      },
    });

    const room = await prisma.room.create({
      data: {
        name: 'Resources Test Room',
        locationId: location.id,
        capacity: 10,
      },
    });

    // Create lesson type
    const lessonType = await prisma.lessonType.create({
      data: {
        name: 'Resources Test Group',
        type: 'GROUP',
        schoolId: school1Id,
        defaultDuration: 60,
      },
    });

    // Create a lesson
    const lesson = await prisma.lesson.create({
      data: {
        name: 'Resources Test Lesson',
        schoolId: school1Id,
        termId: term.id,
        teacherId,
        roomId: room.id,
        lessonTypeId: lessonType.id,
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '11:00',
        durationMins: 60,
        maxStudents: 10,
      },
    });
    lessonId = lesson.id;

    // Create a student
    const student = await prisma.student.create({
      data: {
        firstName: 'Resources',
        lastName: 'Student',
        schoolId: school1Id,
        ageGroup: 'KIDS',
        birthDate: new Date('2015-01-01'),
      },
    });
    studentId = student.id;

    // Enroll student
    await prisma.lessonEnrollment.create({
      data: { lessonId, studentId },
    });

    // Login to get tokens
    const teacherLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEACHER_USER.email, password: TEACHER_USER.password });
    teacherToken = teacherLoginRes.body.data.accessToken;

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_USER.email, password: ADMIN_USER.password });
    adminToken = adminLoginRes.body.data.accessToken;

    const parentLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: PARENT_USER.email, password: PARENT_USER.password });
    parentToken = parentLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // Only clean up if schools were created
    const schoolIds = [school1Id, school2Id].filter(Boolean);
    if (schoolIds.length === 0) {
      await prisma.$disconnect();
      return;
    }

    // Clean up uploaded test files
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    if (school1Id) {
      const testUploadPath = path.join(uploadDir, school1Id);
      if (fs.existsSync(testUploadPath)) {
        fs.rmSync(testUploadPath, { recursive: true, force: true });
      }
    }
    if (school2Id) {
      const testUploadPath2 = path.join(uploadDir, school2Id);
      if (fs.existsSync(testUploadPath2)) {
        fs.rmSync(testUploadPath2, { recursive: true, force: true });
      }
    }

    // Clean up test data (delete in correct order to respect foreign keys)
    // Delete resources first
    await prisma.resource.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // Delete lesson enrollments
    await prisma.lessonEnrollment.deleteMany({ where: { lesson: { schoolId: { in: schoolIds } } } });
    // Delete lessons (references teachers)
    await prisma.lesson.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // Now we can delete teachers (after lessons are gone)
    await prisma.teacher.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // Delete lesson types
    await prisma.lessonType.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // Delete rooms (references locations)
    await prisma.room.deleteMany({ where: { location: { schoolId: { in: schoolIds } } } });
    // Delete locations
    await prisma.location.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // Delete terms
    await prisma.term.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // Delete students
    await prisma.student.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // Delete users
    await prisma.user.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // Finally delete schools
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
    await prisma.$disconnect();
  });

  describe('POST /resources', () => {
    it('should allow teacher to upload a resource for a lesson', async () => {
      const res = await authPost('/api/v1/resources', teacherToken)
        .field('lessonId', lessonId)
        .field('visibility', 'ALL')
        .field('tags', JSON.stringify(['test', 'music']))
        .attach('file', createTestFile('Test PDF content'), {
          filename: 'test-document.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.fileName).toBe('test-document.pdf');
      expect(res.body.data.visibility).toBe('ALL');
      expect(res.body.data.lessonId).toBe(lessonId);
      resourceId = res.body.data.id;
    });

    it('should allow teacher to upload a resource for a student', async () => {
      const res = await authPost('/api/v1/resources', teacherToken)
        .field('studentId', studentId)
        .field('visibility', 'TEACHERS_AND_PARENTS')
        .attach('file', createTestFile('Student specific content'), {
          filename: 'student-notes.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.studentId).toBe(studentId);
      expect(res.body.data.visibility).toBe('TEACHERS_AND_PARENTS');
    });

    it('should reject invalid file types', async () => {
      const res = await authPost('/api/v1/resources', teacherToken)
        .field('lessonId', lessonId)
        .attach('file', createTestFile('Executable content'), {
          filename: 'malicious.exe',
          contentType: 'application/x-msdownload',
        });

      expect(res.status).toBe(400);
    });

    it('should reject files that are too large', async () => {
      // Create a buffer larger than 25MB
      const largeContent = 'x'.repeat(26 * 1024 * 1024);
      const res = await authPost('/api/v1/resources', teacherToken)
        .field('lessonId', lessonId)
        .attach('file', Buffer.from(largeContent), {
          filename: 'large-file.pdf',
          contentType: 'application/pdf',
        });

      // Should reject with 400 or 413 (payload too large) or 500 (internal error from multer)
      expect([400, 413, 500]).toContain(res.status);
    });

    it('should allow admin to upload resources', async () => {
      const res = await authPost('/api/v1/resources', adminToken)
        .field('lessonId', lessonId)
        .field('visibility', 'TEACHERS_ONLY')
        .attach('file', createTestFile('Admin upload'), {
          filename: 'admin-document.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.visibility).toBe('TEACHERS_ONLY');
    });
  });

  describe('GET /resources/lesson/:lessonId', () => {
    it('should return resources for a lesson', async () => {
      const res = await authGet(`/api/v1/resources/lesson/${lessonId}`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter resources by visibility for parents', async () => {
      const res = await authGet(`/api/v1/resources/lesson/${lessonId}`, parentToken);

      expect(res.status).toBe(200);
      // Parents should not see TEACHERS_ONLY resources
      const teachersOnlyResources = res.body.data.filter(
        (r: { visibility: string }) => r.visibility === 'TEACHERS_ONLY'
      );
      expect(teachersOnlyResources.length).toBe(0);
    });
  });

  describe('GET /resources/student/:studentId', () => {
    it('should return resources for a student', async () => {
      const res = await authGet(`/api/v1/resources/student/${studentId}`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /resources/:id', () => {
    it('should return a single resource', async () => {
      const res = await authGet(`/api/v1/resources/${resourceId}`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(resourceId);
    });
  });

  describe('PATCH /resources/:id', () => {
    it('should allow teacher to update resource visibility', async () => {
      const res = await authPatch(`/api/v1/resources/${resourceId}`, teacherToken, {
        visibility: 'TEACHERS_AND_PARENTS',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.visibility).toBe('TEACHERS_AND_PARENTS');
    });

    it('should allow updating tags', async () => {
      const res = await authPatch(`/api/v1/resources/${resourceId}`, teacherToken, {
        tags: ['updated', 'tags'],
      });

      expect(res.status).toBe(200);
      const tags = JSON.parse(res.body.data.tags);
      expect(tags).toContain('updated');
    });
  });

  describe('GET /resources/:id/download', () => {
    it('should allow downloading a resource', async () => {
      const res = await authGet(`/api/v1/resources/${resourceId}/download`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('GET /resources/stats', () => {
    it('should return resource statistics', async () => {
      const res = await authGet('/api/v1/resources/stats', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('totalResources');
      expect(res.body.data).toHaveProperty('totalSize');
      expect(res.body.data).toHaveProperty('byType');
    });
  });

  describe('Multi-tenancy security', () => {
    let school2ResourceId: string;
    let school2LessonId: string;
    let school2StudentId: string;

    beforeAll(async () => {
      // Create data in school2
      const school2Teacher = await prisma.user.create({
        data: {
          email: `school2-res-teacher-${testId}@testschool.com`,
          passwordHash: await bcrypt.hash('School2Pass123!', 10),
          firstName: 'School2',
          lastName: 'Teacher',
          role: 'TEACHER',
          schoolId: school2Id,
          isActive: true,
          emailVerified: true,
        },
      });

      const teacher2 = await prisma.teacher.create({
        data: {
          userId: school2Teacher.id,
          schoolId: school2Id,
        },
      });

      const location2 = await prisma.location.create({
        data: { name: 'School2 Location', schoolId: school2Id, address: '456 Other St' },
      });

      const room2 = await prisma.room.create({
        data: { name: 'School2 Room', locationId: location2.id, capacity: 10 },
      });

      const term2 = await prisma.term.create({
        data: {
          name: 'School2 Term',
          schoolId: school2Id,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          isActive: true,
        },
      });

      const lessonType2 = await prisma.lessonType.create({
        data: {
          name: 'School2 Group',
          type: 'GROUP',
          schoolId: school2Id,
          defaultDuration: 60,
        },
      });

      const lesson2 = await prisma.lesson.create({
        data: {
          name: 'School2 Lesson',
          schoolId: school2Id,
          termId: term2.id,
          teacherId: teacher2.id,
          roomId: room2.id,
          lessonTypeId: lessonType2.id,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          durationMins: 60,
          maxStudents: 10,
        },
      });
      school2LessonId = lesson2.id;

      const student2 = await prisma.student.create({
        data: {
          firstName: 'School2',
          lastName: 'Student',
          schoolId: school2Id,
          ageGroup: 'KIDS',
          birthDate: new Date('2015-06-15'),
        },
      });
      school2StudentId = student2.id;

      // Create a resource in school2 directly in DB
      const resource2 = await prisma.resource.create({
        data: {
          schoolId: school2Id,
          uploadedById: school2Teacher.id,
          lessonId: school2LessonId,
          fileName: 'school2-resource.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          filePath: `${school2Id}/test-file.pdf`,
          visibility: 'ALL',
          tags: '[]',
          syncStatus: 'synced',
        },
      });
      school2ResourceId = resource2.id;
    });

    it('should not return resources from another school', async () => {
      const res = await authGet(`/api/v1/resources/${school2ResourceId}`, teacherToken);

      // Should return 404 or null, not the resource
      expect(res.status === 404 || res.body.data === null).toBe(true);
    });

    it('should not return lesson resources from another school', async () => {
      const res = await authGet(`/api/v1/resources/lesson/${school2LessonId}`, teacherToken);

      // Should return 404 or empty array
      expect(res.status === 404 || (res.status === 200 && res.body.data.length === 0)).toBe(true);
    });

    it('should not return student resources from another school', async () => {
      const res = await authGet(`/api/v1/resources/student/${school2StudentId}`, teacherToken);

      // Should return 404 or empty array
      expect(res.status === 404 || (res.status === 200 && res.body.data.length === 0)).toBe(true);
    });

    it('should not allow downloading resources from another school', async () => {
      const res = await authGet(`/api/v1/resources/${school2ResourceId}/download`, teacherToken);

      // Should return 404, not the file
      expect(res.status).toBe(404);
    });

    it('should not allow updating resources from another school', async () => {
      const res = await authPatch(`/api/v1/resources/${school2ResourceId}`, teacherToken, {
        visibility: 'TEACHERS_ONLY',
      });

      // Should return 404
      expect(res.status).toBe(404);
    });

    it('should not allow deleting resources from another school', async () => {
      const res = await authDelete(`/api/v1/resources/${school2ResourceId}`, teacherToken);

      // Should return 404
      expect(res.status).toBe(404);

      // Verify resource still exists
      const resourceStillExists = await prisma.resource.findUnique({
        where: { id: school2ResourceId },
      });
      expect(resourceStillExists).not.toBeNull();
    });
  });

  describe('DELETE /resources/:id', () => {
    it('should allow teacher to delete their resource', async () => {
      const res = await authDelete(`/api/v1/resources/${resourceId}`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });
});
