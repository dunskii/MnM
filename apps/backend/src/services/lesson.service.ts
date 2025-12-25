// ===========================================
// Lesson Service
// ===========================================
// Manages lessons, enrollments, and hybrid patterns
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  Lesson,
  LessonEnrollment,
  HybridLessonPattern,
  LessonType,
  Term,
  Teacher,
  Room,
  Instrument,
  Student,
  HybridPatternType,
} from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface LessonWithRelations extends Lesson {
  lessonType: LessonType;
  term: Term;
  teacher: Teacher & {
    user: { id: string; firstName: string; lastName: string };
  };
  room: Room & {
    location: { id: string; name: string };
  };
  instrument: Instrument | null;
  hybridPattern: HybridLessonPattern | null;
  enrollments: Array<{
    id: string;
    enrolledAt: Date;
    isActive: boolean;
    student: Student;
  }>;
  _count: { enrollments: number };
}

export interface EnrollmentWithStudent extends LessonEnrollment {
  student: Student;
}

export interface LessonFilters {
  termId?: string;
  teacherId?: string;
  roomId?: string;
  instrumentId?: string;
  lessonTypeId?: string;
  dayOfWeek?: number;
  isActive?: boolean;
}

export interface CreateLessonInput {
  lessonTypeId: string;
  termId: string;
  teacherId: string;
  roomId: string;
  instrumentId?: string;
  name: string;
  description?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMins: number;
  maxStudents: number;
  isRecurring?: boolean;
  hybridPattern?: {
    patternType: 'ALTERNATING' | 'CUSTOM';
    groupWeeks: number[];
    individualWeeks: number[];
    individualSlotDuration: number;
    bookingDeadlineHours: number;
  };
}

export interface UpdateLessonInput {
  lessonTypeId?: string;
  termId?: string;
  teacherId?: string;
  roomId?: string;
  instrumentId?: string | null;
  name?: string;
  description?: string | null;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  durationMins?: number;
  maxStudents?: number;
  isRecurring?: boolean;
  isActive?: boolean;
  hybridPattern?: {
    patternType: 'ALTERNATING' | 'CUSTOM';
    groupWeeks: number[];
    individualWeeks: number[];
    individualSlotDuration: number;
    bookingDeadlineHours: number;
  } | null;
}

// ===========================================
// INCLUDE DEFINITION
// ===========================================

// Prisma include configuration for lessons with relations
const lessonInclude = {
  lessonType: true,
  term: true,
  teacher: {
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  },
  room: {
    include: {
      location: {
        select: { id: true, name: true },
      },
    },
  },
  instrument: true,
  hybridPattern: true,
  enrollments: {
    where: { isActive: true },
    include: { student: true },
    orderBy: { enrolledAt: 'asc' as const },
  },
  _count: {
    select: { enrollments: true },
  },
} as const;

// Type for Prisma query result with the above includes
type LessonQueryResult = Awaited<ReturnType<typeof prisma.lesson.findFirst<{
  include: typeof lessonInclude;
}>>>;

/**
 * Helper to cast Prisma results to our domain type
 * This is necessary because Prisma's inferred types don't perfectly match our interface
 */
function toLessonWithRelations(lesson: NonNullable<LessonQueryResult>): LessonWithRelations {
  return lesson as unknown as LessonWithRelations;
}

function toLessonsWithRelations(lessons: NonNullable<LessonQueryResult>[]): LessonWithRelations[] {
  return lessons as unknown as LessonWithRelations[];
}

// ===========================================
// GET ALL LESSONS
// ===========================================

