// ===========================================
// Term Service Unit Tests
// ===========================================

import { prisma } from '../../../src/config/database';
import * as termService from '../../../src/services/term.service';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    term: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Term Service', () => {
  const mockSchoolId = 'school-123';
  const mockTermId = 'term-123';

  const mockTerm = {
    id: mockTermId,
    schoolId: mockSchoolId,
    name: 'Term 1 2025',
    startDate: new Date('2025-01-27'),
    endDate: new Date('2025-04-04'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTerms', () => {
    it('should return all terms for a school', async () => {
      const mockTerms = [mockTerm];
      (mockPrisma.term.findMany as jest.Mock).mockResolvedValue(mockTerms);

      const result = await termService.getTerms(mockSchoolId);

      expect(result).toEqual(mockTerms);
      expect(mockPrisma.term.findMany).toHaveBeenCalledWith({
        where: { schoolId: mockSchoolId },
        orderBy: { startDate: 'desc' },
        include: { _count: { select: { lessons: true } } },
      });
    });

    it('should always filter by schoolId (multi-tenancy)', async () => {
      (mockPrisma.term.findMany as jest.Mock).mockResolvedValue([]);

      await termService.getTerms('different-school');

      expect(mockPrisma.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: 'different-school' },
        })
      );
    });
  });

  describe('getTerm', () => {
    it('should return a term by id with schoolId filter', async () => {
      (mockPrisma.term.findFirst as jest.Mock).mockResolvedValue(mockTerm);

      const result = await termService.getTerm(mockSchoolId, mockTermId);

      expect(result).toEqual(mockTerm);
      expect(mockPrisma.term.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockTermId,
          schoolId: mockSchoolId,
        },
        include: { _count: { select: { lessons: true } } },
      });
    });

    it('should return null if term not found in school', async () => {
      (mockPrisma.term.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await termService.getTerm(mockSchoolId, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should not return term from different school (multi-tenancy)', async () => {
      (mockPrisma.term.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await termService.getTerm('other-school', mockTermId);

      expect(result).toBeNull();
      expect(mockPrisma.term.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockTermId,
            schoolId: 'other-school',
          },
        })
      );
    });
  });

  describe('createTerm', () => {
    it('should create a term with schoolId', async () => {
      const createData = {
        name: 'Term 2 2025',
        startDate: new Date('2025-04-28'),
        endDate: new Date('2025-06-27'),
      };

      // Mock for overlap check
      (mockPrisma.term.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // No overlapping term
        .mockResolvedValueOnce(null); // No duplicate name
      (mockPrisma.term.create as jest.Mock).mockResolvedValue({
        ...mockTerm,
        ...createData,
        id: 'new-term-id',
      });

      const result = await termService.createTerm(mockSchoolId, createData);

      expect(result.name).toBe(createData.name);
      expect(mockPrisma.term.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: mockSchoolId,
          name: createData.name,
        }),
      });
    });
  });

  describe('updateTerm', () => {
    it('should update a term only if it belongs to school', async () => {
      const updateData = { name: 'Updated Term Name' };

      // First call: verify term exists
      // Second call: check for duplicate name (returns null = no duplicate)
      (mockPrisma.term.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockTerm)
        .mockResolvedValueOnce(null);
      (mockPrisma.term.update as jest.Mock).mockResolvedValue({
        ...mockTerm,
        ...updateData,
      });

      const result = await termService.updateTerm(mockSchoolId, mockTermId, updateData);

      expect(result.name).toBe(updateData.name);
      expect(mockPrisma.term.findFirst).toHaveBeenCalledWith({
        where: { id: mockTermId, schoolId: mockSchoolId },
      });
    });

    it('should throw error if term not found in school', async () => {
      (mockPrisma.term.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        termService.updateTerm('other-school', mockTermId, { name: 'New Name' })
      ).rejects.toThrow('Term not found');
    });
  });

  describe('deleteTerm', () => {
    it('should delete a term only if it belongs to school (no lessons)', async () => {
      const termWithNoLessons = {
        ...mockTerm,
        _count: { lessons: 0 },
      };
      (mockPrisma.term.findFirst as jest.Mock).mockResolvedValue(termWithNoLessons);
      (mockPrisma.term.delete as jest.Mock).mockResolvedValue(mockTerm);

      await termService.deleteTerm(mockSchoolId, mockTermId);

      expect(mockPrisma.term.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockTermId, schoolId: mockSchoolId },
        })
      );
      expect(mockPrisma.term.delete).toHaveBeenCalledWith({
        where: { id: mockTermId },
      });
    });

    it('should soft delete a term with lessons', async () => {
      const termWithLessons = {
        ...mockTerm,
        _count: { lessons: 5 },
      };
      (mockPrisma.term.findFirst as jest.Mock).mockResolvedValue(termWithLessons);
      (mockPrisma.term.update as jest.Mock).mockResolvedValue({ ...mockTerm, isActive: false });

      await termService.deleteTerm(mockSchoolId, mockTermId);

      expect(mockPrisma.term.update).toHaveBeenCalledWith({
        where: { id: mockTermId },
        data: { isActive: false },
      });
      expect(mockPrisma.term.delete).not.toHaveBeenCalled();
    });

    it('should throw error if term not found in school (multi-tenancy)', async () => {
      (mockPrisma.term.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        termService.deleteTerm('other-school', mockTermId)
      ).rejects.toThrow('Term not found');

      expect(mockPrisma.term.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentTerm', () => {
    it('should return the current active term for school', async () => {
      (mockPrisma.term.findFirst as jest.Mock).mockResolvedValue(mockTerm);

      const result = await termService.getCurrentTerm(mockSchoolId);

      expect(result).toEqual(mockTerm);
      expect(mockPrisma.term.findFirst).toHaveBeenCalledWith({
        where: {
          schoolId: mockSchoolId,
          isActive: true,
          startDate: { lte: expect.any(Date) },
          endDate: { gte: expect.any(Date) },
        },
      });
    });
  });
});
