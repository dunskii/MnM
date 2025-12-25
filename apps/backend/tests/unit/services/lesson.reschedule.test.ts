// ===========================================
// Lesson Reschedule Unit Tests
// ===========================================

import { prisma } from '../../../src/config/database';
import * as lessonService from '../../../src/services/lesson.service';

// Mock dependencies
jest.mock('../../../src/config/database', () => ({
  prisma: {
    lesson: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    lessonEnrollment: {
      findMany: jest.fn(),
    },
    hybridPattern: {
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      lesson: { update: jest.fn().mockResolvedValue({}) },
      hybridPattern: { update: jest.fn().mockResolvedValue({}) },
    })),
  },
}));

jest.mock('../../../src/jobs/emailNotification.job', () => ({
  queueLessonRescheduledEmail: jest.fn().mockResolvedValue('job-123'),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Lesson Reschedule Service', () => {
  const mockSchoolId = 'school-123';
  const mockLessonId = 'lesson-123';
  const mockUserId = 'user-123';

  const mockLesson = {
    id: mockLessonId,
    schoolId: mockSchoolId,
    name: 'Piano Lesson',
    dayOfWeek: 1, // Monday
    startTime: '10:00',
    endTime: '11:00',
    durationMins: 60,
    teacherId: 'teacher-123',
    roomId: 'room-123',
    isActive: true,
    lessonType: { name: 'Individual', type: 'INDIVIDUAL' },
    term: { id: 'term-123', name: 'Term 1' },
    teacher: { id: 'teacher-123', user: { firstName: 'John', lastName: 'Doe' } },
    room: { id: 'room-123', name: 'Room A', location: { name: 'Main Campus' } },
    instrument: null,
    hybridPattern: null,
    enrollments: [],
    _count: { enrollments: 2 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRescheduleConflicts', () => {
    it('should return no conflicts when slot is free', async () => {
      // Mock sequence: 1) getLesson, 2) validateTeacherAvailability, 3) validateRoomAvailability
      (mockPrisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockLesson) // getLesson
        .mockResolvedValueOnce(null) // validateTeacherAvailability (no conflict)
        .mockResolvedValueOnce(null); // validateRoomAvailability (no conflict)

      const result = await lessonService.checkRescheduleConflicts(
        mockSchoolId,
        mockLessonId,
        {
          newDayOfWeek: 2, // Tuesday
          newStartTime: '10:00',
          newEndTime: '11:00',
        }
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.teacherConflict).toBeNull();
      expect(result.roomConflict).toBeNull();
    });

    it('should detect teacher conflicts', async () => {
      const conflictingLesson = {
        id: 'conflict-lesson',
        name: 'Conflicting Lesson',
        startTime: '10:00',
        endTime: '11:00',
        teacherId: 'teacher-123',
        roomId: 'room-456', // Different room
      };

      // Mock sequence: 1) getLesson, 2) validateTeacherAvailability (conflict), 3) validateRoomAvailability (no conflict)
      (mockPrisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockLesson) // getLesson
        .mockResolvedValueOnce(conflictingLesson) // validateTeacherAvailability (conflict found)
        .mockResolvedValueOnce(null); // validateRoomAvailability (no conflict)

      const result = await lessonService.checkRescheduleConflicts(
        mockSchoolId,
        mockLessonId,
        {
          newDayOfWeek: 2,
          newStartTime: '10:00',
          newEndTime: '11:00',
        }
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.teacherConflict).toBeTruthy();
      expect(result.teacherConflict?.lessonName).toBe('Conflicting Lesson');
    });

    it('should detect room conflicts', async () => {
      const conflictingLesson = {
        id: 'conflict-lesson',
        name: 'Room Conflict Lesson',
        startTime: '10:00',
        endTime: '11:00',
        teacherId: 'teacher-456', // Different teacher
        roomId: 'room-123', // Same room
      };

      // Mock sequence: 1) getLesson, 2) validateTeacherAvailability (no conflict), 3) validateRoomAvailability (conflict)
      (mockPrisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockLesson) // getLesson
        .mockResolvedValueOnce(null) // validateTeacherAvailability (no conflict)
        .mockResolvedValueOnce(conflictingLesson); // validateRoomAvailability (conflict found)

      const result = await lessonService.checkRescheduleConflicts(
        mockSchoolId,
        mockLessonId,
        {
          newDayOfWeek: 2,
          newStartTime: '10:00',
          newEndTime: '11:00',
        }
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.roomConflict).toBeTruthy();
      expect(result.roomConflict?.lessonName).toBe('Room Conflict Lesson');
    });

    it('should always filter by schoolId (multi-tenancy)', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockLesson)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await lessonService.checkRescheduleConflicts(
        mockSchoolId,
        mockLessonId,
        {
          newDayOfWeek: 2,
          newStartTime: '10:00',
          newEndTime: '11:00',
        }
      );

      // Verify first call (getLesson) includes schoolId
      expect(mockPrisma.lesson.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      );
    });

    it('should throw error if lesson not found', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        lessonService.checkRescheduleConflicts(
          mockSchoolId,
          'nonexistent',
          {
            newDayOfWeek: 2,
            newStartTime: '10:00',
            newEndTime: '11:00',
          }
        )
      ).rejects.toThrow('Lesson not found');
    });

    it('should count affected students', async () => {
      const lessonWithEnrollments = {
        ...mockLesson,
        enrollments: [
          { studentId: 'student-1', student: { id: 'student-1', firstName: 'Alice', lastName: 'Smith' }, isActive: true },
          { studentId: 'student-2', student: { id: 'student-2', firstName: 'Bob', lastName: 'Jones' }, isActive: true },
        ],
      };

      (mockPrisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(lessonWithEnrollments)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await lessonService.checkRescheduleConflicts(
        mockSchoolId,
        mockLessonId,
        {
          newDayOfWeek: 2,
          newStartTime: '10:00',
          newEndTime: '11:00',
        }
      );

      expect(result.affectedStudents).toBe(2);
      expect(result.affectedEnrollments).toHaveLength(2);
    });
  });

  describe('rescheduleLesson', () => {
    it('should update lesson time when no conflicts', async () => {
      const updatedLesson = {
        ...mockLesson,
        dayOfWeek: 2,
        startTime: '14:00',
        endTime: '15:00',
      };

      // Mock sequence:
      // 1) rescheduleLesson calls getLesson (existing)
      // 2) rescheduleLesson calls checkRescheduleConflicts which calls getLesson
      // 3) checkRescheduleConflicts calls validateTeacherAvailability
      // 4) checkRescheduleConflicts calls validateRoomAvailability
      // 5) updateLesson calls findFirst to verify lesson exists
      // 6) updateLesson calls validateRoomAvailability
      // 7) updateLesson calls validateTeacherAvailability
      // 8) updateLesson calls getLesson to return updated lesson
      (mockPrisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockLesson) // 1) getLesson in rescheduleLesson
        .mockResolvedValueOnce(mockLesson) // 2) getLesson in checkRescheduleConflicts
        .mockResolvedValueOnce(null) // 3) validateTeacherAvailability (no conflict)
        .mockResolvedValueOnce(null) // 4) validateRoomAvailability (no conflict)
        .mockResolvedValueOnce(mockLesson) // 5) updateLesson verify lesson exists
        .mockResolvedValueOnce(null) // 6) validateRoomAvailability in updateLesson
        .mockResolvedValueOnce(null) // 7) validateTeacherAvailability in updateLesson
        .mockResolvedValueOnce(updatedLesson); // 8) getLesson to return updated lesson
      (mockPrisma.lesson.update as jest.Mock).mockResolvedValue(updatedLesson);

      const result = await lessonService.rescheduleLesson(
        mockSchoolId,
        mockLessonId,
        {
          newDayOfWeek: 2,
          newStartTime: '14:00',
          newEndTime: '15:00',
          notifyParents: true,
        },
        mockUserId
      );

      expect(result.dayOfWeek).toBe(2);
      expect(result.startTime).toBe('14:00');
      expect(result.endTime).toBe('15:00');
    });

    it('should throw error when conflicts exist', async () => {
      const conflictingLesson = {
        id: 'conflict-lesson',
        name: 'Conflicting Lesson',
        startTime: '14:00',
        endTime: '15:00',
        teacherId: 'teacher-123',
        roomId: 'room-123',
      };

      (mockPrisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockLesson) // getLesson in rescheduleLesson
        .mockResolvedValueOnce(mockLesson) // getLesson in checkRescheduleConflicts
        .mockResolvedValueOnce(conflictingLesson); // validateTeacherAvailability (conflict)

      await expect(
        lessonService.rescheduleLesson(
          mockSchoolId,
          mockLessonId,
          {
            newDayOfWeek: 2,
            newStartTime: '14:00',
            newEndTime: '15:00',
            notifyParents: true,
          },
          mockUserId
        )
      ).rejects.toThrow(/not available/);
    });

    it('should queue notification email when notifyParents is true', async () => {
      const { queueLessonRescheduledEmail } = await import('../../../src/jobs/emailNotification.job');

      const updatedLessonData = {
        ...mockLesson,
        dayOfWeek: 2,
        startTime: '14:00',
        endTime: '15:00',
      };
      (mockPrisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockLesson) // 1) getLesson in rescheduleLesson
        .mockResolvedValueOnce(mockLesson) // 2) getLesson in checkRescheduleConflicts
        .mockResolvedValueOnce(null) // 3) validateTeacherAvailability
        .mockResolvedValueOnce(null) // 4) validateRoomAvailability
        .mockResolvedValueOnce(mockLesson) // 5) updateLesson verify lesson exists
        .mockResolvedValueOnce(null) // 6) validateRoomAvailability in updateLesson
        .mockResolvedValueOnce(null) // 7) validateTeacherAvailability in updateLesson
        .mockResolvedValueOnce(updatedLessonData); // 8) getLesson to return updated lesson
      (mockPrisma.lesson.update as jest.Mock).mockResolvedValue(updatedLessonData);

      await lessonService.rescheduleLesson(
        mockSchoolId,
        mockLessonId,
        {
          newDayOfWeek: 2,
          newStartTime: '14:00',
          newEndTime: '15:00',
          notifyParents: true,
          reason: 'Teacher unavailable',
        },
        mockUserId
      );

      expect(queueLessonRescheduledEmail).toHaveBeenCalledWith(
        mockSchoolId,
        mockLessonId,
        1, // Old dayOfWeek
        '10:00', // Old startTime
        '11:00', // Old endTime
        'Teacher unavailable'
      );
    });

    it('should not queue email when notifyParents is false', async () => {
      const { queueLessonRescheduledEmail } = await import('../../../src/jobs/emailNotification.job');

      const updatedLessonData = {
        ...mockLesson,
        dayOfWeek: 2,
        startTime: '14:00',
        endTime: '15:00',
      };
      (mockPrisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockLesson) // 1) getLesson in rescheduleLesson
        .mockResolvedValueOnce(mockLesson) // 2) getLesson in checkRescheduleConflicts
        .mockResolvedValueOnce(null) // 3) validateTeacherAvailability
        .mockResolvedValueOnce(null) // 4) validateRoomAvailability
        .mockResolvedValueOnce(mockLesson) // 5) updateLesson verify lesson exists
        .mockResolvedValueOnce(null) // 6) validateRoomAvailability in updateLesson
        .mockResolvedValueOnce(null) // 7) validateTeacherAvailability in updateLesson
        .mockResolvedValueOnce(updatedLessonData); // 8) getLesson to return updated lesson
      (mockPrisma.lesson.update as jest.Mock).mockResolvedValue(updatedLessonData);

      await lessonService.rescheduleLesson(
        mockSchoolId,
        mockLessonId,
        {
          newDayOfWeek: 2,
          newStartTime: '14:00',
          newEndTime: '15:00',
          notifyParents: false,
        },
        mockUserId
      );

      expect(queueLessonRescheduledEmail).not.toHaveBeenCalled();
    });

    it('should throw error if lesson not found (multi-tenancy)', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        lessonService.rescheduleLesson(
          'wrong-school',
          mockLessonId,
          {
            newDayOfWeek: 2,
            newStartTime: '14:00',
            newEndTime: '15:00',
            notifyParents: true,
          },
          mockUserId
        )
      ).rejects.toThrow('Lesson not found');
    });
  });
});
