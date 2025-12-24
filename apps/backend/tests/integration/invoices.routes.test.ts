// ===========================================
// Invoices Routes Integration Tests
// ===========================================

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Create test app without CSRF protection for integration tests
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Import individual route modules to avoid CSRF protection
  const authRoutes = require('../../src/routes/auth.routes').default;
  const invoicesRoutes = require('../../src/routes/invoices.routes').default;
  const { errorHandler } = require('../../src/middleware/errorHandler');
  const { notFound } = require('../../src/middleware/notFound');

  // Mount routes without CSRF
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/invoices', invoicesRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const prisma = new PrismaClient();

// Test data
const TEST_SCHOOL_1 = {
  name: 'Invoice Test School 1',
  slug: 'invoice-test-school-1',
  email: 'invoice-test1@testschool.com',
};

const TEST_SCHOOL_2 = {
  name: 'Invoice Test School 2',
  slug: 'invoice-test-school-2',
  email: 'invoice-test2@testschool.com',
};

const ADMIN_USER = {
  email: 'invoiceadmin@testschool.com',
  password: 'AdminPassword123!',
  firstName: 'Invoice',
  lastName: 'Admin',
};

const PARENT_USER = {
  email: 'invoiceparent@testschool.com',
  password: 'ParentPass123!',
  firstName: 'Invoice',
  lastName: 'Parent',
};

