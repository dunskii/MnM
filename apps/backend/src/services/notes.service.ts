// ===========================================
// Notes Service
// ===========================================
// Manages teacher notes for classes and students
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy
//
// Note Types:
// - Class notes: lessonId set, studentId null (one per lesson per date)
// - Student notes: studentId set, lessonId optional (per student, optionally linked to lesson)
//
// Note Status:
// - PENDING: No notes added for lesson on date
// - PARTIAL: Class note OR some student notes exist (not complete)
// - COMPLETE: Class note AND all enrolled students have notes

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  Note,
  NoteStatus,
  Lesson,
  Student,
} from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface NoteWithRelations extends Note {
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lesson?: Lesson & {
    teacher: {
      user: { id: string; firstName: string; lastName: string };
    };
    room: {
      name: string;
      location: { name: string };
    };
  } | null;
  student?: Student | null;
}

export interface CreateNoteInput {
  lessonId?: string;
  studentId?: string;
  date: Date;
  content: string;
  isPrivate?: boolean;
}

export interface UpdateNoteInput {
  content?: string;
  isPrivate?: boolean;
}

export interface NotesByLessonFilter {
  date?: Date;
  authorId?: string;
  isPrivate?: boolean;
}

export interface NotesByStudentFilter {
  lessonId?: string;
  startDate?: Date;
  endDate?: Date;
  isPrivate?: boolean;
}

export interface NotesByDateFilter {
  lessonId?: string;
  authorId?: string;
}

export interface NoteCompletionStatus {
  lessonId: string;
  date: Date;
  classNoteComplete: boolean;
  studentNotesComplete: boolean;
  enrolledStudentCount: number;
  completedStudentNotes: number;
  missingStudentNotes: Array<{ studentId: string; studentName: string }>;
  status: NoteStatus;
}

export interface WeeklyCompletionSummary {
  teacherId: string;
  teacherName: string;
  weekStartDate: Date;
  lessons: Array<{
    lessonId: string;
    lessonName: string;
    dates: Array<{
      date: Date;
      status: NoteStatus;
      classNoteComplete: boolean;
      completedStudentNotes: number;
      enrolledStudentCount: number;
    }>;
  }>;
  overallCompletionRate: number;
}

export interface SchoolCompletionSummary {
  weekStartDate: Date;
  teachers: Array<{
    teacherId: string;
    teacherName: string;
    totalLessons: number;
    completedNotes: number;
    completionRate: number;
  }>;
  overallCompletionRate: number;
}

export interface IncompleteNoteSummary {
  teacherId: string;
  teacherName: string;
  lessonId: string;
  lessonName: string;
  date: Date;
  status: NoteStatus;
  missingClassNote: boolean;
  missingStudentNotes: number;
}

// ===========================================
// INCLUDE DEFINITIONS
// ===========================================

const noteInclude = {
  author: {
    select: { id: true, firstName: true, lastName: true },
  },
  lesson: {
    include: {
      teacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      room: {
        include: {
          location: { select: { name: true } },
        },
      },
    },
  },
  student: true,
} as const;

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Normalize date to start of day (UTC)
 */
function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get all dates in a week starting from weekStartDate
 */
function getWeekDates(weekStartDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Verify lesson belongs to school
 */
async function verifyLessonAccess(schoolId: string, lessonId: string): Promise<Lesson> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      room: {
        location: { schoolId },
      },
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  return lesson;
}

/**
 * Verify student belongs to school
 */
async function verifyStudentAccess(schoolId: string, studentId: string): Promise<Student> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
  });

  if (!student) {
    throw new AppError('Student not found or access denied', 404);
  }

  return student;
}

// ===========================================
// CREATE / UPDATE / DELETE NOTES
// ===========================================

/**
 * Create a new note
 */
export async function createNote(
  schoolId: string,
  authorId: string,
  input: CreateNoteInput
): Promise<NoteWithRelations> {
  const { lessonId, studentId, date, content, isPrivate = false } = input;

  // Verify access to lesson and/or student
  if (lessonId) {
    await verifyLessonAccess(schoolId, lessonId);
  }

  if (studentId) {
    await verifyStudentAccess(schoolId, studentId);
  }

  const normalizedDate = normalizeDate(date);

  // Check if note already exists for this combination
  const existingNote = await prisma.note.findFirst({
    where: {
      schoolId,
      lessonId: lessonId || null,
      studentId: studentId || null,
      date: normalizedDate,
    },
  });

  if (existingNote) {
    // Update existing note instead of creating duplicate
    return updateNote(schoolId, existingNote.id, { content, isPrivate });
  }

  const note = await prisma.note.create({
    data: {
      schoolId,
      authorId,
      lessonId: lessonId || null,
      studentId: studentId || null,
      date: normalizedDate,
      content,
      isPrivate,
      status: 'PENDING', // Status will be calculated based on completion
    },
    include: noteInclude,
  });

  return note as NoteWithRelations;
}

