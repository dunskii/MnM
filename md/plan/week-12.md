# Week 12 Implementation Plan: Testing, Bug Fixes & Deployment

**Created:** 2025-12-26
**Status:** Ready for Implementation
**Duration:** 5 Days (Final MVP Sprint)

---

## Executive Summary

Week 12 is the final sprint to achieve production-ready MVP status. The project has achieved 92% completion (11/12 weeks) with:
- **27 backend services** with 80+ API endpoints across 16 route files
- **15+ frontend pages** with 50+ components
- **750+ tests** currently passing (345 integration + 176 component + ~230 unit tests)
- **74 database indexes** for performance optimization
- All core features implemented including the hybrid lesson booking system (CORE DIFFERENTIATOR)

---

## Phase 1: End-to-End Testing (Days 1-2)

### 1.1 E2E Testing Infrastructure Setup

| Aspect | Details |
|--------|---------|
| **Agent** | testing-qa-specialist |
| **Priority** | Critical |
| **Dependencies** | None |
| **Risk** | Low - well-documented process |

**Files to Create:**
- `apps/frontend/playwright.config.ts` - Playwright configuration
- `apps/frontend/e2e/setup/global-setup.ts` - Database seeding for E2E
- `apps/frontend/e2e/helpers/auth.ts` - Authentication helpers
- `apps/frontend/e2e/helpers/test-data.ts` - Test data factories

**Commands:**
```bash
cd apps/frontend
npm install -D @playwright/test
npx playwright install
npm run build  # Ensure production build works
```

**Success Criteria:**
- Playwright installed and configured
- Sample E2E test runs against local environment
- Test fixtures for admin, teacher, parent users created

---

### 1.2 Critical User Flow: Meet & Greet

**Test Flow:**
1. Public booking (no auth) → form submission
2. Email verification (token verification)
3. Admin approval (status change)
4. Registration payment (Stripe checkout)
5. Account creation (family, parent, student)

**Files to Create:**
- `apps/frontend/e2e/flows/meet-and-greet.spec.ts`

**Key API Endpoints to Test:**
| Endpoint | Method | File |
|----------|--------|------|
| `/public/meet-and-greet` | POST | `apps/backend/src/routes/meetAndGreet.routes.ts` |
| `/public/verify-email/:token` | GET | `apps/backend/src/routes/meetAndGreet.routes.ts` |
| `/admin/meet-and-greet/:id/approve` | PATCH | `apps/backend/src/routes/meetAndGreet.routes.ts` |
| `/registration/complete` | POST | `apps/backend/src/routes/registration.routes.ts` |
| `/payments/webhook` | POST | `apps/backend/src/routes/payment.routes.ts` |

**Success Criteria:**
- Complete flow from public booking to account creation
- Email verification works
- Stripe webhook properly creates accounts

---

### 1.3 Critical User Flow: Hybrid Lesson Booking (CORE FEATURE)

**Test Flow:**
1. Admin creates hybrid lesson with pattern
2. Admin enrolls students
3. Admin opens bookings
4. Parent views available slots
5. Parent books individual session
6. Calendar displays hybrid placeholders + booked sessions
7. Invoice generates with correct group/individual split

**Files to Create:**
- `apps/frontend/e2e/flows/hybrid-booking.spec.ts`

**Key API Endpoints to Test:**
| Endpoint | Method | File |
|----------|--------|------|
| `/lessons` | POST | `apps/backend/src/routes/lessons.routes.ts` |
| `/lessons/:id/enrollments` | POST | `apps/backend/src/routes/lessons.routes.ts` |
| `/hybrid-bookings/lessons/:id/open-bookings` | PATCH | `apps/backend/src/routes/hybridBooking.routes.ts` |
| `/hybrid-bookings/available-slots` | GET | `apps/backend/src/routes/hybridBooking.routes.ts` |
| `/hybrid-bookings` | POST | `apps/backend/src/routes/hybridBooking.routes.ts` |
| `/calendar/events` | GET | `apps/backend/src/routes/calendar.routes.ts` |
| `/invoices/generate` | POST | `apps/backend/src/routes/invoices.routes.ts` |

**24-Hour Rule Verification:**
- Test booking within 24 hours is rejected
- Test reschedule within 24 hours is rejected
- Test cancellation within 24 hours is rejected

