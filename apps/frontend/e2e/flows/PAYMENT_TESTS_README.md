# Payment E2E Tests Documentation

## Overview

Comprehensive end-to-end tests for the complete payment and invoicing system in Music 'n Me, covering invoice generation, parent viewing, Stripe checkout integration, manual payments, and hybrid lesson billing.

## Test Coverage

### 1. Admin - Invoice Generation (6 tests)

**Purpose:** Verify admins can create and manage invoices correctly.

- **Single Student Invoice**: Create invoice with line items, verify total calculation
- **Family Invoice**: Create invoice for multiple students in one family
- **Pricing Packages**: Add pre-defined pricing packages to invoices
- **Bulk Term Invoices**: Generate invoices for all families in a term at once
- **Invoice Preview**: Preview invoice before sending to parents
- **Hybrid Billing Calculation**: Auto-calculate hybrid lesson billing with correct group/individual split

**Key Endpoints:**
- `POST /api/v1/invoices/admin/invoices` - Create invoice
- `POST /api/v1/invoices/admin/invoices/generate` - Bulk generation
- `GET /api/v1/invoices/admin/pricing-packages` - Get packages

### 2. Admin - Invoice Management (7 tests)

**Purpose:** Verify invoice lifecycle management.

- **View All Invoices**: Filter invoices by status, date, family, term
- **Send Invoice**: Change status from DRAFT to SENT, trigger email notification
- **Edit Draft Invoice**: Modify invoice before sending
- **Cannot Edit Sent**: Ensure sent invoices are locked
- **Delete Draft Invoice**: Remove unused draft invoices
- **Cancel Invoice**: Cancel sent invoice with reason

**Key Endpoints:**
- `GET /api/v1/invoices/admin/invoices` - List invoices with filters
- `POST /api/v1/invoices/admin/invoices/:id/send` - Send invoice
- `PATCH /api/v1/invoices/admin/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/admin/invoices/:id` - Delete invoice
- `POST /api/v1/invoices/admin/invoices/:id/cancel` - Cancel invoice

### 3. Parent - Invoice Viewing (6 tests)

**Purpose:** Verify parents can view and manage their invoices.

- **View Invoice List**: See all family invoices (excluding DRAFT)
- **View Invoice Details**: See line items, totals, due dates
- **Filter by Status**: Filter invoices (Paid, Sent, Overdue)
- **Filter by Date Range**: Date range filtering
- **Download PDF**: Generate and download PDF invoice
- **Cannot See Drafts**: Security check - drafts hidden from parents

**Key Endpoints:**
- `GET /api/v1/invoices/parent/invoices` - List family invoices
- `GET /api/v1/invoices/parent/invoices/:id` - Invoice details
- Multi-tenancy security validation

### 4. Parent - Stripe Checkout (3 tests)

**Purpose:** Verify Stripe payment integration.

- **Initiate Checkout**: Click "Pay Now" and redirect to Stripe
- **Cancel Checkout**: Return to invoice without paying
- **Complete Payment**: Full payment flow with test card (SKIPPED - requires Stripe test mode)

**Key Endpoints:**
- `POST /api/v1/invoices/parent/invoices/:id/pay` - Create Stripe checkout session
- `POST /api/v1/payments/webhook` - Stripe webhook handler

**Stripe Test Cards:**
```javascript
success: '4242424242424242'           // Successful payment
decline: '4000000000000002'           // Card declined
require3DS: '4000002500003155'        // 3D Secure required
insufficientFunds: '4000000000009995' // Insufficient funds
```

### 5. Parent - Payment History (5 tests)

**Purpose:** Verify payment history tracking and reporting.

- **View Payment History**: List all payments for family
- **Filter by Date**: Date range filtering
- **View Receipt**: View individual payment receipt
- **Download Receipt**: Download payment receipt as PDF
- **Export Report**: Export payment history as CSV/XLSX/PDF

