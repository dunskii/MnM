# Music 'n Me - Technical Architecture Overview
**Comprehensive Technical Specification**

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [API Architecture](#api-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
7. [Core Business Logic](#core-business-logic)
8. [Third-Party Integrations](#third-party-integrations)
9. [File Storage & Management](#file-storage--management)
10. [Queue System & Background Jobs](#queue-system--background-jobs)
11. [Security Implementation](#security-implementation)
12. [Performance Optimization](#performance-optimization)
13. [Error Handling & Logging](#error-handling--logging)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Architecture](#deployment-architecture)
16. [Development Workflow](#development-workflow)
17. [Monitoring & Observability](#monitoring--observability)
18. [Scalability Considerations](#scalability-considerations)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  React SPA (Vite + TypeScript + Material-UI)                │
│  - Admin Dashboard                                           │
│  - Teacher Dashboard                                         │
│  - Parent Dashboard                                          │
│  - Student Dashboard                                         │
│                                                               │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS / REST API
                  │ JWT Bearer Tokens
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Node.js + Express + TypeScript                              │
│  ┌───────────────────────────────────────────────────┐      │
│  │ API Routes                                        │      │
│  │  - /api/v1/auth                                   │      │
│  │  - /api/v1/schools                                │      │
│  │  - /api/v1/lessons                                │      │
│  │  - /api/v1/enrollments                            │      │
│  │  - /api/v1/attendance                             │      │
│  │  - /api/v1/invoices                               │      │
│  │  - /api/v1/payments                               │      │
│  │  - /api/v1/notifications                          │      │
│  │  - /api/v1/calendar                               │      │
│  │  - /api/v1/xero                                   │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │ Middleware                                        │      │
│  │  - CORS                                           │      │
│  │  - Rate Limiting                                  │      │
│  │  - Request Logging                                │      │
│  │  - Error Handling                                 │      │
│  │  - JWT Authentication                             │      │
│  │  - Role-Based Access Control                     │      │
│  │  - Multi-Tenant Isolation                        │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │ Services Layer                                    │      │
│  │  - LessonService                                  │      │
│  │  - HybridLessonService                            │      │
│  │  - EnrollmentService                              │      │
│  │  - InvoiceService                                 │      │
│  │  - PaymentService                                 │      │
│  │  - NotificationService                            │      │
│  │  - CalendarSyncService                            │      │
│  │  - XeroSyncService                                │      │
│  │  - FileStorageService                             │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└─────────────┬──────────────────┬────────────────────────────┘
              │                  │
              ▼                  ▼
┌─────────────────────┐  ┌──────────────────────┐
│   DATA LAYER        │  │   QUEUE LAYER        │
├─────────────────────┤  ├──────────────────────┤
│                     │  │                      │
│  PostgreSQL 15+     │  │  Redis + Bull        │
│  - Prisma ORM       │  │  - Email Queue       │
│  - Connection Pool  │  │  - WhatsApp Queue    │
│  - Migrations       │  │  - SMS Queue         │
│  - Indexes          │  │  - Xero Sync Queue   │
│                     │  │  - Calendar Queue    │
└─────────────────────┘  └──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES LAYER                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Stripe API          Twilio API        SendGrid API         │
│  (Payments)          (WhatsApp/SMS)    (Email)              │
│                                                               │
│  Google Calendar API  Xero API         DigitalOcean Spaces  │
│  (Calendar Sync)      (Accounting)     (File Storage)       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Patterns

**Monolithic Backend with Service Layer**
- Single Node.js application
- Organized by domain (lessons, invoices, users, etc.)
- Service layer encapsulates business logic
- Controllers handle HTTP concerns
- Repositories/Prisma handle data access

**SPA Frontend**
- React with client-side routing (React Router)
- API-first design (backend is headless)
- State management via React Query (server state) + Context API (local state)
- Material-UI component library

**Event-Driven Background Processing**
- Bull queues for async operations
- Redis as queue backing store
- Separate worker processes for different job types

---

## Technology Stack

### Backend

#### Core Framework
```json
{
  "runtime": "Node.js 18.x LTS",
  "language": "TypeScript 5.x",
  "framework": "Express.js 4.x",
  "orm": "Prisma 5.x",
  "validation": "Zod",
  "testing": "Jest + Supertest"
}
```

#### Key Dependencies
```json
{
  "express": "^4.18.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "typescript": "^5.0.0",
  "zod": "^3.22.0",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-rate-limit": "^6.10.0",
  "winston": "^3.10.0",
  "date-fns": "^2.30.0",
  "decimal.js": "^10.4.0",
  "bull": "^4.11.0",
  "ioredis": "^5.3.0"
}
```

#### Third-Party SDKs
```json
{
  "stripe": "^13.0.0",
  "twilio": "^4.18.0",
  "@sendgrid/mail": "^7.7.0",
  "googleapis": "^126.0.0",
  "xero-node": "^5.0.0",
  "aws-sdk": "^2.1450.0"
}
```

### Frontend

#### Core Framework
```json
{
  "framework": "React 18.x",
  "language": "TypeScript 5.x",
  "build": "Vite 4.x",
  "ui": "Material-UI 5.x (MUI)",
  "testing": "Jest + React Testing Library"
}
```

#### Key Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.16.0",
  "typescript": "^5.0.0",
  "@mui/material": "^5.14.0",
  "@mui/icons-material": "^5.14.0",
  "@emotion/react": "^11.11.0",
  "@emotion/styled": "^11.11.0",
  "@tanstack/react-query": "^4.35.0",
  "react-hook-form": "^7.47.0",
  "react-big-calendar": "^1.8.5",
  "react-big-calendar-dnd": "^1.0.0",
  "date-fns": "^2.30.0",
  "axios": "^1.5.0",
  "recharts": "^2.8.0"
}
```

### Database

```yaml
Database: PostgreSQL 15+
ORM: Prisma 5.x
Connection Pooling: PgBouncer (production)
Backup Strategy: Daily automated snapshots
Migration Strategy: Prisma Migrate
```

### Infrastructure

```yaml
Hosting: DigitalOcean
  - App Platform (Backend + Frontend)
  - Managed PostgreSQL
  - Spaces (S3-compatible storage)
  - Redis Cluster

CDN: DigitalOcean Spaces CDN
SSL: Let's Encrypt (via App Platform)
Domain Management: Configurable
```

---

## Database Architecture

### Schema Overview

The database follows a normalized relational design with careful attention to:
- Multi-tenant isolation (every table has `schoolId`)
- Referential integrity (foreign keys with cascade rules)
- Indexing strategy for query performance
- Decimal types for financial data (avoid floating point)

### Core Entity Relationships

```
School (1) ──────────── (*) Location
              │
              ├────────── (*) Room
              │
              ├────────── (*) User (ADMIN, TEACHER, PARENT, STUDENT)
              │
              ├────────── (*) Student
              │
              ├────────── (*) SchoolTerm
              │
              ├────────── (*) Lesson
              │
              ├────────── (*) Invoice
              │
              └────────── (1) XeroSync

User (1) ─────────────── (1) Student (if role = STUDENT)
     │
     ├────────────────── (1) NotificationPreference
     │
     └────────────────── (1) CalendarSync

Lesson (1) ─────────────(*) Enrollment ─────────── (1) Student
       │
       ├────────────────(*) Attendance ─────────── (1) Student
       │
       ├────────────────(1) HybridLessonConfig
       │
       ├────────────────(*) IndividualSessionBooking ─── (1) Student
       │
       └────────────────(*) CalendarPlaceholder

FamilyGroup (1) ────────(*) User (parents)
            │
            └────────────(*) Invoice

Invoice (1) ────────────(*) InvoiceLineItem
        │
        └────────────────(*) Payment
```

### Schema Definition (Prisma)

#### School & Location Models

```prisma
model School {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phone     String?
  website   String?

  // Multi-country support
  timezone  String   @default("Australia/Sydney")
  currency  String   @default("AUD")

  // Configurable settings
  taxRate   Decimal  @default(0.10) // GST 10%

  locations     Location[]
  users         User[]
  students      Student[]
  lessons       Lesson[]
  terms         SchoolTerm[]
  familyGroups  FamilyGroup[]
  invoices      Invoice[]
  instruments   Instrument[]
  xeroSync      XeroSync?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Location {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  name      String
  address   String?
  city      String?
  state     String?
  postcode  String?
  country   String   @default("Australia")
  phone     String?

  timezone  String?  // Override school timezone if needed

  rooms     Room[]
  lessons   Lesson[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@unique([schoolId, name])
}

model Room {
  id         String   @id @default(cuid())
  locationId String
  location   Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  name       String
  capacity   Int?
  equipment  Json?    // Array of equipment: ["Piano", "Drum Kit", "Amplifiers"]

  lessons    Lesson[]
  individualBookings IndividualSessionBooking[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([locationId])
  @@unique([locationId, name])
}

model Instrument {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  name      String   // "Piano", "Guitar", "Drums", "Singing"
  category  String?  // "String", "Percussion", "Vocal", "Brass"
  active    Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@unique([schoolId, name])
}
```

#### User & Authentication Models

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  firstName String
  lastName  String
  phone     String?
  role      Role     @default(STUDENT)

  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Teacher-specific fields
  bio          String?
  specialties  String?  // "Piano, Guitar" (comma-separated)
  hourlyRate   Decimal? // For internal tracking

  // Account status
  active       Boolean  @default(true)
  emailVerified Boolean @default(false)
  lastLoginAt   DateTime?

  // Relations
  lessonsAsInstructor Lesson[]
  studentProfile      Student?
  familyGroupId       String?
  familyGroup         FamilyGroup? @relation("FamilyMembers", fields: [familyGroupId], references: [id])
  ownedFamilyGroups   FamilyGroup[] @relation("FamilyAdmin")
  notificationPrefs   NotificationPreference?
  calendarSync        CalendarSync?
  uploadedFiles       TeachingResource[]
  attendanceRecords   Attendance[] @relation("RecordedBy")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([email])
  @@index([role])
  @@index([schoolId, role])
}

enum Role {
  ADMIN
  TEACHER
  PARENT
  STUDENT
}

model FamilyGroup {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  name      String   // "Smith Family"
  adminId   String
  admin     User     @relation("FamilyAdmin", fields: [adminId], references: [id])

  members   User[]   @relation("FamilyMembers")
  invoices  Invoice[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([adminId])
}

model Student {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id])

  // Emergency contact (if different from parent)
  emergencyContactName  String?
  emergencyContactPhone String?

  // Student details
  dateOfBirth DateTime?
  grade       String?     // "Year 5", "Grade 3"
  schoolName  String?     // Which school they attend

  // Music details
  primaryInstrument  String?
  skillLevel         SkillLevel?
  medicalNotes       String?    // Allergies, conditions

  enrollments      Enrollment[]
  attendance       Attendance[]
  individualBookings IndividualSessionBooking[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([userId])
}

enum SkillLevel {
  BEGINNER
  ELEMENTARY
  INTERMEDIATE
  ADVANCED
  PROFESSIONAL
}
```

#### Term & Lesson Models

```prisma
model SchoolTerm {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  name      String   // "Term 1 2025"
  year      Int      // 2025
  termNumber Int     // 1, 2, 3, 4
  startDate DateTime
  endDate   DateTime

  // Metadata
  enrollmentOpenDate DateTime? // When parents can enroll
  enrollmentCloseDate DateTime?
  invoiceDueDate     DateTime?

  lessons   Lesson[]
  invoices  Invoice[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([schoolId, year, termNumber])
  @@index([startDate])
  @@unique([schoolId, year, termNumber])
}

model Lesson {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  termId    String
  term      SchoolTerm @relation(fields: [termId], references: [id])

  title       String
  description String?
  type        LessonType
  instrument  String?    // "Piano", "Guitar"

  instructorId String
  instructor   User @relation(fields: [instructorId], references: [id])

  // Location (NULL for online/virtual)
  locationId String?
  location   Location? @relation(fields: [locationId], references: [id])
  roomId     String?
  room       Room?     @relation(fields: [roomId], references: [id])

  // Scheduling (for GROUP/INDIVIDUAL/BAND)
  // NULL for HYBRID (uses HybridLessonConfig instead)
  startTime    DateTime?
  endTime      DateTime?
  duration     Int?      // minutes
  recurrence   Recurrence? @default(WEEKLY)
  dayOfWeek    Int?      // 0-6 (Sunday-Saturday)

  // Capacity
  maxStudents  Int?      // Max for group lessons
  minStudents  Int?      // Minimum to run

  // Pricing
  groupLessonPrice      Decimal?
  individualLessonPrice Decimal?

  status       LessonStatus @default(SCHEDULED)

  // Relations
  enrollments      Enrollment[]
  attendance       Attendance[]
  hybridConfig     HybridLessonConfig?
  calendarPlaceholders CalendarPlaceholder[]
  individualBookings   IndividualSessionBooking[]
  teachingResources    TeachingResource[]
  calendarEvents       CalendarEvent[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([termId])
  @@index([instructorId])
  @@index([type])
  @@index([schoolId, termId, type])
  @@index([startTime])
}

enum LessonType {
  INDIVIDUAL       // One-on-one, fixed schedule
  GROUP            // Group class, fixed schedule
  HYBRID           // Alternating group/individual
  BAND_REHEARSAL   // Ensemble/band
  WORKSHOP         // One-off events
}

enum Recurrence {
  ONCE
  WEEKLY
  BIWEEKLY
  MONTHLY
  CUSTOM
}

enum LessonStatus {
  DRAFT
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  POSTPONED
}
```

#### Hybrid Lesson Models

```prisma
model HybridLessonConfig {
  id        String   @id @default(cuid())
  lessonId  String   @unique
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  // Cycle configuration
  cycleLength        Int      // e.g., 10 weeks
  cycleStartDate     DateTime

  // Week-by-week pattern (JSON array)
  // [{ "week": 1, "type": "GROUP" }, { "week": 4, "type": "INDIVIDUAL" }, ...]
  weekPattern        Json

  // Group lesson settings
  groupLessonDay     Int?     // 0-6 (Sunday-Saturday)
  groupLessonTime    String?  // HH:mm (e.g., "16:00")
  groupLessonDuration Int     @default(60)
  groupLessonLocationId String?
  groupLessonRoomId     String?

  // Individual lesson settings
  individualLessonDuration Int @default(45)

  // Booking management (ADMIN CONTROLLED)
  bookingsOpen       Boolean   @default(false)
  bookingsOpenedAt   DateTime?
  bookingsOpenedBy   String?   // userId of admin who opened

  // Rescheduling policy
  allowParentReschedule Boolean @default(true)
  minRescheduleHours    Int     @default(24)
  maxRescheduleCount    Int?    @default(2) // Max reschedules per session

  // Display labels (customizable per lesson)
  individualWeekLabel String @default("1-on-1 Week")
  groupWeekLabel      String @default("Group Class")

  // Notification settings
  sendBookingReminders Boolean @default(true)
  reminderDaysBefore   Int     @default(7)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([lessonId])
}

model IndividualSessionBooking {
  id        String   @id @default(cuid())

  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  cycleWeek Int      // Which week in cycle (1-10 for 10-week cycle)

  // Scheduled details
  scheduledDate DateTime
  startTime     String  // HH:mm
  endTime       String  // HH:mm
  duration      Int     @default(45)

  locationId String?
  roomId     String?
  room       Room?   @relation(fields: [roomId], references: [id])

  status    BookingStatus @default(CONFIRMED)

  // Booking metadata
  bookedBy  String   // userId (parent or admin)
  bookedAt  DateTime @default(now())

  // Rescheduling history
  rescheduledFrom DateTime?
  rescheduledBy   String?
  rescheduledAt   DateTime?
  rescheduleCount Int      @default(0)

  // Attendance
  attended Boolean?
  attendanceNotes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([lessonId, studentId, cycleWeek])
  @@index([lessonId])
  @@index([studentId])
  @@index([scheduledDate])
  @@index([lessonId, cycleWeek])
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  RESCHEDULED
  COMPLETED
  NO_SHOW
}

model CalendarPlaceholder {
  id        String   @id @default(cuid())

  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  date      DateTime
  startTime String   // HH:mm
  endTime   String   // HH:mm

  type      PlaceholderType
  label     String   // e.g., "1-on-1 Week", "School Holiday"
  description String?

  createdAt DateTime @default(now())

  @@index([lessonId])
  @@index([date])
  @@index([lessonId, date])
}

enum PlaceholderType {
  HYBRID_INDIVIDUAL_WEEK
  CANCELLED
  HOLIDAY
  SCHOOL_CLOSURE
  TEACHER_ABSENCE
}
```

#### Enrollment & Attendance Models

```prisma
model Enrollment {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  status    EnrollmentStatus @default(ACTIVE)

  enrolledAt   DateTime @default(now())
  enrolledBy   String?  // userId of admin who enrolled
  unenrolledAt DateTime?
  unenrolledBy String?

  // Waitlist support
  waitlisted   Boolean  @default(false)
  waitlistedAt DateTime?

  notes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([lessonId, studentId])
  @@index([studentId])
  @@index([lessonId])
  @@index([lessonId, status])
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  UNENROLLED
  WAITLISTED
}

model Attendance {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  lessonDate DateTime // Actual date of lesson occurrence
  present    Boolean

  absenceReason String?  // "Sick", "Holiday", "School Camp"
  notes         String?

  recordedBy String   // userId of teacher
  recordedByUser User @relation("RecordedBy", fields: [recordedBy], references: [id])
  recordedAt DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([lessonId, studentId, lessonDate])
  @@index([studentId])
  @@index([lessonId])
  @@index([lessonDate])
}
```

#### Invoice & Payment Models

```prisma
model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique
  schoolId        String
  school          School   @relation(fields: [schoolId], references: [id])

  // Who is being invoiced
  familyId        String?
  familyGroup     FamilyGroup? @relation(fields: [familyId], references: [id])
  studentId       String?  // If not family-based

  termId          String
  term            SchoolTerm @relation(fields: [termId], references: [id])

  // Status
  status          InvoiceStatus @default(DRAFT)

  // Dates
  issueDate       DateTime?
  dueDate         DateTime
  sentDate        DateTime?
  paidDate        DateTime?

  // Amounts (use Decimal for financial precision)
  subtotal        Decimal
  tax             Decimal   @default(0)
  discount        Decimal   @default(0)
  total           Decimal
  amountPaid      Decimal   @default(0)
  amountDue       Decimal   // Computed: total - amountPaid

  // Line items and payments
  lineItems       InvoiceLineItem[]
  payments        Payment[]

  // Xero integration
  xeroInvoiceId   String?  @unique
  xeroSyncStatus  XeroSyncStatus?
  xeroSyncedAt    DateTime?
  xeroSyncError   String?

  // Metadata
  notes           String?
  terms           String?  // Payment terms text
  createdBy       String?  // userId

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([familyId])
  @@index([termId])
  @@index([status])
  @@index([dueDate])
  @@index([schoolId, status])
}

model InvoiceLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  type        LineItemType
  description String

  quantity    Decimal
  unitPrice   Decimal
  totalPrice  Decimal

  // Optional references
  lessonId    String?  // If this line item is for a lesson
  category    String?  // "BOOK", "EXAM", "EXCURSION"

  // Metadata
  sortOrder   Int      @default(0)

  createdAt DateTime @default(now())

  @@index([invoiceId])
  @@index([lessonId])
}

enum LineItemType {
  GROUP_LESSON
  INDIVIDUAL_LESSON
  BOOK
  SUPPLIES
  EXAM_FEE
  EXCURSION
  MATERIALS
  REGISTRATION_FEE
  LATE_FEE
  DISCOUNT
  OTHER
}

enum InvoiceStatus {
  DRAFT
  PENDING_SEND
  SENT
  PAID
  PARTIALLY_PAID
  OVERDUE
  CANCELLED
  REFUNDED
}

enum XeroSyncStatus {
  PENDING
  SYNCED
  FAILED
}

model Payment {
  id        String   @id @default(cuid())
  invoiceId String
  invoice   Invoice  @relation(fields: [invoiceId], references: [id])

  amount    Decimal
  method    PaymentMethod @default(STRIPE)
  status    PaymentStatus @default(PENDING)

  // Stripe integration
  stripePaymentIntentId String?  @unique
  stripeChargeId        String?
  stripePaymentMethod   String?  // Last 4 digits of card

  // Manual payment details
  reference      String?  // Bank transfer reference, check number
  receivedBy     String?  // userId of admin who recorded payment

  paidAt    DateTime?
  notes     String?

  // Refund support
  refundedAmount Decimal  @default(0)
  refundedAt     DateTime?
  refundReason   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([invoiceId])
  @@index([status])
  @@index([stripePaymentIntentId])
}

enum PaymentMethod {
  STRIPE
  BANK_TRANSFER
  CASH
  CHECK
  PAYPAL
  OTHER
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}
```

#### File & Resource Models

```prisma
model TeachingResource {
  id        String   @id @default(cuid())

  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  uploadedBy String
  uploader   User    @relation(fields: [uploadedBy], references: [id])

  // File metadata
  fileName    String
  fileSize    Int      // bytes
  mimeType    String
  storageKey  String   // S3/Spaces object key
  publicUrl   String?

  // Categorization
  resourceType ResourceType
  title        String
  description  String?

  // Access control
  visibleToStudents Boolean @default(true)

  // Download tracking
  downloadCount Int      @default(0)

  uploadedAt DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([lessonId])
  @@index([uploadedBy])
  @@index([resourceType])
}

enum ResourceType {
  SHEET_MUSIC
  BACKING_TRACK
  RECORDING
  VIDEO
  DOCUMENT
  IMAGE
  OTHER
}
```

#### Integration Models

```prisma
model NotificationPreference {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // WhatsApp (via Twilio)
  whatsappEnabled       Boolean @default(false)
  whatsappPhone         String?
  whatsappLessonReminders  Boolean @default(true)
  whatsappLessonChanges    Boolean @default(true)
  whatsappPayments         Boolean @default(true)
  whatsappHybridBooking    Boolean @default(true)

  // SMS (fallback via Twilio)
  smsEnabled            Boolean @default(false)
  smsPhone              String?

  // Email (via SendGrid)
  emailEnabled          Boolean @default(true)
  emailLessonReminders  Boolean @default(true)
  emailLessonChanges    Boolean @default(true)
  emailPayments         Boolean @default(true)
  emailHybridBooking    Boolean @default(true)

  // Marketing/promotional
  marketingOptIn        Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model CalendarSync {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider        CalendarProvider

  // OAuth tokens
  accessToken     String   @db.Text
  refreshToken    String   @db.Text
  expiresAt       DateTime

  // Which calendar to sync to
  calendarId      String
  calendarName    String?

  syncEnabled     Boolean  @default(true)
  lastSyncAt      DateTime?
  lastSyncStatus  SyncStatus?
  lastSyncError   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([provider])
}

enum CalendarProvider {
  GOOGLE
  MICROSOFT
  APPLE
}

enum SyncStatus {
  SUCCESS
  PARTIAL
  FAILED
}

model CalendarEvent {
  id              String   @id @default(cuid())

  lessonId        String
  lesson          Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  userId          String   // Teacher or parent who has sync enabled

  provider        CalendarProvider
  externalEventId String   // Google Calendar event ID, etc.

  syncedAt        DateTime @default(now())
  lastModified    DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, provider, externalEventId])
  @@index([lessonId])
  @@index([userId])
}

model XeroSync {
  id              String   @id @default(cuid())
  schoolId        String   @unique
  school          School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Xero tenant ID (organization)
  tenantId        String
  tenantName      String?

  // OAuth tokens
  accessToken     String   @db.Text
  refreshToken    String   @db.Text
  expiresAt       DateTime

  // Sync configuration
  syncEnabled     Boolean  @default(true)
  autoSyncInvoices Boolean @default(true)
  autoSyncPayments Boolean @default(true)

  // Xero account codes
  revenueAccountCode String? // Where lesson income is posted
  taxType            String? // GST type

  lastSyncAt      DateTime?
  lastSyncStatus  SyncStatus?
  lastSyncError   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
}
```

#### Queue & Job Models

```prisma
model NotificationJob {
  id        String   @id @default(cuid())

  type      NotificationType
  channel   NotificationChannel

  recipientId String  // userId
  recipientPhone String?
  recipientEmail String?

  subject   String?
  message   String   @db.Text

  // Template support
  templateId String?
  templateData Json?

  status    JobStatus @default(PENDING)
  attempts  Int      @default(0)
  maxAttempts Int    @default(3)

  scheduledFor DateTime?
  processedAt  DateTime?

  error     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([recipientId])
  @@index([scheduledFor])
}

enum NotificationType {
  LESSON_REMINDER
  LESSON_RESCHEDULED
  LESSON_CANCELLED
  HYBRID_BOOKING_OPEN
  HYBRID_BOOKING_REMINDER
  INVOICE_CREATED
  INVOICE_DUE
  INVOICE_OVERDUE
  PAYMENT_RECEIVED
  ATTENDANCE_MARKED
  RESOURCE_UPLOADED
}

enum NotificationChannel {
  WHATSAPP
  SMS
  EMAIL
  PUSH  // Future: mobile app
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

### Indexing Strategy

**Critical Indexes for Performance:**

```sql
-- Multi-tenant queries (CRITICAL)
CREATE INDEX idx_lesson_school_term ON "Lesson"("schoolId", "termId");
CREATE INDEX idx_enrollment_student ON "Enrollment"("studentId", "status");
CREATE INDEX idx_invoice_school_status ON "Invoice"("schoolId", "status");

-- Calendar queries
CREATE INDEX idx_lesson_start_time ON "Lesson"("startTime");
CREATE INDEX idx_booking_scheduled_date ON "IndividualSessionBooking"("scheduledDate");
CREATE INDEX idx_placeholder_date ON "CalendarPlaceholder"("date");

-- Search and filtering
CREATE INDEX idx_user_school_role ON "User"("schoolId", "role");
CREATE INDEX idx_lesson_instructor ON "Lesson"("instructorId", "startTime");

-- Payment tracking
CREATE INDEX idx_invoice_due_date ON "Invoice"("dueDate", "status");
CREATE INDEX idx_payment_status ON "Payment"("status", "createdAt");

-- Integration sync
CREATE INDEX idx_invoice_xero ON "Invoice"("xeroInvoiceId");
CREATE INDEX idx_calendar_event_user ON "CalendarEvent"("userId", "provider");
```

---

## API Architecture

### RESTful API Design

**Base URL**: `https://api.musicnme.com.au/api/v1`

**API Versioning**: URL-based (`/api/v1/`, `/api/v2/`)

**Authentication**: JWT Bearer tokens in `Authorization` header

**Response Format**: JSON

**Error Format**: RFC 7807 Problem Details

### Request/Response Patterns

#### Standard Success Response

```json
{
  "success": true,
  "data": { /* resource data */ },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Paginated Response

```json
{
  "success": true,
  "data": [ /* array of resources */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### API Endpoints

#### Authentication & Users

```
POST   /auth/register              # Register new user
POST   /auth/login                 # Login (returns JWT)
POST   /auth/refresh               # Refresh JWT token
POST   /auth/logout                # Logout (invalidate token)
POST   /auth/forgot-password       # Request password reset
POST   /auth/reset-password        # Reset password with token
GET    /auth/me                    # Get current user

GET    /users                      # List users (admin only, paginated)
GET    /users/:id                  # Get user details
PATCH  /users/:id                  # Update user
DELETE /users/:id                  # Delete user (admin only)
POST   /users/:id/reset-password   # Admin reset user password
```

#### Schools & Configuration

```
GET    /schools/:id                # Get school details
PATCH  /schools/:id                # Update school settings (admin)
GET    /schools/:id/terms          # List school terms
POST   /schools/:id/terms          # Create term (admin)
PATCH  /schools/:id/terms/:termId  # Update term (admin)
DELETE /schools/:id/terms/:termId  # Delete term (admin)

GET    /schools/:id/locations      # List locations
POST   /schools/:id/locations      # Create location (admin)
PATCH  /locations/:id              # Update location
DELETE /locations/:id              # Delete location

GET    /locations/:id/rooms        # List rooms for location
POST   /locations/:id/rooms        # Create room (admin)
PATCH  /rooms/:id                  # Update room
DELETE /rooms/:id                  # Delete room

GET    /schools/:id/instruments    # List instruments
POST   /schools/:id/instruments    # Add instrument (admin)
PATCH  /instruments/:id            # Update instrument
DELETE /instruments/:id            # Delete instrument
```

#### Students & Families

```
GET    /students                   # List students (paginated, filtered)
POST   /students                   # Create student (admin)
GET    /students/:id               # Get student details
PATCH  /students/:id               # Update student
DELETE /students/:id               # Delete student (admin)
GET    /students/:id/enrollments   # Get student's enrollments
GET    /students/:id/attendance    # Get attendance history
GET    /students/:id/schedule      # Get student's schedule

GET    /families                   # List family groups
POST   /families                   # Create family (parent or admin)
GET    /families/:id               # Get family details
PATCH  /families/:id               # Update family
DELETE /families/:id               # Delete family
POST   /families/:id/members       # Add member to family
DELETE /families/:id/members/:userId  # Remove member
GET    /families/:id/schedule      # Combined schedule for all children
```

#### Lessons

```
GET    /lessons                    # List lessons (paginated, filtered)
POST   /lessons                    # Create lesson (admin)
GET    /lessons/:id                # Get lesson details
PATCH  /lessons/:id                # Update lesson (admin)
DELETE /lessons/:id                # Delete lesson (admin)
POST   /lessons/:id/duplicate      # Duplicate lesson to another term

GET    /lessons/:id/enrollments    # Get enrolled students
GET    /lessons/:id/attendance     # Get attendance records
GET    /lessons/:id/resources      # Get teaching resources

# Hybrid lesson specific
POST   /lessons/:id/hybrid-config  # Create hybrid configuration
GET    /lessons/:id/hybrid-config  # Get hybrid configuration
PATCH  /lessons/:id/hybrid-config  # Update hybrid configuration
DELETE /lessons/:id/hybrid-config  # Remove hybrid configuration
POST   /lessons/:id/open-bookings  # Admin opens booking period
POST   /lessons/:id/close-bookings # Admin closes bookings
GET    /lessons/:id/booking-status # Teacher view: who has/hasn't booked
```

#### Enrollments

```
POST   /enrollments                # Enroll student in lesson (admin)
POST   /enrollments/bulk           # Bulk enroll multiple students
GET    /enrollments/:id            # Get enrollment details
PATCH  /enrollments/:id            # Update enrollment status
DELETE /enrollments/:id            # Unenroll student
POST   /enrollments/:id/waitlist   # Add to waitlist
```

#### Hybrid Booking (Parents)

```
GET    /bookings/available-slots   # Get available slots for individual session
       ?lessonId=xxx&cycleWeek=4
POST   /bookings                   # Parent books individual session
GET    /bookings/:id               # Get booking details
PATCH  /bookings/:id/reschedule    # Parent reschedules session
DELETE /bookings/:id               # Cancel booking
GET    /bookings/my-bookings       # Parent view: all their bookings
```

#### Attendance

```
POST   /attendance                 # Mark attendance for lesson
POST   /attendance/bulk            # Bulk mark attendance (all students)
GET    /attendance/:id             # Get attendance record
PATCH  /attendance/:id             # Update attendance record
GET    /attendance/report          # Attendance report (filtered)
       ?studentId=xxx&startDate=xxx&endDate=xxx
```

#### Calendar & Scheduling

```
GET    /calendar/events            # Get calendar events (filtered)
       ?startDate=xxx&endDate=xxx&teacherId=xxx&locationId=xxx
POST   /calendar/events/:id/reschedule  # Reschedule lesson
GET    /calendar/conflicts         # Check for scheduling conflicts
       ?teacherId=xxx&startTime=xxx&endTime=xxx
GET    /calendar/availability      # Get teacher availability
       ?teacherId=xxx&date=xxx
```

#### Invoices

```
POST   /invoices/generate-term     # Generate invoices for term (admin)
       ?termId=xxx
GET    /invoices                   # List invoices (paginated, filtered)
GET    /invoices/:id               # Get invoice details
GET    /invoices/:id/pdf           # Download invoice PDF
PATCH  /invoices/:id               # Update invoice (admin)
DELETE /invoices/:id               # Delete draft invoice
POST   /invoices/:id/line-items    # Add custom line item (admin)
PATCH  /invoices/:id/line-items/:itemId  # Update line item
DELETE /invoices/:id/line-items/:itemId  # Remove line item
POST   /invoices/:id/send          # Send invoice to parent
POST   /invoices/:id/remind        # Send payment reminder
```

#### Payments

```
POST   /payments/create-intent     # Create Stripe payment intent
       { invoiceId: "xxx" }
POST   /payments/confirm           # Confirm payment (webhook)
POST   /payments/manual            # Record manual payment (admin)
GET    /payments/:id               # Get payment details
GET    /payments                   # List payments (paginated)
POST   /payments/:id/refund        # Process refund (admin)
```

#### Notifications

```
GET    /notifications/preferences  # Get user's notification preferences
PATCH  /notifications/preferences  # Update preferences
POST   /notifications/test         # Send test notification
GET    /notifications/history      # Notification history (admin)
POST   /notifications/send         # Send custom notification (admin)
       { recipientIds: [...], message: "...", channel: "WHATSAPP" }
```

#### File Management

```
POST   /resources/upload           # Upload teaching resource (teacher)
GET    /resources/:id              # Get resource metadata
GET    /resources/:id/download     # Download resource
DELETE /resources/:id              # Delete resource (teacher/admin)
GET    /resources                  # List resources (filtered)
       ?lessonId=xxx
```

#### Integrations

```
# Google Calendar
GET    /integrations/google/connect       # Initiate OAuth flow
GET    /integrations/google/callback      # OAuth callback
POST   /integrations/google/disconnect    # Disconnect calendar
GET    /integrations/google/status        # Check sync status
POST   /integrations/google/sync          # Manual sync trigger
GET    /integrations/ical-feed            # Generate iCal feed URL
       ?userId=xxx&token=xxx

# Xero
GET    /integrations/xero/connect         # Initiate OAuth flow
GET    /integrations/xero/callback        # OAuth callback
POST   /integrations/xero/disconnect      # Disconnect Xero
GET    /integrations/xero/status          # Check sync status
POST   /integrations/xero/sync            # Manual sync trigger
POST   /integrations/xero/sync-invoice    # Sync specific invoice
       { invoiceId: "xxx" }

# Stripe Webhooks
POST   /webhooks/stripe                   # Stripe webhook endpoint
```

#### Reports & Analytics

```
GET    /reports/attendance                # Attendance report
       ?startDate=xxx&endDate=xxx&lessonId=xxx
GET    /reports/revenue                   # Revenue report
       ?startDate=xxx&endDate=xxx&termId=xxx
GET    /reports/payments                  # Payment summary
       ?status=xxx&startDate=xxx
GET    /reports/enrollment                # Enrollment statistics
GET    /reports/teacher-schedule          # Teacher schedule report
       ?teacherId=xxx&weekStart=xxx
GET    /reports/dashboard                 # Admin dashboard stats
```

### Request Validation

All requests are validated using **Zod schemas** for type safety.

Example:

```typescript
import { z } from 'zod';

export const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'GROUP', 'HYBRID', 'BAND_REHEARSAL']),
  termId: z.string().cuid(),
  instructorId: z.string().cuid(),
  locationId: z.string().cuid().optional(),
  roomId: z.string().cuid().optional(),
  startTime: z.string().datetime().optional(),
  duration: z.number().int().min(15).max(240).optional(),
  maxStudents: z.number().int().min(1).max(50).optional(),
  groupLessonPrice: z.number().positive().optional(),
  individualLessonPrice: z.number().positive().optional(),
});

// Usage in controller
app.post('/lessons', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const validated = createLessonSchema.parse(req.body);
    const lesson = await lessonService.create(req.user.schoolId, validated);
    res.json({ success: true, data: lesson });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }
    throw error;
  }
});
```

---

## Authentication & Authorization

### JWT-Based Authentication

#### Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  schoolId: string;
  iat: number;  // Issued at
  exp: number;  // Expires at
}
```

#### Token Generation

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { school: true }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return { token, user };
}
```

#### Token Verification Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: Role;
    schoolId: string;
  };
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      schoolId: decoded.schoolId
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Invalid or expired token' }
    });
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
}

// Usage
app.get('/admin/reports',
  authenticateToken,
  requireRole('ADMIN'),
  adminController.getReports
);

app.post('/attendance',
  authenticateToken,
  requireRole('TEACHER', 'ADMIN'),
  attendanceController.markAttendance
);
```

### Resource Ownership Verification

```typescript
export async function verifyBookingOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const bookingId = req.params.id;
  const booking = await prisma.individualSessionBooking.findUnique({
    where: { id: bookingId },
    include: { student: { include: { user: true } } }
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' }
    });
  }

  // Admin can access any booking
  if (req.user!.role === 'ADMIN') {
    return next();
  }

  // Parent can only access their child's bookings
  if (req.user!.role === 'PARENT') {
    const family = await prisma.familyGroup.findFirst({
      where: {
        adminId: req.user!.userId,
        members: { some: { id: booking.student.userId } }
      }
    });

    if (!family) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not your booking' }
      });
    }
  }

  next();
}
```

### Password Security

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Minimum password requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');
```

---

## Multi-Tenancy Implementation

### Critical: School Isolation

**Every query must filter by `schoolId`**. This is the most critical security requirement.

### Automatic School Filtering

```typescript
// Prisma middleware to enforce school filtering
prisma.$use(async (params, next) => {
  // Skip for certain models that are global
  const globalModels = ['School'];
  if (globalModels.includes(params.model || '')) {
    return next(params);
  }

  // Get schoolId from context (set by auth middleware)
  const schoolId = getSchoolIdFromContext();

  if (!schoolId) {
    throw new Error('schoolId is required for this operation');
  }

  // Add schoolId filter to where clause
  if (params.action === 'findMany' || params.action === 'findFirst') {
    params.args.where = {
      ...params.args.where,
      schoolId
    };
  }

  // Validate schoolId on create operations
  if (params.action === 'create') {
    if (params.args.data.schoolId && params.args.data.schoolId !== schoolId) {
      throw new Error('Cannot create resource for different school');
    }
    params.args.data.schoolId = schoolId;
  }

  return next(params);
});
```

### Service Layer Pattern

```typescript
export class LessonService {
  // All methods require schoolId
  async findAll(schoolId: string, filters: LessonFilters) {
    return prisma.lesson.findMany({
      where: {
        schoolId,  // CRITICAL: Always filter by schoolId
        ...filters
      },
      include: {
        instructor: true,
        location: true,
        room: true,
        hybridConfig: true
      }
    });
  }

  async findById(schoolId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        instructor: true,
        location: true,
        room: true,
        enrollments: {
          include: { student: { include: { user: true } } }
        },
        hybridConfig: true
      }
    });

    // Verify lesson belongs to school
    if (!lesson || lesson.schoolId !== schoolId) {
      throw new Error('Lesson not found');
    }

    return lesson;
  }

  async create(schoolId: string, data: CreateLessonInput) {
    // Verify all foreign keys belong to same school
    await this.validateForeignKeys(schoolId, data);

    return prisma.lesson.create({
      data: {
        ...data,
        schoolId  // Always set schoolId
      }
    });
  }

  private async validateForeignKeys(
    schoolId: string,
    data: CreateLessonInput
  ) {
    // Verify term belongs to school
    const term = await prisma.schoolTerm.findUnique({
      where: { id: data.termId }
    });
    if (!term || term.schoolId !== schoolId) {
      throw new Error('Invalid term');
    }

    // Verify instructor belongs to school
    const instructor = await prisma.user.findUnique({
      where: { id: data.instructorId }
    });
    if (!instructor || instructor.schoolId !== schoolId) {
      throw new Error('Invalid instructor');
    }

    // Verify location belongs to school (if provided)
    if (data.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: data.locationId }
      });
      if (!location || location.schoolId !== schoolId) {
        throw new Error('Invalid location');
      }
    }
  }
}
```

### Testing Multi-Tenancy

```typescript
describe('Multi-Tenancy Isolation', () => {
  it('should not allow school A to access school B data', async () => {
    const schoolA = await createSchool({ name: 'School A' });
    const schoolB = await createSchool({ name: 'School B' });

    const lessonA = await createLesson({ schoolId: schoolA.id });
    const lessonB = await createLesson({ schoolId: schoolB.id });

    const adminB = await createUser({
      schoolId: schoolB.id,
      role: 'ADMIN'
    });

    const tokenB = generateToken(adminB);

    // Admin B tries to access lesson from School A
    const response = await request(app)
      .get(`/api/v1/lessons/${lessonA.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404); // Should not find it
  });
});
```

---

## Core Business Logic

### Hybrid Lesson Booking System

This is the most complex feature. Implementation details:

#### 1. Open Bookings (Admin)

```typescript
export class HybridLessonService {
  async openBookings(
    schoolId: string,
    lessonId: string,
    adminId: string
  ): Promise<void> {
    // Verify lesson is hybrid
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { hybridConfig: true, enrollments: { include: { student: { include: { user: true } } } } }
    });

    if (!lesson || lesson.schoolId !== schoolId) {
      throw new Error('Lesson not found');
    }

    if (lesson.type !== 'HYBRID' || !lesson.hybridConfig) {
      throw new Error('Not a hybrid lesson');
    }

    if (lesson.hybridConfig.bookingsOpen) {
      throw new Error('Bookings already open');
    }

    // Open bookings
    await prisma.hybridLessonConfig.update({
      where: { id: lesson.hybridConfig.id },
      data: {
        bookingsOpen: true,
        bookingsOpenedAt: new Date(),
        bookingsOpenedBy: adminId
      }
    });

    // Generate calendar placeholders for individual weeks
    await this.generateCalendarPlaceholders(lesson);

    // Send notifications to all enrolled parents
    await this.notifyParentsBookingOpen(lesson);
  }

  private async generateCalendarPlaceholders(lesson: Lesson & { hybridConfig: HybridLessonConfig }) {
    const config = lesson.hybridConfig;
    const weekPattern = config.weekPattern as Array<{ week: number; type: 'GROUP' | 'INDIVIDUAL' }>;

    const placeholders = [];

    for (const pattern of weekPattern) {
      if (pattern.type === 'INDIVIDUAL') {
        // Calculate the date for this week
        const weekOffset = pattern.week - 1;
        const placeholderDate = addWeeks(new Date(config.cycleStartDate), weekOffset);

        // Create placeholder at group lesson time
        const placeholderDateTime = setDay(placeholderDate, config.groupLessonDay!);

        placeholders.push({
          lessonId: lesson.id,
          date: placeholderDateTime,
          startTime: config.groupLessonTime!,
          endTime: addMinutes(parseTime(config.groupLessonTime!), config.groupLessonDuration).format('HH:mm'),
          type: 'HYBRID_INDIVIDUAL_WEEK',
          label: config.individualWeekLabel
        });
      }
    }

    await prisma.calendarPlaceholder.createMany({ data: placeholders });
  }

  private async notifyParentsBookingOpen(lesson: Lesson) {
    const parentIds = await this.getEnrolledParentIds(lesson.id);

    for (const parentId of parentIds) {
      await notificationQueue.add({
        type: 'HYBRID_BOOKING_OPEN',
        channel: 'WHATSAPP',
        recipientId: parentId,
        message: `Booking is now open for ${lesson.title}. Please log in to book your individual session times.`,
        templateData: {
          lessonTitle: lesson.title,
          lessonId: lesson.id
        }
      });
    }
  }
}
```

#### 2. Get Available Slots (Parent)

```typescript
export async function getAvailableSlots(
  schoolId: string,
  lessonId: string,
  cycleWeek: number
): Promise<TimeSlot[]> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { hybridConfig: true, instructor: true }
  });

  if (!lesson || lesson.schoolId !== schoolId) {
    throw new Error('Lesson not found');
  }

  const config = lesson.hybridConfig!;

  // Verify this week is an individual week
  const weekPattern = config.weekPattern as Array<{ week: number; type: string }>;
  const weekConfig = weekPattern.find(w => w.week === cycleWeek);
  if (weekConfig?.type !== 'INDIVIDUAL') {
    throw new Error('Not an individual week');
  }

  // Calculate the date range for this cycle week
  const weekOffset = cycleWeek - 1;
  const weekStart = startOfWeek(addWeeks(new Date(config.cycleStartDate), weekOffset));
  const weekEnd = endOfWeek(weekStart);

  // Get teacher's availability (all their lessons this week)
  const teacherLessons = await prisma.lesson.findMany({
    where: {
      instructorId: lesson.instructorId,
      startTime: {
        gte: weekStart,
        lte: weekEnd
      }
    }
  });

  // Get existing bookings for this week
  const existingBookings = await prisma.individualSessionBooking.findMany({
    where: {
      lessonId: lesson.id,
      cycleWeek,
      status: 'CONFIRMED'
    }
  });

  // Generate potential slots (e.g., Mon-Fri, 3pm-7pm, every 15 minutes)
  const potentialSlots = generatePotentialSlots(
    weekStart,
    weekEnd,
    config.individualLessonDuration
  );

  // Filter out conflicting slots
  const availableSlots = potentialSlots.filter(slot => {
    // Check against teacher's lessons
    const hasTeacherConflict = teacherLessons.some(lesson =>
      isOverlapping(slot.startTime, slot.endTime, lesson.startTime!, lesson.endTime!)
    );

    // Check against existing bookings
    const hasBookingConflict = existingBookings.some(booking =>
      isSameDay(slot.startTime, booking.scheduledDate) &&
      isOverlapping(slot.startTime, slot.endTime, parseTime(booking.startTime), parseTime(booking.endTime))
    );

    return !hasTeacherConflict && !hasBookingConflict;
  });

  return availableSlots;
}
```

#### 3. Book Individual Session (Parent)

```typescript
export async function bookIndividualSession(
  schoolId: string,
  parentId: string,
  data: {
    lessonId: string;
    studentId: string;
    cycleWeek: number;
    scheduledDate: Date;
    startTime: string;
    roomId?: string;
  }
): Promise<IndividualSessionBooking> {
  // Verify parent owns this student
  await verifyParentOwnership(parentId, data.studentId);

  // Verify lesson is hybrid and bookings are open
  const lesson = await prisma.lesson.findUnique({
    where: { id: data.lessonId },
    include: { hybridConfig: true }
  });

  if (!lesson || lesson.schoolId !== schoolId) {
    throw new Error('Lesson not found');
  }

  if (!lesson.hybridConfig?.bookingsOpen) {
    throw new Error('Bookings are not open');
  }

  // Verify student is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      lessonId_studentId: {
        lessonId: data.lessonId,
        studentId: data.studentId
      }
    }
  });

  if (!enrollment || enrollment.status !== 'ACTIVE') {
    throw new Error('Student not enrolled');
  }

  // Check if already booked
  const existingBooking = await prisma.individualSessionBooking.findUnique({
    where: {
      lessonId_studentId_cycleWeek: {
        lessonId: data.lessonId,
        studentId: data.studentId,
        cycleWeek: data.cycleWeek
      }
    }
  });

  if (existingBooking && existingBooking.status === 'CONFIRMED') {
    throw new Error('Already booked for this week');
  }

  // Verify slot is available
  const isAvailable = await verifySlotAvailable(
    lesson.instructorId,
    data.scheduledDate,
    data.startTime,
    lesson.hybridConfig.individualLessonDuration
  );

  if (!isAvailable) {
    throw new Error('Time slot not available');
  }

  // Create booking
  const endTime = addMinutes(
    parseTime(data.startTime),
    lesson.hybridConfig.individualLessonDuration
  ).format('HH:mm');

  const booking = await prisma.individualSessionBooking.create({
    data: {
      lessonId: data.lessonId,
      studentId: data.studentId,
      cycleWeek: data.cycleWeek,
      scheduledDate: data.scheduledDate,
      startTime: data.startTime,
      endTime,
      duration: lesson.hybridConfig.individualLessonDuration,
      roomId: data.roomId,
      bookedBy: parentId,
      status: 'CONFIRMED'
    }
  });

  // Send confirmation notification
  await notificationQueue.add({
    type: 'HYBRID_BOOKING_CONFIRMATION',
    channel: 'WHATSAPP',
    recipientId: parentId,
    message: `Booking confirmed: ${lesson.title} individual session on ${format(data.scheduledDate, 'PPP')} at ${data.startTime}.`
  });

  return booking;
}
```

#### 4. Reschedule Individual Session (Parent)

```typescript
export async function rescheduleIndividualSession(
  schoolId: string,
  parentId: string,
  bookingId: string,
  newSchedule: {
    scheduledDate: Date;
    startTime: string;
  }
): Promise<IndividualSessionBooking> {
  const booking = await prisma.individualSessionBooking.findUnique({
    where: { id: bookingId },
    include: { lesson: { include: { hybridConfig: true } } }
  });

  if (!booking || booking.lesson.schoolId !== schoolId) {
    throw new Error('Booking not found');
  }

  // Verify parent owns this booking
  await verifyParentOwnership(parentId, booking.studentId);

  const config = booking.lesson.hybridConfig!;

  // Check if rescheduling is allowed
  if (!config.allowParentReschedule) {
    throw new Error('Rescheduling not allowed');
  }

  // Check minimum notice period
  const hoursUntilLesson = differenceInHours(
    booking.scheduledDate,
    new Date()
  );

  if (hoursUntilLesson < config.minRescheduleHours) {
    throw new Error(`Must reschedule at least ${config.minRescheduleHours} hours in advance`);
  }

  // Check reschedule count limit
  if (config.maxRescheduleCount && booking.rescheduleCount >= config.maxRescheduleCount) {
    throw new Error(`Maximum ${config.maxRescheduleCount} reschedules allowed`);
  }

  // Verify new slot is available
  const isAvailable = await verifySlotAvailable(
    booking.lesson.instructorId,
    newSchedule.scheduledDate,
    newSchedule.startTime,
    config.individualLessonDuration
  );

  if (!isAvailable) {
    throw new Error('New time slot not available');
  }

  // Update booking
  const endTime = addMinutes(
    parseTime(newSchedule.startTime),
    config.individualLessonDuration
  ).format('HH:mm');

  const updatedBooking = await prisma.individualSessionBooking.update({
    where: { id: bookingId },
    data: {
      rescheduledFrom: booking.scheduledDate,
      scheduledDate: newSchedule.scheduledDate,
      startTime: newSchedule.startTime,
      endTime,
      rescheduledBy: parentId,
      rescheduledAt: new Date(),
      rescheduleCount: { increment: 1 }
    }
  });

  // Notify teacher and parent
  await notificationQueue.add({
    type: 'LESSON_RESCHEDULED',
    channel: 'WHATSAPP',
    recipientId: booking.lesson.instructorId,
    message: `Individual session rescheduled: ${booking.lesson.title} moved to ${format(newSchedule.scheduledDate, 'PPP')} at ${newSchedule.startTime}.`
  });

  return updatedBooking;
}
```

### Invoice Generation

```typescript
export class InvoiceService {
  async generateTermInvoices(
    schoolId: string,
    termId: string
  ): Promise<Invoice[]> {
    // Get all families with active enrollments in this term
    const enrollments = await prisma.enrollment.findMany({
      where: {
        lesson: { schoolId, termId },
        status: 'ACTIVE'
      },
      include: {
        lesson: { include: { hybridConfig: true } },
        student: { include: { user: { include: { familyGroup: true } } } }
      }
    });

    // Group by family
    const familyMap = new Map<string, Enrollment[]>();
    for (const enrollment of enrollments) {
      const familyId = enrollment.student.user.familyGroupId;
      if (!familyId) continue;

      if (!familyMap.has(familyId)) {
        familyMap.set(familyId, []);
      }
      familyMap.get(familyId)!.push(enrollment);
    }

    const invoices: Invoice[] = [];

    // Generate invoice for each family
    for (const [familyId, familyEnrollments] of familyMap) {
      const invoice = await this.generateFamilyInvoice(
        schoolId,
        familyId,
        termId,
        familyEnrollments
      );
      invoices.push(invoice);
    }

    return invoices;
  }

