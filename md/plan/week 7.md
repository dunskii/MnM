# Week 7 - Invoicing & Payments System: Implementation Plan

**Plan Date**: 2025-12-24
**Duration**: 5 Days
**Focus**: Invoice Management & Payment Processing

---

## Executive Summary

Week 7 focuses on implementing a comprehensive invoicing and payment system for Music 'n Me. This builds upon the existing Stripe integration (registration payments) and extends it to support term-based invoicing, hybrid lesson billing calculations, pricing packages, and both online (Stripe) and manual payment recording.

**Current State:**
- ✅ Stripe integration exists for registration payments
- ✅ Invoice, InvoiceItem, Payment, and PricingPackage models exist in Prisma schema
- ✅ Email service exists with brand-compliant templates
- ✅ Multi-tenancy patterns established (schoolId filtering)

**Target State:**
- Full invoice CRUD with term-based generation
- Hybrid lesson billing calculations (group weeks vs individual weeks pricing)
- Stripe payment for invoices
- Manual payment recording
- Parent payment portal
- Admin invoice management

---

## Phase 1: Database Layer (Day 1 - Morning)

**Agent Assignment:** backend-architect

### 1.1 Review Existing Models

The Prisma schema already includes Invoice, InvoiceItem, Payment, and PricingPackage models. No schema changes required.

**Critical Files:**
- `apps/backend/prisma/schema.prisma` (lines 717-785)

**Existing Models:**
- `Invoice`: id, schoolId, familyId, termId, invoiceNumber, description, subtotal, tax, total, amountPaid, status, dueDate, sentAt, paidAt
- `InvoiceItem`: id, invoiceId, pricingPackageId, description, quantity, unitPrice, total
- `Payment`: id, invoiceId, amount, method, stripePaymentId, reference, notes, paidAt
- `PricingPackage`: id, schoolId, name, description, price, items, isActive

**Existing Enums:**
- `InvoiceStatus`: DRAFT, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED, REFUNDED
- `PaymentMethod`: STRIPE, BANK_TRANSFER, CASH, CHECK, OTHER

### 1.2 Invoice Number Generation Strategy

Use school settings JSON to store `lastInvoiceNumber` for atomic increments.
Format: `INV-{YYYY}-{SEQUENCE}` per school (e.g., `INV-2025-00001`)

### 1.3 Database Index Verification

Existing indexes (verify adequate):
- `@@index([schoolId])` on Invoice ✅
- `@@index([familyId])` on Invoice ✅
- `@@index([status])` on Invoice ✅
- `@@index([dueDate])` on Invoice ✅

---

## Phase 2: Pricing Package Service (Day 1 - Afternoon)

**Agent Assignment:** backend-architect

### 2.1 Create pricingPackage.service.ts

**File:** `apps/backend/src/services/pricingPackage.service.ts` (~150 lines)

**Functions:**
```typescript
getPricingPackages(schoolId: string): Promise<PricingPackage[]>
getPricingPackage(schoolId: string, packageId: string): Promise<PricingPackage | null>
createPricingPackage(schoolId: string, input: CreatePricingPackageInput): Promise<PricingPackage>
updatePricingPackage(schoolId: string, packageId: string, input: Partial<CreatePricingPackageInput>): Promise<PricingPackage>
deletePricingPackage(schoolId: string, packageId: string): Promise<void>
```

### 2.2 Pricing Package Validators

**File:** `apps/backend/src/validators/pricingPackage.validators.ts` (~50 lines)

Schemas:
- `createPricingPackageSchema` - name, description, price, items array
- `updatePricingPackageSchema` - partial update schema

---

## Phase 3: Invoice Service Layer (Day 2)

**Agent Assignment:** backend-architect

### 3.1 Create invoice.service.ts

**File:** `apps/backend/src/services/invoice.service.ts` (~600 lines)

**Core Functions:**

