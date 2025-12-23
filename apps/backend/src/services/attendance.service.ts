// ===========================================
// Attendance Service
// ===========================================
// Manages attendance marking and tracking
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  Attendance,
  AttendanceStatus,
  Lesson,
  Student,
} from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface AttendanceWithRelations extends Attendance {
  lesson: Lesson & {
    teacher: {
      user: { id: string; firstName: string; lastName: string };
    };
    room: {
      name: string;
      location: { name: string };
    };
    instrument: { name: string } | null;
  };
  student: Student;
}

export interface MarkAttendanceInput {
  lessonId: string;
  studentId: string;
  date: Date;
  status: AttendanceStatus;
  absenceReason?: string;
}

export interface SingleAttendanceInput {
  studentId: string;
  status: AttendanceStatus;
  absenceReason?: string;
}

export interface BatchMarkAttendanceInput {
  lessonId: string;
  date: Date;
  attendances: SingleAttendanceInput[];
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  absenceReason?: string | null;
}

export interface AttendanceByLessonFilter {
  date?: Date;
  status?: AttendanceStatus;
}

export interface AttendanceByStudentFilter {
  lessonId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceStatus;
}

export interface AttendanceReportFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface TodayAttendanceFilter {
  locationId?: string;
  teacherId?: string;
}

export interface StudentAttendanceStats {
  studentId: string;
  studentName: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  cancelled: number;
  attendanceRate: number;
}

export interface AttendanceReport {
  lessonId: string;
  lessonName: string;
  totalSessions: number;
  studentStats: StudentAttendanceStats[];
}

// ===========================================
// INCLUDE DEFINITIONS
// ===========================================

const attendanceInclude = {
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
      instrument: { select: { name: true } },
    },
  },
  student: true,
} as const;

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Verify lesson belongs to school and exists
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
 * Verify student belongs to school and is enrolled in lesson
 */
async function verifyStudentEnrollment(
  schoolId: string,
  lessonId: string,
  studentId: string
): Promise<void> {
  const enrollment = await prisma.lessonEnrollment.findFirst({
    where: {
      lessonId,
      studentId,
      isActive: true,
      student: { schoolId },
    },
  });

  if (!enrollment) {
    throw new AppError('Student is not enrolled in this lesson', 400);
  }
}

/**
 * Normalize date to start of day (UTC)
 */
function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

// ===========================================
// MARK ATTENDANCE
// ===========================================

/**
 * Mark attendance for a single student
 */
export async function markAttendance(
  schoolId: string,
  input: MarkAttendanceInput
): Promise<AttendanceWithRelations> {
  const { lessonId, studentId, date, status, absenceReason } = input;

  // Verify access
  await verifyLessonAccess(schoolId, lessonId);
  await verifyStudentEnrollment(schoolId, lessonId, studentId);

  const normalizedDate = normalizeDate(date);

  // Upsert attendance record
  const attendance = await prisma.attendance.upsert({
    where: {
      lessonId_studentId_date: {
        lessonId,
        studentId,
        date: normalizedDate,
      },
    },
    update: {
      status,
      absenceReason: absenceReason || null,
    },
    create: {
      lessonId,
      studentId,
      date: normalizedDate,
      status,
      absenceReason: absenceReason || null,
    },
    include: attendanceInclude,
  });

  return attendance as AttendanceWithRelations;
}

/**
 * Mark attendance for multiple students in a lesson
 */
export async function batchMarkAttendance(
  schoolId: string,
  input: BatchMarkAttendanceInput
): Promise<AttendanceWithRelations[]> {
  const { lessonId, date, attendances } = input;

  // Verify lesson access
  await verifyLessonAccess(schoolId, lessonId);

  const normalizedDate = normalizeDate(date);

  // Verify all students are enrolled
  const studentIds = attendances.map((a) => a.studentId);
  const enrollments = await prisma.lessonEnrollment.findMany({
    where: {
      lessonId,
      studentId: { in: studentIds },
      isActive: true,
      student: { schoolId },
    },
    select: { studentId: true },
  });

  const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId));
  const notEnrolled = studentIds.filter((id) => !enrolledStudentIds.has(id));

  if (notEnrolled.length > 0) {
    throw new AppError(
      `Some students are not enrolled in this lesson: ${notEnrolled.join(', ')}`,
      400
    );
  }

  // Use transaction to upsert all attendance records
  const results = await prisma.$transaction(
    attendances.map((attendance) =>
      prisma.attendance.upsert({
        where: {
          lessonId_studentId_date: {
            lessonId,
            studentId: attendance.studentId,
            date: normalizedDate,
          },
        },
        update: {
          status: attendance.status,
          absenceReason: attendance.absenceReason || null,
        },
        create: {
          lessonId,
          studentId: attendance.studentId,
          date: normalizedDate,
          status: attendance.status,
          absenceReason: attendance.absenceReason || null,
        },
        include: attendanceInclude,
      })
    )
  );

  return results as AttendanceWithRelations[];
}

