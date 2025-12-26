// ===========================================
// Dashboard Service
// ===========================================
// Aggregation queries for dashboard statistics
// CRITICAL: All queries MUST include schoolId filtering

import { MeetAndGreetStatus, AttendanceStatus } from '@prisma/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { prisma } from '../config/database';

// ===========================================
// TYPES
// ===========================================

export interface AdminDashboardStats {
  totalActiveStudents: number;
  totalActiveFamilies: number;
  totalActiveTeachers: number;
  totalLessonsThisWeek: number;
  attendanceRateThisWeek: number;
  attendanceRateThisMonth: number;
  totalOutstandingPayments: number;
  pendingMeetAndGreets: number;
  upcomingMeetAndGreets: number;
  driveSyncStatus: DriveSyncStatus;
}

export interface TeacherDashboardStats {
  totalLessonsThisWeek: number;
  totalStudents: number;
  attendanceRateThisWeek: number;
  pendingNotesCount: number;
  recentlyUploadedFiles: number;
  assignedMeetAndGreets: number;
}

export interface ParentDashboardStats {
  childrenCount: number;
  upcomingLessons: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  sharedFilesCount: number;
  openBookingPeriods: number;
}

export interface DriveSyncStatus {
  isConnected: boolean;
  lastSyncAt: string | null;
  syncedFoldersCount: number;
  errorCount: number;
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
}

export interface ActivityItem {
  id: string;
  type: 'enrollment' | 'payment' | 'booking' | 'attendance' | 'file_upload' | 'meet_and_greet';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ===========================================
// ADMIN DASHBOARD STATS
// ===========================================

export async function getAdminDashboardStats(schoolId: string): Promise<AdminDashboardStats> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Run queries in parallel for performance
  const [
    activeStudents,
    activeFamilies,
    activeTeachers,
    lessonsThisWeek,
    weeklyAttendance,
    monthlyAttendance,
    outstandingInvoices,
    pendingMeetAndGreets,
    upcomingMeetAndGreets,
    driveSyncStatus,
  ] = await Promise.all([
    // Total active students
    prisma.student.count({
      where: { schoolId, isActive: true, deletionStatus: 'ACTIVE' },
    }),

    // Total active families
    prisma.family.count({
      where: { schoolId, deletionStatus: 'ACTIVE' },
    }),

    // Total active teachers
    prisma.teacher.count({
      where: { schoolId, isActive: true },
    }),

    // Lessons this week
    prisma.lesson.count({
      where: {
        schoolId,
        isActive: true,
        term: {
          startDate: { lte: weekEnd },
          endDate: { gte: weekStart },
        },
      },
    }),

    // Weekly attendance stats
    prisma.attendance.groupBy({
      by: ['status'],
      where: {
        lesson: { schoolId },
        date: { gte: weekStart, lte: weekEnd },
      },
      _count: { id: true },
    }),

    // Monthly attendance stats
    prisma.attendance.groupBy({
      by: ['status'],
      where: {
        lesson: { schoolId },
        date: { gte: monthStart, lte: monthEnd },
      },
      _count: { id: true },
    }),

    // Outstanding invoices (SENT + PARTIALLY_PAID + OVERDUE)
    prisma.invoice.findMany({
      where: {
        schoolId,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      select: { total: true, amountPaid: true },
    }),

    // Pending meet & greets
    prisma.meetAndGreet.count({
      where: {
        schoolId,
        status: 'PENDING_APPROVAL',
      },
    }),

    // Upcoming meet & greets (scheduled in the future)
    prisma.meetAndGreet.count({
      where: {
        schoolId,
        status: 'APPROVED',
        scheduledDateTime: { gte: now },
      },
    }),

    // Google Drive sync status
    getDriveSyncStatus(schoolId),
  ]);

  // Calculate attendance rates
  const attendanceRateThisWeek = calculateAttendanceRate(weeklyAttendance);
  const attendanceRateThisMonth = calculateAttendanceRate(monthlyAttendance);

  // Calculate total outstanding payments
  const totalOutstandingPayments = outstandingInvoices.reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)),
    0
  );

  return {
    totalActiveStudents: activeStudents,
    totalActiveFamilies: activeFamilies,
    totalActiveTeachers: activeTeachers,
    totalLessonsThisWeek: lessonsThisWeek,
    attendanceRateThisWeek,
    attendanceRateThisMonth,
    totalOutstandingPayments: Math.round(totalOutstandingPayments * 100), // Convert to cents
    pendingMeetAndGreets,
    upcomingMeetAndGreets,
    driveSyncStatus,
  };
}

