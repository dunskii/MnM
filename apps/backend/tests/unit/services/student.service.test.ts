// ===========================================
// Student Service Unit Tests
// ===========================================

import { prisma } from '../../../src/config/database';
import * as studentService from '../../../src/services/student.service';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  prisma: {
    student: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    family: {
      findFirst: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Student Service', () => {
  const mockSchoolId = 'school-123';
  const mockStudentId = 'student-123';
  const mockFamilyId = 'family-123';

  const mockStudent = {
    id: mockStudentId,
    schoolId: mockSchoolId,
    familyId: mockFamilyId,
    firstName: 'Alice',
    lastName: 'Smith',
    birthDate: new Date('2015-05-15'),
    ageGroup: 'KIDS',
    notes: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    family: {
      id: mockFamilyId,
      name: 'Smith Family',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudents', () => {
    it('should return all students for a school with schoolId filter', async () => {
      (mockPrisma.student.findMany as jest.Mock).mockResolvedValue([mockStudent]);

      const result = await studentService.getStudents(mockSchoolId);

      expect(result).toEqual([mockStudent]);
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith({
        where: { schoolId: mockSchoolId },
        include: { family: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      });
    });

    it('should not return students from other schools (multi-tenancy)', async () => {
      (mockPrisma.student.findMany as jest.Mock).mockResolvedValue([]);

      const result = await studentService.getStudents('other-school');

      expect(result).toEqual([]);
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: 'other-school' },
        })
      );
    });
  });

  describe('getStudent', () => {
    it('should return student with schoolId filter', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent);

      const result = await studentService.getStudent(mockSchoolId, mockStudentId);

      expect(result).toEqual(mockStudent);
      expect(mockPrisma.student.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockStudentId,
          schoolId: mockSchoolId,
        },
        include: { family: true },
      });
    });

    it('should return null for student from different school', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await studentService.getStudent('other-school', mockStudentId);

      expect(result).toBeNull();
    });
  });

  describe('createStudent', () => {
    it('should create student with schoolId', async () => {
      (mockPrisma.student.create as jest.Mock).mockResolvedValue(mockStudent);

      const result = await studentService.createStudent(mockSchoolId, {
        firstName: 'Alice',
        lastName: 'Smith',
        birthDate: new Date('2015-05-15'),
      });

      expect(result).toEqual(mockStudent);
      expect(mockPrisma.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: mockSchoolId,
          firstName: 'Alice',
          lastName: 'Smith',
        }),
        include: { family: true },
      });
    });

    it('should verify family belongs to school if provided', async () => {
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue({
        id: mockFamilyId,
        schoolId: mockSchoolId,
      });
      (mockPrisma.student.create as jest.Mock).mockResolvedValue(mockStudent);

      await studentService.createStudent(mockSchoolId, {
        firstName: 'Alice',
        lastName: 'Smith',
        birthDate: new Date('2015-05-15'),
        familyId: mockFamilyId,
      });

      expect(mockPrisma.family.findFirst).toHaveBeenCalledWith({
        where: { id: mockFamilyId, schoolId: mockSchoolId },
      });
    });

    it('should reject if family from different school', async () => {
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        studentService.createStudent(mockSchoolId, {
          firstName: 'Alice',
          lastName: 'Smith',
          birthDate: new Date('2015-05-15'),
          familyId: 'foreign-family',
        })
      ).rejects.toThrow('not found');
    });
  });

  describe('updateStudent', () => {
    it('should verify student belongs to school before update', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent);
      (mockPrisma.student.update as jest.Mock).mockResolvedValue({
        ...mockStudent,
        firstName: 'Updated',
      });

      await studentService.updateStudent(mockSchoolId, mockStudentId, {
        firstName: 'Updated',
      });

      expect(mockPrisma.student.findFirst).toHaveBeenCalledWith({
        where: { id: mockStudentId, schoolId: mockSchoolId },
      });
    });

    it('should reject update for student from different school', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        studentService.updateStudent('other-school', mockStudentId, { firstName: 'Hacked' })
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteStudent', () => {
    it('should verify ownership before soft delete', async () => {
      const studentWithCounts = {
        ...mockStudent,
        _count: { enrollments: 0, attendances: 0 },
      };
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(studentWithCounts);
      (mockPrisma.student.update as jest.Mock).mockResolvedValue({
        ...mockStudent,
        isActive: false,
      });

      await studentService.deleteStudent(mockSchoolId, mockStudentId);

      expect(mockPrisma.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStudentId, schoolId: mockSchoolId },
        })
      );
    });

    it('should not delete student from different school', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        studentService.deleteStudent('other-school', mockStudentId)
      ).rejects.toThrow('not found');
    });
  });

  describe('assignToFamily', () => {
    it('should verify both student and family belong to school', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent);
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue({
        id: mockFamilyId,
        schoolId: mockSchoolId,
      });
      (mockPrisma.student.update as jest.Mock).mockResolvedValue(mockStudent);

      await studentService.assignToFamily(mockSchoolId, mockStudentId, mockFamilyId);

      expect(mockPrisma.student.findFirst).toHaveBeenCalledWith({
        where: { id: mockStudentId, schoolId: mockSchoolId },
      });
      expect(mockPrisma.family.findFirst).toHaveBeenCalledWith({
        where: { id: mockFamilyId, schoolId: mockSchoolId },
      });
    });

    it('should reject if family from different school', async () => {
      (mockPrisma.student.findFirst as jest.Mock).mockResolvedValue(mockStudent);
      (mockPrisma.family.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        studentService.assignToFamily(mockSchoolId, mockStudentId, 'foreign-family')
      ).rejects.toThrow('not found');
    });
  });

  describe('Age Group Calculation', () => {
    it('should calculate PRESCHOOL for children 5 and under', async () => {
      const preschoolBirthDate = new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000); // 4 years ago
      const preschoolStudent = {
        ...mockStudent,
        birthDate: preschoolBirthDate,
        ageGroup: 'PRESCHOOL',
      };
      (mockPrisma.student.create as jest.Mock).mockResolvedValue(preschoolStudent);

      await studentService.createStudent(mockSchoolId, {
        firstName: 'Baby',
        lastName: 'Child',
        birthDate: preschoolBirthDate,
      });

      expect(mockPrisma.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ageGroup: 'PRESCHOOL',
        }),
        include: { family: true },
      });
    });

    it('should calculate KIDS for children 6-11', async () => {
      const kidBirthDate = new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000); // 8 years ago
      (mockPrisma.student.create as jest.Mock).mockResolvedValue(mockStudent);

      await studentService.createStudent(mockSchoolId, {
        firstName: 'Kid',
        lastName: 'Child',
        birthDate: kidBirthDate,
      });

      expect(mockPrisma.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ageGroup: 'KIDS',
        }),
        include: { family: true },
      });
    });

    it('should calculate TEENS for ages 12-17', async () => {
      const teenBirthDate = new Date(Date.now() - 15 * 365 * 24 * 60 * 60 * 1000); // 15 years ago
      (mockPrisma.student.create as jest.Mock).mockResolvedValue({
        ...mockStudent,
        ageGroup: 'TEENS',
      });

      await studentService.createStudent(mockSchoolId, {
        firstName: 'Teen',
        lastName: 'Student',
        birthDate: teenBirthDate,
      });

      expect(mockPrisma.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ageGroup: 'TEENS',
        }),
        include: { family: true },
      });
    });

    it('should calculate ADULT for ages 18+', async () => {
      const adultBirthDate = new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000); // 25 years ago
      (mockPrisma.student.create as jest.Mock).mockResolvedValue({
        ...mockStudent,
        ageGroup: 'ADULT',
      });

      await studentService.createStudent(mockSchoolId, {
        firstName: 'Adult',
        lastName: 'Student',
        birthDate: adultBirthDate,
      });

      expect(mockPrisma.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ageGroup: 'ADULT',
        }),
        include: { family: true },
      });
    });
  });
});