/**
 * Get all lessons for a school with optional filters
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getLessons(
  schoolId: string,
  filters?: LessonFilters
): Promise<LessonWithRelations[]> {
  const where: Record<string, unknown> = { schoolId };

  if (filters) {
    if (filters.termId) where.termId = filters.termId;
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.instrumentId) where.instrumentId = filters.instrumentId;
    if (filters.lessonTypeId) where.lessonTypeId = filters.lessonTypeId;
    if (filters.dayOfWeek !== undefined) where.dayOfWeek = filters.dayOfWeek;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
  }

  const lessons = await prisma.lesson.findMany({
    where,
    include: lessonInclude,
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return toLessonsWithRelations(lessons);
}

// ===========================================
// GET SINGLE LESSON
// ===========================================

/**
 * Get a single lesson by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getLesson(
  schoolId: string,
  lessonId: string
): Promise<LessonWithRelations | null> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: lessonInclude,
  });

  return lesson ? toLessonWithRelations(lesson) : null;
}

// ===========================================
// VALIDATION HELPERS
// ===========================================

/**
 * Check if a room is available at a given time
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function validateRoomAvailability(
  schoolId: string,
  roomId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeLessonId?: string
): Promise<{ available: boolean; conflictingLesson?: Lesson }> {
  // Find any conflicting lessons
  const conflictingLesson = await prisma.lesson.findFirst({
    where: {
      schoolId, // CRITICAL: Multi-tenancy filter
      roomId,
      dayOfWeek,
      isActive: true,
      id: excludeLessonId ? { not: excludeLessonId } : undefined,
      // Check for time overlap
      OR: [
        // New lesson starts during existing lesson
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        // New lesson ends during existing lesson
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        // New lesson contains existing lesson
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
  });

  return {
    available: !conflictingLesson,
    conflictingLesson: conflictingLesson || undefined,
  };
}

/**
 * Check if a teacher is available at a given time
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function validateTeacherAvailability(
  schoolId: string,
  teacherId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeLessonId?: string
): Promise<{ available: boolean; conflictingLesson?: Lesson }> {
  // Find any conflicting lessons
  const conflictingLesson = await prisma.lesson.findFirst({
    where: {
      schoolId, // CRITICAL: Multi-tenancy filter
      teacherId,
      dayOfWeek,
      isActive: true,
      id: excludeLessonId ? { not: excludeLessonId } : undefined,
      // Check for time overlap
      OR: [
        // New lesson starts during existing lesson
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        // New lesson ends during existing lesson
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        // New lesson contains existing lesson
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
    include: {
      room: { include: { location: true } },
    },
  });

  return {
    available: !conflictingLesson,
    conflictingLesson: conflictingLesson || undefined,
  };
}

/**
 * Check enrollment capacity for a lesson
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function checkEnrollmentCapacity(
  schoolId: string,
  lessonId: string
): Promise<{ current: number; max: number; available: number }> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    select: {
      maxStudents: true,
      _count: {
        select: {
          enrollments: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  const current = lesson._count.enrollments;
  const max = lesson.maxStudents;

  return {
    current,
    max,
    available: max - current,
  };
}

/**
 * Validate that all referenced IDs belong to the school
 */
async function validateReferences(
  schoolId: string,
  data: {
    lessonTypeId?: string;
    termId?: string;
    teacherId?: string;
    roomId?: string;
    instrumentId?: string | null;
  }
): Promise<void> {
  const errors: string[] = [];

  // Validate lessonTypeId
  if (data.lessonTypeId) {
    const lessonType = await prisma.lessonType.findFirst({
      where: { id: data.lessonTypeId, schoolId },
    });
    if (!lessonType) errors.push('Invalid lesson type.');
  }

  // Validate termId
  if (data.termId) {
    const term = await prisma.term.findFirst({
      where: { id: data.termId, schoolId },
    });
    if (!term) errors.push('Invalid term.');
  }

  // Validate teacherId
  if (data.teacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: data.teacherId, schoolId },
    });
    if (!teacher) errors.push('Invalid teacher.');
  }

  // Validate roomId
  if (data.roomId) {
    const room = await prisma.room.findFirst({
      where: { id: data.roomId },
      include: { location: true },
    });
    if (!room || room.location.schoolId !== schoolId) {
      errors.push('Invalid room.');
    }
  }

  // Validate instrumentId
  if (data.instrumentId) {
    const instrument = await prisma.instrument.findFirst({
      where: { id: data.instrumentId, schoolId },
    });
    if (!instrument) errors.push('Invalid instrument.');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join(' '), 400);
  }
}

// ===========================================
// CREATE LESSON
// ===========================================