// ===========================================
// TEACHER DASHBOARD STATS
// ===========================================

export async function getTeacherDashboardStats(
  schoolId: string,
  teacherId: string
): Promise<TeacherDashboardStats> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Get teacher's user ID for file lookups
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, schoolId },
    select: { userId: true },
  });

  const [
    lessonsThisWeek,
    totalStudents,
    weeklyAttendance,
    pendingNotes,
    recentFiles,
    assignedMeetAndGreets,
  ] = await Promise.all([
    // Teacher's lessons this week
    prisma.lesson.count({
      where: {
        schoolId,
        teacherId,
        isActive: true,
        term: {
          startDate: { lte: weekEnd },
          endDate: { gte: weekStart },
        },
      },
    }),

    // Total unique students in teacher's lessons
    prisma.lessonEnrollment.findMany({
      where: {
        lesson: { schoolId, teacherId, isActive: true },
        isActive: true,
      },
      select: { studentId: true },
      distinct: ['studentId'],
    }),

    // Weekly attendance for teacher's lessons
    prisma.attendance.groupBy({
      by: ['status'],
      where: {
        lesson: { schoolId, teacherId },
        date: { gte: weekStart, lte: weekEnd },
      },
      _count: { id: true },
    }),

    // Pending notes (lessons without notes this week)
    countPendingNotes(schoolId, teacherId, weekStart, weekEnd),

    // Recently uploaded files by this teacher (last 7 days)
    teacher
      ? prisma.googleDriveFile.count({
          where: {
            schoolId,
            uploadedBy: teacher.userId,
            createdAt: { gte: subDays(now, 7) },
            deletedInDrive: false,
          },
        })
      : Promise.resolve(0),

    // Meet & greets assigned to this teacher
    prisma.meetAndGreet.count({
      where: {
        schoolId,
        assignedTeacherId: teacherId,
        status: { in: ['PENDING_APPROVAL', 'APPROVED'] },
      },
    }),
  ]);

  return {
    totalLessonsThisWeek: lessonsThisWeek,
    totalStudents: totalStudents.length,
    attendanceRateThisWeek: calculateAttendanceRate(weeklyAttendance),
    pendingNotesCount: pendingNotes,
    recentlyUploadedFiles: recentFiles,
    assignedMeetAndGreets,
  };
}

// ===========================================
// PARENT DASHBOARD STATS
// ===========================================

export async function getParentDashboardStats(
  schoolId: string,
  parentId: string
): Promise<ParentDashboardStats> {
  const now = new Date();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Get parent's family
  const parent = await prisma.parent.findFirst({
    where: { id: parentId, schoolId },
    select: { familyId: true },
  });

  if (!parent?.familyId) {
    return {
      childrenCount: 0,
      upcomingLessons: 0,
      outstandingInvoices: 0,
      outstandingAmount: 0,
      sharedFilesCount: 0,
      openBookingPeriods: 0,
    };
  }

  const [
    children,
    upcomingLessons,
    outstandingInvoices,
    sharedFiles,
    openBookingPeriods,
  ] = await Promise.all([
    // Children in family
    prisma.student.count({
      where: { schoolId, familyId: parent.familyId, isActive: true },
    }),

    // Upcoming lessons (this week)
    prisma.lessonEnrollment.count({
      where: {
        student: { schoolId, familyId: parent.familyId },
        lesson: {
          isActive: true,
          term: {
            startDate: { lte: weekEnd },
            endDate: { gte: now },
          },
        },
        isActive: true,
      },
    }),

    // Outstanding invoices
    prisma.invoice.findMany({
      where: {
        schoolId,
        familyId: parent.familyId,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      select: { id: true, total: true, amountPaid: true },
    }),

    // Shared files (visible to parents)
    prisma.googleDriveFile.count({
      where: {
        schoolId,
        visibility: { in: ['ALL', 'TEACHERS_AND_PARENTS'] },
        deletedInDrive: false,
        driveFolder: {
          OR: [
            { lesson: { enrollments: { some: { student: { familyId: parent.familyId } } } } },
            { student: { familyId: parent.familyId } },
          ],
        },
      },
    }),

    // Open booking periods for hybrid lessons
    prisma.hybridLessonPattern.count({
      where: {
        bookingsOpen: true,
        lesson: {
          schoolId,
          enrollments: {
            some: { student: { familyId: parent.familyId }, isActive: true },
          },
        },
      },
    }),
  ]);

  const outstandingAmount = outstandingInvoices.reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)),
    0
  );

  return {
    childrenCount: children,
    upcomingLessons,
    outstandingInvoices: outstandingInvoices.length,
    outstandingAmount: Math.round(outstandingAmount * 100), // Convert to cents
    sharedFilesCount: sharedFiles,
    openBookingPeriods,
  };
}