**Success Criteria:**
- Complete hybrid lesson lifecycle works
- 24-hour notice rule enforced
- Calendar correctly shows placeholders during individual weeks
- Invoice correctly splits group/individual pricing

---

### 1.4 Critical User Flow: Standard Lessons

**Test Flow:**
1. Create lesson (Individual/Group/Band)
2. Enroll students
3. Mark attendance
4. Add teacher notes (class + student)
5. Upload resources (Drive sync)

**Files to Create:**
- `apps/frontend/e2e/flows/lesson-management.spec.ts`

**Key Files:**
- Service: `apps/backend/src/services/lesson.service.ts`
- Service: `apps/backend/src/services/attendance.service.ts`
- Service: `apps/backend/src/services/notes.service.ts`
- Service: `apps/backend/src/services/resources.service.ts`

**Success Criteria:**
- All 4 lesson types can be created
- Attendance marking works with batch operations
- Notes completion tracking works
- Resources upload and visibility rules work

---

### 1.5 Critical User Flow: Payment

**Test Flow:**
1. Invoice generation (single + bulk)
2. Stripe checkout session creation
3. Stripe webhook processing
4. Invoice status update
5. Payment history recording

**Files to Create:**
- `apps/frontend/e2e/flows/payment.spec.ts`

**Key Files:**
- Service: `apps/backend/src/services/invoice.service.ts`
- Service: `apps/backend/src/services/stripe.service.ts`
- Routes: `apps/backend/src/routes/invoices.routes.ts`

**Success Criteria:**
- Invoices generate with correct line items
- Stripe checkout creates payment session
- Webhook updates invoice status correctly
- Manual payments can be recorded

---

### 1.6 Critical User Flow: Google Drive Sync

**Test Flow:**
1. Admin connects Google Drive (OAuth)
2. Admin links folder to lesson
3. Teacher uploads file (syncs to Drive)
4. Visibility rules applied
5. Student/Parent downloads file

**Files to Create:**
- `apps/frontend/e2e/flows/google-drive.spec.ts`

**Key Files:**
- Service: `apps/backend/src/services/googleDrive.service.ts`
- Service: `apps/backend/src/services/googleDriveSync.service.ts`
- Service: `apps/backend/src/services/googleDriveFile.service.ts`
- Job: `apps/backend/src/jobs/googleDriveSync.job.ts`

**Success Criteria:**
- OAuth flow completes successfully
- Files sync bidirectionally
- Visibility rules filter correctly by role
- Sync status badge shows accurate status

---

### 1.7 Cross-Browser Testing

**Agent:** testing-qa-specialist

**Browsers to Test:**
- Chrome (Windows, macOS)
- Firefox (Windows, macOS)
- Safari (macOS)
- Edge (Windows)

**Key Pages to Test:**
- Login page
- Admin dashboard
- Calendar page (react-big-calendar)
- Hybrid booking page
- Google Drive file browser
- Invoice payment page (Stripe elements)

**Files:**
- `apps/frontend/playwright.config.ts` - Add browser configurations

**Success Criteria:**
- All pages render correctly in all browsers
- Drag-and-drop calendar works in all browsers
- File upload works in all browsers
- Stripe checkout works in all browsers

---

### 1.8 Mobile/Responsive Testing

**Agent:** testing-qa-specialist

**Devices to Test:**
- iOS Safari (iPhone 14 Pro Max viewport)
- Chrome Android (Pixel 7 viewport)
- Tablet (iPad Pro viewport)

**Key Pages for Mobile:**
- Parent dashboard
- Hybrid booking (slot selection)
- Invoice payment
- Notification preferences

**Success Criteria:**
- All pages usable on mobile devices
- Touch interactions work (slot picker, calendar)
- Stripe checkout mobile-optimized

---

## Phase 2: Security Audit (Days 3-4)

### 2.1 Multi-Tenancy Verification (CRITICAL)

**Agent:** security-auditor

**Task: Audit every database query for schoolId filtering**

**Files to Audit:**