/**
 * Update an existing note
 */
export async function updateNote(
  schoolId: string,
  noteId: string,
  input: UpdateNoteInput
): Promise<NoteWithRelations> {
  // Verify note exists and belongs to school
  const existing = await prisma.note.findFirst({
    where: { id: noteId, schoolId },
  });

  if (!existing) {
    throw new AppError('Note not found or access denied', 404);
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: {
      ...(input.content !== undefined && { content: input.content }),
      ...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
    },
    include: noteInclude,
  });

  return note as NoteWithRelations;
}

/**
 * Delete a note
 */
export async function deleteNote(
  schoolId: string,
  noteId: string
): Promise<void> {
  // Verify note exists and belongs to school
  const existing = await prisma.note.findFirst({
    where: { id: noteId, schoolId },
  });

  if (!existing) {
    throw new AppError('Note not found or access denied', 404);
  }

  await prisma.note.delete({
    where: { id: noteId },
  });
}

// ===========================================
// GET NOTES
// ===========================================

/**
 * Get a single note
 */
export async function getNote(
  schoolId: string,
  noteId: string
): Promise<NoteWithRelations | null> {
  const note = await prisma.note.findFirst({
    where: { id: noteId, schoolId },
    include: noteInclude,
  });

  return note as NoteWithRelations | null;
}

/**
 * Get notes for a lesson
 */
export async function getNotesByLesson(
  schoolId: string,
  lessonId: string,
  filters: NotesByLessonFilter = {}
): Promise<NoteWithRelations[]> {
  // Verify lesson access
  await verifyLessonAccess(schoolId, lessonId);

  const where: Record<string, unknown> = {
    schoolId,
    lessonId,
  };

  if (filters.date) {
    where.date = normalizeDate(filters.date);
  }

  if (filters.authorId) {
    where.authorId = filters.authorId;
  }

  if (filters.isPrivate !== undefined) {
    where.isPrivate = filters.isPrivate;
  }

  const notes = await prisma.note.findMany({
    where,
    include: noteInclude,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  return notes as NoteWithRelations[];
}

/**
 * Get notes for a student
 */
export async function getNotesByStudent(
  schoolId: string,
  studentId: string,
  filters: NotesByStudentFilter = {},
  includePrivate = true
): Promise<NoteWithRelations[]> {
  // Verify student access
  await verifyStudentAccess(schoolId, studentId);

  const where: Record<string, unknown> = {
    schoolId,
    studentId,
  };

  if (filters.lessonId) {
    where.lessonId = filters.lessonId;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      (where.date as Record<string, unknown>).gte = normalizeDate(filters.startDate);
    }
    if (filters.endDate) {
      (where.date as Record<string, unknown>).lte = normalizeDate(filters.endDate);
    }
  }

  // Filter private notes for non-teachers
  if (!includePrivate) {
    where.isPrivate = false;
  } else if (filters.isPrivate !== undefined) {
    where.isPrivate = filters.isPrivate;
  }

  const notes = await prisma.note.findMany({
    where,
    include: noteInclude,
    orderBy: { date: 'desc' },
  });

  return notes as NoteWithRelations[];
}

/**
 * Get notes for a specific date
 */
export async function getNotesByDate(
  schoolId: string,
  date: Date,
  filters: NotesByDateFilter = {}
): Promise<NoteWithRelations[]> {
  const normalizedDate = normalizeDate(date);

  const where: Record<string, unknown> = {
    schoolId,
    date: normalizedDate,
  };

  if (filters.lessonId) {
    where.lessonId = filters.lessonId;
  }

  if (filters.authorId) {
    where.authorId = filters.authorId;
  }

  const notes = await prisma.note.findMany({
    where,
    include: noteInclude,
    orderBy: { createdAt: 'desc' },
  });

  return notes as NoteWithRelations[];
}

// ===========================================
// NOTE COMPLETION STATUS
// ===========================================

/**
 * Get note completion status for a lesson on a specific date
 */
export async function getLessonNoteCompletion(
  schoolId: string,
  lessonId: string,
  date: Date
): Promise<NoteCompletionStatus> {
  // Verify lesson access and get enrollments
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      room: {
        location: { schoolId },
      },
    },
    include: {
      enrollments: {
        where: { isActive: true },
        include: { student: true },
      },
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found or access denied', 404);
  }

  const normalizedDate = normalizeDate(date);

  // Get notes for this lesson on this date
  const notes = await prisma.note.findMany({
    where: {
      schoolId,
      date: normalizedDate,
      OR: [
        { lessonId, studentId: null }, // Class notes
        { lessonId, studentId: { not: null } }, // Student notes for this lesson
      ],
    },
  });

  // Check for class note
  const classNote = notes.find((n) => n.lessonId === lessonId && !n.studentId);
  const classNoteComplete = !!classNote;

  // Check for student notes
  const enrolledStudentIds = new Set(lesson.enrollments.map((e) => e.studentId));
  const studentNotes = notes.filter((n) => n.studentId && enrolledStudentIds.has(n.studentId));
  const completedStudentIds = new Set(studentNotes.map((n) => n.studentId));

  const enrolledStudentCount = lesson.enrollments.length;
  const completedStudentNotes = completedStudentIds.size;
  const studentNotesComplete = completedStudentNotes === enrolledStudentCount;

  // Find missing student notes
  const missingStudentNotes = lesson.enrollments
    .filter((e) => !completedStudentIds.has(e.studentId))
    .map((e) => ({
      studentId: e.student.id,
      studentName: `${e.student.firstName} ${e.student.lastName}`,
    }));

  // Calculate status
  let status: NoteStatus = 'PENDING';
  if (classNoteComplete && studentNotesComplete) {
    status = 'COMPLETE';
  } else if (classNoteComplete || completedStudentNotes > 0) {
    status = 'PARTIAL';
  }

  return {
    lessonId,
    date: normalizedDate,
    classNoteComplete,
    studentNotesComplete,
    enrolledStudentCount,
    completedStudentNotes,
    missingStudentNotes,
    status,
  };
}