**Key Endpoints:**
- `GET /api/v1/invoices/parent/payments` - Payment history

### 6. Admin - Manual Payment Recording (5 tests)

**Purpose:** Verify manual payment recording (cash, bank transfer, etc).

- **Record Cash Payment**: Add cash payment to invoice
- **Record Bank Transfer**: Add bank transfer with reference number
- **Record Partial Payment**: Pay part of invoice, verify PARTIALLY_PAID status
- **Prevent Overpayment**: Cannot record payment exceeding total
- **View Payment History**: See all payments for an invoice

**Key Endpoints:**
- `POST /api/v1/invoices/admin/invoices/:id/payment` - Record manual payment

**Payment Methods:**
- CASH
- BANK_TRANSFER
- CHEQUE
- STRIPE (automatic via webhook)

### 7. Hybrid Lesson Billing (3 tests)

**Purpose:** Verify Music 'n Me's core differentiator - hybrid lesson billing.

- **Correct Split**: Invoice separates group weeks and individual weeks
- **Different Rates**: Group and individual sessions have different prices
- **Accurate Totals**: Total correctly sums both components

**Expected Line Items:**
```
Student Name - Lesson Name Group Sessions (6 weeks) @ $25/week = $150
Student Name - Lesson Name Individual Sessions (4 weeks) @ $45/week = $180
Total: $330
```

**Key Logic:**
- Hybrid pattern stored in database: `{ groupWeeks: [1,2,3,5,6,7], individualWeeks: [4,8] }`
- Billing calculates: `groupWeeks.length * groupRate + individualWeeks.length * individualRate`
- Creates separate invoice line items for clarity

### 8. Multi-Tenancy Security (2 tests)

**Purpose:** CRITICAL - Ensure data isolation between schools.

- **Parent Cannot View Other Families**: Direct URL access blocked
- **Admin Cannot See Other Schools**: School A admin cannot access School B data

**Security Checks:**
- All queries filter by `schoolId`
- API returns 404 for cross-school access attempts
- Frontend doesn't expose other schools' data

### 9. Edge Cases & Error Handling (7 tests)

**Purpose:** Verify system handles errors gracefully.

- **Expired Invoice**: Overdue invoices still payable with warning
- **Cancelled Invoice**: Cannot pay cancelled invoices
- **Network Error**: Graceful error handling during payment
- **Duplicate Submission**: Prevent double payment submission
- **Positive Amount Validation**: Cannot enter negative payment amounts
- **Currency Formatting**: Proper AUD formatting ($123.45)

## Test Data Requirements

### Required Test Data

```typescript
// Families
family-001: The Smith Family (1 student)
family-002: The Johnson Family (1 student)

// Students
student-001: Alice Smith (Pre-school, Piano)
student-002: Bob Johnson (Kids, Guitar)

// Terms
term-2025-1: Term 1 2025 (Jan 27 - Apr 11)

// Invoices
- DRAFT invoices (editable, deletable)
- SENT invoices (payable)
- PAID invoices (view receipt)
- OVERDUE invoices (past due date)
- CANCELLED invoices (not payable)

// Hybrid Lessons (for billing tests)
- Lesson with hybrid pattern
- Student enrolled in hybrid lesson
```

### Test Invoice Structure

```typescript
{
  familyId: 'family-001',
  termId: 'term-2025-1',
  description: 'Term 1 2025 Fees',
  dueDate: '2025-02-15',
  items: [
    {
      description: 'Piano Individual Lessons (10 weeks)',
      quantity: 10,
      unitPrice: 45.0,
      total: 450.0
    },
    {
      description: 'Materials Fee',
      quantity: 1,
      unitPrice: 25.0,
      total: 25.0
    }
  ],
  subtotal: 475.0,
  tax: 0.0, // No GST on education in Australia
  total: 475.0
}
```

## Running the Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Set up test database
npm run test:db:setup

# Seed test data
npm run test:db:seed
```

### Run All Payment Tests

```bash
# Run all payment E2E tests
npx playwright test e2e/flows/payment.spec.ts

