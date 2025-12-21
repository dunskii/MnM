# Music School Platform - Enhanced Prisma Schema

This schema reflects the complete vision while structuring features into Phase 1 (MVP) and Phase 2 implementation.

## Schema Overview

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// CORE SCHOOL & ORGANIZATION
// ============================================

model School {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phone     String?
  website   String?
  
  // Phase 2: Branding
  logoUrl   String?
  brandColor String?
  customDomain String?
  
  // Configuration
  timezone  String   @default("UTC")
  currency  String   @default("USD")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  locations     Location[]
  users         User[]
  lessons       Lesson[]
  enrollments   Enrollment[]
  payments      Payment[]
  resources     Resource[]
  familyGroups  FamilyGroup[]
  progressionAwards ProgressionAward[]
  examRequests  ExamRequest[]

  @@index([email])
}

// ============================================
// LOCATIONS & ROOMS (Multi-location support)
// ============================================

model Location {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  name      String   // e.g., "Main Studio", "Downtown Branch"
  address   String?
  city      String?
  state     String?
  phone     String?

  rooms     Room[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
}

model Room {
  id        String   @id @default(cuid())
  locationId String
  location  Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  name      String   // e.g., "Studio A", "Rehearsal Room 1"
  capacity  Int?     // For group classes
  
  lessons   Lesson[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([locationId])
}

// ============================================
// USERS & ROLES
// ============================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      Role     @default(STUDENT)
  phone     String?
  
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Teacher-specific fields
  bio          String?
  specialties  String?  // Instruments/areas they teach
  stripeConnectId String?  // For Stripe Connect payouts
  
  // User can be either teacher or student, not both (enforced in app logic)
  lessonsAsInstructor Lesson[]
  studentProfile      Student?
  teacherAvailability TeacherAvailability[]
  
  // Family account support
  familyGroupId  String?
  familyGroup    FamilyGroup? @relation("FamilyMembers", fields: [familyGroupId], references: [id])
  familyGroupsOwned FamilyGroup[] @relation("FamilyAdmin")  // For Phase 2

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([email])
  @@index([role])
}

enum Role {
  ADMIN
  TEACHER
  PARENT
  STUDENT
}

// ============================================
// FAMILY ACCOUNTS (Phase 2)
// ============================================

model FamilyGroup {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  name      String   // e.g., "Smith Family"
  adminId   String   // Parent who manages the family
  admin     User     @relation("FamilyAdmin", fields: [adminId], references: [id])
  
  members   User[]   @relation("FamilyMembers")  // All family members
  
  // Phase 2: Billing info
  billingEmail String?
  billingAddress String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([adminId])
}

// ============================================
// STUDENTS & PROFILES
// ============================================

model Student {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Parent/Guardian Info
  parentName     String?
  parentPhone    String?
  parentEmail    String?
  
  // Student Info
  dateOfBirth    DateTime?
  instrument     String?        // Primary instrument
  secondaryInstruments String?  // JSON array of additional instruments
  skillLevel     SkillLevel?
  
  // Emergency Contact
  emergencyContactName String?
  emergencyContactPhone String?
  emergencyContactRelation String?

  // Privacy settings (Phase 2)
  parentalConsent Boolean @default(false)
  socialMediaConsent Boolean @default(false)

  enrollments    Enrollment[]
  attendance     Attendance[]
  progressionAwards ProgressionAward[]
  examRequests   ExamRequest[]
  resourceAccess ResourceAccess[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
}

enum SkillLevel {
  BEGINNER
  ELEMENTARY
  INTERMEDIATE
  ADVANCED
  PROFESSIONAL
}

// ============================================
// LESSONS (Core Feature with Hybrid Support)
// ============================================

model Lesson {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  title     String
  description String?
  type      LessonType
  
  instructorId String
  instructor User @relation(fields: [instructorId], references: [id])

  // Location/Room info
  locationId String?  // NULL for online lessons
  location   Location? @relation(fields: [locationId], references: [id])
  roomId     String?
  room       Room? @relation(fields: [roomId], references: [id])

  // Basic Scheduling
  startTime    DateTime
  endTime      DateTime
  duration     Int        // in minutes

  // Recurrence
  recurrence   Recurrence @default(ONCE
  recurrenceEndDate DateTime?

  // Lesson Configuration
  isIndividual Boolean    @default(false)
  maxStudents  Int?       // For group classes (NULL = unlimited)
  
  // Hybrid Model Support (Phase 1)
  // For group classes: Mark which lesson cycles are 1-on-1 bookable
  isHybrid     Boolean    @default(false)
  hybridConfig HybridLessonConfig?  // If hybrid, stores cycle info

  // Pricing
  pricePerStudent Decimal?

  // Status
  status       LessonStatus @default(SCHEDULED)

  // Relations
  enrollments  Enrollment[]
  attendance   Attendance[]
  payments     Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([instructorId])
  @@index([startTime])
  @@index([type])
}

enum LessonType {
  INDIVIDUAL
  GROUP
  HYBRID
  BAND_REHEARSAL
  ENSEMBLE
}

enum Recurrence {
  ONCE
  WEEKLY
  BIWEEKLY
  MONTHLY
  CUSTOM
}

enum LessonStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  CANCELLED_BY_TEACHER
}

// ============================================
// HYBRID LESSON CONFIGURATION
// ============================================

model HybridLessonConfig {
  id        String   @id @default(cuid())
  lessonId  String   @unique
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  // Cycle configuration
  // e.g., "weeks 4 and 8 of 8-week cycle are 1-on-1 bookable"
  cycleLength Int         // Total weeks in cycle (e.g., 8)
  oneOnOneWeeks String    // JSON array of week numbers that trigger 1-on-1 booking
                          // e.g., [4, 8] means weeks 4 and 8 are 1-on-1
  
  // When this configuration started
  cycleStartDate DateTime
  
  // Pricing for 1-on-1 sessions in hybrid model
  oneOnOnePricePerStudent Decimal?

  // Notification settings
  notifyParentsInAdvance Int? // Days before to notify

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([lessonId])
}

// ============================================
// TEACHER AVAILABILITY (For multi-location support)
// ============================================

model TeacherAvailability {
  id        String   @id @default(cuid())
  teacherId String
  teacher   User     @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  dayOfWeek Int      // 0-6 (Sunday-Saturday)
  startTime String   // HH:mm format
  endTime   String   // HH:mm format
  
  recurring Boolean  @default(true)
  validFrom DateTime?
  validUntil DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([teacherId])
}

// ============================================
// ENROLLMENT & ATTENDANCE
// ============================================

model Enrollment {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  status    EnrollmentStatus @default(ACTIVE)
  enrolledAt DateTime @default(now())
  unenrolledAt DateTime?

  // Notes
  notes     String?

  @@unique([lessonId, studentId])
  @@index([studentId])
  @@index([lessonId])
  @@index([schoolId])
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  UNENROLLED
  DROPPED
  PENDING  // Phase 2: requires admin approval
}

model Attendance {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  present   Boolean
  notes     String?
  recordedAt DateTime @default(now())

  @@unique([lessonId, studentId])
  @@index([studentId])
}

// ============================================
// PAYMENTS & PAYOUTS
// ============================================

model Payment {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // What is being paid for
  lessonId  String?   // NULL if payment is for multiple lessons or other reason
  lesson    Lesson?   @relation(fields: [lessonId], references: [id])
  
  enrollmentId String?  // Links to specific enrollment if applicable

  // Payment Details
  amount    Decimal
  currency  String   @default("USD")
  status    PaymentStatus @default(PENDING)
  method    PaymentMethod @default(STRIPE)

  // Stripe Integration
  stripePaymentIntentId String?
  stripeChargeId String?

  // Invoice
  invoiceNumber String?
  invoiceDate DateTime?
  invoiceDueDate DateTime?

  // Family billing (Phase 2)
  familyGroupId String?

  createdAt DateTime @default(now())
  paidAt DateTime?
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([lessonId])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  DISPUTED
}

enum PaymentMethod {
  STRIPE
  BANK_TRANSFER
  CASH
  CHECK
  OTHER
}

model Payout {
  id        String   @id @default(cuid())
  teacherId String
  teacher   User     @relation(fields: [teacherId], references: [id])

  amount    Decimal
  status    PayoutStatus @default(PENDING)
  period    String        // e.g., "2024-11"
  
  stripePayout String?
  payoutDate DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([teacherId])
  @@index([period])
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// ============================================
// RESOURCES & FILE SHARING (Phase 1)
// ============================================

model Resource {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  title     String
  description String?
  type      ResourceType
  
  // File storage
  fileUrl   String   // URL to stored file (S3, etc.)
  fileName  String
  fileSize  Int?     // in bytes
  fileMimeType String?

  // Release scheduling (Phase 1)
  releasedAt DateTime?  // NULL = released immediately
  expiresAt  DateTime?  // NULL = never expires

  // Visibility
  visibility ResourceVisibility @default(PRIVATE)
  
  // Access tracking
  resourceAccess ResourceAccess[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([type])
}

enum ResourceType {
  MUSIC_SCORE
  BACKING_TRACK
  METRONOME_CLICK
  EXAMPLE_RECORDING
  PRACTICE_GUIDE
  LESSON_NOTE
  OTHER
}

enum ResourceVisibility {
  PRIVATE          // Only specific students
  LESSON_GROUP     // All students in a specific lesson
  PUBLIC_SCHOOL    // All students in school
}

model ResourceAccess {
  id        String   @id @default(cuid())
  resourceId String
  resource  Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  // Who has access
  studentId String?
  student   Student? @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  lessonId  String?  // If resource is for a specific lesson

  // Access tracking
  accessGrantedAt DateTime @default(now())
  lastAccessedAt  DateTime?
  accessCount     Int       @default(0)

  @@unique([resourceId, studentId])
  @@index([resourceId])
  @@index([studentId])
}

// ============================================
// PROGRESSION & AWARDS (Phase 1)
// ============================================

model ProgressionAward {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  title     String        // e.g., "Completed Grade 1"
  description String?
  awardType ProgressionType
  
  // Icon/Badge (Phase 2)
  iconUrl   String?
  badgeColor String?

  earnedAt  DateTime @default(now())

  createdAt DateTime @default(now())

  @@index([schoolId])
  @@index([studentId])
}

enum ProgressionType {
  SECTION_COMPLETE
  GRADE_MILESTONE
  PRACTICE_STREAK
  PERFORMANCE
  EXAMINATION_PASS
  CUSTOM
}

// ============================================
// EXAMINATION REQUESTS (Phase 2)
// ============================================

model ExamRequest {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  studentId String
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  examType  String        // e.g., "ABRSM Grade 1"
  requestedDate DateTime?
  
  status    ExamRequestStatus @default(PENDING)
  approvedBy String?       // Teacher/Admin email who approved
  approvedAt DateTime?
  
  notes     String?
  examDate  DateTime?
  examResult String?       // e.g., "Pass", "Merit", "Distinction"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([studentId])
  @@index([status])
}

enum ExamRequestStatus {
  PENDING
  APPROVED
  REJECTED
  SCHEDULED
  COMPLETED
  RESULTS_RECEIVED
}
```

---

## Schema Notes

### Phase 1 (MVP) Features
- ✅ Core lessons (individual, group, hybrid)
- ✅ Student roster and enrollments
- ✅ Attendance tracking
- ✅ Payment processing
- ✅ Resource/file sharing with scheduled release
- ✅ Progression awards (basic)
- ✅ Multi-location and room management
- ✅ Teacher availability tracking

### Phase 2 Features
- 🔄 Family group accounts
- 🔄 Advanced progression tracking
- 🔄 Exam request management
- 🔄 Custom branding and landing pages
- 🔄 Enrollment approval workflow

### Key Design Decisions

**Hybrid Lesson Model**
- `HybridLessonConfig` stores the cycle configuration
- Weeks that trigger 1-on-1 booking are stored as JSON array
- System can query which weeks of a recurring cycle are 1-on-1
- Parents see when to book individual sessions

**Multi-Location Support**
- `Location` has many `Room`s
- `Lesson` points to both location and room
- `TeacherAvailability` allows teachers to specify when they work

**Resource Sharing**
- Files linked to students via `ResourceAccess`
- Scheduled release via `releasedAt` field
- Visibility levels: private, lesson group, or school-wide
- Access tracking for analytics

**Flexible Payment Model**
- Payment can be for single lesson or other reasons
- Optional family group ID for Phase 2 family billing
- Multiple payment methods supported

**Role-Based Access**
- Role enum supports ADMIN, TEACHER, PARENT, STUDENT
- User can only be teacher OR student (enforced in app)
- Parents link to family group for Phase 2

---

## Migration Path

**Week 1-2:** Create initial schema with core models
- School, User, Student, Location, Room
- Lesson, Enrollment, Attendance

**Week 3-4:** Add payment and resource sharing
- Payment, Payout, Resource, ResourceAccess
- HybridLessonConfig

**Week 5-6:** Add progression tracking
- ProgressionAward, TeacherAvailability

**Phase 2:** Add advanced features
- FamilyGroup, ExamRequest, enhance to support branding
```

This schema is now ready to use with the development plan. Let me know if you'd like me to adjust anything or create the API endpoint specifications next!