| Service File | Line Count | Priority |
|-------------|------------|----------|
| `apps/backend/src/services/lesson.service.ts` | 955 | Critical |
| `apps/backend/src/services/hybridBooking.service.ts` | 1214 | Critical |
| `apps/backend/src/services/invoice.service.ts` | 1108 | Critical |
| `apps/backend/src/services/googleDrive.service.ts` | ~450 | High |
| `apps/backend/src/services/googleDriveSync.service.ts` | ~350 | High |
| `apps/backend/src/services/googleDriveFile.service.ts` | ~350 | High |
| `apps/backend/src/services/dashboard.service.ts` | ~400 | High |
| `apps/backend/src/services/notification.service.ts` | ~300 | Medium |
| `apps/backend/src/services/attendance.service.ts` | 352 | Medium |
| `apps/backend/src/services/notes.service.ts` | 512 | Medium |
| `apps/backend/src/services/resources.service.ts` | 387 | Medium |

**Existing Multi-Tenancy Test:**
- File: `apps/backend/tests/integration/multitenancy.test.ts`
- Action: Expand coverage

**Commands:**
```bash
# Run multi-tenancy tests
cd apps/backend
npm test -- multitenancy.test.ts --verbose
```

**Success Criteria:**
- 100% of queries include schoolId filtering
- Cross-school data access tests pass
- No data leakage between schools

**Risk Assessment:** HIGH - Multi-tenancy failure is a showstopper

---

### 2.2 Role-Based Access Control Audit

**Agent:** security-auditor

**Roles to Verify:**
| Role | Permissions |
|------|------------|
| ADMIN | Full access to school data |
| TEACHER | View all lessons/students, edit own lessons, mark any attendance |
| PARENT | Only own children's data, can book hybrid sessions |
| STUDENT | Read-only access to own data |

**Files to Audit:**
- Middleware: `apps/backend/src/middleware/authorize.ts`
- Middleware: `apps/backend/src/middleware/authenticate.ts`
- All route files in `apps/backend/src/routes/`

**Test Cases:**
- Teacher cannot delete lessons (403)
- Parent cannot view other families (404/403)
- Student cannot mark attendance (403)
- Admin can do everything

**Success Criteria:**
- All 16 route files have correct authorization
- Role escalation attacks prevented
- Sensitive operations require correct role

---

### 2.3 Input Validation Audit

**Agent:** security-auditor

**Zod Schema Files to Verify:**
| File | Purpose |
|------|---------|
| `apps/backend/src/validators/lesson.validators.ts` | Lesson input validation |
| `apps/backend/src/validators/hybridBooking.validators.ts` | Booking input validation |
| `apps/backend/src/validators/invoice.validators.ts` | Invoice input validation |
| `apps/backend/src/validators/googleDrive.validators.ts` | Drive input validation |
| `apps/backend/src/validators/notification.validators.ts` | Notification input validation |
| `apps/backend/src/validators/dashboard.validators.ts` | Dashboard input validation |
| `apps/backend/src/validators/meetAndGreet.validators.ts` | M&G input validation |

**Validation Patterns to Check:**
- Email format validation
- Phone number format (Australian)
- Date range validation
- File type/size limits
- Numeric range limits

**Success Criteria:**
- All user inputs validated before database operations
- Zod schemas reject malformed data
- Error messages don't leak internal details

---

### 2.4 SQL Injection Prevention

**Agent:** security-auditor

**Verification:**
- All queries use Prisma ORM (parameterized queries)
- No raw SQL queries without parameterization
- Search inputs sanitized

**Commands:**
```bash
# Search for raw queries
grep -r "\$queryRaw" apps/backend/src/
grep -r "\$executeRaw" apps/backend/src/
```

**Success Criteria:**
- No unparameterized SQL queries
- Prisma ORM used consistently

---

### 2.5 XSS Prevention

**Agent:** security-auditor

**React Protection:**
- React automatically escapes JSX content
- Verify no `dangerouslySetInnerHTML` usage
- Check user-generated content rendering

**Commands:**
```bash
# Search for dangerous patterns
grep -r "dangerouslySetInnerHTML" apps/frontend/src/
```

**Success Criteria:**
- No unescaped user content rendered
- Content Security Policy headers set via Helmet

---

### 2.6 CSRF Protection Verification

**Agent:** security-auditor

**Current Implementation:**
- File: `apps/backend/src/middleware/csrf.ts`
- Applied to: All state-changing routes (POST, PATCH, DELETE)

**Files to Verify:**
- Routes: `apps/backend/src/routes/index.ts`

