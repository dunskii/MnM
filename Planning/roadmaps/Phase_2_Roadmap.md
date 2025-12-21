# Music 'n Me - Phase 2 Roadmap

## Overview

Phase 2 features to be implemented **after** the 12-week MVP launch. These features were requested during the client meeting but deferred to allow focus on core functionality.

**Estimated Timeline**: 12-16 weeks (split into sub-phases)

---

## Phase 2A: Payment & Billing Enhancements (4 weeks)

### Monthly Subscription Payments

**Problem**: Currently only term-based billing. Some parents prefer monthly payments.

**Solution**: Allow parents to choose payment plan when enrolling.

#### Features

1. **Payment Plan Selection**
   - Admin sets pricing models per school:
     - Term-based: Pay full term upfront
     - Monthly: Split term cost into equal monthly payments
     - Custom: Admin can create custom payment schedules
   - Parent selects preferred plan during enrollment or invoice generation

2. **Automatic Payment Plans**
   - Stripe subscription integration
   - Auto-charge monthly on specific date
   - Email notification before each charge
   - Parent can update payment method
   - Cancel/pause subscription

3. **Pricing Configuration**
   - Admin sets monthly pricing:
     - Option 1: Term price ÷ number of months
     - Option 2: Flat monthly fee (may differ from term pricing)
   - Different pricing for different lesson types

4. **Mid-Year Changes**
   - Parent can switch from term to monthly (pro-rated)
   - Admin approval required
   - Calculate remaining balance and convert to subscription

#### Technical Implementation

- Add `PaymentPlan` model
- Extend `Invoice` model with `paymentPlanId`
- Stripe subscription webhooks:
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
- Background job to create monthly invoices

**Estimated Effort**: 3 weeks

---

## Phase 2B: Teacher Training Module (3 weeks)

### Separate Training System for Aspiring Teachers

**Problem**: School offers teacher training but no system to manage it.

**Solution**: Dedicated module for trainee registration and training session management.

#### Features

1. **Trainee Registration**
   - Public registration form (similar to meet & greet)
   - Capture: name, email, phone, instrument expertise, teaching experience
   - Admin approves trainees
   - Separate user role: `TRAINEE`

2. **Training Course Catalog**
   - Admin creates training courses:
     - Course name (e.g., "Beginner Piano Teaching Methods")
     - Duration (number of sessions)
     - Pricing
     - Prerequisites (optional)
   - Course descriptions and curriculum

3. **Training Session Scheduling**
   - Similar to regular lessons but for trainees
   - Admin creates training sessions
   - Trainees enroll in courses
   - Attendance tracking

4. **Certification Tracking**
   - Mark course as completed
   - Generate certificate (PDF)
   - Track trainee progress

5. **Trainee Dashboard**
   - View enrolled courses
   - Upcoming training sessions
   - Course materials
   - Certificates earned

#### Technical Implementation

- Add `Trainee` model (similar to `Student`)
- Add `TrainingCourse` model
- Add `TrainingSession` model (similar to `Lesson`)
- Reuse enrollment and attendance logic
- Certificate generation (PDF library: `pdfkit` or `react-pdf`)

**Estimated Effort**: 3 weeks

---

## Phase 2C: Events Management (3 weeks)

### Manage School Events (Concerts, Recitals, etc.)

**Problem**: Events like end-of-year concerts aren't tracked in the system.

**Solution**: Event management system with RSVP and ticketing.

#### Features