  private async generateFamilyInvoice(
    schoolId: string,
    familyId: string,
    termId: string,
    enrollments: Enrollment[]
  ): Promise<Invoice> {
    const lineItems: Prisma.InvoiceLineItemCreateManyInvoiceInput[] = [];

    for (const enrollment of enrollments) {
      const lesson = enrollment.lesson;

      if (lesson.type === 'HYBRID' && lesson.hybridConfig) {
        // Count group and individual weeks
        const weekPattern = lesson.hybridConfig.weekPattern as Array<{ week: number; type: string }>;
        const groupWeeks = weekPattern.filter(w => w.type === 'GROUP').length;
        const individualWeeks = weekPattern.filter(w => w.type === 'INDIVIDUAL').length;

        // Add group lesson line item
        if (groupWeeks > 0) {
          lineItems.push({
            type: 'GROUP_LESSON',
            description: `${lesson.title} - Group Lessons`,
            quantity: new Decimal(groupWeeks),
            unitPrice: lesson.groupLessonPrice!,
            totalPrice: new Decimal(groupWeeks).mul(lesson.groupLessonPrice!),
            lessonId: lesson.id
          });
        }

        // Add individual lesson line item
        if (individualWeeks > 0) {
          lineItems.push({
            type: 'INDIVIDUAL_LESSON',
            description: `${lesson.title} - Individual Lessons`,
            quantity: new Decimal(individualWeeks),
            unitPrice: lesson.individualLessonPrice!,
            totalPrice: new Decimal(individualWeeks).mul(lesson.individualLessonPrice!),
            lessonId: lesson.id
          });
        }
      } else {
        // Regular lesson (group or individual)
        const term = await prisma.schoolTerm.findUnique({ where: { id: termId } });
        const weeks = differenceInWeeks(term!.endDate, term!.startDate);

        lineItems.push({
          type: lesson.type === 'GROUP' ? 'GROUP_LESSON' : 'INDIVIDUAL_LESSON',
          description: `${lesson.title}`,
          quantity: new Decimal(weeks),
          unitPrice: lesson.groupLessonPrice || lesson.individualLessonPrice!,
          totalPrice: new Decimal(weeks).mul(lesson.groupLessonPrice || lesson.individualLessonPrice!),
          lessonId: lesson.id
        });
      }
    }

    // Calculate subtotal
    const subtotal = lineItems.reduce(
      (sum, item) => sum.plus(item.totalPrice),
      new Decimal(0)
    );

    // Get school tax rate
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    const taxRate = school!.taxRate;
    const tax = subtotal.mul(taxRate);
    const total = subtotal.plus(tax);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(schoolId);

    // Get term due date
    const term = await prisma.schoolTerm.findUnique({ where: { id: termId } });

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        schoolId,
        familyId,
        termId,
        status: 'DRAFT',
        dueDate: term!.invoiceDueDate || term!.startDate,
        subtotal,
        tax,
        total,
        amountDue: total,
        lineItems: {
          createMany: { data: lineItems }
        }
      },
      include: { lineItems: true }
    });

    return invoice;
  }

  private async generateInvoiceNumber(schoolId: string): Promise<string> {
    const count = await prisma.invoice.count({ where: { schoolId } });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
```

---

**(Continued in next section due to length...)**

## Third-Party Integrations

### Twilio (WhatsApp + SMS)

```typescript
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export class TwilioService {
  async sendWhatsApp(to: string, message: string): Promise<void> {
    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER!,  // 'whatsapp:+14155238886'
        to: `whatsapp:${to}`,
        body: message
      });
    } catch (error) {
      console.error('WhatsApp send failed:', error);
      throw error;
    }
  }

  async sendSMS(to: string, message: string): Promise<void> {
    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: to,
        body: message
      });
    } catch (error) {
      console.error('SMS send failed:', error);
      throw error;
    }
  }
}

