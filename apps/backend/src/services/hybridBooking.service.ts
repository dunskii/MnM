// ===========================================
// Hybrid Booking Service
// ===========================================
// Manages hybrid lesson individual session bookings
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  HybridBooking,
  HybridLessonPattern,
  HybridBookingStatus,
  Lesson,
  Student,
  Parent,
} from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  weekNumber: number;
  isAvailable: boolean;
}

export interface BookingStats {
  totalStudents: number;
  bookedCount: number;
  unbookedCount: number;
  completionRate: number;
  pendingBookings: number;
  confirmedBookings: number;
}

export interface CreateBookingInput {
  lessonId: string;
  studentId: string;
  weekNumber: number;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
}

export interface RescheduleBookingInput {
  scheduledDate: Date;
  startTime: string;
  endTime: string;
}

export interface BookingFilters {
  lessonId?: string;
  studentId?: string;
  weekNumber?: number;
  status?: HybridBookingStatus;
}

export interface HybridBookingWithRelations extends HybridBooking {
  lesson: Lesson & {
    hybridPattern: HybridLessonPattern | null;
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
  parent: Parent & {
    user: { firstName: string; lastName: string; email: string };
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    type: 'INDIVIDUAL' | 'GROUP' | 'BAND' | 'HYBRID_GROUP' | 'HYBRID_INDIVIDUAL' | 'HYBRID_PLACEHOLDER' | 'MEET_AND_GREET';
    lessonId?: string;
    lessonName?: string;
    teacherName?: string;
    roomName?: string;
    locationName?: string;
    enrolledCount?: number;
    maxStudents?: number;
    isBooking?: boolean;
    studentName?: string;
    bookingId?: string;
    weekNumber?: number;
    bookingsOpen?: boolean;
  };
}

// ===========================================
// INCLUDE DEFINITIONS
// ===========================================

const bookingInclude = {
  lesson: {
    include: {
      hybridPattern: true,
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
  parent: {
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  },
} as const;

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Calculate the week number for a given date within a term
 */
export function getWeekNumber(termStartDate: Date, targetDate: Date): number {
  const start = new Date(termStartDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;

  return weekNumber;
}

/**
 * Get the date for a specific week number within a term
 */
export function getDateForWeek(termStartDate: Date, weekNumber: number, dayOfWeek: number): Date {
  const start = new Date(termStartDate);
  start.setHours(0, 0, 0, 0);

  // Get the day of week of term start (0 = Sunday, 1 = Monday, etc.)
  const termStartDay = start.getDay();

  // Calculate days to add to get to the target week and day
  const daysToAdd = (weekNumber - 1) * 7 + (dayOfWeek - termStartDay + 7) % 7;

  const targetDate = new Date(start);
  targetDate.setDate(targetDate.getDate() + daysToAdd);

  return targetDate;
}

/**
 * Validate 24-hour notice rule
 * Returns true if there's at least 24 hours until the booking time
 */
export function validate24HourNotice(scheduledDate: Date, startTime: string): boolean {
  const [hours, minutes] = startTime.split(':').map(Number);
  const bookingTime = new Date(scheduledDate);
  bookingTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilBooking >= 24;
}

/**
 * Calculate end time given start time and duration in minutes
 */
export function calculateEndTime(startTime: string, durationMins: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMins;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return s1 < e2 && s2 < e1;
}

// ===========================================
// VERIFY PARENT-STUDENT RELATIONSHIP
// ===========================================

/**
 * Verify that a parent can book for a specific student
 * SECURITY: Critical for preventing unauthorized bookings
 */
export async function verifyParentStudentRelationship(
  schoolId: string,
  parentId: string,
  studentId: string
): Promise<boolean> {
  const parent = await prisma.parent.findFirst({
    where: {
      id: parentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      family: {
        include: {
          students: {
            where: { schoolId }, // CRITICAL: Multi-tenancy filter
            select: { id: true },
          },
        },
      },
    },
  });

  if (!parent || !parent.family) {
    return false;
  }

  const studentIds = parent.family.students.map((s) => s.id);
  return studentIds.includes(studentId);
}

// ===========================================
// GET AVAILABLE SLOTS
// ===========================================

/**
 * Get available time slots for a specific week of a hybrid lesson
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getAvailableSlots(
  schoolId: string,
  lessonId: string,
  weekNumber: number
): Promise<TimeSlot[]> {
  // Get lesson with hybrid pattern
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
      isActive: true,
    },
    include: {
      hybridPattern: true,
      term: true,
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  if (!lesson.hybridPattern) {
    throw new AppError('This lesson is not a hybrid lesson.', 400);
  }

  // Check if this is an individual week
  const individualWeeks = lesson.hybridPattern.individualWeeks as number[];
  if (!individualWeeks.includes(weekNumber)) {
    throw new AppError(`Week ${weekNumber} is not an individual booking week.`, 400);
  }

  // Check if bookings are open
  if (!lesson.hybridPattern.bookingsOpen) {
    throw new AppError('Bookings are not currently open for this lesson.', 400);
  }

  // Get the date for this week
  const lessonDate = getDateForWeek(lesson.term.startDate, weekNumber, lesson.dayOfWeek);

  // Get existing bookings for this week (non-cancelled)
  const existingBookings = await prisma.hybridBooking.findMany({
    where: {
      lessonId,
      weekNumber,
      status: { notIn: ['CANCELLED'] },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Generate available time slots based on lesson schedule
  const slots: TimeSlot[] = [];
  const slotDuration = lesson.hybridPattern.individualSlotDuration;
  const lessonStartMinutes = parseInt(lesson.startTime.split(':')[0]) * 60 + parseInt(lesson.startTime.split(':')[1]);
  const lessonEndMinutes = parseInt(lesson.endTime.split(':')[0]) * 60 + parseInt(lesson.endTime.split(':')[1]);

  // Generate slots within the lesson's time window
  for (let startMins = lessonStartMinutes; startMins + slotDuration <= lessonEndMinutes; startMins += slotDuration) {
    const startTime = `${Math.floor(startMins / 60).toString().padStart(2, '0')}:${(startMins % 60).toString().padStart(2, '0')}`;
    const endTime = calculateEndTime(startTime, slotDuration);

    // Check if this slot conflicts with any existing booking
    const isBooked = existingBookings.some((booking) =>
      timeRangesOverlap(startTime, endTime, booking.startTime, booking.endTime)
    );

    slots.push({
      date: lessonDate,
      startTime,
      endTime,
      weekNumber,
      isAvailable: !isBooked,
    });
  }

  return slots;
}

// ===========================================
// CREATE HYBRID BOOKING
// ===========================================

/**
 * Create a new hybrid booking
 * SECURITY: Validates parent-student relationship and multi-tenancy
 */
export async function createHybridBooking(
  schoolId: string,
  parentId: string,
  input: CreateBookingInput
): Promise<HybridBookingWithRelations> {
  // Get lesson with hybrid pattern
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: input.lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
      isActive: true,
    },
    include: {
      hybridPattern: true,
      term: true,
      enrollments: {
        where: { isActive: true },
        select: { studentId: true },
      },
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  if (!lesson.hybridPattern) {
    throw new AppError('This lesson is not a hybrid lesson.', 400);
  }

  // Check if bookings are open
  if (!lesson.hybridPattern.bookingsOpen) {
    throw new AppError('Bookings are not currently open for this lesson.', 400);
  }

  // Verify parent-student relationship
  const canBook = await verifyParentStudentRelationship(schoolId, parentId, input.studentId);
  if (!canBook) {
    throw new AppError('You can only book for your own children.', 403);
  }

  // Verify student is enrolled in the lesson
  const isEnrolled = lesson.enrollments.some((e) => e.studentId === input.studentId);
  if (!isEnrolled) {
    throw new AppError('Student is not enrolled in this lesson.', 400);
  }

  // Check if this is an individual week
  const individualWeeks = lesson.hybridPattern.individualWeeks as number[];
  if (!individualWeeks.includes(input.weekNumber)) {
    throw new AppError(`Week ${input.weekNumber} is not an individual booking week.`, 400);
  }

  // Validate 24-hour notice
  if (!validate24HourNotice(input.scheduledDate, input.startTime)) {
    throw new AppError('Bookings must be made at least 24 hours in advance.', 400);
  }

  // Use transaction with row locking to prevent race conditions
  const booking = await prisma.$transaction(async (tx) => {
    // Check for existing booking by this student for this week
    const existingStudentBooking = await tx.hybridBooking.findFirst({
      where: {
        lessonId: input.lessonId,
        studentId: input.studentId,
        weekNumber: input.weekNumber,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (existingStudentBooking) {
      throw new AppError('This student already has a booking for this week.', 409);
    }

    // Check for slot conflicts (another student booking the same time)
    const slotConflict = await tx.hybridBooking.findFirst({
      where: {
        lessonId: input.lessonId,
        weekNumber: input.weekNumber,
        scheduledDate: input.scheduledDate,
        startTime: input.startTime,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (slotConflict) {
      throw new AppError('This time slot is already booked.', 409);
    }

    // Create the booking
    return tx.hybridBooking.create({
      data: {
        lessonId: input.lessonId,
        studentId: input.studentId,
        parentId,
        weekNumber: input.weekNumber,
        scheduledDate: input.scheduledDate,
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'CONFIRMED', // Auto-confirm on creation
        confirmedAt: new Date(),
      },
      include: bookingInclude,
    });
  });

  // Queue booking confirmation email notification
  try {
    const { queueIndividualSessionBookedEmail } = await import('../jobs/emailNotification.job');
    await queueIndividualSessionBookedEmail(schoolId, booking.id);
  } catch (error) {
    console.error('[HybridBookingService] Failed to queue booking email:', error);
    // Don't fail the booking if email fails
  }

  return booking as unknown as HybridBookingWithRelations;
}

// ===========================================
// RESCHEDULE HYBRID BOOKING
// ===========================================

/**
 * Reschedule an existing hybrid booking
 * SECURITY: Validates ownership and 24-hour notice
 */
export async function rescheduleHybridBooking(
  schoolId: string,
  parentId: string,
  bookingId: string,
  input: RescheduleBookingInput
): Promise<HybridBookingWithRelations> {
  // Get existing booking
  const existingBooking = await prisma.hybridBooking.findFirst({
    where: {
      id: bookingId,
      parentId, // SECURITY: Only allow parent who created the booking
      lesson: { schoolId }, // CRITICAL: Multi-tenancy filter
    },
    include: {
      lesson: {
        include: {
          hybridPattern: true,
          term: true,
        },
      },
    },
  });

  if (!existingBooking) {
    throw new AppError('Booking not found.', 404);
  }

  if (existingBooking.status === 'CANCELLED') {
    throw new AppError('Cannot reschedule a cancelled booking.', 400);
  }

  if (existingBooking.status === 'COMPLETED') {
    throw new AppError('Cannot reschedule a completed booking.', 400);
  }

  // Validate 24-hour notice for current booking (can't reschedule within 24h of original time)
  if (!validate24HourNotice(existingBooking.scheduledDate, existingBooking.startTime)) {
    throw new AppError('Cannot reschedule bookings within 24 hours of the scheduled time.', 400);
  }

  // Validate 24-hour notice for new booking
  if (!validate24HourNotice(input.scheduledDate, input.startTime)) {
    throw new AppError('New booking time must be at least 24 hours in advance.', 400);
  }

  // Check bookings are still open
  if (!existingBooking.lesson.hybridPattern?.bookingsOpen) {
    throw new AppError('Bookings are not currently open for this lesson.', 400);
  }

  // Use transaction to prevent race conditions
  const updatedBooking = await prisma.$transaction(async (tx) => {
    // Check for slot conflicts at new time
    const slotConflict = await tx.hybridBooking.findFirst({
      where: {
        id: { not: bookingId },
        lessonId: existingBooking.lessonId,
        weekNumber: existingBooking.weekNumber,
        scheduledDate: input.scheduledDate,
        startTime: input.startTime,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (slotConflict) {
      throw new AppError('This time slot is already booked.', 409);
    }

    // Update the booking
    return tx.hybridBooking.update({
      where: { id: bookingId },
      data: {
        scheduledDate: input.scheduledDate,
        startTime: input.startTime,
        endTime: input.endTime,
      },
      include: bookingInclude,
    });
  });

  // Queue reschedule notification email
  try {
    const { queueIndividualSessionRescheduledEmail } = await import('../jobs/emailNotification.job');
    const oldDate = new Intl.DateTimeFormat('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(existingBooking.scheduledDate);
    const oldTime = `${existingBooking.startTime} - ${existingBooking.endTime}`;
    await queueIndividualSessionRescheduledEmail(schoolId, updatedBooking.id, oldDate, oldTime);
  } catch (error) {
    console.error('[HybridBookingService] Failed to queue reschedule email:', error);
    // Don't fail the reschedule if email fails
  }

  return updatedBooking as unknown as HybridBookingWithRelations;
}

// ===========================================
// CANCEL HYBRID BOOKING
// ===========================================

/**
 * Cancel a hybrid booking
 * SECURITY: Validates ownership
 */
export async function cancelHybridBooking(
  schoolId: string,
  parentId: string,
  bookingId: string,
  reason?: string
): Promise<void> {
  // Get existing booking
  const existingBooking = await prisma.hybridBooking.findFirst({
    where: {
      id: bookingId,
      parentId, // SECURITY: Only allow parent who created the booking
      lesson: { schoolId }, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existingBooking) {
    throw new AppError('Booking not found.', 404);
  }

  if (existingBooking.status === 'CANCELLED') {
    throw new AppError('Booking is already cancelled.', 400);
  }

  if (existingBooking.status === 'COMPLETED') {
    throw new AppError('Cannot cancel a completed booking.', 400);
  }

  // Update booking status to cancelled
  await prisma.hybridBooking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });
}

// ===========================================
// GET PARENT BOOKINGS
// ===========================================

/**
 * Get all bookings for a parent
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getParentBookings(
  schoolId: string,
  parentId: string,
  filters?: BookingFilters
): Promise<HybridBookingWithRelations[]> {
  const where: Record<string, unknown> = {
    parentId,
    lesson: { schoolId }, // CRITICAL: Multi-tenancy filter
  };

  if (filters?.lessonId) {
    where.lessonId = filters.lessonId;
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.weekNumber) {
    where.weekNumber = filters.weekNumber;
  }

  const bookings = await prisma.hybridBooking.findMany({
    where,
    include: bookingInclude,
    orderBy: [
      { scheduledDate: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return bookings as unknown as HybridBookingWithRelations[];
}

// ===========================================
// GET LESSON BOOKINGS (ADMIN)
// ===========================================

/**
 * Get all bookings for a lesson (admin/teacher view)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getLessonBookings(
  schoolId: string,
  lessonId: string,
  filters?: { weekNumber?: number; status?: HybridBookingStatus }
): Promise<HybridBookingWithRelations[]> {
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

  const where: Record<string, unknown> = { lessonId };

  if (filters?.weekNumber) {
    where.weekNumber = filters.weekNumber;
  }
  if (filters?.status) {
    where.status = filters.status;
  }

  const bookings = await prisma.hybridBooking.findMany({
    where,
    include: bookingInclude,
    orderBy: [
      { weekNumber: 'asc' },
      { scheduledDate: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return bookings as unknown as HybridBookingWithRelations[];
}

// ===========================================
// GET BOOKING STATISTICS
// ===========================================

/**
 * Get booking statistics for a hybrid lesson
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getHybridBookingStats(
  schoolId: string,
  lessonId: string,
  weekNumber?: number
): Promise<BookingStats> {
  // Verify lesson belongs to school and is hybrid
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      hybridPattern: true,
      enrollments: {
        where: { isActive: true },
        select: { studentId: true },
      },
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  if (!lesson.hybridPattern) {
    throw new AppError('This lesson is not a hybrid lesson.', 400);
  }

  const totalStudents = lesson.enrollments.length;

  // Build where clause for bookings
  const bookingWhere: Record<string, unknown> = {
    lessonId,
    status: { notIn: ['CANCELLED'] },
  };

  if (weekNumber) {
    bookingWhere.weekNumber = weekNumber;
  }

  // Get booking counts
  const bookings = await prisma.hybridBooking.groupBy({
    by: ['status'],
    where: bookingWhere,
    _count: { status: true },
  });

  const pendingBookings = bookings.find((b) => b.status === 'PENDING')?._count.status || 0;
  const confirmedBookings = bookings.find((b) => b.status === 'CONFIRMED')?._count.status || 0;
  const completedBookings = bookings.find((b) => b.status === 'COMPLETED')?._count.status || 0;

  const bookedCount = pendingBookings + confirmedBookings + completedBookings;
  const unbookedCount = totalStudents - bookedCount;
  const completionRate = totalStudents > 0 ? (bookedCount / totalStudents) * 100 : 0;

  return {
    totalStudents,
    bookedCount,
    unbookedCount,
    completionRate: Math.round(completionRate * 100) / 100,
    pendingBookings,
    confirmedBookings,
  };
}

// ===========================================
// TOGGLE BOOKINGS OPEN/CLOSE
// ===========================================

/**
 * Open or close bookings for a hybrid lesson
 * SECURITY: Admin only, schoolId filter is REQUIRED
 */
export async function toggleBookingsOpen(
  schoolId: string,
  lessonId: string,
  open: boolean
): Promise<HybridLessonPattern> {
  // Verify lesson belongs to school and has hybrid pattern
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: { hybridPattern: true },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  if (!lesson.hybridPattern) {
    throw new AppError('This lesson is not a hybrid lesson.', 400);
  }

  // Update bookingsOpen flag
  const pattern = await prisma.hybridLessonPattern.update({
    where: { lessonId },
    data: { bookingsOpen: open },
  });

  // If opening bookings, queue notification emails to all enrolled parents
  if (open) {
    try {
      const { queueHybridBookingOpenedEmails } = await import('../jobs/emailNotification.job');
      await queueHybridBookingOpenedEmails(schoolId, lessonId);
    } catch (error) {
      console.error('[HybridBookingService] Failed to queue booking opened emails:', error);
      // Don't fail the toggle if email fails
    }
  }

  return pattern;
}

// ===========================================
// GET SINGLE BOOKING
// ===========================================

/**
 * Get a single booking by ID
 * SECURITY: Validates access rights
 */
export async function getBooking(
  schoolId: string,
  bookingId: string,
  userId?: string,
  userRole?: string
): Promise<HybridBookingWithRelations | null> {
  const booking = await prisma.hybridBooking.findFirst({
    where: {
      id: bookingId,
      lesson: { schoolId }, // CRITICAL: Multi-tenancy filter
    },
    include: bookingInclude,
  });

  if (!booking) {
    return null;
  }

  // If user is a parent, they can only see their own bookings
  if (userRole === 'PARENT') {
    const parent = await prisma.parent.findFirst({
      where: { userId, schoolId },
    });
    if (!parent || booking.parentId !== parent.id) {
      return null;
    }
  }

  return booking as unknown as HybridBookingWithRelations;
}

// ===========================================
// CALENDAR EVENTS
// ===========================================

/**
 * Paginated response for calendar events
 */
export interface PaginatedCalendarEvents {
  events: CalendarEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Generate calendar events for all lessons
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 *
 * @param schoolId - School ID for multi-tenancy
 * @param filters - Optional filters for term, teacher, date range, and pagination
 * @returns Paginated calendar events
 */
export async function getCalendarEvents(
  schoolId: string,
  filters?: {
    termId?: string;
    teacherId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedCalendarEvents> {
  const events: CalendarEvent[] = [];

  // Build lesson query
  const lessonWhere: Record<string, unknown> = {
    schoolId, // CRITICAL: Multi-tenancy filter
    isActive: true,
  };

  if (filters?.termId) {
    lessonWhere.termId = filters.termId;
  }
  if (filters?.teacherId) {
    lessonWhere.teacherId = filters.teacherId;
  }

  // Get all lessons with their patterns
  const lessons = await prisma.lesson.findMany({
    where: lessonWhere,
    include: {
      lessonType: true,
      hybridPattern: true,
      term: true,
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      room: {
        include: {
          location: { select: { name: true } },
        },
      },
      instrument: { select: { name: true } },
      _count: {
        select: {
          enrollments: { where: { isActive: true } },
        },
      },
    },
  });

  // Get date range
  const startDate = filters?.startDate || new Date();
  const endDate = filters?.endDate || new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  // Process each lesson
  for (const lesson of lessons) {
    const teacherName = `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`;
    const roomName = lesson.room.name;
    const locationName = lesson.room.location.name;

    // Calculate weeks within the term that fall in our date range
    const termStart = new Date(lesson.term.startDate);
    const termEnd = new Date(lesson.term.endDate);

    // Iterate through each week of the term
    let currentDate = new Date(termStart);
    let weekNumber = 1;

    while (currentDate <= termEnd && currentDate <= endDate) {
      // Find the lesson day in this week
      const lessonDate = getDateForWeek(termStart, weekNumber, lesson.dayOfWeek);

      if (lessonDate >= startDate && lessonDate <= endDate && lessonDate >= termStart && lessonDate <= termEnd) {
        const [startHour, startMin] = lesson.startTime.split(':').map(Number);
        const [endHour, endMin] = lesson.endTime.split(':').map(Number);

        const eventStart = new Date(lessonDate);
        eventStart.setHours(startHour, startMin, 0, 0);

        const eventEnd = new Date(lessonDate);
        eventEnd.setHours(endHour, endMin, 0, 0);

        const lessonTypeName = lesson.lessonType.type;
        const isHybrid = lessonTypeName === 'HYBRID';

        if (isHybrid && lesson.hybridPattern) {
          const groupWeeks = lesson.hybridPattern.groupWeeks as number[];
          const individualWeeks = lesson.hybridPattern.individualWeeks as number[];

          if (groupWeeks.includes(weekNumber)) {
            // Group week - show as HYBRID_GROUP
            events.push({
              id: `${lesson.id}-week-${weekNumber}`,
              title: `${lesson.name} (Group)`,
              start: eventStart,
              end: eventEnd,
              allDay: false,
              resource: {
                type: 'HYBRID_GROUP',
                lessonId: lesson.id,
                lessonName: lesson.name,
                teacherName,
                roomName,
                locationName,
                enrolledCount: lesson._count.enrollments,
                maxStudents: lesson.maxStudents,
                weekNumber,
              },
            });
          } else if (individualWeeks.includes(weekNumber)) {
            // Individual week - show placeholder
            events.push({
              id: `${lesson.id}-week-${weekNumber}-placeholder`,
              title: `${lesson.name} (Individual Booking Week)`,
              start: eventStart,
              end: eventEnd,
              allDay: false,
              resource: {
                type: 'HYBRID_PLACEHOLDER',
                lessonId: lesson.id,
                lessonName: lesson.name,
                teacherName,
                roomName,
                locationName,
                enrolledCount: lesson._count.enrollments,
                maxStudents: lesson.maxStudents,
                weekNumber,
                bookingsOpen: lesson.hybridPattern.bookingsOpen,
              },
            });
          }
        } else {
          // Regular lesson (not hybrid)
          const eventType = lessonTypeName as 'INDIVIDUAL' | 'GROUP' | 'BAND';
          events.push({
            id: `${lesson.id}-week-${weekNumber}`,
            title: lesson.name,
            start: eventStart,
            end: eventEnd,
            allDay: false,
            resource: {
              type: eventType,
              lessonId: lesson.id,
              lessonName: lesson.name,
              teacherName,
              roomName,
              locationName,
              enrolledCount: lesson._count.enrollments,
              maxStudents: lesson.maxStudents,
              weekNumber,
            },
          });
        }
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }
  }

  // Get hybrid bookings and add them as individual events
  const bookingWhere: Record<string, unknown> = {
    lesson: { schoolId },
    status: { notIn: ['CANCELLED'] },
  };

  if (filters?.startDate) {
    bookingWhere.scheduledDate = { gte: filters.startDate };
  }
  if (filters?.endDate) {
    if (bookingWhere.scheduledDate) {
      (bookingWhere.scheduledDate as Record<string, Date>).lte = filters.endDate;
    } else {
      bookingWhere.scheduledDate = { lte: filters.endDate };
    }
  }

  const hybridBookings = await prisma.hybridBooking.findMany({
    where: bookingWhere,
    include: {
      lesson: {
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
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
    },
  });

  // Add individual booking events
  for (const booking of hybridBookings) {
    if (filters?.teacherId && booking.lesson.teacherId !== filters.teacherId) {
      continue;
    }

    const [startHour, startMin] = booking.startTime.split(':').map(Number);
    const [endHour, endMin] = booking.endTime.split(':').map(Number);

    const eventStart = new Date(booking.scheduledDate);
    eventStart.setHours(startHour, startMin, 0, 0);

    const eventEnd = new Date(booking.scheduledDate);
    eventEnd.setHours(endHour, endMin, 0, 0);

    const teacherName = `${booking.lesson.teacher.user.firstName} ${booking.lesson.teacher.user.lastName}`;
    const studentName = `${booking.student.firstName} ${booking.student.lastName}`;

    events.push({
      id: `booking-${booking.id}`,
      title: `${booking.lesson.name} - ${studentName}`,
      start: eventStart,
      end: eventEnd,
      allDay: false,
      resource: {
        type: 'HYBRID_INDIVIDUAL',
        lessonId: booking.lessonId,
        lessonName: booking.lesson.name,
        teacherName,
        roomName: booking.lesson.room.name,
        locationName: booking.lesson.room.location.name,
        isBooking: true,
        studentName,
        bookingId: booking.id,
        weekNumber: booking.weekNumber,
      },
    });
  }

  // Sort events by start time
  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Apply pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 100; // Default 100 events per page
  const total = events.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEvents = events.slice(startIndex, endIndex);

  return {
    events: paginatedEvents,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

// ===========================================
// GET STUDENTS WITHOUT BOOKINGS
// ===========================================

/**
 * Get students enrolled in a lesson who haven't booked for a specific week
 * Useful for sending reminder emails
 */
export async function getStudentsWithoutBookings(
  schoolId: string,
  lessonId: string,
  weekNumber: number
): Promise<Array<{ student: Student; parent: Parent & { user: { email: string; firstName: string; lastName: string } } }>> {
  // Verify lesson belongs to school
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      hybridPattern: true,
      enrollments: {
        where: { isActive: true },
        include: {
          student: {
            include: {
              family: {
                include: {
                  parents: {
                    include: {
                      user: {
                        select: { email: true, firstName: true, lastName: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found.', 404);
  }

  if (!lesson.hybridPattern) {
    throw new AppError('This lesson is not a hybrid lesson.', 400);
  }

  // Get existing bookings for this week
  const existingBookings = await prisma.hybridBooking.findMany({
    where: {
      lessonId,
      weekNumber,
      status: { notIn: ['CANCELLED'] },
    },
    select: { studentId: true },
  });

  const bookedStudentIds = new Set(existingBookings.map((b) => b.studentId));

  // Filter to students without bookings
  const studentsWithoutBookings: Array<{
    student: Student;
    parent: Parent & { user: { email: string; firstName: string; lastName: string } };
  }> = [];

  for (const enrollment of lesson.enrollments) {
    if (!bookedStudentIds.has(enrollment.studentId)) {
      const student = enrollment.student;
      // Get the primary parent (first one)
      const parent = student.family?.parents[0];
      if (parent) {
        studentsWithoutBookings.push({
          student,
          parent: parent as Parent & { user: { email: string; firstName: string; lastName: string } },
        });
      }
    }
  }

  return studentsWithoutBookings;
}
