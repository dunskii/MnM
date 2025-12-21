// ===========================================
// Teacher Service Unit Tests
// ===========================================

import { prisma } from '../../../src/config/database';
import * as teacherService from '../../../src/services/teacher.service';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    teacher: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    instrument: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    teacherInstrument: {
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock password utils
jest.mock('../../../src/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  validatePassword: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
  generateTemporaryPassword: jest.fn().mockReturnValue('TempPass123!'),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Teacher Service', () => {
  const mockSchoolId = 'school-123';
  const mockTeacherId = 'teacher-123';
  const mockUserId = 'user-123';

  const mockTeacher = {
    id: mockTeacherId,
    userId: mockUserId,
    schoolId: mockSchoolId,
    bio: 'Experienced piano teacher',
    isActive: true,
    user: {
      id: mockUserId,
      email: 'teacher@school.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '0412345678',
      role: 'TEACHER',
      isActive: true,
    },
    instruments: [
      {
        id: 'ti-1',
        instrument: { id: 'piano', name: 'Piano', sortOrder: 1, isActive: true },
        isPrimary: true,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeachers', () => {
    it('should return all teachers for a school with schoolId filter', async () => {
      (mockPrisma.teacher.findMany as jest.Mock).mockResolvedValue([mockTeacher]);

      const result = await teacherService.getTeachers(mockSchoolId);

      expect(result).toEqual([mockTeacher]);
      expect(mockPrisma.teacher.findMany).toHaveBeenCalledWith({
        where: { schoolId: mockSchoolId },
        include: expect.objectContaining({
          user: true,
          instruments: expect.any(Object),
        }),
        orderBy: { user: { firstName: 'asc' } },
      });
    });

    it('should not return teachers from other schools', async () => {
      (mockPrisma.teacher.findMany as jest.Mock).mockResolvedValue([]);

      const result = await teacherService.getTeachers('other-school');

      expect(result).toEqual([]);
      expect(mockPrisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: 'other-school' },
        })
      );
    });
  });

  describe('getTeacher', () => {
    it('should return teacher with schoolId filter', async () => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(mockTeacher);

      const result = await teacherService.getTeacher(mockSchoolId, mockTeacherId);

      expect(result).toEqual(mockTeacher);
      expect(mockPrisma.teacher.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockTeacherId,
          schoolId: mockSchoolId,
        },
        include: expect.any(Object),
      });
    });

    it('should return null for teacher from different school (multi-tenancy)', async () => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await teacherService.getTeacher('other-school', mockTeacherId);

      expect(result).toBeNull();
    });
  });

  describe('createTeacher', () => {
    it('should check for existing email in same school only', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.instrument.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue({ id: 'new-teacher' });
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(mockTeacher);

      await teacherService.createTeacher(mockSchoolId, {
        email: 'new@school.com',
        firstName: 'New',
        lastName: 'Teacher',
        instrumentIds: ['piano'],
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          schoolId_email: {
            schoolId: mockSchoolId,
            email: 'new@school.com',
          },
        },
      });
    });

    it('should reject duplicate email in same school', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@school.com',
      });

      await expect(
        teacherService.createTeacher(mockSchoolId, {
          email: 'existing@school.com',
          firstName: 'New',
          lastName: 'Teacher',
        })
      ).rejects.toThrow('already exists');
    });

    it('should verify instrument IDs belong to school', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.instrument.count as jest.Mock).mockResolvedValue(1); // Only 1 found, but 2 provided

      await expect(
        teacherService.createTeacher(mockSchoolId, {
          email: 'new@school.com',
          firstName: 'New',
          lastName: 'Teacher',
          instrumentIds: ['piano', 'invalid-instrument'],
        })
      ).rejects.toThrow('invalid');

      expect(mockPrisma.instrument.count).toHaveBeenCalledWith({
        where: {
          id: { in: ['piano', 'invalid-instrument'] },
          schoolId: mockSchoolId,
        },
      });
    });
  });

  describe('updateTeacher', () => {
    it('should verify teacher belongs to school before update', async () => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(mockTeacher);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      await teacherService.updateTeacher(mockSchoolId, mockTeacherId, {
        bio: 'Updated bio',
      });

      expect(mockPrisma.teacher.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockTeacherId,
          schoolId: mockSchoolId,
        },
        include: { user: true },
      });
    });

    it('should reject update for teacher from different school', async () => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        teacherService.updateTeacher('other-school', mockTeacherId, { bio: 'Hacked' })
      ).rejects.toThrow('not found');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('deleteTeacher', () => {
    it('should verify ownership before soft delete', async () => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(mockTeacher);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      await teacherService.deleteTeacher(mockSchoolId, mockTeacherId);

      expect(mockPrisma.teacher.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockTeacherId,
          schoolId: mockSchoolId,
        },
      });
    });

    it('should not delete teacher from different school', async () => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        teacherService.deleteTeacher('other-school', mockTeacherId)
      ).rejects.toThrow('not found');
    });
  });

  describe('assignInstrument', () => {
    it('should verify both teacher and instrument belong to school', async () => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(mockTeacher);
      (mockPrisma.instrument.findFirst as jest.Mock).mockResolvedValue({
        id: 'guitar',
        schoolId: mockSchoolId,
      });
      (mockPrisma.teacherInstrument.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.teacherInstrument.create as jest.Mock).mockResolvedValue({});

      await teacherService.assignInstrument(mockSchoolId, mockTeacherId, 'guitar');

      // Verify teacher ownership check
      expect(mockPrisma.teacher.findFirst).toHaveBeenCalledWith({
        where: { id: mockTeacherId, schoolId: mockSchoolId },
      });

      // Verify instrument ownership check
      expect(mockPrisma.instrument.findFirst).toHaveBeenCalledWith({
        where: { id: 'guitar', schoolId: mockSchoolId },
      });
    });

    it('should reject if instrument from different school', async () => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(mockTeacher);
      (mockPrisma.instrument.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        teacherService.assignInstrument(mockSchoolId, mockTeacherId, 'foreign-instrument')
      ).rejects.toThrow('not found');
    });
  });

  describe('removeInstrument', () => {
    it('should verify teacher belongs to school before removal', async () => {
      (mockPrisma.teacher.findFirst as jest.Mock).mockResolvedValue(mockTeacher);
      (mockPrisma.teacherInstrument.findUnique as jest.Mock).mockResolvedValue({
        teacherId: mockTeacherId,
        instrumentId: 'piano',
      });
      (mockPrisma.teacherInstrument.delete as jest.Mock).mockResolvedValue({});

      await teacherService.removeInstrument(mockSchoolId, mockTeacherId, 'piano');

      expect(mockPrisma.teacher.findFirst).toHaveBeenCalledWith({
        where: { id: mockTeacherId, schoolId: mockSchoolId },
      });
    });
  });
});
