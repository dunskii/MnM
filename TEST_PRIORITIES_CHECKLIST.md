# Test Priorities Checklist - MVP Launch Preparation
**Target Date:** Before MVP Launch (Week 12)
**Priority:** CRITICAL - Must Complete Before Production

---

## CRITICAL - Priority 1: Payment & Financial (Days 1-3)

### Day 1: Stripe Payment Tests

#### Backend Unit Tests
- [ ] **tests/unit/services/stripe.service.test.ts**
  - [ ] `createPaymentIntent()` - Test amount calculation, currency, metadata
  - [ ] `confirmPayment()` - Test successful confirmation
  - [ ] `handleWebhook()` - Test signature verification
  - [ ] `handlePaymentSuccess()` - Test invoice update, notification
  - [ ] `handlePaymentFailed()` - Test retry logic, notification
  - [ ] `processRefund()` - Test partial and full refunds
  - [ ] `getPaymentStatus()` - Test status mapping
  - [ ] **Error scenarios:**
    - [ ] Card declined (insufficient_funds, do_not_honor, etc.)
    - [ ] Network failure (timeout, connection error)
    - [ ] Invalid API key
    - [ ] Invalid webhook signature
    - [ ] Idempotency key conflicts
  - [ ] **Multi-tenancy:**
    - [ ] Stripe account isolation per school
    - [ ] Payment metadata includes schoolId
    - [ ] Cannot process payment for other school

#### Backend Integration Tests
- [ ] **tests/integration/payment.routes.test.ts**
  - [ ] `POST /api/v1/payment/create-intent` - Create payment intent
  - [ ] `POST /api/v1/payment/confirm` - Confirm payment
  - [ ] `POST /api/v1/payment/webhook` - Stripe webhook endpoint
  - [ ] `GET /api/v1/payment/:id/status` - Get payment status
  - [ ] `POST /api/v1/payment/:id/refund` - Process refund (admin only)
  - [ ] **Security:**
    - [ ] Requires authentication
    - [ ] Parent can only pay own invoices
    - [ ] Admin can refund any payment in their school
    - [ ] Cannot refund payment from another school
  - [ ] **Webhook tests:**
    - [ ] Valid signature accepted
    - [ ] Invalid signature rejected
    - [ ] Duplicate events handled (idempotency)

**Success Criteria:**
- [ ] 100% Stripe service coverage
- [ ] All error scenarios tested
- [ ] Multi-tenancy verified
- [ ] Webhook security tested

---

### Day 2: Invoice Calculation Tests

#### Backend Unit Tests
- [ ] **tests/unit/services/invoice.service.test.ts**
  - [ ] `createInvoice()` - Basic invoice creation
  - [ ] `calculateInvoiceTotal()` - Sum of line items
  - [ ] `addLineItem()` - Add lesson, package, or custom item
  - [ ] `calculateLessonCost()` - Single student, single lesson
  - [ ] `calculatePricingPackage()` - Base price + add-ons
  - [ ] `applyDiscount()` - Fixed and percentage discounts
  - [ ] `calculateTax()` - Tax calculation (if applicable)
  - [ ] `calculateMultiStudentDiscount()` - Family discounts
  - [ ] `generateInvoiceNumber()` - Unique invoice numbers per school
  - [ ] `getInvoicesByFamily()` - Family invoice history
  - [ ] `markAsPaid()` - Update status, record payment
  - [ ] **Edge cases:**
    - [ ] Zero amount invoice
    - [ ] Negative line item (credit)
    - [ ] Multiple discounts stacking
    - [ ] Rounding errors (currency precision)
  - [ ] **Multi-tenancy:**
    - [ ] Invoice numbers unique per school (not global)
    - [ ] Cannot access invoices from other schools
    - [ ] Cannot add line items from other school's lessons

