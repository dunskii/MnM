// ===========================================
// Meet & Greet Service
// ===========================================
// Manages meet and greet bookings for prospective parents
// CRITICAL: All queries filter by schoolId for multi-tenancy

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { MeetAndGreet, MeetAndGreetStatus, Prisma } from '@prisma/client';
import {
  CreateMeetAndGreetInput,
  UpdateMeetAndGreetInput,
} from '../validators/meetAndGreet.validators';
import { generateSecureToken } from '../utils/crypto';
import { sanitizeNotes, sanitizeName, sanitizePhone } from '../utils/sanitize';
import { logger } from '../utils/logger';
import * as emailService from './email.service';
import { config } from '../config';

// Create service-specific logger
const log = logger.forService('MeetAndGreet');

// ===========================================
// TYPES
// ===========================================

export interface MeetAndGreetFilters {
  status?: MeetAndGreetStatus;
  startDate?: Date;
  endDate?: Date;
  teacherId?: string;
}

export interface MeetAndGreetWithRelations extends MeetAndGreet {
  school?: { id: string; name: string; email: string | null };
  instrument?: { id: string; name: string } | null;
  assignedTeacher?: {
    id: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  } | null;
}

// ===========================================
// CREATE MEET & GREET (Public)
// ===========================================

/**
 * Create a new meet & greet booking
 * This is a PUBLIC endpoint - no authentication required
 * Sends verification email to parent
 */
export async function createMeetAndGreet(
  data: CreateMeetAndGreetInput
): Promise<{ id: string; message: string }> {
  const { schoolId, ...bookingData } = data;

  // Verify school exists and is active
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, isActive: true },
  });

  if (!school) {
    throw new AppError('School not found.', 404);
  }

  if (!school.isActive) {
    throw new AppError('This school is not currently accepting bookings.', 400);
  }

  // Check for existing pending booking with same email
  const existingBooking = await prisma.meetAndGreet.findFirst({
    where: {
      schoolId,
      contact1Email: data.contact1Email.toLowerCase(),
      status: {
        in: ['PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED'],
      },
    },
  });

  if (existingBooking) {
    throw new AppError(
      'A booking with this email already exists. Please check your email for verification or contact us.',
      400
    );
  }

  // Generate verification token
  const verificationToken = generateSecureToken();

  // Clean and sanitize input fields
  const cleanedData = {
    ...bookingData,
    // Sanitize names
    studentFirstName: sanitizeName(data.studentFirstName),
    studentLastName: sanitizeName(data.studentLastName),
    contact1Name: sanitizeName(data.contact1Name),
    contact1Email: data.contact1Email.toLowerCase().trim(),
    contact1Phone: sanitizePhone(data.contact1Phone),
    contact1Relationship: sanitizeName(data.contact1Relationship),
    // Optional contact 2
    contact2Name: data.contact2Name ? sanitizeName(data.contact2Name) : null,
    contact2Email: data.contact2Email?.toLowerCase().trim() || null,
    contact2Phone: data.contact2Phone ? sanitizePhone(data.contact2Phone) : null,
    contact2Relationship: data.contact2Relationship ? sanitizeName(data.contact2Relationship) : null,
    // Emergency contact
    emergencyName: sanitizeName(data.emergencyName),
    emergencyPhone: sanitizePhone(data.emergencyPhone),
    emergencyRelationship: sanitizeName(data.emergencyRelationship),
    // Other fields
    instrumentId: data.instrumentId || null,
    preferredDateTime: data.preferredDateTime
      ? new Date(data.preferredDateTime)
      : null,
    // Sanitize notes to prevent XSS
    additionalNotes: data.additionalNotes ? sanitizeNotes(data.additionalNotes) : null,
  };

  // Create booking record
  const meetAndGreet = await prisma.meetAndGreet.create({
    data: {
      schoolId,
      ...cleanedData,
      status: 'PENDING_VERIFICATION',
      verificationToken,
    },
  });

  log.info('Meet & Greet booking created', {
    id: meetAndGreet.id,
    schoolId,
    email: cleanedData.contact1Email,
  });

  // Send verification email
  const verificationUrl = `${config.frontendUrl}/meet-and-greet/verify/${verificationToken}`;

  try {
    await emailService.sendMeetAndGreetVerification(data.contact1Email, {
      parentName: data.contact1Name.split(' ')[0], // First name only
      childName: `${data.studentFirstName} ${data.studentLastName}`,
      preferredDateTime: data.preferredDateTime
        ? new Date(data.preferredDateTime).toLocaleString('en-AU', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'Australia/Sydney',
          })
        : 'To be confirmed',
      verificationUrl,
    });
    log.info('Verification email sent', { id: meetAndGreet.id });
  } catch (emailError) {
    // Log error but don't fail the booking
    log.error('Failed to send verification email', {
      id: meetAndGreet.id,
      email: data.contact1Email,
    }, emailError instanceof Error ? emailError : new Error(String(emailError)));
  }

  return {
    id: meetAndGreet.id,
    message:
      'Booking created! Please check your email to verify your booking.',
  };
}