```typescript
// CRUD
getInvoices(schoolId: string, filters?: InvoiceFilters): Promise<InvoiceWithDetails[]>
getInvoice(schoolId: string, invoiceId: string): Promise<InvoiceWithDetails | null>
createInvoice(schoolId: string, input: CreateInvoiceInput): Promise<InvoiceWithDetails>
updateInvoice(schoolId: string, invoiceId: string, input: Partial<CreateInvoiceInput>): Promise<InvoiceWithDetails>
deleteInvoice(schoolId: string, invoiceId: string): Promise<void>
sendInvoice(schoolId: string, invoiceId: string): Promise<InvoiceWithDetails>

// Invoice Generation
generateTermInvoice(schoolId: string, familyId: string, termId: string): Promise<InvoiceWithDetails>
generateBulkTermInvoices(schoolId: string, termId: string, familyIds?: string[]): Promise<InvoiceWithDetails[]>

// Payment
recordManualPayment(schoolId: string, invoiceId: string, payment: RecordPaymentInput): Promise<Payment>
createInvoiceCheckoutSession(schoolId: string, userId: string, invoiceId: string, successUrl: string, cancelUrl: string): Promise<CheckoutResult>

// Parent
getFamilyInvoices(schoolId: string, familyId: string): Promise<InvoiceWithDetails[]>

// Internal
generateInvoiceNumber(schoolId: string): Promise<string>
calculateHybridLessonBilling(schoolId: string, lessonId: string, termId: string): Promise<HybridBillingResult>
updateInvoiceStatus(invoiceId: string): Promise<void>
```

### 3.2 Hybrid Lesson Billing Calculation (CRITICAL)

**Logic:**
```typescript
interface HybridBillingResult {
  groupWeeksCount: number;
  individualWeeksCount: number;
  groupWeeksPrice: number;
  individualWeeksPrice: number;
  totalPrice: number;
  lineItems: CreateInvoiceItemInput[];
}

// Calculate group vs individual weeks from HybridLessonPattern
// Apply different rates for each type
// Create separate line items for transparency
```

**Example Line Items:**
```
Invoice Line 1: "Piano Group Lessons - 8 weeks × $25/week" = $200
Invoice Line 2: "Piano Individual Sessions - 2 weeks × $40/week" = $80
Invoice Total: $280
```

### 3.3 Invoice Status Workflow

```
DRAFT → SENT (when sendInvoice called)
SENT → PARTIALLY_PAID (when payment < total)
SENT → PAID (when payment >= total)
SENT → OVERDUE (when past dueDate, cron job)
```

---

## Phase 4: Zod Validators for Invoices (Day 2 - Afternoon)

**Agent Assignment:** backend-architect

### 4.1 Create invoice.validators.ts

**File:** `apps/backend/src/validators/invoice.validators.ts` (~100 lines)

**Schemas:**
- `createInvoiceSchema` - familyId, termId, description, dueDate, items[]
- `updateInvoiceSchema` - partial update for DRAFT invoices
- `invoiceFiltersSchema` - familyId, termId, status, dueDateFrom, dueDateTo
- `recordPaymentSchema` - amount, method, reference, notes
- `createStripeCheckoutSchema` - successUrl, cancelUrl
- `generateTermInvoiceSchema` - termId, familyIds[]

---

## Phase 5: API Routes for Invoices (Day 3 - Morning)

**Agent Assignment:** backend-architect

### 5.1 Create invoice.routes.ts

**File:** `apps/backend/src/routes/invoice.routes.ts` (~300 lines)

**Admin Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /admin/invoices | List all invoices (with filters) | ADMIN |
| GET | /admin/invoices/:id | Get single invoice with details | ADMIN |
| POST | /admin/invoices | Create new invoice | ADMIN |
| PATCH | /admin/invoices/:id | Update invoice (if DRAFT) | ADMIN |
| DELETE | /admin/invoices/:id | Delete invoice (if DRAFT) | ADMIN |
| POST | /admin/invoices/:id/send | Send invoice to family | ADMIN |
| POST | /admin/invoices/:id/payment | Record manual payment | ADMIN |
| POST | /admin/invoices/generate | Generate term invoices (bulk) | ADMIN |

**Parent Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /parent/invoices | List family invoices | PARENT |
| GET | /parent/invoices/:id | Get single invoice | PARENT |
| POST | /parent/invoices/:id/pay | Create Stripe checkout | PARENT |
| GET | /parent/payments | Get payment history | PARENT |

