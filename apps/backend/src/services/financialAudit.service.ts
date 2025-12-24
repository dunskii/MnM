// ===========================================
// Financial Audit Service
// ===========================================
// Logs all financial operations for audit trail
// CRITICAL: All queries MUST filter by schoolId for multi-tenancy

import { prisma } from '../config/database';
import { FinancialAuditAction, Prisma } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface AuditLogInput {
  schoolId: string;
  action: FinancialAuditAction;
  performedBy?: string;
  entityType: 'invoice' | 'payment' | 'pricing_package';
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  action?: FinancialAuditAction;
  entityType?: string;
  entityId?: string;
  performedBy?: string;
  startDate?: Date;
  endDate?: Date;
}

// ===========================================
// LOG AUDIT ENTRY
// ===========================================

/**
 * Log a financial audit entry
 * This is a fire-and-forget operation - failures are logged but don't block the main operation
 */
export async function logAuditEntry(input: AuditLogInput): Promise<void> {
  try {
    await prisma.financialAuditLog.create({
      data: {
        schoolId: input.schoolId,
        action: input.action,
        performedBy: input.performedBy,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details as Prisma.InputJsonValue || {},
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not block main operations
    console.error('Failed to log financial audit entry:', error);
  }
}

// ===========================================
// GET AUDIT LOGS
// ===========================================

/**
 * Get audit logs for a school with optional filters
 */
export async function getAuditLogs(
  schoolId: string,
  filters: AuditLogFilters = {},
  limit: number = 100,
  offset: number = 0
) {
  const where: Prisma.FinancialAuditLogWhereInput = {
    schoolId, // CRITICAL: Multi-tenancy filter
    ...(filters.action && { action: filters.action }),
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(filters.entityId && { entityId: filters.entityId }),
    ...(filters.performedBy && { performedBy: filters.performedBy }),
    ...(filters.startDate || filters.endDate
      ? {
          createdAt: {
            ...(filters.startDate && { gte: filters.startDate }),
            ...(filters.endDate && { lte: filters.endDate }),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.financialAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.financialAuditLog.count({ where }),
  ]);

  return { logs, total };
}

// ===========================================
// GET ENTITY AUDIT TRAIL
// ===========================================

/**
 * Get complete audit trail for a specific entity
 */
export async function getEntityAuditTrail(
  schoolId: string,
  entityType: string,
  entityId: string
) {
  return prisma.financialAuditLog.findMany({
    where: {
      schoolId, // CRITICAL: Multi-tenancy filter
      entityType,
      entityId,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ===========================================
// HELPER FUNCTIONS FOR COMMON AUDIT EVENTS
// ===========================================

export async function logInvoiceCreated(
  schoolId: string,
  invoiceId: string,
  performedBy: string,
  details: {
    invoiceNumber: string;
    familyId: string;
    total: number;
  },
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'INVOICE_CREATED',
    performedBy,
    entityType: 'invoice',
    entityId: invoiceId,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

export async function logInvoiceUpdated(
  schoolId: string,
  invoiceId: string,
  performedBy: string,
  details: {
    invoiceNumber: string;
    changes: Record<string, unknown>;
  },
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'INVOICE_UPDATED',
    performedBy,
    entityType: 'invoice',
    entityId: invoiceId,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

export async function logInvoiceDeleted(
  schoolId: string,
  invoiceId: string,
  performedBy: string,
  details: {
    invoiceNumber: string;
    reason?: string;
  },
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'INVOICE_DELETED',
    performedBy,
    entityType: 'invoice',
    entityId: invoiceId,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

export async function logInvoiceSent(
  schoolId: string,
  invoiceId: string,
  performedBy: string,
  details: {
    invoiceNumber: string;
    sentTo: string[];
  },
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'INVOICE_SENT',
    performedBy,
    entityType: 'invoice',
    entityId: invoiceId,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

export async function logInvoiceCancelled(
  schoolId: string,
  invoiceId: string,
  performedBy: string,
  details: {
    invoiceNumber: string;
    reason?: string;
  },
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'INVOICE_CANCELLED',
    performedBy,
    entityType: 'invoice',
    entityId: invoiceId,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

export async function logPaymentRecorded(
  schoolId: string,
  paymentId: string,
  performedBy: string,
  details: {
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    method: string;
    reference?: string;
  },
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'PAYMENT_RECORDED',
    performedBy,
    entityType: 'payment',
    entityId: paymentId,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

export async function logStripePayment(
  schoolId: string,
  paymentId: string,
  details: {
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    stripePaymentId: string;
  }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'PAYMENT_STRIPE',
    entityType: 'payment',
    entityId: paymentId,
    details,
  });
}

export async function logPricingPackageCreated(
  schoolId: string,
  packageId: string,
  performedBy: string,
  details: {
    name: string;
    price: number;
  },
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'PRICING_PACKAGE_CREATED',
    performedBy,
    entityType: 'pricing_package',
    entityId: packageId,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

export async function logPricingPackageUpdated(
  schoolId: string,
  packageId: string,
  performedBy: string,
  details: {
    name: string;
    changes: Record<string, unknown>;
  },
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'PRICING_PACKAGE_UPDATED',
    performedBy,
    entityType: 'pricing_package',
    entityId: packageId,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}

export async function logPricingPackageDeleted(
  schoolId: string,
  packageId: string,
  performedBy: string,
  details: {
    name: string;
  },
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  await logAuditEntry({
    schoolId,
    action: 'PRICING_PACKAGE_DELETED',
    performedBy,
    entityType: 'pricing_package',
    entityId: packageId,
    details,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
  });
}
