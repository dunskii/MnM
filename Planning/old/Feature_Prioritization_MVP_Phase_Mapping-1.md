# Music School Platform - Feature Prioritization & Phase Mapping

This document maps your high-level platform vision to the MVP (Phase 1) and future (Phase 2+) development phases.

---

## Phase 1 MVP (Weeks 1-12): Core Platform Foundation

**Target**: Functional platform for a single music school to manage their hybrid teaching model with payment processing.

### Core Features Included in MVP

#### 1. Multi-Location & Room Management ✅
**Weeks 5-6** | Backend + Frontend

**What's included:**
- Create and manage multiple school locations
- Define rooms/studios within each location
- Assign lessons to specific locations and rooms
- View location/room utilization at a glance
- Teacher can see their assigned rooms

**User Impact:**
- Admins: "I can manage my main studio and downtown branch separately"
- Teachers: "I know exactly which room each lesson is in"

---

#### 2. Flexible Lesson Types ✅
**Weeks 5-6** | Backend + Frontend

**What's included:**
- Create individual 1-on-1 lessons
- Create group classes (specify max students)
- Create hybrid lessons (core differentiator!)
- Create band rehearsals and ensembles
- Recurring lessons with flexible schedules

**User Impact:**
- Schools: "I can finally run my hybrid model - group classes with 1-on-1 booking weeks"
- Students: "I understand when I have group classes vs. when I need to book 1-on-1"
- Teachers: "Clear visibility into all lesson types I'm teaching"

---

#### 3. Hybrid Lesson Configuration ✅
**Weeks 7-8** | Backend + Frontend

**The Core Differentiator:**

**What's included:**
- Define hybrid lesson cycles (e.g., 8-week cycle)
- Mark specific weeks as 1-on-1 bookable (e.g., weeks 4 and 8)
- System automatically manages which weeks are group vs. individual
- Parents notified when their child needs to book 1-on-1 session
- Students can see upcoming 1-on-1 booking periods

**Example Flow:**
```
Week 1-3: Group class with 4 students (Tuesday 3pm)
Week 4: AUTO-TRIGGER: Parents notified - "Book your 1-on-1 session this week"
        System shows available 1-on-1 slots from teacher
        Students enroll in individual 1-on-1 sessions
Week 5-7: Group class resumes with same 4 students
Week 8: AUTO-TRIGGER: 1-on-1 booking period again
```

**How it works in code:**
- `HybridLessonConfig` stores cycle info (e.g., cycleLength=8, oneOnOneWeeks=[4,8])
- System calculates: given today's date, what week of the cycle are we in?
- If current week is in oneOnOneWeeks array, trigger 1-on-1 booking notification
- Auto-create available 1-on-1 lesson slots for that week

---

#### 4. Student Roster Management ✅
**Weeks 5-6** | Backend + Frontend

**What's included:**
- Register new students with parent/guardian info
- Track student details: instrument, skill level, age
- View complete roster by lesson or school-wide
- Manage student profiles (update info, remove students)
- Track student enrollment status

**User Impact:**
- Admins: "Complete view of all students and their enrollment status"
- Teachers: "Know my students' instruments and skill levels"
- Parents: "Student profile is set up correctly"

---

#### 5. Enrollment Management ✅
**Weeks 5-6** | Backend + Frontend

**What's included:**
- Administrators assign students to appropriate group lessons (based on skill level, instrument, age)
- Auto-enroll for individual sessions during hybrid booking periods
- View enrollment status (active, completed, dropped)
- Bulk assign students to group classes
- Unenroll or remove students from lessons
- Parents can only book 1-on-1 sessions during hybrid booking weeks

**User Impact:**
- Admins: "Assign students to right group level - bulk operations supported"
- Parents: "Clear schedule showing where my child is placed"
- Schools: "Maintain pedagogical control over group composition"
- Teachers: "Know who's enrolled before each lesson"

---

#### 6. Attendance Tracking ✅
**Weeks 7-8** | Backend + Frontend