#### Backend Integration Tests
- [ ] **tests/integration/invoices.routes.test.ts** (enhance existing)
  - [ ] Verify calculation accuracy in API responses
  - [ ] Test invoice creation with multiple line items
  - [ ] Test pricing package application
  - [ ] Test discount codes
  - [ ] Test multi-student family invoices

**Success Criteria:**
- [ ] 100% invoice calculation coverage
- [ ] All pricing scenarios tested
- [ ] Rounding/precision correct
- [ ] Multi-tenancy verified

---

### Day 3: E2E Payment Flow

#### E2E Test Enhancement
- [ ] **apps/frontend/e2e/flows/payment.spec.ts** (enhance existing)
  - [ ] **Parent invoice payment flow:**
    - [ ] Navigate to invoices page
    - [ ] View invoice details (line items, total)
    - [ ] Click "Pay Now" button
    - [ ] Enter Stripe test card (4242 4242 4242 4242)
    - [ ] Submit payment
    - [ ] See payment success message
    - [ ] Invoice status updated to "Paid"
    - [ ] Receipt email queued
  - [ ] **Error handling:**
    - [ ] Declined card (4000 0000 0000 0002)
    - [ ] Expired card (4000 0000 0000 0069)
    - [ ] Insufficient funds (4000 0000 0000 9995)
    - [ ] Show appropriate error messages
    - [ ] Invoice remains unpaid
  - [ ] **Admin refund flow:**
    - [ ] Admin views paid invoice
    - [ ] Click "Refund" button
    - [ ] Confirm refund
    - [ ] See refund success message
    - [ ] Invoice status updated to "Refunded"

**Success Criteria:**
- [ ] Complete payment flow tested
- [ ] Error scenarios verified
- [ ] Refund flow tested

---

## CRITICAL - Priority 2: Password Security (Day 4)

### Backend Unit Tests
- [ ] **tests/unit/services/password.service.test.ts**
  - [ ] `validatePasswordStrength()` - All strength rules
    - [ ] Minimum 8 characters
    - [ ] At least 1 uppercase letter
    - [ ] At least 1 lowercase letter
    - [ ] At least 1 number
    - [ ] At least 1 special character
  - [ ] `checkCommonPassword()` - Reject common passwords
    - [ ] Test against 10,000+ common passwords
    - [ ] Case-insensitive checking
  - [ ] `checkPersonalInfo()` - Detect personal info
    - [ ] Email in password
    - [ ] Name in password
    - [ ] Username in password
    - [ ] School name in password
  - [ ] `checkBreachedPassword()` - HIBP API integration
    - [ ] k-anonymity implementation (only send first 5 chars of hash)
    - [ ] Handle API timeout gracefully
    - [ ] Reject breached passwords
    - [ ] Log breach attempts
  - [ ] `hashPassword()` - bcrypt with 12 rounds minimum
  - [ ] `verifyPassword()` - Constant-time comparison
  - [ ] `addToPasswordHistory()` - Store last 5 hashes
  - [ ] `checkPasswordHistory()` - Prevent reuse of last 5
  - [ ] `recordFailedAttempt()` - Track failures
  - [ ] `checkRateLimit()` - Max 5 failures per 15 min
  - [ ] `resetRateLimit()` - Clear on successful login

#### Backend Integration Tests
- [ ] **tests/integration/auth.test.ts** (enhance existing)
  - [ ] **Password validation on registration:**
    - [ ] Weak password rejected
    - [ ] Common password rejected
    - [ ] Password with email rejected
    - [ ] Breached password rejected (if HIBP available)
    - [ ] Strong password accepted
  - [ ] **Password change endpoint:**
    - [ ] Requires current password
    - [ ] New password must meet strength requirements
    - [ ] Cannot reuse last 5 passwords
    - [ ] Rate limiting enforced
  - [ ] **Login rate limiting:**
    - [ ] Allow 5 failures
    - [ ] Block on 6th failure
    - [ ] Reset after 15 minutes
    - [ ] Show remaining attempts

