# Music 'n Me - Subagent Deployment Plan (12 Weeks)

## Overview

This document outlines exactly which specialized subagents to use during each week of the Music 'n Me MVP development. Each agent is purpose-built for specific tasks and should be used proactively to ensure high-quality, efficient development.

## Available Specialized Agents

Located in `~/.claude/agents/`:

1. **backend-architect** - API design, database schemas, multi-tenancy, business logic
2. **frontend-developer** - React components, Material-UI, state management, UX implementation
3. **ui-designer** - Interface design, component systems, visual hierarchy, user flows
4. **ux-researcher** - Usability testing, user flow validation, friction point identification
5. **api-tester** - Endpoint validation, integration testing, security testing
6. **devops-automator** - CI/CD, infrastructure, third-party integrations, deployment

## General Usage Guidelines

### When to Use Multiple Agents

For complex features, use agents in sequence or parallel:

**Sequential Example (Hybrid Booking):**
1. **ui-designer** → Design the booking interface
2. **ux-researcher** → Validate the design with user scenarios
3. **backend-architect** → Design the booking API
4. **frontend-developer** → Implement the UI
5. **api-tester** → Test all booking edge cases

**Parallel Example (Week 12 Testing):**
- **api-tester** + **ux-researcher** run simultaneously
- **devops-automator** prepares deployment while testing continues

### Agent Activation Phrases

To invoke a specific agent, use phrases like:
- "Use the **backend-architect** to design the Prisma schema for hybrid lessons"
- "Have the **ui-designer** create the booking interface layout"
- "Get the **api-tester** to validate all multi-tenancy security"

---

## Week 1: Foundation & Authentication

### Goal
Working development environment + user authentication

### Primary Agents

**backend-architect** (Heavy Use)
- Design Prisma schema (User, School, Role models)
- Plan multi-tenancy architecture (schoolId filtering strategy)
- Design JWT authentication flow
- Create API structure (middleware, error handling)

**devops-automator** (Setup Phase)
- Initialize GitHub repository
- Set up DigitalOcean PostgreSQL
- Configure development environment
- Create `.env` structure for dev/staging/prod

**api-tester** (Light Use)
- Create initial test structure
- Write authentication tests
- Validate JWT token generation/validation

### Key Deliverables
- ✅ Prisma schema with User, School, Role, multi-tenancy
- ✅ JWT authentication working
- ✅ Development environment documented
- ✅ Initial test suite

---

## Week 2: School Setup & User Management

### Goal
Complete school configuration and user management

### Primary Agents

**backend-architect** (Heavy Use)
- Design schema for Terms, Locations, Rooms, Instruments
- Create CRUD APIs for school configuration
- Implement user management endpoints
- Ensure ALL queries filter by schoolId

**frontend-developer** (Medium Use)
- Set up React + Vite + Material-UI
- Create login/register pages
- Build admin dashboard shell
- Implement protected routes

**ui-designer** (Light Use)
- Define component library structure
- Create theme with Music 'n Me brand colors
- Design admin dashboard layout

**api-tester** (Medium Use)
- Test multi-tenancy isolation (CRITICAL)
- Verify schoolId filtering on all endpoints
- Test RBAC (Admin, Teacher, Parent, Student)

### Key Deliverables
- ✅ School configuration APIs with multi-tenancy
- ✅ Frontend with Material-UI theme
- ✅ Multi-tenancy security tested
- ✅ Teacher can view ALL school data

---

## Week 3: Meet & Greet System

### Goal
Pre-registration booking system for prospective parents

### Primary Agents

**ui-designer** (Heavy Use)
- Design public booking page (mobile-first)
- Create form layout (parent info, child info, time selection)
- Design confirmation page
- Admin dashboard for managing bookings

**frontend-developer** (Heavy Use)
- Implement public booking form (no auth)
- Create calendar picker for slot selection
- Build admin meet & greet management UI
- Email confirmation display

**backend-architect** (Medium Use)
- Design MeetAndGreet schema
- Create public booking API (no auth required)
- Implement email verification
- Admin approval workflow API

**devops-automator** (Light Use)
- Integrate SendGrid for email confirmations
- Set up email templates

**ux-researcher** (Light Use)
- Validate booking flow is simple for first-time users
- Test mobile experience (parents book on-the-go)