// Smart notification with fallback
export class NotificationService {
  async sendNotification(
    user: User,
    message: string,
    type: NotificationType
  ): Promise<void> {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: user.id }
    });

    if (!prefs) {
      // Default to email only
      return this.sendEmail(user.email, message);
    }

    // Try WhatsApp first
    if (prefs.whatsappEnabled && prefs.whatsappPhone) {
      try {
        await twilioService.sendWhatsApp(prefs.whatsappPhone, message);
        return;
      } catch (error) {
        console.error('WhatsApp failed, trying SMS');
      }
    }

    // Fallback to SMS
    if (prefs.smsEnabled && prefs.smsPhone) {
      try {
        await twilioService.sendSMS(prefs.smsPhone, message);
        return;
      } catch (error) {
        console.error('SMS failed, trying email');
      }
    }

    // Fallback to email
    if (prefs.emailEnabled) {
      await this.sendEmail(user.email, message);
    }
  }

  private async sendEmail(to: string, message: string): Promise<void> {
    await sendGridService.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: 'Music \'n Me Notification',
      text: message
    });
  }
}
```

### Google Calendar Sync

```typescript
import { google } from 'googleapis';

export class GoogleCalendarService {
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  async getAuthUrl(userId: string): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId  // Pass userId to identify user on callback
    });
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);

    this.oauth2Client.setCredentials(tokens);

    // Get primary calendar
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);

    if (!primaryCalendar) {
      throw new Error('No primary calendar found');
    }

    // Save sync configuration
    await prisma.calendarSync.create({
      data: {
        userId,
        provider: 'GOOGLE',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: new Date(tokens.expiry_date!),
        calendarId: primaryCalendar.id!,
        calendarName: primaryCalendar.summary!
      }
    });
  }

  async syncLesson(lesson: Lesson): Promise<void> {
    // Get teacher's calendar sync
    const sync = await prisma.calendarSync.findUnique({
      where: { userId: lesson.instructorId }
    });

    if (!sync || !sync.syncEnabled) {
      return;
    }

    // Refresh token if needed
    await this.ensureValidToken(sync);

    this.oauth2Client.setCredentials({
      access_token: sync.accessToken,
      refresh_token: sync.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Create or update event
    const event = {
      summary: lesson.title,
      description: lesson.description || '',
      location: lesson.location?.name,
      start: {
        dateTime: lesson.startTime!.toISOString(),
        timeZone: 'Australia/Sydney'
      },
      end: {
        dateTime: lesson.endTime!.toISOString(),
        timeZone: 'Australia/Sydney'
      },
      recurrence: lesson.recurrence === 'WEEKLY'
        ? ['RRULE:FREQ=WEEKLY']
        : undefined
    };

    // Check if event already exists
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        lessonId: lesson.id,
        userId: lesson.instructorId,
        provider: 'GOOGLE'
      }
    });

    if (existingEvent) {
      // Update existing event
      await calendar.events.update({
        calendarId: sync.calendarId,
        eventId: existingEvent.externalEventId,
        requestBody: event
      });
    } else {
      // Create new event
      const response = await calendar.events.insert({
        calendarId: sync.calendarId,
        requestBody: event
      });

      // Save event mapping
      await prisma.calendarEvent.create({
        data: {
          lessonId: lesson.id,
          userId: lesson.instructorId,
          provider: 'GOOGLE',
          externalEventId: response.data.id!
        }
      });
    }

    // Update sync timestamp
    await prisma.calendarSync.update({
      where: { id: sync.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: 'SUCCESS' }
    });
  }

  private async ensureValidToken(sync: CalendarSync): Promise<void> {
    if (new Date() < sync.expiresAt) {
      return;  // Token still valid
    }

    // Refresh token
    this.oauth2Client.setCredentials({
      refresh_token: sync.refreshToken
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    await prisma.calendarSync.update({
      where: { id: sync.id },
      data: {
        accessToken: credentials.access_token!,
        expiresAt: new Date(credentials.expiry_date!)
      }
    });
  }
}
```

### Xero Integration

```typescript
import { XeroClient } from 'xero-node';

export class XeroService {
  private xeroClient = new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [process.env.XERO_REDIRECT_URI!],
    scopes: ['accounting.transactions', 'accounting.contacts']
  });

  async getAuthUrl(schoolId: string): Promise<string> {
    return await this.xeroClient.buildConsentUrl();
  }

  async handleCallback(code: string, schoolId: string): Promise<void> {
    const tokenSet = await this.xeroClient.apiCallback(code);

    await this.xeroClient.updateTenants();
    const tenants = this.xeroClient.tenants;

    if (!tenants || tenants.length === 0) {
      throw new Error('No Xero organization found');
    }

    const tenant = tenants[0];

    await prisma.xeroSync.create({
      data: {
        schoolId,
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        accessToken: tokenSet.access_token!,
        refreshToken: tokenSet.refresh_token!,
        expiresAt: new Date(Date.now() + tokenSet.expires_in! * 1000)
      }
    });
  }

  async syncInvoice(invoice: Invoice): Promise<void> {
    const xeroSync = await prisma.xeroSync.findUnique({
      where: { schoolId: invoice.schoolId }
    });

    if (!xeroSync || !xeroSync.syncEnabled) {
      return;
    }

    await this.ensureValidToken(xeroSync);

    await this.xeroClient.setTokenSet({
      access_token: xeroSync.accessToken,
      refresh_token: xeroSync.refreshToken,
      expires_in: 1800
    });

    const family = await prisma.familyGroup.findUnique({
      where: { id: invoice.familyId! },
      include: { admin: true }
    });

    // Ensure contact exists in Xero
    const contactId = await this.ensureContact(xeroSync.tenantId, family!);

    // Create invoice in Xero
    const xeroInvoice = {
      Type: 'ACCREC',  // Accounts Receivable
      Contact: { ContactID: contactId },
      LineItems: invoice.lineItems.map(item => ({
        Description: item.description,
        Quantity: item.quantity.toNumber(),
        UnitAmount: item.unitPrice.toNumber(),
        AccountCode: xeroSync.revenueAccountCode || '200',  // Sales account
        TaxType: xeroSync.taxType || 'OUTPUT'  // GST on output
      })),
      Date: invoice.issueDate?.toISOString().split('T')[0],
      DueDate: invoice.dueDate.toISOString().split('T')[0],
      InvoiceNumber: invoice.invoiceNumber,
      Reference: `Term ${invoice.termId}`,
      Status: invoice.status === 'SENT' ? 'AUTHORISED' : 'DRAFT'
    };

    const response = await this.xeroClient.accountingApi.createInvoices(
      xeroSync.tenantId,
      { invoices: [xeroInvoice] }
    );

    const createdInvoice = response.body.invoices![0];

    // Save Xero invoice ID
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        xeroInvoiceId: createdInvoice.invoiceID!,
        xeroSyncStatus: 'SYNCED',
        xeroSyncedAt: new Date()
      }
    });
  }

  async syncPayment(payment: Payment): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: payment.invoiceId },
      include: { school: { include: { xeroSync: true } } }
    });

    if (!invoice?.xeroInvoiceId) {
      return;  // Invoice not synced to Xero yet
    }

    const xeroSync = invoice.school.xeroSync;
    if (!xeroSync || !xeroSync.syncEnabled) {
      return;
    }

    await this.ensureValidToken(xeroSync);

    // Create payment in Xero
    const xeroPayment = {
      Invoice: { InvoiceID: invoice.xeroInvoiceId },
      Account: { Code: '100' },  // Bank account
      Amount: payment.amount.toNumber(),
      Date: payment.paidAt?.toISOString().split('T')[0]
    };

    await this.xeroClient.accountingApi.createPayment(
      xeroSync.tenantId,
      { payments: [xeroPayment] }
    );
  }

  private async ensureContact(
    tenantId: string,
    family: FamilyGroup & { admin: User }
  ): Promise<string> {
    const contactName = family.name;

    // Search for existing contact
    const searchResponse = await this.xeroClient.accountingApi.getContacts(
      tenantId,
      undefined,
      `Name=="${contactName}"`
    );

    if (searchResponse.body.contacts && searchResponse.body.contacts.length > 0) {
      return searchResponse.body.contacts[0].contactID!;
    }

    // Create new contact
    const contact = {
      Name: contactName,
      EmailAddress: family.admin.email,
      Phones: family.admin.phone ? [{
        PhoneType: 'MOBILE',
        PhoneNumber: family.admin.phone
      }] : []
    };

    const createResponse = await this.xeroClient.accountingApi.createContacts(
      tenantId,
      { contacts: [contact] }
    );

    return createResponse.body.contacts![0].contactID!;
  }

  private async ensureValidToken(sync: XeroSync): Promise<void> {
    if (new Date() < sync.expiresAt) {
      return;
    }

    await this.xeroClient.setTokenSet({
      access_token: sync.accessToken,
      refresh_token: sync.refreshToken,
      expires_in: 1800
    });

    const newTokenSet = await this.xeroClient.refreshToken();

    await prisma.xeroSync.update({
      where: { id: sync.id },
      data: {
        accessToken: newTokenSet.access_token!,
        refreshToken: newTokenSet.refresh_token!,
        expiresAt: new Date(Date.now() + newTokenSet.expires_in! * 1000)
      }
    });
  }
}
```

### Stripe Payment Processing

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export class StripeService {
  async createPaymentIntent(
    invoiceId: string,
    userId: string
  ): Promise<Stripe.PaymentIntent> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { familyGroup: { include: { admin: true } } }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Verify user has access to this invoice
    if (invoice.familyGroup?.adminId !== userId) {
      throw new Error('Unauthorized');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.total.toNumber() * 100),  // Convert to cents
      currency: 'aud',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        familyId: invoice.familyId!,
        schoolId: invoice.schoolId
      },
      receipt_email: invoice.familyGroup.admin.email
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.total,
        method: 'STRIPE',
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.id
      }
    });

    return paymentIntent;
  }

  async handleWebhook(
    signature: string,
    body: Buffer
  ): Promise<void> {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
    }
  }

  private async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const invoiceId = paymentIntent.metadata.invoiceId;

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING'
      },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        stripeChargeId: paymentIntent.latest_charge as string
      }
    });

    // Update invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (invoice) {
      const totalPaid = invoice.payments.reduce(
        (sum, p) => sum.plus(p.amount),
        new Decimal(0)
      );

      const status = totalPaid.gte(invoice.total) ? 'PAID' : 'PARTIALLY_PAID';

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: totalPaid,
          amountDue: invoice.total.minus(totalPaid),
          status,
          paidDate: status === 'PAID' ? new Date() : undefined
        }
      });

      // Sync to Xero
      await xeroService.syncPayment(invoice.payments[invoice.payments.length - 1]);

      // Send confirmation notification
      await notificationQueue.add({
        type: 'PAYMENT_RECEIVED',
        channel: 'WHATSAPP',
        recipientId: invoice.familyGroup!.adminId,
        message: `Payment received! Your invoice ${invoice.invoiceNumber} has been paid. Thank you!`
      });
    }
  }

  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    await prisma.payment.updateMany({
      where: {
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING'
      },
      data: {
        status: 'FAILED'
      }
    });

    // Notify user
    const invoiceId = paymentIntent.metadata.invoiceId;
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { familyGroup: true }
    });

    if (invoice) {
      await notificationQueue.add({
        type: 'PAYMENT_FAILED',
        channel: 'EMAIL',
        recipientId: invoice.familyGroup!.adminId,
        message: `Your payment for invoice ${invoice.invoiceNumber} failed. Please try again or contact us.`
      });
    }
  }
}
```

