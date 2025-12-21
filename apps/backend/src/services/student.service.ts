// ===========================================
// Student Service
// ===========================================
// Manages student records with age group calculation

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Student, Family, AgeGroup } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface StudentWithFamily extends Student {
  family: Family | null;
}

export interface StudentFilters {
  familyId?: string;
  ageGroup?: AgeGroup;
  isActive?: boolean;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  birthDate: Date;
  familyId?: string;
  notes?: string;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  familyId?: string | null;
  notes?: string;
  isActive?: boolean;
}

// ===========================================
// GET ALL STUDENTS
// ===========================================

/**
 * Get all students for a school
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 * NOTE: Teachers can view all students in their school
 */
export async function getStudents(
  schoolId: string,
  filters?: StudentFilters
): Promise<StudentWithFamily[]> {
  return prisma.student.findMany({
    where: {
      schoolId, // CRITICAL: Multi-tenancy filter
      ...(filters?.familyId && { familyId: filters.familyId }),
      ...(filters?.ageGroup && { ageGroup: filters.ageGroup }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    include: {
      family: true,
    },
    orderBy: [
      { firstName: 'asc' },
      { lastName: 'asc' },
    ],
  });
}

// ===========================================
// GET SINGLE STUDENT
// ===========================================

/**
 * Get a single student by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getStudent(
  schoolId: string,
  studentId: string
): Promise<StudentWithFamily | null> {
  return prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      family: true,
    },
  });
}

// ===========================================
// CREATE STUDENT
// ===========================================

/**
 * Create a new student
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createStudent(
  schoolId: string,
  data: CreateStudentInput
): Promise<StudentWithFamily> {
  const { firstName, lastName, birthDate, familyId, notes } = data;

  // Verify family belongs to school if provided
  if (familyId) {
    const family = await prisma.family.findFirst({
      where: {
        id: familyId,
        schoolId, // CRITICAL: Multi-tenancy filter
      },
    });

    if (!family) {
      throw new AppError('Family not found.', 404);
    }
  }

  // Calculate age group based on birth date
  const ageGroup = calculateAgeGroup(birthDate);

  const student = await prisma.student.create({
    data: {
      schoolId,
      firstName,
      lastName,
      birthDate,
      ageGroup,
      familyId,
      notes,
    },
    include: {
      family: true,
    },
  });

  return student;
}

// ===========================================
// UPDATE STUDENT
// ===========================================

/**
 * Update a student
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateStudent(
  schoolId: string,
  studentId: string,
  data: UpdateStudentInput
): Promise<StudentWithFamily> {
  // First verify student belongs to school
  const existing = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Student not found.', 404);
  }

  // Verify new family belongs to school if provided
  if (data.familyId) {
    const family = await prisma.family.findFirst({
      where: {
        id: data.familyId,
        schoolId, // CRITICAL: Multi-tenancy filter
      },
    });

    if (!family) {
      throw new AppError('Family not found.', 404);
    }
  }

  // Recalculate age group if birth date is being updated
  let ageGroup: AgeGroup | undefined;
  if (data.birthDate) {
    ageGroup = calculateAgeGroup(data.birthDate);
  }

  const student = await prisma.student.update({
    where: { id: studentId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      ageGroup,
      familyId: data.familyId,
      notes: data.notes,
      isActive: data.isActive,
    },
    include: {
      family: true,
    },
  });

  return student;
}

// ===========================================
// DELETE STUDENT
// ===========================================

/**
 * Delete a student (soft delete by setting isActive = false)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteStudent(
  schoolId: string,
  studentId: string
): Promise<void> {
  // First verify student belongs to school
  const existing = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      _count: {
        select: {
          enrollments: true,
          attendances: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError('Student not found.', 404);
  }

  // Soft delete - keep history
  await prisma.student.update({
    where: { id: studentId },
    data: { isActive: false },
  });
}

// ===========================================
// FAMILY ASSIGNMENT
// ===========================================

/**
 * Assign a student to a family
 * SECURITY: Verifies both student and family belong to school
 */
export async function assignToFamily(
  schoolId: string,
  studentId: string,
  familyId: string
): Promise<StudentWithFamily> {
  // Verify student belongs to school
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!student) {
    throw new AppError('Student not found.', 404);
  }

  // Verify family belongs to school
  const family = await prisma.family.findFirst({
    where: {
      id: familyId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!family) {
    throw new AppError('Family not found.', 404);
  }

  return prisma.student.update({
    where: { id: studentId },
    data: { familyId },
    include: { family: true },
  });
}

/**
 * Remove a student from their family
 * SECURITY: Verifies student belongs to school
 */
export async function removeFromFamily(
  schoolId: string,
  studentId: string
): Promise<StudentWithFamily> {
  // Verify student belongs to school
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!student) {
    throw new AppError('Student not found.', 404);
  }

  return prisma.student.update({
    where: { id: studentId },
    data: { familyId: null },
    include: { family: true },
  });
}

// ===========================================
// AGE GROUP FUNCTIONS
// ===========================================

/**
 * Calculate age group based on birth date
 * Age groups from CLAUDE.md:
 * - PRESCHOOL: 3-5 years (Alice - Pink)
 * - KIDS: 6-11 years (Steve - Yellow)
 * - TEENS: 12-17 years (Liam - Blue)
 * - ADULT: 18+ years (Floyd - Mint)
 */
export function calculateAgeGroup(birthDate: Date): AgeGroup {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age <= 5) return AgeGroup.PRESCHOOL;
  if (age <= 11) return AgeGroup.KIDS;
  if (age <= 17) return AgeGroup.TEENS;
  return AgeGroup.ADULT;
}

/**
 * Get the character/mascot for an age group
 */
export function getAgeGroupCharacter(ageGroup: AgeGroup): {
  name: string;
  color: string;
  description: string;
} {
  switch (ageGroup) {
    case AgeGroup.PRESCHOOL:
      return {
        name: 'Alice',
        color: '#FFAE9E', // Pink/Coral
        description: 'Sweet day-dreamer for preschool students',
      };
    case AgeGroup.KIDS:
      return {
        name: 'Steve',
        color: '#FFCE00', // Yellow
        description: 'Curious with big ears and perfect pitch',
      };
    case AgeGroup.TEENS:
      return {
        name: 'Liam',
        color: '#4580E4', // Blue
        description: 'Rock enthusiast with sunglasses',
      };
    case AgeGroup.ADULT:
      return {
        name: 'Floyd',
        color: '#96DAC9', // Mint
        description: 'Career-focused late bloomer',
      };
  }
}

/**
 * Update age groups for all students (scheduled task)
 * Call this periodically to update age groups as students get older
 * Optimized to use batch updates grouped by age group
 */
export async function updateAllAgeGroups(schoolId: string): Promise<number> {
  const students = await prisma.student.findMany({
    where: { schoolId },
    select: { id: true, birthDate: true, ageGroup: true },
  });

  // Group students by their new age group
  const updatesByAgeGroup: Record<AgeGroup, string[]> = {
    [AgeGroup.PRESCHOOL]: [],
    [AgeGroup.KIDS]: [],
    [AgeGroup.TEENS]: [],
    [AgeGroup.ADULT]: [],
  };

  let updatedCount = 0;

  for (const student of students) {
    const newAgeGroup = calculateAgeGroup(student.birthDate);
    if (newAgeGroup !== student.ageGroup) {
      updatesByAgeGroup[newAgeGroup].push(student.id);
      updatedCount++;
    }
  }

  // Batch update each age group in a single transaction
  if (updatedCount > 0) {
    await prisma.$transaction(
      Object.entries(updatesByAgeGroup)
        .filter(([, ids]) => ids.length > 0)
        .map(([ageGroup, ids]) =>
          prisma.student.updateMany({
            where: { id: { in: ids } },
            data: { ageGroup: ageGroup as AgeGroup },
          })
        )
    );
  }

  return updatedCount;
}
