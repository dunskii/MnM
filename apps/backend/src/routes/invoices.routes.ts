// ===========================================
// Invoice Routes
// ===========================================
// Routes for invoice management and payments
// - Admins can CREATE/UPDATE/DELETE/SEND invoices
// - Parents can VIEW their invoices and make payments

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly, parentOnly } from '../middleware/authorize';
import { paymentRateLimiter } from '../middleware/rateLimiter';
import { prisma } from '../config/database';
import * as invoiceService from '../services/invoice.service';
import * as pricingPackageService from '../services/pricingPackage.service';
import * as stripeService from '../services/stripe.service';
import * as auditService from '../services/financialAudit.service';
import { getClientIP } from '../utils/request';
import {
  validateCreateInvoice,
  validateUpdateInvoice,
  validateInvoiceFilters,
  validateRecordPayment,
  validateGenerateTermInvoice,
  validateStripeCheckout,
  validateCancelInvoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFiltersInput,
  RecordPaymentInput,
  GenerateTermInvoiceInput,
  CreateStripeCheckoutInput,
} from '../validators/invoice.validators';
import {
  validateCreatePricingPackage,
  validateUpdatePricingPackage,
  validateGetPricingPackagesQuery,
  CreatePricingPackageInput,
  UpdatePricingPackageInput,
} from '../validators/pricingPackage.validators';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// ADMIN - PRICING PACKAGES
// ===========================================

/**
 * GET /invoices/admin/pricing-packages
 * Get all pricing packages
 * Access: Admin only
 */
