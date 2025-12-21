// ===========================================
// Family Service
// ===========================================
// Manages family records and member relationships

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Family, Parent, Student, User } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface FamilyWithMembers extends Family {
  parents: Array<Parent & { user: User }>;
  students: Student[];
}

export interface CreateFamilyInput {
  name: string;
  primaryParentId?: string;
}

export interface UpdateFamilyInput {
  name?: string;
  primaryParentId?: string;
}

// ===========================================
// GET ALL FAMILIES
// ===========================================

/**
 * Get all families for a school
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getFamilies(schoolId: string): Promise<FamilyWithMembers[]> {
  return prisma.family.findMany({
    where: {
      schoolId,
      deletionStatus: 'ACTIVE',
    },
    include: {
      parents: {
        include: {
          user: true,
        },
        orderBy: [
          { isPrimary: 'desc' },
          { user: { firstName: 'asc' } },
        ],
      },
      students: {
        where: { isActive: true },
        orderBy: { firstName: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
}

// ===========================================
// GET SINGLE FAMILY
// ===========================================

/**
 * Get a single family by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getFamily(
  schoolId: string,
  familyId: string
): Promise<FamilyWithMembers | null> {
  return prisma.family.findFirst({
    where: {
      id: familyId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      parents: {
        include: {
          user: true,
        },
        orderBy: [
          { isPrimary: 'desc' },
          { user: { firstName: 'asc' } },
        ],
      },
      students: {
        orderBy: { firstName: 'asc' },
      },
    },
  });
}

// ===========================================
// CREATE FAMILY
// ===========================================

/**
 * Create a new family
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createFamily(
  schoolId: string,
  data: CreateFamilyInput
): Promise<FamilyWithMembers> {
  const { name, primaryParentId } = data;

  // Verify primary parent belongs to school if provided
  if (primaryParentId) {
    const user = await prisma.user.findFirst({
      where: {
        id: primaryParentId,
        schoolId, // CRITICAL: Multi-tenancy filter
        role: 'PARENT',
      },
    });

    if (!user) {
      throw new AppError('Primary parent not found.', 404);
    }
  }

  // Check for duplicate name
  const existing = await prisma.family.findFirst({
    where: {
      schoolId,
      name,
      deletionStatus: 'ACTIVE',
    },
  });

  if (existing) {
    throw new AppError('A family with this name already exists.', 409);
  }

  const family = await prisma.family.create({
    data: {
      schoolId,
      name,
      primaryParentId,
    },
    include: {
      parents: {
        include: { user: true },
      },
      students: true,
    },
  });

  return family;
}

// ===========================================
// UPDATE FAMILY
// ===========================================

/**
 * Update a family
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateFamily(
  schoolId: string,
  familyId: string,
  data: UpdateFamilyInput
): Promise<FamilyWithMembers> {
  // First verify family belongs to school
  const existing = await prisma.family.findFirst({
    where: {
      id: familyId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Family not found.', 404);
  }

  // Verify new primary parent belongs to school if provided
  if (data.primaryParentId) {
    const user = await prisma.user.findFirst({
      where: {
        id: data.primaryParentId,
        schoolId, // CRITICAL: Multi-tenancy filter
        role: 'PARENT',
      },
    });

    if (!user) {
      throw new AppError('Primary parent not found.', 404);
    }
  }

  // Check for duplicate name (if name is being updated)
  if (data.name && data.name !== existing.name) {
    const duplicateName = await prisma.family.findFirst({
      where: {
        schoolId,
        name: data.name,
        deletionStatus: 'ACTIVE',
        id: { not: familyId },
      },
    });

    if (duplicateName) {
      throw new AppError('A family with this name already exists.', 409);
    }
  }

  const family = await prisma.family.update({
    where: { id: familyId },
    data: {
      name: data.name,
      primaryParentId: data.primaryParentId,
    },
    include: {
      parents: {
        include: { user: true },
      },
      students: true,
    },
  });

  return family;
}

// ===========================================
// DELETE FAMILY
// ===========================================

/**
 * Delete a family (soft delete)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteFamily(
  schoolId: string,
  familyId: string
): Promise<void> {
  // First verify family belongs to school
  const existing = await prisma.family.findFirst({
    where: {
      id: familyId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      _count: {
        select: {
          parents: true,
          students: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError('Family not found.', 404);
  }

  // Check if family has members
  if (existing._count.parents > 0 || existing._count.students > 0) {
    throw new AppError(
      'Cannot delete a family with members. Remove all parents and students first.',
      400
    );
  }

  // Soft delete
  await prisma.family.update({
    where: { id: familyId },
    data: {
      deletionStatus: 'SOFT_DELETED',
      deletedAt: new Date(),
    },
  });
}

// ===========================================
// MEMBER MANAGEMENT
// ===========================================

/**
 * Add a student to a family
 * SECURITY: Verifies both student and family belong to school
 */