// ===========================================
// VERIFY EMAIL (Public)
// ===========================================

/**
 * Verify email address for a meet & greet booking
 * Updates status from PENDING_VERIFICATION to PENDING_APPROVAL
 */
export async function verifyMeetAndGreetEmail(
  token: string
): Promise<MeetAndGreetWithRelations> {
  // Find by verification token
  const meetAndGreet = await prisma.meetAndGreet.findUnique({
    where: { verificationToken: token },
    include: {
      school: { select: { id: true, name: true, email: true } },
      instrument: { select: { id: true, name: true } },
    },
  });

  // Use generic message to prevent token enumeration
  if (!meetAndGreet) {
    throw new AppError('Invalid or expired verification link. Please request a new booking.', 400);
  }

  // Use generic message to prevent status enumeration
  if (meetAndGreet.status !== 'PENDING_VERIFICATION') {
    throw new AppError('This verification link has already been used or is no longer valid.', 400);
  }

  // Update status to pending approval
  const updated = await prisma.meetAndGreet.update({
    where: { id: meetAndGreet.id },
    data: {
      status: 'PENDING_APPROVAL',
      verifiedAt: new Date(),
      verificationToken: null, // Clear token after use
    },
    include: {
      school: { select: { id: true, name: true, email: true } },
      instrument: { select: { id: true, name: true } },
    },
  });

  // Send confirmation email to parent
  await emailService.sendMeetAndGreetConfirmation(meetAndGreet.contact1Email, {
    parentName: meetAndGreet.contact1Name.split(' ')[0],
    childName: `${meetAndGreet.studentFirstName} ${meetAndGreet.studentLastName}`,
    scheduledDateTime: meetAndGreet.preferredDateTime
      ? meetAndGreet.preferredDateTime.toLocaleString('en-AU', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Australia/Sydney',
        })
      : 'We will contact you to schedule',
    locationName: 'To be confirmed',
    teacherName: 'To be confirmed',
  });

  // Send notification to school admin
  if (meetAndGreet.school?.email) {
    await emailService.sendMeetAndGreetAdminNotification(
      meetAndGreet.school.email,
      {
        parentName: meetAndGreet.contact1Name,
        parentEmail: meetAndGreet.contact1Email,
        parentPhone: meetAndGreet.contact1Phone,
        childName: `${meetAndGreet.studentFirstName} ${meetAndGreet.studentLastName}`,
        childAge: meetAndGreet.studentAge,
        instrumentInterest: meetAndGreet.instrument?.name || 'Not specified',
        preferredDateTime: meetAndGreet.preferredDateTime
          ? meetAndGreet.preferredDateTime.toLocaleString('en-AU', {
              dateStyle: 'full',
              timeStyle: 'short',
              timeZone: 'Australia/Sydney',
            })
          : 'Flexible',
        dashboardUrl: `${config.frontendUrl}/admin/meet-and-greet`,
      }
    );
  }

  return updated;
}

// ===========================================
// GET ALL MEET & GREETS (Admin)
// ===========================================

/**
 * Get all meet & greet bookings for a school with optional filters
 * CRITICAL: Always filter by schoolId
 */
