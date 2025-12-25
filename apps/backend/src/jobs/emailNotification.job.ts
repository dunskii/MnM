// ===========================================
// Email Notification Job
// ===========================================
// Processes email notification jobs from Bull queue
// Handles all transactional email types with preference checking

import { Job } from 'bull';
import { emailNotificationQueue } from '../config/queue';
import { prisma } from '../config/database';
import * as emailService from '../services/email.service';
import * as notificationService from '../services/notification.service';
import { config } from '../config';

// ===========================================
// TYPES
// ===========================================

export type EmailJobType =
  | 'LESSON_RESCHEDULED'
  | 'HYBRID_BOOKING_OPENED'
  | 'HYBRID_BOOKING_REMINDER'
  | 'INDIVIDUAL_SESSION_BOOKED'
  | 'INDIVIDUAL_SESSION_RESCHEDULED'
  | 'PAYMENT_RECEIVED'
  | 'INVOICE_CREATED'
  | 'MEET_AND_GREET_REMINDER'
  | 'LESSON_REMINDER';

export interface EmailJobData {
  type: EmailJobType;
  schoolId: string;
  data: Record<string, unknown>;
}

// ===========================================
// JOB PROCESSOR
// ===========================================

/**
 * Process email jobs from the queue
 */
emailNotificationQueue.process(async (job: Job<EmailJobData>) => {
  const { type, schoolId, data } = job.data;
  const startTime = Date.now();

  console.log(`[EmailJob] Processing job ${job.id}: ${type} for school ${schoolId}`);

  try {
    let result;

    switch (type) {
      case 'LESSON_RESCHEDULED':
        result = await processLessonRescheduledEmails(schoolId, data);
        break;
      case 'HYBRID_BOOKING_OPENED':
        result = await processHybridBookingOpenedEmails(schoolId, data);
        break;
      case 'HYBRID_BOOKING_REMINDER':
        result = await processHybridBookingReminderEmails(schoolId, data);
        break;
      case 'INDIVIDUAL_SESSION_BOOKED':
        result = await processIndividualSessionBookedEmail(schoolId, data);
        break;
      case 'INDIVIDUAL_SESSION_RESCHEDULED':
        result = await processIndividualSessionRescheduledEmail(schoolId, data);
        break;
      case 'PAYMENT_RECEIVED':
        result = await processPaymentReceivedEmail(schoolId, data);
        break;
      case 'INVOICE_CREATED':
        result = await processInvoiceCreatedEmail(schoolId, data);
        break;
      case 'MEET_AND_GREET_REMINDER':
        result = await processMeetAndGreetReminderEmail(schoolId, data);
        break;
      case 'LESSON_REMINDER':
        result = await processLessonReminderEmail(schoolId, data);
        break;
      default:
        console.warn(`[EmailJob] Unknown email type: ${type}`);
        result = { sent: 0, skipped: 0 };
    }

    const duration = Date.now() - startTime;
    console.log(`[EmailJob] Job ${job.id} completed in ${duration}ms:`, result);

    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EmailJob] Job ${job.id} failed after ${duration}ms:`, errorMessage);
    throw error; // Re-throw to trigger retry
  }
});

// ===========================================
// QUEUE HELPER FUNCTIONS
// ===========================================

/**
 * Queue lesson rescheduled emails
 */
export async function queueLessonRescheduledEmail(
  schoolId: string,
  lessonId: string,
  oldDayOfWeek: number,
  oldStartTime: string,
  oldEndTime: string,
  reason?: string
): Promise<string> {
  const job = await emailNotificationQueue.add({
    type: 'LESSON_RESCHEDULED',
    schoolId,
    data: { lessonId, oldDayOfWeek, oldStartTime, oldEndTime, reason },
  });
  return job.id.toString();
}

/**
 * Queue hybrid booking opened emails
 */
export async function queueHybridBookingOpenedEmails(
  schoolId: string,
  lessonId: string
): Promise<string> {
  const job = await emailNotificationQueue.add({
    type: 'HYBRID_BOOKING_OPENED',
    schoolId,
    data: { lessonId },
  });
  return job.id.toString();
}

/**
 * Queue hybrid booking reminder emails
 */
export async function queueHybridBookingReminderEmails(
  schoolId: string,
  lessonId: string
): Promise<string> {
  const job = await emailNotificationQueue.add({
    type: 'HYBRID_BOOKING_REMINDER',
    schoolId,
    data: { lessonId },
  });
  return job.id.toString();
}

/**
 * Queue individual session booked email
 */
export async function queueIndividualSessionBookedEmail(
  schoolId: string,
  bookingId: string
): Promise<string> {
  const job = await emailNotificationQueue.add({
    type: 'INDIVIDUAL_SESSION_BOOKED',
    schoolId,
    data: { bookingId },
  });
  return job.id.toString();
}

/**
 * Queue individual session rescheduled email
 */
export async function queueIndividualSessionRescheduledEmail(
  schoolId: string,
  bookingId: string,
  oldDate: string,
  oldTime: string
): Promise<string> {
  const job = await emailNotificationQueue.add({
    type: 'INDIVIDUAL_SESSION_RESCHEDULED',
    schoolId,
    data: { bookingId, oldDate, oldTime },
  });
  return job.id.toString();
}

/**
 * Queue payment received email
 */
export async function queuePaymentReceivedEmail(
  schoolId: string,
  paymentId: string
): Promise<string> {
  const job = await emailNotificationQueue.add({
    type: 'PAYMENT_RECEIVED',
    schoolId,
    data: { paymentId },
  });
  return job.id.toString();
}

/**
 * Queue invoice created email
 */
export async function queueInvoiceCreatedEmail(
  schoolId: string,
  invoiceId: string
): Promise<string> {
  const job = await emailNotificationQueue.add({
    type: 'INVOICE_CREATED',
    schoolId,
    data: { invoiceId },
  });
  return job.id.toString();
}

/**
 * Queue meet and greet reminder email
 */
export async function queueMeetAndGreetReminderEmail(
  schoolId: string,
  meetAndGreetId: string
): Promise<string> {
  const job = await emailNotificationQueue.add({
    type: 'MEET_AND_GREET_REMINDER',
    schoolId,
    data: { meetAndGreetId },
  });
  return job.id.toString();
}

/**
 * Queue lesson reminder email
 */
export async function queueLessonReminderEmail(
  schoolId: string,
  lessonId: string,
  lessonDate: string
): Promise<string> {
  const job = await emailNotificationQueue.add({
    type: 'LESSON_REMINDER',
    schoolId,
    data: { lessonId, lessonDate },
  });
  return job.id.toString();
}

// ===========================================
// PROCESSOR FUNCTIONS
// ===========================================

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Process lesson rescheduled emails
 * Sends to all parents of enrolled students
 */
async function processLessonRescheduledEmails(
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; skipped: number }> {
  const { lessonId, oldDayOfWeek, oldStartTime, oldEndTime, reason } = data as {
    lessonId: string;
    oldDayOfWeek: number;
    oldStartTime: string;
    oldEndTime: string;
    reason?: string;
  };

  // Get lesson with enrollments
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, schoolId },
    include: {
      term: true,
      teacher: { include: { user: true } },
      room: { include: { location: true } },
      enrollments: {
        where: { isActive: true },
        include: {
          student: {
            include: {
              family: {
                include: {
                  parents: {
                    include: { user: true },
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
    console.warn(`[EmailJob] Lesson ${lessonId} not found`);
    return { sent: 0, skipped: 0 };
  }

  // Collect unique parents
  const parentEmails = new Map<string, { email: string; name: string; studentName: string; userId: string }>();

  for (const enrollment of lesson.enrollments) {
    const parents = enrollment.student.family?.parents || [];
    for (const parent of parents) {
      if (!parentEmails.has(parent.user.email)) {
        parentEmails.set(parent.user.email, {
          email: parent.user.email,
          name: `${parent.user.firstName} ${parent.user.lastName}`,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          userId: parent.userId,
        });
      }
    }
  }

  let sent = 0;
  let skipped = 0;

  for (const recipient of parentEmails.values()) {
    // Check notification preferences
    const shouldSend = await notificationService.shouldSendNotification(
      schoolId,
      recipient.userId,
      'LESSON_RESCHEDULED'
    );

    if (!shouldSend) {
      skipped++;
      continue;
    }

    const success = await emailService.sendLessonRescheduledEmail(recipient.email, {
      parentName: recipient.name,
      studentName: recipient.studentName,
      lessonName: lesson.name,
      oldDay: DAYS_OF_WEEK[oldDayOfWeek],
      oldTime: `${oldStartTime} - ${oldEndTime}`,
      newDay: DAYS_OF_WEEK[lesson.dayOfWeek],
      newTime: `${lesson.startTime} - ${lesson.endTime}`,
      teacherName: `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`,
      locationName: lesson.room.location.name,
      roomName: lesson.room.name,
      reason,
    });

    if (success) sent++;
    else skipped++;
  }

  return { sent, skipped };
}

/**
 * Process hybrid booking opened emails
 * Sends to all parents of enrolled students
 */
async function processHybridBookingOpenedEmails(
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; skipped: number }> {
  const { lessonId } = data as { lessonId: string };

  // Get lesson with hybrid pattern and enrollments
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, schoolId },
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
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson || !lesson.hybridPattern) {
    console.warn(`[EmailJob] Lesson ${lessonId} not found or not hybrid`);
    return { sent: 0, skipped: 0 };
  }

  // Collect unique parents
  const parentData = new Map<string, { email: string; name: string; studentName: string; userId: string }>();

  for (const enrollment of lesson.enrollments) {
    const parents = enrollment.student.family?.parents || [];
    for (const parent of parents) {
      if (!parentData.has(parent.user.email)) {
        parentData.set(parent.user.email, {
          email: parent.user.email,
          name: `${parent.user.firstName} ${parent.user.lastName}`,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          userId: parent.userId,
        });
      }
    }
  }

  const individualWeeks = lesson.hybridPattern.individualWeeks as number[];
  const bookingUrl = `${config.frontendUrl}/parent/hybrid-booking/${lessonId}`;

  let sent = 0;
  let skipped = 0;

  for (const recipient of parentData.values()) {
    // Check notification preferences
    const shouldSend = await notificationService.shouldSendNotification(
      schoolId,
      recipient.userId,
      'HYBRID_BOOKING_OPENED'
    );

    if (!shouldSend) {
      skipped++;
      continue;
    }

    const success = await emailService.sendHybridBookingOpenedEmail(recipient.email, {
      parentName: recipient.name,
      studentName: recipient.studentName,
      lessonName: lesson.name,
      bookingDeadline: 'Before the first individual week',
      availableWeeks: individualWeeks,
      bookingUrl,
    });

    if (success) sent++;
    else skipped++;
  }

  return { sent, skipped };
}

/**
 * Process hybrid booking reminder emails
 */
async function processHybridBookingReminderEmails(
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; skipped: number }> {
  const { lessonId } = data as { lessonId: string };

  // Get lesson with hybrid pattern and enrollments
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, schoolId },
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
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      },
      hybridBookings: {
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
      },
    },
  });

  if (!lesson || !lesson.hybridPattern) {
    return { sent: 0, skipped: 0 };
  }

  const individualWeeks = lesson.hybridPattern.individualWeeks as number[];
  const bookingUrl = `${config.frontendUrl}/parent/hybrid-booking/${lessonId}`;

  let sent = 0;
  let skipped = 0;

  for (const enrollment of lesson.enrollments) {
    // Find weeks student hasn't booked
    const bookedWeeks = lesson.hybridBookings
      .filter((b) => b.studentId === enrollment.studentId)
      .map((b) => b.weekNumber);
    const unbookedWeeks = individualWeeks.filter((w) => !bookedWeeks.includes(w));

    if (unbookedWeeks.length === 0) {
      continue; // Already booked all weeks
    }

    const parents = enrollment.student.family?.parents || [];
    for (const parent of parents) {
      // Check notification preferences
      const shouldSend = await notificationService.shouldSendNotification(
        schoolId,
        parent.userId,
        'HYBRID_BOOKING_REMINDER'
      );

      if (!shouldSend) {
        skipped++;
        continue;
      }

      const success = await emailService.sendHybridBookingReminderEmail(parent.user.email, {
        parentName: `${parent.user.firstName} ${parent.user.lastName}`,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        lessonName: lesson.name,
        bookingDeadline: 'Before the first individual week',
        unbookedWeeks,
        bookingUrl,
      });

      if (success) sent++;
      else skipped++;
    }
  }

  return { sent, skipped };
}

/**
 * Process individual session booked email
 */
async function processIndividualSessionBookedEmail(
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; skipped: number }> {
  const { bookingId } = data as { bookingId: string };

  const booking = await prisma.hybridBooking.findFirst({
    where: { id: bookingId },
    include: {
      lesson: {
        include: {
          teacher: { include: { user: true } },
          room: { include: { location: true } },
        },
      },
      student: {
        include: {
          family: {
            include: {
              parents: {
                include: { user: true },
              },
            },
          },
        },
      },
      parent: {
        include: { user: true },
      },
    },
  });

  if (!booking) {
    return { sent: 0, skipped: 0 };
  }

  // Check notification preferences
  const shouldSend = await notificationService.shouldSendNotification(
    schoolId,
    booking.parent.userId,
    'HYBRID_BOOKING_OPENED' // Use same type for booking confirmations
  );

  if (!shouldSend) {
    return { sent: 0, skipped: 1 };
  }

  const sessionDate = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(booking.scheduledDate);

  const success = await emailService.sendIndividualSessionBookedEmail(booking.parent.user.email, {
    parentName: `${booking.parent.user.firstName} ${booking.parent.user.lastName}`,
    studentName: `${booking.student.firstName} ${booking.student.lastName}`,
    lessonName: booking.lesson.name,
    sessionDate,
    sessionTime: `${booking.startTime} - ${booking.endTime}`,
    teacherName: `${booking.lesson.teacher.user.firstName} ${booking.lesson.teacher.user.lastName}`,
    locationName: booking.lesson.room.location.name,
    roomName: booking.lesson.room.name,
    weekNumber: booking.weekNumber,
  });

  return { sent: success ? 1 : 0, skipped: success ? 0 : 1 };
}

/**
 * Process individual session rescheduled email
 */
async function processIndividualSessionRescheduledEmail(
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; skipped: number }> {
  const { bookingId, oldDate, oldTime } = data as {
    bookingId: string;
    oldDate: string;
    oldTime: string;
  };

  const booking = await prisma.hybridBooking.findFirst({
    where: { id: bookingId },
    include: {
      lesson: {
        include: {
          teacher: { include: { user: true } },
          room: { include: { location: true } },
        },
      },
      student: true,
      parent: {
        include: { user: true },
      },
    },
  });

  if (!booking) {
    return { sent: 0, skipped: 0 };
  }

  // Check notification preferences
  const shouldSend = await notificationService.shouldSendNotification(
    schoolId,
    booking.parent.userId,
    'LESSON_RESCHEDULED'
  );

  if (!shouldSend) {
    return { sent: 0, skipped: 1 };
  }

  const newDate = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(booking.scheduledDate);

  const success = await emailService.sendIndividualSessionRescheduledEmail(booking.parent.user.email, {
    parentName: `${booking.parent.user.firstName} ${booking.parent.user.lastName}`,
    studentName: `${booking.student.firstName} ${booking.student.lastName}`,
    lessonName: booking.lesson.name,
    weekNumber: booking.weekNumber,
    oldDate,
    oldTime,
    newDate,
    newTime: `${booking.startTime} - ${booking.endTime}`,
    teacherName: `${booking.lesson.teacher.user.firstName} ${booking.lesson.teacher.user.lastName}`,
    locationName: booking.lesson.room.location.name,
  });

  return { sent: success ? 1 : 0, skipped: success ? 0 : 1 };
}

/**
 * Process payment received email
 */
async function processPaymentReceivedEmail(
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; skipped: number }> {
  const { paymentId } = data as { paymentId: string };

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          school: true,
          family: {
            include: {
              parents: {
                include: { user: true },
              },
            },
          },
        },
      },
    },
  });

  if (!payment || payment.invoice.schoolId !== schoolId) {
    return { sent: 0, skipped: 0 };
  }

  const primaryParent = payment.invoice.family.parents.find((p) => p.isPrimary) || payment.invoice.family.parents[0];
  if (!primaryParent) {
    return { sent: 0, skipped: 0 };
  }

  // Check notification preferences
  const shouldSend = await notificationService.shouldSendNotification(
    schoolId,
    primaryParent.userId,
    'PAYMENT_RECEIVED'
  );

  if (!shouldSend) {
    return { sent: 0, skipped: 1 };
  }

  const remainingBalance = Number(payment.invoice.total) - Number(payment.invoice.amountPaid);

  const success = await emailService.sendPaymentReceiptEmail(primaryParent.user.email, {
    parentName: `${primaryParent.user.firstName} ${primaryParent.user.lastName}`,
    schoolName: payment.invoice.school.name,
    invoiceNumber: payment.invoice.invoiceNumber,
    amount: Number(payment.amount),
    paymentMethod: payment.method,
    reference: payment.reference || undefined,
    remainingBalance,
  });

  return { sent: success ? 1 : 0, skipped: success ? 0 : 1 };
}

/**
 * Process invoice created email
 */
async function processInvoiceCreatedEmail(
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; skipped: number }> {
  const { invoiceId } = data as { invoiceId: string };

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, schoolId },
    include: {
      school: true,
      family: {
        include: {
          parents: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!invoice) {
    return { sent: 0, skipped: 0 };
  }

  const primaryParent = invoice.family.parents.find((p) => p.isPrimary) || invoice.family.parents[0];
  if (!primaryParent) {
    return { sent: 0, skipped: 0 };
  }

  // Check notification preferences
  const shouldSend = await notificationService.shouldSendNotification(
    schoolId,
    primaryParent.userId,
    'INVOICE_CREATED'
  );

  if (!shouldSend) {
    return { sent: 0, skipped: 1 };
  }

  const success = await emailService.sendInvoiceEmail(primaryParent.user.email, {
    parentName: `${primaryParent.user.firstName} ${primaryParent.user.lastName}`,
    schoolName: invoice.school.name,
    invoiceNumber: invoice.invoiceNumber,
    total: Number(invoice.total),
    dueDate: invoice.dueDate,
    description: invoice.description || `Invoice ${invoice.invoiceNumber}`,
  });

  return { sent: success ? 1 : 0, skipped: success ? 0 : 1 };
}

/**
 * Process meet and greet reminder email
 */
async function processMeetAndGreetReminderEmail(
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; skipped: number }> {
  const { meetAndGreetId } = data as { meetAndGreetId: string };

  const meetAndGreet = await prisma.meetAndGreet.findFirst({
    where: { id: meetAndGreetId, schoolId },
    include: {
      assignedTeacher: {
        include: { user: true },
      },
    },
  });

  if (!meetAndGreet || !meetAndGreet.scheduledDateTime) {
    return { sent: 0, skipped: 0 };
  }

  const scheduledDateTime = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(meetAndGreet.scheduledDateTime);

  const teacherName = meetAndGreet.assignedTeacher
    ? `${meetAndGreet.assignedTeacher.user.firstName} ${meetAndGreet.assignedTeacher.user.lastName}`
    : 'A member of our team';

  const success = await emailService.sendMeetAndGreetReminderEmail(meetAndGreet.contact1Email, {
    parentName: meetAndGreet.contact1Name,
    childName: `${meetAndGreet.studentFirstName} ${meetAndGreet.studentLastName}`,
    scheduledDateTime,
    locationName: 'Music n Me',
    locationAddress: 'Our studio location',
    teacherName,
  });

  return { sent: success ? 1 : 0, skipped: success ? 0 : 1 };
}

/**
 * Process lesson reminder email
 */
async function processLessonReminderEmail(
  schoolId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; skipped: number }> {
  const { lessonId, lessonDate } = data as { lessonId: string; lessonDate: string };

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, schoolId },
    include: {
      teacher: { include: { user: true } },
      room: { include: { location: true } },
      enrollments: {
        where: { isActive: true },
        include: {
          student: {
            include: {
              family: {
                include: {
                  parents: {
                    include: { user: true },
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
    return { sent: 0, skipped: 0 };
  }

  const formattedDate = new Date(lessonDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let sent = 0;
  let skipped = 0;

  // Collect unique parents
  const parentData = new Map<string, { email: string; name: string; studentName: string; userId: string }>();

  for (const enrollment of lesson.enrollments) {
    const parents = enrollment.student.family?.parents || [];
    for (const parent of parents) {
      if (!parentData.has(parent.user.email)) {
        parentData.set(parent.user.email, {
          email: parent.user.email,
          name: `${parent.user.firstName} ${parent.user.lastName}`,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          userId: parent.userId,
        });
      }
    }
  }

  for (const recipient of parentData.values()) {
    // Check notification preferences
    const shouldSend = await notificationService.shouldSendNotification(
      schoolId,
      recipient.userId,
      'LESSON_REMINDER'
    );

    if (!shouldSend) {
      skipped++;
      continue;
    }

    const success = await emailService.sendLessonReminderEmail(recipient.email, {
      parentName: recipient.name,
      studentName: recipient.studentName,
      lessonName: lesson.name,
      lessonDate: formattedDate,
      lessonTime: `${lesson.startTime} - ${lesson.endTime}`,
      teacherName: `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`,
      locationName: lesson.room.location.name,
      roomName: lesson.room.name,
    });

    if (success) sent++;
    else skipped++;
  }

  return { sent, skipped };
}