---

## Queue System & Background Jobs

### Bull Queue Setup

```typescript
import Bull from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

// Define queues
export const notificationQueue = new Bull('notifications', {
  redis: { port: 6379, host: 'localhost' }
});

export const emailQueue = new Bull('emails', {
  redis: { port: 6379, host: 'localhost' }
});

export const xeroSyncQueue = new Bull('xero-sync', {
  redis: { port: 6379, host: 'localhost' }
});

export const calendarSyncQueue = new Bull('calendar-sync', {
  redis: { port: 6379, host: 'localhost' }
});

// Notification processor
notificationQueue.process(async (job) => {
  const { type, channel, recipientId, message } = job.data;

  const user = await prisma.user.findUnique({
    where: { id: recipientId },
    include: { notificationPrefs: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  await notificationService.sendNotification(user, message, type);
});

// Email processor
emailQueue.process(async (job) => {
  const { to, subject, body } = job.data;
  await sendGridService.send({ to, subject, text: body });
});

// Xero sync processor
xeroSyncQueue.process(async (job) => {
  const { invoiceId } = job.data;
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true }
  });

  if (invoice) {
    await xeroService.syncInvoice(invoice);
  }
});

// Calendar sync processor
calendarSyncQueue.process(async (job) => {
  const { lessonId } = job.data;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId }
  });

  if (lesson) {
    await googleCalendarService.syncLesson(lesson);
  }
});
```