# Run with UI
npx playwright test e2e/flows/payment.spec.ts --ui

# Run specific test
npx playwright test e2e/flows/payment.spec.ts -g "admin can create single student invoice"

# Debug mode
npx playwright test e2e/flows/payment.spec.ts --debug
```

### Run by Test Suite

```bash
# Invoice generation tests
npx playwright test e2e/flows/payment.spec.ts -g "Admin - Invoice Generation"

# Parent viewing tests
npx playwright test e2e/flows/payment.spec.ts -g "Parent - Invoice Viewing"

# Hybrid billing tests
npx playwright test e2e/flows/payment.spec.ts -g "Hybrid Lesson Billing"

# Security tests
npx playwright test e2e/flows/payment.spec.ts -g "Multi-Tenancy Security"
```

## Stripe Integration Testing

### Test Mode Setup

To test actual Stripe payments (currently skipped):

1. **Set up Stripe test mode:**
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   ```

2. **Use Stripe CLI for webhooks:**
   ```bash
   stripe listen --forward-to localhost:5000/api/v1/payments/webhook
   ```

3. **Enable payment test:**
   ```typescript
   // Remove .skip from the test
   test('parent can complete Stripe payment', async ({ parentPage }) => {
     // ...
   });
   ```

### Webhook Testing

The webhook test requires:
- Stripe CLI running
- Test webhook endpoint accessible
- Idempotency key handling
- Signature verification

**Webhook Events Tested:**
- `checkout.session.completed` - Payment successful
- `payment_intent.payment_failed` - Payment failed

## Known Limitations

1. **Stripe Payment Test Skipped**: Requires Stripe test mode and webhook setup
2. **Network Error Test**: Requires network mocking implementation
3. **Multi-School Tests**: Limited by single-school test environment
4. **PDF Generation**: Download verification is basic (filename only)

## Future Enhancements

- [ ] Add tests for refund flow (when implemented)
- [ ] Test GST calculation (if school operates in different country)
- [ ] Test recurring subscription payments (Phase 2)
- [ ] Test Xero integration (Phase 2)
- [ ] Test payment plan installments
- [ ] Add performance tests for bulk invoice generation

## Success Criteria

All tests passing means:

✅ Invoice generation works correctly for all scenarios
✅ Parents can view and pay invoices securely
✅ Manual payment recording is accurate
✅ Hybrid lesson billing calculates correctly
✅ Multi-tenancy security is enforced
✅ Error handling is graceful
✅ Currency formatting is correct

## Troubleshooting

### Tests Failing Due to Missing Data

```bash
# Re-seed test database
npm run test:db:reset
npm run test:db:seed
```

### Stripe Checkout Timeout

- Increase timeout in `waitForStripeCheckout()`
- Check Stripe test mode is enabled
- Verify network connectivity

### Invoice Not Found Errors

- Check schoolId filtering is correct
- Verify test user belongs to correct school
- Check invoice status (DRAFT invoices hidden from parents)

### Currency Formatting Issues

- Verify locale settings (en-AU)
- Check currency code (AUD)
- Ensure decimal precision (2 places)

## Related Documentation

- [Invoice Service](../../../apps/backend/src/services/invoice.service.ts) - Backend invoice logic
- [Stripe Service](../../../apps/backend/src/services/stripe.service.ts) - Stripe integration
- [Invoice Routes](../../../apps/backend/src/routes/invoices.routes.ts) - API endpoints
- [Payment Routes](../../../apps/backend/src/routes/payment.routes.ts) - Payment API
- [Hybrid Booking Spec](../../../../Planning/specifications/Hybrid_Booking_Specification.md) - Hybrid lesson details

## Contact

For questions about payment testing:
- Check CLAUDE.md for project context
- Review Planning/12_Week_MVP_Plan.md for payment requirements
- See docs/testing-strategy.md for overall testing approach
