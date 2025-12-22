# Music 'n Me - Development Task List

**Timeline:** 12 Weeks MVP
**Start Date:** 2025-12-21
**Target Launch:** Week 12 (Early March 2025)

---

## Quick Links

- [Progress Tracker](./PROGRESS.md) - Track completion status
- [Sprint Plan](./Planning/roadmaps/12_Week_MVP_Plan.md) - Detailed weekly breakdown
- [Full Task Checklist](./Planning/roadmaps/Development_Task_List.md) - 300+ item detailed list

---

## PHASE 0: Project Initialization (Pre-Sprint)

### 0.1 Monorepo Setup
- [x] Create `apps/backend/` directory with Node.js/Express/TypeScript
- [x] Create `apps/frontend/` directory with React/Vite/TypeScript
- [x] Create root `package.json` with npm workspaces
- [x] Create root `tsconfig.json` for shared config
- [x] Create root `README.md` with setup instructions
- [x] Configure ESLint and Prettier for both projects

### 0.2 Environment Configuration
- [x] Create `apps/backend/.env.example`
- [x] Create `apps/frontend/.env.example`
- [x] Create `docker-compose.yml` for PostgreSQL + Redis

### 0.3 Database Setup
- [x] Create Prisma schema (`apps/backend/prisma/schema.prisma`)
- [x] Run initial migration
- [x] Create database seed file

---

## PHASE 1: Foundation (Week 1-2) - COMPLETE

### 1.1 Project Infrastructure
- [x] Set up PostgreSQL database (local + DigitalOcean)
- [x] Configure environment variables
- [x] Set up Git repository and initial commit
- [x] Create basic README.md with setup instructions

### 1.2 Database Schema (Prisma)
- [x] School model (name, settings, branding)
- [x] User model (email, password, role, schoolId)
- [x] Teacher model (userId, schoolId, instruments)
- [x] Parent model (userId, schoolId, contacts array)
- [x] Student model (schoolId, familyId, birthDate, ageGroup)
- [x] Family model (schoolId, primaryParentId)
- [x] Term model (schoolId, start/end dates)
- [x] Location model (schoolId, name, address)
- [x] Room model (locationId, name, capacity)
- [x] Instrument model (schoolId, name, isActive)
- [x] LessonType model (schoolId, name, defaultDuration)
- [x] LessonDuration model (schoolId, minutes)
- [x] PricingPackage model (schoolId, name, price, items)
- [x] Lesson model (schoolId, type, termId, teacherId, roomId)
- [x] HybridLessonPattern model (for HYBRID lessons)
- [x] HybridBooking model (individual session bookings)
- [x] LessonEnrollment model (lessonId, studentId)
- [x] Attendance model (lessonId, studentId, status, date)
- [x] Note model (schoolId, authorId, studentId?, lessonId?)
- [x] MeetAndGreet model (schoolId, contacts, status, verificationToken)
- [x] Invoice model (schoolId, familyId, termId, lineItems, status)
- [x] Payment model (invoiceId, amount, method, stripePaymentId)
- [x] Resource model (schoolId, uploadedBy, lessonId?, driveFileId)

### 1.3 Authentication & Authorization
- [x] Password hashing utility (bcrypt 12 rounds)
- [x] JWT token generation (access + refresh tokens)
- [x] Auth middleware (verifyToken, attachUser)
- [x] Role-based authorization middleware (requireRole)
- [x] SchoolId validation middleware (multi-tenancy)
- [x] POST /auth/login endpoint
- [x] POST /auth/refresh endpoint
- [x] POST /auth/logout endpoint

### 1.4 Password Security (Body Chi Me Patterns)
- [x] Password strength requirements (8+ chars, mixed case, number, special)
- [x] Common password detection (10,000+ database)
- [x] Personal information detection
- [x] Have I Been Pwned (HIBP) integration
- [x] Password history (last 5 prevention)
- [x] Rate limiting (5 failures per 15 min)
- [ ] POST /auth/change-password endpoint
- [ ] POST /auth/forgot-password endpoint
- [ ] POST /auth/reset-password endpoint

### 1.5 Multi-Tenancy Foundation
- [x] School context middleware
- [x] Database query wrapper (auto-inject schoolId)
- [ ] Multi-tenancy isolation test suite

