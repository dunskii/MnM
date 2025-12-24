// ===========================================
// Google Drive Routes Integration Tests
// ===========================================
// Tests for Google Drive OAuth, folder mapping, file sync
// CRITICAL: Tests verify multi-tenancy security (schoolId filtering)
//
// NOTE: These tests mock Google Drive API since we can't make real
// API calls in tests. Focus is on:
// - OAuth flow (URL generation, token storage)
// - Folder mapping CRUD
// - File operations with visibility
// - Sync service logic
// - Multi-tenancy security

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Mock Bull queue before importing routes (Redis not available in tests)
jest.mock('../../src/config/queue', () => ({
  googleDriveSyncQueue: {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    getJob: jest.fn().mockResolvedValue({
      id: 'mock-job-id',
      getState: jest.fn().mockResolvedValue('completed'),
      progress: jest.fn().mockReturnValue(100),
      returnvalue: { success: true },
      failedReason: null,
    }),
    getRepeatableJobs: jest.fn().mockResolvedValue([]),
    removeRepeatableByKey: jest.fn().mockResolvedValue(undefined),
  },
  closeQueues: jest.fn().mockResolvedValue(undefined),
  isQueueHealthy: jest.fn().mockResolvedValue(true),
  getQueueStats: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
}));

// Mock sync job module
jest.mock('../../src/jobs/googleDriveSync.job', () => ({
  queueFolderSync: jest.fn().mockResolvedValue('mock-job-id'),
  queueSchoolSync: jest.fn().mockResolvedValue('mock-job-id'),
  getJobStatus: jest.fn().mockResolvedValue({
    id: 'mock-job-id',
    state: 'completed',
    progress: 100,
    result: { success: true },
    error: null,
  }),
  scheduleRecurringSync: jest.fn().mockResolvedValue(undefined),
  stopRecurringSync: jest.fn().mockResolvedValue(undefined),
}));

// Mock rate limiter and cache (not testing rate limiting in integration tests)
jest.mock('../../src/utils/driveRateLimiter', () => ({
  checkRateLimit: jest.fn(), // No-op, don't throw
  getFromCache: jest.fn().mockReturnValue(null), // Always return cache miss
  setInCache: jest.fn(),
  getFolderCacheKey: jest.fn().mockReturnValue('test-folder-key'),
  getFileCacheKey: jest.fn().mockReturnValue('test-file-key'),
  invalidateSchoolCache: jest.fn(),
  invalidateFolderCache: jest.fn(),
  startCacheCleanup: jest.fn(),
  stopCacheCleanup: jest.fn(),
  getRateLimitRemaining: jest.fn().mockReturnValue(100),
  resetRateLimit: jest.fn(),
  clearCache: jest.fn(),
  getCacheStats: jest.fn().mockReturnValue({ size: 0, keys: [] }),
}));

// Mock googleapis before importing routes
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?test=true'),
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expiry_date: Date.now() + 3600000,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            token_type: 'Bearer',
          },
        }),
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn().mockResolvedValue({
          credentials: {
            access_token: 'mock-refreshed-token',
            expiry_date: Date.now() + 3600000,
          },
        }),
        revokeCredentials: jest.fn().mockResolvedValue({}),
      })),
    },
    drive: jest.fn().mockReturnValue({
      files: {
        list: jest.fn().mockResolvedValue({
          data: {
            files: [
              {
                id: 'mock-folder-1',
                name: 'Test Folder',
                parents: ['root'],
                webViewLink: 'https://drive.google.com/drive/folders/mock-folder-1',
              },
            ],
          },
        }),
        get: jest.fn().mockResolvedValue({
          data: {
            id: 'mock-folder-1',
            name: 'Test Folder',
            parents: ['root'],
            webViewLink: 'https://drive.google.com/drive/folders/mock-folder-1',
          },
        }),
        create: jest.fn().mockResolvedValue({
          data: {
            id: 'mock-file-1',
            name: 'test.pdf',
            mimeType: 'application/pdf',
            size: '1024',
            webViewLink: 'https://drive.google.com/file/d/mock-file-1',
            modifiedTime: new Date().toISOString(),
            createdTime: new Date().toISOString(),
          },
        }),
        delete: jest.fn().mockResolvedValue({}),
      },
    }),
  },
}));