### Key Deliverables
- ✅ Public meet & greet booking (no account needed)
- ✅ Email confirmations working
- ✅ Admin can manage bookings
- ✅ Pre-populate registration from meet & greet data

---

## Week 4: Lesson Management & Enrollment

### Goal
Create and manage lessons (including hybrid), enroll students

### Primary Agents

**backend-architect** (CRITICAL - Heavy Use)
- Design complex Lesson schema including HYBRID type
- Model hybrid week patterns (group vs individual weeks per term)
- Create lesson CRUD APIs
- Implement enrollment workflow
- **CRITICAL**: Plan hybrid lesson data structure carefully

**frontend-developer** (Medium Use)
- Build lesson creation form (all types: Individual, Group, Band, Hybrid)
- Create enrollment interface
- Display lesson rosters
- Teacher view of all school lessons

**ui-designer** (Medium Use)
- Design hybrid lesson creation wizard
- Layout for week pattern configuration
- Enrollment interface design

**api-tester** (Medium Use)
- Test lesson creation for all types
- Verify hybrid lesson configuration
- Test enrollment logic
- Validate teacher full-school access

### Key Deliverables
- ✅ All lesson types including HYBRID
- ✅ Hybrid lesson week pattern configuration
- ✅ Student enrollment working
- ✅ Teachers can view ALL lessons

---

## Week 5: Calendar & Hybrid Booking System ⭐ CRITICAL

### Goal
Visual calendar + hybrid lesson booking system (CORE FEATURE)

### Primary Agents (ALL HANDS ON DECK)

**ui-designer** (CRITICAL - Heavy Use)
- Design parent booking interface (mobile-first!)
- Create slot selection UI with clear visual states
- Design calendar with hybrid placeholders
- Reschedule flow with 24h warning

**ux-researcher** (CRITICAL - Heavy Use)
- Test parent booking flow extensively
- Validate mobile experience (most critical)
- Measure task completion time (target: under 3 minutes)
- Identify any confusion points
- **Must validate before implementation proceeds**

**backend-architect** (CRITICAL - Heavy Use)
- Design parent booking API
- Implement conflict detection (no double-booking)
- Build 24-hour reschedule rule
- Create calendar placeholder generation logic
- Admin availability management API

**frontend-developer** (CRITICAL - Heavy Use)
- Implement parent booking interface
- Integrate react-big-calendar
- Build availability slot display
- Create booking confirmation flow
- Show hybrid placeholders on calendar

**api-tester** (CRITICAL - Heavy Use)
- Test booking conflict scenarios
- Verify 24h reschedule enforcement
- Test concurrent booking (race conditions)
- Validate calendar placeholder logic

**devops-automator** (Light Use)
- Ensure database can handle concurrent bookings
- Set up monitoring for booking completion rate

### Testing Scenarios (ux-researcher + api-tester)

**User Testing:**
- 5 parents book individual sessions on mobile
- Measure completion time and ease
- Check for confusion points

**API Testing:**
- Simulate 20 parents booking simultaneously
- Test double-booking prevention
- Verify 24h reschedule rule works

### Key Deliverables
- ✅ Parents can book individual sessions (mobile-friendly)
- ✅ Parents can reschedule with 24h notice
- ✅ Admin can open/close booking periods
- ✅ Calendar shows placeholders + booked sessions
- ✅ Conflict detection prevents double-booking
- ✅ **USER VALIDATED** (usability test passed)

---

## Week 6: Attendance & Family Accounts

### Goal
Mark attendance, create family accounts

### Primary Agents

**backend-architect** (Medium Use)
- Design Attendance schema
- Create attendance marking API
- Implement family account structure
- Family schedule aggregation logic

**frontend-developer** (Heavy Use)
- Build teacher attendance interface
- Create family account creation flow
- Display combined family schedule
- Parent dashboard with all children

**ui-designer** (Medium Use)
- Design attendance marking UI (quick and easy)
- Family dashboard layout
- Combined schedule view

**api-tester** (Medium Use)
- Test attendance marking
- Verify teachers can mark attendance for ANY lesson
- Test family schedule aggregation

### Key Deliverables
- ✅ Teachers mark attendance for any lesson
- ✅ Family accounts created
- ✅ Combined family schedule view
- ✅ Teacher dashboard with full school access

---