**What's included:**
- Mark attendance for each student per lesson
- Add notes about attendance (absence reason, notes)
- View attendance reports by student or lesson
- Attendance history for parents/students to see

**User Impact:**
- Teachers: "Quick way to mark attendance during/after lesson"
- Parents: "See if my child attended last week's class"
- Schools: "Attendance data for compliance and reports"

---

#### 7. Resource & File Sharing ✅
**Weeks 9-10** | Backend + Frontend

**What's included:**
- Teachers upload music scores, backing tracks, metronome clicks, recordings
- Schedule file release (e.g., release materials Monday morning)
- Organize by lesson or make available to all students
- Students download their lesson materials
- Track what resources each student has accessed

**Resource Types:**
- 🎵 Music scores (PDF)
- 🎧 Backing tracks (MP3)
- ⏱️ Metronome click tracks
- 🎹 Example recordings (Teacher plays the piece)
- 📝 Practice guides and lesson notes

**User Impact:**
- Teachers: "Upload all materials in one place - students see them at the right time"
- Students: "Never lose a backing track - it's always in my lesson folder"
- Parents: "Understand what my child is learning and practicing"

**MVP Scope:**
- Basic upload and download
- Store files in AWS S3 or DigitalOcean Spaces
- Scheduled release (if not ready at launch, do immediate release first)

---

#### 6. Family Accounts ✅ **CRITICAL FEATURE**
**Weeks 5-6** | Backend + Frontend

**What's included:**
- One parent account manages multiple children
- Consolidated view of all children's lessons and schedules
- One login instead of multiple accounts
- Linked payment/billing for entire family
- Switch between children with easy selector
- Privacy settings per child (optional - Phase 2 enhancement)
- Family name/group identification

**Why This is Critical:**
- Common scenario: Family has 2-3 kids taking lessons
- Without this: Parents manage multiple logins (frustration)
- With this: One dashboard showing all children's activities
- Foundational for family billing in Phase 2

**Database Implementation:**
- `FamilyGroup` model (already in schema)
- User links to FamilyGroup via `familyGroupId`
- Parent account links to multiple Student accounts
- Queries filter enrollments/lessons by family

**User Impact:**
- Parents: "See Emma's Piano lesson AND Liam's Violin lesson in one account"
- Schools: "Easier to invoice families as units"
- Students: "Can see they're part of a family group"

**Example Workflow:**
```
Parent Login with: sarah@family.com
↓
Dashboard shows:
  "My Family: Smith Family (3 members)"
  
  📚 Emma's Schedule
  └─ Piano Basics - Thu 3pm
  └─ 1-on-1 - Mon 2pm (next week)
  
  🎻 Liam's Schedule
  └─ Violin Beginner - Wed 4pm
  
  🎺 Grace's Schedule
  └─ Trumpet Intermediate - Fri 5pm
  
  [View Family Billing]
  [Family Settings]
```

---

#### 7. Email & SMS Notifications ✅ **CRITICAL FEATURE**
**Weeks 9-10** | Backend + Frontend

**What's included:**
- Email notifications via SendGrid or AWS SES
- SMS notifications via Twilio
- Configurable notification preferences per parent
- Automated notification triggers for all events
- Notification templates with school branding
- Notification history/logs

**Notification Types Triggered:**

**Lesson-Related:**
- 📧 Lesson scheduled (admin assigns student to group)
- 📧 Lesson rescheduled (drag-and-drop moved a lesson)
- 📧 Lesson cancelled (with reason)
- 📱 Lesson reminder (1 day before)
- 📱 1-on-1 booking period open (hybrid cycle trigger)

**Enrollment-Related:**
- 📧 Student enrolled in group class
- 📧 Student unenrolled (with reason)
- 📧 1-on-1 slot booked (confirmation)

**Payment-Related:**
- 📧 Invoice created (with payment link)
- 📧 Payment received (receipt)
- 📱 Payment reminder (3 days before due)
- 📧 Payment failed (retry link)