### 5.2 Register Routes

**File:** `apps/backend/src/routes/index.ts`

Add: `router.use('/invoices', invoiceRoutes);`

---

## Phase 6: Extend Stripe Service for Invoice Payments (Day 3 - Afternoon)

**Agent Assignment:** backend-architect

### 6.1 Add Invoice Payment Functions

**File:** `apps/backend/src/services/stripe.service.ts` (modify, ~100 lines added)

**New Functions:**
```typescript
createInvoiceCheckoutSession(params: CreateInvoiceCheckoutParams): Promise<CheckoutSessionResult>
handleInvoicePaymentComplete(session: Stripe.Checkout.Session): Promise<void>
```

### 6.2 Update Webhook Handler

Add `checkout.session.completed` handling for `type === 'invoice_payment'`:
- Record payment in Payment table
- Update invoice amountPaid
- Update invoice status (PAID or PARTIALLY_PAID)
- Send payment receipt email

---

## Phase 7: Frontend API Layer (Day 4 - Morning)

**Agent Assignment:** frontend-developer

### 7.1 Create invoices.api.ts

**File:** `apps/frontend/src/api/invoices.api.ts` (~150 lines)

**Admin API:**
```typescript
adminInvoicesApi.getAll(filters?)
adminInvoicesApi.getById(id)
adminInvoicesApi.create(data)
adminInvoicesApi.update(id, data)
adminInvoicesApi.delete(id)
adminInvoicesApi.send(id)
adminInvoicesApi.recordPayment(id, data)
adminInvoicesApi.generateTermInvoices(termId, familyIds?)
```

**Parent API:**
```typescript
parentInvoicesApi.getAll()
parentInvoicesApi.getById(id)
parentInvoicesApi.createPaymentSession(id, successUrl, cancelUrl)
parentInvoicesApi.getPaymentHistory()
```

### 7.2 Create useInvoices Hook

**File:** `apps/frontend/src/hooks/useInvoices.ts` (~100 lines)

**Admin Hooks:**
- `useAdminInvoices(filters?)` - List invoices
- `useAdminInvoice(id)` - Single invoice
- `useCreateInvoice()` - Create mutation
- `useSendInvoice()` - Send mutation
- `useRecordPayment()` - Payment mutation
- `useGenerateTermInvoices()` - Generate mutation

**Parent Hooks:**
- `useParentInvoices()` - List invoices
- `useParentInvoice(id)` - Single invoice
- `useCreatePaymentSession()` - Stripe checkout mutation

---

## Phase 8: Admin Invoice Management Pages (Day 4 - Afternoon & Day 5 - Morning)

**Agent Assignment:** frontend-developer

### 8.1 Create InvoicesPage.tsx

**File:** `apps/frontend/src/pages/admin/InvoicesPage.tsx` (~400 lines)

**Features:**
- List all invoices with filters (status, term, family)
- Status badges with brand colors
- Quick actions (View, Send, Record Payment)
- Generate invoices button
- Pagination and search

**Brand-Compliant Status Colors:**
```typescript
const statusColors = {
  DRAFT: { bg: '#FCF6E6', text: '#9DA5AF' },        // Cream/Grey
  SENT: { bg: '#a3d9f6', text: '#4580E4' },         // Light Blue
  PAID: { bg: '#96DAC9', text: '#080808' },         // Mint (success)
  PARTIALLY_PAID: { bg: '#FFCE00', text: '#080808' }, // Yellow
  OVERDUE: { bg: '#FFAE9E', text: '#ff4040' },      // Coral (warning)
  CANCELLED: { bg: '#e0e0e0', text: '#9DA5AF' },    // Grey
  REFUNDED: { bg: '#e0e0e0', text: '#9DA5AF' },     // Grey
};
```

### 8.2 Create InvoiceDetailPage.tsx

**File:** `apps/frontend/src/pages/admin/InvoiceDetailPage.tsx` (~350 lines)

**Features:**
- Invoice header with status, dates, amounts
- Line items table (editable if DRAFT)
- Payment history section
- Actions: Edit, Send, Record Payment, Download PDF

### 8.3 Create GenerateInvoicesDialog.tsx

