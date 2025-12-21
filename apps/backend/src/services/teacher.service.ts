// ===========================================
// Teacher Service
// ===========================================
// Manages teacher records and instrument assignments

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Teacher, User, UserRole, Instrument } from '@prisma/client';
import { hashPassword, validatePassword, generateTemporaryPassword } from '../utils/password';

// ===========================================
// TYPES
// ===========================================

export interface TeacherWithUser extends Teacher {
  user: User;
  instruments: Array<{
    id: string;
    instrument: Instrument;
    isPrimary: boolean;
  }>;
}

export interface CreateTeacherInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string;
  bio?: string;
  instrumentIds?: string[];
}

export interface UpdateTeacherInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  isActive?: boolean;
}

// ===========================================
// GET ALL TEACHERS
// ===========================================

/**
 * Get all teachers for a school
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getTeachers(schoolId: string): Promise<TeacherWithUser[]> {
  return prisma.teacher.findMany({
    where: { schoolId },
    include: {
      user: true,
      instruments: {
        include: {
          instrument: true,
        },
        orderBy: [
          { isPrimary: 'desc' },
          { instrument: { name: 'asc' } },
        ],
      },
    },
    orderBy: { user: { firstName: 'asc' } },
  });
}

// ===========================================
// GET SINGLE TEACHER
// ===========================================

/**
 * Get a single teacher by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getTeacher(
  schoolId: string,
  teacherId: string
): Promise<TeacherWithUser | null> {
  return prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      user: true,
      instruments: {
        include: {
          instrument: true,
        },
        orderBy: [
          { isPrimary: 'desc' },
          { instrument: { name: 'asc' } },
        ],
      },
    },
  });
}

// ===========================================
// CREATE TEACHER
// ===========================================

/**
 * Create a new teacher (creates both User and Teacher records)
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createTeacher(
  schoolId: string,
  data: CreateTeacherInput
): Promise<TeacherWithUser> {
  const { email, firstName, lastName, phone, password, bio, instrumentIds } = data;

  // Check if email already exists in this school
  const existingUser = await prisma.user.findUnique({
    where: {
      schoolId_email: {
        schoolId,
        email: email.toLowerCase(),
      },
    },
  });

  if (existingUser) {
    throw new AppError('A user with this email already exists.', 409);
  }

  // Generate password if not provided
  const userPassword = password || generateTemporaryPassword();

  // Validate password
  const passwordValidation = await validatePassword(userPassword, {
    personalInfo: [firstName, lastName, email.split('@')[0]],
  });

  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.errors.join(' '), 400);
  }

  // Hash password
  const passwordHash = await hashPassword(userPassword);

  // Verify instrument IDs belong to school
  if (instrumentIds && instrumentIds.length > 0) {
    const validInstruments = await prisma.instrument.count({
      where: {
        id: { in: instrumentIds },
        schoolId, // CRITICAL: Multi-tenancy filter
      },
    });

    if (validInstruments !== instrumentIds.length) {
      throw new AppError('One or more instrument IDs are invalid.', 400);
    }
  }

  // Create user and teacher in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        schoolId,
        email: email.toLowerCase(),
        passwordHash,
        passwordHistory: JSON.stringify([passwordHash]),
        firstName,
        lastName,
        phone,
        role: UserRole.TEACHER,
        emailVerified: true, // Admin-created, pre-verified
      },
    });

    // Create teacher
    const teacher = await tx.teacher.create({
      data: {
        userId: user.id,
        schoolId,
        bio,
      },
    });

    // Assign instruments
    if (instrumentIds && instrumentIds.length > 0) {
      await tx.teacherInstrument.createMany({
        data: instrumentIds.map((instrumentId, index) => ({
          teacherId: teacher.id,
          instrumentId,
          isPrimary: index === 0, // First instrument is primary
        })),
      });
    }

    return teacher;
  });

  // Fetch complete teacher with relations
  const teacher = await getTeacher(schoolId, result.id);
  if (!teacher) {
    throw new AppError('Failed to create teacher.', 500);
  }

  return teacher;
}

// ===========================================
// UPDATE TEACHER
// ===========================================

/**
 * Update a teacher
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateTeacher(
  schoolId: string,
  teacherId: string,
  data: UpdateTeacherInput
): Promise<TeacherWithUser> {
  // First verify teacher belongs to school
  const existing = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: { user: true },
  });

  if (!existing) {
    throw new AppError('Teacher not found.', 404);
  }

  // Update in transaction
  await prisma.$transaction(async (tx) => {
    // Update user fields
    if (data.firstName || data.lastName || data.phone) {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      });
    }

    // Update teacher fields
    await tx.teacher.update({
      where: { id: teacherId },
      data: {
        bio: data.bio,
        isActive: data.isActive,
      },
    });

    // Also update user isActive if teacher is deactivated
    if (data.isActive === false) {
      await tx.user.update({
        where: { id: existing.userId },
        data: { isActive: false },
      });
    }
  });

  // Fetch updated teacher
  const teacher = await getTeacher(schoolId, teacherId);
  if (!teacher) {
    throw new AppError('Failed to update teacher.', 500);
  }

  return teacher;
}

// ===========================================
// DELETE TEACHER
// ===========================================

/**
 * Delete a teacher (soft delete by deactivating)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteTeacher(
  schoolId: string,
  teacherId: string
): Promise<void> {
  // First verify teacher belongs to school
  const existing = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Teacher not found.', 404);
  }

  // Soft delete by deactivating both teacher and user
  await prisma.$transaction([
    prisma.teacher.update({
      where: { id: teacherId },
      data: { isActive: false },
    }),
    prisma.user.update({
      where: { id: existing.userId },
      data: { isActive: false },
    }),
  ]);
}

// ===========================================
// INSTRUMENT ASSIGNMENT
// ===========================================

/**
 * Assign an instrument to a teacher
 * SECURITY: Verifies both teacher and instrument belong to school
 */
