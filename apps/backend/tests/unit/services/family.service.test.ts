// ===========================================
// Family Service Unit Tests
// ===========================================

import { prisma } from '../../../src/config/database';
import * as familyService from '../../../src/services/family.service';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    family: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    parent: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) => callback({
      parent: { update: jest.fn() },
      family: { update: jest.fn() },
    })),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Family Service', () => {
  const mockSchoolId = 'school-123';
  const mockFamilyId = 'family-123';

  const mockFamily = {
    id: mockFamilyId,
    schoolId: mockSchoolId,
    name: 'Smith Family',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    parents: [],
    students: [],
    _count: { parents: 0, students: 0 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFamilies', () => {
    it('should return all families for a school with schoolId filter', async () => {
      (mockPrisma.family.findMany as jest.Mock).mockResolvedValue([mockFamily]);

      const result = await familyService.getFamilies(mockSchoolId);

      expect(result).toEqual([mockFamily]);
      expect(mockPrisma.family.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: mockSchoolId }),
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should not return families from other schools (multi-tenancy)', async () => {
      (mockPrisma.family.findMany as jest.Mock).mockResolvedValue([]);

      const result = await familyService.getFamilies('other-school');

      expect(result).toEqual([]);
      expect(mockPrisma.family.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: 'other-school' }),
        })
      );
    });
  });

  describe('getFamily', () => {
    it('should return family with all members using schoolId filter', async () => {
      const familyWithMembers = {
        ...mockFamily,
        parents: [{ id: 'parent-1', user: { firstName: 'John', lastName: 'Smith' } }],
        students: [{ id: 'student-1', firstName: 'Alice', lastName: 'Smith' }],
      };
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(familyWithMembers);

      const result = await familyService.getFamily(mockSchoolId, mockFamilyId);

      expect(result).toEqual(familyWithMembers);
      expect(mockPrisma.family.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockFamilyId,
            schoolId: mockSchoolId,
          },
        })
      );
    });

    it('should return null for family from different school', async () => {
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await familyService.getFamily('other-school', mockFamilyId);

      expect(result).toBeNull();
    });
  });

  describe('createFamily', () => {
    it('should create family with schoolId', async () => {
      (mockPrisma.family.create as jest.Mock).mockResolvedValue(mockFamily);

      const result = await familyService.createFamily(mockSchoolId, { name: 'Smith Family' });

      expect(result).toEqual(mockFamily);
      expect(mockPrisma.family.create).toHaveBeenCalledWith({
        data: {
          schoolId: mockSchoolId,
          name: 'Smith Family',
        },
        include: expect.any(Object),
      });
    });
  });

  describe('updateFamily', () => {
    it('should verify family belongs to school before update', async () => {
      // First call: verify family exists
      // Second call: check for duplicate name (returns null = no duplicate)
      (mockPrisma.family.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockFamily)
        .mockResolvedValueOnce(null);
      (mockPrisma.family.update as jest.Mock).mockResolvedValue({
        ...mockFamily,
        name: 'Updated Family',
      });

      await familyService.updateFamily(mockSchoolId, mockFamilyId, { name: 'Updated Family' });

      expect(mockPrisma.family.findFirst).toHaveBeenCalledWith({
        where: { id: mockFamilyId, schoolId: mockSchoolId },
      });
    });

    it('should reject update for family from different school', async () => {
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        familyService.updateFamily('other-school', mockFamilyId, { name: 'Hacked' })
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteFamily', () => {
    it('should verify ownership before soft delete', async () => {
      const familyWithNoCounts = {
        ...mockFamily,
        _count: { parents: 0, students: 0 },
      };
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(familyWithNoCounts);
      (mockPrisma.family.update as jest.Mock).mockResolvedValue({
        ...mockFamily,
        deletionStatus: 'SOFT_DELETED',
      });

      await familyService.deleteFamily(mockSchoolId, mockFamilyId);

      expect(mockPrisma.family.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockFamilyId, schoolId: mockSchoolId },
        })
      );
    });

    it('should not delete family from different school', async () => {
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        familyService.deleteFamily('other-school', mockFamilyId)
      ).rejects.toThrow('not found');
    });
  });

  describe('addStudentToFamily', () => {
    it('should verify both family and student belong to school', async () => {
      (mockPrisma.family.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockFamily) // First call for verification
        .mockResolvedValueOnce({ ...mockFamily, students: [{ id: 'student-1' }] }); // Second call for getFamily
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue({
        id: 'student-1',
        schoolId: mockSchoolId,
      });
      (mockPrisma.student.update as jest.Mock).mockResolvedValue({});

      await familyService.addStudentToFamily(mockSchoolId, mockFamilyId, 'student-1');

      expect(mockPrisma.family.findFirst).toHaveBeenCalledWith({
        where: { id: mockFamilyId, schoolId: mockSchoolId },
      });
      expect(mockPrisma.student.findFirst).toHaveBeenCalledWith({
        where: { id: 'student-1', schoolId: mockSchoolId },
      });
    });

    it('should reject if student from different school', async () => {
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(mockFamily);
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        familyService.addStudentToFamily(mockSchoolId, mockFamilyId, 'foreign-student')
      ).rejects.toThrow('not found');
    });

    it('should reject if family from different school', async () => {
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        familyService.addStudentToFamily('other-school', mockFamilyId, 'student-1')
      ).rejects.toThrow('not found');
    });
  });

  describe('removeStudentFromFamily', () => {
    it('should verify family belongs to school', async () => {
      (mockPrisma.family.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockFamily) // First call for verification
        .mockResolvedValueOnce({ ...mockFamily, students: [] }); // Second call for getFamily
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue({
        id: 'student-1',
        schoolId: mockSchoolId,
        familyId: mockFamilyId,
      });
      (mockPrisma.student.update as jest.Mock).mockResolvedValue({});

      await familyService.removeStudentFromFamily(mockSchoolId, mockFamilyId, 'student-1');

      expect(mockPrisma.family.findFirst).toHaveBeenCalledWith({
        where: { id: mockFamilyId, schoolId: mockSchoolId },
      });
    });
  });

  describe('addParentToFamily', () => {
    it('should verify both family and parent belong to school', async () => {
      (mockPrisma.family.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockFamily) // First call for verification
        .mockResolvedValueOnce({ ...mockFamily, parents: [{ id: 'parent-1' }] }); // Second call for getFamily
      (mockPrisma.parent.findFirst as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        userId: 'user-1',
        schoolId: mockSchoolId,
      });
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      await familyService.addParentToFamily(mockSchoolId, mockFamilyId, 'parent-1');

      expect(mockPrisma.family.findFirst).toHaveBeenCalledWith({
        where: { id: mockFamilyId, schoolId: mockSchoolId },
      });
      expect(mockPrisma.parent.findFirst).toHaveBeenCalledWith({
        where: { id: 'parent-1', schoolId: mockSchoolId },
      });
    });

    it('should reject if parent from different school', async () => {
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(mockFamily);
      (mockPrisma.parent.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        familyService.addParentToFamily(mockSchoolId, mockFamilyId, 'foreign-parent')
      ).rejects.toThrow('not found');
    });
  });

  describe('removeParentFromFamily', () => {
    it('should verify family belongs to school before removal', async () => {
      const familyWithParents = {
        ...mockFamily,
        parents: [
          { id: 'parent-1', userId: 'user-1' },
          { id: 'parent-2', userId: 'user-2' },
        ],
      };
      (mockPrisma.family.findFirst as jest.Mock)
        .mockResolvedValueOnce(familyWithParents) // First call for verification
        .mockResolvedValueOnce({ ...mockFamily, parents: [{ id: 'parent-2' }] }); // Second call for getFamily
      (mockPrisma.parent.findFirst as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        userId: 'user-1',
        schoolId: mockSchoolId,
        familyId: mockFamilyId,
      });
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      await familyService.removeParentFromFamily(mockSchoolId, mockFamilyId, 'parent-1');

      expect(mockPrisma.family.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockFamilyId, schoolId: mockSchoolId },
        })
      );
    });
  });
});