**Success Criteria:**
- [ ] 100% password service coverage
- [ ] All security features tested
- [ ] HIBP integration tested
- [ ] Rate limiting verified

---

## CRITICAL - Priority 3: Core Business Logic (Days 5-7)

### Day 5: Hybrid Booking Service

#### Backend Unit Tests
- [ ] **tests/unit/services/hybridBooking.service.test.ts**
  - [ ] `createHybridPattern()` - Pattern validation
    - [ ] ALTERNATE pattern (week 1 group, week 2 individual, etc.)
    - [ ] CUSTOM pattern (specific weeks array)
    - [ ] Invalid patterns rejected
  - [ ] `generateBookingSlots()` - Slot generation
    - [ ] Calculate slots based on duration
    - [ ] No overlapping slots
    - [ ] Respect booking deadline (24h)
  - [ ] `getAvailableSlots()` - Availability check
    - [ ] Filter booked slots
    - [ ] Filter past slots
    - [ ] Only individual weeks
  - [ ] `createBooking()` - Booking creation
    - [ ] Parent can only book for own children
    - [ ] Student must be enrolled
    - [ ] Week must be individual week
    - [ ] Slot must be available
    - [ ] Must be 24h before session
  - [ ] `checkConflicts()` - Conflict detection
    - [ ] Teacher availability
    - [ ] Room availability
    - [ ] Student not double-booked
  - [ ] `rescheduleBooking()` - Reschedule with 24h rule
  - [ ] `cancelBooking()` - Cancellation with reason
  - [ ] `getBookingsByParent()` - Filter by parent
  - [ ] `getBookingStats()` - Completion rate, etc.
  - [ ] **Multi-tenancy:**
    - [ ] Parent cannot book in other school
    - [ ] Parent cannot book other family's children
    - [ ] Cannot see bookings from other schools

**Success Criteria:**
- [ ] 80%+ hybrid booking service coverage
- [ ] All business rules tested
- [ ] Multi-tenancy verified

---

### Day 6: Meet & Greet Service

#### Backend Unit Tests
- [ ] **tests/unit/services/meetAndGreet.service.test.ts**
  - [ ] `createBooking()` - Public booking (no auth)
    - [ ] Capture 2 contacts + emergency
    - [ ] Validate email format
    - [ ] Validate phone format
    - [ ] Generate verification token
  - [ ] `verifyEmail()` - Email verification
    - [ ] Valid token accepted
    - [ ] Expired token rejected
    - [ ] Token can only be used once
  - [ ] `getAvailableSlots()` - Admin-defined slots
  - [ ] `updateBookingStatus()` - Admin approval
  - [ ] `convertToFamily()` - Convert approved booking to family
    - [ ] Create family
    - [ ] Create parents (2 contacts)
    - [ ] Create emergency contact
    - [ ] Pre-populate registration data
  - [ ] `sendReminderEmails()` - 24h before appointment
  - [ ] `handleNoShow()` - Mark as no-show
  - [ ] **Multi-tenancy:**
    - [ ] Booking tied to specific school
    - [ ] Cannot access bookings from other schools
    - [ ] Admin can only approve for own school

#### Backend Integration Tests
- [ ] **tests/integration/meetAndGreet.routes.test.ts**
  - [ ] `POST /api/v1/meet-and-greet/book` - Public booking (no auth)
  - [ ] `POST /api/v1/meet-and-greet/verify-email` - Email verification
  - [ ] `GET /api/v1/meet-and-greet/available-slots` - Get slots
  - [ ] `GET /api/v1/meet-and-greet/bookings` - Admin list (auth required)
  - [ ] `PATCH /api/v1/meet-and-greet/:id/approve` - Admin approval
  - [ ] `POST /api/v1/meet-and-greet/:id/convert` - Convert to family
  - [ ] **Security:**
    - [ ] Public endpoints work without auth
    - [ ] Admin endpoints require auth
    - [ ] Multi-tenancy enforced