### Scheduled Jobs (Cron)

```typescript
import cron from 'node-cron';

// Send lesson reminders (runs daily at 9am)
cron.schedule('0 9 * * *', async () => {
  const tomorrow = startOfDay(addDays(new Date(), 1));
  const dayAfter = endOfDay(tomorrow);

  const lessons = await prisma.lesson.findMany({
    where: {
      startTime: {
        gte: tomorrow,
        lte: dayAfter
      },
      status: 'SCHEDULED'
    },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { student: { include: { user: true } } }
      }
    }
  });

  for (const lesson of lessons) {
    for (const enrollment of lesson.enrollments) {
      const parent = await getParentForStudent(enrollment.student.userId);
      if (parent) {
        await notificationQueue.add({
          type: 'LESSON_REMINDER',
          channel: 'WHATSAPP',
          recipientId: parent.id,
          message: `Reminder: ${enrollment.student.user.firstName} has ${lesson.title} tomorrow at ${format(lesson.startTime!, 'p')}.`
        });
      }
    }
  }
});

// Check overdue invoices (runs daily at 10am)
cron.schedule('0 10 * * *', async () => {
  const today = new Date();

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      dueDate: { lt: today },
      status: { in: ['SENT', 'PARTIALLY_PAID'] }
    },
    include: { familyGroup: true }
  });

  for (const invoice of overdueInvoices) {
    // Update status to overdue
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'OVERDUE' }
    });

    // Send reminder
    await notificationQueue.add({
      type: 'INVOICE_OVERDUE',
      channel: 'EMAIL',
      recipientId: invoice.familyGroup!.adminId,
      message: `Your invoice ${invoice.invoiceNumber} is now overdue. Please pay at your earliest convenience.`
    });
  }
});

// Refresh calendar syncs (runs every hour)
cron.schedule('0 * * * *', async () => {
  const syncs = await prisma.calendarSync.findMany({
    where: { syncEnabled: true }
  });

  for (const sync of syncs) {
    const user = await prisma.user.findUnique({ where: { id: sync.userId } });
    if (user?.role === 'TEACHER') {
      const lessons = await prisma.lesson.findMany({
        where: {
          instructorId: user.id,
          status: 'SCHEDULED',
          startTime: { gte: new Date() }
        }
      });

      for (const lesson of lessons) {
        await calendarSyncQueue.add({ lessonId: lesson.id });
      }
    }
  }
});
```

