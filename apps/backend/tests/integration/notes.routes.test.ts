// ===========================================
// Notes Routes Integration Tests
// ===========================================
// Tests for teacher notes functionality
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
  const notesRoutes = require('../../src/routes/notes.routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  // Mount routes without CSRF
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/notes', notesRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

// Test data
const TEST_SCHOOL_1 = {
  name: 'Notes Test School 1',
  slug: 'notes-test-school-1',
  email: 'notes-test1@testschool.com',
};

const TEST_SCHOOL_2 = {
  name: 'Notes Test School 2',
  slug: 'notes-test-school-2',
  email: 'notes-test2@testschool.com',
};

const TEACHER_USER = {
  email: 'notes-teacher@testschool.com',
  password: 'TeacherPass123!',
  firstName: 'Notes',
  lastName: 'Teacher',
};

const ADMIN_USER = {
  email: 'notes-admin@testschool.com',
  password: 'AdminPassword123!',
  firstName: 'Notes',
  lastName: 'Admin',
};

describe('Notes Routes Integration Tests', () => {
  let school1Id: string;
  let school2Id: string;
  let teacherToken: string;
  let lessonId: string;
  let studentId: string;
  let teacherId: string;
  let classNoteId: string;
  let studentNoteId: string;

  const app = createTestApp();

  // Helper functions
  const authPost = (url: string, token: string, body?: object) => {
    const req = request(app).post(url).set('Authorization', `Bearer ${token}`);
    return body ? req.send(body) : req;
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

  beforeAll(async () => {
    // Clear any existing login attempts
    await prisma.loginAttempt.deleteMany({});

    // Create schools
    const school1 = await prisma.school.create({ data: TEST_SCHOOL_1 });
    const school2 = await prisma.school.create({ data: TEST_SCHOOL_2 });
    school1Id = school1.id;
    school2Id = school2.id;

    // Create admin user
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

    // Create teacher user
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

    // Create a term
    const term = await prisma.term.create({
      data: {
        name: 'Notes Test Term',
        schoolId: school1Id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        isActive: true,
      },
    });

    // Create location, room, and lesson type
    const location = await prisma.location.create({
      data: { name: 'Notes Test Location', schoolId: school1Id, address: '123 Test St' },
    });

    const room = await prisma.room.create({
      data: { name: 'Notes Test Room', locationId: location.id, capacity: 10 },
    });

    const lessonType = await prisma.lessonType.create({
      data: { name: 'Notes Test Group', type: 'GROUP', schoolId: school1Id, defaultDuration: 60 },
    });

    // Create a lesson
    const lesson = await prisma.lesson.create({
      data: {
        name: 'Notes Test Lesson',
        schoolId: school1Id,
        termId: term.id,
        teacherId,
        roomId: room.id,
        lessonTypeId: lessonType.id,
        dayOfWeek: 2,
        startTime: '14:00',
        endTime: '15:00',
        durationMins: 60,
        maxStudents: 10,
      },
    });
    lessonId = lesson.id;

    // Create a student
    const student = await prisma.student.create({
      data: {
        firstName: 'Notes',
        lastName: 'Student',
        schoolId: school1Id,
        ageGroup: 'KIDS',
        birthDate: new Date('2015-05-10'),
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
  });

  afterAll(async () => {
    // Clean up test data (delete in correct order to respect foreign keys)
    await prisma.note.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.lessonEnrollment.deleteMany({ where: { lesson: { schoolId: { in: [school1Id, school2Id] } } } });
    await prisma.lesson.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.lessonType.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.room.deleteMany({ where: { location: { schoolId: { in: [school1Id, school2Id] } } } });
    await prisma.location.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.term.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.student.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.teacher.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.user.deleteMany({ where: { schoolId: { in: [school1Id, school2Id] } } });
    await prisma.school.deleteMany({ where: { id: { in: [school1Id, school2Id] } } });
    await prisma.$disconnect();
  });

  describe('POST /notes', () => {
    it('should create a class note', async () => {
      const res = await authPost('/api/v1/notes', teacherToken, {
        lessonId,
        date: '2024-01-09',
        content: 'Class covered scales and arpeggios.',
        isPrivate: false,
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.content).toBe('Class covered scales and arpeggios.');
      expect(res.body.data.lessonId).toBe(lessonId);
      expect(res.body.data.studentId).toBeNull();
      classNoteId = res.body.data.id;
    });

    it('should create a student note', async () => {
      const res = await authPost('/api/v1/notes', teacherToken, {
        lessonId,
        studentId,
        date: '2024-01-09',
        content: 'Student showed great progress on rhythm exercises.',
        isPrivate: false,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.studentId).toBe(studentId);
      studentNoteId = res.body.data.id;
    });

    it('should create a private note', async () => {
      const res = await authPost('/api/v1/notes', teacherToken, {
        lessonId,
        date: '2024-01-09',
        content: 'Teacher-only observation.',
        isPrivate: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.isPrivate).toBe(true);
    });

    it('should require lessonId or studentId', async () => {
      const res = await authPost('/api/v1/notes', teacherToken, {
        date: '2024-01-09',
        content: 'This should fail.',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /notes/lesson/:lessonId', () => {
    it('should return notes for a lesson', async () => {
      const res = await authGet(`/api/v1/notes/lesson/${lessonId}?date=2024-01-09`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /notes/lesson/:lessonId/completion', () => {
    it('should return completion status for a lesson', async () => {
      const res = await authGet(`/api/v1/notes/lesson/${lessonId}/completion?date=2024-01-09`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('classNoteComplete');
      expect(res.body.data).toHaveProperty('studentNotesComplete');
      expect(res.body.data).toHaveProperty('status');
    });
  });

  describe('GET /notes/student/:studentId', () => {
    it('should return notes for a student', async () => {
      const res = await authGet(`/api/v1/notes/student/${studentId}`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /notes/:id', () => {
    it('should update a note', async () => {
      const res = await authPatch(`/api/v1/notes/${classNoteId}`, teacherToken, {
        content: 'Updated content for the class note.',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Updated content for the class note.');
    });

    it('should update privacy setting', async () => {
      const res = await authPatch(`/api/v1/notes/${classNoteId}`, teacherToken, {
        isPrivate: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.isPrivate).toBe(true);
    });
  });

  describe('GET /notes/teacher/:teacherId/weekly', () => {
    it('should return weekly completion summary', async () => {
      const res = await authGet(`/api/v1/notes/teacher/${teacherId}/weekly`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('overallCompletionRate');
      expect(res.body.data).toHaveProperty('lessons');
    });
  });

  describe('GET /notes/teacher/:teacherId/pending', () => {
    it('should return pending notes count', async () => {
      const res = await authGet(`/api/v1/notes/teacher/${teacherId}/pending`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('totalPending');
    });
  });

  describe('DELETE /notes/:id', () => {
    it('should delete a note', async () => {
      const res = await authDelete(`/api/v1/notes/${studentNoteId}`, teacherToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  describe('Multi-tenancy security', () => {
    let school2NoteId: string;
    let school2LessonId: string;
    let school2StudentId: string;
    let school2TeacherId: string;

    beforeAll(async () => {
      // Create data in school2
      const school2Teacher = await prisma.user.create({
        data: {
          email: 'school2-notes-teacher@testschool.com',
          passwordHash: await bcrypt.hash('School2Pass123!', 10),
          firstName: 'School2',
          lastName: 'NotesTeacher',
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
      school2TeacherId = teacher2.id;

      const location2 = await prisma.location.create({
        data: { name: 'School2 Notes Location', schoolId: school2Id, address: '456 Other St' },
      });

      const room2 = await prisma.room.create({
        data: { name: 'School2 Notes Room', locationId: location2.id, capacity: 10 },
      });

      const term2 = await prisma.term.create({
        data: {
          name: 'School2 Notes Term',
          schoolId: school2Id,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          isActive: true,
        },
      });

      const lessonType2 = await prisma.lessonType.create({
        data: {
          name: 'School2 Notes Group',
          type: 'GROUP',
          schoolId: school2Id,
          defaultDuration: 60,
        },
      });

      const lesson2 = await prisma.lesson.create({
        data: {
          name: 'School2 Notes Lesson',
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
          lastName: 'NotesStudent',
          schoolId: school2Id,
          ageGroup: 'KIDS',
          birthDate: new Date('2015-06-15'),
        },
      });
      school2StudentId = student2.id;

      // Enroll student in lesson
      await prisma.lessonEnrollment.create({
        data: { lessonId: school2LessonId, studentId: school2StudentId },
      });

      // Create a note in school2 directly in DB
      const note2 = await prisma.note.create({
        data: {
          schoolId: school2Id,
          authorId: school2Teacher.id,
          lessonId: school2LessonId,
          date: new Date('2024-01-10'),
          content: 'School 2 confidential note content',
          isPrivate: false,
          status: 'COMPLETE',
        },
      });
      school2NoteId = note2.id;
    });

    it('should not return notes from another school when getting by id', async () => {
      const res = await authGet(`/api/v1/notes/${school2NoteId}`, teacherToken);

      // Should return 404 or null, not the note
      expect(res.status === 404 || res.body.data === null).toBe(true);
    });

    it('should not return lesson notes from another school', async () => {
      const res = await authGet(`/api/v1/notes/lesson/${school2LessonId}`, teacherToken);

      // Should return 404 or empty array
      expect(res.status === 404 || (res.status === 200 && res.body.data.length === 0)).toBe(true);
    });

    it('should not return student notes from another school', async () => {
      const res = await authGet(`/api/v1/notes/student/${school2StudentId}`, teacherToken);

      // Should return 404 or empty array
      expect(res.status === 404 || (res.status === 200 && res.body.data.length === 0)).toBe(true);
    });

    it('should not return lesson completion status from another school', async () => {
      const res = await authGet(`/api/v1/notes/lesson/${school2LessonId}/completion?date=2024-01-10`, teacherToken);

      // Should return 404
      expect(res.status).toBe(404);
    });

    it('should not return weekly summary from another school', async () => {
      const res = await authGet(`/api/v1/notes/teacher/${school2TeacherId}/weekly`, teacherToken);

      // Should return 403 (forbidden - teacher belongs to different school) or 404
      expect([403, 404]).toContain(res.status);
    });

    it('should not allow updating notes from another school', async () => {
      const res = await authPatch(`/api/v1/notes/${school2NoteId}`, teacherToken, {
        content: 'Attempted modification',
      });

      // Should return 404
      expect(res.status).toBe(404);

      // Verify note content unchanged
      const note = await prisma.note.findUnique({ where: { id: school2NoteId } });
      expect(note?.content).toBe('School 2 confidential note content');
    });

    it('should not allow deleting notes from another school', async () => {
      const res = await authDelete(`/api/v1/notes/${school2NoteId}`, teacherToken);

      // Should return 404
      expect(res.status).toBe(404);

      // Verify note still exists
      const noteStillExists = await prisma.note.findUnique({
        where: { id: school2NoteId },
      });
      expect(noteStillExists).not.toBeNull();
    });

    it('should not allow creating notes for lessons in another school', async () => {
      const res = await authPost('/api/v1/notes', teacherToken, {
        lessonId: school2LessonId,
        date: '2024-01-11',
        content: 'Attempted cross-school note creation',
      });

      // Should return 404 (lesson not found)
      expect(res.status).toBe(404);
    });

    it('should not allow creating notes for students in another school', async () => {
      const res = await authPost('/api/v1/notes', teacherToken, {
        studentId: school2StudentId,
        date: '2024-01-11',
        content: 'Attempted cross-school student note',
      });

      // Should return 404 (student not found)
      expect(res.status).toBe(404);
    });
  });
});