### 1.6 Account Deletion & Data Privacy
- [x] Soft delete fields on User, Student, Family models
- [x] DeletionAuditLog model
- [x] SchoolRetentionPolicy model
- [ ] GET /users/me/deletion-blockers endpoint
- [ ] POST /users/me/request-deletion endpoint
- [ ] POST /users/me/cancel-deletion endpoint
- [ ] GET /users/me/export endpoint (GDPR portability)
- [ ] Hard delete background jobs

### 1.7 Frontend Foundation
- [x] Material-UI v5 with brand colors
- [x] Custom fonts (Monkey Mayhem, Avenir)
- [x] Theme provider component
- [x] React Router setup
- [x] Protected route wrapper
- [x] React Query configuration
- [x] API client with axios
- [x] Error boundary component
- [x] Toast notification system
- [x] Responsive layout shell

### 1.8 School Configuration (Backend) - Week 2
- [x] CRUD endpoints for Terms
- [x] CRUD endpoints for Locations
- [x] CRUD endpoints for Rooms
- [x] CRUD endpoints for Instruments
- [x] CRUD endpoints for Lesson Types
- [x] CRUD endpoints for Lesson Durations

### 1.9 School Configuration (Frontend) - Week 2
- [x] Admin dashboard layout
- [x] Navigation sidebar
- [x] Terms management page
- [x] Locations management page
- [x] Rooms management page
- [x] Instruments management page
- [x] Lesson Types management page
- [x] Lesson Durations management page

### 1.10 User Management - Week 2
- [x] GET/POST/PATCH/DELETE /admin/teachers endpoints
- [x] Teacher-instrument linking
- [x] Teachers list page
- [x] Add/Edit Teacher forms
- [x] GET/POST/PATCH/DELETE /admin/parents endpoints
- [x] Parents list page with 2 contacts + emergency
- [x] Add/Edit Parent forms
- [x] GET/POST/PATCH/DELETE /admin/students endpoints
- [x] Students list page
- [x] Add/Edit Student forms

---

## PHASE 2: Public Onboarding (Week 3)

### 2.1 Email Service (SendGrid)
- [ ] SendGrid account and API key
- [ ] Email service utility class
- [ ] Email templates directory
- [ ] Base HTML email template (brand colors, responsive)
- [ ] Plain text fallback template

### 2.2 Meet & Greet System (Backend)
- [ ] POST /public/meet-and-greet endpoint
- [ ] Email verification token generation
- [ ] GET /public/verify-email/:token endpoint
- [ ] GET /admin/meet-and-greet (list all)
- [ ] PATCH /admin/meet-and-greet/:id/approve
- [ ] PATCH /admin/meet-and-greet/:id/reject

### 2.3 Meet & Greet Form (Frontend)
- [ ] Public Meet & Greet page (no auth)
- [ ] Multi-step booking form (student, contacts, emergency, preferences)
- [ ] Form validation
- [ ] Success/verification pages

### 2.4 Registration Flow
- [ ] POST /admin/meet-and-greet/:id/convert endpoint
- [ ] Stripe checkout session creation
- [ ] POST /webhooks/stripe (handle checkout.session.completed)
- [ ] Create family/parent/student on payment success
- [ ] Send welcome email

### 2.5 Stripe Integration
- [ ] Stripe account (test mode)
- [ ] Stripe SDK installation
- [ ] createCheckoutSession function
- [ ] Webhook signature verification

---

## PHASE 3: Core School Operations (Week 4-6)

### 3.1 Lesson Management (Backend)
- [ ] GET/POST/PATCH/DELETE /admin/lessons endpoints
- [ ] Support all lesson types (INDIVIDUAL, GROUP, BAND, HYBRID)
- [ ] Recurring lesson logic
- [ ] Hybrid lesson pattern storage
- [ ] Room/teacher availability validation
- [ ] Lesson enrollment endpoints

### 3.2 Lesson Management (Frontend)
- [ ] Classes list page
- [ ] Add/Edit Class forms
- [ ] Hybrid lesson pattern configuration
- [ ] Student enrollment interface
- [ ] Conflict detection warnings

### 3.3 Calendar View
- [ ] Calendar component (FullCalendar or react-big-calendar)
- [ ] Color-coded lesson types
- [ ] Day/week/month views
- [ ] Filter by teacher, room, instrument
- [ ] Hybrid lesson placeholder display