---

## Deployment Architecture

### DigitalOcean Setup

```yaml
# App Spec (app.yaml)
name: music-n-me
region: syd

databases:
  - name: postgres-db
    engine: PG
    version: "15"
    size: db-s-1vcpu-1gb
    num_nodes: 1

services:
  - name: backend
    github:
      repo: your-org/music-n-me
      branch: main
      deploy_on_push: true
    source_dir: /apps/backend
    build_command: npm install && npx prisma generate && npm run build
    run_command: npm start
    environment_slug: node-js
    instance_size_slug: professional-xs
    instance_count: 2
    http_port: 5000
    health_check:
      http_path: /health
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${postgres-db.DATABASE_URL}
      - key: JWT_SECRET
        scope: RUN_TIME
        type: SECRET
      - key: STRIPE_SECRET_KEY
        scope: RUN_TIME
        type: SECRET
      - key: TWILIO_AUTH_TOKEN
        scope: RUN_TIME
        type: SECRET

  - name: frontend
    github:
      repo: your-org/music-n-me
      branch: main
      deploy_on_push: true
    source_dir: /apps/frontend
    build_command: npm install && npm run build
    environment_slug: node-js
    output_dir: /dist
    routes:
      - path: /
    envs:
      - key: VITE_API_URL
        scope: BUILD_TIME
        value: ${backend.PUBLIC_URL}/api/v1

workers:
  - name: queue-worker
    github:
      repo: your-org/music-n-me
      branch: main
    source_dir: /apps/backend
    build_command: npm install && npx prisma generate
    run_command: npm run worker
    instance_size_slug: basic-xxs
    instance_count: 1
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${postgres-db.DATABASE_URL}
      - key: REDIS_URL
        scope: RUN_TIME
        value: ${redis.DATABASE_URL}

redis:
  - name: redis
    engine: REDIS
    version: "7"
    size: db-s-1vcpu-1gb
```

