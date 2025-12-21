# Music 'n Me - Comprehensive Development Task List

**Timeline:** 12 Weeks MVP
**Last Updated:** 2025-12-17

---

## PHASE 1: Foundation (Week 1-2)

### 1.1 Project Setup & Infrastructure
- [ ] Initialize backend project structure (Node.js, TypeScript, Express)
- [ ] Initialize frontend project structure (React, TypeScript, Vite)
- [ ] Configure ESLint, Prettier for both projects
- [ ] Set up PostgreSQL database (local + DigitalOcean)
- [ ] Configure environment variables (.env files for both apps)
- [ ] Set up Git repository and initial commit
- [ ] Create basic README.md with setup instructions

### 1.2 Database Schema (Prisma)
- [ ] Design complete Prisma schema for all models
- [ ] Create School model (name, settings, branding)
- [ ] Create User model (email, password, role, schoolId)
- [ ] Create Teacher model (userId, schoolId, instruments)
- [ ] Create Parent model (userId, schoolId, contacts array)
- [ ] Create Student model (schoolId, familyId, birthDate, ageGroup)
  - [ ] Add birthDate field (required for age calculation)
  - [ ] Add ageGroup enum (PRESCHOOL, KIDS, TEENS, ADULT)
  - [ ] Define age group ranges:
    - PRESCHOOL: 3-5 years (Alice character - Pink)
    - KIDS: 6-11 years (Steve character - Yellow)
    - TEENS: 12-17 years (Liam character - Blue)
    - ADULT: 18+ years (Floyd character - Mint)
  - [ ] Create utility to calculate ageGroup from birthDate
  - [ ] Update ageGroup on student birthday (or recalculate on access)
- [ ] Create Family model (schoolId, primaryParentId)
- [ ] Create Term model (schoolId, start/end dates, name)
- [ ] Create Location model (schoolId, name, address)
- [ ] Create Room model (locationId, name, capacity)
- [ ] Create Instrument model (schoolId, name, isActive)
- [ ] Create LessonType model (schoolId, name, defaultDuration)
- [ ] Create LessonDuration model (schoolId, minutes)
- [ ] Create PricingPackage model (schoolId, name, price, items)
- [ ] Create Lesson model (schoolId, type, termId, teacherId, roomId)
- [ ] Create HybridLessonPattern model (for HYBRID lesson types)
  - [ ] lessonId (links to parent Lesson)
  - [ ] termId (pattern applies per term)
  - [ ] patternType enum (ALTERNATING, CUSTOM)
  - [ ] groupWeeks (JSON array of week numbers, e.g., [1,2,3,5,6,7,9,10])
  - [ ] individualWeeks (JSON array of week numbers, e.g., [4,8])
  - [ ] individualSlotDuration (minutes, default 30)
  - [ ] bookingDeadlineHours (default 24)