**Success Criteria:**
- [ ] 80%+ meet & greet coverage
- [ ] Email verification tested
- [ ] Conversion workflow tested
- [ ] Public access tested

---

### Day 7: Lesson Service Enhancement

#### Backend Unit Tests
- [ ] **tests/unit/services/lesson.service.test.ts** (enhance existing)
  - [ ] `createLesson()` - Lesson creation
    - [ ] Validate all required fields
    - [ ] Check room availability
    - [ ] Check teacher availability
    - [ ] Create recurring instances for term
    - [ ] Hybrid lessons get pattern
  - [ ] `enrollStudent()` - Enrollment
    - [ ] Check capacity
    - [ ] Check student eligibility
    - [ ] Prevent duplicate enrollment
  - [ ] `unenrollStudent()` - Remove enrollment
  - [ ] `checkCapacity()` - Capacity checking
  - [ ] `getConflictingLessons()` - Schedule conflicts
  - [ ] `getLessonsByTeacher()` - Filter by teacher
  - [ ] `getLessonsByStudent()` - Filter by student
  - [ ] `getLessonsByTerm()` - Filter by term
  - [ ] **Multi-tenancy:**
    - [ ] All queries filter by schoolId
    - [ ] Cannot enroll students from other schools
    - [ ] Cannot assign teachers from other schools

**Success Criteria:**
- [ ] 80%+ lesson service coverage (currently only reschedule tested)
- [ ] CRUD operations tested
- [ ] Enrollment logic tested
- [ ] Multi-tenancy verified

---

## HIGH PRIORITY - Week 13-14

### Missing Route Integration Tests

- [ ] **tests/integration/calendar.routes.test.ts**
  - [ ] GET /api/v1/calendar/events
  - [ ] GET /api/v1/calendar/events/:id
  - [ ] POST /api/v1/calendar/reschedule (admin only)
  - [ ] Multi-tenancy (only school events)

- [ ] **tests/integration/families.routes.test.ts**
  - [ ] CRUD operations
  - [ ] Add/remove students
  - [ ] Add/remove parents
  - [ ] Multi-tenancy security

- [ ] **tests/integration/parents.routes.test.ts**
  - [ ] CRUD operations
  - [ ] Contact management
  - [ ] Multi-tenancy security

- [ ] **tests/integration/students.routes.test.ts**
  - [ ] CRUD operations
  - [ ] Enrollment management
  - [ ] Multi-tenancy security

- [ ] **tests/integration/teachers.routes.test.ts**
  - [ ] CRUD operations
  - [ ] Instrument assignment
  - [ ] Availability management
  - [ ] Multi-tenancy security

- [ ] **tests/integration/registration.routes.test.ts**
  - [ ] Registration workflow
  - [ ] Payment integration
  - [ ] Family creation
  - [ ] Student creation

- [ ] **tests/integration/dashboard.routes.test.ts**
  - [ ] GET /api/v1/dashboard/admin
  - [ ] GET /api/v1/dashboard/teacher
  - [ ] GET /api/v1/dashboard/parent
  - [ ] Data aggregation accuracy
  - [ ] Multi-tenancy (only own school data)

---

## Testing Best Practices Checklist

### For Every Test File

- [ ] **Arrange-Act-Assert** pattern used
- [ ] **Test isolation** - Tests don't depend on each other
- [ ] **Cleanup** - beforeEach/afterEach restore state
- [ ] **Meaningful names** - Test describes what it tests
- [ ] **One assertion per test** (or closely related assertions)
- [ ] **Edge cases** covered
- [ ] **Error scenarios** tested
- [ ] **Multi-tenancy** verified (if data access involved)

### Multi-Tenancy Testing (CRITICAL)

