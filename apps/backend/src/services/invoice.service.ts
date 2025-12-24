// ===========================================
// Invoice Service
// ===========================================
// Manages invoices, payments, and billing calculations
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  Prisma,
} from '@prisma/client';
import * as emailService from './email.service';

// ===========================================
// TYPES
// ===========================================

export interface InvoiceWithDetails extends Invoice {
  family: {
    id: string;
    name: string;
    parents: Array<{
      id: string;
      contact1Name: string;
      contact1Email: string;
      contact1Phone: string | null;
    }>;
    students: Array<{
      id: string;
      firstName: string;
      lastName: string;
    }>;
  };
  term: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  } | null;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceFilters {
  familyId?: string;
  termId?: string;
  status?: InvoiceStatus;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  pricingPackageId?: string;
}

export interface CreateInvoiceInput {
  familyId: string;
  termId?: string;
  description?: string;
  dueDate: Date | string;
  items: CreateInvoiceItemInput[];
}

export interface UpdateInvoiceInput {
  description?: string | null;
  dueDate?: Date | string;
  items?: CreateInvoiceItemInput[];
}

export interface RecordPaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface HybridBillingResult {
  groupWeeksCount: number;
  individualWeeksCount: number;
  groupWeeksPrice: number;
  individualWeeksPrice: number;
  totalPrice: number;
  lineItems: CreateInvoiceItemInput[];
}

export interface GenerateInvoiceOptions {
  termId: string;
  familyIds?: string[];
  dueDate?: Date;
  groupRate?: number;
  individualRate?: number;
  standardLessonRate?: number;
}

// ===========================================
// INCLUDE DEFINITIONS
// ===========================================