1. **Event Creation**
   - Admin creates events:
     - Name (e.g., "End of Year Concert")
     - Date/time
     - Location (can be different from school locations)
     - Event type: CONCERT, RECITAL, WORKSHOP, SOCIAL
   - Event replaces regular class (optional)
   - Event is standalone (doesn't affect classes)

2. **Event Invitations**
   - Invite specific classes, students, or entire school
   - Parents receive invitation email
   - RSVP system (attending, not attending, maybe)

3. **Capacity Management**
   - Set max attendees
   - Track RSVPs
   - Waitlist if full

4. **Ticketing (Optional)**
   - Free events or paid
   - Ticket pricing (per person or per family)
   - Payment via Stripe
   - Generate ticket confirmation

5. **Event Calendar**
   - Events appear on school calendar
   - Parents see events in their dashboard
   - Email reminders (1 week before, 1 day before)

6. **Post-Event**
   - Mark attendance
   - Upload photos/videos (optional)
   - Share recap via newsletter

#### Technical Implementation

- Add `Event` model
- Add `EventInvitation` model
- Add `EventRSVP` model
- Extend calendar view to show events
- Email notifications for invitations and reminders
- Optional: File upload for event photos

**Estimated Effort**: 3 weeks

---

## Phase 2D: Blog & Newsletter (4 weeks)

### Content Management System for Communication

**Problem**: School wants to improve communication with parents/community via newsletters and public blog.

**Solution**: CMS for creating, scheduling, and publishing newsletters and blog posts.

#### Features

1. **Content Creation**
   - Rich text editor (WYSIWYG: TinyMCE or Quill)
   - Add images, videos, links
   - Section-based content:
     - Age/class-focused sections (e.g., "Piano News", "Guitar Updates")
     - Whole-school sections (e.g., "Upcoming Events", "Announcements")

2. **Content Visibility**
   - Public: Visible on public blog (website)
   - Portal-only: Visible to logged-in parents/students
   - Draft: Not published yet

3. **Newsletter Workflow**
   - **Draft**: Create and edit
   - **Schedule**: Set publish date/time
   - **Publish**: Automatically publishes at scheduled time
   - **Archive**: Past newsletters

4. **Email Distribution**
   - Send newsletter to all parents via email
   - Segment by class, age group, instrument
   - Track open rates and click rates

5. **Public Blog**
   - Public-facing blog page (visible to anyone)
   - Only "Public" sections displayed
   - SEO-friendly URLs
   - Social media sharing buttons

6. **Newsletter Archive**
   - Parents can view past newsletters in portal
   - Public can view past blog posts

#### Technical Implementation

- Add `Newsletter` model
- Add `NewsletterSection` model
- Rich text editor integration (TinyMCE)
- Email template for newsletters (HTML)
- SendGrid for email distribution
- Public blog routes (SSR or static generation)
- Analytics tracking (optional: Google Analytics)

**Estimated Effort**: 4 weeks

---

## Phase 2E: Advanced CRM Features (3 weeks)

### Enhance CRM for Lead Tracking and Retention

**Problem**: Need better tracking of inquiries, leads, and student retention.

**Solution**: CRM module with lead management, communication history, and analytics.

#### Features

1. **Lead Tracking**
   - Capture inquiries (form submissions, phone calls, walk-ins)
   - Lead status: NEW, CONTACTED, MEET_AND_GREET_SCHEDULED, ENROLLED, LOST
   - Assign leads to admin/teacher for follow-up
   - Lead source tracking (website, referral, social media, etc.)

2. **Communication History**
   - Log all interactions with families:
     - Emails sent/received
     - Phone calls
     - Meet & greets
     - In-person meetings
   - Timeline view of all communications

3. **Tags & Segments**
   - Tag families/students (e.g., "At-risk", "VIP", "Referral source")
   - Create segments for targeted messaging
   - Bulk actions (send email to segment)

4. **Automated Follow-Ups**
   - Trigger-based automation:
     - Lead created → Send welcome email after 24 hours
     - Invoice overdue → Send reminder after 7 days
     - Student absent 3+ times → Flag for retention outreach
   - Customizable automation rules

5. **Retention Analytics**
   - Track student churn rate
   - Identify at-risk students (low attendance, payment issues)
   - Retention dashboard
   - Predict likelihood to churn (basic ML model)

6. **Family Notes**
   - Admin/teacher can add private notes about families
   - Visible only to admin/teachers
   - Useful for tracking preferences, issues, special requests

#### Technical Implementation

- Add `Lead` model
- Add `CommunicationLog` model
- Add `Tag` model (many-to-many with families/students)
- Add `AutomationRule` model
- Background job for automation triggers
- Analytics dashboard (charts: Recharts or Chart.js)

**Estimated Effort**: 3 weeks

---

## ~~Phase 2F: Hybrid Lesson Model~~ → MOVED TO MVP

> **UPDATE (2025-12-21):** The Hybrid Lesson Model has been **moved to MVP Phase 4 (Weeks 7-8)**. It is the core differentiator for Music 'n Me and must be included in the initial launch.
>
> See `Development_Task_List.md` Section 4.3-4.5 for the complete implementation tasks.

### What's Included in MVP:
- Hybrid lesson pattern configuration (group/individual week patterns)
- Parent booking system for individual sessions
- Calendar placeholders for unbooked weeks
- 24-hour booking/cancellation policy
- Booking notifications
- Hybrid-specific invoice calculation

### Advanced Hybrid Features (Still Phase 2):
The following **advanced** hybrid lesson features remain deferred to Phase 2:

1. **Automated Booking Reminders**
   - Smart reminders when individual weeks approach
   - Escalation if slots remain unbooked close to deadline

2. **Waitlist System**
   - Allow parents to join waitlist for fully-booked slots
   - Auto-notification when slot becomes available

3. **Recurring Booking Preferences**
   - Parents can set preferred time slots
   - System auto-suggests slots based on preferences

4. **Analytics & Reporting**
   - Booking completion rates
   - Popular time slots analysis
   - No-show tracking for individual sessions

**Estimated Effort for Advanced Features**: 2 weeks

---

## Phase 2G: Advanced Integrations (4 weeks)

### Google Calendar, Xero, WhatsApp/SMS

#### 1. Google Calendar Sync (Teachers)

**Feature**: Auto-sync lessons to teacher's personal Google Calendar.

**How it works:**
- Teacher connects Google Calendar (OAuth)
- All assigned lessons synced automatically
- Updates when lessons rescheduled
- One-way sync (portal → Google Calendar)

**Effort**: 1 week

#### 2. Xero Accounting Integration

**Feature**: Auto-sync invoices and payments to Xero.

**How it works:**
- Admin connects Xero account (OAuth)
- Invoices created in portal → synced to Xero as invoices
- Payments recorded → synced as payments
- Families synced as Xero contacts

**Effort**: 2 weeks

#### 3. WhatsApp & SMS Notifications

**Feature**: Multi-channel notifications (WhatsApp, SMS, Email).

**How it works:**
- Integrate Twilio API (WhatsApp Business + SMS)
- Smart fallback: Try WhatsApp → fallback to SMS → fallback to Email
- Parent preferences: select preferred channel
- Message types:
  - Lesson reminders (24h before)
  - Lesson changes
  - Payment confirmations
  - Invoice reminders
  - Meet & greet confirmations

**Effort**: 1 week

**Total Effort**: 4 weeks

---

## Phase 2H: Reporting & Analytics (3 weeks)

### Advanced Reporting Dashboard

#### Features

1. **Attendance Reports**
   - Weekly/monthly/term attendance summary
   - Per student, per class, per teacher
   - Identify trends (declining attendance)
   - Export to CSV/PDF

2. **Revenue Reports**
   - Revenue per term
   - Revenue by lesson type
   - Outstanding invoices
   - Payment trends
   - Export to CSV/PDF

3. **Student Progress Tracking**
   - Track skill level progression
   - Exam results (AMEB, Trinity, etc.)
   - Teacher notes over time
   - Parent-facing progress reports

4. **Teacher Performance Metrics**
   - Classes taught
   - Attendance rates
   - Student retention
   - Revenue generated

5. **School-Wide Analytics**
   - Total students over time (growth)
   - Churn rate
   - Instrument popularity
   - Location utilization

**Estimated Effort**: 3 weeks

---

## Phase 2I: Mobile & UX Enhancements (4 weeks)

### Progressive Web App (PWA) & Mobile Optimization

#### Features

1. **Progressive Web App (PWA)**
   - Installable on mobile devices
   - Offline mode (view cached schedule, files)
   - Push notifications (lesson reminders, payments)
   - Fast loading (service workers)

2. **Mobile-First UI Improvements**
   - Optimized touch interactions
   - Swipe gestures (calendar navigation)
   - Bottom navigation (mobile)
   - Simplified forms for mobile

3. **Push Notifications**
   - Browser push notifications (Web Push API)
   - Lesson reminders
   - Payment confirmations
   - New file uploads

4. **Offline Functionality**
   - Cache schedule locally
   - View downloaded files offline
   - Queue actions (sync when online)

**Estimated Effort**: 4 weeks

**Note**: Native mobile apps (iOS/Android) deferred to Phase 3.

---

## Phase 2 Summary

### Total Estimated Timeline: 30 weeks (~7.5 months)

> *Reduced from 32 weeks - basic Hybrid Lesson Model now in MVP*

Can be broken into smaller releases:

**Phase 2.1 (Weeks 1-8)**: Payment Plans + Teacher Training
**Phase 2.2 (Weeks 9-16)**: Events + Blog/Newsletter
**Phase 2.3 (Weeks 17-22)**: CRM + Advanced Hybrid Features (reduced - basic hybrid now in MVP)
**Phase 2.4 (Weeks 23-30)**: Integrations + Reporting + Mobile

> **Timeline reduced by ~2 weeks** since basic Hybrid Lesson Model moved to MVP.

### Priority Recommendations

**High Priority** (Immediate value):
1. Monthly subscription payments
2. WhatsApp/SMS notifications
3. Events management
4. Google Calendar sync

**Medium Priority** (Nice to have):
5. Blog/newsletter
6. CRM enhancements
7. ~~Hybrid lessons~~ → **NOW IN MVP**
8. Reporting dashboard

**Lower Priority** (Can wait):
9. Teacher training module
10. Xero integration
11. PWA/mobile enhancements

> **Note:** Hybrid Lesson Model (basic) is now included in the 12-week MVP.
> Only advanced features (waitlist, recurring preferences, analytics) remain in Phase 2.

---

## Deferred to Phase 3

- Native mobile apps (iOS/Android, React Native)
- Multi-school management portal
- White-label SaaS offering
- API for third-party integrations
- Advanced gamification (student badges, achievements)
- AI-powered scheduling optimization
- Video lessons (recorded or live streaming)
- Parent-teacher messaging (in-app chat)

---

## Cost Implications (Phase 2)

### Additional Monthly Costs

**Twilio** (WhatsApp + SMS):
- WhatsApp: ~$0.005 per message
- SMS: ~$0.08 per message
- Estimated: $80-120/month (for 200 students)

**Xero API**:
- Free (uses existing Xero subscription)

**Google Calendar API**:
- Free

**SendGrid** (higher tier for newsletters):
- Advanced: $89.95/month (1M emails)
- Only if sending frequent newsletters

**Total Additional Cost**: $80-210/month

---

## Next Steps After MVP Launch

1. **Gather User Feedback** (Weeks 13-14)
   - Survey parents, teachers, admin
   - Identify pain points
   - Prioritize Phase 2 features based on feedback

2. **Plan Phase 2.1** (Week 15)
   - Finalize scope and timeline
   - Assign priorities
   - Begin development

3. **Iterative Releases**
   - Release Phase 2 features incrementally
   - Test with real users
   - Gather feedback and iterate

---

**Ready to proceed with MVP, then tackle Phase 2!** 🚀
