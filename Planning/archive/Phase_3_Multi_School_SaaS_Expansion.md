# Phase 3: Multi-School SaaS Expansion
**Transforming Music 'n Me into a Multi-Tenant SaaS Platform**

---

## Executive Summary

**Current State:** Music 'n Me platform is architecturally ready for multiple schools with complete data isolation and independent school configuration.

**Goal:** Add the SaaS operations layer to enable other music schools to self-register, subscribe, and use the platform independently.

**Timeline Estimate:** 14-20 weeks

**Key Deliverables:**
1. Public school registration and onboarding system
2. Subscription billing and plan management
3. Subdomain/custom domain support
4. Super Admin portal for platform management
5. White-label branding capabilities
6. Marketing website for customer acquisition

---

## Table of Contents

1. [Architecture Foundation (Already Built)](#architecture-foundation-already-built)
2. [Features to Implement](#features-to-implement)
3. [Database Schema Additions](#database-schema-additions)
4. [API Endpoints](#api-endpoints)
5. [Implementation Phases](#implementation-phases)
6. [User Flows](#user-flows)
7. [Technical Specifications](#technical-specifications)
8. [Testing Requirements](#testing-requirements)
9. [Deployment Considerations](#deployment-considerations)
10. [Revenue Model](#revenue-model)
11. [Success Metrics](#success-metrics)

---

## Architecture Foundation (Already Built)

### What We Have ✅

#### 1. Multi-Tenant Data Isolation
```prisma
// Every model includes schoolId
model Lesson {
  id        String   @id
  schoolId  String   // ← Complete isolation
  school    School   @relation(...)
  // ... other fields
}
```

**Security Guarantees:**
- Schools cannot access other schools' data
- All queries automatically filtered by `schoolId`
- Foreign key validation prevents cross-school references
- Prisma middleware enforces school isolation

#### 2. Configurable School Settings
```prisma
model School {
  id        String   @id @default(cuid())
  name      String
  timezone  String   @default("Australia/Sydney")
  currency  String   @default("AUD")
  taxRate   Decimal  @default(0.10)
  // Each school is independent
}
```

#### 3. Separate Integration Accounts
- Each school connects own Xero tenant
- Each school has own Stripe Connect account
- Each teacher connects own Google Calendar
- Complete integration isolation

#### 4. Role-Based Access Control
- `ADMIN` role scoped to single school
- Teachers see only their school's data
- Parents see only their family's data
- Complete access control per school

### What We're Building 🚧

The **SaaS Operations Layer** that enables:
- Schools to self-register and onboard
- Subscription billing (charging schools for platform access)
- Platform-wide management and monitoring
- Marketing and customer acquisition

---

## Features to Implement

### 1. School Registration & Onboarding

**Purpose:** Allow new schools to sign up and configure their account without manual intervention.

**Components:**

#### Public Registration Form
- School name
- Admin user details (name, email, password)
- Subdomain selection (with availability check)
- Estimated student count (for plan recommendation)
- Terms of service acceptance

#### Email Verification
- Send verification email with token
- Verify email before account activation
- Resend verification option

#### Onboarding Wizard
**Step 1: School Details**
- Country, timezone, currency
- Phone number
- School website

**Step 2: First Location**
- Location name and address
- Number of rooms
- Room names and capacities

**Step 3: Instruments**
- Select from predefined list
- Add custom instruments

**Step 4: First Term**
- Term name, dates
- Billing preferences

**Step 5: Pricing Setup**
- Group lesson price
- Individual lesson price
- Tax/GST rate

**Deliverable:** Fully configured school ready to add teachers and students.

---

### 2. Subscription Billing System

**Purpose:** Charge schools monthly/annually for platform access.

**Components:**

#### Subscription Plans

**TRIAL Plan**
- Duration: 14 days
- Full access to all features
- No credit card required
- Limited to 10 students (to prevent abuse)
- Converts to paid plan or expires

**BASIC Plan - $99/month**
- Up to 50 students
- 1 location
- Unlimited teachers
- All core features
- Email support
- Quarterly invoicing option

**PRO Plan - $199/month** (Most Popular)
- Up to 200 students
- Up to 3 locations
- Unlimited teachers
- All features
- Priority email support
- WhatsApp/SMS notifications included
- Monthly invoicing option

**ENTERPRISE Plan - $499/month**
- Unlimited students
- Unlimited locations
- All features
- Dedicated account manager
- Phone support
- Custom domain support
- White-label branding
- Xero integration priority support
- SLA guarantee (99.9% uptime)

#### Billing Cycle Options
- Monthly billing (pay-as-you-go)
- Annual billing (2 months free - 17% discount)

#### Stripe Subscription Integration
- Create Stripe Customer on school registration
- Create Stripe Subscription based on selected plan
- Handle webhooks for subscription events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`

#### Usage Limits Enforcement
- Enforce student limits per plan
- Enforce location limits per plan
- Soft warnings at 80% capacity
- Hard blocks at 100% capacity with upgrade prompt

#### Grace Period & Suspension
- Payment failure: 7-day grace period
- Day 1-3: Automated payment retry
- Day 4: Warning email
- Day 7: Account suspended (read-only mode)
- Day 30: Account cancelled (data retained 90 days)

#### Self-Service Plan Management
- Upgrade plan (immediate effect)
- Downgrade plan (takes effect next billing cycle)
- Change billing cycle
- Update payment method
- View billing history
- Download invoices

---

### 3. Subdomain & Custom Domain Support

**Purpose:** Each school gets their own branded URL.

**Components:**

#### Subdomain System
- Format: `{subdomain}.musicnme.com.au`
- Examples:
  - `parkside-music.musicnme.com.au`
  - `riverside-academy.musicnme.com.au`
  - `eastside-piano.musicnme.com.au`

**Subdomain Requirements:**
- 3-30 characters
- Lowercase letters, numbers, hyphens only
- Must start with letter
- Unique across platform
- Availability check during registration

#### Custom Domain Support (Enterprise Only)
- School provides their own domain
- Examples:
  - `lessons.parksidemusic.com.au`
  - `portal.riversideacademy.edu.au`

**Custom Domain Setup:**
1. School provides domain
2. System generates DNS records (CNAME)
3. School adds DNS records to their provider
4. System verifies DNS propagation
5. SSL certificate issued automatically (Let's Encrypt)

#### Technical Implementation

**Middleware to Detect School:**
```typescript
export async function detectSchoolFromHost(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const host = req.get('host'); // "parkside-music.musicnme.com.au"

  let school: School | null = null;

  // Check if custom domain
  school = await prisma.school.findFirst({
    where: { customDomain: host }
  });

  // Check if subdomain
  if (!school && host.includes('.musicnme.com.au')) {
    const subdomain = host.split('.')[0];
    school = await prisma.school.findUnique({
      where: { subdomain }
    });
  }

  if (!school) {
    return res.status(404).json({
      error: 'School not found',
      message: 'No school is configured for this domain.'
    });
  }

  // Check school status
  if (school.status === 'SUSPENDED') {
    return res.status(402).render('suspended', {
      schoolName: school.name,
      reason: 'Payment required'
    });
  }

  if (school.status === 'CANCELLED') {
    return res.status(410).json({
      error: 'School account cancelled'
    });
  }

  // Attach school to request
  req.school = school;
  next();
}
```

**DNS Configuration:**
For subdomain: Automatic (wildcard DNS: `*.musicnme.com.au` → App Platform)

For custom domain:
```
CNAME: lessons.parksidemusic.com.au → parkside-music.musicnme.com.au
```

---

### 4. White-Label Branding

**Purpose:** Allow schools (Enterprise plan) to customize the look and feel of their portal.

**Components:**

#### Branding Assets
- **Logo:** School logo (displayed in header, emails, invoices)
- **Favicon:** Browser tab icon
- **Email Header:** Custom header for email notifications
- **Invoice Header:** Custom header for invoices

#### Color Scheme Customization
- Primary color (buttons, links)
- Secondary color (accents)
- Header background color
- Preview changes in real-time

#### Custom Text
- Login page message
- Dashboard welcome message
- Footer text
- Email signature

#### Default Branding
Non-enterprise schools see default Music 'n Me branding.

#### Implementation

**Database Schema:**
```prisma
model SchoolBranding {
  id        String   @id @default(cuid())
  schoolId  String   @unique
  school    School   @relation(...)

  // Assets
  logoUrl         String?
  faviconUrl      String?
  emailHeaderUrl  String?
  invoiceHeaderUrl String?

  // Colors (hex codes)
  primaryColor    String?   @default("#116dff")
  secondaryColor  String?   @default("#7fccf7")
  headerBgColor   String?   @default("#ffffff")

  // Custom text
  loginMessage    String?   @default("Welcome! Please sign in to continue.")
  dashboardWelcome String?
  footerText      String?
  emailSignature  String?

  // Email settings
  emailFromName   String?   // "Parkside Music Academy" (instead of "Music 'n Me")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Frontend Theme Provider:**
```typescript
export function useSchoolBranding() {
  const { school } = useSchool();
  const { data: branding } = useQuery(['branding', school.id], () =>
    api.get(`/schools/${school.id}/branding`)
  );

  return {
    logo: branding?.logoUrl || '/default-logo.png',
    colors: {
      primary: branding?.primaryColor || '#116dff',
      secondary: branding?.secondaryColor || '#7fccf7'
    },
    text: {
      loginMessage: branding?.loginMessage || 'Welcome to Music \'n Me'
    }
  };
}

// Usage in components
const { colors, logo } = useSchoolBranding();
<ThemeProvider theme={{ palette: { primary: { main: colors.primary } } }}>
  <img src={logo} alt="School logo" />
</ThemeProvider>
```

---

### 5. Super Admin Portal

**Purpose:** Platform-wide management for Music 'n Me staff.

**Components:**

#### New User Role: `SUPER_ADMIN`
```prisma
enum Role {
  SUPER_ADMIN   // ← New: Platform administrator
  ADMIN         // School administrator
  TEACHER
  PARENT
  STUDENT
}
```

**Super Admin Capabilities:**
- View all schools across platform
- Access any school's data (for support)
- Suspend/unsuspend schools
- Override subscription status (for special cases)
- View platform-wide analytics
- Manage subscription plans and pricing
- View error logs and system health

#### Super Admin Dashboard

**Overview Tab:**
```
┌─────────────────────────────────────────────────────────────┐
│                   Platform Overview                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Active Schools:        47                                   │
│  Trial Schools:         12                                   │
│  Suspended Schools:     3                                    │
│  Total Students:        8,450                                │
│  Total Teachers:        380                                  │
│                                                               │
│  Monthly Recurring Revenue (MRR):  $9,353                    │
│  Annual Run Rate (ARR):            $112,236                  │
│  Churn Rate (30 days):             2.1%                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Schools Tab:**
```
┌──────────────────┬─────────────┬──────────┬───────────┬──────────┐
│ School Name      │ Plan        │ Students │ Status    │ Actions  │
├──────────────────┼─────────────┼──────────┼───────────┼──────────┤
│ Parkside Music   │ PRO         │ 143      │ Active    │ View     │
│ Riverside Academy│ ENTERPRISE  │ 287      │ Active    │ View     │
│ Eastside Piano   │ BASIC       │ 42       │ Active    │ View     │
│ Westside Music   │ PRO         │ 0        │ Trial     │ View     │
│ Northside School │ PRO         │ 156      │ Suspended │ View     │
└──────────────────┴─────────────┴──────────┴───────────┴──────────┘

[Filter: All ▼] [Search schools...]
```

**Revenue Tab:**
```
Monthly Recurring Revenue Trend:

  $10K │                                    ●
       │                                ●
   $8K │                            ●
       │                        ●
   $6K │                    ●
       │                ●
   $4K │            ●
       │        ●
   $2K │    ●
       │●
    $0 └────┬────┬────┬────┬────┬────┬────┬────┬────┬───
          Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct

Revenue by Plan:
  BASIC:      $2,970 (30 schools × $99)
  PRO:        $3,582 (18 schools × $199)
  ENTERPRISE: $2,495 (5 schools × $499)
  ─────────────────────────────
  Total MRR:  $9,047
```

**Support Tab:**
```
Recent Support Requests:

┌──────────────────┬─────────────────────────────┬──────────┬──────────┐
│ School           │ Issue                       │ Priority │ Status   │
├──────────────────┼─────────────────────────────┼──────────┼──────────┤
│ Parkside Music   │ Cannot connect Xero         │ High     │ Open     │
│ Riverside Academy│ Question about hybrid model │ Medium   │ Resolved │
│ Eastside Piano   │ Payment method declined     │ High     │ Open     │
└──────────────────┴─────────────────────────────┴──────────┴──────────┘

[Impersonate School Admin] - Login as school admin for support
```

**System Health Tab:**
- API response times
- Database query performance
- Error rates
- Queue processing status
- Webhook delivery success rates
- Uptime (last 30 days)

#### School Impersonation (Support Feature)
```typescript
// Super admin can impersonate school admin for support
POST /api/v1/superadmin/schools/:schoolId/impersonate

// Generates temporary JWT with school admin privileges
// Logged for audit purposes
// 1-hour expiration
```

---

### 6. Marketing Website

**Purpose:** Attract new schools to sign up for the platform.

**Components:**

#### Public Website Structure

**Domain:** `https://musicnme.com.au` (marketing site)

**Pages:**

**Homepage** (`/`)
- Hero section: "The Complete Platform for Music Schools"
- Key features overview
- Social proof (testimonials, logos)
- CTA: "Start Free Trial"

**Features Page** (`/features`)
- Detailed feature breakdown
- Screenshots/demos
- Comparison with competitors (Opus1)
- Hybrid lesson model explained (key differentiator)

**Pricing Page** (`/pricing`)
```
┌───────────────┬───────────────┬───────────────┬───────────────┐
│               │     BASIC     │      PRO      │  ENTERPRISE   │
│               │   $99/month   │  $199/month   │  $499/month   │
├───────────────┼───────────────┼───────────────┼───────────────┤
│ Students      │ Up to 50      │ Up to 200     │ Unlimited     │
│ Locations     │ 1             │ 3             │ Unlimited     │
│ Teachers      │ Unlimited     │ Unlimited     │ Unlimited     │
│ Hybrid Lessons│ ✓             │ ✓             │ ✓             │
│ WhatsApp/SMS  │ ✗             │ ✓             │ ✓             │
│ Xero Sync     │ ✗             │ ✓             │ ✓             │
│ Custom Domain │ ✗             │ ✗             │ ✓             │
│ White-label   │ ✗             │ ✗             │ ✓             │
│ Support       │ Email         │ Priority Email│ Phone + Email │
└───────────────┴───────────────┴───────────────┴───────────────┘

All plans include 14-day free trial, no credit card required.

[Start Free Trial]
```

**Demo Page** (`/demo`)
- Request a demo with sales team
- Watch pre-recorded demo video
- Interactive product tour

**Case Studies** (`/case-studies`)
- Music 'n Me (first customer) success story
- Other schools (once onboarded)
- Results: time saved, parent satisfaction, revenue growth

**Documentation** (`/docs`)
- Getting started guide
- Feature documentation
- Video tutorials
- API documentation (future)

**Blog** (`/blog`)
- Product updates
- Music education tips
- Customer stories
- SEO content

**About** (`/about`)
- Company story
- Team
- Mission and values

**Contact** (`/contact`)
- Contact form
- Email: hello@musicnme.com.au
- Phone: +61 ...
- Live chat (Intercom or similar)

**Legal Pages:**
- Terms of Service (`/terms`)
- Privacy Policy (`/privacy`)
- Cookie Policy (`/cookies`)
- Security (`/security`)

#### SEO Strategy
- Target keywords: "music school software", "music lesson management", "music school booking system"
- Blog content for long-tail keywords
- Comparison pages: "Music 'n Me vs Opus1"
- Local SEO for Australian market

#### Lead Capture
- Free trial signup (no credit card)
- Newsletter signup
- Demo request form
- Downloadable resources (e.g., "Music School Operations Checklist")

---

### 7. Trial Management System

**Purpose:** Convert trial users to paying customers.

**Components:**

#### Trial Lifecycle

**Day 0: Trial Starts**
- Welcome email with onboarding checklist
- In-app tutorial tooltips
- Recommended next steps

**Day 3: Check-in Email**
```
Subject: How's your trial going?

Hi Sarah,

You're 3 days into your trial! Here's what you've done so far:

✓ Created 2 lessons
✓ Added 5 students
✗ Connected Stripe (recommended for accepting payments)
✗ Invited teachers

Need help? Reply to this email or schedule a quick call.

[Complete Setup →]
```

**Day 7: Mid-trial Email**
```
Subject: You're halfway through your trial

Hi Sarah,

7 days down, 7 to go!

We noticed you haven't tried these features yet:
• Hybrid lesson booking (our unique feature!)
• WhatsApp notifications for parents
• Invoice generation

[Watch 3-min Tutorial →]
```

**Day 11: Upgrade Prompt (In-App)**
```
┌─────────────────────────────────────────────────────────────┐
│  Your trial ends in 3 days                                   │
│                                                               │
│  You've created 12 lessons and enrolled 45 students.         │
│  To continue using Music 'n Me, add a payment method.        │
│                                                               │
│  Recommended: PRO Plan ($199/month)                          │
│                                                               │
│  [Add Payment Method →]   [Contact Sales]                    │
└─────────────────────────────────────────────────────────────┘
```

**Day 14: Trial Expires**
- Account set to read-only mode
- All data retained for 30 days
- Email with upgrade link

**Day 17: Follow-up**
```
Subject: We'd love to have you back

Hi Sarah,

Your trial ended 3 days ago. Was there something preventing you from continuing?

We'd love to hear your feedback. Reply to this email and let us know:
• What did you like about Music 'n Me?
• What could be improved?
• What prevented you from subscribing?

Your data is safe and will be retained for 27 more days.

[Reactivate Account →]
```

#### Trial-to-Paid Conversion Tracking
- Track conversion rate
- Identify drop-off points
- A/B test email messaging
- Optimize onboarding flow

---

### 8. Usage Analytics & Insights

**Purpose:** Help schools understand their usage and optimize operations.

**Components:**

#### School Admin Dashboard Analytics

**Usage Overview (for school admins):**
```
┌─────────────────────────────────────────────────────────────┐
│                    This Month                                │
├─────────────────────────────────────────────────────────────┤
│  Total Lessons:           142                                │
│  Total Students:          156                                │
│  Attendance Rate:         94.2%                              │
│  Revenue Collected:       $12,450                            │
│  Outstanding Invoices:    $3,200                             │
│                                                               │
│  Trend: ↑ 12% from last month                                │
└─────────────────────────────────────────────────────────────┘
```

#### Platform-Wide Analytics (Super Admin)

**School Health Score:**
- Active users (daily/weekly/monthly)
- Feature adoption (hybrid lessons, payments, calendar sync)
- Student growth rate
- Churn risk indicators

**Cohort Analysis:**
- Trial conversion rates by cohort
- Retention rates (1 month, 3 months, 6 months, 12 months)
- Lifetime value (LTV) by plan

**Feature Usage:**
- % of schools using hybrid lessons
- % of schools using WhatsApp notifications
- % of schools with Xero connected
- Average students per school

---

### 9. Help Center & Documentation

**Purpose:** Self-service support to reduce support burden.

**Components:**

#### Help Center (`https://help.musicnme.com.au`)

**Categories:**
- Getting Started
- Managing Students & Teachers
- Creating Lessons
- Hybrid Lessons (detailed guide)
- Payments & Invoicing
- Integrations (Xero, Google Calendar, Stripe)
- WhatsApp & SMS Notifications
- Account & Billing
- Troubleshooting

**Features:**
- Search functionality
- Video tutorials
- Screenshots and GIFs
- Step-by-step guides
- FAQ section

#### In-App Help
- Contextual help tooltips
- "?" icon in header → Help Center
- Live chat (Intercom or similar)
- Submit support ticket

#### API Documentation (Future)
- For schools wanting to build custom integrations
- REST API reference
- Webhooks documentation
- Code examples

---

## Database Schema Additions

### New Models

```prisma
// ============================================
// SUBSCRIPTION & BILLING
// ============================================

model SchoolSubscription {
  id              String   @id @default(cuid())
  schoolId        String   @unique
  school          School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Plan details
  plan            SubscriptionPlan
  status          SubscriptionStatus
  billingCycle    BillingCycle

  // Pricing
  monthlyPrice    Decimal
  annualPrice     Decimal?

  // Stripe integration
  stripeCustomerId       String?  @unique
  stripeSubscriptionId   String?  @unique
  stripePaymentMethodId  String?

  // Trial
  trialEndsAt     DateTime?

  // Subscription period
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean  @default(false)
  cancelledAt        DateTime?
  cancellationReason String?

  // Plan limits
  maxStudents     Int?     // null = unlimited
  maxTeachers     Int?     // null = unlimited
  maxLocations    Int?     // null = unlimited

  // Current usage (updated periodically)
  currentStudents Int      @default(0)
  currentTeachers Int      @default(0)
  currentLocations Int     @default(0)
  lastUsageUpdate DateTime @default(now())

  // Payment history
  subscriptionInvoices SubscriptionInvoice[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([plan])
  @@index([stripeCustomerId])
}

enum SubscriptionPlan {
  TRIAL
  BASIC
  PRO
  ENTERPRISE
  CUSTOM      // For special cases
}

enum SubscriptionStatus {
  TRIALING    // In trial period
  ACTIVE      // Paid and active
  PAST_DUE    // Payment failed, in grace period
  SUSPENDED   // Suspended due to non-payment
  CANCELLED   // Cancelled by school or system
  INCOMPLETE  // Stripe subscription incomplete
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}

model SubscriptionInvoice {
  id              String   @id @default(cuid())
  subscriptionId  String
  subscription    SchoolSubscription @relation(fields: [subscriptionId], references: [id])

  // Stripe invoice
  stripeInvoiceId String   @unique
  stripeHostedUrl String?  // URL to view invoice
  stripePdfUrl    String?  // URL to download PDF

  // Invoice details
  amount          Decimal
  currency        String   @default("AUD")
  status          String   // draft, open, paid, void, uncollectible

  // Dates
  periodStart     DateTime
  periodEnd       DateTime
  dueDate         DateTime?
  paidAt          DateTime?

  // Payment
  paymentIntentId String?
  paymentFailed   Boolean  @default(false)
  failureReason   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([subscriptionId])
  @@index([stripeInvoiceId])
  @@index([status])
}

// ============================================
// SCHOOL ENHANCEMENTS
// ============================================

model School {
  // ... existing fields

  // New fields for SaaS
  subdomain       String   @unique  // "parkside-music"
  customDomain    String?  @unique  // "lessons.parksidemusic.com.au"
  status          SchoolStatus @default(TRIAL)

  // Registration
  registeredAt    DateTime @default(now())
  onboardingCompleted Boolean @default(false)
  onboardingStep  Int      @default(0)  // Track wizard progress

  // Contact
  adminEmail      String   // Primary contact
  adminPhone      String?

  // Features enabled (for plan limits)
  featuresEnabled Json     // { "hybridLessons": true, "whatsapp": true, ... }

  // Relations
  subscription    SchoolSubscription?
  branding        SchoolBranding?

  // ... existing relations
}

enum SchoolStatus {
  TRIAL           // In trial period
  ACTIVE          // Paid subscription active
  SUSPENDED       // Payment failure or admin action
  CANCELLED       // Account cancelled
  PENDING_SETUP   // Registration incomplete
}

// ============================================
// WHITE-LABEL BRANDING
// ============================================

model SchoolBranding {
  id        String   @id @default(cuid())
  schoolId  String   @unique
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Assets (stored in DigitalOcean Spaces)
  logoUrl         String?
  logoLightUrl    String?  // For dark backgrounds
  faviconUrl      String?
  emailHeaderUrl  String?
  invoiceHeaderUrl String?

  // Color scheme (hex codes)
  primaryColor    String   @default("#116dff")
  secondaryColor  String   @default("#7fccf7")
  accentColor     String?
  headerBgColor   String   @default("#ffffff")
  sidebarBgColor  String   @default("#f5f5f5")

  // Typography
  headingFont     String?  @default("Inter")
  bodyFont        String?  @default("Inter")

  // Custom text
  loginMessage    String?  @default("Welcome! Please sign in to continue.")
  dashboardWelcome String?
  footerText      String?
  emailSignature  String?

  // Email branding
  emailFromName   String?  // "Parkside Music Academy"
  replyToEmail    String?

  // Advanced (Enterprise only)
  customCss       String?  @db.Text
  customJs        String?  @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
}

// ============================================
// USAGE TRACKING
// ============================================

model UsageLog {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  date      DateTime @default(now())

  // Counts (snapshot at end of day)
  studentCount   Int
  teacherCount   Int
  lessonCount    Int
  enrollmentCount Int
  invoiceCount   Int

  // Activity
  activeUsers    Int  // Users who logged in
  lessonsCreated Int
  studentsAdded  Int
  invoicesSent   Int
  paymentsProcessed Decimal

  createdAt DateTime @default(now())

  @@unique([schoolId, date])
  @@index([schoolId])
  @@index([date])
}

// ============================================
// SUPER ADMIN
// ============================================

model SuperAdminActivity {
  id        String   @id @default(cuid())

  adminId   String
  admin     User     @relation(fields: [adminId], references: [id])

  action    String   // "SUSPEND_SCHOOL", "VIEW_SCHOOL_DATA", "OVERRIDE_PAYMENT"
  schoolId  String?
  details   Json?

  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())

  @@index([adminId])
  @@index([schoolId])
  @@index([createdAt])
}

// ============================================
// REGISTRATION
// ============================================

model EmailVerification {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expiresAt DateTime
  verified  Boolean  @default(false)

  createdAt DateTime @default(now())

  @@index([email])
  @@index([token])
}

model SubdomainReservation {
  id        String   @id @default(cuid())
  subdomain String   @unique
  schoolId  String?  @unique  // null until school is created
  expiresAt DateTime           // 30 minutes to complete registration

  createdAt DateTime @default(now())

  @@index([subdomain])
}
```

### Schema Updates to Existing Models

```prisma
model User {
  // ... existing fields

  role Role @default(STUDENT)

  // New relation
  superAdminActivities SuperAdminActivity[]
}

enum Role {
  SUPER_ADMIN   // ← NEW
  ADMIN
  TEACHER
  PARENT
  STUDENT
}
```

---

## API Endpoints

### Public Registration & Onboarding

```
POST   /api/v1/public/schools/check-subdomain
       { subdomain: "parkside-music" }
       → { available: true }

POST   /api/v1/public/schools/register
       {
         schoolName: "Parkside Music Academy",
         subdomain: "parkside-music",
         adminFirstName: "Sarah",
         adminLastName: "Johnson",
         adminEmail: "sarah@parksidemusic.com.au",
         password: "SecurePass123!",
         estimatedStudents: 150,
         agreeToTerms: true
       }
       → { schoolId, verificationRequired: true }

POST   /api/v1/public/schools/verify-email
       { email, token }
       → { verified: true, loginToken }

POST   /api/v1/public/schools/resend-verification
       { email }
       → { sent: true }
```

### Onboarding Wizard

```
GET    /api/v1/schools/:id/onboarding/status
       → { completed: false, currentStep: 2 }

POST   /api/v1/schools/:id/onboarding/school-details
       { country, timezone, currency, phone }
       → { success: true, nextStep: 3 }

POST   /api/v1/schools/:id/onboarding/location
       { name, address, rooms: [...] }
       → { success: true, nextStep: 4 }

POST   /api/v1/schools/:id/onboarding/instruments
       { instruments: ["Piano", "Guitar", "Drums"] }
       → { success: true, nextStep: 5 }

POST   /api/v1/schools/:id/onboarding/term
       { name, startDate, endDate }
       → { success: true, nextStep: 6 }

POST   /api/v1/schools/:id/onboarding/pricing
       { groupLessonPrice, individualLessonPrice }
       → { success: true, onboardingComplete: true }

POST   /api/v1/schools/:id/onboarding/complete
       → { success: true, redirectUrl: "/dashboard" }
```

### Subscription Management

```
GET    /api/v1/schools/:id/subscription
       → { plan, status, currentPeriodEnd, usage: {...}, limits: {...} }

GET    /api/v1/subscriptions/plans
       → [{ name: "BASIC", price: 99, features: [...] }, ...]

POST   /api/v1/schools/:id/subscription/create
       { plan: "PRO", billingCycle: "MONTHLY" }
       → { stripeCheckoutUrl }

POST   /api/v1/schools/:id/subscription/upgrade
       { newPlan: "ENTERPRISE" }
       → { success: true, effectiveDate }

POST   /api/v1/schools/:id/subscription/downgrade
       { newPlan: "BASIC" }
       → { success: true, effectiveDate: "end of billing period" }

POST   /api/v1/schools/:id/subscription/cancel
       { reason: "Too expensive", feedback: "..." }
       → { success: true, activeUntil }

POST   /api/v1/schools/:id/subscription/reactivate
       → { success: true }

PATCH  /api/v1/schools/:id/subscription/payment-method
       { stripePaymentMethodId }
       → { success: true }

GET    /api/v1/schools/:id/subscription/invoices
       → [{ id, amount, date, status, pdfUrl }, ...]

GET    /api/v1/schools/:id/subscription/usage
       → { students: 143, teachers: 8, lessons: 52 }
```

### Webhooks (Stripe)

```
POST   /api/v1/webhooks/stripe/subscription
       Handles:
       - customer.subscription.created
       - customer.subscription.updated
       - customer.subscription.deleted
       - invoice.payment_succeeded
       - invoice.payment_failed
```

### School Branding

```
GET    /api/v1/schools/:id/branding
       → { logoUrl, colors: {...}, text: {...} }

PATCH  /api/v1/schools/:id/branding
       { primaryColor: "#ff0000", logoUrl: "..." }
       → { success: true }

POST   /api/v1/schools/:id/branding/upload-logo
       (multipart/form-data)
       → { logoUrl }

POST   /api/v1/schools/:id/branding/upload-favicon
       → { faviconUrl }

DELETE /api/v1/schools/:id/branding/logo
       → { success: true }
```

### Super Admin

```
GET    /api/v1/superadmin/schools
       ?status=ACTIVE&plan=PRO&search=parkside
       → [{ id, name, plan, students, status, mrr }, ...]

GET    /api/v1/superadmin/schools/:id
       → { school details, usage, subscription, health score }

POST   /api/v1/superadmin/schools/:id/suspend
       { reason: "Payment failure" }
       → { success: true }

POST   /api/v1/superadmin/schools/:id/reactivate
       → { success: true }

POST   /api/v1/superadmin/schools/:id/impersonate
       → { temporaryToken, expiresIn: 3600 }

GET    /api/v1/superadmin/analytics/overview
       → { totalSchools, mrr, arr, churnRate, ... }

GET    /api/v1/superadmin/analytics/revenue
       ?startDate=2025-01-01&endDate=2025-12-31
       → { monthlyRevenue: [...], byPlan: {...} }

GET    /api/v1/superadmin/analytics/cohorts
       → { cohortData: [...] }

GET    /api/v1/superadmin/system/health
       → { apiResponseTime, dbQueryTime, queueSize, errorRate }

GET    /api/v1/superadmin/activity-log
       → [{ admin, action, timestamp, details }, ...]
```

### Custom Domain Management

```
POST   /api/v1/schools/:id/domain/add
       { domain: "lessons.parksidemusic.com.au" }
       → { dnsRecords: [{ type: "CNAME", ... }], verificationToken }

GET    /api/v1/schools/:id/domain/verify
       → { verified: true, sslIssued: true }

DELETE /api/v1/schools/:id/domain
       → { success: true }
```

---

## Implementation Phases

### Phase 3A: Foundation (4-5 weeks)

**Goal:** Core SaaS infrastructure

**Deliverables:**
1. ✅ Database schema additions (subscriptions, branding)
2. ✅ Subdomain routing middleware
3. ✅ School registration API
4. ✅ Email verification system
5. ✅ Onboarding wizard API
6. ✅ Basic super admin portal

**Team:**
- 1 Backend Developer (full-time)
- 1 Frontend Developer (full-time)

**Testing:**
- Create second test school manually
- Verify complete data isolation
- Test onboarding flow end-to-end

---

### Phase 3B: Billing System (3-4 weeks)

**Goal:** Stripe subscription integration

**Deliverables:**
1. ✅ Subscription plans configuration
2. ✅ Stripe subscription creation
3. ✅ Stripe webhook handling
4. ✅ Plan limits enforcement
5. ✅ Usage tracking
6. ✅ Payment method management UI
7. ✅ Subscription management UI (upgrade/downgrade/cancel)

**Team:**
- 1 Backend Developer (full-time)
- 1 Frontend Developer (full-time)

**Testing:**
- Test all Stripe webhook events
- Test plan upgrade/downgrade flows
- Test limit enforcement
- Test grace period and suspension

---

### Phase 3C: Branding & Super Admin (2-3 weeks)

**Goal:** White-label branding and platform management

**Deliverables:**
1. ✅ Branding database schema
2. ✅ Branding API endpoints
3. ✅ Branding UI (logo upload, color picker)
4. ✅ Dynamic theme system
5. ✅ Super admin dashboard
6. ✅ School impersonation
7. ✅ Platform analytics

**Team:**
- 1 Full-Stack Developer

**Testing:**
- Test branding across all pages
- Test super admin access control
- Test impersonation security

---

### Phase 3D: Marketing Website (3-4 weeks)

**Goal:** Public-facing marketing site

**Deliverables:**
1. ✅ Marketing site design
2. ✅ Homepage, features, pricing pages
3. ✅ Registration flow integration
4. ✅ SEO optimization
5. ✅ Analytics (Google Analytics, Plausible)
6. ✅ Blog setup (optional: Ghost, WordPress)

**Team:**
- 1 Frontend Developer or Marketing Developer
- 1 Designer/Copywriter

**Testing:**
- Cross-browser testing
- Mobile responsiveness
- SEO audit
- Conversion tracking

---

### Phase 3E: Polish & Launch (1-2 weeks)

**Goal:** Production-ready multi-school platform

**Deliverables:**
1. ✅ End-to-end testing
2. ✅ Security audit
3. ✅ Performance optimization
4. ✅ Documentation
5. ✅ Help center content
6. ✅ Email templates
7. ✅ Launch monitoring

**Team:**
- Full team

**Testing:**
- Load testing (simulate 100 schools)
- Security penetration testing
- User acceptance testing
- Beta testing with 2-3 pilot schools

---

## User Flows

### Flow 1: School Registration

```
1. School owner visits musicnme.com.au
   │
2. Clicks "Start Free Trial"
   │
3. Registration form:
   ├─ School name
   ├─ Subdomain selection (with availability check)
   ├─ Admin details
   └─ Password
   │
4. Submits form
   │
5. System creates:
   ├─ School record (status: PENDING_SETUP)
   ├─ Admin user (emailVerified: false)
   ├─ Subscription (status: TRIALING)
   └─ Email verification token
   │
6. Sends verification email
   │
7. User clicks verification link
   │
8. Redirects to onboarding wizard
   │
9. Onboarding wizard (5 steps):
   ├─ Step 1: School details
   ├─ Step 2: First location
   ├─ Step 3: Instruments
   ├─ Step 4: First term
   └─ Step 5: Pricing
   │
10. Onboarding complete
    │
11. School status: TRIAL
    │
12. Redirect to dashboard
```

### Flow 2: Trial to Paid Conversion

```
1. Day 11 of trial: In-app prompt appears
   │
2. User clicks "Add Payment Method"
   │
3. Plan selection page:
   ├─ BASIC ($99/mo)
   ├─ PRO ($199/mo) ← Recommended
   └─ ENTERPRISE ($499/mo)
   │
4. User selects PRO plan
   │
5. Billing cycle selection:
   ├─ Monthly ($199/mo)
   └─ Annual ($2,150/year - save $238)
   │
6. User selects monthly
   │
7. Stripe checkout page
   │
8. User enters payment details
   │
9. Stripe creates subscription
   │
10. Webhook: customer.subscription.created
    │
11. System updates:
    ├─ Subscription status: ACTIVE
    ├─ School status: ACTIVE
    ├─ Current period start/end
    └─ Stripe IDs
    │
12. Send confirmation email
    │
13. User redirected to dashboard with success message
```

### Flow 3: Payment Failure & Recovery

```
1. Stripe attempts to charge subscription
   │
2. Payment fails
   │
3. Webhook: invoice.payment_failed
   │
4. System:
   ├─ Updates subscription status: PAST_DUE
   ├─ Starts 7-day grace period
   └─ Sends payment failure email
   │
5. Day 1-3: Stripe auto-retries
   │
6. Day 4: Warning email ("3 days until suspension")
   │
7. Day 7: Payment still failed
   │
8. System:
   ├─ Updates subscription status: SUSPENDED
   ├─ Updates school status: SUSPENDED
   └─ Sends suspension email
   │
9. School users see suspension banner:
   "Your account is suspended due to payment failure.
    Update payment method to restore access."
   │
10. School admin updates payment method
    │
11. Stripe retries payment
    │
12. Payment succeeds
    │
13. Webhook: invoice.payment_succeeded
    │
14. System:
    ├─ Updates subscription status: ACTIVE
    ├─ Updates school status: ACTIVE
    └─ Sends reactivation email
    │
15. Full access restored
```

### Flow 4: Super Admin Support

```
1. School admin emails support: "Can't connect Xero"
   │
2. Support ticket created
   │
3. Super admin reviews ticket
   │
4. Super admin logs into super admin portal
   │
5. Searches for school: "Parkside Music"
   │
6. Views school details:
   ├─ 143 students
   ├─ PRO plan
   ├─ Status: ACTIVE
   └─ Xero sync: NOT CONNECTED
   │
7. Super admin clicks "Impersonate Admin"
   │
8. System:
   ├─ Generates temporary JWT (1 hour)
   ├─ Logs impersonation (audit trail)
   └─ Redirects to school dashboard
   │
9. Super admin (as school admin) sees:
   "You are viewing Parkside Music as Super Admin"
   │
10. Super admin navigates to Integrations → Xero
    │
11. Clicks "Connect Xero"
    │
12. Sees error: "Redirect URI mismatch"
    │
13. Super admin identifies issue:
     - School has custom domain
     - Redirect URI uses subdomain instead
    │
14. Super admin fixes configuration
    │
15. Tests Xero connection - works!
    │
16. Super admin exits impersonation
    │
17. Super admin replies to ticket:
     "Fixed! Your Xero connection should work now."
    │
18. Ticket closed
```

---

## Technical Specifications

### Subdomain Routing

**DNS Configuration:**
```
Wildcard DNS record:
*.musicnme.com.au → DigitalOcean App Platform IP

A record:
musicnme.com.au → Marketing site IP

CNAME:
www.musicnme.com.au → musicnme.com.au
```

**DigitalOcean App Platform Configuration:**
```yaml
domains:
  - domain: musicnme.com.au
    type: PRIMARY
  - domain: "*.musicnme.com.au"
    type: ALIAS
```

**Middleware Implementation:**
```typescript
// Place before all routes
app.use(detectSchoolFromHost);
app.use(checkSchoolStatus);

export async function detectSchoolFromHost(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const host = req.get('host');

  // Marketing site
  if (host === 'musicnme.com.au' || host === 'www.musicnme.com.au') {
    return next(); // Skip school detection
  }

  let school: School | null = null;

  // Check custom domain
  school = await redis.get(`school:domain:${host}`);
  if (!school) {
    school = await prisma.school.findFirst({
      where: { customDomain: host },
      include: { subscription: true }
    });
    if (school) {
      await redis.set(`school:domain:${host}`, JSON.stringify(school), 'EX', 3600);
    }
  } else {
    school = JSON.parse(school);
  }

  // Check subdomain
  if (!school && host.endsWith('.musicnme.com.au')) {
    const subdomain = host.replace('.musicnme.com.au', '');

    school = await redis.get(`school:subdomain:${subdomain}`);
    if (!school) {
      school = await prisma.school.findUnique({
        where: { subdomain },
        include: { subscription: true }
      });
      if (school) {
        await redis.set(`school:subdomain:${subdomain}`, JSON.stringify(school), 'EX', 3600);
      }
    } else {
      school = JSON.parse(school);
    }
  }

  if (!school) {
    return res.status(404).json({
      error: 'School not found',
      message: 'No school is configured for this domain.'
    });
  }

  req.school = school;
  next();
}

export function checkSchoolStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const school = req.school;

  if (!school) {
    return next();
  }

  if (school.status === 'SUSPENDED') {
    return res.status(402).json({
      error: 'School suspended',
      message: 'This school account is suspended. Please update payment method.',
      redirectUrl: '/billing/update-payment'
    });
  }

  if (school.status === 'CANCELLED') {
    return res.status(410).json({
      error: 'School cancelled',
      message: 'This school account has been cancelled.'
    });
  }

  next();
}
```

### Plan Limits Enforcement

```typescript
export async function checkStudentLimit(schoolId: string): Promise<void> {
  const subscription = await prisma.schoolSubscription.findUnique({
    where: { schoolId }
  });

  if (!subscription) {
    throw new Error('No subscription found');
  }

  // Unlimited plan
  if (!subscription.maxStudents) {
    return;
  }

  const currentCount = await prisma.student.count({
    where: { schoolId }
  });

  // Soft warning at 80%
  if (currentCount >= subscription.maxStudents * 0.8 && currentCount < subscription.maxStudents) {
    // Show warning banner
    console.warn(`School ${schoolId} at 80% of student limit`);
  }

  // Hard limit
  if (currentCount >= subscription.maxStudents) {
    throw new PlanLimitError(
      `Student limit reached (${subscription.maxStudents}). Please upgrade your plan.`,
      'STUDENT_LIMIT_REACHED',
      { current: currentCount, max: subscription.maxStudents, upgradeUrl: '/billing/upgrade' }
    );
  }
}

// Usage in student creation endpoint
app.post('/students', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    await checkStudentLimit(req.user!.schoolId);

    const student = await studentService.create(req.user!.schoolId, req.body);
    res.json({ success: true, data: student });
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return res.status(402).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          upgradeUrl: error.metadata.upgradeUrl
        }
      });
    }
    throw error;
  }
});
```

### Stripe Subscription Webhooks

```typescript
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }

  res.json({ received: true });
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const schoolSubscription = await prisma.schoolSubscription.findUnique({
    where: { stripeCustomerId: subscription.customer as string }
  });

  if (!schoolSubscription) {
    console.error('Subscription not found for customer:', subscription.customer);
    return;
  }

  await prisma.schoolSubscription.update({
    where: { id: schoolSubscription.id },
    data: {
      stripeSubscriptionId: subscription.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });

  await prisma.school.update({
    where: { id: schoolSubscription.schoolId },
    data: { status: 'ACTIVE' }
  });

  // Send welcome email
  await emailQueue.add({
    to: schoolSubscription.school.adminEmail,
    subject: 'Welcome to Music \'n Me!',
    template: 'subscription-activated',
    data: { schoolName: schoolSubscription.school.name }
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = await prisma.schoolSubscription.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
    include: { school: true }
  });

  if (!subscription) return;

  // Start grace period
  await prisma.schoolSubscription.update({
    where: { id: subscription.id },
    data: { status: 'PAST_DUE' }
  });

  // Record invoice failure
  await prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amount: new Decimal(invoice.amount_due / 100),
      status: 'open',
      paymentFailed: true,
      failureReason: invoice.last_finalization_error?.message,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000)
    }
  });

  // Send payment failure email
  await emailQueue.add({
    to: subscription.school.adminEmail,
    subject: 'Payment Failed - Action Required',
    template: 'payment-failed',
    data: {
      schoolName: subscription.school.name,
      amount: invoice.amount_due / 100,
      updateUrl: `https://${subscription.school.subdomain}.musicnme.com.au/billing/update-payment`
    }
  });

  // Schedule suspension check (7 days later)
  await suspensionQueue.add(
    { subscriptionId: subscription.id },
    { delay: 7 * 24 * 60 * 60 * 1000 } // 7 days
  );
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = await prisma.schoolSubscription.findUnique({
    where: { stripeCustomerId: invoice.customer as string }
  });

  if (!subscription) return;

  // Reactivate if was past due
  if (subscription.status === 'PAST_DUE' || subscription.status === 'SUSPENDED') {
    await prisma.schoolSubscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' }
    });

    await prisma.school.update({
      where: { id: subscription.schoolId },
      data: { status: 'ACTIVE' }
    });
  }

  // Record successful invoice
  await prisma.subscriptionInvoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      stripeHostedUrl: invoice.hosted_invoice_url,
      stripePdfUrl: invoice.invoice_pdf,
      amount: new Decimal(invoice.amount_paid / 100),
      status: 'paid',
      paidAt: new Date(),
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000)
    },
    update: {
      status: 'paid',
      paidAt: new Date(),
      paymentFailed: false
    }
  });
}
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('Subscription Service', () => {
  describe('checkStudentLimit', () => {
    it('should allow creation when under limit', async () => {
      const school = await createTestSchool({ maxStudents: 50 });
      await createTestStudents(school.id, 40);

      await expect(checkStudentLimit(school.id)).resolves.not.toThrow();
    });

    it('should throw error when at limit', async () => {
      const school = await createTestSchool({ maxStudents: 50 });
      await createTestStudents(school.id, 50);

      await expect(checkStudentLimit(school.id))
        .rejects.toThrow(PlanLimitError);
    });

    it('should allow unlimited for null maxStudents', async () => {
      const school = await createTestSchool({ maxStudents: null });
      await createTestStudents(school.id, 1000);

      await expect(checkStudentLimit(school.id)).resolves.not.toThrow();
    });
  });
});
```

### Integration Tests

```typescript
describe('POST /api/v1/public/schools/register', () => {
  it('should register new school with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/public/schools/register')
      .send({
        schoolName: 'Test Academy',
        subdomain: 'test-academy',
        adminFirstName: 'John',
        adminLastName: 'Doe',
        adminEmail: 'john@testacademy.com',
        password: 'SecurePass123!',
        estimatedStudents: 100,
        agreeToTerms: true
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.schoolId).toBeDefined();

    // Verify school created
    const school = await prisma.school.findUnique({
      where: { subdomain: 'test-academy' }
    });
    expect(school).toBeDefined();
    expect(school.status).toBe('PENDING_SETUP');

    // Verify subscription created
    const subscription = await prisma.schoolSubscription.findUnique({
      where: { schoolId: school.id }
    });
    expect(subscription).toBeDefined();
    expect(subscription.status).toBe('TRIALING');
  });

  it('should reject duplicate subdomain', async () => {
    await createTestSchool({ subdomain: 'existing' });

    const response = await request(app)
      .post('/api/v1/public/schools/register')
      .send({
        subdomain: 'existing',
        // ... other fields
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('SUBDOMAIN_TAKEN');
  });
});
```

### End-to-End Tests

```typescript
describe('Complete Registration Flow', () => {
  it('should complete full registration and onboarding', async () => {
    // 1. Check subdomain availability
    const checkResponse = await request(app)
      .post('/api/v1/public/schools/check-subdomain')
      .send({ subdomain: 'e2e-test' });
    expect(checkResponse.body.available).toBe(true);

    // 2. Register school
    const registerResponse = await request(app)
      .post('/api/v1/public/schools/register')
      .send({
        schoolName: 'E2E Test School',
        subdomain: 'e2e-test',
        adminEmail: 'admin@e2etest.com',
        // ... other fields
      });
    expect(registerResponse.status).toBe(201);
    const { schoolId } = registerResponse.body.data;

    // 3. Verify email (simulate)
    const verificationToken = await getVerificationToken('admin@e2etest.com');
    const verifyResponse = await request(app)
      .post('/api/v1/public/schools/verify-email')
      .send({ email: 'admin@e2etest.com', token: verificationToken });
    expect(verifyResponse.body.verified).toBe(true);
    const { loginToken } = verifyResponse.body;

    // 4. Complete onboarding wizard
    await request(app)
      .post(`/api/v1/schools/${schoolId}/onboarding/school-details`)
      .set('Authorization', `Bearer ${loginToken}`)
      .send({ country: 'Australia', timezone: 'Australia/Sydney', currency: 'AUD' });

    await request(app)
      .post(`/api/v1/schools/${schoolId}/onboarding/location`)
      .set('Authorization', `Bearer ${loginToken}`)
      .send({ name: 'Main Studio', rooms: [{ name: 'Room 1', capacity: 10 }] });

    // ... complete remaining steps

    const completeResponse = await request(app)
      .post(`/api/v1/schools/${schoolId}/onboarding/complete`)
      .set('Authorization', `Bearer ${loginToken}`);

    expect(completeResponse.body.success).toBe(true);

    // 5. Verify school status
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    expect(school.status).toBe('TRIAL');
    expect(school.onboardingCompleted).toBe(true);
  });
});
```

### Load Testing

```bash
# Test platform with 100 simulated schools
k6 run --vus 100 --duration 10m load-test.js
```

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 schools
    { duration: '5m', target: 100 }, // Stay at 100 schools
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  // Simulate school admin logging in
  const loginRes = http.post('https://api.musicnme.com.au/api/v1/auth/login', {
    email: `admin${__VU}@testschool${__VU}.com`,
    password: 'test123',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const token = loginRes.json('data.token');

  // Simulate fetching dashboard
  const dashboardRes = http.get('https://api.musicnme.com.au/api/v1/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
  });

  sleep(1);
}
```

---

## Deployment Considerations

### Database Scaling

**Current:** Single PostgreSQL instance

**At scale (50+ schools):**
- Read replicas for reporting queries
- Connection pooling (PgBouncer)
- Partition large tables by schoolId

### Redis Caching

**Cache Layers:**
```typescript
// School data (changes infrequently)
const school = await redis.get(`school:${schoolId}`);

// Subscription data
const subscription = await redis.get(`subscription:${schoolId}`);

// Branding data
const branding = await redis.get(`branding:${schoolId}`);

// Invalidation on update
await redis.del(`school:${schoolId}`);
```

### CDN for Static Assets

Use DigitalOcean Spaces CDN for:
- School logos
- Custom branding assets
- Email images
- Invoice headers

### Monitoring & Alerting

**Metrics to Track:**
- API response times (p50, p95, p99)
- Database query times
- Queue processing times
- Error rates (grouped by endpoint)
- Subscription churn rate
- Trial conversion rate
- MRR/ARR
- Active schools count

**Alerts:**
- Error rate > 1%
- API response time p95 > 500ms
- Queue backlog > 1000 jobs
- Payment failure spike
- School cancellation spike

**Tools:**
- Application: Sentry (errors)
- Infrastructure: DigitalOcean Monitoring
- Business Metrics: Custom dashboard (Grafana or Metabase)

### Backup Strategy

**Database Backups:**
- Automated daily snapshots (DigitalOcean)
- Manual snapshot before major deployments
- Test restore process quarterly

**Data Retention:**
- Active schools: Real-time
- Cancelled schools: 90 days
- Then: Archive to cold storage (S3 Glacier)

---

## Revenue Model

### Pricing Strategy

**Trial:** Free for 14 days (no credit card)

**BASIC - $99/month**
- Target: Small schools (<50 students)
- Break-even: ~$5 per school (infrastructure cost)
- Profit margin: ~95%

**PRO - $199/month** (Most Popular)
- Target: Medium schools (50-200 students)
- Higher margin
- Includes premium features (WhatsApp, Xero)

**ENTERPRISE - $499/month**
- Target: Large schools (200+ students)
- Highest margin
- White-label branding
- Dedicated support

### Revenue Projections

**Year 1 Goals:**
- 50 active schools
- 60% on PRO, 30% on BASIC, 10% on ENTERPRISE
- MRR: (30 × $99) + (30 × $199) + (5 × $499) = $11,445
- ARR: $137,340

**Year 2 Goals:**
- 150 active schools
- MRR: ~$30,000
- ARR: ~$360,000

**Year 3 Goals:**
- 300 active schools
- MRR: ~$60,000
- ARR: ~$720,000

### Customer Acquisition Cost (CAC)

**Estimated CAC:** $300-500 per school
- Google Ads
- Content marketing
- Referral program
- Sales team

**Payback Period:**
- BASIC plan: 5-6 months
- PRO plan: 2-3 months
- ENTERPRISE plan: 1 month

**Lifetime Value (LTV):**
- Average subscription: 24 months
- PRO plan LTV: $199 × 24 = $4,776
- LTV:CAC ratio: ~10:1 (excellent)

---

## Success Metrics

### Phase 3 Launch Metrics

**Technical Metrics:**
- ✅ Multi-school isolation verified (0 data leakage incidents)
- ✅ Subdomain routing working (100% uptime)
- ✅ Stripe webhooks reliable (99%+ delivery)
- ✅ API response time <200ms (p95)

**Business Metrics:**
- ✅ 5 pilot schools onboarded
- ✅ Trial-to-paid conversion rate >30%
- ✅ 0 critical bugs in first month
- ✅ Customer satisfaction score >4.5/5

### 6-Month Targets

- 25 active paying schools
- MRR: $5,000+
- Churn rate: <5%
- NPS score: >50

### 12-Month Targets

- 50 active paying schools
- MRR: $11,000+
- Trial conversion: >35%
- Customer support: <24h response time

---

## Risk Mitigation

### Technical Risks

**Risk:** Data isolation bug (school A sees school B data)
**Mitigation:**
- Comprehensive testing of all queries
- Code review checklist for `schoolId` filtering
- Automated tests for cross-school queries
- Penetration testing

**Risk:** Subdomain routing fails
**Mitigation:**
- Fallback to manual routing
- Monitoring with alerts
- DNS redundancy

**Risk:** Stripe webhook delivery fails
**Mitigation:**
- Webhook signature verification
- Idempotency handling
- Manual reconciliation dashboard
- Webhook retry logic

### Business Risks

**Risk:** Low trial conversion
**Mitigation:**
- Improve onboarding experience
- A/B test pricing
- Offer onboarding calls
- Extend trial to 21 days

**Risk:** High churn rate
**Mitigation:**
- Customer success calls
- Feature usage tracking
- Exit surveys
- Win-back campaigns

**Risk:** Support burden too high
**Mitigation:**
- Comprehensive help center
- Video tutorials
- In-app tooltips
- Community forum

---

## Next Steps

### Prerequisites

Before starting Phase 3:
1. ✅ Phase 1 & 2 MVP complete and stable
2. ✅ Music 'n Me successfully using platform (>6 months)
3. ✅ 2-3 case studies documented
4. ✅ Feature requests prioritized
5. ✅ Team capacity confirmed

### Approval Checklist

- [ ] Budget approved (~$150k for 5-month development)
- [ ] Timeline approved (14-20 weeks)
- [ ] Team assembled (2 developers + 1 designer)
- [ ] Stripe account approved for marketplace
- [ ] Legal review (terms of service, privacy policy)
- [ ] Pricing strategy finalized
- [ ] Marketing site copywriting complete

### Phase 3 Kickoff

**Week 1:**
- Project kickoff meeting
- Design review (marketing site, super admin portal)
- Technical architecture review
- Database migration plan
- Set up project board (Jira, Linear, etc.)

**Week 2:**
- Begin Phase 3A development
- Daily standups
- Weekly demos

---

## Conclusion

This document provides a comprehensive blueprint for transforming Music 'n Me into a multi-tenant SaaS platform. The foundation is already solid with complete data isolation and configurable school settings. Phase 3 adds the SaaS operations layer that enables self-service registration, subscription billing, and platform-wide management.

**Key Takeaways:**
1. **Foundation is Ready:** Multi-tenant architecture is complete
2. **Clear Scope:** 14-20 weeks of focused development
3. **Revenue Potential:** $137k ARR in Year 1 with 50 schools
4. **Low Risk:** Proven architecture, incremental rollout
5. **Customer Demand:** Opus1 gaps create market opportunity

**When you're ready to proceed**, this document serves as the complete technical and business specification for Phase 3 development.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-21
**Status:** Ready for Review
