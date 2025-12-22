# Week 3 Implementation Plan: Meet & Greet System

## Music 'n Me MVP - Week 3

**Timeline:** Week 3 of 12-week MVP
**Dependencies:** Week 1 Authentication (COMPLETE), Week 2 Admin Dashboard (COMPLETE)
**Goal:** Complete Meet & Greet booking system with registration flow and Stripe integration

---

## Executive Summary

Week 3 implements the pre-registration booking system that allows prospective parents to book introductory sessions before creating an account. This is a critical lead generation feature that captures family information and converts leads to paying customers.

**Key Deliverables:**
1. **SendGrid Email Service** - Brand-compliant email templates for all notifications
2. **Meet & Greet Backend** - Public booking, email verification, admin management
3. **Meet & Greet Frontend** - Public booking form (no auth), admin management UI
4. **Stripe Integration** - Payment processing for registration fee
5. **Registration Flow** - Convert approved Meet & Greets to family accounts

**Foundation from Previous Weeks:**
- Authentication system with JWT, bcrypt, rate limiting
- Multi-tenancy with schoolId filtering
- Admin dashboard with school configuration
- User management (teachers, parents, students)
- Material-UI theme with brand styling
- Prisma schema with MeetAndGreet model (already exists)

---

## Phase 1: Email Service Setup (Days 1-2)

### 1.1 SendGrid Configuration

**Prerequisites:**
- Create SendGrid account at sendgrid.com
- Create API Key with "Mail Send" permissions
- Verify sender domain (musicnme.com.au or development domain)

**Environment Variables to Add:**

**File:** `apps/backend/.env`

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@musicnme.com.au
SENDGRID_FROM_NAME=Music 'n Me
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

**Success Criteria:**
- [ ] SendGrid account created with verified sender
- [ ] API key generated and added to environment
- [ ] Test email can be sent from development

**Assigned Agent:** backend-architect

---

### 1.2 Email Service Utility Class

**File to create:** `apps/backend/src/services/email.service.ts`

**Key Functions:**
- `sendEmail(options)` - Generic email sending
- `sendMeetAndGreetVerification(to, data)` - Verify email address
- `sendMeetAndGreetConfirmation(to, data)` - Booking confirmed
- `sendMeetAndGreetAdminNotification(to, data)` - New booking alert
- `sendMeetAndGreetApproval(to, data)` - Registration invitation
- `sendMeetAndGreetRejection(to, data)` - Booking rejected
- `sendWelcomeEmail(to, data)` - New user welcome

**Dependencies to Install:**
```bash
cd apps/backend && npm install @sendgrid/mail
```

**Success Criteria:**
- [ ] SendGrid SDK installed and configured
- [ ] Generic sendEmail function works
- [ ] Error handling prevents email failures from crashing app
- [ ] Logging captures email send status

**Assigned Agent:** backend-architect

---

### 1.3 Email Template Directory Structure

**Directory to create:** `apps/backend/src/templates/email/`

```
templates/
  email/
    base.template.ts          # Base HTML wrapper with brand styling
    components/
      button.ts               # CTA button component
      header.ts               # Logo header
      footer.ts               # Footer with unsubscribe
    meet-and-greet/
      verification.ts         # Verify email address
      confirmation.ts         # Booking confirmed
      admin-notification.ts   # New booking notification
      approval.ts             # Registration invitation
      rejection.ts            # Booking rejected
    auth/
      welcome.ts              # Welcome new user
    payment/
      receipt.ts              # Payment confirmation
```

**Base Template Design Requirements:**
- Logo header with Music 'n Me branding
- Primary color: #4580E4 (brand blue)
- Secondary color: #FFCE00 (brand yellow)
- Font: Avenir with web-safe fallbacks (Arial, Helvetica)
- Responsive design (mobile-first)
- No gradients or drop shadows (brand guideline)
- Footer with school contact info and unsubscribe link

**Success Criteria:**
- [ ] Base template renders correctly in Gmail, Outlook, Apple Mail
- [ ] Mobile rendering is correct (320px width)
- [ ] All images have alt text
- [ ] Brand colors match guidelines

**Assigned Agent:** full-stack-developer

---

### 1.4 Configuration Module Update

