// ===========================================
// Term Service
// ===========================================
// Manages school terms (semesters/quarters)

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Term } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface CreateTermInput {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateTermInput {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export interface TermWithStats extends Term {
  _count?: {
    lessons: number;
  };
}

// ===========================================
// GET ALL TERMS
// ===========================================

/**
 * Get all terms for a school
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getTerms(schoolId: string): Promise<TermWithStats[]> {
  return prisma.term.findMany({
    where: { schoolId },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
    orderBy: { startDate: 'desc' },
  });
}

// ===========================================
// GET SINGLE TERM
// ===========================================

/**
 * Get a single term by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getTerm(
  schoolId: string,
  termId: string
): Promise<TermWithStats | null> {
  return prisma.term.findFirst({
    where: {
      id: termId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });
}

// ===========================================
// CREATE TERM
// ===========================================

/**
 * Create a new term
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createTerm(
  schoolId: string,
  data: CreateTermInput
): Promise<Term> {
  const { name, startDate, endDate } = data;

  // Validate date range
  if (startDate >= endDate) {
    throw new AppError('Start date must be before end date.', 400);
  }

  // Check for overlapping terms
  const overlapping = await prisma.term.findFirst({
    where: {
      schoolId,
      OR: [
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: startDate } },
          ],
        },
        {
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: endDate } },
          ],
        },
        {
          AND: [
            { startDate: { gte: startDate } },
            { endDate: { lte: endDate } },
          ],
        },
      ],
    },
  });

  if (overlapping) {
    throw new AppError(
      `Term dates overlap with existing term: ${overlapping.name}`,
      400
    );
  }

  // Check for duplicate name
  const existingName = await prisma.term.findFirst({
    where: {
      schoolId,
      name,
    },
  });

  if (existingName) {
    throw new AppError('A term with this name already exists.', 409);
  }

  return prisma.term.create({
    data: {
      schoolId,
      name,
      startDate,
      endDate,
    },
  });
}

// ===========================================
// UPDATE TERM
// ===========================================

/**
 * Update an existing term
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateTerm(
  schoolId: string,
  termId: string,
  data: UpdateTermInput
): Promise<Term> {
  // First verify term belongs to school
  const existing = await prisma.term.findFirst({
    where: {
      id: termId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Term not found.', 404);
  }

  const startDate = data.startDate ?? existing.startDate;
  const endDate = data.endDate ?? existing.endDate;

  // Validate date range if dates are being updated
  if (data.startDate || data.endDate) {
    if (startDate >= endDate) {
      throw new AppError('Start date must be before end date.', 400);
    }

    // Check for overlapping terms (excluding current term)
    const overlapping = await prisma.term.findFirst({
      where: {
        schoolId,
        id: { not: termId },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new AppError(
        `Term dates overlap with existing term: ${overlapping.name}`,
        400
      );
    }
  }

  // Check for duplicate name (if name is being updated)
  if (data.name && data.name !== existing.name) {
    const existingName = await prisma.term.findFirst({
      where: {
        schoolId,
        name: data.name,
        id: { not: termId },
      },
    });

    if (existingName) {
      throw new AppError('A term with this name already exists.', 409);
    }
  }

  return prisma.term.update({
    where: { id: termId },
    data: {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
    },
  });
}

// ===========================================
// DELETE TERM
// ===========================================

/**
 * Delete a term (soft delete by setting isActive = false, or hard delete if no lessons)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteTerm(
  schoolId: string,
  termId: string
): Promise<void> {
  // First verify term belongs to school
  const existing = await prisma.term.findFirst({
    where: {
      id: termId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });

  if (!existing) {
    throw new AppError('Term not found.', 404);
  }

  // If term has lessons, soft delete by deactivating
  if (existing._count.lessons > 0) {
    await prisma.term.update({
      where: { id: termId },
      data: { isActive: false },
    });
  } else {
    // No lessons, safe to hard delete
    await prisma.term.delete({
      where: { id: termId },
    });
  }
}

// ===========================================
// GET CURRENT TERM
// ===========================================

/**
 * Get the currently active term based on today's date
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getCurrentTerm(schoolId: string): Promise<Term | null> {
  const today = new Date();

  return prisma.term.findFirst({
    where: {
      schoolId,
      isActive: true,
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });
}

// ===========================================
// GET UPCOMING TERMS
// ===========================================

/**
 * Get upcoming terms (starting after today)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getUpcomingTerms(schoolId: string): Promise<Term[]> {
  const today = new Date();

  return prisma.term.findMany({
    where: {
      schoolId,
      isActive: true,
      startDate: { gt: today },
    },
    orderBy: { startDate: 'asc' },
  });
}