**Exceptions Verified:**
- `/auth/login` - Uses credentials, no CSRF needed
- `/payments/webhook` - Verified by Stripe signature
- `/public/meet-and-greet` - Public endpoint

**Success Criteria:**
- All state-changing endpoints protected
- CSRF token properly validated
- Exceptions documented and justified

---

### 2.7 File Upload Security

**Agent:** security-auditor

**Files to Audit:**
- Middleware: Uses multer for file uploads
- Service: `apps/backend/src/services/resources.service.ts`
- Service: `apps/backend/src/services/googleDriveFile.service.ts`

**Checks:**
- File type validation (MIME type + extension)
- File size limits (25MB max)
- Filename sanitization
- Storage path validation

**Success Criteria:**
- Only allowed file types accepted
- Size limits enforced
- No path traversal vulnerabilities

---

### 2.8 JWT Token Security

**Agent:** security-auditor

**Files to Audit:**
- Utility: `apps/backend/src/utils/jwt.ts`
- Service: `apps/backend/src/services/token.service.ts`
- Service: `apps/backend/src/services/auth.service.ts`

**Checks:**
- Token expiration (access: 15 min, refresh: 7 days)
- Token signature verification
- Refresh token rotation
- Token blacklisting on logout

**Success Criteria:**
- Tokens properly signed and verified
- Expired tokens rejected
- Refresh tokens stored securely

---

### 2.9 Password Security Verification

**Agent:** security-auditor

**Files to Verify:**
- Service: `apps/backend/src/services/password.service.ts`
- Utility: `apps/backend/src/utils/password.ts`
- Utility: `apps/backend/src/utils/commonPasswords.ts`
- Utility: `apps/backend/src/utils/hibp.ts`

**Features Implemented:**
- Bcrypt with 12 rounds
- Password strength requirements (8+ chars, mixed case, number, special)
- Common password detection (10,000+ database)
- Personal information detection
- HIBP breach checking (k-anonymity)
- Password history (last 5)
- Rate limiting (5 failures per 15 min)

**Commands:**
```bash
# Run password tests
cd apps/backend
npm test -- password.test.ts --verbose
```

**Success Criteria:**
- All password security features working
- HIBP integration operational
- Rate limiting prevents brute force

---

### 2.10 Stripe Webhook Security

**Agent:** security-auditor

**Files to Verify:**
- Routes: `apps/backend/src/routes/payment.routes.ts`
- Service: `apps/backend/src/services/stripe.service.ts`

**Checks:**
- Webhook signature verification
- Idempotency handling
- Event type validation
- Error handling

**Success Criteria:**
- Webhooks verified with Stripe signature
- Duplicate events handled correctly
- Invalid webhooks rejected

---

### 2.11 Google Drive Token Encryption

**Agent:** security-auditor

**Files to Verify:**
- Utility: `apps/backend/src/utils/crypto.ts`
- Model: GoogleDriveAuth in `apps/backend/prisma/schema.prisma`

**Implementation:**
- AES-256-GCM encryption for access/refresh tokens
- Encryption key from environment variable
- Automatic token refresh with 5-min buffer

**Success Criteria:**
- Tokens encrypted at rest
- Decryption only when needed
- Token refresh works automatically

---

## Phase 3: Performance Testing (Days 3-4)

### 3.1 Load Testing Setup

**Agent:** devops-automator

**Tool:** Artillery or k6

**Commands:**
```bash
npm install -D artillery
# Or
npm install -D k6
```

**Files to Create:**
- `apps/backend/tests/load/artillery.yml` - Load test configuration
- `apps/backend/tests/load/scenarios/` - Test scenarios

**Scenarios:**
1. 200 concurrent users viewing dashboard
2. 50 concurrent parents booking hybrid sessions
3. 20 concurrent file uploads
4. Calendar with 500+ events

**Success Criteria:**
- API response time < 200ms under load
- No memory leaks
- Database connections handled properly

---

### 3.2 Database Query Optimization

**Agent:** devops-automator

**Current Index Count:** 74 composite indexes

**Files to Verify:**
- Schema: `apps/backend/prisma/schema.prisma`

**Commands:**
```bash
# Check slow queries in development
cd apps/backend
npx prisma studio

# In production, use EXPLAIN ANALYZE
psql -d music_n_me -c "EXPLAIN ANALYZE SELECT * FROM ..."
```