**File to modify:** `apps/backend/src/config/index.ts`

Add SendGrid configuration:

```typescript
export const config = {
  // ... existing config
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@musicnme.com.au',
    fromName: process.env.SENDGRID_FROM_NAME || 'Music \'n Me',
  },
  app: {
    url: process.env.APP_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};
```

**Assigned Agent:** backend-architect

---

## Phase 2: Meet & Greet Backend (Days 2-3)

### 2.1 Meet & Greet Validators

**File to create:** `apps/backend/src/validators/meetAndGreet.validators.ts`

**Validation Rules:**
- schoolId: Required UUID
- studentFirstName/lastName: Required, 1-50 chars
- studentAge: Required, 3-99
- contact1Name/Email/Phone/Relationship: All required
- contact2*: All optional
- emergencyName/Phone/Relationship: All required
- Phone format: Australian (+61 or 04xxxxxxxx)

**Assigned Agent:** backend-architect

---

### 2.2 Meet & Greet Service

**File to create:** `apps/backend/src/services/meetAndGreet.service.ts`

**Key Functions:**

| Function | Description | Multi-Tenancy |
|----------|-------------|---------------|
| `createMeetAndGreet(data)` | Public booking, sends verification email | schoolId from input |
| `verifyMeetAndGreetEmail(token)` | Verify email, update status | Token lookup |
| `getMeetAndGreets(schoolId, filters)` | Admin list with filters | schoolId required |
| `getMeetAndGreet(schoolId, id)` | Single booking details | schoolId required |
| `updateMeetAndGreet(schoolId, id, data)` | Update booking | schoolId required |
| `approveMeetAndGreet(schoolId, id)` | Approve and send registration link | schoolId required |
| `rejectMeetAndGreet(schoolId, id, reason)` | Reject with reason | schoolId required |
| `cancelMeetAndGreet(schoolId, id)` | Cancel booking | schoolId required |

**Status Flow:**
```
PENDING_VERIFICATION -> PENDING_APPROVAL -> APPROVED -> CONVERTED
                                         -> REJECTED
                                         -> CANCELLED
```

**Assigned Agent:** backend-architect

---

### 2.3 Secure Token Utility

**File to create/update:** `apps/backend/src/utils/crypto.ts`

```typescript
import crypto from 'crypto';

export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
```

**Assigned Agent:** backend-architect

---

### 2.4 Meet & Greet Routes

**File to create:** `apps/backend/src/routes/meetAndGreet.routes.ts`

**Public Endpoints (No Auth):**

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/public/meet-and-greet` | Create booking | 5/hour/IP |
| GET | `/public/meet-and-greet/verify/:token` | Verify email | None |
| GET | `/public/schools/:slug/instruments` | Get instruments for form | None |

**Admin Endpoints (Auth Required):**

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/admin/meet-and-greet` | List all bookings | ADMIN, TEACHER |
| GET | `/admin/meet-and-greet/:id` | Get single booking | ADMIN, TEACHER |
| PATCH | `/admin/meet-and-greet/:id` | Update booking | ADMIN, TEACHER |
| POST | `/admin/meet-and-greet/:id/approve` | Approve booking | ADMIN |
| POST | `/admin/meet-and-greet/:id/reject` | Reject booking | ADMIN |
| DELETE | `/admin/meet-and-greet/:id` | Cancel booking | ADMIN |

**Assigned Agent:** backend-architect

---

## Phase 3: Meet & Greet Frontend (Days 3-4)

### 3.1 API Functions

**File to create:** `apps/frontend/src/api/meetAndGreet.api.ts`

Exports:
- `meetAndGreetPublicApi` - create, verify, getSchoolInstruments
- `meetAndGreetApi` - getAll, getById, update, approve, reject, cancel

**Assigned Agent:** frontend-developer

---

### 3.2 React Query Hooks

**File to create:** `apps/frontend/src/hooks/useMeetAndGreet.ts`

Public Hooks:
- `useCreateMeetAndGreet()`
- `useVerifyMeetAndGreet()`
- `useSchoolInstruments(slug)`

Admin Hooks:
- `useMeetAndGreets(filters)`
- `useMeetAndGreet(id)`
- `useUpdateMeetAndGreet()`
- `useApproveMeetAndGreet()`
- `useRejectMeetAndGreet()`
- `useCancelMeetAndGreet()`