### Environment Variables

Production `.env`:

```env
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="<generated-secret-256-bit>"
JWT_EXPIRE="7d"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Server
NODE_ENV="production"
PORT=5000
FRONTEND_URL="https://app.musicnme.com.au"

# SendGrid
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@musicnme.com.au"

# Twilio
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+61..."
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# DigitalOcean Spaces
AWS_S3_BUCKET="musicnme-files-prod"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="syd1"
AWS_ENDPOINT="https://syd1.digitaloceanspaces.com"

# Google Calendar
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="https://api.musicnme.com.au/api/v1/integrations/google/callback"

# Xero
XERO_CLIENT_ID="..."
XERO_CLIENT_SECRET="..."
XERO_REDIRECT_URI="https://api.musicnme.com.au/api/v1/integrations/xero/callback"

# Redis
REDIS_URL="redis://..."

# Monitoring
SENTRY_DSN="..."
```

### Database Migrations

```bash
# Development
npx prisma migrate dev --name init

# Production
npx prisma migrate deploy
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to DigitalOcean
        uses: digitalocean/app_action@v1
        with:
          token: ${{ secrets.DIGITALOCEAN_TOKEN }}
```

---

## Security Implementation

### SQL Injection Prevention

Prisma ORM provides automatic SQL injection prevention via parameterized queries.