**Queries to Optimize:**
- Dashboard statistics (parallel queries already implemented)
- Calendar events with 500+ records
- Invoice generation with line items
- Attendance rate calculations

**Success Criteria:**
- No N+1 queries
- All frequent queries indexed
- Complex queries use efficient JOINs

---

### 3.3 Frontend Bundle Analysis

**Agent:** devops-automator

**Commands:**
```bash
cd apps/frontend
npm run build
npx vite-bundle-analyzer
```

**Optimization Targets:**
- Tree shake unused MUI components
- Lazy load heavy pages (Calendar, Google Drive)
- Code splitting for routes

**Current Heavy Dependencies:**
- react-big-calendar
- @mui/material
- react-window (virtualization)

**Success Criteria:**
- Initial bundle < 200KB gzipped
- Lighthouse performance score > 90
- Page load time < 2s

---

### 3.4 API Response Time Benchmarks

**Agent:** devops-automator

**Target:** < 200ms for all endpoints

**Critical Endpoints to Benchmark:**
| Endpoint | Target | Current |
|----------|--------|---------|
| GET /dashboard/admin/stats | < 200ms | TBD |
| GET /calendar/events | < 200ms | TBD |
| GET /hybrid-bookings/available-slots | < 150ms | TBD |
| POST /invoices/generate | < 500ms | TBD |
| GET /google-drive/files | < 200ms | TBD |

**Success Criteria:**
- All endpoints meet target response times
- No timeouts under normal load

---

### 3.5 Google Drive Sync Performance

**Agent:** devops-automator

**Current:** 15-minute sync window via Bull queue

**File:** `apps/backend/src/jobs/googleDriveSync.job.ts`

**Checks:**
- Sync completes within 15-minute window
- Rate limiting handled correctly
- Error retry logic works
- Large folder handling (100+ files)

**Success Criteria:**
- Sync completes reliably
- No API quota exceeded errors
- Manual sync trigger works

---

## Phase 4: Production Deployment (Day 5)

### 4.1 DigitalOcean Database Setup

**Agent:** devops-automator

**Service:** Managed PostgreSQL 15.x

**Configuration:**
- Region: Sydney (syd1)
- Size: 2GB RAM minimum
- Connection pooling enabled
- SSL required

**Commands:**
```bash
# Apply migrations to production
cd apps/backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

**Success Criteria:**
- Database created and accessible
- Migrations applied successfully
- Connection from App Platform works

---

### 4.2 Backend Deployment

**Agent:** devops-automator

**Platform:** DigitalOcean App Platform

**Environment Variables:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
SENDGRID_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
ENCRYPTION_KEY=...
REDIS_URL=redis://...
NODE_ENV=production
FRONTEND_URL=https://app.musicnme.com.au
```

**Health Check:**
- Endpoint: `/health`
- File: `apps/backend/src/index.ts`
- Returns queue health status

**Commands:**
```bash
# Build for production
cd apps/backend
npm run build

# Test production build locally
NODE_ENV=production npm start
```

**Success Criteria:**
- Backend deploys without errors
- Health check returns healthy
- All API endpoints accessible

---

### 4.3 Frontend Deployment

**Agent:** devops-automator

**Platform:** DigitalOcean App Platform (static site)

**Build Command:**
```bash
cd apps/frontend
npm run build
```

**Environment Variables:**
```
VITE_API_URL=https://api.musicnme.com.au/api/v1
```

**Output Directory:** `apps/frontend/dist`

**Success Criteria:**
- Frontend builds successfully
- Static files served correctly
- API calls work in production

---

### 4.4 Redis Setup

**Agent:** devops-automator

**Service:** DigitalOcean Managed Redis or self-hosted

**Usage:**
- Bull queues (Google Drive sync)
- Email notification queue
- Rate limiting (optional)

**File:** `apps/backend/src/config/queue.ts`

**Commands:**
```bash
# Verify Redis connection
redis-cli -u $REDIS_URL ping
```

**Success Criteria:**
- Redis accessible from backend
- Queue jobs processing
- Health check shows queue connected

---

### 4.5 DigitalOcean Spaces Setup

**Agent:** devops-automator

**Purpose:** File storage for portal uploads

**Configuration:**
- Bucket: mnm-files
- CDN enabled for fast downloads
- CORS configured for frontend