export async function addStudentToFamily(
  schoolId: string,
  familyId: string,
  studentId: string
): Promise<FamilyWithMembers> {
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

  // Update student's family
  await prisma.student.update({
    where: { id: studentId },
    data: { familyId },
  });

  // Return updated family
  const updatedFamily = await getFamily(schoolId, familyId);
  if (!updatedFamily) {
    throw new AppError('Failed to update family.', 500);
  }

  return updatedFamily;
}

/**
 * Remove a student from a family
 * SECURITY: Verifies both student and family belong to school
 */
export async function removeStudentFromFamily(
  schoolId: string,
  familyId: string,
  studentId: string
): Promise<FamilyWithMembers> {
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

  // Verify student belongs to this family
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId, // CRITICAL: Multi-tenancy filter
      familyId,
    },
  });

  if (!student) {
    throw new AppError('Student not found in this family.', 404);
  }

  // Remove student from family
  await prisma.student.update({
    where: { id: studentId },
    data: { familyId: null },
  });

  // Return updated family
  const updatedFamily = await getFamily(schoolId, familyId);
  if (!updatedFamily) {
    throw new AppError('Failed to update family.', 500);
  }

  return updatedFamily;
}

/**
 * Add a parent to a family
 * SECURITY: Verifies both parent and family belong to school
 */
export async function addParentToFamily(
  schoolId: string,
  familyId: string,
  parentId: string,
  isPrimary: boolean = false
): Promise<FamilyWithMembers> {
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

  // Verify parent belongs to school
  const parent = await prisma.parent.findFirst({
    where: {
      id: parentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!parent) {
    throw new AppError('Parent not found.', 404);
  }

  // Update parent's family and primary status
  await prisma.$transaction(async (tx) => {
    await tx.parent.update({
      where: { id: parentId },
      data: { familyId, isPrimary },
    });

    // Update family primary parent if this is primary
    if (isPrimary) {
      await tx.family.update({
        where: { id: familyId },
        data: { primaryParentId: parent.userId },
      });
    }
  });

  // Return updated family
  const updatedFamily = await getFamily(schoolId, familyId);
  if (!updatedFamily) {
    throw new AppError('Failed to update family.', 500);
  }

  return updatedFamily;
}

/**
 * Remove a parent from a family
 * SECURITY: Verifies both parent and family belong to school
 */
export async function removeParentFromFamily(
  schoolId: string,
  familyId: string,
  parentId: string
): Promise<FamilyWithMembers> {
  // Verify family belongs to school
  const family = await prisma.family.findFirst({
    where: {
      id: familyId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      parents: true,
    },
  });

  if (!family) {
    throw new AppError('Family not found.', 404);
  }

  // Verify parent belongs to this family
  const parent = await prisma.parent.findFirst({
    where: {
      id: parentId,
      schoolId, // CRITICAL: Multi-tenancy filter
      familyId,
    },
  });

  if (!parent) {
    throw new AppError('Parent not found in this family.', 404);
  }

  // Check if this is the last parent
  if (family.parents.length === 1) {
    throw new AppError(
      'Cannot remove the last parent from a family.',
      400
    );
  }

  // Remove parent from family
  await prisma.$transaction(async (tx) => {
    await tx.parent.update({
      where: { id: parentId },
      data: { familyId: null, isPrimary: false },
    });

    // If this was the primary parent, update family
    if (family.primaryParentId === parent.userId) {
      // Find another parent to make primary
      const newPrimary = family.parents.find(p => p.id !== parentId);
      if (newPrimary) {
        await tx.family.update({
          where: { id: familyId },
          data: { primaryParentId: newPrimary.userId },
        });
        await tx.parent.update({
          where: { id: newPrimary.id },
          data: { isPrimary: true },
        });
      }
    }
  });

  // Return updated family
  const updatedFamily = await getFamily(schoolId, familyId);
  if (!updatedFamily) {
    throw new AppError('Failed to update family.', 500);
  }

  return updatedFamily;
}
