# WEEK 7 RESEARCH REPORT: Invoicing & Payments System

**Research Date**: 2025-12-24
**Status**: Ready for Implementation

---

## EXECUTIVE SUMMARY

Week 7 focuses on **Invoice Management & Payment Processing** - the financial backbone of the platform. This week builds on the Stripe integration foundation (Meet & Greet registration payments from Week 3) and implements comprehensive invoicing for lessons with flexible pricing models including term-based billing, pricing packages, and add-ons.

**Current Status**: ~50% infrastructure ready
- ✅ Stripe service exists and handles registration payments
- ✅ Payment routes for checkout and webhooks exist
- ✅ Prisma schema has Invoice, InvoiceItem, Payment, and RegistrationPayment models
- ❌ NO invoice service, API routes, or frontend pages exist yet

---

## WEEK 7 OBJECTIVES (from 12_Week_MVP_Plan.md)

### Days 1-2: Stripe Integration
- [x] Stripe account setup (already done Week 3)
- [x] Payment intent creation (already done Week 3)
- [x] Stripe webhook handler (already done Week 3)
- [x] Payment confirmation flow (already done Week 3)

### Days 3-4: Invoicing System ⭐ CRITICAL

**Pricing Model** (NEW for Week 7):
- **Packages**: Pre-defined lesson bundles (e.g., "Beginner Piano - Term 1")
- **Base Price + Add-ons**: Flexible pricing with optional add-ons (e.g., materials fee, performance fee)
- Admin can create/edit packages and add-ons

**Invoice Generation**:
- Create invoice per term
- Calculate total for student's enrolled lessons
- Apply package pricing or custom pricing
- Add selected add-ons to invoice
- **Hybrid lesson billing logic** (CRITICAL):
  - Count group weeks vs individual weeks in term
  - Apply correct pricing for each type
  - Create separate line items for clarity
- Generate invoice number
- Due date tracking
- **Term-based billing only** (no monthly subscription for MVP)

**Payment Recording**:
- Stripe payments
- Manual payments (bank transfer, cash, check)
- Payment history per student/family

### Day 5: Payment Frontend
- Parent payment page
- View outstanding invoices
- Pay via Stripe
- Payment history
- Admin invoice management
- Create invoices for term
- Mark manual payments
- View payment reports

---

## DATABASE MODELS & RELATIONSHIPS

### Invoice Model Structure
```prisma
model Invoice {
  id            String        @id @default(uuid())
  schoolId      String        // CRITICAL: Always filter by this
  familyId      String        // Link to family (can have multiple students)
  termId        String?       // Link to term
  invoiceNumber String        // Unique per school
  description   String?
  subtotal      Decimal       @db.Decimal(10, 2)
  tax           Decimal       @default(0) @db.Decimal(10, 2)
  total         Decimal       @db.Decimal(10, 2)
  amountPaid    Decimal       @default(0)
  status        InvoiceStatus @default(DRAFT)
  dueDate       DateTime
  sentAt        DateTime?
  paidAt        DateTime?

  // Relations
  school   School        @relation(...)
  family   Family        @relation(...)
  term     Term?         @relation(...)
  items    InvoiceItem[] // Line items
  payments Payment[]     // Payment history
}
```

### InvoiceStatus Enum
```typescript
enum InvoiceStatus {
  DRAFT            // Not yet sent
  SENT             // Sent to parent
  PAID             // Fully paid
  PARTIALLY_PAID   // Some payment received
  OVERDUE          // Past due date
  CANCELLED        // Cancelled/voided
  REFUNDED         // Refund issued
}
```

### Payment Model Structure
```prisma
model Payment {
  id              String        @id @default(uuid())
  invoiceId       String        // Link to invoice
  amount          Decimal       @db.Decimal(10, 2)
  method          PaymentMethod // STRIPE, BANK_TRANSFER, CASH, CHECK, OTHER
  stripePaymentId String?       // Link to Stripe payment intent
  reference       String?       // Bank transfer ref, check number, etc.
  notes           String?
  paidAt          DateTime      @default(now())

  // Relations
  invoice Invoice @relation(...)
}
```

### Pricing Models
```prisma
model PricingPackage {
  id          String   @id @default(uuid())
  schoolId    String
  name        String   // e.g., "Beginner Piano - Term"
  description String?
  price       Decimal  @db.Decimal(10, 2)
  items       Json     // Array of included items
  isActive    Boolean  @default(true)

  // Relations
  school       School        @relation(...)
  invoiceItems InvoiceItem[]
}

model InvoiceItem {
  id               String   @id @default(uuid())
  invoiceId        String
  pricingPackageId String?  // Optional: link to package
  description      String   // e.g., "Group Piano - 10 weeks"
  quantity         Int      @default(1)
  unitPrice        Decimal  @db.Decimal(10, 2)
  total            Decimal  @db.Decimal(10, 2)

  // Relations
  invoice        Invoice         @relation(...)
  pricingPackage PricingPackage? @relation(...)
}
```

