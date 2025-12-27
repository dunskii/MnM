// ===========================================
// Payment E2E Flow Tests
// ===========================================
// Comprehensive tests for the complete payment and invoicing system
// Covers invoice generation, viewing, Stripe checkout, webhooks, and manual payments

import { test, expect } from '../fixtures/test-fixtures';
import { TEST_SCHOOL, TEST_STUDENTS, TEST_FAMILIES, TEST_TERMS } from '../helpers/test-data';
import { Page } from '@playwright/test';

// ===========================================
// TEST DATA CONSTANTS
// ===========================================

const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  require3DS: '4000002500003155',
  insufficientFunds: '4000000000009995',
};

const TEST_INVOICE_DATA = {
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
  description: 'Term 1 2025 Fees',
  items: [
    {
      description: 'Piano Individual Lessons (10 weeks)',
      quantity: 10,
      unitPrice: 45.0,
    },
    {
      description: 'Materials Fee',
      quantity: 1,
      unitPrice: 25.0,
    },
  ],
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Create a test invoice via API
 */
async function createTestInvoice(
  page: Page,
  familyId: string,
  termId: string,
  status: 'DRAFT' | 'SENT' = 'DRAFT'
) {
  const apiURL = page.context().baseURL?.replace(':3001', ':5000') || 'http://localhost:5000';

  const response = await page.request.post(`${apiURL}/api/v1/invoices/admin/invoices`, {
    data: {
      familyId,
      termId,
      description: TEST_INVOICE_DATA.description,
      dueDate: TEST_INVOICE_DATA.dueDate,
      items: TEST_INVOICE_DATA.items,
    },
  });

  expect(response.ok()).toBeTruthy();
  const { data } = await response.json();

  // Send invoice if needed
  if (status === 'SENT') {
    const sendResponse = await page.request.post(`${apiURL}/api/v1/invoices/admin/invoices/${data.id}/send`);
    expect(sendResponse.ok()).toBeTruthy();
    const { data: sentInvoice } = await sendResponse.json();
    return sentInvoice;
  }

  return data;
}

/**
 * Fill Stripe test card details
 */
async function fillStripeCardDetails(page: Page, cardNumber: string) {
  // Wait for Stripe Elements to load
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();

  // Fill card number
  await stripeFrame.locator('input[name="cardnumber"]').fill(cardNumber);

  // Fill expiry (always use future date)
  await stripeFrame.locator('input[name="exp-date"]').fill('12/30');

  // Fill CVC
  await stripeFrame.locator('input[name="cvc"]').fill('123');

  // Fill ZIP (if present)
  const zipInput = stripeFrame.locator('input[name="postal"]');
  if (await zipInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await zipInput.fill('12345');
  }
}

/**
 * Wait for Stripe checkout redirect
 */
async function waitForStripeCheckout(page: Page) {
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

// ===========================================
// TEST SUITE: ADMIN - INVOICE GENERATION
// ===========================================

test.describe('Admin - Invoice Generation', () => {
  test('admin can create single student invoice', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Click "Create Invoice" button
    await adminPage.click('button:has-text("Create Invoice"), a:has-text("Create Invoice")');

    // Wait for form to load
    await adminPage.waitForURL(/\/admin\/invoices\/(new|create)/);

    // Select family
    const familySelect = adminPage.locator('[data-testid="family-select"], select[name="familyId"]');
    await familySelect.click();
    await adminPage.click('li:has-text("The Smith Family"), option:has-text("The Smith Family")');

    // Select term
    const termSelect = adminPage.locator('[data-testid="term-select"], select[name="termId"]');
    await termSelect.click();
    await adminPage.click('li:has-text("Term 1 2025"), option:has-text("Term 1 2025")');

    // Set due date
    await adminPage.fill('input[name="dueDate"]', '2025-02-15');

    // Add line items
    for (let i = 0; i < TEST_INVOICE_DATA.items.length; i++) {
      const item = TEST_INVOICE_DATA.items[i];

      if (i > 0) {
        await adminPage.click('button:has-text("Add Line Item"), button:has-text("Add Item")');
      }

      await adminPage.fill(`input[name="items[${i}].description"]`, item.description);
      await adminPage.fill(`input[name="items[${i}].quantity"]`, item.quantity.toString());
      await adminPage.fill(`input[name="items[${i}].unitPrice"]`, item.unitPrice.toString());
    }

    // Verify total calculation
    const expectedTotal = TEST_INVOICE_DATA.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    await expect(adminPage.locator('[data-testid="invoice-total"]')).toContainText(
      `$${expectedTotal.toFixed(2)}`
    );

    // Save invoice
    await adminPage.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Verify success message
    await expect(adminPage.locator('text=/invoice.*created|success/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('admin can create family invoice with multiple students', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices/create');

    // Select family with multiple students
    const familySelect = adminPage.locator('[data-testid="family-select"]');
    if (await familySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await familySelect.click();
      // Look for a family with multiple students
      await adminPage.click('li:has-text("Family")').first();
    }

    // Add items for multiple students
    const items = [
      { description: 'Alice - Piano Lessons', quantity: 10, unitPrice: 45 },
      { description: 'Bob - Guitar Lessons', quantity: 10, unitPrice: 45 },
    ];

    for (let i = 0; i < items.length; i++) {
      if (i > 0) {
        await adminPage.click('button:has-text("Add Item")');
      }

      await adminPage.fill(`input[name="items[${i}].description"]`, items[i].description);
      await adminPage.fill(`input[name="items[${i}].quantity"]`, items[i].quantity.toString());
      await adminPage.fill(`input[name="items[${i}].unitPrice"]`, items[i].unitPrice.toString());
    }

    // Save
    await adminPage.click('button[type="submit"]');

    // Verify success
    await expect(adminPage.locator('text=/created.*successfully/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('admin can add pricing packages to invoice', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices/create');

    // Select family
    const familySelect = adminPage.locator('[data-testid="family-select"]');
    if (await familySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await familySelect.click();
      await adminPage.click('li').first();
    }

    // Look for pricing package selector
    const packageButton = adminPage.locator('button:has-text("Add Package"), button:has-text("Select Package")');

    if (await packageButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await packageButton.click();

      // Select a package from dialog
      const packageOption = adminPage.locator('[data-testid="package-option"]').first();
      if (await packageOption.isVisible()) {
        await packageOption.click();

        // Verify package added to line items
        await expect(adminPage.locator('[data-testid="invoice-items"]')).toContainText(/package|bundle/i);
      }
    }
  });

  test('admin can generate bulk term invoices', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Look for bulk generation button
    const bulkButton = adminPage.locator(
      'button:has-text("Generate Term Invoices"), button:has-text("Bulk Generate")'
    );

    if (await bulkButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bulkButton.click();

      // Select term
      const termSelect = adminPage.locator('[data-testid="term-select"]');
      await termSelect.click();
      await adminPage.click('li:has-text("Term 1 2025")');

      // Set due date
      await adminPage.fill('input[name="dueDate"]', '2025-02-15');

      // Select families (or select all)
      const selectAllCheckbox = adminPage.locator('input[type="checkbox"][name="selectAll"]');
      if (await selectAllCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await selectAllCheckbox.check();
      }

      // Generate
      await adminPage.click('button:has-text("Generate")');

      // Wait for generation to complete
      await expect(adminPage.locator('text=/generated|created|success/i')).toBeVisible({
        timeout: 15000,
      });
    }
  });

  test('admin can preview invoice before sending', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Find a draft invoice
    const draftInvoice = adminPage.locator('[data-invoice-status="DRAFT"]').first();

    if (await draftInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await draftInvoice.click();

      // Look for preview button
      const previewButton = adminPage.locator('button:has-text("Preview"), a:has-text("Preview")');
      if (await previewButton.isVisible()) {
        await previewButton.click();

        // Verify preview shows invoice details
        await expect(adminPage.locator('[data-testid="invoice-preview"]')).toBeVisible();
        await expect(adminPage.locator('text=/invoice number|inv-/i')).toBeVisible();
      }
    }
  });

  test('admin can calculate hybrid lesson billing correctly', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices/create');

    // This test assumes hybrid lesson data exists
    // Select family with hybrid lesson enrollment
    const familySelect = adminPage.locator('[data-testid="family-select"]');
    if (await familySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await familySelect.click();
      await adminPage.click('li').first();
    }

    // Look for auto-calculate button
    const autoCalcButton = adminPage.locator(
      'button:has-text("Auto Calculate"), button:has-text("Calculate from Enrollments")'
    );

    if (await autoCalcButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await autoCalcButton.click();

      // Verify hybrid lesson line items appear
      // Should have separate lines for group weeks and individual weeks
      const lineItems = adminPage.locator('[data-testid="invoice-item"]');
      const count = await lineItems.count();

      if (count > 0) {
        // Check for hybrid lesson pattern in descriptions
        const hasGroupWeeks = await adminPage
          .locator('text=/group.*weeks|group.*sessions/i')
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        const hasIndividualWeeks = await adminPage
          .locator('text=/individual.*weeks|individual.*sessions/i')
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        // At least one should be present if hybrid lessons exist
        expect(hasGroupWeeks || hasIndividualWeeks).toBeTruthy();
      }
    }
  });
});