// ===========================================
// ACTIVITY FEED
// ===========================================

export async function getActivityFeed(
  schoolId: string,
  limit: number = 10
): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  // Get recent activities in parallel
  const [
    recentEnrollments,
    recentPayments,
    recentBookings,
    recentMeetAndGreets,
  ] = await Promise.all([
    // Recent enrollments
    prisma.lessonEnrollment.findMany({
      where: { lesson: { schoolId } },
      orderBy: { enrolledAt: 'desc' },
      take: limit,
      include: {
        student: { select: { firstName: true, lastName: true } },
        lesson: { select: { name: true } },
      },
    }),

    // Recent payments
    prisma.payment.findMany({
      where: { invoice: { schoolId } },
      orderBy: { paidAt: 'desc' },
      take: limit,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            family: { select: { name: true } },
          },
        },
      },
    }),

    // Recent hybrid bookings
    prisma.hybridBooking.findMany({
      where: { lesson: { schoolId } },
      orderBy: { bookedAt: 'desc' },
      take: limit,
      include: {
        student: { select: { firstName: true, lastName: true } },
        lesson: { select: { name: true } },
      },
    }),

    // Recent meet & greets
    prisma.meetAndGreet.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        studentFirstName: true,
        studentLastName: true,
        status: true,
        createdAt: true,
        scheduledDateTime: true,
      },
    }),
  ]);

  // Transform enrollments
  for (const enrollment of recentEnrollments) {
    activities.push({
      id: `enrollment-${enrollment.id}`,
      type: 'enrollment',
      title: 'New Enrollment',
      description: `${enrollment.student.firstName} ${enrollment.student.lastName} enrolled in ${enrollment.lesson.name}`,
      timestamp: enrollment.enrolledAt.toISOString(),
    });
  }

  // Transform payments
  for (const payment of recentPayments) {
    activities.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      title: 'Payment Received',
      description: `$${(Number(payment.amount) / 100).toFixed(2)} from ${payment.invoice.family.name} for ${payment.invoice.invoiceNumber}`,
      timestamp: payment.paidAt.toISOString(),
      metadata: { amount: Number(payment.amount) },
    });
  }

  // Transform bookings
  for (const booking of recentBookings) {
    activities.push({
      id: `booking-${booking.id}`,
      type: 'booking',
      title: 'Hybrid Session Booked',
      description: `${booking.student.firstName} ${booking.student.lastName} booked a session for ${booking.lesson.name}`,
      timestamp: booking.bookedAt.toISOString(),
    });
  }

  // Transform meet & greets
  for (const mg of recentMeetAndGreets) {
    const statusText = mg.status === 'APPROVED' ? 'scheduled' : mg.status.toLowerCase().replace('_', ' ');
    activities.push({
      id: `meetandgreet-${mg.id}`,
      type: 'meet_and_greet',
      title: 'Meet & Greet',
      description: `${mg.studentFirstName} ${mg.studentLastName} - ${statusText}`,
      timestamp: mg.createdAt.toISOString(),
    });
  }

  // Sort all activities by timestamp descending and limit
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return activities.slice(0, limit);
}

// ===========================================
// GOOGLE DRIVE SYNC STATUS
// ===========================================

export async function getDriveSyncStatus(schoolId: string): Promise<DriveSyncStatus> {
  // Check if Drive is connected
  const driveAuth = await prisma.googleDriveAuth.findUnique({
    where: { schoolId },
  });

  if (!driveAuth) {
    return {
      isConnected: false,
      lastSyncAt: null,
      syncedFoldersCount: 0,
      errorCount: 0,
      status: 'disconnected',
    };
  }

  // Get folder sync stats
  const [folderStats, errorCount] = await Promise.all([
    prisma.googleDriveFolder.aggregate({
      where: { schoolId },
      _count: { id: true },
      _max: { lastSyncAt: true },
    }),

    prisma.googleDriveFolder.count({
      where: { schoolId, syncStatus: 'ERROR' },
    }),
  ]);

  const lastSyncAt = folderStats._max.lastSyncAt?.toISOString() || null;
  const syncedFoldersCount = folderStats._count.id;

  // Determine status
  let status: DriveSyncStatus['status'] = 'healthy';
  if (errorCount > 0) {
    status = errorCount > 5 ? 'error' : 'warning';
  } else if (!lastSyncAt) {
    status = 'warning'; // Never synced
  }

  return {
    isConnected: true,
    lastSyncAt,
    syncedFoldersCount,
    errorCount,
    status,
  };
}