// ===========================================
// UPDATE ATTENDANCE
// ===========================================

/**
 * Update an existing attendance record
 */
export async function updateAttendance(
  schoolId: string,
  attendanceId: string,
  input: UpdateAttendanceInput
): Promise<AttendanceWithRelations> {
  // Get existing attendance with lesson info for school verification
  const existing = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      lesson: {
        include: {
          room: {
            include: { location: true },
          },
        },
      },
    },
  });

  if (!existing) {
    throw new AppError('Attendance record not found', 404);
  }

  // Verify school access
  if (existing.lesson.room.location.schoolId !== schoolId) {
    throw new AppError('Attendance record not found or access denied', 404);
  }

  const attendance = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      ...(input.status && { status: input.status }),
      ...(input.absenceReason !== undefined && { absenceReason: input.absenceReason }),
    },
    include: attendanceInclude,
  });

  return attendance as AttendanceWithRelations;
}

// ===========================================
// GET ATTENDANCE
// ===========================================

/**
 * Get a single attendance record
 */
export async function getAttendance(
  schoolId: string,
  attendanceId: string
): Promise<AttendanceWithRelations | null> {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      ...attendanceInclude,
      lesson: {
        include: {
          ...attendanceInclude.lesson.include,
          room: {
            include: {
              location: { select: { name: true, schoolId: true } },
            },
          },
        },
      },
    },
  });

  if (!attendance) {
    return null;
  }

  // Verify school access
  if ((attendance.lesson.room.location as { schoolId: string }).schoolId !== schoolId) {
    return null;
  }

  return attendance as unknown as AttendanceWithRelations;
}

/**
 * Get attendance records for a lesson
 */
export async function getAttendanceByLesson(
  schoolId: string,
  lessonId: string,
  filters: AttendanceByLessonFilter = {}
): Promise<AttendanceWithRelations[]> {
  // Verify lesson access
  await verifyLessonAccess(schoolId, lessonId);

  const where: Record<string, unknown> = { lessonId };

  if (filters.date) {
    where.date = normalizeDate(filters.date);
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: attendanceInclude,
    orderBy: [{ date: 'desc' }, { student: { lastName: 'asc' } }],
  });

  return attendance as AttendanceWithRelations[];
}

/**
 * Get attendance records for a student
 */
export async function getAttendanceByStudent(
  schoolId: string,
  studentId: string,
  filters: AttendanceByStudentFilter = {}
): Promise<AttendanceWithRelations[]> {
  // Verify student belongs to school
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
  });

  if (!student) {
    throw new AppError('Student not found or access denied', 404);
  }

  const where: Record<string, unknown> = { studentId };

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

  if (filters.status) {
    where.status = filters.status;
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: attendanceInclude,
    orderBy: { date: 'desc' },
  });

  return attendance as AttendanceWithRelations[];
}

/**
 * Get today's attendance for the school
 */
export async function getTodayAttendance(
  schoolId: string,
  filters: TodayAttendanceFilter = {}
): Promise<AttendanceWithRelations[]> {
  const today = normalizeDate(new Date());

  const where: Record<string, unknown> = {
    date: today,
    lesson: {
      room: {
        location: { schoolId },
      },
    },
  };

  if (filters.locationId) {
    (where.lesson as Record<string, unknown>).room = {
      locationId: filters.locationId,
    };
  }

  if (filters.teacherId) {
    (where.lesson as Record<string, unknown>).teacherId = filters.teacherId;
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: attendanceInclude,
    orderBy: [
      { lesson: { startTime: 'asc' } },
      { student: { lastName: 'asc' } },
    ],
  });

  return attendance as AttendanceWithRelations[];
}

// ===========================================
// ATTENDANCE REPORTS
// ===========================================

/**
 * Get attendance report for a lesson
 */