**Assigned Agent:** frontend-developer

---

### 3.3 Public Booking Form (Multi-Step)

**File to create:** `apps/frontend/src/pages/public/MeetAndGreetBookingPage.tsx`

**Form Steps:**
1. **Student Information** - First name, last name, age
2. **Primary Contact** - Name, email, phone, relationship (required)
3. **Secondary Contact** - Name, email, phone, relationship (optional)
4. **Emergency Contact** - Name, phone, relationship (required)
5. **Preferences** - Instrument interest, preferred date/time, notes
6. **Review & Submit** - Confirm all information

**Dependencies to Install:**
```bash
cd apps/frontend && npm install react-hook-form @hookform/resolvers zod
```

**Components to Create:**
- `MeetAndGreetBookingForm.tsx` - Main form container with stepper
- `StudentInfoStep.tsx` - Student details form
- `ContactInfoStep.tsx` - Reusable contact form (used 3 times)
- `PreferencesStep.tsx` - Instrument dropdown, date picker
- `ReviewStep.tsx` - Summary before submit

**Success Criteria:**
- [ ] Multi-step navigation works (next/back buttons)
- [ ] Progress indicator (MUI Stepper)
- [ ] Form validation on each step
- [ ] Phone number formatting for Australian numbers
- [ ] Instrument dropdown from API
- [ ] Brand styling (Music 'n Me colors/fonts)

**Assigned Agent:** frontend-developer

---

### 3.4 Email Verification Page

**File to create:** `apps/frontend/src/pages/public/MeetAndGreetVerifyPage.tsx`

**Route:** `/meet-and-greet/verify/:token`

**Behavior:**
1. Extract token from URL params
2. Call verification API
3. Show loading state
4. On success: Show confirmation with booking details
5. On error: Show error message (invalid/expired token)

**Assigned Agent:** frontend-developer

---

### 3.5 Admin Management Page

**File to create:** `apps/frontend/src/pages/admin/MeetAndGreetPage.tsx`

**Features:**
- Data table with all bookings
- Status filter (tabs or dropdown)
- Date range filter
- Teacher assignment filter
- Actions: View, Approve, Reject, Cancel

**Status Color Coding:**
| Status | Color | Chip |
|--------|-------|------|
| PENDING_VERIFICATION | Gray | Outlined |
| PENDING_APPROVAL | Yellow (#FFCE00) | Filled |
| APPROVED | Blue (#4580E4) | Filled |
| REJECTED | Red | Outlined |
| CONVERTED | Green (#96DAC9) | Filled |
| CANCELLED | Gray | Strikethrough |

**Components to Create:**
- `MeetAndGreetList.tsx` - Data table
- `MeetAndGreetDetailModal.tsx` - Full details view
- `ApproveDialog.tsx` - Confirm approval
- `RejectDialog.tsx` - Requires reason input

**Assigned Agent:** frontend-developer

---

### 3.6 Update Frontend Routing

**File to update:** `apps/frontend/src/App.tsx`

Add routes:
```tsx
// Public (no auth)
<Route path="/meet-and-greet" element={<MeetAndGreetBookingPage />} />
<Route path="/meet-and-greet/verify/:token" element={<MeetAndGreetVerifyPage />} />
<Route path="/meet-and-greet/success" element={<MeetAndGreetSuccessPage />} />

// Admin (protected)
<Route path="meet-and-greet" element={<MeetAndGreetPage />} />
```

**Update Admin Sidebar:**
Add "Meet & Greet" link to admin navigation

**Assigned Agent:** frontend-developer

---

## Phase 4: Stripe Integration (Day 4)

### 4.1 Stripe Account Setup

**Prerequisites:**
1. Create Stripe account at stripe.com
2. Get test API keys from Dashboard > Developers > API keys
3. Configure webhook endpoint

**Environment Variables:**

**File:** `apps/backend/.env`

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
STRIPE_REGISTRATION_PRICE_ID=price_xxxxxxxxxx
```

**Stripe Dashboard Configuration:**
1. Create Product: "Music 'n Me Registration Fee"
2. Create Price: One-time, $XX.00
3. Configure webhook: POST /webhooks/stripe
4. Events: checkout.session.completed

**Assigned Agent:** backend-architect

---

### 4.2 Stripe Service

**File to create:** `apps/backend/src/services/stripe.service.ts`

**Dependencies to Install:**
```bash
cd apps/backend && npm install stripe
```

**Key Functions:**
- `createCheckoutSession(params)` - Create payment session
- `verifyWebhookSignature(payload, signature)` - Verify webhook
- `getCheckoutSession(sessionId)` - Retrieve session details

**Assigned Agent:** backend-architect

---

### 4.3 Stripe Webhook Handler

**File to create:** `apps/backend/src/routes/webhooks.routes.ts`

**IMPORTANT:** Webhook needs raw body for signature verification.

**Update Express App (`apps/backend/src/index.ts`):**
```typescript
// BEFORE json parser
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
```

**Handled Events:**
- `checkout.session.completed` - Complete registration

**Assigned Agent:** backend-architect

---

## Phase 5: Registration Flow (Days 4-5)

### 5.1 Registration Service

**File to create:** `apps/backend/src/services/registration.service.ts`

**Key Functions:**

| Function | Description |
|----------|-------------|
| `initiateRegistration(schoolId, meetAndGreetId)` | Create Stripe checkout session |
| `completeRegistration(meetAndGreetId, stripeSessionId)` | Create User, Parent, Family, Student |

**completeRegistration Flow:**
1. Verify meet & greet exists and is APPROVED
2. Check not already converted (idempotency)
3. Generate temporary password
4. In transaction:
   - Create User (role: PARENT)
   - Create Family
   - Create Parent (with all contacts)
   - Create Student
   - Update MeetAndGreet status to CONVERTED
5. Send welcome email with temp password

**Assigned Agent:** backend-architect

---

### 5.2 Registration Routes

**File to update:** `apps/backend/src/routes/meetAndGreet.routes.ts`

Add endpoint:
```
POST /admin/meet-and-greet/:id/convert
```

Returns: `{ checkoutUrl: string }`

**Assigned Agent:** backend-architect

---

### 5.3 Registration Success Page

**File to create:** `apps/frontend/src/pages/public/RegistrationSuccessPage.tsx`

**Route:** `/registration/success?session_id={CHECKOUT_SESSION_ID}`

**Behavior:**
1. Extract session_id from URL
2. Call verification API
3. Show success message
4. Display login instructions
5. Link to login page

**Assigned Agent:** frontend-developer

---

## Phase 6: Testing & Documentation (Day 5)

### 6.1 Unit Tests

**Files to create:**
- `apps/backend/src/services/email.service.test.ts`
- `apps/backend/src/services/meetAndGreet.service.test.ts`
- `apps/backend/src/services/stripe.service.test.ts`

**Assigned Agent:** testing-qa-specialist

---

### 6.2 Integration Tests

**File to create:** `apps/backend/src/routes/meetAndGreet.routes.test.ts`

**Test Cases:**
- [ ] Create booking returns verification token
- [ ] Email verification updates status
- [ ] Admin list returns school's bookings only (multi-tenancy)
- [ ] Approve sends registration email
- [ ] Reject requires reason
- [ ] Rate limiting blocks excessive requests

**Assigned Agent:** testing-qa-specialist

---

### 6.3 Stripe Webhook Testing

**Using Stripe CLI:**
```bash
stripe listen --forward-to localhost:5000/webhooks/stripe
stripe trigger checkout.session.completed
```

**Test Cases:**
- [ ] Webhook signature verification works
- [ ] checkout.session.completed creates user
- [ ] Duplicate events are idempotent
- [ ] Invalid signature returns 400

**Assigned Agent:** testing-qa-specialist

---

### 6.4 Documentation Updates

**Files to update:**
1. `PROGRESS.md` - Mark Week 3 complete
2. `TASKLIST.md` - Check off completed items
3. `docs/api-reference.md` - Document new endpoints
4. `apps/backend/.env.example` - Add new variables

**Assigned Agent:** full-stack-developer

---

## Week 3 Deliverables Checklist

### Phase 1: Email Service
- [ ] SendGrid account configured
- [ ] Email service utility class (`email.service.ts`)
- [ ] Brand-compliant HTML email templates
- [ ] Verification email working

### Phase 2: Meet & Greet Backend
- [ ] POST `/public/meet-and-greet` (public, rate limited)
- [ ] GET `/public/meet-and-greet/verify/:token` (public)
- [ ] GET `/admin/meet-and-greet` (admin, with filters)
- [ ] PATCH `/admin/meet-and-greet/:id` (admin)
- [ ] POST `/admin/meet-and-greet/:id/approve` (admin)
- [ ] POST `/admin/meet-and-greet/:id/reject` (admin)
- [ ] Multi-tenancy on all admin queries

### Phase 3: Meet & Greet Frontend
- [ ] Public booking page with multi-step form
- [ ] Form validation (react-hook-form + zod)
- [ ] Email verification success page
- [ ] Admin management page with filters
- [ ] Approve/Reject dialogs
- [ ] Admin sidebar link added

### Phase 4: Stripe Integration
- [ ] Stripe account (test mode)
- [ ] `createCheckoutSession()` function
- [ ] Webhook signature verification
- [ ] `checkout.session.completed` handler

### Phase 5: Registration Flow
- [ ] POST `/admin/meet-and-greet/:id/convert`
- [ ] `completeRegistration()` creates User, Parent, Family, Student
- [ ] Welcome email with temp password
- [ ] Registration success page

### Phase 6: Testing
- [ ] Email service unit tests
- [ ] Meet & Greet integration tests
- [ ] Stripe webhook tests
- [ ] Documentation updated

---

## Critical Files Summary

### Backend (Priority Order)
1. `apps/backend/src/services/email.service.ts`
2. `apps/backend/src/services/meetAndGreet.service.ts`
3. `apps/backend/src/services/stripe.service.ts`
4. `apps/backend/src/services/registration.service.ts`
5. `apps/backend/src/routes/meetAndGreet.routes.ts`
6. `apps/backend/src/routes/webhooks.routes.ts`
7. `apps/backend/src/validators/meetAndGreet.validators.ts`

### Frontend (Priority Order)
1. `apps/frontend/src/pages/public/MeetAndGreetBookingPage.tsx`
2. `apps/frontend/src/pages/admin/MeetAndGreetPage.tsx`
3. `apps/frontend/src/api/meetAndGreet.api.ts`
4. `apps/frontend/src/hooks/useMeetAndGreet.ts`
5. `apps/frontend/src/pages/public/MeetAndGreetVerifyPage.tsx`
6. `apps/frontend/src/pages/public/RegistrationSuccessPage.tsx`

---

## Agent Assignments

| Phase | Agent | Responsibility |
|-------|-------|----------------|
| 1.1-1.2 | backend-architect | SendGrid setup, email service |
| 1.3-1.4 | full-stack-developer | Email templates, config |
| 2.1-2.4 | backend-architect | Validators, service, routes |
| 3.1-3.6 | frontend-developer | API, hooks, forms, pages |
| 4.1-4.3 | backend-architect | Stripe setup, service, webhooks |
| 5.1-5.3 | backend-architect + frontend-developer | Registration flow |
| 6.1-6.4 | testing-qa-specialist | Tests and documentation |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email delivery failures | Medium | Retry logic, logging, don't block main flow |
| Stripe webhook failures | High | Return 200 immediately, idempotency checks |
| Multi-tenancy data leakage | Critical | schoolId filter on ALL queries, integration tests |
| Spam bookings | Medium | Rate limiting (5/hour/IP), email verification |
| Webhook signature invalid | Medium | Raw body parser BEFORE json parser |

---

## Dependencies to Install

### Backend
```bash
cd apps/backend
npm install @sendgrid/mail stripe
npm install -D @types/node  # if not already installed
```

### Frontend
```bash
cd apps/frontend
npm install react-hook-form @hookform/resolvers zod
```

---

## Environment Variables Summary

Add to `apps/backend/.env`:
```env
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@musicnme.com.au
SENDGRID_FROM_NAME=Music 'n Me

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
STRIPE_REGISTRATION_PRICE_ID=price_xxxxxxxxxx

# App URLs
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

---

**Plan Created:** 2025-12-22
**Target Completion:** End of Week 3