/**
 * Create a new lesson
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createLesson(
  schoolId: string,
  data: CreateLessonInput
): Promise<LessonWithRelations> {
  // Validate all referenced IDs belong to the school
  await validateReferences(schoolId, data);

  // Check room availability
  const roomCheck = await validateRoomAvailability(
    schoolId,
    data.roomId,
    data.dayOfWeek,
    data.startTime,
    data.endTime
  );
  if (!roomCheck.available) {
    throw new AppError(
      `Room is not available at this time. Conflicts with another lesson.`,
      409
    );
  }

  // Check teacher availability
  const teacherCheck = await validateTeacherAvailability(
    schoolId,
    data.teacherId,
    data.dayOfWeek,
    data.startTime,
    data.endTime
  );
  if (!teacherCheck.available) {
    throw new AppError(
      `Teacher is not available at this time. Conflicts with another lesson.`,
      409
    );
  }

  // Get the lesson type to check if it's HYBRID
  const lessonType = await prisma.lessonType.findFirst({
    where: { id: data.lessonTypeId, schoolId },
  });

  if (!lessonType) {
    throw new AppError('Lesson type not found.', 404);
  }

  // Validate hybrid pattern for HYBRID lessons
  if (lessonType.type === 'HYBRID' && !data.hybridPattern) {
    throw new AppError('Hybrid lessons require a hybrid pattern configuration.', 400);
  }

  // Create lesson with optional hybrid pattern
  const result = await prisma.$transaction(async (tx) => {
    // Create the lesson
    const lesson = await tx.lesson.create({
      data: {
        schoolId,
        lessonTypeId: data.lessonTypeId,
        termId: data.termId,
        teacherId: data.teacherId,
        roomId: data.roomId,
        instrumentId: data.instrumentId,
        name: data.name,
        description: data.description,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMins: data.durationMins,
        maxStudents: data.maxStudents,
        isRecurring: data.isRecurring ?? true,
      },
    });

    // Create hybrid pattern if provided
    if (data.hybridPattern && lessonType.type === 'HYBRID') {
      await tx.hybridLessonPattern.create({
        data: {
          lessonId: lesson.id,
          termId: data.termId,
          patternType: data.hybridPattern.patternType as HybridPatternType,
          groupWeeks: data.hybridPattern.groupWeeks,
          individualWeeks: data.hybridPattern.individualWeeks,
          individualSlotDuration: data.hybridPattern.individualSlotDuration,
          bookingDeadlineHours: data.hybridPattern.bookingDeadlineHours,
        },
      });
    }

    return lesson;
  });

  // Fetch and return the complete lesson
  const lesson = await getLesson(schoolId, result.id);
  if (!lesson) {
    throw new AppError('Failed to create lesson.', 500);
  }

  return lesson;
}

// ===========================================
// UPDATE LESSON
// ===========================================

/**
 * Update a lesson
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateLesson(
  schoolId: string,
  lessonId: string,
  data: UpdateLessonInput
): Promise<LessonWithRelations> {
  // Verify lesson belongs to school
  const existing = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: { lessonType: true },
  });

  if (!existing) {
    throw new AppError('Lesson not found.', 404);
  }

  // Validate any new references
  await validateReferences(schoolId, data);

  // If time or room changes, validate availability
  const newRoomId = data.roomId || existing.roomId;
  const newDayOfWeek = data.dayOfWeek ?? existing.dayOfWeek;
  const newStartTime = data.startTime || existing.startTime;
  const newEndTime = data.endTime || existing.endTime;
  const newTeacherId = data.teacherId || existing.teacherId;

  // Check room availability if room or time changed
  if (
    data.roomId ||
    data.dayOfWeek !== undefined ||
    data.startTime ||
    data.endTime
  ) {
    const roomCheck = await validateRoomAvailability(
      schoolId,
      newRoomId,
      newDayOfWeek,
      newStartTime,
      newEndTime,
      lessonId // Exclude current lesson
    );
    if (!roomCheck.available) {
      throw new AppError(
        `Room is not available at this time. Conflicts with another lesson.`,
        409
      );
    }
  }

  // Check teacher availability if teacher or time changed
  if (
    data.teacherId ||
    data.dayOfWeek !== undefined ||
    data.startTime ||
    data.endTime
  ) {
    const teacherCheck = await validateTeacherAvailability(
      schoolId,
      newTeacherId,
      newDayOfWeek,
      newStartTime,
      newEndTime,
      lessonId // Exclude current lesson
    );
    if (!teacherCheck.available) {
      throw new AppError(
        `Teacher is not available at this time. Conflicts with another lesson.`,
        409
      );
    }
  }

  // Update lesson and hybrid pattern in transaction
  await prisma.$transaction(async (tx) => {
    // Update the lesson
    await tx.lesson.update({
      where: { id: lessonId },
      data: {
        lessonTypeId: data.lessonTypeId,
        termId: data.termId,
        teacherId: data.teacherId,
        roomId: data.roomId,
        instrumentId: data.instrumentId,
        name: data.name,
        description: data.description,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMins: data.durationMins,
        maxStudents: data.maxStudents,
        isRecurring: data.isRecurring,
        isActive: data.isActive,
      },
    });

    // Handle hybrid pattern updates
    if (data.hybridPattern !== undefined) {
      if (data.hybridPattern === null) {
        // Remove hybrid pattern
        await tx.hybridLessonPattern.deleteMany({
          where: { lessonId },
        });
      } else {
        // Update or create hybrid pattern
        const existingPattern = await tx.hybridLessonPattern.findUnique({
          where: { lessonId },
        });

        if (existingPattern) {
          await tx.hybridLessonPattern.update({
            where: { lessonId },
            data: {
              termId: data.termId || existing.termId,
              patternType: data.hybridPattern.patternType as HybridPatternType,
              groupWeeks: data.hybridPattern.groupWeeks,
              individualWeeks: data.hybridPattern.individualWeeks,
              individualSlotDuration: data.hybridPattern.individualSlotDuration,
              bookingDeadlineHours: data.hybridPattern.bookingDeadlineHours,
            },
          });
        } else {
          await tx.hybridLessonPattern.create({
            data: {
              lessonId,
              termId: data.termId || existing.termId,
              patternType: data.hybridPattern.patternType as HybridPatternType,
              groupWeeks: data.hybridPattern.groupWeeks,
              individualWeeks: data.hybridPattern.individualWeeks,
              individualSlotDuration: data.hybridPattern.individualSlotDuration,
              bookingDeadlineHours: data.hybridPattern.bookingDeadlineHours,
            },
          });
        }
      }
    }
  });

  // Fetch and return the updated lesson
  const lesson = await getLesson(schoolId, lessonId);
  if (!lesson) {
    throw new AppError('Failed to update lesson.', 500);
  }

  return lesson;
}

// ===========================================
// DELETE LESSON
// ===========================================

/**
 * Soft delete a lesson
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteLesson(
  schoolId: string,
  lessonId: string
): Promise<void> {
  // Verify lesson belongs to school
  const existing = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Lesson not found.', 404);
  }

  // Soft delete by setting isActive to false
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { isActive: false },
  });
}

// ===========================================
// ENROLLMENT OPERATIONS
// ===========================================

/**
 * Get all enrollments for a lesson
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getEnrollments(
  schoolId: string,
  lessonId: string
): Promise<EnrollmentWithStudent[]> {
  // Verify lesson belongs to school
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  return prisma.lessonEnrollment.findMany({
    where: {
      lessonId,
      isActive: true,
    },
    include: { student: true },
    orderBy: { enrolledAt: 'asc' },
  });
}

/**
 * Enroll a student in a lesson
 * SECURITY: Verifies both lesson and student belong to school
 */