const invoiceInclude = {
  family: {
    include: {
      parents: {
        select: {
          id: true,
          contact1Name: true,
          contact1Email: true,
          contact1Phone: true,
        },
      },
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  term: {
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  },
  items: true,
  payments: {
    orderBy: { paidAt: 'desc' as const },
  },
};

// ===========================================
// INVOICE NUMBER GENERATION
// ===========================================

/**
 * Generate a unique invoice number for a school
 * Format: INV-YYYY-NNNNN (e.g., INV-2025-00001)
 */
async function generateInvoiceNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Find the highest invoice number for this school and year
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      schoolId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(5, '0')}`;
}

// ===========================================
// GET INVOICES
// ===========================================

export async function getInvoices(
  schoolId: string,
  filters: InvoiceFilters = {}
): Promise<InvoiceWithDetails[]> {
  const where: Prisma.InvoiceWhereInput = {
    schoolId, // CRITICAL: Multi-tenancy filter
    ...(filters.familyId && { familyId: filters.familyId }),
    ...(filters.termId && { termId: filters.termId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.dueDateFrom || filters.dueDateTo
      ? {
          dueDate: {
            ...(filters.dueDateFrom && { gte: new Date(filters.dueDateFrom) }),
            ...(filters.dueDateTo && { lte: new Date(filters.dueDateTo) }),
          },
        }
      : {}),
  };

  const invoices = await prisma.invoice.findMany({
    where,
    include: invoiceInclude,
    orderBy: { createdAt: 'desc' },
  });

  return invoices as unknown as InvoiceWithDetails[];
}

// ===========================================
// GET SINGLE INVOICE
// ===========================================

export async function getInvoice(
  schoolId: string,
  invoiceId: string
): Promise<InvoiceWithDetails | null> {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: invoiceInclude,
  });

  return invoice as unknown as InvoiceWithDetails | null;
}

// ===========================================
// GET FAMILY INVOICES (FOR PARENTS)
// ===========================================

export async function getFamilyInvoices(
  schoolId: string,
  familyId: string
): Promise<InvoiceWithDetails[]> {
  const invoices = await prisma.invoice.findMany({
    where: {
      schoolId, // CRITICAL: Multi-tenancy filter
      familyId,
      status: { not: 'DRAFT' }, // Parents shouldn't see draft invoices
    },
    include: invoiceInclude,
    orderBy: { createdAt: 'desc' },
  });

  return invoices as unknown as InvoiceWithDetails[];
}

// ===========================================
// CREATE INVOICE
// ===========================================

export async function createInvoice(
  schoolId: string,
  input: CreateInvoiceInput
): Promise<InvoiceWithDetails> {
  // Verify family belongs to school
  const family = await prisma.family.findFirst({
    where: {
      id: input.familyId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!family) {
    throw new AppError('Family not found', 404);
  }

  // Verify term belongs to school (if provided)
  if (input.termId) {
    const term = await prisma.term.findFirst({
      where: {
        id: input.termId,
        schoolId, // CRITICAL: Multi-tenancy filter
      },
    });

    if (!term) {
      throw new AppError('Term not found', 404);
    }
  }

  // Calculate totals
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const tax = 0; // No GST on education services in Australia
  const total = subtotal + tax;

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(schoolId);

  // Create invoice with items
  const invoice = await prisma.invoice.create({
    data: {
      schoolId,
      familyId: input.familyId,
      termId: input.termId,
      invoiceNumber,
      description: input.description,
      subtotal,
      tax,
      total,
      dueDate: new Date(input.dueDate),
      items: {
        create: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          pricingPackageId: item.pricingPackageId,
        })),
      },
    },
    include: invoiceInclude,
  });

  return invoice as unknown as InvoiceWithDetails;
}

// ===========================================
// UPDATE INVOICE
// ===========================================

export async function updateInvoice(
  schoolId: string,
  invoiceId: string,
  input: UpdateInvoiceInput
): Promise<InvoiceWithDetails> {
  // Verify invoice belongs to school
  const existing = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  // Can only update DRAFT invoices
  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only update draft invoices', 400);
  }

  // If updating items, recalculate totals
  let updateData: Prisma.InvoiceUpdateInput = {};

  if (input.description !== undefined) {
    updateData.description = input.description;
  }

  if (input.dueDate) {
    updateData.dueDate = new Date(input.dueDate);
  }

  if (input.items) {
    const subtotal = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const tax = 0;
    const total = subtotal + tax;

    // Delete existing items and create new ones
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });

    updateData = {
      ...updateData,
      subtotal,
      tax,
      total,
      items: {
        create: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          pricingPackageId: item.pricingPackageId,
        })),
      },
    };
  }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
    include: invoiceInclude,
  });

  return invoice as unknown as InvoiceWithDetails;
}

// ===========================================
// DELETE INVOICE
// ===========================================

export async function deleteInvoice(
  schoolId: string,
  invoiceId: string
): Promise<void> {
  // Verify invoice belongs to school
  const existing = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: { payments: true },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  // Can only delete DRAFT invoices with no payments
  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only delete draft invoices', 400);
  }

  if (existing.payments.length > 0) {
    throw new AppError('Cannot delete invoice with payments', 400);
  }

  await prisma.invoice.delete({
    where: { id: invoiceId },
  });
}

// ===========================================
// SEND INVOICE
// ===========================================

export async function sendInvoice(
  schoolId: string,
  invoiceId: string
): Promise<InvoiceWithDetails> {
  // Verify invoice belongs to school
  const existing = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      ...invoiceInclude,
      school: { select: { name: true } },
    },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  // Can only send DRAFT invoices
  if (existing.status !== 'DRAFT') {
    throw new AppError('Invoice has already been sent', 400);
  }

  // Update status to SENT
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
    include: invoiceInclude,
  });

  // Send email notification to parents
  const typedExisting = existing as unknown as InvoiceWithDetails & {
    school: { name: string };
  };

  for (const parent of typedExisting.family.parents) {
    if (parent.contact1Email) {
      try {
        await emailService.sendInvoiceEmail(parent.contact1Email, {
          parentName: parent.contact1Name,
          schoolName: typedExisting.school.name,
          invoiceNumber: invoice.invoiceNumber,
          total: Number(invoice.total),
          dueDate: invoice.dueDate,
          description: invoice.description || `Invoice for ${typedExisting.family.name}`,
        });
      } catch (error) {
        console.error(`Failed to send invoice email to ${parent.contact1Email}:`, error);
      }
    }
  }

  return invoice as unknown as InvoiceWithDetails;
}

// ===========================================
// CANCEL INVOICE
// ===========================================

export async function cancelInvoice(
  schoolId: string,
  invoiceId: string,
  reason?: string
): Promise<InvoiceWithDetails> {
  // Verify invoice belongs to school
  const existing = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: { payments: true },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  // Cannot cancel already cancelled invoices
  if (existing.status === 'CANCELLED') {
    throw new AppError('Invoice is already cancelled', 400);
  }

  // Cannot cancel paid invoices
  if (existing.status === 'PAID') {
    throw new AppError('Cannot cancel a paid invoice', 400);
  }

  // If there are payments, need to issue refunds first
  if (existing.payments.length > 0 && Number(existing.amountPaid) > 0) {
    throw new AppError(
      'Cannot cancel invoice with payments. Issue refunds first.',
      400
    );
  }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'CANCELLED',
      description: reason
        ? `${existing.description || ''}\n\nCancellation reason: ${reason}`.trim()
        : existing.description,
    },
    include: invoiceInclude,
  });

  return invoice as unknown as InvoiceWithDetails;
}

// ===========================================
// RECORD MANUAL PAYMENT
// ===========================================

export async function recordManualPayment(
  schoolId: string,
  invoiceId: string,
  input: RecordPaymentInput
): Promise<InvoiceWithDetails & { payment: Payment }> {
  // Verify invoice belongs to school
  const existing = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      ...invoiceInclude,
      school: { select: { name: true } },
    },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  // Cannot add payments to cancelled or refunded invoices
  if (existing.status === 'CANCELLED' || existing.status === 'REFUNDED') {
    throw new AppError('Cannot add payments to cancelled or refunded invoices', 400);
  }

  // Check if payment would exceed total
  const currentPaid = Number(existing.amountPaid);
  const total = Number(existing.total);
  const remaining = total - currentPaid;

  if (input.amount > remaining + 0.01) {
    // Allow small rounding errors
    throw new AppError(
      `Payment amount ($${input.amount.toFixed(2)}) exceeds remaining balance ($${remaining.toFixed(2)})`,
      400
    );
  }

  // Create payment and update invoice in transaction
  const payment = await prisma.$transaction(async (tx) => {
    // Create payment record
    const newPayment = await tx.payment.create({
      data: {
        invoiceId,
        amount: input.amount,
        method: input.method,
        reference: input.reference,
        notes: input.notes,
        paidAt: new Date(),
      },
    });

    // Calculate new amount paid
    const newAmountPaid = currentPaid + input.amount;
    const isPaidInFull = newAmountPaid >= total - 0.01; // Allow small rounding errors

    // Update invoice
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: isPaidInFull ? 'PAID' : 'PARTIALLY_PAID',
        paidAt: isPaidInFull ? new Date() : null,
      },
    });

    return newPayment;
  });

  // Send payment receipt email
  const typedExisting = existing as unknown as InvoiceWithDetails & {
    school: { name: string };
  };

  for (const parent of typedExisting.family.parents) {
    if (parent.contact1Email) {
      try {
        await emailService.sendPaymentReceiptEmail(parent.contact1Email, {
          parentName: parent.contact1Name,
          schoolName: typedExisting.school.name,
          invoiceNumber: existing.invoiceNumber,
          amount: input.amount,
          paymentMethod: input.method,
          reference: input.reference,
          remainingBalance: Math.max(0, Number(existing.total) - currentPaid - input.amount),
        });
      } catch (error) {
        console.error(`Failed to send payment receipt to ${parent.contact1Email}:`, error);
      }
    }
  }

  // Fetch and return the updated invoice with all payments
  const updatedInvoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: invoiceInclude,
  });

  return {
    ...(updatedInvoice as unknown as InvoiceWithDetails),
    payment,
  };
}

// ===========================================
// RECORD STRIPE PAYMENT (Called by webhook)
// ===========================================

export async function recordStripePayment(
  invoiceId: string,
  amount: number,
  stripePaymentId: string
): Promise<Payment> {
  const existing = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  // Check if this payment was already recorded (idempotency)
  const existingPayment = await prisma.payment.findFirst({
    where: { stripePaymentId },
  });

  if (existingPayment) {
    return existingPayment;
  }

  // Create payment and update invoice in transaction
  const payment = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.payment.create({
      data: {
        invoiceId,
        amount,
        method: 'STRIPE',
        stripePaymentId,
        paidAt: new Date(),
      },
    });

    const currentPaid = Number(existing.amountPaid);
    const total = Number(existing.total);
    const newAmountPaid = currentPaid + amount;
    const isPaidInFull = newAmountPaid >= total - 0.01;

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: isPaidInFull ? 'PAID' : 'PARTIALLY_PAID',
        paidAt: isPaidInFull ? new Date() : null,
      },
    });

    return newPayment;
  });

  return payment;
}

// ===========================================
// HYBRID LESSON BILLING CALCULATION
// ===========================================

/**
 * Calculate billing for a hybrid lesson enrollment
 * Creates separate line items for group and individual weeks
 */
export async function calculateHybridLessonBilling(
  schoolId: string,
  lessonId: string,
  studentId: string,
  options: {
    groupRate?: number;
    individualRate?: number;
  } = {}
): Promise<HybridBillingResult> {
  // Get lesson with hybrid pattern
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      hybridPattern: true,
      lessonType: true,
      instrument: true,
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  if (!lesson.hybridPattern) {
    throw new AppError('Lesson is not a hybrid lesson', 400);
  }

  // Get student for line item descriptions
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!student) {
    throw new AppError('Student not found', 404);
  }

  // Parse week arrays from JSON
  const groupWeeks = lesson.hybridPattern.groupWeeks as number[];
  const individualWeeks = lesson.hybridPattern.individualWeeks as number[];

  // Default rates (can be configured per school in the future)
  const groupRate = options.groupRate ?? 25.0; // $25 per group session
  const individualRate = options.individualRate ?? 45.0; // $45 per individual session

  const groupWeeksCount = groupWeeks.length;
  const individualWeeksCount = individualWeeks.length;

  const groupWeeksPrice = groupWeeksCount * groupRate;
  const individualWeeksPrice = individualWeeksCount * individualRate;

  const studentName = `${student.firstName} ${student.lastName}`;

  const lineItems: CreateInvoiceItemInput[] = [];

  // Add group weeks line item
  if (groupWeeksCount > 0) {
    lineItems.push({
      description: `${studentName} - ${lesson.name} Group Sessions (${groupWeeksCount} weeks)`,
      quantity: groupWeeksCount,
      unitPrice: groupRate,
    });
  }

  // Add individual weeks line item
  if (individualWeeksCount > 0) {
    lineItems.push({
      description: `${studentName} - ${lesson.name} Individual Sessions (${individualWeeksCount} weeks)`,
      quantity: individualWeeksCount,
      unitPrice: individualRate,
    });
  }

  return {
    groupWeeksCount,
    individualWeeksCount,
    groupWeeksPrice,
    individualWeeksPrice,
    totalPrice: groupWeeksPrice + individualWeeksPrice,
    lineItems,
  };
}

// ===========================================
// GENERATE TERM INVOICE FOR A FAMILY
// ===========================================

export async function generateTermInvoice(
  schoolId: string,
  familyId: string,
  options: GenerateInvoiceOptions
): Promise<InvoiceWithDetails> {
  const { termId, dueDate, groupRate, individualRate, standardLessonRate } = options;

  // Verify term belongs to school
  const term = await prisma.term.findFirst({
    where: {
      id: termId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!term) {
    throw new AppError('Term not found', 404);
  }

  // Get family with students
  const family = await prisma.family.findFirst({
    where: {
      id: familyId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: { students: true },
  });

  if (!family) {
    throw new AppError('Family not found', 404);
  }

  // Check if invoice already exists for this family and term
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      schoolId,
      familyId,
      termId,
    },
  });

  if (existingInvoice) {
    throw new AppError(
      `Invoice already exists for ${family.name} for this term (${existingInvoice.invoiceNumber})`,
      409
    );
  }

  // Get all active enrollments for family students in this term
  const studentIds = family.students.map((s) => s.id);
  const enrollments = await prisma.lessonEnrollment.findMany({
    where: {
      studentId: { in: studentIds },
      isActive: true,
      lesson: {
        schoolId,
        termId,
      },
    },
    include: {
      lesson: {
        include: {
          lessonType: true,
          hybridPattern: true,
          instrument: true,
        },
      },
      student: true,
    },
  });

  if (enrollments.length === 0) {
    throw new AppError('No active enrollments found for this family and term', 400);
  }

  // Build line items for each enrollment
  const lineItems: CreateInvoiceItemInput[] = [];

  for (const enrollment of enrollments) {
    const lesson = enrollment.lesson;
    const student = enrollment.student;
    const studentName = `${student.firstName} ${student.lastName}`;

    if (lesson.hybridPattern) {
      // Calculate hybrid lesson billing
      const hybridBilling = await calculateHybridLessonBilling(
        schoolId,
        lesson.id,
        student.id,
        { groupRate, individualRate }
      );
      lineItems.push(...hybridBilling.lineItems);
    } else {
      // Standard lesson billing
      const termWeeks = 10; // Standard term length
      const rate = standardLessonRate ?? getDefaultLessonRate(lesson.lessonType.type, lesson.durationMins);

      lineItems.push({
        description: `${studentName} - ${lesson.name} (${termWeeks} weeks)`,
        quantity: termWeeks,
        unitPrice: rate,
      });
    }
  }

  // Create the invoice
  const defaultDueDate = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

  const invoice = await createInvoice(schoolId, {
    familyId,
    termId,
    description: `${term.name} - ${family.name}`,
    dueDate: defaultDueDate,
    items: lineItems,
  });

  return invoice;
}

// ===========================================
// GENERATE BULK TERM INVOICES
// ===========================================

export async function generateBulkTermInvoices(
  schoolId: string,
  options: GenerateInvoiceOptions
): Promise<{ created: InvoiceWithDetails[]; errors: Array<{ familyId: string; error: string }> }> {
  const { termId, familyIds } = options;

  // Verify term belongs to school
  const term = await prisma.term.findFirst({
    where: {
      id: termId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!term) {
    throw new AppError('Term not found', 404);
  }

  // If no family IDs provided, get all families with enrollments in this term
  let targetFamilyIds = familyIds;

  if (!targetFamilyIds || targetFamilyIds.length === 0) {
    const enrollments = await prisma.lessonEnrollment.findMany({
      where: {
        isActive: true,
        lesson: {
          schoolId,
          termId,
        },
      },
      include: {
        student: {
          select: { familyId: true },
        },
      },
      distinct: ['studentId'],
    });

    const familyIdSet = new Set<string>();
    for (const enrollment of enrollments) {
      if (enrollment.student.familyId) {
        familyIdSet.add(enrollment.student.familyId);
      }
    }
    targetFamilyIds = Array.from(familyIdSet);
  }

  const created: InvoiceWithDetails[] = [];
  const errors: Array<{ familyId: string; error: string }> = [];

  for (const familyId of targetFamilyIds) {
    try {
      const invoice = await generateTermInvoice(schoolId, familyId, options);
      created.push(invoice);
    } catch (error) {
      errors.push({
        familyId,
        error: error instanceof AppError ? error.message : 'Unknown error',
      });
    }
  }

  return { created, errors };
}

// ===========================================
// UPDATE OVERDUE INVOICES (CRON JOB)
// ===========================================

export async function updateOverdueInvoices(): Promise<number> {
  const now = new Date();

  const result = await prisma.invoice.updateMany({
    where: {
      status: 'SENT',
      dueDate: { lt: now },
    },
    data: {
      status: 'OVERDUE',
    },
  });

  return result.count;
}

// ===========================================
// GET INVOICE STATISTICS
// ===========================================

export async function getInvoiceStatistics(schoolId: string): Promise<{
  totalOutstanding: number;
  totalOverdue: number;
  invoicesByStatus: Record<InvoiceStatus, number>;
  recentPayments: Payment[];
}> {
  // Get invoice counts by status
  const statusCounts = await prisma.invoice.groupBy({
    by: ['status'],
    where: { schoolId },
    _count: { id: true },
  });

  const invoicesByStatus: Record<InvoiceStatus, number> = {
    DRAFT: 0,
    SENT: 0,
    PAID: 0,
    PARTIALLY_PAID: 0,
    OVERDUE: 0,
    CANCELLED: 0,
    REFUNDED: 0,
  };

  for (const item of statusCounts) {
    invoicesByStatus[item.status] = item._count.id;
  }

  // Calculate total outstanding (SENT + PARTIALLY_PAID + OVERDUE)
  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      schoolId,
      status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
    select: { total: true, amountPaid: true },
  });

  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)),
    0
  );

  // Calculate total overdue
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      schoolId,
      status: 'OVERDUE',
    },
    select: { total: true, amountPaid: true },
  });

  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)),
    0
  );

  // Get recent payments
  const recentPayments = await prisma.payment.findMany({
    where: {
      invoice: { schoolId },
    },
    orderBy: { paidAt: 'desc' },
    take: 10,
  });

  return {
    totalOutstanding,
    totalOverdue,
    invoicesByStatus,
    recentPayments,
  };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get default lesson rate based on type and duration
 */
function getDefaultLessonRate(lessonType: string, durationMins: number): number {
  // Default rates (can be configured per school in the future)
  const baseRates: Record<string, number> = {
    INDIVIDUAL: 50,
    GROUP: 30,
    BAND: 25,
    HYBRID: 35,
  };

  const baseRate = baseRates[lessonType] || 35;

  // Adjust for duration (base rates are for 45 min lessons)
  const durationMultiplier = durationMins / 45;

  return baseRate * durationMultiplier;
}
