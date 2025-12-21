// ===========================================
// Config Service Unit Tests
// ===========================================

import { prisma } from '../../../src/config/database';
import * as configService from '../../../src/services/config.service';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    instrument: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    lessonType: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    lessonDuration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Config Service', () => {
  const mockSchoolId = 'school-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Instruments', () => {
    const mockInstrument = {
      id: 'inst-123',
      schoolId: mockSchoolId,
      name: 'Piano',
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getInstruments', () => {
      it('should return all instruments for a school', async () => {
        const mockInstruments = [mockInstrument];
        (mockPrisma.instrument.findMany as jest.Mock).mockResolvedValue(mockInstruments);

        const result = await configService.getInstruments(mockSchoolId);

        expect(result).toEqual(mockInstruments);
        expect(mockPrisma.instrument.findMany).toHaveBeenCalledWith({
          where: { schoolId: mockSchoolId },
          orderBy: { sortOrder: 'asc' },
        });
      });

      it('should always filter by schoolId (multi-tenancy)', async () => {
        (mockPrisma.instrument.findMany as jest.Mock).mockResolvedValue([]);

        await configService.getInstruments('different-school');

        expect(mockPrisma.instrument.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { schoolId: 'different-school' },
          })
        );
      });
    });

    describe('createInstrument', () => {
      it('should create instrument with schoolId', async () => {
        // No duplicate exists
        (mockPrisma.instrument.findUnique as jest.Mock).mockResolvedValue(null);
        // Get max sortOrder
        (mockPrisma.instrument.findFirst as jest.Mock).mockResolvedValue({ sortOrder: 2 });
        (mockPrisma.instrument.create as jest.Mock).mockResolvedValue({
          ...mockInstrument,
          name: 'Guitar',
          sortOrder: 3,
        });

        const result = await configService.createInstrument(mockSchoolId, {
          name: 'Guitar',
        });

        expect(result.name).toBe('Guitar');
        expect(mockPrisma.instrument.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            name: 'Guitar',
          }),
        });
      });
    });

    describe('updateInstrument', () => {
      it('should only update if instrument belongs to school', async () => {
        // First call: verify instrument exists
        // Second call: check for duplicate name (returns null = no duplicate)
        (mockPrisma.instrument.findFirst as jest.Mock)
          .mockResolvedValueOnce(mockInstrument)
          .mockResolvedValueOnce(null);
        (mockPrisma.instrument.update as jest.Mock).mockResolvedValue({
          ...mockInstrument,
          name: 'Updated Piano',
        });

        const result = await configService.updateInstrument(
          mockSchoolId,
          'inst-123',
          { name: 'Updated Piano' }
        );

        expect(result.name).toBe('Updated Piano');
        expect(mockPrisma.instrument.findFirst).toHaveBeenCalledWith({
          where: { id: 'inst-123', schoolId: mockSchoolId },
        });
      });

      it('should throw if instrument from different school', async () => {
        (mockPrisma.instrument.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(
          configService.updateInstrument('other-school', 'inst-123', { name: 'Hacked' })
        ).rejects.toThrow('Instrument not found');
      });
    });

    describe('deleteInstrument', () => {
      it('should verify ownership before deletion', async () => {
        const instrumentWithNoCounts = {
          ...mockInstrument,
          _count: { teachers: 0, lessons: 0 },
        };
        (mockPrisma.instrument.findFirst as jest.Mock).mockResolvedValue(instrumentWithNoCounts);
        (mockPrisma.instrument.delete as jest.Mock).mockResolvedValue(mockInstrument);

        await configService.deleteInstrument(mockSchoolId, 'inst-123');

        expect(mockPrisma.instrument.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'inst-123', schoolId: mockSchoolId },
          })
        );
      });

      it('should soft delete instrument in use', async () => {
        const instrumentInUse = {
          ...mockInstrument,
          _count: { teachers: 2, lessons: 5 },
        };
        (mockPrisma.instrument.findFirst as jest.Mock).mockResolvedValue(instrumentInUse);
        (mockPrisma.instrument.update as jest.Mock).mockResolvedValue({ ...mockInstrument, isActive: false });

        await configService.deleteInstrument(mockSchoolId, 'inst-123');

        expect(mockPrisma.instrument.update).toHaveBeenCalledWith({
          where: { id: 'inst-123' },
          data: { isActive: false },
        });
        expect(mockPrisma.instrument.delete).not.toHaveBeenCalled();
      });

      it('should not delete instrument from other school', async () => {
        (mockPrisma.instrument.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(
          configService.deleteInstrument('other-school', 'inst-123')
        ).rejects.toThrow('Instrument not found');

        expect(mockPrisma.instrument.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Lesson Types', () => {
    const mockLessonType = {
      id: 'lt-123',
      schoolId: mockSchoolId,
      name: 'Individual Piano',
      type: 'INDIVIDUAL',
      defaultDuration: 45,
      description: null,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getLessonTypes', () => {
      it('should return all lesson types for school with schoolId filter', async () => {
        (mockPrisma.lessonType.findMany as jest.Mock).mockResolvedValue([mockLessonType]);

        const result = await configService.getLessonTypes(mockSchoolId);

        expect(result).toHaveLength(1);
        expect(mockPrisma.lessonType.findMany).toHaveBeenCalledWith({
          where: { schoolId: mockSchoolId },
          orderBy: { sortOrder: 'asc' },
        });
      });
    });

    describe('createLessonType', () => {
      it('should create lesson type with schoolId', async () => {
        // No duplicate exists
        (mockPrisma.lessonType.findUnique as jest.Mock).mockResolvedValue(null);
        // Get max sortOrder
        (mockPrisma.lessonType.findFirst as jest.Mock).mockResolvedValue({ sortOrder: 0 });
        (mockPrisma.lessonType.create as jest.Mock).mockResolvedValue(mockLessonType);

        const result = await configService.createLessonType(mockSchoolId, {
          name: 'Individual Piano',
          type: 'INDIVIDUAL',
          defaultDuration: 45,
        });

        expect(result).toEqual(mockLessonType);
        expect(mockPrisma.lessonType.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        });
      });
    });
  });

  describe('Lesson Durations', () => {
    const mockDuration = {
      id: 'dur-123',
      schoolId: mockSchoolId,
      minutes: 45,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getLessonDurations', () => {
      it('should filter by schoolId', async () => {
        (mockPrisma.lessonDuration.findMany as jest.Mock).mockResolvedValue([mockDuration]);

        await configService.getLessonDurations(mockSchoolId);

        expect(mockPrisma.lessonDuration.findMany).toHaveBeenCalledWith({
          where: { schoolId: mockSchoolId },
          orderBy: { minutes: 'asc' },
        });
      });
    });

    describe('createLessonDuration', () => {
      it('should check for duplicates within same school only', async () => {
        (mockPrisma.lessonDuration.findUnique as jest.Mock).mockResolvedValue(null);
        (mockPrisma.lessonDuration.create as jest.Mock).mockResolvedValue(mockDuration);

        await configService.createLessonDuration(mockSchoolId, { minutes: 45 });

        expect(mockPrisma.lessonDuration.findUnique).toHaveBeenCalledWith({
          where: {
            schoolId_minutes: {
              schoolId: mockSchoolId,
              minutes: 45,
            },
          },
        });
      });

      it('should reject duplicate duration in same school', async () => {
        (mockPrisma.lessonDuration.findUnique as jest.Mock).mockResolvedValue(mockDuration);

        await expect(
          configService.createLessonDuration(mockSchoolId, { minutes: 45 })
        ).rejects.toThrow('already exists');
      });
    });
  });
});