### 3.4 Drag-and-Drop Rescheduling
- [ ] Drag event handlers
- [ ] Real-time conflict checking
- [ ] Confirmation dialog
- [ ] Notification on reschedule

### 3.5 Attendance Tracking
- [ ] GET/POST /lessons/:id/attendance endpoints
- [ ] Attendance statuses (PRESENT, ABSENT, LATE, EXCUSED)
- [ ] Attendance history per student

### 3.6 Teacher Notes
- [ ] GET/POST /lessons/:id/notes endpoints (class notes)
- [ ] GET/POST /students/:id/notes endpoints (student notes)
- [ ] Note completion tracking
- [ ] Weekly reminder system

### 3.7 Teacher Dashboard (Frontend)
- [ ] "My Classes" view (ALL classes)
- [ ] Today's schedule widget
- [ ] Attendance marking interface
- [ ] Class and student notes interface
- [ ] Missing notes alerts

### 3.8 Resource Upload (Basic)
- [ ] POST /resources/upload endpoint
- [ ] File type validation
- [ ] Visibility settings (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)
- [ ] File upload component
- [ ] Resource list view

---

## PHASE 4: Parent Experience (Week 7-8)

### 4.1 Parent Dashboard (Backend)
- [ ] GET /parent/family endpoint
- [ ] GET /parent/students endpoint
- [ ] GET /parent/schedule endpoint
- [ ] GET /parent/resources endpoint
- [ ] GET /parent/invoices endpoint

### 4.2 Parent Dashboard (Frontend)
- [ ] Family overview widget
- [ ] Weekly schedule view
- [ ] Resources library view
- [ ] Invoices view
- [ ] Mobile-responsive design

### 4.3 Hybrid Lesson Booking (Backend) - CORE FEATURE
- [ ] GET /parent/hybrid-lessons endpoint
- [ ] GET /parent/hybrid-lessons/:id/availability endpoint
- [ ] POST /parent/hybrid-lessons/:id/book endpoint
- [ ] DELETE /parent/hybrid-lessons/:id/bookings/:bookingId endpoint
- [ ] PATCH /parent/hybrid-lessons/:id/bookings/:bookingId/reschedule endpoint
- [ ] 24-hour booking/cancellation policy enforcement
- [ ] Conflict detection

### 4.4 Hybrid Lesson Booking (Frontend) - CORE FEATURE
- [ ] Hybrid Lessons page
- [ ] Term calendar (group vs individual weeks)
- [ ] Available slot selection
- [ ] Booking confirmation modal
- [ ] "My Bookings" view
- [ ] Cancel/reschedule functionality
- [ ] 24-hour policy warnings

### 4.5 Hybrid Booking Notifications
- [ ] Booking confirmation email
- [ ] Booking cancellation email
- [ ] Booking reschedule email
- [ ] 24h reminder email

---

## PHASE 5: Financial & Resources (Week 9-11)

### 5.1 Invoicing (Backend)
- [ ] GET /admin/invoices endpoint
- [ ] POST /admin/invoices/generate endpoint
- [ ] Pricing packages support
- [ ] Base price + add-ons model
- [ ] Multiple line items per invoice
- [ ] Invoice send endpoint

### 5.2 Payment Processing (Backend)
- [ ] POST /invoices/:id/pay endpoint
- [ ] Stripe checkout integration
- [ ] Payment webhook handling
- [ ] POST /admin/invoices/:id/manual-payment endpoint
- [ ] Payment history

### 5.3 Invoicing (Frontend - Admin)
- [ ] Invoices list page
- [ ] Generate Invoice form
- [ ] Invoice detail page
- [ ] Bulk invoice generation
- [ ] Record manual payment

### 5.4 Payment (Frontend - Parent)
- [ ] Pay Now button (Stripe Checkout)
- [ ] Payment success/failure pages
- [ ] Payment history
- [ ] Download receipt

### 5.5 Google Drive Integration (Backend) - TWO-WAY SYNC
- [ ] Google Cloud project setup
- [ ] Google Drive API authentication
- [ ] POST /admin/drive/link-folder endpoint
- [ ] File upload to Drive sync
- [ ] Drive webhook for new files
- [ ] GET /resources/:id/download endpoint
- [ ] Background sync job (15 min)