**Attendance-Related:**
- 📧 Attendance report (weekly/monthly)
- 📱 Absence notification (if configured)

**Progression-Related:**
- 📧 Student earned award/badge (celebration)
- 📧 Exam request approved/rejected

**Why This is Critical:**
- Parents MUST be notified of schedule changes
- Payment reminders reduce late payments
- Communication keeps parents engaged
- 1-on-1 booking period notifications drive action
- Current pain point: Manual emails for every change

**Technology:**
- Backend: SendGrid for email, Twilio for SMS
- Templates: Handlebars for dynamic content
- Queue: Bull/Redis for async sending (don't block requests)
- Preferences: User can opt in/out of notification types

**User Impact:**
- Parents: "Never miss a lesson change or payment due"
- Teachers: "Automated confirmation emails"
- Schools: "Professional communication, less manual work"

**Example Notifications:**

```
📧 EMAIL - Lesson Rescheduled
From: School <noreply@school.com>
Subject: Emma's Piano Lesson Moved - New Time Thursday 3pm

Hi Sarah,

Emma's Piano Basics lesson has been rescheduled:

OLD: Tuesday, October 24 at 4:00 PM - 5:00 PM
NEW: Thursday, October 26 at 3:00 PM - 4:00 PM

Location: Main Studio, Room A
Teacher: Maria Garcia

Emma's updated schedule: [View]
Questions? Reply to this email or contact: info@school.com

---

📱 SMS - 1-on-1 Booking Opens
From: School
"Hi Sarah! Piano Basics 1-on-1 booking week is open. Book Emma's 
session here: [link]. Available times: Mon 2pm, Tue 4pm, Wed 3:30pm"

---

📧 EMAIL - Invoice & Payment
From: School <billing@school.com>
Subject: Invoice #INV-2024-1015 - Piano Lessons

Hi Smith Family,

Your invoice for October lessons is ready:

Piano Basics (Emma): $80
Violin Beginner (Liam): $80
Total: $160

Due: October 31, 2024
[Pay Now - Secure Payment Link]

View full invoice: [link]
```

---

#### 8. Drag-and-Drop Lesson Scheduling ✅ **CRITICAL FEATURE**
**Weeks 7-8** | Backend + Frontend

**What's included:**
- Visual calendar interface showing all lessons (by location, teacher, room)
- Drag-and-drop to reschedule lessons to new date/time
- Real-time conflict detection (prevent double-booking)
- Automatic conflict alerts ("This room is occupied at that time")
- Teacher availability validation (prevent scheduling outside their hours)
- Bulk reschedule support (reschedule entire week of recurring classes)
- Undo/revert changes
- Notification to affected students/parents when lessons move

**Why This is Critical:**
- Current system pain point - manual scheduling is tedious
- Reduces booking errors and double-bookings
- Instant visibility across all locations and rooms
- Teachers and admins can quickly resolve scheduling conflicts

**Implementation:**
- Use React Big Calendar or FullCalendar.io library
- Backend validates all moves before saving
- Real-time availability calculations
- Recurring lesson rules enforcement

**User Impact:**
- Admins: "Reschedule lessons in seconds instead of spreadsheet updates"
- Teachers: "See all my lessons across locations - easy to adjust"
- Parents: "Automatic notification if their lesson moves"

---

#### 9. Hybrid Lesson Configuration ✅
**Weeks 9-10** | Backend + Frontend

**The Core Differentiator:**

**What's included:**
- Define hybrid lesson cycles (e.g., 8-week cycle)
- Mark specific weeks as 1-on-1 bookable (e.g., weeks 4 and 8)
- System automatically manages which weeks are group vs. individual
- Parents notified when their child needs to book 1-on-1 session
- Students can see upcoming 1-on-1 booking periods

**Example Flow:**
```
Week 1-3: Group class with 4 students (Tuesday 3pm)
Week 4: AUTO-TRIGGER: Parents notified - "Book your 1-on-1 session this week"
        System shows available 1-on-1 slots from teacher
        Students enroll in individual 1-on-1 sessions
Week 5-7: Group class resumes with same 4 students
Week 8: AUTO-TRIGGER: 1-on-1 booking period again
```

---

#### 10. Attendance Tracking ✅
**Weeks 9-10** | Backend + Frontend

**What's included:**
- Mark attendance for each student per lesson
- Add notes about attendance (absence reason, notes)
- View attendance reports by student or lesson
- Attendance history for parents/students to see

**User Impact:**
- Teachers: "Quick way to mark attendance during/after lesson"
- Parents: "See if my child attended last week's class"
- Schools: "Attendance data for compliance and reports"

---

#### 11. Resource & File Sharing ✅
**Weeks 11-12** | Backend + Frontend

**What's included:**
- Teachers upload music scores, backing tracks, metronome clicks, recordings
- Organize by lesson or make available to all students
- Students download their lesson materials
- Track what resources each student has accessed
- **MVP scope**: Immediate release (scheduled release in Phase 2)

**Resource Types:**
- 🎵 Music scores (PDF)
- 🎧 Backing tracks (MP3)
- ⏱️ Metronome click tracks
- 🎹 Example recordings (Teacher plays the piece)
- 📝 Practice guides and lesson notes

**User Impact:**
- Teachers: "Upload all materials - students can access them immediately"
- Students: "All my materials in one place"
- Parents: "Understand what my child is learning"

**MVP Scope:**
- Basic upload and download
- Store files in AWS S3 or DigitalOcean Spaces
- Immediate release (no scheduling complexity in Week 1)

---

#### 12. Payment Processing ✅
**Weeks 11-12** | Backend + Frontend

**What's included:**
- Stripe integration for credit card payments
- Payment processing for individual and group lessons
- Multiple payment methods support (credit card, bank transfer, cash tracking)
- Invoice generation
- Payout calculations for teachers (if using Stripe Connect)
- Payment status tracking (pending, completed, refunded)

**User Impact:**
- Schools: "Collect payments online automatically"
- Parents: "Pay online securely"
- Teachers: "Track what payments are pending"

**MVP Scope:**
- Stripe integration (test mode)
- Basic invoice generation
- Payment history view
- Teacher payout tracking (Phase 2: actual Stripe Connect integration)

---

#### 13. Basic Dashboards & Reporting ✅
**Weeks 11-12** | Frontend

**What's included:**
- Admin dashboard: Overview of all lessons, students, enrollments
- Teacher dashboard: My lessons, my students, my schedule
- Parent dashboard: My child's schedule, progress, upcoming lessons
- Student dashboard: My lessons, my materials
- Basic reports: attendance, enrollment, lesson summary

**User Impact:**
- Everyone: "Quick overview of what's happening"
- Schools: "Simple reporting for business decisions"

---

## Phase 2 (Months 5-8): Enhanced Platform

**Target**: Multi-school support, advanced features, custom branding, automation.

### Features Deferred to Phase 2

#### 1. Progression & Awards System 🔄
**Why Phase 2:** Core features work without, add motivational layer after MVP

- Teachers manually create progression badges/awards
- Students see their awards on dashboard
- Parents notified of student achievements
- Visual representation (emoji or badges)
- Examples: "Completed Section 1", "Grade 1 Achievement"

---

#### 2. Scheduled File Release 🔄
**Why Phase 2:** MVP uses immediate release, scheduling is refinement

- Upload file but schedule for release on specific date/time
- Auto-release at scheduled time
- Students notified when materials available
- Progressive curriculum unlocking

---

#### 3. Privacy & Consent Settings 🔄
**Why Phase 2:** Nice-to-have refinement of family accounts

- Per-child privacy settings
- Parental consent for social media posting
- Data export compliance (GDPR)
- Photo/video recording consent

---

#### 4. Advanced Family Billing 🔄
**Why Phase 2:** Single family billing works in MVP, advanced scenarios later

- Sibling discounts (e.g., 10% off for second child)
- Custom invoice grouping
- Autopay for families
- Family credit system

---

#### 5. Custom School Branding 🔄
**Why Phase 2:** Polish feature, not core to MVP function

- Custom domain setup (school.mymusics.app)
- Logo upload and display
- Brand color customization
- Custom landing page (pre-signup marketing)
- Whitelabel capability

---

#### 6. Exam Request Management 🔄
**Why Phase 2:** Students won't need this in first weeks

- Students request music examinations (ABRSM, RCM, etc.)
- Teachers approve/reject requests
- Track examination dates and results
- Exam registry/tracking

---

#### 7. Advanced Progression Tracking 🔄
**Why Phase 2:** Can manually handle in MVP

- Structured progression pathways by instrument
- Auto-unlock resources based on progression
- Milestone celebrations
- Parent notifications on progression

---

#### 8. Enhanced Analytics & Reporting 🔄
**Why Phase 2:** MVPs usually just report basic data

- Student engagement metrics
- Practice time analytics
- Revenue reporting and forecasting
- Teacher performance metrics
- Resource utilization reports

---

#### 9. Stripe Connect for Teacher Payouts 🔄
**Why Phase 2:** MVP can track, but actual Stripe Connect integration later

- Phase 1: Track what teachers should earn
- Phase 2: Teachers connect Stripe account, receive automatic payouts
- This requires additional compliance/documentation

---

#### 10. Scheduled & Advanced Notifications 🔄
**Why Phase 2:** MVP has basic notifications, Phase 2 adds advanced features

- Notification scheduling (send at specific time)
- Bulk messaging to groups
- SMS to multiple recipients
- Notification statistics/delivery tracking
- Two-way SMS (parents reply to confirm attendance)

---

#### 11. Mobile App 🔄
**Why Future:** Web app first, then mobile

- Native iOS app (React Native)
- Native Android app (React Native)
- Offline capability
- Push notifications

---

## MVP Timeline Overview

```
PHASE 1: 14-16 WEEKS

Week 1-2: Foundation & Setup
├── ✅ Project infrastructure
├── ✅ Prisma schema & database
└── ✅ GitHub repository setup

Week 3-4: Authentication & User Management
├── ✅ User registration/login
├── ✅ Role-based authorization
├── ✅ Password security
└── ✅ Email verification

Week 5-6: Core Lesson Management & Family Accounts
├── ✅ Lesson types (individual, group, hybrid)
├── ✅ Multi-location & room management
├── ✅ Enrollment management
├── ✅ Teacher availability
├── ✅ Student roster
└── ✅ Family account structure & linking

Week 7-8: Scheduling & Calendar
├── ✅ Calendar interface (React Big Calendar or similar)
├── ✅ Drag-and-drop lesson rescheduling
├── ✅ Conflict detection & prevention
├── ✅ Recurring lesson scheduling
└── ✅ Teacher availability enforcement

Week 9-10: Notifications & Hybrid Lessons
├── ✅ Email service integration (SendGrid/AWS SES)
├── ✅ SMS service integration (Twilio)
├── ✅ Notification templates
├── ✅ Hybrid lesson configuration & logic
├── ✅ 1-on-1 booking period automation
└── ✅ Attendance tracking

Week 11-12: Payments & File Sharing
├── ✅ Stripe integration & payment processing
├── ✅ Payment notifications (invoice, receipt, reminders)
├── ✅ Resource/file uploading (immediate release)
├── ✅ Family billing support
└── ✅ Payout calculations

Week 13-14: Dashboards & Polish
├── ✅ Dashboard implementations (admin, teacher, parent, student)
├── ✅ Material 3 UI components
├── ✅ Family account UI (switch between children)
├── ✅ Basic reporting
└── ✅ Testing & bug fixes

Week 15-16: Final Testing & Refinement
├── ✅ Full system integration testing
├── ✅ User acceptance testing scenarios
├── ✅ Performance optimization
├── ✅ Security audit
└── ✅ Documentation & deployment prep
```

---

## MVP Success Criteria

### For School Administrators
- [ ] Can create multiple locations with rooms
- [ ] Can create and manage both group and individual lessons
- [ ] Can configure hybrid lessons with 1-on-1 booking cycles
- [ ] Can assign students to appropriate group lessons based on skill level and instrument
- [ ] Can drag-and-drop reschedule lessons to new dates/times
- [ ] Drag-and-drop prevents double-booking and conflicts
- [ ] Can bulk reschedule recurring lessons
- [ ] Can see all enrollments and attendance in one place
- [ ] Can view financial reports (payments received, pending)
- [ ] Can manage teachers and their availability

### For Teachers
- [ ] Can see all their assigned lessons across locations in calendar view
- [ ] Can drag-and-drop reschedule their lessons
- [ ] Can see which students have booked required 1-on-1 sessions in hybrid classes
- [ ] Can mark attendance for their students
- [ ] Can upload materials (scores, recordings, etc.)
- [ ] Can track which students have accessed materials
- [ ] Can see payment status for their lessons
- [ ] Can access student roster with instrument/level info

### For Parents
- [ ] Can create account and link children to family group
- [ ] Can view all children's lesson schedules in one dashboard
- [ ] Can switch between children easily
- [ ] Can view their child's assigned schedule (assigned by admin)
- [ ] Can view attendance records
- [ ] Can access lesson materials and resources
- [ ] Can make payments online
- [ ] Can track their child's progression/awards
- [ ] Receive notifications when 1-on-1 booking period opens
- [ ] Can book 1-on-1 sessions during designated hybrid booking weeks
- [ ] Receive email/SMS notifications for:
  - Lesson scheduling and changes
  - Payment invoices and reminders
  - 1-on-1 booking period openings
  - Attendance reports
  - Award achievements

### For Students
- [ ] Can see their lesson schedule
- [ ] Can download lesson materials
- [ ] Can see their progression awards
- [ ] Can track attendance

### Technical Criteria
- [ ] All data encrypted in transit (HTTPS)
- [ ] Authentication working (JWT tokens)
- [ ] Payment processing tested (Stripe test mode)
- [ ] Basic API documentation complete
- [ ] Database migrations working
- [ ] Application running on DigitalOcean (Phase 2)
- [ ] GitHub repository with clean commit history

---

## Post-MVP Enhancement Ideas (Phase 2+)

### Short-term (Months 4-6)
- Family accounts
- Custom branding
- Exam request management
- Email notification system
- Stripe Connect for teacher payouts

### Medium-term (Months 7-12)
- Mobile web responsive design
- Drag-and-drop scheduling
- Advanced analytics
- Integration with Google Calendar
- Multi-school support (true multi-tenancy)

### Long-term (Year 2+)
- Native mobile apps (iOS/Android)
- AI practice feedback
- Video lesson recording
- Integration with music theory apps
- Social features (student showcase)
- Instrument-specific learning paths
- Integration with examination boards

---

## Development Priorities During MVP

### Must Have (Core to MVP)
1. Family accounts (parents manage multiple children)
2. Email & SMS notifications (critical communication)
3. Drag-and-drop lesson scheduling (current pain point)
4. Hybrid lesson configuration & logic
5. Multi-location/room management
6. Payment processing

### Should Have (Important, but refinements)
1. Attendance tracking
2. Progression awards
3. Basic reporting
4. Bulk operations UI refinement
5. Scheduled file release

### Nice to Have (Polish)
1. Advanced analytics
2. Landing page
3. Mobile responsive perfection
4. Notification scheduling (Phase 2)

---

## Hybrid Model Implementation Deep Dive

Since this is your core differentiator, here's how it works in MVP:

### Example: Maria's Music School

**Configuration:**
- Group Class: "Piano Basics" - Thursdays 3pm, max 4 students
- Hybrid Cycle: 8 weeks long
- 1-on-1 Booking Weeks: [4, 8] (weeks 4 and 8 are individual)
- Cycle Start: September 1st

**What Happens:**

**Before Class Starts (Admin Setup):**
- Maria (Admin) reviews students and assigns to "Piano Basics" group
- Selected: Emma, Liam, Sofia, Jackson (all beginner level)
- Parents notified: "Your child is enrolled in Piano Basics, Thursdays 3pm"

**September (Weeks 1-3):**
- Group class meets: All 4 assigned students attend Thursday 3pm
- Admin dashboard shows all 4 students enrolled
- Parents cannot change this - it's assigned

**Late September (Week 4 starts):**
- System detects: "Week 4 of cycle = 1-on-1 week"
- Group class is paused for this week
- Automatically sends notification to parents: "Book your 1-on-1 session this week with Maria"
- Available 1-on-1 slots appear for that week
- **Now parents have choice:** They can book Emma in any available 30-min slot
- Example: Emma's parent books Monday 3pm, Liam's parent books Tuesday 4pm, etc.
- If parent doesn't book, child simply doesn't have a lesson that week (or admin can override)

**October (Weeks 5-7):**
- Group class resumes: Back to all 4 assigned students Thursday 3pm
- 1-on-1 sessions are marked complete, attendance recorded
- Parents cannot move children between groups

**Mid-October (Week 8 starts):**
- Cycle repeats: "Week 8 = 1-on-1 week again"
- Group class pauses, parents see available 1-on-1 slots
- They book again

**Implementation in Code:**

```typescript
// Calculate current cycle week
function getCurrentCycleWeek(lessonStartDate: Date, hybridConfig: HybridLessonConfig): number {
  const weeksElapsed = Math.floor((Date.now() - lessonStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return (weeksElapsed % hybridConfig.cycleLength) + 1;
}

// Check if this is a 1-on-1 booking week
function isOneOnOneWeek(lessonStartDate: Date, hybridConfig: HybridLessonConfig): boolean {
  const currentWeek = getCurrentCycleWeek(lessonStartDate, hybridConfig);
  return hybridConfig.oneOnOneWeeks.includes(currentWeek);
}

// Auto-trigger 1-on-1 booking period
// Called by scheduled job or when parent views schedule
function checkAndTriggerOneOnOneBooking(lesson: Lesson) {
  if (!lesson.isHybrid) return;
  
  const hybridConfig = lesson.hybridConfig;
  if (isOneOnOneWeek(lesson.startTime, hybridConfig)) {
    // Create available 1-on-1 slots for this week
    // Notify all enrolled parents
    // Update lesson display to show "1-on-1 Booking Week"
  }
}
```

---

## Resource Sharing Implementation (MVP)

### File Upload Flow:

1. Teacher clicks "Upload Material"
2. Selects file (PDF, MP3, etc.) and lesson
3. Optional: Set release date (or released immediately for MVP)
4. File uploaded to S3/DigitalOcean Spaces
5. URL stored in database
6. System auto-grants access to all students in that lesson

### Student Download Flow:

1. Student logs in, goes to "My Materials"
2. Sees all files released to them
3. Can download directly
4. Access logged for analytics

### MVP Simplification:

- Immediate release (no scheduling in Week 1)
- Add scheduling in Week 10 if time allows
- Basic file types: PDF, MP3
- No video streaming initially

---

## Key Decisions to Make Now

Before starting development:

1. **Authentication Method**: Self-signup with email verification, or admin creates accounts?
2. **File Storage**: AWS S3, DigitalOcean Spaces, or local storage initially?
3. **Payment Testing**: Use Stripe test keys, or connect to live account immediately?
4. **Multi-tenancy**: Build from day 1 for multiple schools, or add in Phase 2?
5. **Notifications**: Email notifications in MVP, or Phase 2?

---

## Success Looks Like

At end of Week 12:

✅ First music school using the platform daily  
✅ Teachers uploading materials  
✅ Students enrolling in both group and hybrid lessons  
✅ Parents viewing progress and making payments  
✅ Hybrid lesson cycles working automatically  
✅ All core data captured in database  
✅ System is reliable and usable  

This is your foundation for Phase 2 and beyond. 🚀