export async function assignInstrument(
  schoolId: string,
  teacherId: string,
  instrumentId: string,
  isPrimary: boolean = false
): Promise<void> {
  // Verify teacher belongs to school
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!teacher) {
    throw new AppError('Teacher not found.', 404);
  }

  // Verify instrument belongs to school
  const instrument = await prisma.instrument.findFirst({
    where: {
      id: instrumentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!instrument) {
    throw new AppError('Instrument not found.', 404);
  }

  // Check if already assigned
  const existing = await prisma.teacherInstrument.findUnique({
    where: {
      teacherId_instrumentId: {
        teacherId,
        instrumentId,
      },
    },
  });

  if (existing) {
    throw new AppError('Instrument is already assigned to this teacher.', 409);
  }

  // If setting as primary, unset other primaries first
  if (isPrimary) {
    await prisma.teacherInstrument.updateMany({
      where: { teacherId },
      data: { isPrimary: false },
    });
  }

  await prisma.teacherInstrument.create({
    data: {
      teacherId,
      instrumentId,
      isPrimary,
    },
  });
}

/**
 * Remove an instrument from a teacher
 * SECURITY: Verifies teacher belongs to school
 */
export async function removeInstrument(
  schoolId: string,
  teacherId: string,
  instrumentId: string
): Promise<void> {
  // Verify teacher belongs to school
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!teacher) {
    throw new AppError('Teacher not found.', 404);
  }

  // Check if assignment exists
  const existing = await prisma.teacherInstrument.findUnique({
    where: {
      teacherId_instrumentId: {
        teacherId,
        instrumentId,
      },
    },
  });

  if (!existing) {
    throw new AppError('Instrument is not assigned to this teacher.', 404);
  }

  await prisma.teacherInstrument.delete({
    where: {
      teacherId_instrumentId: {
        teacherId,
        instrumentId,
      },
    },
  });
}

/**
 * Set primary instrument for a teacher
 * SECURITY: Verifies teacher belongs to school
 */
export async function setPrimaryInstrument(
  schoolId: string,
  teacherId: string,
  instrumentId: string
): Promise<void> {
  // Verify teacher belongs to school
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!teacher) {
    throw new AppError('Teacher not found.', 404);
  }

  // Check if assignment exists
  const existing = await prisma.teacherInstrument.findUnique({
    where: {
      teacherId_instrumentId: {
        teacherId,
        instrumentId,
      },
    },
  });

  if (!existing) {
    throw new AppError('Instrument is not assigned to this teacher.', 404);
  }

  // Unset all primaries and set the new one
  await prisma.$transaction([
    prisma.teacherInstrument.updateMany({
      where: { teacherId },
      data: { isPrimary: false },
    }),
    prisma.teacherInstrument.update({
      where: {
        teacherId_instrumentId: {
          teacherId,
          instrumentId,
        },
      },
      data: { isPrimary: true },
    }),
  ]);
}