export async function getAttendanceReport(
  schoolId: string,
  lessonId: string,
  filters: AttendanceReportFilter = {}
): Promise<AttendanceReport> {
  // Verify lesson access and get lesson details
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

  // Build date filter
  const dateFilter: Record<string, unknown> = {};
  if (filters.startDate) {
    dateFilter.gte = normalizeDate(filters.startDate);
  }
  if (filters.endDate) {
    dateFilter.lte = normalizeDate(filters.endDate);
  }

  // Get all attendance records for the lesson
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      lessonId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    },
  });

  // Get unique dates (sessions)
  const uniqueDates = new Set(attendanceRecords.map((a) => a.date.toISOString()));
  const totalSessions = uniqueDates.size;

  // Calculate stats for each enrolled student
  const studentStats: StudentAttendanceStats[] = lesson.enrollments.map((enrollment) => {
    const studentAttendance = attendanceRecords.filter(
      (a) => a.studentId === enrollment.studentId
    );

    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      cancelled: 0,
    };

    studentAttendance.forEach((a) => {
      switch (a.status) {
        case 'PRESENT':
          counts.present++;
          break;
        case 'ABSENT':
          counts.absent++;
          break;
        case 'LATE':
          counts.late++;
          break;
        case 'EXCUSED':
          counts.excused++;
          break;
        case 'CANCELLED':
          counts.cancelled++;
          break;
      }
    });

    // Calculate attendance rate (present + late count as attended)
    const attended = counts.present + counts.late;
    const countable = totalSessions - counts.cancelled - counts.excused;
    const attendanceRate = countable > 0 ? (attended / countable) * 100 : 100;

    return {
      studentId: enrollment.student.id,
      studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      totalSessions,
      ...counts,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    };
  });

  return {
    lessonId,
    lessonName: lesson.name,
    totalSessions,
    studentStats,
  };
}

/**
 * Get attendance statistics for a student
 */
export async function getStudentAttendanceStats(
  schoolId: string,
  studentId: string
): Promise<StudentAttendanceStats> {
  // Verify student belongs to school
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
  });

  if (!student) {
    throw new AppError('Student not found or access denied', 404);
  }

  // Get all attendance records for the student
  const attendanceRecords = await prisma.attendance.findMany({
    where: { studentId },
  });

  // Get unique lesson-date combinations
  const uniqueSessions = new Set(
    attendanceRecords.map((a) => `${a.lessonId}-${a.date.toISOString()}`)
  );
  const totalSessions = uniqueSessions.size;

  const counts = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    cancelled: 0,
  };

  attendanceRecords.forEach((a) => {
    switch (a.status) {
      case 'PRESENT':
        counts.present++;
        break;
      case 'ABSENT':
        counts.absent++;
        break;
      case 'LATE':
        counts.late++;
        break;
      case 'EXCUSED':
        counts.excused++;
        break;
      case 'CANCELLED':
        counts.cancelled++;
        break;
    }
  });

  // Calculate attendance rate
  const attended = counts.present + counts.late;
  const countable = totalSessions - counts.cancelled - counts.excused;
  const attendanceRate = countable > 0 ? (attended / countable) * 100 : 100;

  return {
    studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    totalSessions,
    ...counts,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
  };
}

// ===========================================
// ENROLLED STUDENTS FOR LESSON
// ===========================================

/**
 * Get enrolled students for attendance marking
 */
export async function getEnrolledStudentsForAttendance(
  schoolId: string,
  lessonId: string,
  date: Date
): Promise<{
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    attendance?: {
      id: string;
      status: AttendanceStatus;
      absenceReason: string | null;
    };
  }>;
}> {
  // Verify lesson access
  await verifyLessonAccess(schoolId, lessonId);

  const normalizedDate = normalizeDate(date);

  // Get enrolled students with their attendance for the date
  const enrollments = await prisma.lessonEnrollment.findMany({
    where: {
      lessonId,
      isActive: true,
      student: { schoolId },
    },
    include: {
      student: {
        include: {
          attendances: {
            where: {
              lessonId,
              date: normalizedDate,
            },
            select: {
              id: true,
              status: true,
              absenceReason: true,
            },
          },
        },
      },
    },
    orderBy: { student: { lastName: 'asc' } },
  });

  const students = enrollments.map((enrollment) => ({
    id: enrollment.student.id,
    firstName: enrollment.student.firstName,
    lastName: enrollment.student.lastName,
    attendance: enrollment.student.attendances[0] || undefined,
  }));

  return { students };
}