---

## CRITICAL BUSINESS LOGIC: HYBRID LESSON BILLING

**From 12_Week_MVP_Plan.md:**

> "**Hybrid lesson billing logic** (CRITICAL):
> - Count group weeks vs individual weeks in term
> - Apply correct pricing for each type
> - Create separate line items for clarity"

### Implementation Requirements:

1. **Pricing Model Decision**:
   - **Option A**: Single term price (group + individual combined)
   - **Option B**: Split pricing (group weeks rate + individual weeks rate)
   - **RECOMMENDED**: Option B for transparency

2. **Calculation Logic**:
   ```
   Group Weeks Cost = (Group rate per session) × (Number of group weeks in term)
   Individual Weeks Cost = (Individual rate per session) × (Number of individual weeks in term)
   Total Term Price = Group Cost + Individual Cost
   ```

3. **Line Items Example**:
   ```
   Invoice Line 1: "Piano Group Lessons - 8 weeks × $25/week" = $200
   Invoice Line 2: "Piano Individual Sessions - 2 weeks × $40/week" = $80
   Invoice Total: $280
   ```

4. **Related Data Sources**:
   - `HybridLessonPattern.groupWeeks` - Array of week numbers (e.g., [1,2,3,5,6,7,9,10])
   - `HybridLessonPattern.individualWeeks` - Array of week numbers (e.g., [4,8])
   - Lesson pricing configuration (to be defined in Week 7)
   - Term dates to calculate week count

---

## SECURITY CONSIDERATIONS - CRITICAL

### Multi-Tenancy (schoolId Filtering)
**EVERY invoice query must filter by schoolId:**
```typescript
// ✅ CORRECT
const invoices = await prisma.invoice.findMany({
  where: {
    schoolId: req.user.schoolId,
    familyId: familyId
  }
});

// ❌ WRONG - SECURITY BREACH
const invoices = await prisma.invoice.findMany({
  where: { familyId: familyId }
});
```

### Role-Based Access Control
- **ADMIN**: Create, edit, delete invoices; record manual payments; view all invoices
- **PARENT**: View their own invoices; make payments; view payment history
- **TEACHER**: NO access to invoicing (cannot create/modify invoices)
- **STUDENT**: NO access to invoicing

### Payment Security
- Always use Stripe for credit card processing (PCI compliance)
- Store only Stripe payment intent IDs, never store card details
- Verify webhook signatures on all Stripe events
- Implement idempotency for payment operations

---

## API ENDPOINTS TO IMPLEMENT

### Admin Invoicing Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/invoices` | GET | List invoices with filters |
| `/api/v1/admin/invoices/generate` | POST | Generate invoices for term/families |
| `/api/v1/admin/invoices/:id` | GET | Get invoice detail |
| `/api/v1/admin/invoices/:id` | PATCH | Edit invoice |
| `/api/v1/admin/invoices/:id` | DELETE | Cancel invoice |
| `/api/v1/admin/invoices/:id/send` | POST | Send invoice to parent |
| `/api/v1/admin/invoices/:id/manual-payment` | POST | Record manual payment |

### Parent Payment Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/parent/invoices` | GET | List my invoices |
| `/api/v1/parent/invoices/:id/checkout` | POST | Create Stripe payment session |
| `/api/v1/parent/invoices/:id/payments` | GET | Get payment history |

### Pricing Package Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/pricing-packages` | GET | List pricing packages |
| `/api/v1/admin/pricing-packages` | POST | Create package |
| `/api/v1/admin/pricing-packages/:id` | PATCH | Update package |
| `/api/v1/admin/pricing-packages/:id` | DELETE | Delete package |

---

## FRONTEND PAGES TO BUILD

### Admin Pages
1. **Invoice Management Page** - List view with filters, search, status indicators
2. **Generate Invoice Form** - Multi-step wizard or single page
3. **Invoice Detail Page** - Display invoice with line items and payment history
4. **Payment Recording Modal** - Form for manual payment entry
5. **Pricing Package Management Page** - CRUD for pricing packages

### Parent Pages
1. **Invoices View** - Outstanding invoices widget with "Pay Now" button
2. **Invoice Detail Modal/Page** - Full invoice breakdown
3. **Payment Success Page** - Confirmation after Stripe payment
4. **Payment History View** - List of all past payments

---

## FILES TO CREATE