// Create test app without CSRF protection
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  const authRoutes = require('../../src/routes/auth.routes').default;
  const googleDriveRoutes = require('../../src/routes/googleDrive.routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/google-drive', googleDriveRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

// Test data
const testId = Date.now();
const TEST_SCHOOL_1 = {
  name: 'Google Drive Test School 1',
  slug: `gdrive-test-school-1-${testId}`,
  email: `gdrive-test1-${testId}@testschool.com`,
};

const TEST_SCHOOL_2 = {
  name: 'Google Drive Test School 2',
  slug: `gdrive-test-school-2-${testId}`,
  email: `gdrive-test2-${testId}@testschool.com`,
};

const ADMIN_USER = {
  email: `gdrive-admin-${testId}@testschool.com`,
  password: 'AdminPassword123!',
  firstName: 'GDrive',
  lastName: 'Admin',
};

const TEACHER_USER = {
  email: `gdrive-teacher-${testId}@testschool.com`,
  password: 'TeacherPass123!',
  firstName: 'GDrive',
  lastName: 'Teacher',
};

const ADMIN_USER_2 = {
  email: `gdrive-admin2-${testId}@testschool.com`,
  password: 'AdminPassword123!',
  firstName: 'GDrive2',
  lastName: 'Admin',
};

describe('Google Drive Routes Integration Tests', () => {
  let app: express.Express;
  let school1Id: string;
  let school2Id: string;
  let adminToken: string;
  let teacherToken: string;
  let admin2Token: string;
  let lessonId: string;
  let studentId: string;
  let folderId: string;

  beforeAll(async () => {
    app = createTestApp();

    // Create test schools
    const school1 = await prisma.school.create({ data: TEST_SCHOOL_1 });
    const school2 = await prisma.school.create({ data: TEST_SCHOOL_2 });
    school1Id = school1.id;
    school2Id = school2.id;

    // Create admin user for school 1
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 12);
    const { password: _p1, ...adminUserData } = ADMIN_USER;
    await prisma.user.create({
      data: {
        schoolId: school1Id,
        ...adminUserData,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    // Create teacher user for school 1
    const teacherHash = await bcrypt.hash(TEACHER_USER.password, 12);
    const { password: _p2, ...teacherUserData } = TEACHER_USER;
    await prisma.user.create({
      data: {
        schoolId: school1Id,
        ...teacherUserData,
        passwordHash: teacherHash,
        role: 'TEACHER',
        emailVerified: true,
      },
    });

    // Create admin user for school 2
    const admin2Hash = await bcrypt.hash(ADMIN_USER_2.password, 12);
    const { password: _p3, ...admin2UserData } = ADMIN_USER_2;
    await prisma.user.create({
      data: {
        schoolId: school2Id,
        ...admin2UserData,
        passwordHash: admin2Hash,
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    // Create a lesson for folder linking
    const term = await prisma.term.create({
      data: {
        schoolId: school1Id,
        name: 'Test Term',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    const location = await prisma.location.create({
      data: { schoolId: school1Id, name: 'Test Location' },
    });

    const room = await prisma.room.create({
      data: { locationId: location.id, name: 'Test Room' },
    });

    const lessonType = await prisma.lessonType.create({
      data: {
        schoolId: school1Id,
        name: 'Individual',
        type: 'INDIVIDUAL',
        defaultDuration: 45,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        schoolId: school1Id,
        userId: (await prisma.user.findFirst({ where: { email: TEACHER_USER.email } }))!.id,
      },
    });

    const lesson = await prisma.lesson.create({
      data: {
        schoolId: school1Id,
        name: 'Test Lesson',
        termId: term.id,
        roomId: room.id,
        lessonTypeId: lessonType.id,
        teacherId: teacher.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '09:45',
        durationMins: 45,
      },
    });
    lessonId = lesson.id;

    // Create a student for folder linking
    const family = await prisma.family.create({
      data: { schoolId: school1Id, name: 'Test Family' },
    });

    const student = await prisma.student.create({
      data: {
        schoolId: school1Id,
        familyId: family.id,
        firstName: 'Test',
        lastName: 'Student',
        birthDate: new Date('2015-01-01'),
        ageGroup: 'KIDS',
      },
    });
    studentId = student.id;

    // Login admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_USER.email, password: ADMIN_USER.password });
    adminToken = adminLogin.body.data.accessToken;

    // Login teacher
    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEACHER_USER.email, password: TEACHER_USER.password });
    teacherToken = teacherLogin.body.data.accessToken;

    // Login admin 2
    const admin2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_USER_2.email, password: ADMIN_USER_2.password });
    admin2Token = admin2Login.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.googleDriveFile.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.googleDriveFolder.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.googleDriveAuth.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.lesson.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.student.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.teacher.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.user.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.family.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.lessonType.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.room.deleteMany({
      where: { location: { schoolId: { in: [school1Id, school2Id] } } },
    });
    await prisma.location.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.term.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.school.deleteMany({
      where: { id: { in: [school1Id, school2Id] } },
    });
    await prisma.$disconnect();
  });

  // ===========================================
  // OAuth Tests
  // ===========================================

  describe('OAuth Authentication', () => {
    it('should return OAuth URL for admin', async () => {
      const res = await request(app)
        .get('/api/v1/google-drive/auth/url')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.authUrl).toContain('accounts.google.com');
    });

    it('should deny OAuth URL for non-admin', async () => {
      const res = await request(app)
        .get('/api/v1/google-drive/auth/url')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
    });

    it('should report disconnected status initially', async () => {
      const res = await request(app)
        .get('/api/v1/google-drive/auth/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isConnected).toBe(false);
    });
  });

  // ===========================================
  // Folder Management Tests
  // ===========================================

  describe('Folder Management', () => {
    beforeAll(async () => {
      // Simulate OAuth completion by creating auth record directly
      const { encrypt } = require('../../src/utils/crypto');
      await prisma.googleDriveAuth.create({
        data: {
          schoolId: school1Id,
          accessToken: encrypt('mock-access-token'),
          refreshToken: encrypt('mock-refresh-token'),
          expiresAt: new Date(Date.now() + 3600000),
          scope: 'https://www.googleapis.com/auth/drive.readonly',
        },
      });
    });

    it('should report connected status after OAuth', async () => {
      const res = await request(app)
        .get('/api/v1/google-drive/auth/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isConnected).toBe(true);
    });

    it('should link folder to lesson', async () => {
      const res = await request(app)
        .post('/api/v1/google-drive/folders/link')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driveFolderId: 'mock-drive-folder-1',
          folderName: 'Test Lesson Folder',
          folderUrl: 'https://drive.google.com/drive/folders/mock-drive-folder-1',
          lessonId,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.lessonId).toBe(lessonId);
      expect(res.body.data.syncJobId).toBeDefined();
      folderId = res.body.data.id;
    });

    it('should not allow duplicate folder links', async () => {
      const res = await request(app)
        .post('/api/v1/google-drive/folders/link')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driveFolderId: 'mock-drive-folder-1',
          folderName: 'Duplicate Folder',
          folderUrl: 'https://drive.google.com/drive/folders/mock-drive-folder-1',
          studentId,
        });

      expect(res.status).toBe(409);
    });

    it('should get folder mappings', async () => {
      const res = await request(app)
        .get('/api/v1/google-drive/folders/mappings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.mappings.length).toBeGreaterThan(0);
      expect(res.body.data.mappings[0].lessonId).toBe(lessonId);
    });

    it('should update folder sync settings', async () => {
      const res = await request(app)
        .patch(`/api/v1/google-drive/folders/${folderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ syncEnabled: false });

      expect(res.status).toBe(200);
      expect(res.body.data.syncEnabled).toBe(false);
    });

    it('should deny folder operations for non-admin', async () => {
      const res = await request(app)
        .get('/api/v1/google-drive/folders/mappings')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================
  // Multi-tenancy Tests
  // ===========================================

  describe('Multi-tenancy Security', () => {
    it('should not allow school 2 admin to see school 1 folders', async () => {
      const res = await request(app)
        .get('/api/v1/google-drive/folders/mappings')
        .set('Authorization', `Bearer ${admin2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.mappings.length).toBe(0);
    });

    it('should not allow school 2 admin to delete school 1 folder', async () => {
      const res = await request(app)
        .delete(`/api/v1/google-drive/folders/${folderId}`)
        .set('Authorization', `Bearer ${admin2Token}`);

      expect(res.status).toBe(404);
    });

    it('should not allow school 2 admin to link folder with school 1 lesson', async () => {
      // First create auth for school 2
      const { encrypt } = require('../../src/utils/crypto');
      await prisma.googleDriveAuth.create({
        data: {
          schoolId: school2Id,
          accessToken: encrypt('mock-access-token-2'),
          refreshToken: encrypt('mock-refresh-token-2'),
          expiresAt: new Date(Date.now() + 3600000),
          scope: 'https://www.googleapis.com/auth/drive.readonly',
        },
      });

      const res = await request(app)
        .post('/api/v1/google-drive/folders/link')
        .set('Authorization', `Bearer ${admin2Token}`)
        .send({
          driveFolderId: 'mock-drive-folder-2',
          folderName: 'Cross-school Folder',
          folderUrl: 'https://drive.google.com/drive/folders/mock-drive-folder-2',
          lessonId, // This belongs to school 1
        });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================
  // Sync Tests
  // ===========================================

  describe('Sync Operations', () => {
    it('should get sync status', async () => {
      const res = await request(app)
        .get('/api/v1/google-drive/sync/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isConnected).toBe(true);
      expect(res.body.data.folders).toBeDefined();
    });

    it('should trigger manual sync', async () => {
      const res = await request(app)
        .post('/api/v1/google-drive/sync/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ folderId });

      expect(res.status).toBe(200);
      expect(res.body.data.jobId).toBeDefined();
    });

    it('should deny sync for non-admin', async () => {
      const res = await request(app)
        .post('/api/v1/google-drive/sync/trigger')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect(res.status).toBe(403);
    });
  });

  // ===========================================
  // File Access Tests
  // ===========================================

  describe('File Access', () => {
    beforeAll(async () => {
      // Create a mock synced file
      await prisma.googleDriveFile.create({
        data: {
          schoolId: school1Id,
          driveFileId: 'mock-file-1',
          fileName: 'test-document.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          webViewLink: 'https://drive.google.com/file/d/mock-file-1',
          modifiedTime: new Date(),
          createdTime: new Date(),
          driveFolderId: folderId,
          visibility: 'ALL',
          uploadedVia: 'GOOGLE_DRIVE',
        },
      });
    });

    it('should allow teacher to view files', async () => {
      const res = await request(app)
        .get('/api/v1/google-drive/files')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.files.length).toBeGreaterThan(0);
    });

    it('should not allow teacher to delete files they did not upload', async () => {
      const file = await prisma.googleDriveFile.findFirst({
        where: { schoolId: school1Id },
      });

      const res = await request(app)
        .delete(`/api/v1/google-drive/files/${file!.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================
  // Cleanup Tests
  // ===========================================

  describe('Folder Unlinking', () => {
    it('should unlink folder and soft-delete files', async () => {
      const res = await request(app)
        .delete(`/api/v1/google-drive/folders/${folderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify folder is deleted
      const folder = await prisma.googleDriveFolder.findUnique({
        where: { id: folderId },
      });
      expect(folder).toBeNull();
    });
  });
});
