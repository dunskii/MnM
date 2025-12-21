// ===========================================
// Config Service
// ===========================================
// Manages configurable items: Instruments, Lesson Types, Lesson Durations

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Instrument, LessonType, LessonDuration, LessonTypeEnum } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

// Instruments
export interface CreateInstrumentInput {
  name: string;
  sortOrder?: number;
}

export interface UpdateInstrumentInput {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Lesson Types
export interface CreateLessonTypeInput {
  name: string;
  type: LessonTypeEnum;
  defaultDuration: number;
  description?: string;
  sortOrder?: number;
}

export interface UpdateLessonTypeInput {
  name?: string;
  type?: LessonTypeEnum;
  defaultDuration?: number;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Lesson Durations
export interface CreateLessonDurationInput {
  minutes: number;
}

export interface UpdateLessonDurationInput {
  minutes?: number;
  isActive?: boolean;
}

// ===========================================
// INSTRUMENT FUNCTIONS
// ===========================================

/**
 * Get all instruments for a school
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getInstruments(schoolId: string): Promise<Instrument[]> {
  return prisma.instrument.findMany({
    where: { schoolId },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get a single instrument by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getInstrument(
  schoolId: string,
  instrumentId: string
): Promise<Instrument | null> {
  return prisma.instrument.findFirst({
    where: {
      id: instrumentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });
}

/**
 * Create a new instrument
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createInstrument(
  schoolId: string,
  data: CreateInstrumentInput
): Promise<Instrument> {
  const { name, sortOrder } = data;

  // Check for duplicate name (unique constraint exists)
  const existing = await prisma.instrument.findUnique({
    where: {
      schoolId_name: {
        schoolId,
        name,
      },
    },
  });

  if (existing) {
    throw new AppError('An instrument with this name already exists.', 409);
  }

  // Get max sortOrder if not provided
  let order = sortOrder;
  if (order === undefined) {
    const maxOrder = await prisma.instrument.findFirst({
      where: { schoolId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    order = (maxOrder?.sortOrder ?? 0) + 1;
  }

  return prisma.instrument.create({
    data: {
      schoolId,
      name,
      sortOrder: order,
    },
  });
}

/**
 * Update an instrument
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateInstrument(
  schoolId: string,
  instrumentId: string,
  data: UpdateInstrumentInput
): Promise<Instrument> {
  // First verify instrument belongs to school
  const existing = await prisma.instrument.findFirst({
    where: {
      id: instrumentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Instrument not found.', 404);
  }

  // Check for duplicate name (if name is being updated)
  if (data.name && data.name !== existing.name) {
    const duplicateName = await prisma.instrument.findFirst({
      where: {
        schoolId,
        name: data.name,
        id: { not: instrumentId },
      },
    });

    if (duplicateName) {
      throw new AppError('An instrument with this name already exists.', 409);
    }
  }

  return prisma.instrument.update({
    where: { id: instrumentId },
    data: {
      name: data.name,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

/**
 * Delete an instrument
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteInstrument(
  schoolId: string,
  instrumentId: string
): Promise<void> {
  // First verify instrument belongs to school
  const existing = await prisma.instrument.findFirst({
    where: {
      id: instrumentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      _count: {
        select: {
          teachers: true,
          lessons: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError('Instrument not found.', 404);
  }

  // If instrument is in use, soft delete by deactivating
  if (existing._count.teachers > 0 || existing._count.lessons > 0) {
    await prisma.instrument.update({
      where: { id: instrumentId },
      data: { isActive: false },
    });
  } else {
    // Not in use, safe to hard delete
    await prisma.instrument.delete({
      where: { id: instrumentId },
    });
  }
}

// ===========================================
// LESSON TYPE FUNCTIONS
// ===========================================

/**
 * Get all lesson types for a school
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getLessonTypes(schoolId: string): Promise<LessonType[]> {
  return prisma.lessonType.findMany({
    where: { schoolId },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get a single lesson type by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getLessonType(
  schoolId: string,
  lessonTypeId: string
): Promise<LessonType | null> {
  return prisma.lessonType.findFirst({
    where: {
      id: lessonTypeId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });
}

/**
 * Create a new lesson type
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createLessonType(
  schoolId: string,
  data: CreateLessonTypeInput
): Promise<LessonType> {
  const { name, type, defaultDuration, description, sortOrder } = data;

  // Check for duplicate name (unique constraint exists)
  const existing = await prisma.lessonType.findUnique({
    where: {
      schoolId_name: {
        schoolId,
        name,
      },
    },
  });

  if (existing) {
    throw new AppError('A lesson type with this name already exists.', 409);
  }

  // Get max sortOrder if not provided
  let order = sortOrder;
  if (order === undefined) {
    const maxOrder = await prisma.lessonType.findFirst({
      where: { schoolId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    order = (maxOrder?.sortOrder ?? 0) + 1;
  }

  return prisma.lessonType.create({
    data: {
      schoolId,
      name,
      type,
      defaultDuration,
      description,
      sortOrder: order,
    },
  });
}

/**
 * Update a lesson type
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateLessonType(
  schoolId: string,
  lessonTypeId: string,
  data: UpdateLessonTypeInput
): Promise<LessonType> {
  // First verify lesson type belongs to school
  const existing = await prisma.lessonType.findFirst({
    where: {
      id: lessonTypeId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Lesson type not found.', 404);
  }

  // Check for duplicate name (if name is being updated)
  if (data.name && data.name !== existing.name) {
    const duplicateName = await prisma.lessonType.findFirst({
      where: {
        schoolId,
        name: data.name,
        id: { not: lessonTypeId },
      },
    });

    if (duplicateName) {
      throw new AppError('A lesson type with this name already exists.', 409);
    }
  }

  return prisma.lessonType.update({
    where: { id: lessonTypeId },
    data: {
      name: data.name,
      type: data.type,
      defaultDuration: data.defaultDuration,
      description: data.description,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

/**
 * Delete a lesson type
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteLessonType(
  schoolId: string,
  lessonTypeId: string
): Promise<void> {
  // First verify lesson type belongs to school
  const existing = await prisma.lessonType.findFirst({
    where: {
      id: lessonTypeId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });

  if (!existing) {
    throw new AppError('Lesson type not found.', 404);
  }

  // If lesson type is in use, soft delete by deactivating
  if (existing._count.lessons > 0) {
    await prisma.lessonType.update({
      where: { id: lessonTypeId },
      data: { isActive: false },
    });
  } else {
    // Not in use, safe to hard delete
    await prisma.lessonType.delete({
      where: { id: lessonTypeId },
    });
  }
}

// ===========================================
// LESSON DURATION FUNCTIONS
// ===========================================

/**
 * Get all lesson durations for a school
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getLessonDurations(schoolId: string): Promise<LessonDuration[]> {
  return prisma.lessonDuration.findMany({
    where: { schoolId },
    orderBy: { minutes: 'asc' },
  });
}

/**
 * Get a single lesson duration by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getLessonDuration(
  schoolId: string,
  durationId: string
): Promise<LessonDuration | null> {
  return prisma.lessonDuration.findFirst({
    where: {
      id: durationId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });
}

/**
 * Create a new lesson duration
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createLessonDuration(
  schoolId: string,
  data: CreateLessonDurationInput
): Promise<LessonDuration> {
  const { minutes } = data;

  // Validate duration
  if (minutes < 15 || minutes > 180) {
    throw new AppError('Duration must be between 15 and 180 minutes.', 400);
  }

  // Check for duplicate duration (unique constraint exists)
  const existing = await prisma.lessonDuration.findUnique({
    where: {
      schoolId_minutes: {
        schoolId,
        minutes,
      },
    },
  });

  if (existing) {
    throw new AppError('This duration already exists.', 409);
  }

  return prisma.lessonDuration.create({
    data: {
      schoolId,
      minutes,
    },
  });
}

/**
 * Update a lesson duration
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateLessonDuration(
  schoolId: string,
  durationId: string,
  data: UpdateLessonDurationInput
): Promise<LessonDuration> {
  // First verify duration belongs to school
  const existing = await prisma.lessonDuration.findFirst({
    where: {
      id: durationId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Lesson duration not found.', 404);
  }

  // Validate new duration if provided
  if (data.minutes !== undefined) {
    if (data.minutes < 15 || data.minutes > 180) {
      throw new AppError('Duration must be between 15 and 180 minutes.', 400);
    }

    // Check for duplicate duration (if minutes is being updated)
    if (data.minutes !== existing.minutes) {
      const duplicate = await prisma.lessonDuration.findFirst({
        where: {
          schoolId,
          minutes: data.minutes,
          id: { not: durationId },
        },
      });

      if (duplicate) {
        throw new AppError('This duration already exists.', 409);
      }
    }
  }

  return prisma.lessonDuration.update({
    where: { id: durationId },
    data: {
      minutes: data.minutes,
      isActive: data.isActive,
    },
  });
}

/**
 * Delete a lesson duration
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteLessonDuration(
  schoolId: string,
  durationId: string
): Promise<void> {
  // First verify duration belongs to school
  const existing = await prisma.lessonDuration.findFirst({
    where: {
      id: durationId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Lesson duration not found.', 404);
  }

  // Lesson durations are not directly referenced, safe to delete
  // But soft delete is preferred for audit trail
  await prisma.lessonDuration.update({
    where: { id: durationId },
    data: { isActive: false },
  });
}