## Week 7: Payments & Hybrid Invoicing

### Goal
Stripe integration + term-based billing with hybrid pricing logic

### Primary Agents

**devops-automator** (CRITICAL - Heavy Use)
- Stripe integration and webhook setup
- Verify webhook signatures (security)
- Test payment flows end-to-end
- Handle Stripe webhook retries

**backend-architect** (CRITICAL - Heavy Use)
- Design Invoice schema
- **CRITICAL**: Implement hybrid lesson billing logic
  - Count group weeks vs individual weeks
  - Apply correct pricing for each
  - Split into separate line items
- Stripe payment intent creation
- Manual payment recording

**frontend-developer** (Medium Use)
- Build payment page (Stripe integration)
- Display invoices clearly
- Show payment history
- Admin invoice management UI

**api-tester** (Heavy Use)
- Test hybrid invoice calculation (multiple scenarios)
- Verify Stripe webhook handling
- Test manual payment recording
- Validate invoice accuracy

### Testing Scenarios

**Hybrid Invoice Test:**
- Lesson: 7 group weeks @ $35, 3 individual @ $50
- Expected invoice:
  - Line 1: Group lessons × 7 = $245
  - Line 2: Individual lessons × 3 = $150
  - Total: $395

### Key Deliverables
- ✅ Stripe payment integration working
- ✅ **Hybrid lessons billed correctly**
- ✅ Parents can pay online
- ✅ Admin can create term invoices
- ✅ Manual payment recording

---

## Week 8: Google Drive Integration - Part 1 (Backend)

### Goal
Two-way sync between Google Drive and portal

### Primary Agents

**devops-automator** (CRITICAL - Heavy Use)
- Google Cloud Project setup
- Service account creation and permissions
- OAuth 2.0 configuration
- Drive API authentication
- Set up Bull queue for sync jobs (every 15 minutes)

**backend-architect** (Heavy Use)
- Design File and FolderMapping schemas
- Implement sync service (Drive ↔ Portal)
- Handle file upload/download
- Implement conflict resolution (Drive is source of truth)
- File visibility rules (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)

**api-tester** (Medium Use)
- Test file upload to Drive
- Verify sync job runs correctly
- Test file download from Drive
- Validate visibility rules

### Key Deliverables
- ✅ Google Drive API connected
- ✅ Service can browse/search Drive folders
- ✅ Sync engine downloads files from Drive
- ✅ Sync engine uploads portal files to Drive
- ✅ Background sync job runs every 15 minutes

---

## Week 9: Google Drive Integration - Part 2 (Frontend)

### Goal
Admin folder mapping UI and file management

### Primary Agents

**ui-designer** (Medium Use)
- Design Drive folder browser
- File upload interface for teachers
- Student/parent file access UI

**frontend-developer** (Heavy Use)
- Build Google Drive folder selection UI
- Implement file upload (teacher → Drive + portal)
- Create file management interface
- Student/parent file download UI

**backend-architect** (Light Use)
- API endpoints for folder browsing
- File metadata API

**api-tester** (Medium Use)
- Test folder mapping
- Verify file uploads sync to Drive
- Test student file access (visibility rules)

### Key Deliverables
- ✅ Admin can link Google Drive folders to classes
- ✅ Teachers upload files (syncs automatically)
- ✅ Students download files
- ✅ Parents view files based on visibility

---

## Week 10: Advanced Scheduling & Notifications

### Goal
Drag-and-drop rescheduling + email notifications

### Primary Agents

**frontend-developer** (Heavy Use)
- Implement drag-and-drop calendar
- Real-time conflict checking
- Hybrid lesson reschedule logic (admin drags group lesson, parent reschedules individual)
- Confirmation dialogs

**devops-automator** (Heavy Use)
- SendGrid integration for notifications
- Bull queue for email sending
- Email templates (hybrid booking opened, reminders, etc.)
- Notification queue monitoring

**backend-architect** (Medium Use)
- API for rescheduling lessons
- Notification trigger logic
- User notification preferences

**ui-designer** (Light Use)
- Design drag-and-drop interactions
- Conflict warning visuals
- Email template design

**api-tester** (Medium Use)
- Test reschedule logic
- Verify notifications sent correctly
- Test hybrid booking email triggers