- [ ] Create HybridBooking model (individual session bookings by parents)
  - [ ] lessonId, studentId, parentId
  - [ ] weekNumber, scheduledDate, startTime, endTime
  - [ ] status enum (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
  - [ ] bookedAt, cancelledAt timestamps
  - [ ] cancellationReason (optional)
- [ ] Create LessonEnrollment model (lessonId, studentId)
- [ ] Create Attendance model (lessonId, studentId, status, date)
- [ ] Create Note model (schoolId, authorId, studentId?, lessonId?)
- [ ] Create MeetAndGreet model (schoolId, contacts, status, verificationToken)
- [ ] Create Invoice model (schoolId, familyId, termId, lineItems, status)
- [ ] Create Payment model (invoiceId, amount, method, stripePaymentId)
- [ ] Create Resource model (schoolId, uploadedBy, lessonId?, studentId?, driveFileId)
- [ ] Run initial Prisma migration
- [ ] Create database seed file with sample data

### 1.3 Authentication & Authorization
- [ ] Install JWT and bcrypt dependencies
- [ ] Create password hashing utility (12 rounds minimum)
- [ ] Create JWT token generation utility (access + refresh tokens)
- [ ] Create auth middleware (verifyToken, attachUser)
- [ ] Create role-based authorization middleware (requireRole)
- [ ] Create schoolId validation middleware (ensure multi-tenancy)
- [ ] Implement POST /auth/register endpoint
- [ ] Implement POST /auth/login endpoint
- [ ] Implement POST /auth/refresh endpoint
- [ ] Implement POST /auth/logout endpoint
- [ ] Create auth error handling (401, 403 responses)

### 1.3a Password Reset Flow
**Forgot password functionality for users who cannot log in**

- [ ] Create POST /auth/forgot-password endpoint
  - [ ] Accept email address
  - [ ] Validate email exists in system (without revealing if it doesn't - security)
  - [ ] Generate secure reset token (crypto.randomBytes, 32 bytes)
  - [ ] Store token hash in database with expiration (1 hour)
  - [ ] Send password reset email with token link
- [ ] Create GET /auth/reset-password/:token endpoint
  - [ ] Validate token exists and not expired
  - [ ] Return token validity status (for frontend)
- [ ] Create POST /auth/reset-password endpoint
  - [ ] Validate token again
  - [ ] Validate new password against ALL security checks (strength, common, HIBP)
  - [ ] Hash new password and update user record
  - [ ] Invalidate reset token after use
  - [ ] Invalidate all existing sessions (force re-login)
  - [ ] Send confirmation email (password was reset)
  - [ ] Audit log password reset event
- [ ] Rate limit reset requests (prevent email enumeration)
  - [ ] Max 3 reset requests per email per hour
  - [ ] Max 10 reset requests per IP per hour
- [ ] Create forgot password form (frontend)
  - [ ] Email input field
  - [ ] Submit button with loading state
  - [ ] Success message (check your email)
  - [ ] Error handling
- [ ] Create reset password form (frontend)
  - [ ] Token validation on page load
  - [ ] New password field with visibility toggle
  - [ ] Confirm password field
  - [ ] Real-time password strength indicator
  - [ ] Requirements checklist
  - [ ] Submit button with loading state
  - [ ] Success redirect to login
  - [ ] Expired token error handling
- [ ] Create password reset email template (HTML + text)
  - [ ] Brand-compliant design
  - [ ] Clear call-to-action button
  - [ ] Token expiration warning (1 hour)
  - [ ] Security warning (if you didn't request this...)

### 1.3b Password Security (Body Chi Me Implementation)
**Comprehensive password security with proven production patterns**

#### Password Strength Requirements
- [ ] Enforce minimum 8 characters
- [ ] Require at least one uppercase letter (A-Z)
- [ ] Require at least one lowercase letter (a-z)
- [ ] Require at least one number (0-9)
- [ ] Require at least one special character (!@#$%^&*)
- [ ] Create password strength scoring utility (0-5 scale, minimum 4/5 required)
- [ ] Add real-time strength indicator display (frontend)

#### Password Security Checks
- [ ] Create common password detection system (10,000+ database)
  - [ ] Build password database from SecLists, HIBP, RockYou breach
  - [ ] Implement O(1) lookup using Set data structure
  - [ ] Maintain updated common password list
- [ ] Create personal information detection
  - [ ] Extract email username and domain
  - [ ] Extract name parts (first, middle, last)
  - [ ] Detect phone number sequences
  - [ ] Detect business/school name in password
  - [ ] Detect character substitutions (@→a, 3→e, 1→i, 5→s, 0→o, 4→a)
  - [ ] Block passwords containing personal info variants
- [ ] Implement Have I Been Pwned (HIBP) integration
  - [ ] Client-side SHA-1 hashing of password
  - [ ] Send only first 5 hash characters to API (k-anonymity privacy)
  - [ ] Validate full hash locally against returned ranges
  - [ ] Implement 24-hour cache for HIBP checks
  - [ ] Graceful degradation on API failures
  - [ ] Severity levels (NONE, LOW, MEDIUM, HIGH, CRITICAL)

#### Password Change Feature
- [ ] Create POST /auth/change-password endpoint
- [ ] Verify current password before allowing change
- [ ] Validate new password against ALL security checks
- [ ] Prevent reuse of last 5 passwords (password history)
- [ ] Invalidate all existing sessions on password change
- [ ] Send confirmation email after password change
- [ ] Audit log password change event
- [ ] Create password change form component (frontend)
  - [ ] Current password field with visibility toggle
  - [ ] New password field with visibility toggle
  - [ ] Confirm password field with visibility toggle
  - [ ] Real-time password strength indicator
  - [ ] Requirements checklist
  - [ ] Match validation feedback

#### Rate Limiting for Authentication
- [ ] Implement rate limiting for failed login attempts
  - [ ] Track 5 failed attempts per 15-minute sliding window
  - [ ] Track by both user ID AND IP address
  - [ ] Enforce 30-minute cooldown after max attempts
  - [ ] Automatic cleanup of expired attempts
  - [ ] Clear error messages to prevent timing attacks
- [ ] Implement rate limiting for password change attempts
  - [ ] Limit password changes (reasonable frequency, e.g., 1 per 15 min)
  - [ ] Track by userId

#### Database Schema Updates
- [ ] Update User model with passwordHistory (JSON field, last 5 hashes)
- [ ] Add lastPasswordChange timestamp to User model
- [ ] Create LoginAttempt model for rate limiting
  - [ ] userId, ipAddress, timestamp, success
- [ ] Add indexes for rate limiting queries (userId, ipAddress)

#### Testing for Password Security
- [ ] Unit tests for password strength evaluation
- [ ] Unit tests for common password detection
- [ ] Unit tests for personal info detection
- [ ] Unit tests for password history checking
- [ ] Unit tests for HIBP integration with mocking
- [ ] Unit tests for rate limiting logic
- [ ] Integration tests for complete password change flow
- [ ] Integration tests for rate limiting enforcement
- [ ] E2E tests for password change user journey
- [ ] Multi-tenancy tests (users from different schools)
- [ ] Test coverage >90% for password security code

#### Accessibility Compliance
- [ ] Ensure password form complies with WCAG 2.1 AA
- [ ] Add proper labels and ARIA attributes
- [ ] Test with screen readers
- [ ] Ensure proper keyboard navigation
- [ ] Test color contrast for visibility toggles

#### Documentation
- [ ] Document password requirements in docs/authentication-and-security.md
- [ ] Add password change to user guides
- [ ] Document HIBP privacy model
- [ ] Document rate limiting behavior
- [ ] Update CLAUDE.md with password security features

### 1.4 Multi-Tenancy Foundation
- [ ] Create school context middleware (extract schoolId from user)
- [ ] Create database query wrapper (auto-inject schoolId)
- [ ] Write utility functions for schoolId filtering
- [ ] Create test suite for multi-tenancy isolation
- [ ] Document multi-tenancy patterns for team

### 1.5 Account Deletion & Data Privacy (GDPR/Privacy Act/COPPA Compliance)
**See Planning/Account_Deletion_Specification.md for full details**

#### Database Schema for Deletion
- [ ] Add soft delete fields to User model (deletedAt, deletionRequestedAt, etc.)
- [ ] Add soft delete fields to Student model
- [ ] Add soft delete fields to Family model
- [ ] Create DeletionAuditLog model
- [ ] Create SchoolRetentionPolicy model
- [ ] Add indexes for deletion queries

#### Deletion API Endpoints (Backend)
- [ ] Create GET /users/me/deletion-blockers endpoint
  - [ ] Check outstanding balance
  - [ ] Check pending hybrid bookings
  - [ ] Check active disputes
  - [ ] Return list of blockers preventing deletion
- [ ] Create POST /users/me/request-deletion endpoint
  - [ ] Validate password confirmation
  - [ ] Check for blockers
  - [ ] Handle primary vs secondary parent logic
  - [ ] Create deletion request record
  - [ ] Send confirmation email
- [ ] Create POST /users/me/cancel-deletion endpoint
  - [ ] Validate within grace period
  - [ ] Restore account status
  - [ ] Send cancellation confirmation
- [ ] Create GET /users/me/export endpoint (GDPR data portability)
  - [ ] Generate JSON/CSV export of all user data
  - [ ] Include children's data for parents
  - [ ] Create secure download link (expires in 24h)
- [ ] Create DELETE /parent/students/:id endpoint
  - [ ] Parent can delete their own children
  - [ ] Verify parent owns student
  - [ ] Handle COPPA requirements (48h processing for under-13)

#### Admin Deletion Endpoints (Backend)
- [ ] Create GET /admin/deletion-requests endpoint
  - [ ] List pending deletion requests
  - [ ] Filter by status (PENDING, APPROVED, REJECTED, COMPLETED)
- [ ] Create POST /admin/deletion-requests/:id/approve endpoint
- [ ] Create POST /admin/deletion-requests/:id/reject endpoint
  - [ ] Require reason for rejection
- [ ] Create POST /admin/users/:id/restore endpoint
  - [ ] Restore soft-deleted accounts within grace period
- [ ] Create DELETE /admin/users/:id endpoint
  - [ ] Admin-initiated deletion
  - [ ] Require reason
- [ ] Create GET /admin/users/:id/export endpoint
  - [ ] Admin can export any user's data
- [ ] Create PATCH /admin/school/retention-policy endpoint
  - [ ] Configure school-specific retention periods

#### Deletion Background Jobs
- [ ] Create processHardDeletes job (daily at 2 AM)
  - [ ] Find soft-deleted records past grace period
  - [ ] Anonymize personal data
  - [ ] Remove from search indexes
  - [ ] Delete files from storage
  - [ ] Create audit log entry
- [ ] Create sendDeletionReminders job (daily at 9 AM)
  - [ ] Send reminder at 7 days before hard delete
  - [ ] Send reminder at 3 days before hard delete
  - [ ] Send reminder at 1 day before hard delete
- [ ] Create cleanupAnonymizedData job (weekly)
  - [ ] Delete teacher notes past retention period
  - [ ] Delete attendance records past retention period
- [ ] Create archiveFinancialRecords job (yearly)
  - [ ] Move old records to cold storage

#### Parent/Guardian Deletion Logic
- [ ] Implement primary parent deletion flow
  - [ ] Single parent: Delete entire family
  - [ ] Two parents: Transfer primary or require confirmation
- [ ] Implement secondary parent deletion flow
  - [ ] Unlink from family only
- [ ] Implement secondary parent confirmation flow
  - [ ] Send email to secondary parent
  - [ ] 7-day confirmation window
  - [ ] Handle timeout (escalate to admin)
- [ ] Create family cascade deletion logic
  - [ ] Delete all students
  - [ ] Anonymize attendance records
  - [ ] Anonymize invoices/payments
  - [ ] Delete notes after retention period

#### Deletion Frontend (User)
- [ ] Create "Delete My Account" page
  - [ ] Show what will be deleted
  - [ ] Show what will be retained (anonymized)
  - [ ] Explain 30-day grace period
  - [ ] Optional reason selection
  - [ ] Password confirmation
  - [ ] Type "DELETE" confirmation
- [ ] Create "Download My Data" button
  - [ ] Trigger data export
  - [ ] Show download link when ready
- [ ] Create deletion pending banner
  - [ ] Show on dashboard when deletion pending
  - [ ] "Cancel Deletion" button
  - [ ] Show days remaining
- [ ] Create child deletion interface (for parents)
  - [ ] Per-child deletion option
  - [ ] Warning about data loss
  - [ ] Confirmation flow

#### Deletion Frontend (Admin)
- [ ] Create Deletion Requests admin page
  - [ ] List pending requests
  - [ ] Approve/Reject actions
  - [ ] View request details
- [ ] Create user restore functionality
  - [ ] "Restore Account" button on soft-deleted users
- [ ] Create retention policy settings page
  - [ ] Configure financial retention years
  - [ ] Configure attendance retention years
  - [ ] Configure teacher notes retention days
  - [ ] Configure grace period days
- [ ] Add deletion status to user list
  - [ ] Show "Pending Deletion" badge
  - [ ] Show deletion date

#### Deletion Email Templates
- [ ] Create deletion_request_submitted template
- [ ] Create deletion_request_approved template
- [ ] Create deletion_request_rejected template
- [ ] Create deletion_reminder_7_days template
- [ ] Create deletion_reminder_3_days template
- [ ] Create deletion_reminder_1_day template
- [ ] Create account_deleted_confirmation template
- [ ] Create deletion_cancelled template
- [ ] Create secondary_parent_confirmation template
- [ ] Create child_deleted_notification template
- [ ] Create data_export_ready template

#### Deletion Testing
- [ ] Unit tests for deletion blocker checking
- [ ] Unit tests for anonymization logic
- [ ] Integration tests for parent deletion flow
- [ ] Integration tests for family cascade deletion
- [ ] Integration tests for grace period and hard delete
- [ ] Test primary→secondary transfer flow
- [ ] Test secondary parent confirmation flow
- [ ] Test COPPA 48-hour requirement for under-13
- [ ] Test data export generation
- [ ] Test multi-tenancy isolation (user from School A can't delete School B data)
- [ ] E2E test for complete deletion journey

#### Compliance Documentation
- [ ] Create user-facing privacy policy section on deletion
- [ ] Create admin guide for handling deletion requests
- [ ] Document retention policy configuration
- [ ] Create compliance checklist for annual review

### 1.6 Frontend Foundation
- [ ] Install Material-UI v5 and dependencies
- [ ] Configure MUI theme with brand colors (primary: #4580E4, secondary: #FFCE00)
- [ ] Add custom fonts (Monkey Mayhem, Avenir with fallbacks)
- [ ] Create theme provider component
- [ ] Create global styles (typography, colors, spacing)
- [ ] Set up React Router (public, authenticated routes)
- [ ] Create protected route wrapper component
- [ ] Set up React Query for data fetching
- [ ] Create API client with axios (base URL, auth headers)
- [ ] Create error boundary component
- [ ] Create loading state component
- [ ] Create toast notification system
- [ ] Build responsive layout shell (header, sidebar, content)

---

## PHASE 2: Public Onboarding (Week 2-3)

### 2.1 Email Service Setup (SendGrid)
- [ ] Create SendGrid account and get API key
- [ ] Install SendGrid SDK in backend
- [ ] Create email service utility class
- [ ] Create email templates directory structure
- [ ] Create send email function with error handling
- [ ] Add email to queue system (optional: Bull/Redis)
- [ ] Test email delivery in development

### 2.1a Email Template Design System
**Brand-compliant email templates with consistent design**

#### Base Template Structure
- [ ] Create base HTML email template
  - [ ] Header with Music 'n Me logo
  - [ ] Brand colors (Primary: #4580E4, Secondary: #FFCE00)
  - [ ] Avenir font (with web-safe fallbacks)
  - [ ] Responsive design (mobile-first)
  - [ ] Footer with school contact info
  - [ ] Unsubscribe link (CAN-SPAM compliance)
  - [ ] View in browser link
- [ ] Create plain text fallback template
- [ ] Create email component library
  - [ ] Button component (primary/secondary styles)
  - [ ] Card component for content sections
  - [ ] Table component for schedules/invoices
  - [ ] Alert/warning box component

#### Authentication Emails
- [ ] Email verification template (Meet & Greet)
- [ ] Welcome email template (new account created)
- [ ] Password reset request template
- [ ] Password reset confirmation template
- [ ] Password changed notification template

#### Meet & Greet Emails
- [ ] Booking confirmation template
- [ ] Admin notification (new booking) template
- [ ] Approval notification template
- [ ] Rejection notification template (with reason)
- [ ] Registration invitation template

#### Lesson & Attendance Emails
- [ ] Lesson reminder template (24h before)
- [ ] Lesson cancelled template
- [ ] Lesson rescheduled template
- [ ] Weekly attendance summary template (to parents)
- [ ] Missing notes reminder template (to teachers)

#### Hybrid Booking Emails
- [ ] Booking confirmation template
- [ ] Booking cancellation template
- [ ] Booking rescheduled template
- [ ] Booking reminder template (24h before)
- [ ] Available slots reminder template (unbooked weeks)

#### Financial Emails
- [ ] Invoice sent template (with PDF attachment option)
- [ ] Payment received/receipt template
- [ ] Payment failed template
- [ ] Payment reminder template (upcoming due date)
- [ ] Overdue invoice template

#### Resource Emails
- [ ] New resource uploaded template (to students/parents)

#### Email Testing
- [ ] Test all templates on major email clients (Gmail, Outlook, Apple Mail)
- [ ] Test mobile rendering
- [ ] Verify links work correctly
- [ ] Check spam score (use mail-tester.com)

### 2.2 Meet & Greet Booking System (Backend)
- [ ] Create POST /public/meet-and-greet endpoint
- [ ] Validate booking request (contacts, emergency contact, student info)
- [ ] Generate email verification token (crypto.randomBytes)
- [ ] Save meet & greet record to database (status: PENDING_VERIFICATION)
- [ ] Send verification email with token link
- [ ] Create GET /public/verify-email/:token endpoint
- [ ] Update status to PENDING_APPROVAL on verification
- [ ] Send notification to admin on new verified booking
- [ ] Create GET /admin/meet-and-greet (list all bookings)
- [ ] Create PATCH /admin/meet-and-greet/:id/approve endpoint
- [ ] Create PATCH /admin/meet-and-greet/:id/reject endpoint
- [ ] Add schoolId to all meet & greet queries

### 2.3 Meet & Greet Booking Form (Frontend)
- [ ] Create public Meet & Greet page (no auth required)
- [ ] Build multi-step booking form
  - [ ] Step 1: Student information (name, age, instrument preference)
  - [ ] Step 2: Primary contact (name, email, phone, relationship)
  - [ ] Step 3: Secondary contact (name, email, phone, relationship)
  - [ ] Step 4: Emergency contact (name, phone, relationship)
  - [ ] Step 5: Preferred date/time selection
  - [ ] Step 6: Additional notes
- [ ] Add form validation (required fields, email format, phone format)
- [ ] Create submission success page
- [ ] Create email verification success page
- [ ] Create email verification error page
- [ ] Add loading states during submission
- [ ] Add error handling and user feedback

### 2.4 Admin Meet & Greet Management
- [ ] Create admin Meet & Greet list view
- [ ] Display bookings with status filters (Pending, Verified, Approved, Rejected)
- [ ] Create booking detail modal/page
- [ ] Add approve/reject action buttons
- [ ] Add status change confirmation dialogs
- [ ] Show contact information (all 3 contacts)
- [ ] Add search and filter functionality
- [ ] Add date range filtering

### 2.5 Registration Flow (Backend)
- [ ] Create POST /admin/meet-and-greet/:id/convert endpoint
- [ ] Validate approved meet & greet can be converted
- [ ] Create Stripe checkout session for registration payment
- [ ] Create POST /webhooks/stripe endpoint (handle checkout.session.completed)
- [ ] Verify webhook signature
- [ ] Create family account on successful payment
- [ ] Create parent user account (auto-generate password, send email)
- [ ] Create student record linked to family
- [ ] Update meet & greet status to CONVERTED
- [ ] Send welcome email with login credentials
- [ ] Handle payment failure scenarios

### 2.6 Stripe Integration
- [ ] Create Stripe account (test mode)
- [ ] Install Stripe SDK in backend
- [ ] Configure Stripe API keys (env variables)
- [ ] Create Stripe service utility class
- [ ] Implement createCheckoutSession function
- [ ] Implement webhook signature verification
- [ ] Create webhook event handlers
- [ ] Test payment flow in Stripe test mode
- [ ] Document Stripe setup for production

### 2.7 Registration Flow (Frontend)
- [ ] Create admin "Convert to Registration" button
- [ ] Build registration review page (pre-populated with meet & greet data)
- [ ] Add pricing package selection
- [ ] Add terms and conditions checkbox
- [ ] Integrate Stripe Checkout (redirect flow)
- [ ] Create payment success page
- [ ] Create payment failure page
- [ ] Handle payment processing states
- [ ] Show registration completion confirmation

---

## PHASE 3: Core School Operations (Week 4-6)

### 3.1 School Configuration (Backend)
- [ ] Create GET /admin/school/settings endpoint
- [ ] Create PATCH /admin/school/settings endpoint
- [ ] Create GET /admin/terms endpoint (list all terms)
- [ ] Create POST /admin/terms endpoint
- [ ] Create PATCH /admin/terms/:id endpoint
- [ ] Create DELETE /admin/terms/:id endpoint
- [ ] Create GET /admin/locations endpoint
- [ ] Create POST /admin/locations endpoint
- [ ] Create PATCH /admin/locations/:id endpoint
- [ ] Create DELETE /admin/locations/:id endpoint
- [ ] Create GET /admin/rooms endpoint
- [ ] Create POST /admin/rooms endpoint
- [ ] Create PATCH /admin/rooms/:id endpoint
- [ ] Create DELETE /admin/rooms/:id endpoint
- [ ] Create CRUD endpoints for instruments
- [ ] Create CRUD endpoints for lesson types
- [ ] Create CRUD endpoints for lesson durations
- [ ] Create CRUD endpoints for pricing packages
- [ ] Add validation for all configuration endpoints
- [ ] Ensure all queries filter by schoolId

### 3.2 School Configuration (Frontend - Admin Dashboard)
- [ ] Create admin dashboard layout
- [ ] Create navigation sidebar (School, Classes, Students, Teachers, Payments, Settings)
- [ ] Build Terms management page (list, create, edit, delete)
- [ ] Build Locations management page
- [ ] Build Rooms management page
- [ ] Build Instruments management page
- [ ] Build Lesson Types management page
- [ ] Build Lesson Durations management page
- [ ] Build Pricing Packages management page
- [ ] Create reusable CRUD table component
- [ ] Create reusable form modal component
- [ ] Add form validation for all configuration forms
- [ ] Add success/error toast notifications
- [ ] Add confirmation dialogs for delete actions

### 3.3 Teacher Management (Backend)
- [ ] Create GET /admin/teachers endpoint (list all teachers)
- [ ] Create POST /admin/teachers endpoint
- [ ] Create GET /admin/teachers/:id endpoint
- [ ] Create PATCH /admin/teachers/:id endpoint
- [ ] Create DELETE /admin/teachers/:id endpoint
- [ ] Link teachers to instruments (many-to-many)
- [ ] Create user account when creating teacher
- [ ] Send welcome email with login credentials
- [ ] Filter by schoolId in all queries

### 3.4 Teacher Management (Frontend)
- [ ] Create Teachers list page
- [ ] Create Add Teacher form
- [ ] Create Edit Teacher form
- [ ] Display assigned instruments
- [ ] Add instrument multi-select component
- [ ] Show teacher's assigned classes
- [ ] Add search and filter functionality
- [ ] Add teacher profile view

### 3.5 Class & Lesson Management (Backend)
- [ ] Create GET /admin/lessons endpoint (list all lessons)
- [ ] Create POST /admin/lessons endpoint
- [ ] Create GET /admin/lessons/:id endpoint
- [ ] Create PATCH /admin/lessons/:id endpoint
- [ ] Create DELETE /admin/lessons/:id endpoint
- [ ] Support lesson types (INDIVIDUAL, GROUP, BAND, HYBRID)
- [ ] Create recurring lesson logic (weekly pattern for term)
- [ ] For HYBRID lessons, store group/individual week pattern
- [ ] Link lessons to teachers, rooms, instruments, terms
- [ ] Create GET /admin/lessons/:id/enrollments endpoint
- [ ] Create POST /admin/lessons/:id/enrollments endpoint (enroll student)
- [ ] Create DELETE /admin/lessons/:id/enrollments/:studentId endpoint
- [ ] Validate room availability (no double-booking)
- [ ] Validate teacher availability (no double-booking)
- [ ] Filter by schoolId in all queries

### 3.5a Lesson Cancellation Flow (Backend)
- [ ] Create POST /admin/lessons/:id/occurrences/:date/cancel endpoint
  - [ ] Cancel single lesson occurrence on specific date
  - [ ] Update attendance records to CANCELLED status
  - [ ] Send cancellation notification to enrolled students/parents
  - [ ] Record cancellation reason
- [ ] Create POST /admin/lessons/:id/cancel-remaining endpoint
  - [ ] Cancel all future occurrences from specified date
  - [ ] Bulk update attendance records
  - [ ] Send bulk cancellation notification
  - [ ] Option to specify end date (cancel range)
- [ ] Create POST /admin/lessons/:id/cancel-series endpoint
  - [ ] Cancel entire lesson series (all occurrences)
  - [ ] Remove lesson from active listings
  - [ ] Notify all enrolled students/parents
- [ ] Handle cancellation impact on invoices
  - [ ] Calculate pro-rata refund amount
  - [ ] Create credit note or adjustment
  - [ ] Flag for admin review
- [ ] Create cancellation audit log
  - [ ] Who cancelled, when, reason
  - [ ] Students affected
  - [ ] Financial impact

### 3.6 Class & Lesson Management (Frontend)
- [ ] Create Classes list page
- [ ] Create Add Class/Lesson form
  - [ ] Select lesson type (Individual, Group, Band, Hybrid)
  - [ ] Select term, teacher, room, instrument
  - [ ] Set day of week, time, duration
  - [ ] For HYBRID: Configure group/individual week pattern
- [ ] Create Edit Class form
- [ ] Create Class detail page
- [ ] Show enrolled students list
- [ ] Add "Enroll Student" functionality
- [ ] Add "Remove Student" functionality
- [ ] Show class schedule in calendar view
- [ ] Add drag-and-drop rescheduling
- [ ] Show room and teacher availability indicators
- [ ] Add conflict detection warnings

### 3.7 Calendar View (Frontend)
- [ ] Install calendar library (FullCalendar or react-big-calendar)
- [ ] Create calendar component
- [ ] Display all lessons for selected term
- [ ] Color-code by lesson type
- [ ] Show teacher, room, enrolled count on event
- [ ] Show day/week/month views
- [ ] Filter by teacher, room, instrument
- [ ] Handle HYBRID lesson display (show group vs individual indicator)
- [ ] Add lesson detail modal on click

### 3.7a Drag-and-Drop Rescheduling (Frontend)
- [ ] Implement drag-and-drop to reschedule lessons
- [ ] Define drag validation rules:
  - [ ] Prevent dragging to past dates
  - [ ] Validate room availability at new time
  - [ ] Validate teacher availability at new time
  - [ ] Check for student enrollment conflicts
  - [ ] Respect school operating hours
- [ ] Show real-time conflict indicators during drag
  - [ ] Red overlay for conflicts
  - [ ] Green overlay for available slots
  - [ ] Yellow for warnings (e.g., outside normal hours)
- [ ] Create confirmation dialog for reschedule
  - [ ] Show old vs new time/date
  - [ ] Show affected students count
  - [ ] Option to notify students/parents
  - [ ] Reason for reschedule (optional)
- [ ] Handle room change during drag
  - [ ] Show available rooms dropdown if dragging to occupied slot
  - [ ] Validate room capacity for group lessons
- [ ] Handle teacher change during drag (admin only)
  - [ ] Show available teachers dropdown
  - [ ] Validate teacher instrument compatibility
- [ ] Hybrid lesson specific rules:
  - [ ] Cannot drag individual booking slots (only parent can reschedule)
  - [ ] Group weeks can be rescheduled by admin
  - [ ] Show warning if rescheduling affects booked individual sessions
- [ ] Send notification emails after confirmed reschedule
- [ ] Create undo functionality (within 5 minutes)

### 3.8 Student Enrollment (Backend)
- [ ] Create GET /admin/students endpoint (list all students)
- [ ] Create POST /admin/students endpoint
- [ ] Create GET /admin/students/:id endpoint
- [ ] Create PATCH /admin/students/:id endpoint
- [ ] Create DELETE /admin/students/:id endpoint
- [ ] Link students to families
- [ ] Support multiple students per family
- [ ] Create GET /admin/families endpoint
- [ ] Create POST /admin/families endpoint
- [ ] Create PATCH /admin/families/:id endpoint
- [ ] Filter by schoolId in all queries

### 3.9 Student Enrollment (Frontend)
- [ ] Create Students list page
- [ ] Create Add Student form
- [ ] Create Edit Student form
- [ ] Link student to existing family or create new family
- [ ] Show student's enrolled classes
- [ ] Show family members
- [ ] Add student profile view with attendance history
- [ ] Add search and filter functionality
- [ ] Add bulk enrollment functionality

### 3.10 Attendance Tracking (Backend)
- [ ] Create GET /lessons/:id/attendance endpoint
- [ ] Create POST /lessons/:id/attendance endpoint (mark attendance)
- [ ] Create PATCH /attendance/:id endpoint (update status)
- [ ] Support attendance statuses (PRESENT, ABSENT, LATE, EXCUSED)
- [ ] Create attendance records for each lesson occurrence
- [ ] Calculate attendance rates per student
- [ ] Filter by schoolId in all queries

### 3.11 Teacher Notes (Backend)
**Policy: Notes are EXPECTED daily but REQUIRED by end of week. Not a hard blocker on attendance.**

- [ ] Create GET /lessons/:id/notes endpoint (class notes)
- [ ] Create POST /lessons/:id/notes endpoint (add class note)
- [ ] Create GET /students/:id/notes endpoint (student notes)
- [ ] Create POST /students/:id/notes endpoint (add student note)
- [ ] Create PATCH /notes/:id endpoint (update note)
- [ ] Create DELETE /notes/:id endpoint
- [ ] Track note completion status per lesson occurrence
  - [ ] noteStatus enum: PENDING, PARTIAL, COMPLETE
  - [ ] PENDING: No notes added yet
  - [ ] PARTIAL: Class note OR student notes added (not both)
  - [ ] COMPLETE: Class note AND all student notes added
- [ ] Create note deadline tracking
  - [ ] Deadline: End of week (Sunday 11:59 PM school timezone)
  - [ ] Grace period: None (deadline is firm)
  - [ ] Escalation: Admin notified of teachers with overdue notes
- [ ] Implement weekly reminder system
  - [ ] Friday 3 PM: Reminder email for incomplete notes
  - [ ] Sunday 6 PM: Final warning email
  - [ ] Monday 9 AM: Admin summary of overdue notes
- [ ] Create GET /admin/notes/overdue endpoint (list overdue notes by teacher)
- [ ] Create teacher notes dashboard widget (show pending notes count)
- [ ] Attendance marking is NOT blocked by missing notes
  - [ ] Show warning "Notes pending" but allow save
  - [ ] Track attendance and notes separately
- [ ] Filter by schoolId in all queries

### 3.12 Teacher Dashboard (Frontend)
- [ ] Create teacher dashboard layout
- [ ] Create "My Classes" view (show ALL classes, not just assigned)
- [ ] Create "All Students" view (full school access)
- [ ] Create today's schedule widget
- [ ] Create attendance marking interface
  - [ ] Show student roster for selected lesson
  - [ ] Quick mark present/absent buttons
  - [ ] Add late/excused options
  - [ ] Save attendance records
- [ ] Create class notes interface
  - [ ] Text editor for class notes
  - [ ] Mark as complete button
  - [ ] Show required notes indicator
- [ ] Create student notes interface
  - [ ] Student selector
  - [ ] Text editor for student notes
  - [ ] Note history view
- [ ] Create resource upload interface (defer details to Phase 5)
- [ ] Show missing notes alerts
- [ ] Add calendar view of all school classes

### 3.13 Resource Upload (Basic - Backend)
- [ ] Create POST /resources/upload endpoint
- [ ] Handle file upload (multer middleware)
- [ ] Validate file types (PDF, images, audio, video)
- [ ] Store files in local storage (defer Drive sync to Phase 5)
- [ ] Link resources to lessons or students
- [ ] Set visibility (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)
- [ ] Create GET /lessons/:id/resources endpoint
- [ ] Create GET /students/:id/resources endpoint
- [ ] Filter by schoolId in all queries

### 3.14 Resource Upload (Basic - Frontend)
- [ ] Create file upload component (drag-and-drop)
- [ ] Add file type validation
- [ ] Show upload progress
- [ ] Link resource to lesson or student
- [ ] Set visibility option
- [ ] Create resource list view
- [ ] Add download functionality
- [ ] Show file previews (images, PDFs)

---

## PHASE 4: Parent Experience (Week 7-8)

### 4.1 Parent Dashboard (Backend)
- [ ] Create GET /parent/family endpoint (family details)
- [ ] Create GET /parent/students endpoint (family students)
- [ ] Create GET /parent/schedule endpoint (all family lessons)
- [ ] Create GET /parent/resources endpoint (accessible resources)
- [ ] Create GET /parent/invoices endpoint (family invoices)
- [ ] Filter by user's schoolId and familyId

### 4.2 Parent Dashboard (Frontend)
- [ ] Create parent dashboard layout
- [ ] Create family overview widget
  - [ ] Show all students
  - [ ] Show contact information
  - [ ] Edit contact details
- [ ] Create weekly schedule view
  - [ ] Show all lessons for all family students
  - [ ] Color-code by student
  - [ ] Display lesson type, teacher, location
- [ ] Create resources library view
  - [ ] Filter by student
  - [ ] Download resources
  - [ ] Show recent uploads
- [ ] Create invoices view (basic - defer payment to Phase 5)
- [ ] Add mobile-responsive design

### 4.3 Hybrid Lesson Booking (Backend) ⭐ CORE FEATURE

#### Hybrid Lesson Pricing Formula
**Must define before implementation:**
- [ ] Define hybrid lesson pricing model:
  - [ ] Option A: Single term price (group + individual combined)
  - [ ] Option B: Split pricing (group weeks rate + individual weeks rate)
  - [ ] **Recommended:** Option B for transparency
- [ ] Calculate group weeks cost: (Group rate per session) × (Number of group weeks)
- [ ] Calculate individual weeks cost: (Individual rate per session) × (Number of individual weeks)
- [ ] Total term price = Group cost + Individual cost
- [ ] Handle extra individual session pricing (if parent books additional)
- [ ] Define cancellation refund policy:
  - [ ] >48 hours before: Full refund
  - [ ] 24-48 hours before: 50% refund
  - [ ] <24 hours before: No refund
  - [ ] Store as school-configurable settings
- [ ] Define missed booking deadline policy:
  - [ ] Parent misses deadline: Slot remains unbooked (no charge for that week)
  - [ ] OR: Auto-assign to next available slot
  - [ ] **Recommended:** Slot remains unbooked, send reminder next term

#### Hybrid Booking Endpoints
- [ ] Create GET /parent/hybrid-lessons endpoint (eligible hybrid lessons)
- [ ] Create GET /parent/hybrid-lessons/:id/availability endpoint
- [ ] Design hybrid lesson pattern logic
  - [ ] Store term-level group/individual week configuration
  - [ ] Generate available time slots for individual weeks
  - [ ] Block out already-booked slots
  - [ ] Respect teacher availability
- [ ] Create POST /parent/hybrid-lessons/:id/book endpoint
  - [ ] Validate slot availability
  - [ ] Check 24-hour advance booking requirement
  - [ ] Create individual lesson booking record
  - [ ] Update calendar with confirmed booking
  - [ ] Send confirmation email to parent and teacher
- [ ] Create DELETE /parent/hybrid-lessons/:id/bookings/:bookingId endpoint
  - [ ] Validate 24-hour cancellation policy
  - [ ] Cancel booking
  - [ ] Update calendar (restore placeholder or mark available)
  - [ ] Send cancellation email
- [ ] Create PATCH /parent/hybrid-lessons/:id/bookings/:bookingId/reschedule endpoint
  - [ ] Validate 24-hour policy
  - [ ] Move booking to new slot
  - [ ] Update calendar
  - [ ] Send reschedule confirmation
- [ ] Add conflict detection (prevent double-booking)
- [ ] Filter by schoolId and familyId

### 4.4 Hybrid Lesson Booking (Frontend) ⭐ CORE FEATURE
- [ ] Create Hybrid Lessons page
- [ ] List all hybrid lessons for family students
- [ ] Display term calendar showing group vs individual weeks
- [ ] Create booking interface
  - [ ] Show available time slots for individual weeks
  - [ ] Visual calendar with slot selection
  - [ ] Teacher availability indicators
  - [ ] Real-time conflict checking
- [ ] Create booking confirmation modal
- [ ] Create "My Bookings" view
  - [ ] Show all confirmed individual lesson bookings
  - [ ] Show upcoming individual lessons
  - [ ] Cancel booking button (with 24h validation)
  - [ ] Reschedule booking button (with 24h validation)
- [ ] Add booking history view
- [ ] Show 24-hour policy warnings
- [ ] Add mobile-optimized booking flow
- [ ] Create calendar placeholder visualization (show which weeks are group vs individual)

### 4.5 Hybrid Lesson Calendar Integration (Frontend)
- [ ] Update parent schedule view to show hybrid lesson bookings
- [ ] Differentiate group lessons vs individual bookings visually
- [ ] Show placeholders for unbooked individual weeks
- [ ] Add "Book Now" quick action from calendar
- [ ] Show booking status indicators (Booked, Pending, Available)

### 4.6 Notifications for Hybrid Bookings (Backend)
- [ ] Create email template for booking confirmation
- [ ] Create email template for booking cancellation
- [ ] Create email template for booking reschedule
- [ ] Create email template for booking reminders (24h before)
- [ ] Send emails on booking actions
- [ ] Notify teacher of parent bookings

---

## PHASE 5: Financial & Resources (Week 9-11)

### 5.1 Pricing & Invoicing (Backend)
- [ ] Create GET /admin/invoices endpoint (all invoices)
- [ ] Create POST /admin/invoices/generate endpoint
  - [ ] Generate invoices for term (batch or single family)
  - [ ] Calculate pricing based on enrolled classes
  - [ ] Support pricing packages (pre-defined bundles)
  - [ ] Support base price + add-ons model
  - [ ] Create multiple line items per invoice
  - [ ] Set due date
  - [ ] Set status (DRAFT, SENT, PAID, OVERDUE, CANCELLED)
- [ ] Create GET /admin/invoices/:id endpoint
- [ ] Create PATCH /admin/invoices/:id endpoint (edit invoice)
- [ ] Create POST /admin/invoices/:id/send endpoint (send to parent)
- [ ] Create DELETE /admin/invoices/:id endpoint
- [ ] Filter by schoolId in all queries

### 5.2 Payment Processing (Backend)
- [ ] Create POST /invoices/:id/pay endpoint
  - [ ] Create Stripe checkout session for invoice
  - [ ] Link checkout session to invoice
  - [ ] Handle successful payment webhook
  - [ ] Update invoice status to PAID
  - [ ] Create payment record
  - [ ] Send receipt email
- [ ] Create POST /admin/invoices/:id/manual-payment endpoint
  - [ ] Record cash/check payments
  - [ ] Update invoice status
  - [ ] Create payment record with method
- [ ] Create GET /invoices/:id/payments endpoint (payment history)
- [ ] Handle partial payments (if required)
- [ ] Filter by schoolId

### 5.3 Invoicing (Frontend - Admin)
- [ ] Create Invoices list page
- [ ] Create Generate Invoice form
  - [ ] Select term
  - [ ] Select families (single or bulk)
  - [ ] Select pricing package or manual line items
  - [ ] Preview invoice totals
- [ ] Create Invoice detail page
  - [ ] Show line items breakdown
  - [ ] Show payment status
  - [ ] Show payment history
  - [ ] Edit invoice button (if unpaid)
  - [ ] Send invoice button
  - [ ] Record manual payment button
- [ ] Create bulk invoice generation flow
- [ ] Add invoice filters (status, term, family)
- [ ] Create invoice email preview
- [ ] Add invoice PDF generation (optional)

### 5.4 Payment Processing (Frontend - Parent)
- [ ] Update parent invoices view with payment options
- [ ] Create "Pay Now" button (Stripe Checkout)
- [ ] Create payment success page
- [ ] Create payment failure page
- [ ] Show payment history
- [ ] Download receipt functionality
- [ ] Show outstanding balance prominently

### 5.5 Google Drive Integration (Backend) ⭐ TWO-WAY SYNC
- [ ] Create Google Cloud project
- [ ] Enable Google Drive API
- [ ] Create service account and download credentials
- [ ] Install Google Drive SDK (googleapis)
- [ ] Create Drive service utility class
- [ ] Implement OAuth2 authentication
- [ ] Create POST /admin/drive/link-folder endpoint
  - [ ] Link Drive folder to lesson or student
  - [ ] Store folderId in database
  - [ ] Verify admin has access to folder
- [ ] Update POST /resources/upload to sync to Drive
  - [ ] Upload file to local storage
  - [ ] Upload file to linked Drive folder
  - [ ] Store driveFileId in database
- [ ] Create Drive webhook listener (watch for changes)
  - [ ] Detect new files added in Drive
  - [ ] Download file to local storage
  - [ ] Create resource record in database
- [ ] Create GET /resources/:id/download endpoint
  - [ ] Download from Drive if driveFileId exists
  - [ ] Fall back to local storage
- [ ] Handle Drive sync errors gracefully
- [ ] Create sync status tracking (synced, pending, failed)

### 5.6 Google Drive Integration (Frontend)
- [ ] Create Drive folder linking interface (admin)
  - [ ] Select lesson or student
  - [ ] Input Drive folder URL or ID
  - [ ] Test connection button
  - [ ] Show linked folders list
- [ ] Update resource upload to show sync status
- [ ] Show Drive sync indicator on resources
- [ ] Add "View in Drive" link for synced resources
- [ ] Create sync error notifications
- [ ] Add manual re-sync button for failed uploads

### 5.7 Email Notifications (Comprehensive)
- [ ] Create email template for attendance marked
- [ ] Create email template for new note added
- [ ] Create email template for new resource uploaded
- [ ] Create email template for invoice sent
- [ ] Create email template for payment received
- [ ] Create email template for payment failed
- [ ] Create email template for lesson cancelled
- [ ] Create email template for lesson rescheduled
- [ ] Create email template for missing teacher notes reminder
- [ ] Create email service scheduler (cron jobs)
- [ ] Send weekly attendance summary to parents
- [ ] Send overdue invoice reminders
- [ ] Test all email templates

---

## PHASE 6: Polish & Launch Prep (Week 12)

### 6.1 Security Audit
- [ ] Review all API endpoints for schoolId filtering
- [ ] Test multi-tenancy isolation (attempt cross-school data access)
- [ ] Review authentication middleware on all protected routes
- [ ] Test role-based access control (ADMIN, TEACHER, PARENT, STUDENT)
- [ ] Review password hashing implementation (verify 12+ rounds)
- [ ] Test JWT token expiration and refresh flow
- [ ] Review Stripe webhook signature verification
- [ ] Test payment security (prevent amount manipulation)
- [ ] Review file upload security (prevent malicious files)
- [ ] Test for SQL injection vulnerabilities
- [ ] Test for XSS vulnerabilities
- [ ] Review CORS configuration
- [ ] Add rate limiting to API endpoints
- [ ] Add request validation (joi or zod)
- [ ] Review error handling (don't leak sensitive info)
- [ ] Test HTTPS enforcement in production
- [ ] Review environment variable security
- [ ] Add CSP headers
- [ ] Test CSRF protection (if needed)

### 6.2 Testing
- [ ] Write unit tests for auth utilities (JWT, hashing)
- [ ] Write unit tests for business logic (pricing, attendance, hybrid booking)
- [ ] Write integration tests for Meet & Greet flow
- [ ] Write integration tests for Registration + Payment flow
- [ ] Write integration tests for Hybrid Booking flow
- [ ] Write integration tests for Invoicing + Payment flow
- [ ] Write integration tests for Google Drive sync
- [ ] Write E2E tests for critical user journeys
  - [ ] Admin creates class and enrolls students
  - [ ] Teacher marks attendance and adds notes
  - [ ] Parent books hybrid individual lesson
  - [ ] Parent pays invoice
- [ ] Test email delivery (SendGrid sandbox)
- [ ] Test Stripe payments (test mode)
- [ ] Achieve 80%+ backend test coverage
- [ ] Achieve 70%+ frontend test coverage
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test mobile responsiveness (iOS, Android)

### 6.3 Performance Optimization
- [ ] Add database indexes (schoolId, userId, familyId, termId)
- [ ] Optimize N+1 queries (use Prisma includes)
- [ ] Add API response caching (Redis optional)
- [ ] Optimize frontend bundle size (code splitting)
- [ ] Lazy load routes and components
- [ ] Optimize images (compression, lazy loading)
- [ ] Add frontend caching (React Query)
- [ ] Test API response times (target <200ms)
- [ ] Test page load times (target <2s)
- [ ] Add pagination to large lists (students, invoices, etc.)

### 6.4 Error Handling & Monitoring
- [ ] Create global error handler middleware (backend)
- [ ] Log errors to file or service (Winston, Sentry)
- [ ] Create user-friendly error messages (frontend)
- [ ] Add error boundary components (React)
- [ ] Test error scenarios (network failures, invalid data, auth failures)
- [ ] Create 404 page
- [ ] Create 500 error page
- [ ] Add loading states for all async operations
- [ ] Add empty states for lists
- [ ] Add form validation error messages

### 6.5 Documentation
- [ ] Document API endpoints (Swagger/OpenAPI optional)
- [ ] Document database schema (ERD diagram)
- [ ] Document environment variables setup
- [ ] Document local development setup
- [ ] Document deployment process (DigitalOcean)
- [ ] Create admin user guide (how to use admin dashboard)
- [ ] Create teacher user guide (how to mark attendance, add notes)
- [ ] Create parent user guide (how to book hybrid lessons, pay invoices)
- [ ] Document multi-tenancy architecture
- [ ] Document Google Drive sync setup
- [ ] Document Stripe setup (test + production)
- [ ] Document SendGrid setup

### 6.6 Deployment Preparation
- [ ] Set up DigitalOcean droplet (or App Platform)
- [ ] Configure PostgreSQL database (managed or on droplet)
- [ ] Set up environment variables in production
- [ ] Configure domain and SSL certificate
- [ ] Set up CI/CD pipeline (GitHub Actions optional)
- [ ] Create production build scripts
- [ ] Test deployment in staging environment
- [ ] Set up database backup strategy
- [ ] Configure monitoring (uptime, errors)
- [ ] Create rollback plan

### 6.7 User Acceptance Testing (UAT)
- [ ] Create test school with sample data
- [ ] Invite client to test admin features
- [ ] Invite teachers to test teacher dashboard
- [ ] Invite parents to test parent dashboard and hybrid booking
- [ ] Collect feedback on usability
- [ ] Fix critical bugs identified in UAT
- [ ] Validate hybrid booking flow with real users
- [ ] Validate payment flow with test Stripe account
- [ ] Validate email notifications

### 6.8 Launch Checklist
- [ ] Switch Stripe to live mode
- [ ] Switch SendGrid to production
- [ ] Update Google Drive API to production credentials
- [ ] Final security review
- [ ] Final performance test
- [ ] Backup database before launch
- [ ] Deploy to production
- [ ] Verify all features working in production
- [ ] Monitor error logs for first 24 hours
- [ ] Create support contact method for users
- [ ] Celebrate launch!

### 6.9 School-Level Deletion (Multi-Tenant SaaS)
**Required when selling platform to multiple schools**

#### Super Admin Endpoints
- [ ] Create DELETE /super-admin/schools/:id endpoint
  - [ ] Require Super Admin role (platform owner)
  - [ ] Initiate 30-day notice period
  - [ ] Make school read-only during notice period
- [ ] Create GET /super-admin/schools/:id/deletion-status endpoint
- [ ] Create POST /super-admin/schools/:id/cancel-deletion endpoint

#### School Deletion Notice Period (30 days)
- [ ] Send school deletion notice to all users (email)
  - [ ] Include deletion date
  - [ ] Instructions to export data
  - [ ] Contact info for questions
- [ ] Create "School Deletion Pending" banner for all users
- [ ] Disable new enrollments during notice period
- [ ] Disable new payments during notice period
- [ ] Allow data exports during notice period

#### School Data Export
- [ ] Create GET /admin/school/export endpoint
  - [ ] Export all students (CSV)
  - [ ] Export all families (CSV)
  - [ ] Export all attendance records (CSV)
  - [ ] Export all invoices and payments (CSV)
  - [ ] Export all teacher notes (CSV)
  - [ ] Export all resources (ZIP)
- [ ] Generate secure download link (expires in 7 days)
- [ ] Notify admin when export is ready

#### School Hard Deletion (After 60 days total)
- [ ] Create processSchoolHardDelete job
  - [ ] Soft delete all users at 30 days
  - [ ] Hard delete all personal data at 60 days
  - [ ] Anonymize and archive financial records
  - [ ] Delete all files from storage
  - [ ] Remove school from active tenants
  - [ ] Create final audit log
- [ ] Archive anonymized financial records to cold storage
- [ ] Retain audit logs for 7 years minimum

#### School Deletion Testing
- [ ] Test school deletion notice flow
- [ ] Test data export for school
- [ ] Test school read-only mode
- [ ] Test cascade deletion of all school data
- [ ] Test financial record archiving
- [ ] Verify no data leakage to other schools after deletion

---

## DEFERRED TO PHASE 2 (Post-MVP)

The following features are intentionally deferred to Phase 2:

- [ ] Monthly subscription payments (MVP uses term-based invoicing only)
- [ ] WhatsApp/SMS notifications (MVP uses email only)
- [ ] Google Calendar sync
- [ ] Xero accounting integration
- [ ] Events management system
- [ ] Blog/Newsletter CMS
- [ ] Teacher training module
- [ ] Advanced CRM features
- [ ] Student progress tracking & reporting
- [ ] Advanced analytics dashboard

---

## CRITICAL SUCCESS FACTORS

### Week 5 Checkpoint: Hybrid Booking Must Be Working
- Hybrid lesson booking is the CORE differentiator
- Must be tested and validated by Week 8
- Allocate extra buffer time if needed

### Weekly Multi-Tenancy Testing
- Test schoolId filtering every week
- Never skip multi-tenancy validation
- One data leak = complete system failure

### Payment Integration Early
- Get Stripe working by Week 3 (registration)
- Test payment flow thoroughly
- Payment bugs are showstoppers

### Email Delivery Reliability
- Set up SendGrid properly from Week 2
- Test email templates thoroughly
- Monitor delivery rates

---

## NOTES

- **Parallel Development Opportunities:**
  - Meet & Greet (Phase 2) can be built while School Config (Phase 3) is in progress
  - Teacher Dashboard (Phase 3) and Parent Dashboard (Phase 4) can be parallelized if team size allows
  - Email templates can be created alongside feature development

- **High-Risk Areas (allocate extra time):**
  - Hybrid lesson booking logic (most complex feature)
  - Google Drive two-way sync (external API dependencies)
  - Stripe payment webhooks (must be bulletproof)
  - Multi-tenancy security (cannot fail)

- **Testing Strategy:**
  - Write tests as you build features (don't defer to Week 12)
  - Focus on critical paths: registration + payment, hybrid booking, invoicing
  - Manual testing for UX flows (forms, dashboards)

- **Communication:**
  - Weekly demo to client (show progress)
  - Daily standups to track blockers
  - Document decisions in CLAUDE.md as you go