### Backend (New Files)
```
apps/backend/src/services/invoice.service.ts       (600-800 lines)
apps/backend/src/routes/invoices.routes.ts         (400-500 lines)
apps/backend/src/validators/invoice.validators.ts  (150-200 lines)
apps/backend/src/services/pricingPackage.service.ts (300-400 lines)
apps/backend/src/routes/pricingPackage.routes.ts   (200-300 lines)
apps/backend/src/tests/invoice.test.ts             (600-800 lines)
```

### Frontend (New Files)
```
apps/frontend/src/api/invoices.api.ts              (200-300 lines)
apps/frontend/src/hooks/useInvoices.ts             (300-400 lines)
apps/frontend/src/pages/admin/InvoicesPage.tsx     (500-600 lines)
apps/frontend/src/pages/admin/GenerateInvoicePage.tsx (400-500 lines)
apps/frontend/src/pages/admin/InvoiceDetailPage.tsx (300-400 lines)
apps/frontend/src/pages/parent/InvoicesPage.tsx    (300-400 lines)
apps/frontend/src/pages/parent/PaymentPage.tsx     (300-400 lines)
apps/frontend/src/components/invoices/*            (various components)
```

### Files to Modify
```
apps/backend/src/routes/index.ts                   (add invoice routes)
apps/backend/src/services/stripe.service.ts        (extend for invoice payments)
apps/backend/src/services/email.service.ts         (add invoice email templates)
apps/frontend/src/routes/Router.tsx                (add new routes)
apps/frontend/src/pages/admin/AdminDashboardPage.tsx (add invoices widget)
apps/frontend/src/pages/parent/ParentDashboardPage.tsx (add invoices widget)
```

---

## IMPLEMENTATION SEQUENCE

1. **Invoice Service** - Complex business logic needed first
2. **API Routes** - Implement endpoints following service layer
3. **Frontend API Client** - Test endpoints while building UI
4. **Admin UI** - Invoice management pages
5. **Parent UI** - Payment pages
6. **Comprehensive Testing** - Critical for financial operations

---

## DEPENDENCIES

### Week 7 Depends On (All Complete):
- ✅ Week 2: Family accounts (multiple students)
- ✅ Week 2: Terms configuration
- ✅ Week 3: Stripe integration foundation
- ✅ Week 4: Lesson management and enrollment
- ✅ Week 5: Hybrid lesson patterns

### Week 8+ Depends On Week 7:
- Google Drive integration (to store invoice PDFs)
- Email notifications (invoice sent, payment received, overdue reminders)
- Phase 2: Monthly subscription billing
- Phase 2: Xero integration

---

## TESTING REQUIREMENTS

### Backend Tests (58+ recommended)
- Invoice generation: happy path, edge cases, hybrid pricing
- Payment recording: Stripe, manual, multiple payments, partial payments
- Multi-tenancy: Cannot access other school's invoices
- Role-based access: Only ADMIN can create invoices
- Validators: Invalid data rejection
- Hybrid billing: Group/individual week calculations

### Frontend Tests
- Invoice list filtering and searching
- Payment form submission and validation
- Stripe checkout integration (mock)
- Error handling and edge cases

### Integration Tests
- Complete flow: Generate → Send → Pay → Record
- Stripe webhook payment confirmation
- Email notifications sent

---

## CRITICAL CHECKLIST FOR WEEK 7 SUCCESS

- [ ] Invoice generation algorithm handles hybrid lessons correctly
- [ ] All invoice queries filter by schoolId (100% multi-tenancy)
- [ ] Role-based access control enforced (ADMIN only for admin endpoints)
- [ ] Stripe payments linked to invoices properly
- [ ] Manual payment recording works
- [ ] Invoice statuses update correctly (DRAFT → SENT → PAID/OVERDUE)
- [ ] Parent can view and pay only their invoices
- [ ] Email notifications sent (invoice created, payment received)
- [ ] Invoice number generation is unique per school
- [ ] All tests passing (58+ tests recommended)
- [ ] Frontend pages are brand-compliant
- [ ] Responsive design for mobile
- [ ] Error handling for all edge cases
- [ ] Payment security verified (never store card details)

---

## REFERENCE DOCUMENTS

**Essential for Week 7 Implementation:**
1. `/Planning/roadmaps/12_Week_MVP_Plan.md` - Week 7 overview
2. `/Planning/roadmaps/Development_Task_List.md` - Detailed task breakdown
3. `/apps/backend/prisma/schema.prisma` - Invoice/Payment models

**Reference Implementations:**
- `apps/backend/src/services/lesson.service.ts` - Service patterns
- `apps/backend/src/services/hybridBooking.service.ts` - Complex business logic
- `apps/backend/src/services/notes.service.ts` - Another good example
- `apps/frontend/src/pages/admin/LessonsPage.tsx` - Admin page patterns