export async function enrollStudent(
  schoolId: string,
  lessonId: string,
  studentId: string
): Promise<EnrollmentWithStudent> {
  // Verify lesson belongs to school
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
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

  // Check capacity
  const capacity = await checkEnrollmentCapacity(schoolId, lessonId);
  if (capacity.available <= 0) {
    throw new AppError('This lesson is at full capacity.', 409);
  }

  // Check if already enrolled
  const existing = await prisma.lessonEnrollment.findUnique({
    where: {
      lessonId_studentId: {
        lessonId,
        studentId,
      },
    },
  });

  if (existing) {
    if (existing.isActive) {
      throw new AppError('Student is already enrolled in this lesson.', 409);
    }
    // Re-activate existing enrollment
    return prisma.lessonEnrollment.update({
      where: {
        lessonId_studentId: {
          lessonId,
          studentId,
        },
      },
      data: { isActive: true },
      include: { student: true },
    });
  }

  // Create new enrollment
  return prisma.lessonEnrollment.create({
    data: {
      lessonId,
      studentId,
    },
    include: { student: true },
  });
}

/**
 * Bulk enroll students in a lesson
 * SECURITY: Verifies lesson and all students belong to school
 */
export async function bulkEnrollStudents(
  schoolId: string,
  lessonId: string,
  studentIds: string[]
): Promise<EnrollmentWithStudent[]> {
  // Verify lesson belongs to school
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  // Verify all students belong to school
  const validStudents = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    select: { id: true },
  });

  const validStudentIds = validStudents.map((s) => s.id);
  const invalidIds = studentIds.filter((id) => !validStudentIds.includes(id));

  if (invalidIds.length > 0) {
    throw new AppError(`Some students were not found: ${invalidIds.join(', ')}`, 400);
  }

  // Check capacity
  const capacity = await checkEnrollmentCapacity(schoolId, lessonId);
  if (capacity.available < studentIds.length) {
    throw new AppError(
      `Not enough capacity. Available spots: ${capacity.available}, requested: ${studentIds.length}`,
      409
    );
  }

  // Get existing enrollments
  const existingEnrollments = await prisma.lessonEnrollment.findMany({
    where: {
      lessonId,
      studentId: { in: studentIds },
    },
  });

  const existingMap = new Map(existingEnrollments.map((e) => [e.studentId, e]));
  const toCreate: string[] = [];
  const toReactivate: string[] = [];
  const alreadyActive: string[] = [];

  for (const studentId of studentIds) {
    const existing = existingMap.get(studentId);
    if (!existing) {
      toCreate.push(studentId);
    } else if (!existing.isActive) {
      toReactivate.push(studentId);
    } else {
      alreadyActive.push(studentId);
    }
  }

  // Process enrollments in transaction
  await prisma.$transaction(async (tx) => {
    // Create new enrollments
    if (toCreate.length > 0) {
      await tx.lessonEnrollment.createMany({
        data: toCreate.map((studentId) => ({
          lessonId,
          studentId,
        })),
      });
    }

    // Reactivate existing enrollments
    if (toReactivate.length > 0) {
      await tx.lessonEnrollment.updateMany({
        where: {
          lessonId,
          studentId: { in: toReactivate },
        },
        data: { isActive: true },
      });
    }
  });

  // Return all enrollments
  return prisma.lessonEnrollment.findMany({
    where: {
      lessonId,
      studentId: { in: studentIds },
      isActive: true,
    },
    include: { student: true },
    orderBy: { enrolledAt: 'asc' },
  });
}