router.get(
  '/admin/pricing-packages',
  adminOnly,
  validateGetPricingPackagesQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const packages = await pricingPackageService.getPricingPackages(
        req.user!.schoolId,
        includeInactive
      );
      res.json({ status: 'success', data: packages });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /invoices/admin/pricing-packages/:id
 * Get a single pricing package
 * Access: Admin only
 */
router.get(
  '/admin/pricing-packages/:id',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pricingPackage = await pricingPackageService.getPricingPackage(
        req.user!.schoolId,
        req.params.id
      );
      if (!pricingPackage) {
        res.status(404).json({
          status: 'error',
          message: 'Pricing package not found',
        });
        return;
      }
      res.json({ status: 'success', data: pricingPackage });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /invoices/admin/pricing-packages
 * Create a new pricing package
 * Access: Admin only
 */
router.post(
  '/admin/pricing-packages',
  adminOnly,
  validateCreatePricingPackage,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pricingPackage = await pricingPackageService.createPricingPackage(
        req.user!.schoolId,
        req.body as CreatePricingPackageInput
      );

      // Audit log
      await auditService.logPricingPackageCreated(
        req.user!.schoolId,
        pricingPackage.id,
        req.user!.userId,
        {
          name: pricingPackage.name,
          price: Number(pricingPackage.price),
        },
        { ip: getClientIP(req), userAgent: req.get('User-Agent') }
      );

      res.status(201).json({ status: 'success', data: pricingPackage });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /invoices/admin/pricing-packages/:id
 * Update a pricing package
 * Access: Admin only
 */
router.patch(
  '/admin/pricing-packages/:id',
  adminOnly,
  validateUpdatePricingPackage,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pricingPackage = await pricingPackageService.updatePricingPackage(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdatePricingPackageInput
      );

      // Audit log
      await auditService.logPricingPackageUpdated(
        req.user!.schoolId,
        pricingPackage.id,
        req.user!.userId,
        {
          name: pricingPackage.name,
          changes: req.body,
        },
        { ip: getClientIP(req), userAgent: req.get('User-Agent') }
      );

      res.json({ status: 'success', data: pricingPackage });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /invoices/admin/pricing-packages/:id
 * Delete a pricing package
 * Access: Admin only
 */
router.delete(
  '/admin/pricing-packages/:id',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get package details before deletion for audit log
      const pricingPackage = await pricingPackageService.getPricingPackage(
        req.user!.schoolId,
        req.params.id
      );

      await pricingPackageService.deletePricingPackage(
        req.user!.schoolId,
        req.params.id
      );

      // Audit log
      if (pricingPackage) {
        await auditService.logPricingPackageDeleted(
          req.user!.schoolId,
          req.params.id,
          req.user!.userId,
          { name: pricingPackage.name },
          { ip: getClientIP(req), userAgent: req.get('User-Agent') }
        );
      }

      res.json({ status: 'success', message: 'Pricing package deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// ADMIN - INVOICE MANAGEMENT
// ===========================================

/**
 * GET /invoices/admin/invoices
 * Get all invoices with optional filters
 * Access: Admin only
 */
router.get(
  '/admin/invoices',
  adminOnly,
  validateInvoiceFilters,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as InvoiceFiltersInput;
      const invoices = await invoiceService.getInvoices(
        req.user!.schoolId,
        filters
      );
      res.json({ status: 'success', data: invoices });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /invoices/admin/invoices/statistics
 * Get invoice statistics for dashboard
 * Access: Admin only
 */
router.get(
  '/admin/invoices/statistics',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statistics = await invoiceService.getInvoiceStatistics(
        req.user!.schoolId
      );
      res.json({ status: 'success', data: statistics });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /invoices/admin/invoices/:id
 * Get a single invoice with details
 * Access: Admin only
 */
router.get(
  '/admin/invoices/:id',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await invoiceService.getInvoice(
        req.user!.schoolId,
        req.params.id
      );
      if (!invoice) {
        res.status(404).json({
          status: 'error',
          message: 'Invoice not found',
        });
        return;
      }
      res.json({ status: 'success', data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /invoices/admin/invoices
 * Create a new invoice
 * Access: Admin only
 */
router.post(
  '/admin/invoices',
  adminOnly,
  validateCreateInvoice,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await invoiceService.createInvoice(
        req.user!.schoolId,
        req.body as CreateInvoiceInput
      );

      // Audit log
      await auditService.logInvoiceCreated(
        req.user!.schoolId,
        invoice.id,
        req.user!.userId,
        {
          invoiceNumber: invoice.invoiceNumber,
          familyId: invoice.familyId,
          total: Number(invoice.total),
        },
        { ip: getClientIP(req), userAgent: req.get('User-Agent') }
      );

      res.status(201).json({ status: 'success', data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /invoices/admin/invoices/generate
 * Generate term invoices for families
 * Access: Admin only
 */
router.post(
  '/admin/invoices/generate',
  adminOnly,
  validateGenerateTermInvoice,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as GenerateTermInvoiceInput;
      const result = await invoiceService.generateBulkTermInvoices(
        req.user!.schoolId,
        {
          termId: input.termId,
          familyIds: input.familyIds,
          dueDate: input.dueDate ? new Date(input.dueDate as string) : undefined,
          groupRate: input.groupRate,
          individualRate: input.individualRate,
          standardLessonRate: input.standardLessonRate,
        }
      );
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /invoices/admin/invoices/:id
 * Update an invoice (only DRAFT invoices)
 * Access: Admin only
 */
router.patch(
  '/admin/invoices/:id',
  adminOnly,
  validateUpdateInvoice,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await invoiceService.updateInvoice(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateInvoiceInput
      );

      // Audit log
      await auditService.logInvoiceUpdated(
        req.user!.schoolId,
        invoice.id,
        req.user!.userId,
        {
          invoiceNumber: invoice.invoiceNumber,
          changes: req.body,
        },
        { ip: getClientIP(req), userAgent: req.get('User-Agent') }
      );

      res.json({ status: 'success', data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /invoices/admin/invoices/:id
 * Delete an invoice (only DRAFT invoices)
 * Access: Admin only
 */
router.delete(
  '/admin/invoices/:id',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get invoice details before deletion for audit log
      const invoice = await invoiceService.getInvoice(req.user!.schoolId, req.params.id);

      await invoiceService.deleteInvoice(req.user!.schoolId, req.params.id);

      // Audit log
      if (invoice) {
        await auditService.logInvoiceDeleted(
          req.user!.schoolId,
          req.params.id,
          req.user!.userId,
          { invoiceNumber: invoice.invoiceNumber },
          { ip: getClientIP(req), userAgent: req.get('User-Agent') }
        );
      }

      res.json({ status: 'success', message: 'Invoice deleted' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /invoices/admin/invoices/:id/send
 * Send invoice to family (changes status to SENT)
 * Access: Admin only
 */
router.post(
  '/admin/invoices/:id/send',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await invoiceService.sendInvoice(
        req.user!.schoolId,
        req.params.id
      );

      // Audit log
      const sentTo = invoice.family.parents.map((p) => p.contact1Email);
      await auditService.logInvoiceSent(
        req.user!.schoolId,
        invoice.id,
        req.user!.userId,
        {
          invoiceNumber: invoice.invoiceNumber,
          sentTo,
        },
        { ip: getClientIP(req), userAgent: req.get('User-Agent') }
      );

      res.json({ status: 'success', data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /invoices/admin/invoices/:id/cancel
 * Cancel an invoice
 * Access: Admin only
 */
router.post(
  '/admin/invoices/:id/cancel',
  adminOnly,
  validateCancelInvoice,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await invoiceService.cancelInvoice(
        req.user!.schoolId,
        req.params.id,
        req.body.reason
      );

      // Audit log
      await auditService.logInvoiceCancelled(
        req.user!.schoolId,
        invoice.id,
        req.user!.userId,
        {
          invoiceNumber: invoice.invoiceNumber,
          reason: req.body.reason,
        },
        { ip: getClientIP(req), userAgent: req.get('User-Agent') }
      );

      res.json({ status: 'success', data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /invoices/admin/invoices/:id/payment
 * Record a manual payment
 * Access: Admin only
 * Rate limited: 10 requests per minute per IP
 */
router.post(
  '/admin/invoices/:id/payment',
  adminOnly,
  paymentRateLimiter,
  validateRecordPayment,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await invoiceService.recordManualPayment(
        req.user!.schoolId,
        req.params.id,
        req.body as RecordPaymentInput
      );

      // Audit log
      await auditService.logPaymentRecorded(
        req.user!.schoolId,
        result.payment.id,
        req.user!.userId,
        {
          invoiceId: req.params.id,
          invoiceNumber: result.invoiceNumber,
          amount: Number(result.payment.amount),
          method: result.payment.method,
          reference: result.payment.reference || undefined,
        },
        { ip: getClientIP(req), userAgent: req.get('User-Agent') }
      );

      // Return the invoice (without the payment property used for audit)
      const { payment: _, ...invoice } = result;
      res.status(200).json({ status: 'success', data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// PARENT - INVOICE VIEWING & PAYMENT
// ===========================================

/**
 * GET /invoices/parent/invoices
 * Get all invoices for the parent's family
 * Access: Parent only
 */
router.get(
  '/parent/invoices',
  parentOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent's family ID
      const parent = await prisma.parent.findFirst({
        where: {
          userId: req.user!.userId,
          schoolId: req.user!.schoolId,
        },
        select: { familyId: true },
      });

      if (!parent?.familyId) {
        res.json({ status: 'success', data: [] });
        return;
      }

      const invoices = await invoiceService.getFamilyInvoices(
        req.user!.schoolId,
        parent.familyId
      );
      res.json({ status: 'success', data: invoices });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /invoices/parent/invoices/:id
 * Get a single invoice (must belong to parent's family)
 * Access: Parent only
 */
router.get(
  '/parent/invoices/:id',
  parentOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent's family ID
      const parent = await prisma.parent.findFirst({
        where: {
          userId: req.user!.userId,
          schoolId: req.user!.schoolId,
        },
        select: { familyId: true },
      });

      if (!parent?.familyId) {
        throw new AppError('Parent profile not found', 404);
      }

      const invoice = await invoiceService.getInvoice(
        req.user!.schoolId,
        req.params.id
      );

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      // Verify invoice belongs to parent's family
      if (invoice.family.id !== parent.familyId) {
        throw new AppError('Invoice not found', 404);
      }

      // Don't show DRAFT invoices to parents
      if (invoice.status === 'DRAFT') {
        throw new AppError('Invoice not found', 404);
      }

      res.json({ status: 'success', data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /invoices/parent/invoices/:id/pay
 * Create a Stripe checkout session for invoice payment
 * Access: Parent only
 * Rate limited: 10 requests per minute per IP
 */
router.post(
  '/parent/invoices/:id/pay',
  parentOnly,
  paymentRateLimiter,
  validateStripeCheckout,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent with family
      const parent = await prisma.parent.findFirst({
        where: {
          userId: req.user!.userId,
          schoolId: req.user!.schoolId,
        },
        select: {
          id: true,
          familyId: true,
          contact1Email: true,
          contact1Name: true,
        },
      });

      if (!parent?.familyId) {
        throw new AppError('Parent profile not found', 404);
      }

      // Get invoice
      const invoice = await invoiceService.getInvoice(
        req.user!.schoolId,
        req.params.id
      );

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      // Verify invoice belongs to parent's family
      if (invoice.family.id !== parent.familyId) {
        throw new AppError('Invoice not found', 404);
      }

      // Check if invoice can be paid
      if (invoice.status === 'DRAFT') {
        throw new AppError('Invoice has not been sent yet', 400);
      }
      if (invoice.status === 'PAID') {
        throw new AppError('Invoice is already paid', 400);
      }
      if (invoice.status === 'CANCELLED') {
        throw new AppError('Invoice has been cancelled', 400);
      }

      // Calculate remaining amount
      const remaining = Number(invoice.total) - Number(invoice.amountPaid);

      if (remaining <= 0) {
        throw new AppError('No balance remaining on this invoice', 400);
      }

      // Create Stripe checkout session
      const input = req.body as CreateStripeCheckoutInput;
      const session = await stripeService.createInvoiceCheckoutSession({
        invoiceId: invoice.id,
        schoolId: req.user!.schoolId,
        amount: Math.round(remaining * 100), // Convert to cents
        description: `Invoice ${invoice.invoiceNumber}`,
        customerEmail: parent.contact1Email,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      });

      res.json({ status: 'success', data: session });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /invoices/parent/payments
 * Get payment history for the parent's family
 * Access: Parent only
 */
router.get(
  '/parent/payments',
  parentOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent's family ID
      const parent = await prisma.parent.findFirst({
        where: {
          userId: req.user!.userId,
          schoolId: req.user!.schoolId,
        },
        select: { familyId: true },
      });

      if (!parent?.familyId) {
        res.json({ status: 'success', data: [] });
        return;
      }

      // Get all payments for family's invoices
      const payments = await prisma.payment.findMany({
        where: {
          invoice: {
            schoolId: req.user!.schoolId,
            familyId: parent.familyId,
          },
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              description: true,
            },
          },
        },
        orderBy: { paidAt: 'desc' },
      });

      res.json({ status: 'success', data: payments });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