/**
 * Get weekly note completion summary for a teacher
 */
export async function getTeacherNoteCompletionSummary(
  schoolId: string,
  teacherId: string,
  weekStartDate?: Date
): Promise<WeeklyCompletionSummary> {
  const weekStart = weekStartDate ? normalizeDate(weekStartDate) : getWeekStartDate(new Date());
  const weekDates = getWeekDates(weekStart);

  // Get teacher info
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, schoolId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!teacher) {
    throw new AppError('Teacher not found or access denied', 404);
  }

  // Get all lessons for this teacher
  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId,
      isActive: true,
      room: {
        location: { schoolId },
      },
    },
    include: {
      enrollments: {
        where: { isActive: true },
      },
    },
  });

  // Build lesson summaries
  const lessonSummaries = await Promise.all(
    lessons.map(async (lesson) => {
      // Get lesson's day of week
      const lessonDayOfWeek = lesson.dayOfWeek;

      // Find the date in the week that matches the lesson's day
      const lessonDate = weekDates.find((d) => d.getUTCDay() === lessonDayOfWeek);

      if (!lessonDate) {
        return {
          lessonId: lesson.id,
          lessonName: lesson.name,
          dates: [],
        };
      }

      const completion = await getLessonNoteCompletion(schoolId, lesson.id, lessonDate);

      return {
        lessonId: lesson.id,
        lessonName: lesson.name,
        dates: [{
          date: lessonDate,
          status: completion.status,
          classNoteComplete: completion.classNoteComplete,
          completedStudentNotes: completion.completedStudentNotes,
          enrolledStudentCount: completion.enrolledStudentCount,
        }],
      };
    })
  );

  // Calculate overall completion rate
  let totalRequired = 0;
  let totalComplete = 0;

  lessonSummaries.forEach((ls) => {
    ls.dates.forEach((d) => {
      if (d.enrolledStudentCount > 0) {
        // Each lesson needs class note + all student notes
        const required = 1 + d.enrolledStudentCount;
        const complete = (d.classNoteComplete ? 1 : 0) + d.completedStudentNotes;
        totalRequired += required;
        totalComplete += complete;
      }
    });
  });

  const overallCompletionRate = totalRequired > 0
    ? Math.round((totalComplete / totalRequired) * 100)
    : 100;

  return {
    teacherId,
    teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
    weekStartDate: weekStart,
    lessons: lessonSummaries,
    overallCompletionRate,
  };
}

/**
 * Get school-wide note completion summary for a week
 */