/**
 * Unenroll a student from a lesson
 * SECURITY: Verifies lesson belongs to school
 */
export async function unenrollStudent(
  schoolId: string,
  lessonId: string,
  studentId: string
): Promise<void> {
  // Verify lesson belongs to school
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  // Check if enrollment exists
  const enrollment = await prisma.lessonEnrollment.findUnique({
    where: {
      lessonId_studentId: {
        lessonId,
        studentId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError('Student is not enrolled in this lesson.', 404);
  }

  // Soft delete by setting isActive to false
  await prisma.lessonEnrollment.update({
    where: {
      lessonId_studentId: {
        lessonId,
        studentId,
      },
    },
    data: { isActive: false },
  });
}

// ===========================================
// RESCHEDULE OPERATIONS (Drag-and-Drop)
// ===========================================

export interface RescheduleInput {
  newDayOfWeek: number;
  newStartTime: string;
  newEndTime: string;
  notifyParents?: boolean;
  reason?: string;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  teacherConflict: {
    lessonId: string;
    lessonName: string;
    time: string;
  } | null;
  roomConflict: {
    lessonId: string;
    lessonName: string;
    time: string;
  } | null;
  affectedStudents: number;
  affectedEnrollments: {
    studentId: string;
    studentName: string;
    hasOtherLessons: boolean;
  }[];
}

/**
 * Check for conflicts before rescheduling a lesson
 * Used for drag-and-drop preview
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function checkRescheduleConflicts(
  schoolId: string,
  lessonId: string,
  input: { newDayOfWeek: number; newStartTime: string; newEndTime: string }
): Promise<ConflictCheckResult> {
  const lesson = await getLesson(schoolId, lessonId);

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  // Check teacher availability
  const teacherCheck = await validateTeacherAvailability(
    schoolId,
    lesson.teacher.id,
    input.newDayOfWeek,
    input.newStartTime,
    input.newEndTime,
    lessonId
  );

  // Check room availability
  const roomCheck = await validateRoomAvailability(
    schoolId,
    lesson.room.id,
    input.newDayOfWeek,
    input.newStartTime,
    input.newEndTime,
    lessonId
  );

  // Count affected students (enrolled students)
  const affectedEnrollments = lesson.enrollments
    .filter((e) => e.isActive)
    .map((e) => ({
      studentId: e.student.id,
      studentName: `${e.student.firstName} ${e.student.lastName}`,
      hasOtherLessons: false, // Can be enhanced later to check other enrollments
    }));

  return {
    hasConflicts: !teacherCheck.available || !roomCheck.available,
    teacherConflict: teacherCheck.conflictingLesson
      ? {
          lessonId: teacherCheck.conflictingLesson.id,
          lessonName: teacherCheck.conflictingLesson.name,
          time: `${teacherCheck.conflictingLesson.startTime} - ${teacherCheck.conflictingLesson.endTime}`,
        }
      : null,
    roomConflict: roomCheck.conflictingLesson
      ? {
          lessonId: roomCheck.conflictingLesson.id,
          lessonName: roomCheck.conflictingLesson.name,
          time: `${roomCheck.conflictingLesson.startTime} - ${roomCheck.conflictingLesson.endTime}`,
        }
      : null,
    affectedStudents: affectedEnrollments.length,
    affectedEnrollments,
  };
}

/**
 * Reschedule a lesson (for drag-and-drop)
 * Validates conflicts and optionally queues notification emails
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function rescheduleLesson(
  schoolId: string,
  lessonId: string,
  input: RescheduleInput,
  _performedByUserId: string
): Promise<LessonWithRelations> {
  // Get existing lesson to store old values
  const existing = await getLesson(schoolId, lessonId);

  if (!existing) {
    throw new AppError('Lesson not found.', 404);
  }

  // Store old values for notification
  const oldDayOfWeek = existing.dayOfWeek;
  const oldStartTime = existing.startTime;
  const oldEndTime = existing.endTime;

  // Check for conflicts
  const conflicts = await checkRescheduleConflicts(schoolId, lessonId, {
    newDayOfWeek: input.newDayOfWeek,
    newStartTime: input.newStartTime,
    newEndTime: input.newEndTime,
  });

  if (conflicts.hasConflicts) {
    if (conflicts.teacherConflict) {
      throw new AppError(
        `Teacher is not available at this time. Conflicts with: ${conflicts.teacherConflict.lessonName}`,
        409
      );
    }
    if (conflicts.roomConflict) {
      throw new AppError(
        `Room is not available at this time. Conflicts with: ${conflicts.roomConflict.lessonName}`,
        409
      );
    }
  }

  // Calculate new duration
  const durationMins = calculateDurationMins(input.newStartTime, input.newEndTime);

  // Update the lesson
  const updatedLesson = await updateLesson(schoolId, lessonId, {
    dayOfWeek: input.newDayOfWeek,
    startTime: input.newStartTime,
    endTime: input.newEndTime,
    durationMins,
  });

  // Queue notification emails if requested
  if (input.notifyParents !== false) {
    // Import dynamically to avoid circular dependencies
    const { queueLessonRescheduledEmail } = await import('../jobs/emailNotification.job');
    await queueLessonRescheduledEmail(
      schoolId,
      lessonId,
      oldDayOfWeek,
      oldStartTime,
      oldEndTime,
      input.reason
    );
  }

  return updatedLesson;
}

/**
 * Calculate duration in minutes from start and end times
 */
function calculateDurationMins(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}