// ===========================================
// RECENTLY UPLOADED FILES
// ===========================================

export async function getRecentlyUploadedFiles(
  schoolId: string,
  options: { uploadedBy?: string; limit?: number } = {}
): Promise<Array<{
  id: string;
  fileName: string;
  mimeType: string;
  createdAt: Date;
  lessonName?: string;
  studentName?: string;
}>> {
  const { uploadedBy, limit = 5 } = options;

  const files = await prisma.googleDriveFile.findMany({
    where: {
      schoolId,
      deletedInDrive: false,
      ...(uploadedBy && { uploadedBy }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      driveFolder: {
        include: {
          lesson: { select: { name: true } },
          student: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return files.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    mimeType: file.mimeType,
    createdAt: file.createdAt,
    lessonName: file.driveFolder?.lesson?.name,
    studentName: file.driveFolder?.student
      ? `${file.driveFolder.student.firstName} ${file.driveFolder.student.lastName}`
      : undefined,
  }));
}

// ===========================================
// PENDING MEET & GREETS
// ===========================================

export async function getPendingMeetAndGreets(
  schoolId: string,
  options: { teacherId?: string; limit?: number } = {}
): Promise<Array<{
  id: string;
  studentName: string;
  contact1Email: string;
  status: MeetAndGreetStatus;
  scheduledDateTime: Date | null;
  createdAt: Date;
}>> {
  const { teacherId, limit = 10 } = options;

  const meetAndGreets = await prisma.meetAndGreet.findMany({
    where: {
      schoolId,
      status: { in: ['PENDING_APPROVAL', 'APPROVED'] },
      ...(teacherId && { assignedTeacherId: teacherId }),
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: limit,
    select: {
      id: true,
      studentFirstName: true,
      studentLastName: true,
      contact1Email: true,
      status: true,
      scheduledDateTime: true,
      createdAt: true,
    },
  });

  return meetAndGreets.map((mg) => ({
    id: mg.id,
    studentName: `${mg.studentFirstName} ${mg.studentLastName}`,
    contact1Email: mg.contact1Email,
    status: mg.status,
    scheduledDateTime: mg.scheduledDateTime,
    createdAt: mg.createdAt,
  }));
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function calculateAttendanceRate(
  stats: Array<{ status: AttendanceStatus; _count: { id: number } }>
): number {
  let present = 0;
  let late = 0;
  let total = 0;

  for (const stat of stats) {
    const count = stat._count.id;
    total += count;

    if (stat.status === 'PRESENT') {
      present += count;
    } else if (stat.status === 'LATE') {
      late += count;
    }
    // ABSENT, EXCUSED, CANCELLED don't count as attended
  }

  if (total === 0) return 0;

  // Include LATE as attended (they still came)
  const attended = present + late;
  return Math.round((attended / total) * 100);
}

async function countPendingNotes(
  schoolId: string,
  teacherId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<number> {
  // Get all lessons for this teacher that occurred this week
  const lessons = await prisma.lesson.findMany({
    where: {
      schoolId,
      teacherId,
      isActive: true,
      term: {
        startDate: { lte: weekEnd },
        endDate: { gte: weekStart },
      },
    },
    select: { id: true },
  });

  if (lessons.length === 0) return 0;

  // Count lessons without notes this week
  const lessonsWithNotes = await prisma.note.findMany({
    where: {
      schoolId,
      lessonId: { in: lessons.map((l) => l.id) },
      date: { gte: weekStart, lte: weekEnd },
    },
    select: { lessonId: true },
    distinct: ['lessonId'],
  });

  const lessonsWithNotesSet = new Set(lessonsWithNotes.map((n) => n.lessonId));
  const pendingCount = lessons.filter((l) => !lessonsWithNotesSet.has(l.id)).length;

  return pendingCount;
}
