// ===========================================
// Parent Service
// ===========================================
// Manages parent records with 2 contacts + emergency contact

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Parent, User, UserRole, Family } from '@prisma/client';
import { hashPassword, validatePassword, generateTemporaryPassword } from '../utils/password';

// ===========================================
// TYPES
// ===========================================

export interface ParentWithUser extends Parent {
  user: User;
  family: Family | null;
}

export interface CreateParentInput {
  // User account
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string;

  // Contact 1 (Primary) - REQUIRED
  contact1Name: string;
  contact1Email: string;
  contact1Phone: string;
  contact1Relationship: string;

  // Contact 2 - OPTIONAL
  contact2Name?: string;
  contact2Email?: string;
  contact2Phone?: string;
  contact2Relationship?: string;

  // Emergency Contact - REQUIRED
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;

  // Family
  familyId?: string;
  familyName?: string; // If creating new family
  isPrimary?: boolean;
}

export interface UpdateParentInput {
  // User fields
  firstName?: string;
  lastName?: string;
  phone?: string;

  // Contact 1 (Primary)
  contact1Name?: string;
  contact1Email?: string;
  contact1Phone?: string;
  contact1Relationship?: string;

  // Contact 2
  contact2Name?: string | null;
  contact2Email?: string | null;
  contact2Phone?: string | null;
  contact2Relationship?: string | null;

  // Emergency Contact
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;

  // Status
  isPrimary?: boolean;
}

// ===========================================
// GET ALL PARENTS
// ===========================================

/**
 * Get all parents for a school
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getParents(schoolId: string): Promise<ParentWithUser[]> {
  return prisma.parent.findMany({
    where: { schoolId },
    include: {
      user: true,
      family: true,
    },
    orderBy: { user: { firstName: 'asc' } },
  });
}

// ===========================================
// GET SINGLE PARENT
// ===========================================

/**
 * Get a single parent by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getParent(
  schoolId: string,
  parentId: string
): Promise<ParentWithUser | null> {
  return prisma.parent.findFirst({
    where: {
      id: parentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      user: true,
      family: true,
    },
  });
}

/**
 * Get parent by user ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getParentByUserId(
  schoolId: string,
  userId: string
): Promise<ParentWithUser | null> {
  return prisma.parent.findFirst({
    where: {
      userId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      user: true,
      family: true,
    },
  });
}

// ===========================================
// CREATE PARENT
// ===========================================

/**
 * Create a new parent (creates User, Family if needed, and Parent records)
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createParent(
  schoolId: string,
  data: CreateParentInput
): Promise<ParentWithUser> {
  const {
    email,
    firstName,
    lastName,
    phone,
    password,
    contact1Name,
    contact1Email,
    contact1Phone,
    contact1Relationship,
    contact2Name,
    contact2Email,
    contact2Phone,
    contact2Relationship,
    emergencyName,
    emergencyPhone,
    emergencyRelationship,
    familyId,
    familyName,
    isPrimary = true,
  } = data;

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

  // Create in transaction
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
        role: UserRole.PARENT,
        emailVerified: true, // Admin-created, pre-verified
      },
    });

    // Create family if not provided
    let actualFamilyId = familyId;
    if (!actualFamilyId && familyName) {
      const family = await tx.family.create({
        data: {
          schoolId,
          name: familyName,
          primaryParentId: user.id,
        },
      });
      actualFamilyId = family.id;
    } else if (!actualFamilyId) {
      // Auto-generate family name
      const family = await tx.family.create({
        data: {
          schoolId,
          name: `The ${lastName} Family`,
          primaryParentId: user.id,
        },
      });
      actualFamilyId = family.id;
    }

    // Create parent
    const parent = await tx.parent.create({
      data: {
        userId: user.id,
        schoolId,
        familyId: actualFamilyId,
        isPrimary,
        contact1Name,
        contact1Email,
        contact1Phone,
        contact1Relationship,
        contact2Name,
        contact2Email,
        contact2Phone,
        contact2Relationship,
        emergencyName,
        emergencyPhone,
        emergencyRelationship,
      },
    });

    // Update family primary parent if this is primary
    if (isPrimary && actualFamilyId) {
      await tx.family.update({
        where: { id: actualFamilyId },
        data: { primaryParentId: user.id },
      });
    }

    return parent;
  });

  // Fetch complete parent with relations
  const parent = await getParent(schoolId, result.id);
  if (!parent) {
    throw new AppError('Failed to create parent.', 500);
  }

  return parent;
}

// ===========================================
// UPDATE PARENT
// ===========================================

/**
 * Update a parent
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateParent(
  schoolId: string,
  parentId: string,
  data: UpdateParentInput
): Promise<ParentWithUser> {
  // First verify parent belongs to school
  const existing = await prisma.parent.findFirst({
    where: {
      id: parentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: { user: true },
  });

  if (!existing) {
    throw new AppError('Parent not found.', 404);
  }

  // Update in transaction
  await prisma.$transaction(async (tx) => {
    // Update user fields
    if (data.firstName || data.lastName || data.phone !== undefined) {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      });
    }

    // Update parent fields
    await tx.parent.update({
      where: { id: parentId },
      data: {
        contact1Name: data.contact1Name,
        contact1Email: data.contact1Email,
        contact1Phone: data.contact1Phone,
        contact1Relationship: data.contact1Relationship,
        contact2Name: data.contact2Name,
        contact2Email: data.contact2Email,
        contact2Phone: data.contact2Phone,
        contact2Relationship: data.contact2Relationship,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        emergencyRelationship: data.emergencyRelationship,
        isPrimary: data.isPrimary,
      },
    });

    // Update family primary parent if setting as primary
    if (data.isPrimary && existing.familyId) {
      await tx.family.update({
        where: { id: existing.familyId },
        data: { primaryParentId: existing.userId },
      });
    }
  });

  // Fetch updated parent
  const parent = await getParent(schoolId, parentId);
  if (!parent) {
    throw new AppError('Failed to update parent.', 500);
  }

  return parent;
}

// ===========================================
// DELETE PARENT
// ===========================================

/**
 * Delete a parent (soft delete by deactivating user)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteParent(
  schoolId: string,
  parentId: string
): Promise<void> {
  // First verify parent belongs to school
  const existing = await prisma.parent.findFirst({
    where: {
      id: parentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      family: {
        include: {
          parents: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError('Parent not found.', 404);
  }

  // Check if this is the last parent in the family
  if (existing.family && existing.family.parents.length === 1) {
    // Check if family has students
    const studentsCount = await prisma.student.count({
      where: { familyId: existing.familyId! },
    });

    if (studentsCount > 0) {
      throw new AppError(
        'Cannot delete the last parent of a family with students. Reassign students first.',
        400
      );
    }
  }

  // Soft delete by deactivating user
  await prisma.user.update({
    where: { id: existing.userId },
    data: { isActive: false },
  });
}