For every route/service that accesses data:
- [ ] **Create 2 schools** in test setup
- [ ] **Create data for School A**
- [ ] **Attempt access as School B** - Should return 404 (not 403)
- [ ] **List endpoints** - Should not return School A data to School B
- [ ] **Update endpoints** - School B cannot update School A data
- [ ] **Delete endpoints** - School B cannot delete School A data
- [ ] **Relationship tests** - Cannot link data across schools

### Integration Test Pattern

```typescript
describe('Resource Routes', () => {
  let schoolId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create school
    // Create user
    // Login to get token
  });

  afterAll(async () => {
    // Clean up in correct order (FK constraints)
    await prisma.$disconnect();
  });

  describe('POST /api/v1/resource', () => {
    it('should create resource with authentication', async () => {
      // Arrange
      const data = { ... };

      // Act
      const response = await request(app)
        .post('/api/v1/resource')
        .set('Authorization', `Bearer ${authToken}`)
        .send(data);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.schoolId).toBe(schoolId);
    });
  });

  describe('Multi-tenancy', () => {
    it('should not allow cross-school access', async () => {
      // Test 404 when accessing other school's data
    });
  });
});
```

### Unit Test Pattern

```typescript
describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('functionName', () => {
    it('should handle happy path', async () => {
      // Mock dependencies
      // Call function
      // Assert results
    });

    it('should handle error scenario', async () => {
      // Mock error
      // Expect rejection or error handling
    });

    it('should enforce multi-tenancy', async () => {
      // Verify schoolId in all queries
    });
  });
});
```

---

## Coverage Tracking

### Daily Progress

**Day 1:**
- [ ] Stripe service tests complete
- [ ] Payment route tests complete
- [ ] Coverage: Backend +X%, Frontend +0%

**Day 2:**
- [ ] Invoice service tests complete
- [ ] Invoice route tests enhanced
- [ ] Coverage: Backend +X%, Frontend +0%

**Day 3:**
- [ ] E2E payment flow complete
- [ ] Error scenarios tested
- [ ] Coverage: Backend +X%, Frontend +0%, E2E +X%

**Day 4:**
- [ ] Password service tests complete
- [ ] Auth route tests enhanced
- [ ] Coverage: Backend +X%, Frontend +0%

**Day 5:**
- [ ] Hybrid booking service tests complete
- [ ] Coverage: Backend +X%, Frontend +0%

**Day 6:**
- [ ] Meet & greet service tests complete
- [ ] Meet & greet route tests complete
- [ ] Coverage: Backend +X%, Frontend +0%

**Day 7:**
- [ ] Lesson service tests enhanced
- [ ] Coverage: Backend +X%, Frontend +0%

### Final Targets Before Launch

- [ ] **Backend:** 80%+ overall
- [ ] **Frontend:** 60%+ overall
- [ ] **E2E:** 80%+ critical journeys
- [ ] **Payment:** 100%
- [ ] **Security:** 100%
- [ ] **Multi-tenancy:** 100%

---

## Definition of Done - Test Edition

A test file is complete when:
- [ ] All public functions tested
- [ ] Happy path tested
- [ ] Error scenarios tested
- [ ] Edge cases tested
- [ ] Multi-tenancy tested (if applicable)
- [ ] Coverage >80% for that file
- [ ] All tests passing
- [ ] No console warnings/errors
- [ ] Meaningful test descriptions
- [ ] Proper cleanup (no side effects)

---

## Quick Commands Reference

```bash
# Run specific test file
npm test path/to/test.file.test.ts

# Run with coverage
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm run test:watch

# Run only tests matching pattern
npm test -- --testNamePattern="payment"

# Run only integration tests
npm test tests/integration

# Run only unit tests
npm test tests/unit

# Update snapshots (if using)
npm test -- -u

# Verbose output
npm test -- --verbose
```

---

**Remember:** Quality over quantity. 100% coverage of critical paths (payment, security, multi-tenancy) is more valuable than 80% coverage of everything.

---

*Checklist Version: 1.0*
*Last Updated: 2025-12-27*
*Priority: CRITICAL - Pre-MVP Launch*