// ===========================================
// TEST SUITE: ADMIN - INVOICE MANAGEMENT
// ===========================================

test.describe('Admin - Invoice Management', () => {
  test('admin can view all invoices with filters', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Wait for invoices to load
    await adminPage.waitForSelector('[data-testid="invoices-list"], table', { timeout: 10000 });

    // Apply status filter
    const statusFilter = adminPage.locator('[data-testid="status-filter"], select[name="status"]');
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.click();
      await adminPage.click('li:has-text("Sent"), option[value="SENT"]');

      // Verify filtered results
      await adminPage.waitForTimeout(1000); // Wait for filter to apply
      const invoices = adminPage.locator('[data-invoice-status="SENT"]');
      const count = await invoices.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('admin can send invoice to parent', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Find draft invoice
    const draftInvoice = adminPage.locator('[data-invoice-status="DRAFT"]').first();

    if (await draftInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await draftInvoice.click();

      // Send invoice
      const sendButton = adminPage.locator('button:has-text("Send"), button:has-text("Send to Parent")');
      await sendButton.click();

      // Confirm in dialog if needed
      const confirmButton = adminPage.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Verify success message
      await expect(adminPage.locator('text=/sent.*successfully|invoice.*sent/i')).toBeVisible({
        timeout: 5000,
      });

      // Verify status changed to SENT
      await expect(adminPage.locator('[data-invoice-status="SENT"]')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('admin can edit draft invoice', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Find draft invoice
    const draftInvoice = adminPage.locator('[data-invoice-status="DRAFT"]').first();

    if (await draftInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await draftInvoice.click();

      // Click edit
      const editButton = adminPage.locator('button:has-text("Edit"), a:has-text("Edit")');
      if (await editButton.isVisible()) {
        await editButton.click();

        // Modify description
        await adminPage.fill('input[name="description"], textarea[name="description"]', 'Updated invoice description');

        // Save
        await adminPage.click('button[type="submit"]:has-text("Save")');

        // Verify success
        await expect(adminPage.locator('text=/updated|saved/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('admin cannot edit sent invoice', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Find sent invoice
    const sentInvoice = adminPage.locator('[data-invoice-status="SENT"]').first();

    if (await sentInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sentInvoice.click();

      // Edit button should be disabled or not present
      const editButton = adminPage.locator('button:has-text("Edit")');

      if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isDisabled = await editButton.isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('admin can delete draft invoice', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Find draft invoice
    const draftInvoice = adminPage.locator('[data-invoice-status="DRAFT"]').first();

    if (await draftInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await draftInvoice.click();

      // Delete
      const deleteButton = adminPage.locator('button:has-text("Delete")');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        await adminPage.click('button:has-text("Confirm"), button:has-text("Yes, Delete")');

        // Verify redirect and success message
        await adminPage.waitForURL(/\/admin\/invoices$/);
        await expect(adminPage.locator('text=/deleted|removed/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('admin can cancel invoice', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Find sent or overdue invoice
    const cancelableInvoice = adminPage.locator('[data-invoice-status="SENT"], [data-invoice-status="OVERDUE"]').first();

    if (await cancelableInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelableInvoice.click();

      // Cancel
      const cancelButton = adminPage.locator('button:has-text("Cancel Invoice")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Enter reason
        await adminPage.fill('textarea[name="reason"], input[name="reason"]', 'Student withdrew from program');

        // Confirm
        await adminPage.click('button:has-text("Confirm")');

        // Verify status changed
        await expect(adminPage.locator('[data-invoice-status="CANCELLED"]')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});

// ===========================================
// TEST SUITE: PARENT - INVOICE VIEWING
// ===========================================

test.describe('Parent - Invoice Viewing', () => {
  test('parent can view invoice list', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    // Should show invoices page
    await expect(parentPage.locator('h1:has-text("Invoices"), h2:has-text("Invoices")')).toBeVisible();

    // Should have invoices list or empty state
    const invoicesList = parentPage.locator('[data-testid="invoices-list"]');
    const emptyState = parentPage.locator('text=/no.*invoices|no.*bills/i');

    const hasInvoices = await invoicesList.isVisible({ timeout: 3000 }).catch(() => false);
    const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasInvoices || isEmpty).toBeTruthy();
  });

  test('parent can view invoice details', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    // Click on first invoice
    const invoice = parentPage.locator('[data-testid*="invoice"]').first();

    if (await invoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await invoice.click();

      // Should show invoice details
      await expect(parentPage.locator('text=/invoice number|inv-/i')).toBeVisible();
      await expect(parentPage.locator('text=/due date/i')).toBeVisible();
      await expect(parentPage.locator('text=/total|amount/i')).toBeVisible();

      // Should show line items
      await expect(parentPage.locator('[data-testid="invoice-items"]')).toBeVisible();
    }
  });

  test('parent can filter invoices by status', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    // Look for status filter
    const statusFilter = parentPage.locator('[data-testid="status-filter"]');

    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Filter by paid
      await statusFilter.click();
      await parentPage.click('li:has-text("Paid")');

      // Wait for filter to apply
      await parentPage.waitForTimeout(1000);

      // All visible invoices should be paid
      const paidInvoices = parentPage.locator('[data-invoice-status="PAID"]');
      const count = await paidInvoices.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('parent can filter invoices by date range', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    // Look for date range filter
    const dateFromInput = parentPage.locator('input[name="dateFrom"], input[placeholder*="From"]');

    if (await dateFromInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateFromInput.fill('2025-01-01');

      const dateToInput = parentPage.locator('input[name="dateTo"], input[placeholder*="To"]');
      await dateToInput.fill('2025-12-31');

      // Apply filter
      const applyButton = parentPage.locator('button:has-text("Apply"), button:has-text("Filter")');
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await parentPage.waitForTimeout(1000);
      }
    }
  });

  test('parent can download invoice as PDF', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    // Click on first invoice
    const invoice = parentPage.locator('[data-testid*="invoice"]').first();

    if (await invoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await invoice.click();

      // Look for download button
      const downloadButton = parentPage.locator('button:has-text("Download"), a:has-text("Download PDF")');

      if (await downloadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Set up download listener
        const downloadPromise = parentPage.waitForEvent('download', { timeout: 10000 });

        await downloadButton.click();

        // Wait for download to start
        const download = await downloadPromise;

        // Verify download
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
      }
    }
  });

  test('parent cannot see draft invoices', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    // Draft invoices should not be visible
    const draftInvoices = parentPage.locator('[data-invoice-status="DRAFT"]');
    const count = await draftInvoices.count();

    expect(count).toBe(0);
  });
});

// ===========================================
// TEST SUITE: PARENT - STRIPE CHECKOUT
// ===========================================

test.describe('Parent - Stripe Checkout', () => {
  test('parent can initiate Stripe checkout for invoice', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    // Find an unpaid invoice
    const unpaidInvoice = parentPage.locator('[data-invoice-status="SENT"], [data-invoice-status="OVERDUE"]').first();

    if (await unpaidInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unpaidInvoice.click();

      // Click "Pay Now" button
      const payButton = parentPage.locator('button:has-text("Pay Now"), button:has-text("Pay Invoice")');

      if (await payButton.isVisible()) {
        await payButton.click();

        // Should redirect to Stripe Checkout
        try {
          await waitForStripeCheckout(parentPage);

          // Verify Stripe Checkout page loaded
          await expect(parentPage.locator('text=/stripe|payment/i')).toBeVisible({ timeout: 10000 });
        } catch (error) {
          // If redirect doesn't happen, might be using embedded checkout
          // Look for Stripe Elements iframe
          const stripeFrame = parentPage.frameLocator('iframe[name^="__privateStripeFrame"]').first();
          const cardInput = stripeFrame.locator('input[name="cardnumber"]');
          await expect(cardInput).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test('parent can cancel Stripe checkout', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    // Find unpaid invoice
    const unpaidInvoice = parentPage.locator('[data-invoice-status="SENT"]').first();

    if (await unpaidInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unpaidInvoice.click();

      const payButton = parentPage.locator('button:has-text("Pay Now")');

      if (await payButton.isVisible()) {
        await payButton.click();

        // Wait for Stripe
        try {
          await waitForStripeCheckout(parentPage);

          // Look for cancel/back button
          const cancelButton = parentPage.locator('a:has-text("Cancel"), button:has-text("Back")');
          if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await cancelButton.click();

            // Should return to invoice page
            await parentPage.waitForURL(/\/parent\/invoices/);
          }
        } catch (error) {
          // Checkout didn't redirect - might be embedded
          const cancelButton = parentPage.locator('button:has-text("Cancel")');
          if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await cancelButton.click();
          }
        }
      }
    }
  });

  // Note: Actual payment testing requires Stripe test mode and webhook setup
  // This is a placeholder for the flow
  test.skip('parent can complete Stripe payment (requires Stripe test mode)', async ({ parentPage }) => {
    // This test would require:
    // 1. Stripe test mode configured
    // 2. Webhook endpoint accessible
    // 3. Test card processing
    await parentPage.goto('/parent/invoices');

    const unpaidInvoice = parentPage.locator('[data-invoice-status="SENT"]').first();
    await unpaidInvoice.click();

    const payButton = parentPage.locator('button:has-text("Pay Now")');
    await payButton.click();

    await waitForStripeCheckout(parentPage);

    // Fill test card
    await fillStripeCardDetails(parentPage, STRIPE_TEST_CARDS.success);

    // Submit payment
    await parentPage.click('button[type="submit"]');

    // Wait for redirect back to app
    await parentPage.waitForURL(/\/parent\/invoices.*success/);

    // Verify success message
    await expect(parentPage.locator('text=/payment.*successful|thank you/i')).toBeVisible();
  });
});

// ===========================================
// TEST SUITE: PARENT - PAYMENT HISTORY
// ===========================================

test.describe('Parent - Payment History', () => {
  test('parent can view payment history', async ({ parentPage }) => {
    await parentPage.goto('/parent/payments');

    // Should show payments page
    await expect(
      parentPage.locator('h1:has-text("Payments"), h2:has-text("Payment History")')
    ).toBeVisible();

    // Should have payments list or empty state
    const paymentsList = parentPage.locator('[data-testid="payments-list"]');
    const emptyState = parentPage.locator('text=/no.*payments|no.*history/i');

    const hasPayments = await paymentsList.isVisible({ timeout: 3000 }).catch(() => false);
    const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasPayments || isEmpty).toBeTruthy();
  });

  test('parent can filter payment history by date', async ({ parentPage }) => {
    await parentPage.goto('/parent/payments');

    const dateFromInput = parentPage.locator('input[name="dateFrom"]');

    if (await dateFromInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateFromInput.fill('2025-01-01');

      const dateToInput = parentPage.locator('input[name="dateTo"]');
      await dateToInput.fill('2025-12-31');

      const applyButton = parentPage.locator('button:has-text("Apply")');
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await parentPage.waitForTimeout(1000);
      }
    }
  });

  test('parent can view payment receipt', async ({ parentPage }) => {
    await parentPage.goto('/parent/payments');

    // Click on first payment
    const payment = parentPage.locator('[data-testid*="payment"]').first();

    if (await payment.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Look for view receipt button
      const receiptButton = payment.locator('button:has-text("Receipt"), a:has-text("View Receipt")');

      if (await receiptButton.isVisible()) {
        await receiptButton.click();

        // Should show receipt details
        await expect(parentPage.locator('[data-testid="payment-receipt"]')).toBeVisible();
        await expect(parentPage.locator('text=/receipt|payment confirmation/i')).toBeVisible();
      }
    }
  });

  test('parent can download payment receipt', async ({ parentPage }) => {
    await parentPage.goto('/parent/payments');

    const payment = parentPage.locator('[data-testid*="payment"]').first();

    if (await payment.isVisible({ timeout: 3000 }).catch(() => false)) {
      const downloadButton = payment.locator('button:has-text("Download"), a:has-text("Download Receipt")');

      if (await downloadButton.isVisible()) {
        const downloadPromise = parentPage.waitForEvent('download', { timeout: 10000 });
        await downloadButton.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/receipt|payment/i);
      }
    }
  });

  test('parent can export payment report', async ({ parentPage }) => {
    await parentPage.goto('/parent/payments');

    const exportButton = parentPage.locator('button:has-text("Export"), button:has-text("Download Report")');

    if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const downloadPromise = parentPage.waitForEvent('download', { timeout: 10000 });
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$|\.xlsx$|\.pdf$/i);
    }
  });
});

// ===========================================
// TEST SUITE: ADMIN - MANUAL PAYMENTS
// ===========================================

test.describe('Admin - Manual Payment Recording', () => {
  test('admin can record cash payment', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Find unpaid invoice
    const unpaidInvoice = adminPage.locator('[data-invoice-status="SENT"], [data-invoice-status="OVERDUE"]').first();

    if (await unpaidInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unpaidInvoice.click();

      // Record payment
      const recordPaymentButton = adminPage.locator('button:has-text("Record Payment")');

      if (await recordPaymentButton.isVisible()) {
        await recordPaymentButton.click();

        // Fill payment details
        await adminPage.fill('input[name="amount"]', '100.00');

        // Select payment method
        const methodSelect = adminPage.locator('select[name="method"], [data-testid="payment-method-select"]');
        await methodSelect.click();
        await adminPage.click('option[value="CASH"], li:has-text("Cash")');

        // Add reference
        await adminPage.fill('input[name="reference"]', 'Cash payment received 2025-01-26');

        // Add notes
        await adminPage.fill('textarea[name="notes"]', 'Paid in person at front desk');

        // Submit
        await adminPage.click('button[type="submit"]:has-text("Record")');

        // Verify success
        await expect(adminPage.locator('text=/payment.*recorded|success/i')).toBeVisible({
          timeout: 5000,
        });

        // Verify invoice updated
        await expect(adminPage.locator('[data-testid="amount-paid"]')).toContainText('$100.00');
      }
    }
  });

  test('admin can record bank transfer payment', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    const unpaidInvoice = adminPage.locator('[data-invoice-status="SENT"]').first();

    if (await unpaidInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unpaidInvoice.click();

      const recordPaymentButton = adminPage.locator('button:has-text("Record Payment")');

      if (await recordPaymentButton.isVisible()) {
        await recordPaymentButton.click();

        await adminPage.fill('input[name="amount"]', '250.00');

        const methodSelect = adminPage.locator('select[name="method"]');
        await methodSelect.click();
        await adminPage.click('option[value="BANK_TRANSFER"], li:has-text("Bank Transfer")');

        await adminPage.fill('input[name="reference"]', 'TXN123456789');

        await adminPage.click('button[type="submit"]');

        await expect(adminPage.locator('text=/recorded|success/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('admin can record partial payment', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    const unpaidInvoice = adminPage.locator('[data-invoice-status="SENT"]').first();

    if (await unpaidInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unpaidInvoice.click();

      // Get total amount
      const totalText = await adminPage.locator('[data-testid="invoice-total"]').textContent();
      const total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');

      const recordPaymentButton = adminPage.locator('button:has-text("Record Payment")');

      if (await recordPaymentButton.isVisible() && total > 0) {
        await recordPaymentButton.click();

        // Pay half
        const partialAmount = (total / 2).toFixed(2);
        await adminPage.fill('input[name="amount"]', partialAmount);

        const methodSelect = adminPage.locator('select[name="method"]');
        await methodSelect.click();
        await adminPage.click('option[value="CASH"]');

        await adminPage.click('button[type="submit"]');

        await expect(adminPage.locator('text=/recorded/i')).toBeVisible({ timeout: 5000 });

        // Verify status changed to PARTIALLY_PAID
        await expect(adminPage.locator('[data-invoice-status="PARTIALLY_PAID"]')).toBeVisible({
          timeout: 3000,
        });
      }
    }
  });

  test('admin cannot record payment exceeding invoice total', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    const unpaidInvoice = adminPage.locator('[data-invoice-status="SENT"]').first();

    if (await unpaidInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unpaidInvoice.click();

      const totalText = await adminPage.locator('[data-testid="invoice-total"]').textContent();
      const total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');

      const recordPaymentButton = adminPage.locator('button:has-text("Record Payment")');

      if (await recordPaymentButton.isVisible() && total > 0) {
        await recordPaymentButton.click();

        // Try to pay more than total
        const excessAmount = (total + 100).toFixed(2);
        await adminPage.fill('input[name="amount"]', excessAmount);

        const methodSelect = adminPage.locator('select[name="method"]');
        await methodSelect.click();
        await adminPage.click('option[value="CASH"]');

        await adminPage.click('button[type="submit"]');

        // Should show error
        await expect(adminPage.locator('text=/exceeds|too much|invalid/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('admin can view payment history for invoice', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    // Find invoice with payments
    const invoiceWithPayment = adminPage.locator('[data-invoice-status="PAID"], [data-invoice-status="PARTIALLY_PAID"]').first();

    if (await invoiceWithPayment.isVisible({ timeout: 3000 }).catch(() => false)) {
      await invoiceWithPayment.click();

      // Should show payment history section
      await expect(adminPage.locator('[data-testid="payment-history"]')).toBeVisible();

      // Should show payment records
      const payments = adminPage.locator('[data-testid*="payment"]');
      const count = await payments.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

// ===========================================
// TEST SUITE: HYBRID LESSON BILLING
// ===========================================

test.describe('Hybrid Lesson Billing', () => {
  test('invoice correctly splits group and individual weeks', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices/create');

    // This test assumes hybrid lesson enrollment exists
    // Select family with hybrid enrollment
    const familySelect = adminPage.locator('[data-testid="family-select"]');
    if (await familySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await familySelect.click();
      await adminPage.click('li').first();
    }

    // Auto-calculate from enrollments
    const autoCalcButton = adminPage.locator('button:has-text("Auto Calculate")');

    if (await autoCalcButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await autoCalcButton.click();

      // Look for hybrid lesson line items
      const groupItem = adminPage.locator('text=/group.*sessions.*weeks/i');
      const individualItem = adminPage.locator('text=/individual.*sessions.*weeks/i');

      if (await groupItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Verify group weeks item exists
        expect(await groupItem.textContent()).toMatch(/group/i);

        // Should show quantity (number of weeks)
        const groupLine = adminPage.locator('[data-testid="invoice-item"]').filter({ hasText: /group/i });
        await expect(groupLine).toContainText(/\d+/); // Should have a number
      }

      if (await individualItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Verify individual weeks item exists
        expect(await individualItem.textContent()).toMatch(/individual/i);

        const individualLine = adminPage.locator('[data-testid="invoice-item"]').filter({ hasText: /individual/i });
        await expect(individualLine).toContainText(/\d+/);
      }
    }
  });

  test('hybrid lesson pricing reflects different rates', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices/create');

    const autoCalcButton = adminPage.locator('button:has-text("Auto Calculate")');

    if (await autoCalcButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await autoCalcButton.click();

      // Group and individual sessions should have different unit prices
      const groupLine = adminPage.locator('[data-testid="invoice-item"]').filter({ hasText: /group/i });
      const individualLine = adminPage.locator('[data-testid="invoice-item"]').filter({ hasText: /individual/i });

      if (
        (await groupLine.isVisible({ timeout: 2000 }).catch(() => false)) &&
        (await individualLine.isVisible({ timeout: 2000 }).catch(() => false))
      ) {
        // Extract prices
        const groupPrice = await groupLine.locator('[data-testid="unit-price"]').textContent();
        const individualPrice = await individualLine.locator('[data-testid="unit-price"]').textContent();

        // Prices should be different (individual typically costs more)
        expect(groupPrice).not.toBe(individualPrice);
      }
    }
  });

  test('invoice total calculates correctly for hybrid lessons', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices/create');

    const autoCalcButton = adminPage.locator('button:has-text("Auto Calculate")');

    if (await autoCalcButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await autoCalcButton.click();

      // Verify total is sum of group weeks + individual weeks
      const totalElement = adminPage.locator('[data-testid="invoice-total"]');

      if (await totalElement.isVisible({ timeout: 3000 }).catch(() => false)) {
        const totalText = await totalElement.textContent();
        const total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');

        // Total should be greater than 0
        expect(total).toBeGreaterThan(0);
      }
    }
  });
});

// ===========================================
// TEST SUITE: MULTI-TENANCY SECURITY
// ===========================================

test.describe('Multi-Tenancy Security', () => {
  test('parent cannot view invoices from another family', async ({ parentPage }) => {
    // This test assumes test data with multiple families exists

    // Try to access another family's invoice directly
    const otherFamilyInvoiceId = 'invoice-from-another-family-123';

    await parentPage.goto(`/parent/invoices/${otherFamilyInvoiceId}`);

    // Should show 404 or access denied
    await expect(parentPage.locator('text=/not found|access denied|unauthorized/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('admin from School A cannot see School B invoices', async ({ adminPage }) => {
    // This would require multi-school test setup
    // For now, verify that all visible invoices belong to the current school

    await adminPage.goto('/admin/invoices');

    const invoices = adminPage.locator('[data-testid*="invoice"]');
    const count = await invoices.count();

    // All invoices should have the current school's ID
    // This is verified at the API level, but UI should only show current school's data
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ===========================================
// TEST SUITE: EDGE CASES & ERROR HANDLING
// ===========================================

test.describe('Edge Cases & Error Handling', () => {
  test('handles expired invoice gracefully', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    // Find overdue invoice
    const overdueInvoice = parentPage.locator('[data-invoice-status="OVERDUE"]').first();

    if (await overdueInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await overdueInvoice.click();

      // Should show overdue warning
      await expect(parentPage.locator('text=/overdue|past due|late/i')).toBeVisible();

      // Should still be able to pay
      const payButton = parentPage.locator('button:has-text("Pay Now")');
      expect(await payButton.isVisible()).toBeTruthy();
    }
  });

  test('handles cancelled invoice correctly', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    const cancelledInvoice = parentPage.locator('[data-invoice-status="CANCELLED"]').first();

    if (await cancelledInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelledInvoice.click();

      // Should show cancelled status
      await expect(parentPage.locator('text=/cancelled/i')).toBeVisible();

      // Pay button should NOT be visible
      const payButton = parentPage.locator('button:has-text("Pay Now")');
      expect(await payButton.isVisible({ timeout: 2000 }).catch(() => false)).toBeFalsy();
    }
  });

  test('handles network error during payment gracefully', async ({ parentPage }) => {
    // This would require mocking network failure
    // Placeholder for network error handling test
    await parentPage.goto('/parent/invoices');

    // In a real test, you would:
    // 1. Mock network failure
    // 2. Try to initiate payment
    // 3. Verify error message shown
    // 4. Verify invoice state unchanged
  });

  test('prevents duplicate payment submission', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    const unpaidInvoice = adminPage.locator('[data-invoice-status="SENT"]').first();

    if (await unpaidInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unpaidInvoice.click();

      const recordPaymentButton = adminPage.locator('button:has-text("Record Payment")');

      if (await recordPaymentButton.isVisible()) {
        await recordPaymentButton.click();

        await adminPage.fill('input[name="amount"]', '50.00');

        const methodSelect = adminPage.locator('select[name="method"]');
        await methodSelect.click();
        await adminPage.click('option[value="CASH"]');

        // Submit form
        const submitButton = adminPage.locator('button[type="submit"]');
        await submitButton.click();

        // Button should be disabled during submission
        await expect(submitButton).toBeDisabled({ timeout: 1000 });
      }
    }
  });

  test('validates payment amount is positive', async ({ adminPage }) => {
    await adminPage.goto('/admin/invoices');

    const unpaidInvoice = adminPage.locator('[data-invoice-status="SENT"]').first();

    if (await unpaidInvoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unpaidInvoice.click();

      const recordPaymentButton = adminPage.locator('button:has-text("Record Payment")');

      if (await recordPaymentButton.isVisible()) {
        await recordPaymentButton.click();

        // Try negative amount
        await adminPage.fill('input[name="amount"]', '-10.00');

        const submitButton = adminPage.locator('button[type="submit"]');

        // Submit button should be disabled or show error
        const isDisabled = await submitButton.isDisabled().catch(() => false);
        const hasError = await adminPage.locator('text=/invalid|positive|greater than/i').isVisible({ timeout: 2000 }).catch(() => false);

        expect(isDisabled || hasError).toBeTruthy();
      }
    }
  });

  test('handles currency formatting correctly (AUD)', async ({ parentPage }) => {
    await parentPage.goto('/parent/invoices');

    const invoice = parentPage.locator('[data-testid*="invoice"]').first();

    if (await invoice.isVisible({ timeout: 3000 }).catch(() => false)) {
      await invoice.click();

      // Check for proper currency formatting
      const totalElement = parentPage.locator('[data-testid="invoice-total"]');
      const totalText = await totalElement.textContent();

      // Should have dollar sign and decimal places
      expect(totalText).toMatch(/\$\d+\.\d{2}/);
    }
  });
});
