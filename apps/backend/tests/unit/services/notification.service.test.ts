// ===========================================
// Notification Service Unit Tests
// ===========================================

import { prisma } from '../../../src/config/database';
import * as notificationService from '../../../src/services/notification.service';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    notificationPreference: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Notification Service', () => {
  const mockSchoolId = 'school-123';
  const mockUserId = 'user-123';

  const mockPreferences = {
    id: 'pref-123',
    userId: mockUserId,
    schoolId: mockSchoolId,
    emailNotificationsEnabled: true,
    notificationTypes: {
      LESSON_REMINDER: true,
      LESSON_RESCHEDULED: true,
      PAYMENT_RECEIVED: true,
      INVOICE_CREATED: true,
      HYBRID_BOOKING_OPENED: true,
      HYBRID_BOOKING_REMINDER: true,
      FILE_UPLOADED: true,
      ATTENDANCE_SUMMARY: false,
    },
    quietHoursEnabled: true,
    quietHoursStart: '21:00',
    quietHoursEnd: '07:00',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return existing preferences for a user', async () => {
      (mockPrisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await notificationService.getPreferences(mockSchoolId, mockUserId);

      expect(result).toEqual(mockPreferences);
      expect(mockPrisma.notificationPreference.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          schoolId: mockSchoolId,
        },
      });
    });

    it('should create default preferences if none exist', async () => {
      (mockPrisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.notificationPreference.create as jest.Mock).mockResolvedValue(mockPreferences);

      await notificationService.getPreferences(mockSchoolId, mockUserId);

      expect(mockPrisma.notificationPreference.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          schoolId: mockSchoolId,
          emailNotificationsEnabled: true,
          quietHoursEnabled: true,
          quietHoursStart: '21:00',
          quietHoursEnd: '07:00',
        }),
      });
    });

    it('should always filter by schoolId (multi-tenancy)', async () => {
      (mockPrisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(mockPreferences);

      await notificationService.getPreferences('different-school', mockUserId);

      expect(mockPrisma.notificationPreference.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          schoolId: 'different-school',
        },
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update email notifications toggle', async () => {
      (mockPrisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(mockPreferences);
      (mockPrisma.notificationPreference.update as jest.Mock).mockResolvedValue({
        ...mockPreferences,
        emailNotificationsEnabled: false,
      });

      const result = await notificationService.updatePreferences(mockSchoolId, mockUserId, {
        emailNotificationsEnabled: false,
      });

      expect(result.emailNotificationsEnabled).toBe(false);
      expect(mockPrisma.notificationPreference.update).toHaveBeenCalledWith({
        where: {
          userId_schoolId: { userId: mockUserId, schoolId: mockSchoolId },
        },
        data: expect.objectContaining({
          emailNotificationsEnabled: false,
        }),
      });
    });

    it('should merge notification types with existing ones', async () => {
      (mockPrisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(mockPreferences);
      (mockPrisma.notificationPreference.update as jest.Mock).mockResolvedValue({
        ...mockPreferences,
        notificationTypes: {
          ...mockPreferences.notificationTypes,
          LESSON_REMINDER: false,
        },
      });

      await notificationService.updatePreferences(mockSchoolId, mockUserId, {
        notificationTypes: { LESSON_REMINDER: false },
      });

      expect(mockPrisma.notificationPreference.update).toHaveBeenCalledWith({
        where: {
          userId_schoolId: { userId: mockUserId, schoolId: mockSchoolId },
        },
        data: expect.objectContaining({
          notificationTypes: expect.objectContaining({
            LESSON_REMINDER: false,
            LESSON_RESCHEDULED: true, // Original value preserved
          }),
        }),
      });
    });

    it('should update quiet hours settings', async () => {
      (mockPrisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(mockPreferences);
      (mockPrisma.notificationPreference.update as jest.Mock).mockResolvedValue({
        ...mockPreferences,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
      });

      await notificationService.updatePreferences(mockSchoolId, mockUserId, {
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
      });

      expect(mockPrisma.notificationPreference.update).toHaveBeenCalledWith({
        where: {
          userId_schoolId: { userId: mockUserId, schoolId: mockSchoolId },
        },
        data: expect.objectContaining({
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
        }),
      });
    });
  });

  describe('shouldSendNotification', () => {
    it('should return true when notifications enabled and type allowed', async () => {
      // Use preferences with quiet hours disabled to avoid time-dependent test failures
      const prefsWithoutQuietHours = { ...mockPreferences, quietHoursEnabled: false };
      (mockPrisma.notificationPreference.findFirst as jest.Mock)
        .mockResolvedValueOnce(prefsWithoutQuietHours);

      const result = await notificationService.shouldSendNotification(
        mockSchoolId,
        mockUserId,
        'LESSON_REMINDER'
      );

      expect(result).toBe(true);
    });

    it('should return false when email notifications globally disabled', async () => {
      const disabledPrefs = { ...mockPreferences, emailNotificationsEnabled: false };
      (mockPrisma.notificationPreference.findFirst as jest.Mock)
        .mockResolvedValueOnce(disabledPrefs)
        .mockResolvedValueOnce(disabledPrefs);

      const result = await notificationService.shouldSendNotification(
        mockSchoolId,
        mockUserId,
        'LESSON_REMINDER'
      );

      expect(result).toBe(false);
    });

    it('should return false when specific notification type disabled', async () => {
      const prefsWithDisabledType = {
        ...mockPreferences,
        notificationTypes: {
          ...mockPreferences.notificationTypes,
          LESSON_REMINDER: false,
        },
      };
      (mockPrisma.notificationPreference.findFirst as jest.Mock)
        .mockResolvedValueOnce(prefsWithDisabledType)
        .mockResolvedValueOnce(prefsWithDisabledType);

      const result = await notificationService.shouldSendNotification(
        mockSchoolId,
        mockUserId,
        'LESSON_REMINDER'
      );

      expect(result).toBe(false);
    });
  });

  describe('isInQuietHours', () => {
    it('should return false when quiet hours disabled', () => {
      const result = notificationService.isInQuietHours({
        ...mockPreferences,
        quietHoursEnabled: false,
      } as any);

      expect(result).toBe(false);
    });

    it('should return false when quiet hours times not set', () => {
      const result = notificationService.isInQuietHours({
        ...mockPreferences,
        quietHoursEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
      } as any);

      expect(result).toBe(false);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all preferences to default values', async () => {
      (mockPrisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(mockPreferences);
      (mockPrisma.notificationPreference.update as jest.Mock).mockResolvedValue({
        ...mockPreferences,
        emailNotificationsEnabled: true,
        quietHoursEnabled: true,
        quietHoursStart: '21:00',
        quietHoursEnd: '07:00',
      });

      await notificationService.resetToDefaults(mockSchoolId, mockUserId);

      expect(mockPrisma.notificationPreference.update).toHaveBeenCalledWith({
        where: {
          userId_schoolId: { userId: mockUserId, schoolId: mockSchoolId },
        },
        data: expect.objectContaining({
          emailNotificationsEnabled: true,
          quietHoursEnabled: true,
          quietHoursStart: '21:00',
          quietHoursEnd: '07:00',
        }),
      });
    });
  });

  describe('getUsersWithNotificationEnabled', () => {
    it('should return user IDs with specific notification type enabled', async () => {
      (mockPrisma.notificationPreference.findMany as jest.Mock).mockResolvedValue([
        { userId: 'user-1', notificationTypes: { LESSON_REMINDER: true } },
        { userId: 'user-2', notificationTypes: { LESSON_REMINDER: false } },
        { userId: 'user-3', notificationTypes: {} }, // Default to true
      ]);

      const result = await notificationService.getUsersWithNotificationEnabled(
        mockSchoolId,
        'LESSON_REMINDER'
      );

      expect(result).toEqual(['user-1', 'user-3']);
      expect(mockPrisma.notificationPreference.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: mockSchoolId,
          emailNotificationsEnabled: true,
        },
        select: {
          userId: true,
          notificationTypes: true,
        },
      });
    });
  });

  describe('bulkCheckNotifications', () => {
    it('should return map of user preferences', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      (mockPrisma.notificationPreference.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 'user-1',
          emailNotificationsEnabled: true,
          notificationTypes: { LESSON_REMINDER: true },
        },
        {
          userId: 'user-2',
          emailNotificationsEnabled: false,
          notificationTypes: { LESSON_REMINDER: true },
        },
      ]);

      const result = await notificationService.bulkCheckNotifications(
        mockSchoolId,
        userIds,
        'LESSON_REMINDER'
      );

      expect(result.get('user-1')).toBe(true);
      expect(result.get('user-2')).toBe(false); // Globally disabled
      expect(result.get('user-3')).toBe(true); // No preferences = default enabled
    });

    it('should filter by schoolId (multi-tenancy)', async () => {
      (mockPrisma.notificationPreference.findMany as jest.Mock).mockResolvedValue([]);

      await notificationService.bulkCheckNotifications(
        mockSchoolId,
        ['user-1'],
        'LESSON_REMINDER'
      );

      expect(mockPrisma.notificationPreference.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: mockSchoolId,
          userId: { in: ['user-1'] },
        },
      });
    });
  });
});
