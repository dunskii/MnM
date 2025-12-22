// ===========================================
// Registration Service
// ===========================================
// Handles converting Meet & Greet to family accounts after payment

import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { hashPassword, generateTemporaryPassword } from '../utils/password';
import { sendWelcomeEmail } from './email.service';

// ===========================================
// TYPES
// ===========================================

interface RegistrationData {
  meetAndGreetId: string;
  stripeSessionId: string;
}

interface RegistrationResult {
  familyId: string;
  parentUserId: string;
  studentId: string;
  temporaryPassword: string;
}

// ===========================================
// SERVICE FUNCTIONS
// ===========================================

/**
 * Complete registration after payment
 * Creates family, parent user, and student from Meet & Greet data
 */
export async function completeRegistration(
  data: RegistrationData
): Promise<RegistrationResult> {
  const { meetAndGreetId, stripeSessionId } = data;

  // Get the meet & greet with payment verification
  const meetAndGreet = await prisma.meetAndGreet.findFirst({
    where: {
      id: meetAndGreetId,
      status: 'APPROVED',
    },
    include: {
      school: true,
      instrument: true,
      registrationPayments: {
        where: {
          stripeSessionId,
          status: 'COMPLETED',
        },
      },
    },
  });

  if (!meetAndGreet) {
    throw new AppError('Meet & greet not found or not approved', 404);
  }

  if (meetAndGreet.registrationPayments.length === 0) {
    throw new AppError('Payment not found or not completed', 400);
  }

  // Check if already converted
  if (meetAndGreet.convertedFamilyId) {
    throw new AppError('Registration already completed', 400);
  }

  const schoolId = meetAndGreet.schoolId;

  // Check for existing user with same email
  const existingUser = await prisma.user.findFirst({
    where: {
      schoolId,
      email: meetAndGreet.contact1Email,
    },
  });

  if (existingUser) {
    throw new AppError('A user with this email already exists', 400);
  }

  // Generate temporary password
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  // Determine age group based on student age
  const ageGroup = determineAgeGroup(meetAndGreet.studentAge);

  // Create everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the family
    const family = await tx.family.create({
      data: {
        schoolId,
        name: `${meetAndGreet.contact1Name} Family`,
      },
    });

    // 2. Create the parent user
    const parentUser = await tx.user.create({
      data: {
        schoolId,
        email: meetAndGreet.contact1Email,
        passwordHash,
        firstName: meetAndGreet.contact1Name.split(' ')[0],
        lastName: meetAndGreet.contact1Name.split(' ').slice(1).join(' ') || '',
        phone: meetAndGreet.contact1Phone,
        role: 'PARENT',
        isActive: true,
      },
    });

    // 3. Create the parent record with all contact info
    const parent = await tx.parent.create({
      data: {
        schoolId,
        userId: parentUser.id,
        familyId: family.id,
        isPrimary: true,
        // Contact 1 (Primary)
        contact1Name: meetAndGreet.contact1Name,
        contact1Email: meetAndGreet.contact1Email,
        contact1Phone: meetAndGreet.contact1Phone,
        contact1Relationship: meetAndGreet.contact1Relationship,
        // Contact 2 (Secondary)
        contact2Name: meetAndGreet.contact2Name,
        contact2Email: meetAndGreet.contact2Email,
        contact2Phone: meetAndGreet.contact2Phone,
        contact2Relationship: meetAndGreet.contact2Relationship,
        // Emergency Contact
        emergencyName: meetAndGreet.emergencyName,
        emergencyPhone: meetAndGreet.emergencyPhone,
        emergencyRelationship: meetAndGreet.emergencyRelationship,
      },
    });

    // 4. Create the student
    const student = await tx.student.create({
      data: {
        schoolId,
        familyId: family.id,
        firstName: meetAndGreet.studentFirstName,
        lastName: meetAndGreet.studentLastName,
        birthDate: calculateDateOfBirth(meetAndGreet.studentAge),
        ageGroup,
        isActive: true,
        notes: meetAndGreet.additionalNotes || undefined,
      },
    });

    // 5. Update family with primary parent
    await tx.family.update({
      where: { id: family.id },
      data: { primaryParentId: parent.id },
    });

    // 6. Update meet & greet status
    await tx.meetAndGreet.update({
      where: { id: meetAndGreetId },
      data: {
        status: 'CONVERTED',
        convertedFamilyId: family.id,
      },
    });

    return {
      familyId: family.id,
      parentUserId: parentUser.id,
      parentId: parent.id,
      studentId: student.id,
    };
  });

  // Send welcome email with temporary password
  try {
    await sendWelcomeEmail(meetAndGreet.contact1Email, {
      parentName: meetAndGreet.contact1Name,
      email: meetAndGreet.contact1Email,
      tempPassword: temporaryPassword,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      schoolName: meetAndGreet.school.name,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't fail registration if email fails
  }

  return {
    familyId: result.familyId,
    parentUserId: result.parentUserId,
    studentId: result.studentId,
    temporaryPassword,
  };
}

/**
 * Get registration status for a Meet & Greet
 */
export async function getRegistrationStatus(
  meetAndGreetId: string,
  schoolId: string
): Promise<{
  status: string;
  paymentCompleted: boolean;
  registrationCompleted: boolean;
}> {
  const meetAndGreet = await prisma.meetAndGreet.findFirst({
    where: {
      id: meetAndGreetId,
      schoolId,
    },
    include: {
      registrationPayments: {
        where: { status: 'COMPLETED' },
      },
    },
  });

  if (!meetAndGreet) {
    throw new AppError('Meet & greet not found', 404);
  }

  return {
    status: meetAndGreet.status,
    paymentCompleted: meetAndGreet.registrationPayments.length > 0,
    registrationCompleted: meetAndGreet.status === 'CONVERTED',
  };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Calculate approximate date of birth from age
 */
function calculateDateOfBirth(age: number): Date {
  const now = new Date();
  const yearOfBirth = now.getFullYear() - age;
  return new Date(yearOfBirth, 0, 1); // January 1st of that year
}

/**
 * Determine age group based on age
 */
function determineAgeGroup(age: number): 'PRESCHOOL' | 'KIDS' | 'TEENS' | 'ADULT' {
  if (age < 6) return 'PRESCHOOL';
  if (age < 13) return 'KIDS';
  if (age < 18) return 'TEENS';
  return 'ADULT';
}

// Export as service object
export const registrationService = {
  completeRegistration,
  getRegistrationStatus,
};