### Key Email Templates
- Meet & greet confirmation
- Meet & greet reminder (24h before)
- **Hybrid booking opened** (CRITICAL)
- **Hybrid booking reminder** (parents who haven't booked)
- Individual session booked/rescheduled confirmation
- Payment received
- Invoice created

### Key Deliverables
- ✅ Drag-and-drop reschedule working
- ✅ Hybrid lesson rescheduling correct
- ✅ Email notifications sent for key events
- ✅ Hybrid booking emails working
- ✅ Notification preferences

---

## Week 11: Polish, Dashboards & Reports

### Goal
Production-ready UI and admin insights

### Primary Agents

**ui-designer** (Heavy Use)
- Polish all interfaces
- Ensure responsive design (mobile-first)
- Add loading states and error handling
- Accessibility improvements (ARIA, keyboard nav)

**frontend-developer** (Heavy Use)
- Implement dashboards (Admin, Teacher, Parent)
- Add statistics widgets
- Create activity feeds
- Mobile responsiveness fixes

**ux-researcher** (Medium Use)
- Comprehensive usability testing
- Validate all key workflows
- Test mobile experience
- Gather feedback for improvements

**backend-architect** (Light Use)
- Dashboard data APIs
- Statistics calculations
- Activity feed queries

### Dashboards to Build

**Admin:**
- Total students, lessons this week, attendance rate
- Pending payments, upcoming meet & greets
- **Hybrid booking completion rate**
- Google Drive sync status

**Teacher:**
- This week's lessons (all school)
- Attendance summary
- Recently uploaded files
- Pending meet & greets assigned to them

**Parent:**
- Children's upcoming lessons
- Outstanding invoices
- Recently shared files
- Quick payment button

### Key Deliverables
- ✅ All three dashboards functional
- ✅ Mobile-responsive design
- ✅ Accessibility standards met
- ✅ Loading states and error handling

---

## Week 12: Testing, Bug Fixes & Deployment

### Goal
Production-ready MVP deployed to DigitalOcean

### Primary Agents (ALL ACTIVE)

**api-tester** (CRITICAL - Heavy Use)
- End-to-end test all critical flows
- Security audit (multi-tenancy isolation)
- Performance testing (200 concurrent users)
- Cross-browser testing

**ux-researcher** (CRITICAL - Heavy Use)
- Final usability testing on all key flows
- Mobile testing (iOS Safari, Chrome Android)
- Validate hybrid booking flow one final time
- Create training materials for Music 'n Me team

**devops-automator** (CRITICAL - Heavy Use)
- Production deployment to DigitalOcean
- Configure all environment variables
- Set up database backups
- Configure custom domain
- Set up monitoring and alerts
- Final smoke testing

**backend-architect** (Medium Use)
- Performance optimization
- Query tuning
- Security review

**frontend-developer** (Medium Use)
- Bug fixes from testing
- Performance optimization
- Final polish

**ui-designer** (Light Use)
- Final visual polish
- Ensure brand consistency

### Critical User Flows to Test

1. **Hybrid Lesson Flow** (MOST CRITICAL):
   - Create hybrid lesson
   - Enroll students
   - Admin opens booking
   - Parent books individual sessions (mobile)
   - Calendar shows placeholders + booked sessions
   - Invoice splits group/individual correctly

2. **Meet & Greet Flow**:
   - Public booking (no account)
   - Admin approval
   - Parent registration
   - Student enrollment

3. **Payment Flow**:
   - Create invoice
   - Parent pays via Stripe
   - Payment recorded
   - Stripe webhook handled

4. **File Sharing Flow**:
   - Teacher uploads
   - Syncs to Google Drive
   - Student downloads

### Security Audit Checklist (api-tester)

- [ ] Every endpoint filters by schoolId
- [ ] Cannot access other school's data
- [ ] Role permissions enforced (Admin, Teacher, Parent, Student)
- [ ] SQL injection prevented (Prisma ORM)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Stripe webhooks verified
- [ ] Rate limiting on public endpoints

### Performance Testing (api-tester)

- [ ] Load test: 200 concurrent users
- [ ] Calendar with 200+ lessons loads in < 300ms
- [ ] Booking API responds in < 200ms
- [ ] Database queries optimized
- [ ] Google Drive sync performs well

### Deployment Checklist (devops-automator)

- [ ] PostgreSQL deployed to DigitalOcean Managed Database
- [ ] Backend deployed to App Platform
- [ ] Frontend deployed to App Platform (static site)
- [ ] Environment variables configured
- [ ] DigitalOcean Spaces for file storage
- [ ] Google Drive API credentials configured
- [ ] Redis for job queues
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Database backups automated (daily)
- [ ] Monitoring and alerting set up

### Key Deliverables
- ✅ MVP deployed to production
- ✅ All critical flows tested and working
- ✅ Security audit completed
- ✅ **Hybrid lesson booking validated end-to-end**
- ✅ Music 'n Me team trained
- ✅ Ready for 200 students data entry

---

## Agent Usage Summary

### Most Critical Agents (Use Throughout)

1. **backend-architect** - Weeks 1, 2, 4, 5 (CRITICAL), 7 (CRITICAL), 8
2. **api-tester** - Weeks 2, 4, 5 (CRITICAL), 7, 12 (CRITICAL)
3. **frontend-developer** - Weeks 2, 3, 4, 5 (CRITICAL), 6, 9, 10, 11
4. **ui-designer** - Weeks 2, 3, 4, 5 (CRITICAL), 11
5. **ux-researcher** - Weeks 3, 5 (CRITICAL), 11, 12 (CRITICAL)
6. **devops-automator** - Weeks 1, 3, 7 (CRITICAL), 8 (CRITICAL), 10, 12 (CRITICAL)

### Agent Pairings (Use Together)

**Design + Research:**
- ui-designer + ux-researcher (Week 5 hybrid booking interface)

**Backend + Testing:**
- backend-architect + api-tester (Weeks 2, 5, 7 for critical features)

**DevOps + Backend:**
- devops-automator + backend-architect (Weeks 7, 8 for integrations)

**Full Team (Weeks 5 & 12):**
- All agents coordinate for critical milestones

---

## Success Metrics by Agent

### backend-architect
- Multi-tenancy security: 0 schoolId leaks
- Hybrid booking API handles all edge cases
- Invoice calculation 100% accurate

### frontend-developer
- Hybrid booking interface intuitive (validated by ux-researcher)
- Calendar performant with 200+ lessons
- Mobile experience smooth

### ui-designer
- Parent booking flow takes < 3 minutes
- Brand consistency across all screens
- Accessibility standards met (WCAG AA)

### ux-researcher
- Hybrid booking usability: 90% task completion without help
- User satisfaction: 8+/10
- Mobile experience rated equal or better than desktop

### api-tester
- Test coverage: 80%+ overall, 100% on critical paths
- Security: All multi-tenancy tests pass
- Performance: All benchmarks met

### devops-automator
- Zero-downtime deployments
- All integrations secure and monitored
- Production incidents detected < 1 minute

---

## Emergency Protocols

### Week 5 Fails Validation
If **ux-researcher** finds hybrid booking flow is confusing:

1. **STOP** implementation
2. **ui-designer** + **ux-researcher** redesign
3. Re-test with new design
4. Only proceed when validated

### Week 7 Invoicing Errors
If **api-tester** finds invoice calculation bugs:

1. **backend-architect** reviews logic
2. Add more test cases
3. Verify all scenarios (different week patterns)
4. Re-test thoroughly before proceeding

### Week 12 Security Issues
If **api-tester** finds schoolId leaks:

1. **CRITICAL** - Fix immediately before launch
2. **backend-architect** audits all queries
3. Re-test every endpoint
4. Delay launch if needed

---

## Quick Reference: Which Agent for Which Task?

| Task | Agent | Priority |
|------|-------|----------|
| Design Prisma schema | backend-architect | Critical |
| Create API endpoints | backend-architect | High |
| Multi-tenancy security | backend-architect + api-tester | Critical |
| Build React components | frontend-developer | High |
| Design user interfaces | ui-designer | High |
| Validate usability | ux-researcher | Critical (Week 5, 12) |
| Test API endpoints | api-tester | High |
| Security testing | api-tester | Critical |
| Setup infrastructure | devops-automator | Medium |
| Third-party integrations | devops-automator | High |
| Deployment | devops-automator | Critical (Week 12) |

---

**Remember:** The hybrid lesson booking system is the core value proposition. Allocate maximum resources (all agents) during Week 5. If it's not intuitive for parents on mobile, the entire platform value is diminished.
