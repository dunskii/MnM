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
- [ ] Create Student model (schoolId, familyId, age group)
- [ ] Create Family model (schoolId, primaryParentId)
- [ ] Create Term model (schoolId, start/end dates, name)
- [ ] Create Location model (schoolId, name, address)
- [ ] Create Room model (locationId, name, capacity)
- [ ] Create Instrument model (schoolId, name, isActive)
- [ ] Create LessonType model (schoolId, name, defaultDuration)
- [ ] Create LessonDuration model (schoolId, minutes)
- [ ] Create PricingPackage model (schoolId, name, price, items)
- [ ] Create Lesson model (schoolId, type, termId, teacherId, roomId)
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
- [ ] Add password strength validation
- [ ] Add email format validation
- [ ] Create auth error handling (401, 403 responses)

### 1.4 Multi-Tenancy Foundation
- [ ] Create school context middleware (extract schoolId from user)
- [ ] Create database query wrapper (auto-inject schoolId)
- [ ] Write utility functions for schoolId filtering
- [ ] Create test suite for multi-tenancy isolation
- [ ] Document multi-tenancy patterns for team

### 1.5 Frontend Foundation
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
- [ ] Create email templates directory
- [ ] Design Meet & Greet confirmation email template (HTML + text)
- [ ] Design email verification template
- [ ] Design welcome email template
- [ ] Create send email function with error handling
- [ ] Add email to queue system (optional: Bull/Redis)
- [ ] Test email delivery in development

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
- [ ] Implement drag-and-drop to reschedule
- [ ] Show day/week/month views
- [ ] Filter by teacher, room, instrument
- [ ] Handle HYBRID lesson display (show group vs individual indicator)
- [ ] Add lesson detail modal on click

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
- [ ] Create GET /lessons/:id/notes endpoint (class notes)
- [ ] Create POST /lessons/:id/notes endpoint (add class note)
- [ ] Create GET /students/:id/notes endpoint (student notes)
- [ ] Create POST /students/:id/notes endpoint (add student note)
- [ ] Create PATCH /notes/:id endpoint (update note)
- [ ] Create DELETE /notes/:id endpoint
- [ ] Flag required notes (per student AND per class)
- [ ] Track note completion status
- [ ] Send reminders for missing notes (weekly deadline)
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
- [ ] Celebrate launch! 🎉

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