```typescript
// Safe - Prisma uses parameterized queries
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// Never use raw SQL with user input unless properly escaped
const users = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE email = ${userInput}
`;  // Prisma escapes the parameter
```

### XSS Prevention

Frontend uses React (automatic escaping) + Content Security Policy headers.

```typescript
// Backend CSP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"]
    }
  }
}));
```

### CSRF Protection

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.get('/api/v1/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

app.use('/api/v1/auth/login', authLimiter);

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,  // 100 requests per 15 minutes
  message: 'Too many requests'
});

app.use('/api/v1/', apiLimiter);
```

### Input Validation

```typescript
import { z } from 'zod';

const createStudentSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().email(),
  dateOfBirth: z.string().datetime().optional(),
  grade: z.string().max(20).optional(),
  primaryInstrument: z.string().max(50).optional()
});

app.post('/students', async (req, res) => {
  try {
    const validated = createStudentSchema.parse(req.body);
    // ... create student
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
});
```

---

## Testing Strategy

### Unit Tests (Jest)

```typescript
// lesson.service.test.ts
describe('LessonService', () => {
  describe('create', () => {
    it('should create a lesson with valid data', async () => {
      const schoolId = 'school_123';
      const data = {
        title: 'Piano Foundation 1',
        type: 'GROUP',
        termId: 'term_123',
        instructorId: 'user_123',
        startTime: new Date('2025-02-03T16:00:00'),
        duration: 60
      };

      const lesson = await lessonService.create(schoolId, data);

      expect(lesson).toBeDefined();
      expect(lesson.schoolId).toBe(schoolId);
      expect(lesson.title).toBe(data.title);
    });

    it('should reject lesson for different school', async () => {
      const schoolId = 'school_123';
      const data = {
        termId: 'term_from_school_456',  // Different school
        // ...
      };

      await expect(lessonService.create(schoolId, data))
        .rejects.toThrow('Invalid term');
    });
  });
});
```

### Integration Tests

```typescript
// lesson.api.test.ts
describe('POST /api/v1/lessons', () => {
  it('should create lesson as admin', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const token = generateToken(admin);

    const response = await request(app)
      .post('/api/v1/lessons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Guitar Basics',
        type: 'GROUP',
        termId: testTerm.id,
        instructorId: testTeacher.id,
        maxStudents: 10
      });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe('Guitar Basics');
  });

  it('should reject lesson creation as teacher', async () => {
    const teacher = await createTestUser({ role: 'TEACHER' });
    const token = generateToken(teacher);

    const response = await request(app)
      .post('/api/v1/lessons')
      .set('Authorization', `Bearer ${token}`)
      .send({ /* lesson data */ });

    expect(response.status).toBe(403);
  });
});
```

### End-to-End Tests

```typescript
describe('Hybrid Lesson Booking Flow', () => {
  it('should complete full booking workflow', async () => {
    // 1. Admin creates hybrid lesson
    const adminToken = await loginAs('admin@musicnme.com.au');
    const lesson = await createHybridLesson(adminToken, {
      title: 'Piano Foundation 1',
      cycleLength: 10,
      weekPattern: [
        { week: 1, type: 'GROUP' },
        { week: 4, type: 'INDIVIDUAL' }
      ]
    });

    // 2. Admin enrolls student
    const student = await createStudent();
    await enrollStudent(adminToken, lesson.id, student.id);

    // 3. Admin opens bookings
    await openBookings(adminToken, lesson.id);

    // 4. Parent logs in
    const parentToken = await loginAs(student.parent.email);

    // 5. Parent gets available slots
    const slots = await getAvailableSlots(parentToken, lesson.id, 4);
    expect(slots.length).toBeGreaterThan(0);

    // 6. Parent books session
    const booking = await bookSession(parentToken, {
      lessonId: lesson.id,
      studentId: student.id,
      cycleWeek: 4,
      scheduledDate: slots[0].date,
      startTime: slots[0].startTime
    });

    expect(booking.status).toBe('CONFIRMED');

    // 7. Verify notification sent
    expect(mockWhatsAppService.send).toHaveBeenCalled();
  });
});
```

---

## Development Workflow

### Project Structure

```
music-n-me/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── queues/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── utils/
│       │   └── App.tsx
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
├── Planning/
│   ├── 8_Week_MVP_Plan.md
│   ├── Music_n_Me_System_Overview.md
│   └── Technical_Architecture_Overview.md
├── CLAUDE.md
├── package.json
└── README.md
```

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/hybrid-booking-system
# ... make changes
git commit -m "feat: implement hybrid lesson booking"
git push origin feature/hybrid-booking-system
# Create PR
```

### Commit Message Convention

```
feat: add hybrid lesson configuration endpoint
fix: resolve calendar placeholder generation bug
docs: update API documentation for booking endpoints
refactor: simplify invoice line item calculation
test: add integration tests for payment flow
chore: update dependencies
```

---

## Summary

This technical overview covers the complete architecture of the Music 'n Me SaaS platform, including:

- **System Architecture**: Monolithic backend with service layer, SPA frontend, event-driven background processing
- **Database**: PostgreSQL with Prisma ORM, comprehensive schema with multi-tenant isolation
- **API**: RESTful design with JWT auth, role-based access control, comprehensive endpoints
- **Core Features**: Hybrid lesson model (the key differentiator), complex invoice generation, calendar management
- **Integrations**: Twilio (WhatsApp/SMS), Google Calendar (one-way sync), Xero (accounting), Stripe (payments)
- **Security**: Multi-tenant isolation, SQL injection prevention, XSS protection, rate limiting, input validation
- **Deployment**: DigitalOcean App Platform, managed PostgreSQL, Redis for queues, CI/CD via GitHub Actions
- **Testing**: Unit tests, integration tests, end-to-end tests for critical flows

**Key Technical Decisions:**
1. **Prisma ORM**: Type-safe database access, automatic migrations
2. **Bull + Redis**: Reliable background job processing
3. **Zod**: Runtime type validation for API requests
4. **JWT**: Stateless authentication
5. **Multi-tenant by design**: Every query filtered by `schoolId`
6. **Decimal.js**: Financial calculations with proper precision
7. **One-way calendar sync**: Simpler, more reliable than two-way
8. **Single Twilio vendor**: WhatsApp + SMS with automatic fallback

The system is built for **scalability**, **security**, and **maintainability**, with the hybrid lesson model as the core differentiator that requires careful implementation across all layers.