**File:** `apps/frontend/src/components/invoices/GenerateInvoicesDialog.tsx` (~150 lines)

**Features:**
- Select term
- Select families (all or specific)
- Preview calculation
- Generate button

### 8.4 Create RecordPaymentDialog.tsx

**File:** `apps/frontend/src/components/invoices/RecordPaymentDialog.tsx` (~150 lines)

**Features:**
- Amount field (pre-filled with remaining balance)
- Payment method dropdown
- Reference field
- Notes field

### 8.5 Create InvoiceStatusBadge.tsx

**File:** `apps/frontend/src/components/invoices/InvoiceStatusBadge.tsx` (~50 lines)

---

## Phase 9: Parent Payment Pages (Day 5 - Afternoon)

**Agent Assignment:** frontend-developer

### 9.1 Update ParentDashboardPage.tsx

**File:** `apps/frontend/src/pages/parent/ParentDashboardPage.tsx` (modify)

Add "Outstanding Invoices" section:
- List unpaid invoices
- Due date indicators (color-coded)
- "Pay Now" button for each

### 9.2 Create PaymentPage.tsx

**File:** `apps/frontend/src/pages/parent/PaymentPage.tsx` (~250 lines)

**Features:**
- Invoice details display
- Amount to pay (full or partial)
- "Pay with Card" button (Stripe Checkout)
- Payment success/failure handling

### 9.3 Create PaymentHistoryPage.tsx

**File:** `apps/frontend/src/pages/parent/PaymentHistoryPage.tsx` (~200 lines)

**Features:**
- List of all payments
- Filter by date range
- Link to related invoice

---

## Phase 10: Testing & Integration (Day 5 - End of Day)

**Agent Assignment:** testing-qa-specialist

### 10.1 Backend Integration Tests

**File:** `apps/backend/tests/integration/invoices.routes.test.ts` (~500 lines)

**Test Cases:**
1. Admin can create invoice
2. Admin can update DRAFT invoice
3. Admin cannot update SENT invoice
4. Admin can send invoice (status changes)
5. Admin can record manual payment
6. Manual payment updates invoice amountPaid
7. Full payment changes status to PAID
8. Partial payment changes status to PARTIALLY_PAID
9. Admin can generate term invoices
10. Hybrid lesson billing calculates correctly
11. Parent can view own invoices
12. Parent cannot view other family invoices
13. Parent can create payment session
14. Multi-tenancy: School A cannot see School B invoices

### 10.2 Add Email Templates for Invoices

**File:** `apps/backend/src/services/email.service.ts` (modify, ~100 lines added)

**New Functions:**
- `sendInvoiceEmail(to, data)` - Invoice sent notification
- `sendPaymentReminderEmail(to, data)` - 7 days before due date
- `sendOverdueNoticeEmail(to, data)` - 1 day after due date

---

## Multi-Tenancy Security Checklist

**ALL database queries MUST include schoolId filter:**

| Query | schoolId Required | Verification |
|-------|-------------------|--------------|
| getInvoices | YES | WHERE clause |
| getInvoice | YES | findFirst WHERE |
| createInvoice | YES | Verify family belongs to school |
| updateInvoice | YES | Verify invoice belongs to school |
| deleteInvoice | YES | Verify invoice belongs to school |
| sendInvoice | YES | Verify invoice belongs to school |
| recordPayment | YES | Verify invoice belongs to school |
| generateTermInvoice | YES | Verify term & family belong to school |
| getFamilyInvoices | YES | Verify parent belongs to school |
| createInvoiceCheckoutSession | YES | Verify parent owns invoice |

---

## Risk Assessment

### High Priority Risks

| Risk | Mitigation |
|------|------------|
| Payment Security (PCI) | Use Stripe hosted checkout, verify webhook signatures, HTTPS only |
| Multi-Tenancy Data Isolation | schoolId in every query, integration tests for cross-school access |
| Complex Hybrid Billing | Unit tests for billing logic, preview before generating |

### Medium Priority Risks

| Risk | Mitigation |
|------|------------|
| Stripe Webhook Reliability | Idempotency keys, retry logic, fallback manual verification |
| Invoice Number Uniqueness | Atomic increment in school settings, unique constraint |