**Success Criteria:**
- Files can be uploaded
- Files accessible via CDN
- Proper access controls

---

### 4.6 Domain Configuration

**Agent:** devops-automator

**Domains:**
- `app.musicnme.com.au` - Frontend
- `api.musicnme.com.au` - Backend

**SSL:**
- Let's Encrypt via DigitalOcean (automatic)

**DNS Records:**
```
app.musicnme.com.au  A     -> App Platform IP
api.musicnme.com.au  A     -> App Platform IP
```

**Success Criteria:**
- SSL certificates issued
- HTTPS working on both domains
- No mixed content warnings

---

### 4.7 Monitoring & Logging

**Agent:** devops-automator

**Current Logging:**
- File: Uses `apps/backend/src/utils/logger.ts`
- Morgan for HTTP request logging
- Winston or similar for application logs

**DigitalOcean Monitoring:**
- CPU/Memory usage
- Error rates
- Response times

**External Monitoring (Optional):**
- Sentry for error tracking
- UptimeRobot for uptime monitoring

**Success Criteria:**
- Logs accessible in DigitalOcean console
- Alerts configured for errors
- Performance metrics visible

---

## Phase 5: Client Training & Launch

### 5.1 Admin Training Session

**Duration:** 2-3 hours

**Topics:**
1. School setup (terms, locations, rooms)
2. User management (teachers, parents, students)
3. Lesson creation (all 4 types)
4. Hybrid lesson configuration
5. Invoice generation
6. Meet & Greet management
7. Google Drive folder linking
8. Dashboard overview

**Materials to Prepare:**
- Admin user guide document
- Video walkthrough (optional)
- Quick reference card

---

### 5.2 Data Entry Plan

**Students:** ~200 to enter manually

**Process:**
1. Create families first
2. Add parents with contacts
3. Add students to families
4. Bulk import if CSV tool created

**Term Configuration:**
- Create 4 terms for 2025
- Set start/end dates
- Mark current term as active

**Lesson Setup:**
- Create all current term lessons
- Enroll students in lessons
- Configure hybrid patterns

---

### 5.3 Google Drive Setup

**Tasks:**
1. Connect school's Google Drive account
2. Create folder structure:
   - `/Music n Me/Classes/` - Class folders
   - `/Music n Me/Students/` - Student folders
3. Link folders to lessons/students in portal
4. Test sync functionality

---

### 5.4 Soft Launch Checklist

- [ ] All admin users created
- [ ] All teachers invited
- [ ] Test lessons created
- [ ] Test invoice generated
- [ ] Test payment completed
- [ ] Email delivery verified
- [ ] Google Drive sync working
- [ ] Mobile access tested

---

## Risk Assessment Summary

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Multi-tenancy data leak | Critical | Low | Comprehensive audit + tests |
| Stripe webhook failures | High | Low | Idempotency + logging |
| Google Drive API quota | Medium | Medium | Rate limiting + caching |
| Performance under load | Medium | Medium | Load testing + optimization |
| Browser compatibility | Medium | Low | Cross-browser E2E tests |
| Deployment failures | High | Low | Health checks + rollback plan |

---

## Task Breakdown by Agent

### testing-qa-specialist
- [ ] Set up Playwright E2E testing infrastructure
- [ ] Create Meet & Greet flow E2E test
- [ ] Create Hybrid Booking flow E2E test (CRITICAL)
- [ ] Create Lesson Management flow E2E test
- [ ] Create Payment flow E2E test
- [ ] Create Google Drive flow E2E test
- [ ] Execute cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Execute mobile/responsive testing (iOS, Android, Tablet)
- [ ] Document and report all bugs found

### security-auditor
- [ ] Audit multi-tenancy schoolId filtering (ALL services)
- [ ] Verify role-based access control (all 16 route files)
- [ ] Audit input validation (Zod schemas)
- [ ] Verify SQL injection prevention
- [ ] Check XSS prevention
- [ ] Verify CSRF protection
- [ ] Audit file upload security
- [ ] Verify JWT token security
- [ ] Verify password security implementation
- [ ] Audit Stripe webhook security
- [ ] Verify Google Drive token encryption