export async function getMeetAndGreets(
  schoolId: string,
  filters?: MeetAndGreetFilters
): Promise<MeetAndGreetWithRelations[]> {
  const where: Prisma.MeetAndGreetWhereInput = { schoolId }; // CRITICAL: Multi-tenancy filter

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    where.preferredDateTime = {};
    if (filters.startDate) where.preferredDateTime.gte = filters.startDate;
    if (filters.endDate) where.preferredDateTime.lte = filters.endDate;
  }

  if (filters?.teacherId) {
    where.assignedTeacherId = filters.teacherId;
  }

  return prisma.meetAndGreet.findMany({
    where,
    include: {
      instrument: { select: { id: true, name: true } },
      assignedTeacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ===========================================
// GET SINGLE MEET & GREET (Admin)
// ===========================================

/**
 * Get a single meet & greet by ID
 * CRITICAL: Always verify schoolId ownership
 */
export async function getMeetAndGreet(
  schoolId: string,
  id: string
): Promise<MeetAndGreetWithRelations | null> {
  return prisma.meetAndGreet.findFirst({
    where: {
      id,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      school: { select: { id: true, name: true, email: true } },
      instrument: { select: { id: true, name: true } },
      assignedTeacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });
}

// ===========================================
// UPDATE MEET & GREET (Admin)
// ===========================================

/**
 * Update a meet & greet booking (assign teacher, add notes, etc.)
 */
export async function updateMeetAndGreet(
  schoolId: string,
  id: string,
  data: UpdateMeetAndGreetInput
): Promise<MeetAndGreetWithRelations> {
  // Verify it belongs to school
  const existing = await prisma.meetAndGreet.findFirst({
    where: { id, schoolId }, // CRITICAL: Multi-tenancy filter
  });

  if (!existing) {
    throw new AppError('Meet & greet not found.', 404);
  }

  // Sanitize notes fields
  const sanitizedData = {
    ...data,
    followUpNotes: data.followUpNotes ? sanitizeNotes(data.followUpNotes) : undefined,
    scheduledDateTime: data.scheduledDateTime
      ? new Date(data.scheduledDateTime)
      : undefined,
  };

  log.info('Updating Meet & Greet', { id, schoolId });

  return prisma.meetAndGreet.update({
    where: { id },
    data: sanitizedData,
    include: {
      instrument: { select: { id: true, name: true } },
      assignedTeacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });
}

// ===========================================
// APPROVE MEET & GREET (Admin)
// ===========================================

/**
 * Approve a meet & greet and send registration link to parent
 * Returns the registration URL for admin reference
 */
export async function approveMeetAndGreet(
  schoolId: string,
  id: string
): Promise<{ registrationUrl: string }> {
  // Verify it belongs to school
  const meetAndGreet = await prisma.meetAndGreet.findFirst({
    where: { id, schoolId }, // CRITICAL: Multi-tenancy filter
    include: {
      school: { select: { name: true } },
    },
  });

  if (!meetAndGreet) {
    throw new AppError('Meet & greet not found.', 404);
  }

  if (meetAndGreet.status !== 'PENDING_APPROVAL') {
    throw new AppError('Meet & greet must be pending approval.', 400);
  }

  // Generate registration token (expires in 7 days)
  const registrationToken = generateSecureToken();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  // Update status to approved and store registration token
  await prisma.meetAndGreet.update({
    where: { id },
    data: {
      status: 'APPROVED',
      registrationToken,
      registrationTokenExpiresAt: expiryDate,
    },
  });

  // Generate registration URL with token
  const registrationUrl = `${config.frontendUrl}/register?token=${registrationToken}&mag=${id}`;

  // Send approval email to primary contact
  await emailService.sendMeetAndGreetApproval(meetAndGreet.contact1Email, {
    parentName: meetAndGreet.contact1Name.split(' ')[0],
    childName: `${meetAndGreet.studentFirstName} ${meetAndGreet.studentLastName}`,
    registrationUrl,
    expiryDate: expiryDate.toLocaleDateString('en-AU', { dateStyle: 'long' }),
    schoolName: meetAndGreet.school?.name || "Music 'n Me",
  });

  // Also send to secondary contact if provided
  if (meetAndGreet.contact2Email) {
    await emailService.sendMeetAndGreetApproval(meetAndGreet.contact2Email, {
      parentName: meetAndGreet.contact2Name?.split(' ')[0] || 'Parent',
      childName: `${meetAndGreet.studentFirstName} ${meetAndGreet.studentLastName}`,
      registrationUrl,
      expiryDate: expiryDate.toLocaleDateString('en-AU', { dateStyle: 'long' }),
      schoolName: meetAndGreet.school?.name || "Music 'n Me",
    });
  }

  return { registrationUrl };
}

// ===========================================
// REJECT MEET & GREET (Admin)
// ===========================================

/**
 * Reject a meet & greet with a reason
 * Sends rejection email to parent
 */
export async function rejectMeetAndGreet(
  schoolId: string,
  id: string,
  reason: string
): Promise<MeetAndGreetWithRelations> {
  // Verify it belongs to school
  const existing = await prisma.meetAndGreet.findFirst({
    where: { id, schoolId }, // CRITICAL: Multi-tenancy filter
  });

  if (!existing) {
    throw new AppError('Meet & greet not found.', 404);
  }

  const updated = await prisma.meetAndGreet.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
    include: {
      instrument: { select: { id: true, name: true } },
      assignedTeacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  // Send rejection email
  await emailService.sendMeetAndGreetRejection(existing.contact1Email, {
    parentName: existing.contact1Name.split(' ')[0],
    childName: `${existing.studentFirstName} ${existing.studentLastName}`,
    reason,
  });

  return updated;
}

// ===========================================
// CANCEL MEET & GREET (Admin)
// ===========================================

/**
 * Cancel a meet & greet booking
 */
export async function cancelMeetAndGreet(
  schoolId: string,
  id: string
): Promise<void> {
  // Verify it belongs to school
  const existing = await prisma.meetAndGreet.findFirst({
    where: { id, schoolId }, // CRITICAL: Multi-tenancy filter
  });

  if (!existing) {
    throw new AppError('Meet & greet not found.', 404);
  }

  await prisma.meetAndGreet.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get meet & greet counts by status for dashboard
 */
export async function getMeetAndGreetCounts(
  schoolId: string
): Promise<Record<MeetAndGreetStatus, number>> {
  const counts = await prisma.meetAndGreet.groupBy({
    by: ['status'],
    where: { schoolId },
    _count: true,
  });

  // Initialize all statuses with 0
  const result: Record<string, number> = {
    PENDING_VERIFICATION: 0,
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    REJECTED: 0,
    CONVERTED: 0,
    CANCELLED: 0,
  };

  // Fill in actual counts
  for (const item of counts) {
    result[item.status] = item._count;
  }

  return result as Record<MeetAndGreetStatus, number>;
}
