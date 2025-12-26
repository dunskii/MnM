// ===========================================
// Dashboard Service Unit Tests
// ===========================================
// Tests for dashboard statistics with multi-tenancy verification

import { prisma } from '../../../src/config/database';
import * as dashboardService from '../../../src/services/dashboard.service';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    student: {
      count: jest.fn(),
    },
    family: {
      count: jest.fn(),
    },
    teacher: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    lesson: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    attendance: {
      groupBy: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
    meetAndGreet: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    googleDriveAuth: {
      findUnique: jest.fn(),
    },
    googleDriveFolder: {
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    lessonEnrollment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    googleDriveFile: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    hybridLessonPattern: {
      count: jest.fn(),
    },
    hybridBooking: {
      findMany: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
    note: {
      findMany: jest.fn(),
    },
    parent: {
      findFirst: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Dashboard Service', () => {
  const mockSchoolId = 'school-123';
  const mockTeacherId = 'teacher-123';
  const mockParentId = 'parent-123';
  const mockFamilyId = 'family-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // ADMIN DASHBOARD STATS TESTS
  // ===========================================

  describe('getAdminDashboardStats', () => {
    beforeEach(() => {
      // Setup default mocks
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.family.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.teacher.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.lesson.count as jest.Mock).mockResolvedValue(20);
      (mockPrisma.attendance.groupBy as jest.Mock).mockResolvedValue([
        { status: 'PRESENT', _count: { id: 80 } },
        { status: 'ABSENT', _count: { id: 20 } },
      ]);
      (mockPrisma.invoice.findMany as jest.Mock).mockResolvedValue([
        { total: 100, amountPaid: 50 },
        { total: 200, amountPaid: 200 },
      ]);
      (mockPrisma.meetAndGreet.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.googleDriveAuth.findUnique as jest.Mock).mockResolvedValue(null);
    });

    it('should return correct student count', async () => {
      const stats = await dashboardService.getAdminDashboardStats(mockSchoolId);

      expect(stats.totalActiveStudents).toBe(10);
      expect(mockPrisma.student.count).toHaveBeenCalledWith({
        where: {
          schoolId: mockSchoolId,
          isActive: true,
          deletionStatus: 'ACTIVE',
        },
      });
    });

    it('should return correct family count', async () => {
      const stats = await dashboardService.getAdminDashboardStats(mockSchoolId);

      expect(stats.totalActiveFamilies).toBe(5);
      expect(mockPrisma.family.count).toHaveBeenCalledWith({
        where: {
          schoolId: mockSchoolId,
          deletionStatus: 'ACTIVE',
        },
      });
    });

    it('should return correct teacher count', async () => {
      const stats = await dashboardService.getAdminDashboardStats(mockSchoolId);

      expect(stats.totalActiveTeachers).toBe(3);
      expect(mockPrisma.teacher.count).toHaveBeenCalledWith({
        where: {
          schoolId: mockSchoolId,
          isActive: true,
        },
      });
    });

    it('should calculate attendance rate correctly', async () => {
      const stats = await dashboardService.getAdminDashboardStats(mockSchoolId);

      // 80 present out of 100 total = 80%
      expect(stats.attendanceRateThisWeek).toBe(80);
    });

    it('should calculate outstanding payments correctly', async () => {
      const stats = await dashboardService.getAdminDashboardStats(mockSchoolId);

      // (100-50) + (200-200) = 50, converted to cents = 5000
      expect(stats.totalOutstandingPayments).toBe(5000);
    });

    it('should include drive sync status', async () => {
      const stats = await dashboardService.getAdminDashboardStats(mockSchoolId);

      expect(stats.driveSyncStatus).toBeDefined();
      expect(stats.driveSyncStatus.isConnected).toBe(false);
      expect(stats.driveSyncStatus.status).toBe('disconnected');
    });

    it('should filter all queries by schoolId (multi-tenancy)', async () => {
      await dashboardService.getAdminDashboardStats(mockSchoolId);

      // Verify all count calls include schoolId
      expect(mockPrisma.student.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: mockSchoolId }),
        })
      );
      expect(mockPrisma.family.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: mockSchoolId }),
        })
      );
      expect(mockPrisma.teacher.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: mockSchoolId }),
        })
      );
    });
  });

  // ===========================================
  // TEACHER DASHBOARD STATS TESTS
  // ===========================================

  describe('getTeacherDashboardStats', () => {
    beforeEach(() => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue({ userId: 'user-123' });
      (mockPrisma.lesson.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue([{ id: 'lesson-1' }]);
      (mockPrisma.lessonEnrollment.findMany as jest.Mock).mockResolvedValue([
        { studentId: 'student-1' },
        { studentId: 'student-2' },
      ]);
      (mockPrisma.attendance.groupBy as jest.Mock).mockResolvedValue([
        { status: 'PRESENT', _count: { id: 18 } },
        { status: 'LATE', _count: { id: 2 } },
      ]);
      (mockPrisma.googleDriveFile.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.meetAndGreet.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.note.findMany as jest.Mock).mockResolvedValue([]);
    });

    it('should return stats for teacher', async () => {
      const stats = await dashboardService.getTeacherDashboardStats(mockSchoolId, mockTeacherId);

      expect(stats).toHaveProperty('totalLessonsThisWeek');
      expect(stats).toHaveProperty('totalStudents');
      expect(stats).toHaveProperty('attendanceRateThisWeek');
      expect(stats).toHaveProperty('pendingNotesCount');
      expect(stats).toHaveProperty('recentlyUploadedFiles');
      expect(stats).toHaveProperty('assignedMeetAndGreets');
    });

    it('should filter by schoolId and teacherId', async () => {
      await dashboardService.getTeacherDashboardStats(mockSchoolId, mockTeacherId);

      expect(mockPrisma.lesson.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            teacherId: mockTeacherId,
          }),
        })
      );
    });

    it('should count unique students in teacher lessons', async () => {
      const stats = await dashboardService.getTeacherDashboardStats(mockSchoolId, mockTeacherId);

      expect(stats.totalStudents).toBe(2);
    });
  });

  // ===========================================
  // PARENT DASHBOARD STATS TESTS
  // ===========================================

  describe('getParentDashboardStats', () => {
    beforeEach(() => {
      (mockPrisma.parent.findFirst as jest.Mock).mockResolvedValue({ familyId: mockFamilyId });
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.lessonEnrollment.count as jest.Mock).mockResolvedValue(4);
      (mockPrisma.invoice.findMany as jest.Mock).mockResolvedValue([
        { id: 'inv-1', total: 100, amountPaid: 0 },
      ]);
      (mockPrisma.googleDriveFile.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.hybridLessonPattern.count as jest.Mock).mockResolvedValue(1);
    });

    it('should return stats for parent', async () => {
      const stats = await dashboardService.getParentDashboardStats(mockSchoolId, mockParentId);

      expect(stats).toHaveProperty('childrenCount');
      expect(stats).toHaveProperty('upcomingLessons');
      expect(stats).toHaveProperty('outstandingInvoices');
      expect(stats).toHaveProperty('outstandingAmount');
      expect(stats).toHaveProperty('sharedFilesCount');
      expect(stats).toHaveProperty('openBookingPeriods');
    });

    it('should return correct children count', async () => {
      const stats = await dashboardService.getParentDashboardStats(mockSchoolId, mockParentId);

      expect(stats.childrenCount).toBe(2);
    });

    it('should return zeros when parent has no family', async () => {
      (mockPrisma.parent.findFirst as jest.Mock).mockResolvedValue({ familyId: null });

      const stats = await dashboardService.getParentDashboardStats(mockSchoolId, mockParentId);

      expect(stats.childrenCount).toBe(0);
      expect(stats.upcomingLessons).toBe(0);
      expect(stats.outstandingInvoices).toBe(0);
    });

    it('should filter by schoolId (multi-tenancy)', async () => {
      await dashboardService.getParentDashboardStats(mockSchoolId, mockParentId);

      expect(mockPrisma.parent.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: mockSchoolId }),
        })
      );
    });
  });

  // ===========================================
  // ACTIVITY FEED TESTS
  // ===========================================

  describe('getActivityFeed', () => {
    beforeEach(() => {
      (mockPrisma.lessonEnrollment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'enroll-1',
          enrolledAt: new Date(),
          student: { firstName: 'John', lastName: 'Doe' },
          lesson: { name: 'Piano 101' },
        },
      ]);
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.hybridBooking.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.meetAndGreet.findMany as jest.Mock).mockResolvedValue([]);
    });

    it('should return activity items array', async () => {
      const activities = await dashboardService.getActivityFeed(mockSchoolId, 10);

      expect(Array.isArray(activities)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const activities = await dashboardService.getActivityFeed(mockSchoolId, 2);

      expect(activities.length).toBeLessThanOrEqual(2);
    });

    it('should return items with correct structure', async () => {
      const activities = await dashboardService.getActivityFeed(mockSchoolId, 10);

      if (activities.length > 0) {
        const activity = activities[0];
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('title');
        expect(activity).toHaveProperty('description');
        expect(activity).toHaveProperty('timestamp');
      }
    });

    it('should filter by schoolId (multi-tenancy)', async () => {
      await dashboardService.getActivityFeed(mockSchoolId, 10);

      expect(mockPrisma.meetAndGreet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: mockSchoolId }),
        })
      );
    });
  });

  // ===========================================
  // DRIVE SYNC STATUS TESTS
  // ===========================================

  describe('getDriveSyncStatus', () => {
    it('should return disconnected when no auth exists', async () => {
      (mockPrisma.googleDriveAuth.findUnique as jest.Mock).mockResolvedValue(null);

      const status = await dashboardService.getDriveSyncStatus(mockSchoolId);

      expect(status.isConnected).toBe(false);
      expect(status.status).toBe('disconnected');
    });

    it('should return healthy status when connected with no errors', async () => {
      (mockPrisma.googleDriveAuth.findUnique as jest.Mock).mockResolvedValue({ id: 'auth-1' });
      (mockPrisma.googleDriveFolder.aggregate as jest.Mock).mockResolvedValue({
        _count: { id: 5 },
        _max: { lastSyncAt: new Date() },
      });
      (mockPrisma.googleDriveFolder.count as jest.Mock).mockResolvedValue(0);

      const status = await dashboardService.getDriveSyncStatus(mockSchoolId);

      expect(status.isConnected).toBe(true);
      expect(status.status).toBe('healthy');
      expect(status.syncedFoldersCount).toBe(5);
    });

    it('should return warning status when errors exist', async () => {
      (mockPrisma.googleDriveAuth.findUnique as jest.Mock).mockResolvedValue({ id: 'auth-1' });
      (mockPrisma.googleDriveFolder.aggregate as jest.Mock).mockResolvedValue({
        _count: { id: 5 },
        _max: { lastSyncAt: new Date() },
      });
      (mockPrisma.googleDriveFolder.count as jest.Mock).mockResolvedValue(3);

      const status = await dashboardService.getDriveSyncStatus(mockSchoolId);

      expect(status.status).toBe('warning');
      expect(status.errorCount).toBe(3);
    });

    it('should return error status when many errors exist', async () => {
      (mockPrisma.googleDriveAuth.findUnique as jest.Mock).mockResolvedValue({ id: 'auth-1' });
      (mockPrisma.googleDriveFolder.aggregate as jest.Mock).mockResolvedValue({
        _count: { id: 10 },
        _max: { lastSyncAt: new Date() },
      });
      (mockPrisma.googleDriveFolder.count as jest.Mock).mockResolvedValue(8);

      const status = await dashboardService.getDriveSyncStatus(mockSchoolId);

      expect(status.status).toBe('error');
    });

    it('should filter by schoolId (multi-tenancy)', async () => {
      (mockPrisma.googleDriveAuth.findUnique as jest.Mock).mockResolvedValue(null);

      await dashboardService.getDriveSyncStatus(mockSchoolId);

      expect(mockPrisma.googleDriveAuth.findUnique).toHaveBeenCalledWith({
        where: { schoolId: mockSchoolId },
      });
    });
  });

  // ===========================================
  // MULTI-TENANCY SECURITY TESTS
  // ===========================================

  describe('Multi-Tenancy Security', () => {
    it('should always include schoolId in student queries', async () => {
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.family.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.teacher.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.lesson.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.attendance.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.meetAndGreet.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.googleDriveAuth.findUnique as jest.Mock).mockResolvedValue(null);

      await dashboardService.getAdminDashboardStats('specific-school-id');

      const studentCall = (mockPrisma.student.count as jest.Mock).mock.calls[0][0];
      expect(studentCall.where.schoolId).toBe('specific-school-id');
    });

    it('should never expose data without schoolId filter', async () => {
      (mockPrisma.parent.findFirst as jest.Mock).mockResolvedValue({ familyId: 'fam-1' });
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.lessonEnrollment.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.googleDriveFile.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.hybridLessonPattern.count as jest.Mock).mockResolvedValue(0);

      await dashboardService.getParentDashboardStats('school-a', 'parent-1');

      // Verify parent lookup includes schoolId
      expect(mockPrisma.parent.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: 'school-a' }),
        })
      );
    });

    it('should handle non-existent school gracefully', async () => {
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.family.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.teacher.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.lesson.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.attendance.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.meetAndGreet.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.googleDriveAuth.findUnique as jest.Mock).mockResolvedValue(null);

      const stats = await dashboardService.getAdminDashboardStats('non-existent-school');

      expect(stats.totalActiveStudents).toBe(0);
      expect(stats.totalActiveFamilies).toBe(0);
      expect(stats.totalActiveTeachers).toBe(0);
    });
  });
});