### devops-automator
- [ ] Set up load testing with Artillery/k6
- [ ] Run 200 concurrent user simulation
- [ ] Analyze database query performance
- [ ] Analyze frontend bundle size
- [ ] Benchmark API response times
- [ ] Test Google Drive sync performance
- [ ] Set up DigitalOcean Managed PostgreSQL
- [ ] Deploy backend to App Platform
- [ ] Deploy frontend to App Platform
- [ ] Set up Redis for queues
- [ ] Configure DigitalOcean Spaces
- [ ] Configure domain and SSL
- [ ] Set up monitoring and logging

### full-stack-developer
- [ ] Fix bugs found during E2E testing
- [ ] Fix bugs found during security audit
- [ ] Optimize slow database queries
- [ ] Optimize frontend bundle if needed
- [ ] Handle any deployment issues

---

## Commands Reference

### Testing Commands
```bash
# Backend unit tests
cd apps/backend && npm test

# Backend integration tests
cd apps/backend && npm test -- --testPathPattern=integration

# Frontend component tests
cd apps/frontend && npm test

# E2E tests (after setup)
cd apps/frontend && npx playwright test

# Multi-tenancy tests
cd apps/backend && npm test -- multitenancy.test.ts --verbose

# Password security tests
cd apps/backend && npm test -- password.test.ts --verbose
```

### Build Commands
```bash
# Backend build
cd apps/backend && npm run build

# Frontend build
cd apps/frontend && npm run build

# Frontend bundle analysis
cd apps/frontend && npm run build && npx vite-bundle-analyzer
```

### Database Commands
```bash
# Apply migrations
cd apps/backend && npx prisma migrate deploy

# Generate client
cd apps/backend && npx prisma generate

# Open studio
cd apps/backend && npx prisma studio
```

### Security Audit Commands
```bash
# Check for raw SQL queries
grep -r "\$queryRaw" apps/backend/src/
grep -r "\$executeRaw" apps/backend/src/

# Check for XSS vulnerabilities
grep -r "dangerouslySetInnerHTML" apps/frontend/src/
```

---

## Critical Files Reference

| File | Purpose | Priority |
|------|---------|----------|
| `apps/backend/src/index.ts` | Server entry + health check | Critical |
| `apps/backend/prisma/schema.prisma` | Database schema (25+ models) | Critical |
| `apps/backend/tests/integration/multitenancy.test.ts` | Multi-tenancy tests | Critical |
| `apps/backend/src/services/hybridBooking.service.ts` | Core differentiator (1,214 lines) | Critical |
| `apps/frontend/src/test/utils.tsx` | Test utilities | High |
| `apps/backend/src/services/lesson.service.ts` | Lesson logic (955 lines) | High |
| `apps/backend/src/services/invoice.service.ts` | Billing logic (1,108 lines) | High |
| `apps/backend/src/services/stripe.service.ts` | Payment processing | High |
| `apps/backend/src/services/googleDrive.service.ts` | Drive OAuth | High |

---

## Success Criteria Summary

### Testing (Days 1-2)
- [ ] All 5 critical user flows pass E2E tests
- [ ] Cross-browser compatibility verified
- [ ] Mobile/responsive design verified
- [ ] No blocking bugs remaining

### Security (Days 3-4)
- [ ] 100% multi-tenancy compliance
- [ ] Role-based access verified
- [ ] All input validation working
- [ ] No security vulnerabilities found

### Performance (Days 3-4)
- [ ] API response time < 200ms
- [ ] Page load time < 2s
- [ ] 200 concurrent users supported
- [ ] No performance bottlenecks

### Deployment (Day 5)
- [ ] Production database running
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Domain and SSL configured
- [ ] Monitoring active

### Launch
- [ ] Client training completed
- [ ] Initial data entered
- [ ] Google Drive connected
- [ ] Soft launch successful

---

## Conclusion

Week 12 is the final push to launch Music 'n Me MVP. With 92% of the work complete, this week focuses on:

1. **Validation** - Thorough testing of all critical flows
2. **Security** - Comprehensive audit of multi-tenancy and access control
3. **Performance** - Load testing and optimization
4. **Deployment** - Production infrastructure setup
5. **Launch** - Client training and soft launch

The hybrid lesson booking system (CORE DIFFERENTIATOR) must be thoroughly tested as it's the key feature that sets Music 'n Me apart from competitors.

**Target: Production-ready MVP by end of Day 5**