export async function getSchoolNoteCompletionSummary(
  schoolId: string,
  weekStartDate?: Date
): Promise<SchoolCompletionSummary> {
  const weekStart = weekStartDate ? normalizeDate(weekStartDate) : getWeekStartDate(new Date());

  // Get all teachers in the school
  const teachers = await prisma.teacher.findMany({
    where: { schoolId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Get summaries for each teacher
  const teacherSummaries = await Promise.all(
    teachers.map(async (teacher) => {
      const summary = await getTeacherNoteCompletionSummary(
        schoolId,
        teacher.id,
        weekStart
      );

      const totalLessons = summary.lessons.length;
      const completedNotes = summary.lessons.filter(
        (l) => l.dates.some((d) => d.status === 'COMPLETE')
      ).length;

      return {
        teacherId: teacher.id,
        teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
        totalLessons,
        completedNotes,
        completionRate: summary.overallCompletionRate,
      };
    })
  );

  // Calculate overall school completion rate
  const totalRate = teacherSummaries.reduce((sum, t) => sum + t.completionRate, 0);
  const overallCompletionRate = teacherSummaries.length > 0
    ? Math.round(totalRate / teacherSummaries.length)
    : 100;

  return {
    weekStartDate: weekStart,
    teachers: teacherSummaries,
    overallCompletionRate,
  };
}

/**
 * Get incomplete notes (for admin monitoring)
 */
export async function getIncompleteNotes(
  schoolId: string,
  beforeDate?: Date,
  teacherId?: string
): Promise<IncompleteNoteSummary[]> {
  const targetDate = beforeDate ? normalizeDate(beforeDate) : new Date();
  const weekStart = getWeekStartDate(targetDate);

  // Get lessons to check
  const lessonWhere: Record<string, unknown> = {
    isActive: true,
    room: {
      location: { schoolId },
    },
  };

  if (teacherId) {
    lessonWhere.teacherId = teacherId;
  }

  const lessons = await prisma.lesson.findMany({
    where: lessonWhere,
    include: {
      teacher: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      enrollments: {
        where: { isActive: true },
      },
    },
  });

  const incompleteSummaries: IncompleteNoteSummary[] = [];

  for (const lesson of lessons) {
    // Find the date in the current week that matches the lesson's day
    const weekDates = getWeekDates(weekStart);
    const lessonDate = weekDates.find((d) => d.getUTCDay() === lesson.dayOfWeek);

    if (!lessonDate || lessonDate > targetDate) {
      continue; // Skip if lesson hasn't occurred yet this week
    }

    const completion = await getLessonNoteCompletion(schoolId, lesson.id, lessonDate);

    if (completion.status !== 'COMPLETE') {
      incompleteSummaries.push({
        teacherId: lesson.teacher.id,
        teacherName: `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`,
        lessonId: lesson.id,
        lessonName: lesson.name,
        date: lessonDate,
        status: completion.status,
        missingClassNote: !completion.classNoteComplete,
        missingStudentNotes: completion.enrolledStudentCount - completion.completedStudentNotes,
      });
    }
  }

  return incompleteSummaries;
}

/**
 * Get notes needing reminders (for automated reminder system)
 */
export async function getNotesNeedingReminders(
  schoolId: string
): Promise<Array<{
  teacherId: string;
  teacherEmail: string;
  teacherName: string;
  incompleteCount: number;
  lessons: Array<{ lessonName: string; date: Date; status: NoteStatus }>;
}>> {
  const today = normalizeDate(new Date());
  const incomplete = await getIncompleteNotes(schoolId, today);

  // Group by teacher
  const teacherMap = new Map<string, {
    teacherId: string;
    teacherEmail: string;
    teacherName: string;
    lessons: Array<{ lessonName: string; date: Date; status: NoteStatus }>;
  }>();

  for (const item of incomplete) {
    if (!teacherMap.has(item.teacherId)) {
      // Get teacher email
      const teacher = await prisma.teacher.findFirst({
        where: { id: item.teacherId },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      });

      if (teacher) {
        teacherMap.set(item.teacherId, {
          teacherId: item.teacherId,
          teacherEmail: teacher.user.email,
          teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
          lessons: [],
        });
      }
    }

    const teacherData = teacherMap.get(item.teacherId);
    if (teacherData) {
      teacherData.lessons.push({
        lessonName: item.lessonName,
        date: item.date,
        status: item.status,
      });
    }
  }

  return Array.from(teacherMap.values()).map((t) => ({
    ...t,
    incompleteCount: t.lessons.length,
  }));
}

/**
 * Get teacher's pending notes count (for dashboard widget)
 */
export async function getTeacherPendingNotesCount(
  schoolId: string,
  teacherId: string
): Promise<{
  totalPending: number;
  pendingClassNotes: number;
  pendingStudentNotes: number;
}> {
  const incomplete = await getIncompleteNotes(schoolId, undefined, teacherId);

  let pendingClassNotes = 0;
  let pendingStudentNotes = 0;

  incomplete.forEach((item) => {
    if (item.missingClassNote) {
      pendingClassNotes++;
    }
    pendingStudentNotes += item.missingStudentNotes;
  });

  return {
    totalPending: incomplete.length,
    pendingClassNotes,
    pendingStudentNotes,
  };
}