describe('Invoices Routes Integration Tests', () => {
  let school1Id: string;
  let school2Id: string;
  let admin1Token: string;
  let admin2Token: string;
  let parent1Token: string;
  let family1Id: string;
  let family2Id: string;
  let term1Id: string;
  let invoice1Id: string;

  const app = createTestApp();

  // Helper function to make authenticated requests
  const authRequest = (method: 'post' | 'patch' | 'delete', url: string, token: string) => {
    return request(app)[method](url).set('Authorization', `Bearer ${token}`);
  };

  const authGet = (url: string, token: string) => {
    return request(app).get(url).set('Authorization', `Bearer ${token}`);
  };

  beforeAll(async () => {
    // Clear any existing login attempts that might trigger rate limiting
    await prisma.loginAttempt.deleteMany({});

    // Create two schools
    const school1 = await prisma.school.create({ data: TEST_SCHOOL_1 });
    const school2 = await prisma.school.create({ data: TEST_SCHOOL_2 });
    school1Id = school1.id;
    school2Id = school2.id;

    // Create admin users for each school
    const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);

    await prisma.user.create({
      data: {
        schoolId: school1Id,
        email: ADMIN_USER.email,
        passwordHash,
        firstName: ADMIN_USER.firstName,
        lastName: ADMIN_USER.lastName,
        role: 'ADMIN',
        emailVerified: true,
        passwordHistory: JSON.stringify([passwordHash]),
      },
    });

    await prisma.user.create({
      data: {
        schoolId: school2Id,
        email: 'admin2@invoicetest.com',
        passwordHash,
        firstName: 'Admin2',
        lastName: 'User2',
        role: 'ADMIN',
        emailVerified: true,
        passwordHistory: JSON.stringify([passwordHash]),
      },
    });

    // Create terms
    const term1 = await prisma.term.create({
      data: {
        schoolId: school1Id,
        name: 'Invoice Test Term 1',
        startDate: new Date('2025-01-27'),
        endDate: new Date('2025-04-04'),
        isActive: true,
      },
    });
    term1Id = term1.id;

    // Create families
    const family1 = await prisma.family.create({
      data: {
        schoolId: school1Id,
        name: 'Test Invoice Family 1',
      },
    });
    family1Id = family1.id;

    const family2 = await prisma.family.create({
      data: {
        schoolId: school1Id,
        name: 'Test Invoice Family 2',
      },
    });
    family2Id = family2.id;

    // Create a family in school 2 for multi-tenancy tests
    await prisma.family.create({
      data: {
        schoolId: school2Id,
        name: 'School 2 Family',
      },
    });

    // Create parent user for school 1
    const parentPasswordHash = await bcrypt.hash(PARENT_USER.password, 10);
    const parentUser1 = await prisma.user.create({
      data: {
        schoolId: school1Id,
        email: PARENT_USER.email,
        passwordHash: parentPasswordHash,
        firstName: PARENT_USER.firstName,
        lastName: PARENT_USER.lastName,
        role: 'PARENT',
        emailVerified: true,
        passwordHistory: JSON.stringify([parentPasswordHash]),
      },
    });

    // Create parent record linked to family
    await prisma.parent.create({
      data: {
        schoolId: school1Id,
        userId: parentUser1.id,
        familyId: family1Id,
        contact1Name: 'Test Parent',
        contact1Email: PARENT_USER.email,
        contact1Phone: '0412345678',
        emergencyName: 'Emergency Contact',
        emergencyPhone: '0498765432',
        emergencyRelationship: 'Grandparent',
      },
    });

    // Login to get tokens
    const login1 = await request(app).post('/api/v1/auth/login').send({
      email: ADMIN_USER.email,
      password: ADMIN_USER.password,
      schoolSlug: TEST_SCHOOL_1.slug,
    });
    admin1Token = login1.body.data?.accessToken || '';

    const login2 = await request(app).post('/api/v1/auth/login').send({
      email: 'admin2@invoicetest.com',
      password: ADMIN_USER.password,
      schoolSlug: TEST_SCHOOL_2.slug,
    });
    admin2Token = login2.body.data?.accessToken || '';

    const loginParent = await request(app).post('/api/v1/auth/login').send({
      email: PARENT_USER.email,
      password: PARENT_USER.password,
      schoolSlug: TEST_SCHOOL_1.slug,
    });
    parent1Token = loginParent.body.data?.accessToken || '';
  });

  afterAll(async () => {
    // Clean up test data in correct order (respecting foreign keys)
    await prisma.financialAuditLog.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.payment.deleteMany({
      where: {
        invoice: {
          schoolId: { in: [school1Id, school2Id] },
        },
      },
    });
    await prisma.invoiceItem.deleteMany({
      where: {
        invoice: {
          schoolId: { in: [school1Id, school2Id] },
        },
      },
    });
    await prisma.invoice.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.pricingPackage.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.parent.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.student.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.family.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.term.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.refreshToken.deleteMany({
      where: {
        user: {
          schoolId: { in: [school1Id, school2Id] },
        },
      },
    });
    await prisma.loginAttempt.deleteMany({});
    await prisma.user.deleteMany({
      where: { schoolId: { in: [school1Id, school2Id] } },
    });
    await prisma.school.deleteMany({
      where: { id: { in: [school1Id, school2Id] } },
    });
    await prisma.$disconnect();
  });

  // ===========================================
  // ADMIN INVOICE CRUD TESTS
  // ===========================================

  describe('Admin Invoice CRUD', () => {
    describe('POST /api/v1/invoices/admin/invoices', () => {
      it('should create an invoice for the admin\'s school', async () => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const response = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
          familyId: family1Id,
          termId: term1Id,
          dueDate: dueDate.toISOString(),
          description: 'Test Invoice',
          items: [
            {
              description: 'Piano Lessons - Term 1',
              quantity: 10,
              unitPrice: 45,
            },
          ],
        });

        expect(response.status).toBe(201);
        expect(response.body.data.invoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/);
        expect(response.body.data.status).toBe('DRAFT');
        expect(response.body.data.familyId).toBe(family1Id);
        expect(response.body.data.items.length).toBe(1);
        expect(parseFloat(response.body.data.total)).toBe(450);
        invoice1Id = response.body.data.id;
      });

      it('should reject invoice creation without items', async () => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const response = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
          familyId: family1Id,
          dueDate: dueDate.toISOString(),
          items: [],
        });

        expect(response.status).toBe(400);
      });

      it('should require authentication', async () => {
        const response = await request(app).post('/api/v1/invoices/admin/invoices').send({
          familyId: family1Id,
          dueDate: new Date().toISOString(),
          items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
        });

        expect(response.status).toBe(401);
      });

      it('should require admin role', async () => {
        const response = await authRequest('post', '/api/v1/invoices/admin/invoices', parent1Token).send({
          familyId: family1Id,
          dueDate: new Date().toISOString(),
          items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
        });

        expect(response.status).toBe(403);
      });

      it('should reject invoice for family from different school (multi-tenancy)', async () => {
        const school2Family = await prisma.family.findFirst({
          where: { schoolId: school2Id },
        });

        const response = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
          familyId: school2Family?.id,
          dueDate: new Date().toISOString(),
          items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
        });

        // 404 is returned because family not found in admin's school scope
        expect([400, 404]).toContain(response.status);
      });
    });

    describe('GET /api/v1/invoices/admin/invoices', () => {
      it('should return invoices for the admin\'s school', async () => {
        const response = await authGet('/api/v1/invoices/admin/invoices', admin1Token);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        expect(response.body.data[0].schoolId).toBe(school1Id);
      });

      it('should return empty array for school without invoices', async () => {
        const response = await authGet('/api/v1/invoices/admin/invoices', admin2Token);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(0);
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/api/v1/invoices/admin/invoices')
          .query({ status: 'DRAFT' })
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response.status).toBe(200);
        response.body.data.forEach((invoice: { status: string }) => {
          expect(invoice.status).toBe('DRAFT');
        });
      });

      it('should filter by familyId', async () => {
        const response = await request(app)
          .get('/api/v1/invoices/admin/invoices')
          .query({ familyId: family1Id })
          .set('Authorization', `Bearer ${admin1Token}`);

        expect(response.status).toBe(200);
        response.body.data.forEach((invoice: { familyId: string }) => {
          expect(invoice.familyId).toBe(family1Id);
        });
      });

      it('should require admin role', async () => {
        const response = await authGet('/api/v1/invoices/admin/invoices', parent1Token);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/v1/invoices/admin/invoices/:id', () => {
      it('should return invoice for owner school', async () => {
        const response = await authGet(`/api/v1/invoices/admin/invoices/${invoice1Id}`, admin1Token);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(invoice1Id);
      });

      it('should return 404 for invoice from different school (multi-tenancy)', async () => {
        const response = await authGet(`/api/v1/invoices/admin/invoices/${invoice1Id}`, admin2Token);

        expect(response.status).toBe(404);
      });
    });

    describe('PATCH /api/v1/invoices/admin/invoices/:id', () => {
      it('should update draft invoice', async () => {
        const response = await authRequest('patch', `/api/v1/invoices/admin/invoices/${invoice1Id}`, admin1Token).send({
          description: 'Updated Invoice Description',
        });

        expect(response.status).toBe(200);
        expect(response.body.data.description).toBe('Updated Invoice Description');
      });

      it('should not update invoice from different school', async () => {
        const response = await authRequest('patch', `/api/v1/invoices/admin/invoices/${invoice1Id}`, admin2Token).send({
          description: 'Hacked Invoice',
        });

        expect(response.status).toBe(404);
      });
    });
  });

  // ===========================================
  // INVOICE WORKFLOW TESTS
  // ===========================================

  describe('Invoice Workflow', () => {
    describe('POST /api/v1/invoices/admin/invoices/:id/send', () => {
      it('should send a draft invoice', async () => {
        const response = await authRequest('post', `/api/v1/invoices/admin/invoices/${invoice1Id}/send`, admin1Token);

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('SENT');
        expect(response.body.data.sentAt).not.toBeNull();
      });

      it('should not send an already sent invoice', async () => {
        const response = await authRequest('post', `/api/v1/invoices/admin/invoices/${invoice1Id}/send`, admin1Token);

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/v1/invoices/admin/invoices/:id/payment', () => {
      it('should record a partial payment', async () => {
        const response = await authRequest(
          'post',
          `/api/v1/invoices/admin/invoices/${invoice1Id}/payment`,
          admin1Token
        ).send({
          amount: 100,
          method: 'BANK_TRANSFER',
          reference: 'TRF-001',
          notes: 'First payment',
        });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('PARTIALLY_PAID');
        expect(parseFloat(response.body.data.amountPaid)).toBe(100);
        expect(response.body.data.payments.length).toBe(1);
      });

      it('should record final payment and mark as paid', async () => {
        const response = await authRequest(
          'post',
          `/api/v1/invoices/admin/invoices/${invoice1Id}/payment`,
          admin1Token
        ).send({
          amount: 350,
          method: 'CASH',
          notes: 'Final payment',
        });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('PAID');
        expect(parseFloat(response.body.data.amountPaid)).toBe(450);
        expect(response.body.data.paidAt).not.toBeNull();
      });

      it('should reject overpayment', async () => {
        // Create a new invoice for this test
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const createRes = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
          familyId: family1Id,
          dueDate: dueDate.toISOString(),
          items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
        });

        await authRequest('post', `/api/v1/invoices/admin/invoices/${createRes.body.data.id}/send`, admin1Token);

        const response = await authRequest(
          'post',
          `/api/v1/invoices/admin/invoices/${createRes.body.data.id}/payment`,
          admin1Token
        ).send({
          amount: 150, // More than 100 total
          method: 'CASH',
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('exceeds');
      });
    });

    describe('POST /api/v1/invoices/admin/invoices/:id/cancel', () => {
      let invoiceToCancelId: string;

      beforeAll(async () => {
        // Create an invoice to cancel
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const createRes = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
          familyId: family2Id,
          dueDate: dueDate.toISOString(),
          items: [{ description: 'Cancel Test', quantity: 1, unitPrice: 100 }],
        });

        invoiceToCancelId = createRes.body.data.id;

        // Send it first
        await authRequest('post', `/api/v1/invoices/admin/invoices/${invoiceToCancelId}/send`, admin1Token);
      });

      it('should cancel an invoice', async () => {
        const response = await authRequest('post', `/api/v1/invoices/admin/invoices/${invoiceToCancelId}/cancel`, admin1Token).send({
          reason: 'Customer cancelled enrollment',
        });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('CANCELLED');
      });

      it('should not cancel an already cancelled invoice', async () => {
        const response = await authRequest('post', `/api/v1/invoices/admin/invoices/${invoiceToCancelId}/cancel`, admin1Token).send({
          reason: 'Trying again',
        });

        expect(response.status).toBe(400);
      });
    });
  });

  // ===========================================
  // INVOICE STATISTICS TESTS
  // ===========================================

  describe('Invoice Statistics', () => {
    describe('GET /api/v1/invoices/admin/invoices/statistics', () => {
      it('should return statistics for the school', async () => {
        const response = await authGet('/api/v1/invoices/admin/invoices/statistics', admin1Token);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('totalOutstanding');
        expect(response.body.data).toHaveProperty('totalOverdue');
        expect(response.body.data).toHaveProperty('invoicesByStatus');
        expect(response.body.data).toHaveProperty('recentPayments');
      });

      it('should require admin role', async () => {
        const response = await authGet('/api/v1/invoices/admin/invoices/statistics', parent1Token);

        expect(response.status).toBe(403);
      });
    });
  });

  // ===========================================
  // PARENT INVOICE TESTS
  // ===========================================

  describe('Parent Invoice Access', () => {
    let parentVisibleInvoiceId: string;

    beforeAll(async () => {
      // Create an invoice for the parent's family that is sent
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const createRes = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
        familyId: family1Id,
        dueDate: dueDate.toISOString(),
        description: 'Parent Visible Invoice',
        items: [{ description: 'Lesson Fee', quantity: 1, unitPrice: 200 }],
      });

      parentVisibleInvoiceId = createRes.body.data.id;

      // Send the invoice so parent can see it
      await authRequest('post', `/api/v1/invoices/admin/invoices/${parentVisibleInvoiceId}/send`, admin1Token);
    });

    describe('GET /api/v1/invoices/parent/invoices', () => {
      it('should return invoices for the parent\'s family', async () => {
        const response = await authGet('/api/v1/invoices/parent/invoices', parent1Token);

        expect(response.status).toBe(200);
        // Should only see sent/paid invoices for their family
        expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        response.body.data.forEach((invoice: { status: string; familyId: string }) => {
          expect(invoice.familyId).toBe(family1Id);
          expect(['SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE']).toContain(invoice.status);
        });
      });

      it('should require parent role', async () => {
        const response = await authGet('/api/v1/invoices/parent/invoices', admin1Token);

        // Admins cannot access parent-specific endpoints
        expect(response.status).toBe(403);
      });

      it('should not show draft invoices to parents', async () => {
        // Create a draft invoice
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
          familyId: family1Id,
          dueDate: dueDate.toISOString(),
          items: [{ description: 'Draft Test', quantity: 1, unitPrice: 50 }],
        });

        const response = await authGet('/api/v1/invoices/parent/invoices', parent1Token);

        expect(response.status).toBe(200);
        response.body.data.forEach((invoice: { status: string }) => {
          expect(invoice.status).not.toBe('DRAFT');
        });
      });
    });

    describe('GET /api/v1/invoices/parent/invoices/:id', () => {
      it('should return invoice details for parent\'s family', async () => {
        const response = await authGet(`/api/v1/invoices/parent/invoices/${parentVisibleInvoiceId}`, parent1Token);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(parentVisibleInvoiceId);
        expect(response.body.data.familyId).toBe(family1Id);
      });

      it('should not return invoice for different family (multi-tenancy)', async () => {
        // Create an invoice for family2
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const createRes = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
          familyId: family2Id,
          dueDate: dueDate.toISOString(),
          items: [{ description: 'Other Family', quantity: 1, unitPrice: 100 }],
        });

        await authRequest('post', `/api/v1/invoices/admin/invoices/${createRes.body.data.id}/send`, admin1Token);

        // Parent 1 should not see family 2's invoice
        const response = await authGet(`/api/v1/invoices/parent/invoices/${createRes.body.data.id}`, parent1Token);

        expect(response.status).toBe(404);
      });
    });

    describe('GET /api/v1/invoices/parent/payments', () => {
      it('should return payment history for parent\'s family', async () => {
        const response = await authGet('/api/v1/invoices/parent/payments', parent1Token);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });

  // ===========================================
  // MULTI-TENANCY SECURITY TESTS
  // ===========================================

  describe('Multi-tenancy Security', () => {
    it('should not allow admin to see invoices from other schools', async () => {
      const response = await authGet('/api/v1/invoices/admin/invoices', admin2Token);

      expect(response.status).toBe(200);
      // Admin 2 should see no invoices (all belong to school 1)
      expect(response.body.data.length).toBe(0);
    });

    it('should not allow admin to update invoices from other schools', async () => {
      const response = await authRequest('patch', `/api/v1/invoices/admin/invoices/${invoice1Id}`, admin2Token).send({
        description: 'Hacked by Admin 2',
      });

      expect(response.status).toBe(404);
    });

    it('should not allow admin to send invoices from other schools', async () => {
      // Create a new draft invoice in school 1
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const createRes = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
        familyId: family1Id,
        dueDate: dueDate.toISOString(),
        items: [{ description: 'Multi-tenant Test', quantity: 1, unitPrice: 100 }],
      });

      // Admin 2 tries to send it
      const response = await authRequest(
        'post',
        `/api/v1/invoices/admin/invoices/${createRes.body.data.id}/send`,
        admin2Token
      );

      expect(response.status).toBe(404);
    });

    it('should not allow admin to record payments for invoices from other schools', async () => {
      const response = await authRequest(
        'post',
        `/api/v1/invoices/admin/invoices/${invoice1Id}/payment`,
        admin2Token
      ).send({
        amount: 100,
        method: 'CASH',
      });

      expect(response.status).toBe(404);
    });

    it('should not allow admin to delete invoices from other schools', async () => {
      // Create a draft invoice in school 1
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const createRes = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
        familyId: family1Id,
        dueDate: dueDate.toISOString(),
        items: [{ description: 'Delete Test', quantity: 1, unitPrice: 100 }],
      });

      // Admin 2 tries to delete it
      const response = await authRequest(
        'delete',
        `/api/v1/invoices/admin/invoices/${createRes.body.data.id}`,
        admin2Token
      );

      expect(response.status).toBe(404);
    });
  });

  // ===========================================
  // PRICING PACKAGE TESTS
  // ===========================================

  describe('Pricing Packages', () => {
    let packageId: string;

    describe('POST /api/v1/invoices/admin/pricing-packages', () => {
      it('should create a pricing package', async () => {
        const response = await authRequest('post', '/api/v1/invoices/admin/pricing-packages', admin1Token).send({
          name: 'Standard Term Package',
          description: 'Standard pricing for a 10-week term',
          price: 450,
          items: [
            { type: 'lesson', name: 'Piano Lesson', quantity: 10 },
          ],
        });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('Standard Term Package');
        expect(parseFloat(response.body.data.price)).toBe(450);
        packageId = response.body.data.id;
      });
    });

    describe('GET /api/v1/invoices/admin/pricing-packages', () => {
      it('should return pricing packages for the school', async () => {
        const response = await authGet('/api/v1/invoices/admin/pricing-packages', admin1Token);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('PATCH /api/v1/invoices/admin/pricing-packages/:id', () => {
      it('should update a pricing package', async () => {
        const response = await authRequest(
          'patch',
          `/api/v1/invoices/admin/pricing-packages/${packageId}`,
          admin1Token
        ).send({
          price: 500,
        });

        expect(response.status).toBe(200);
        expect(parseFloat(response.body.data.price)).toBe(500);
      });
    });

    describe('DELETE /api/v1/invoices/admin/pricing-packages/:id', () => {
      it('should soft delete a pricing package', async () => {
        const response = await authRequest(
          'delete',
          `/api/v1/invoices/admin/pricing-packages/${packageId}`,
          admin1Token
        );

        expect(response.status).toBe(200);

        // Verify it's inactive
        const getResponse = await authGet(
          `/api/v1/invoices/admin/pricing-packages/${packageId}`,
          admin1Token
        );
        expect(getResponse.body.data.isActive).toBe(false);
      });
    });
  });

  // ===========================================
  // DELETE INVOICE TESTS
  // ===========================================

  describe('DELETE /api/v1/invoices/admin/invoices/:id', () => {
    let deleteTestInvoiceId: string;

    beforeAll(async () => {
      // Create a draft invoice to delete
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const createRes = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
        familyId: family1Id,
        dueDate: dueDate.toISOString(),
        items: [{ description: 'To Delete', quantity: 1, unitPrice: 100 }],
      });

      deleteTestInvoiceId = createRes.body.data.id;
    });

    it('should delete a draft invoice', async () => {
      const response = await authRequest('delete', `/api/v1/invoices/admin/invoices/${deleteTestInvoiceId}`, admin1Token);

      expect(response.status).toBe(200);

      // Verify it's gone
      const getResponse = await authGet(`/api/v1/invoices/admin/invoices/${deleteTestInvoiceId}`, admin1Token);
      expect(getResponse.status).toBe(404);
    });

    it('should not delete a sent invoice', async () => {
      // Create and send an invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const createRes = await authRequest('post', '/api/v1/invoices/admin/invoices', admin1Token).send({
        familyId: family1Id,
        dueDate: dueDate.toISOString(),
        items: [{ description: 'Sent Invoice', quantity: 1, unitPrice: 100 }],
      });

      await authRequest('post', `/api/v1/invoices/admin/invoices/${createRes.body.data.id}/send`, admin1Token);

      const response = await authRequest('delete', `/api/v1/invoices/admin/invoices/${createRes.body.data.id}`, admin1Token);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('draft');
    });
  });
});