---

## File Creation Summary

### Backend Files to Create:
| File | Lines | Agent |
|------|-------|-------|
| `src/services/pricingPackage.service.ts` | ~150 | backend-architect |
| `src/services/invoice.service.ts` | ~600 | backend-architect |
| `src/validators/pricingPackage.validators.ts` | ~50 | backend-architect |
| `src/validators/invoice.validators.ts` | ~100 | backend-architect |
| `src/routes/invoice.routes.ts` | ~300 | backend-architect |
| `tests/integration/invoices.routes.test.ts` | ~500 | testing-qa-specialist |

### Backend Files to Modify:
| File | Changes | Agent |
|------|---------|-------|
| `src/services/stripe.service.ts` | Add invoice payment functions | backend-architect |
| `src/services/email.service.ts` | Add invoice email templates | backend-architect |
| `src/routes/index.ts` | Register invoice routes | backend-architect |
| `src/services/index.ts` | Export new services | backend-architect |

### Frontend Files to Create:
| File | Lines | Agent |
|------|-------|-------|
| `src/api/invoices.api.ts` | ~150 | frontend-developer |
| `src/hooks/useInvoices.ts` | ~100 | frontend-developer |
| `src/pages/admin/InvoicesPage.tsx` | ~400 | frontend-developer |
| `src/pages/admin/InvoiceDetailPage.tsx` | ~350 | frontend-developer |
| `src/pages/parent/PaymentPage.tsx` | ~250 | frontend-developer |
| `src/pages/parent/PaymentHistoryPage.tsx` | ~200 | frontend-developer |
| `src/components/invoices/GenerateInvoicesDialog.tsx` | ~150 | frontend-developer |
| `src/components/invoices/RecordPaymentDialog.tsx` | ~150 | frontend-developer |
| `src/components/invoices/InvoiceStatusBadge.tsx` | ~50 | frontend-developer |

### Frontend Files to Modify:
| File | Changes | Agent |
|------|---------|-------|
| `src/pages/parent/ParentDashboardPage.tsx` | Add outstanding invoices section | frontend-developer |
| `src/routes/Router.tsx` | Add new routes | frontend-developer |

---

## Implementation Timeline

| Day | Phase | Tasks |
|-----|-------|-------|
| **Day 1 AM** | Phase 1 | Database review, verify indexes |
| **Day 1 PM** | Phase 2 | PricingPackage service + validators |
| **Day 2 AM** | Phase 3 | Invoice service (core logic, billing calculations) |
| **Day 2 PM** | Phase 3-4 | Invoice service completion + validators |
| **Day 3 AM** | Phase 5 | Invoice routes (admin + parent) |
| **Day 3 PM** | Phase 6 | Stripe invoice payments |
| **Day 4 AM** | Phase 7 | Frontend API + hooks |
| **Day 4 PM** | Phase 8 | Admin InvoicesPage + detail page |
| **Day 5 AM** | Phase 8-9 | Admin dialogs, parent pages |
| **Day 5 PM** | Phase 10 | Integration tests, email templates |

---

## Critical Reference Files

1. **`apps/backend/prisma/schema.prisma`** - Invoice, Payment, PricingPackage models
2. **`apps/backend/src/services/stripe.service.ts`** - Existing Stripe patterns
3. **`apps/backend/src/services/hybridBooking.service.ts`** - Hybrid lesson patterns reference
4. **`apps/backend/src/services/lesson.service.ts`** - Service layer patterns
5. **`apps/frontend/src/pages/teacher/TeacherDashboardPage.tsx`** - Dashboard layout patterns

---

## Success Criteria

- [ ] Invoice CRUD working with proper multi-tenancy
- [ ] Hybrid lesson billing calculates group/individual weeks correctly
- [ ] Invoice number generation is unique per school
- [ ] Manual payment recording works
- [ ] Stripe payment creates checkout session
- [ ] Webhook records payment and updates invoice status
- [ ] Parent can only see/pay own family invoices
- [ ] Admin can generate bulk term invoices
- [ ] All tests passing (50+ backend tests)
- [ ] Email notifications sent on invoice actions
- [ ] Frontend matches brand guidelines