### 5.6 Google Drive Integration (Frontend)
- [ ] Drive folder browser component
- [ ] Folder mapping management page
- [ ] File upload with sync status
- [ ] "View in Drive" link
- [ ] Manual re-sync button

### 5.7 Email Notifications (Comprehensive)
- [ ] All email templates created
- [ ] Email scheduler (cron jobs)
- [ ] Weekly attendance summary
- [ ] Overdue invoice reminders

---

## PHASE 6: Polish & Launch (Week 12)

### 6.1 Security Audit
- [ ] SchoolId filtering review
- [ ] Multi-tenancy isolation testing
- [ ] Role-based access control testing
- [ ] Password security verification
- [ ] JWT token flow testing
- [ ] Stripe webhook security
- [ ] File upload security
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Request validation

### 6.2 Testing
- [ ] Unit tests for auth utilities
- [ ] Unit tests for business logic
- [ ] Integration tests for critical flows
- [ ] E2E tests for user journeys
- [ ] 80%+ backend coverage
- [ ] 70%+ frontend coverage
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing

### 6.3 Performance Optimization
- [ ] Database indexes
- [ ] N+1 query optimization
- [ ] Frontend bundle optimization
- [ ] Image optimization
- [ ] Pagination for large lists
- [ ] API response < 200ms
- [ ] Page load < 2s

### 6.4 Error Handling & Monitoring
- [ ] Global error handler middleware
- [ ] Error logging (Winston/Sentry)
- [ ] Error boundary components
- [ ] 404/500 error pages
- [ ] Loading states
- [ ] Empty states
- [ ] Form validation messages

### 6.5 Documentation
- [ ] API documentation
- [ ] Database schema ERD
- [ ] Environment setup guide
- [ ] Local development guide
- [ ] Deployment guide
- [ ] User guides (Admin, Teacher, Parent)

### 6.6 Deployment
- [ ] DigitalOcean droplet/App Platform
- [ ] PostgreSQL database configuration
- [ ] Environment variables
- [ ] Domain and SSL
- [ ] CI/CD pipeline
- [ ] Database backup strategy
- [ ] Monitoring setup
- [ ] Rollback plan

### 6.7 User Acceptance Testing
- [ ] Test school with sample data
- [ ] Client testing of admin features
- [ ] Teacher testing
- [ ] Parent testing (hybrid booking focus)
- [ ] Feedback collection
- [ ] Critical bug fixes

### 6.8 Launch Checklist
- [ ] Stripe live mode
- [ ] SendGrid production
- [ ] Google Drive production credentials
- [ ] Final security review
- [ ] Final performance test
- [ ] Database backup
- [ ] Production deployment
- [ ] 24-hour monitoring
- [ ] Support contact method

---

## Progress Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0: Initialization | Complete | 100% |
| Phase 1: Foundation (Week 1-2) | Complete | 100% |
| Phase 2: Public Onboarding (Week 3) | Not Started | 0% |
| Phase 3: Core Operations (Week 4-6) | Not Started | 0% |
| Phase 4: Parent Experience (Week 7-8) | Not Started | 0% |
| Phase 5: Financial & Resources (Week 9-11) | Not Started | 0% |
| Phase 6: Polish & Launch (Week 12) | Not Started | 0% |

**Overall: 17% Complete (2/12 weeks)**

---

## Critical Success Factors

### Week 5 Checkpoint: Hybrid Booking Must Work
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

## Deferred to Phase 2 (Post-MVP)

- [ ] Monthly subscription payments
- [ ] WhatsApp/SMS notifications
- [ ] Google Calendar sync
- [ ] Xero accounting integration
- [ ] Events management system
- [ ] Blog/Newsletter CMS
- [ ] Teacher training module
- [ ] Advanced CRM features
- [ ] Student progress tracking
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

---

## Notes

**Parallel Development Opportunities:**
- Meet & Greet (Phase 2) can be built while School Config (Phase 3) is in progress
- Teacher Dashboard (Phase 3) and Parent Dashboard (Phase 4) can be parallelized
- Email templates can be created alongside feature development

**High-Risk Areas (allocate extra time):**
- Hybrid lesson booking logic (most complex feature)
- Google Drive two-way sync (external API dependencies)
- Stripe payment webhooks (must be bulletproof)
- Multi-tenancy security (cannot fail)
