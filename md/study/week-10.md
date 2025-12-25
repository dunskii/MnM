# Week 10: Advanced Scheduling & Notifications - Study Document

**Research Date**: 2025-12-25
**Project Status**: 75% complete (9/12 weeks)
**Topic**: Week 10 Implementation Requirements

---

## Overview

Week 10 focuses on two critical features:
1. **Drag-and-Drop Calendar Scheduling** - Enhanced UX for lesson rescheduling
2. **Email Notifications System** - Comprehensive communication via SendGrid

This week builds directly on the existing calendar (Week 5), hybrid booking system (Week 5), and email foundation (Week 3).

---

## Current Status

**Weeks 1-9**: COMPLETE
- React Big Calendar implemented (CalendarPage.tsx)
- Hybrid booking system fully operational
- SendGrid email service infrastructure in place
- Bull queue system configured for background jobs
- Google Drive sync backend complete with Bull queue (Week 8)
- Google Drive frontend complete with 176 tests (Week 9)

---

## Feature Breakdown

### Days 1-2: Drag-and-Drop Scheduling

**Goal**: Enable admins to drag lessons on calendar to new times with real-time validation

#### Technical Requirements

1. **Frontend Dependencies**:
   - `react-big-calendar` already installed (used in CalendarPage)
   - Add drag-and-drop addon: `react-big-calendar` has built-in DnD support via `withDragAndDrop`
   - Implement `onSelectSlot()` and `onEventDrop()` handlers

2. **Backend Validation**:
   - Check teacher availability (no teacher double-booking)
   - Check room availability (no room double-booking)
   - Validate duration doesn't change
   - Prevent moving lessons to past times
   - Handle hybrid lessons specially:
     - Group lesson drag updates placeholder timing
     - Individual session drag triggers parent notification
     - Cannot drag past bookings

3. **Conflict Detection Logic**:
   - Real-time validation during drag
   - Visual feedback (red highlight = conflict)
   - Cancel/confirm dialog before update
   - Rollback on conflict

4. **Hybrid Lesson Special Cases**:
   - **Group lesson reschedule**: Updates all associated individual session placeholders
   - **Individual session reschedule**: Only admin can initiate (parents use booking UI)
   - **Notification**: Send parent email when individual session moved

**Existing Code Reference**:
- `apps/frontend/src/pages/CalendarPage.tsx` - Contains react-big-calendar implementation
- `apps/backend/src/services/lesson.service.ts` - Lesson validation logic
- `apps/backend/src/services/hybridBooking.service.ts` - Hybrid-specific validation

---

### Days 3-4: Email Notifications System

**Goal**: Send transactional emails for key events in the platform

#### Email Templates Needed (9 templates)

| # | Template | Trigger | Priority |
|---|----------|---------|----------|
| 1 | Meet & Greet Confirmation | After booking public slot | High |
| 2 | Meet & Greet Reminder | 24h before meeting | Medium |
| 3 | Lesson Rescheduled | After drag-and-drop reschedule | High |
| 4 | Hybrid Booking Opened | Admin opens booking period | **CRITICAL** |
| 5 | Hybrid Booking Reminder | 48h before deadline (unbooked parents) | High |
| 6 | Individual Session Booked | After parent books session | High |
| 7 | Individual Session Rescheduled | After reschedule | High |
| 8 | Payment Received | Invoice marked paid | Medium |
| 9 | Invoice Created | New term invoice generated | Medium |

#### Implementation Approach

1. **Email Service** (Already exists: `apps/backend/src/services/email.service.ts`):
   - SendGrid integration already implemented
   - Need to add missing templates
   - Reference existing templates: meet-and-greet verification, approval, welcome

2. **Queue System** (Already exists: `apps/backend/src/config/queue.ts`):
   - Bull queue configured for Google Drive sync
   - Create new `emailQueue` for notification jobs
   - Queue prevents blocking lesson operations on email send

3. **Triggers/Events**:
   - Hook into existing service methods to queue email jobs
   - Example: When `hybridBooking.createBooking()` completes → queue confirmation email
   - Use async event emitters for clean architecture

4. **Error Handling**:
   - Retry failed sends with exponential backoff
   - Log failures for admin review
   - Don't crash lesson operations on email failure

**Existing Code Reference**:
- `apps/backend/src/services/email.service.ts` (~450 lines) - Email service with SendGrid
- `apps/backend/src/config/queue.ts` - Bull queue configuration
- `apps/backend/src/jobs/googleDriveSync.job.ts` - Example job processor

---

### Day 5: Notification Preferences

**Goal**: Allow parents to control which notifications they receive

#### Notification Types
- LESSON_REMINDER
- LESSON_RESCHEDULED
- PAYMENT_RECEIVED
- INVOICE_CREATED
- HYBRID_BOOKING_OPENED
- HYBRID_BOOKING_REMINDER
- FILE_UPLOADED
- ATTENDANCE_SUMMARY

#### Implementation
- GET/PATCH endpoints for parent notification preferences
- Default preferences for new users (all enabled)
- Respect preferences when queuing emails
- Settings page in parent dashboard

---

## Database Schema Changes

### New Model: NotificationPreference

```prisma
model NotificationPreference {
  id                           String    @id @default(uuid())
  userId                       String
  schoolId                     String
  emailNotificationsEnabled    Boolean   @default(true)
  notificationTypes            Json      // { "LESSON_REMINDER": true, ... }
  createdAt                    DateTime  @default(now())
  updatedAt                    DateTime  @updatedAt

  user                         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  school                       School    @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@unique([userId, schoolId])
  @@index([schoolId])
}
```

---

## Files to Create/Modify

### New Backend Files
1. `apps/backend/src/models/NotificationPreference.ts` - TypeScript interface
2. `apps/backend/src/services/notification.service.ts` - Preference logic
3. `apps/backend/src/routes/notifications.routes.ts` - Preference endpoints
4. `apps/backend/src/validators/notification.validators.ts` - Zod schemas
5. `apps/backend/src/jobs/emailNotification.job.ts` - Email queue processor
6. Email templates in `email.service.ts` (9 total)

### Modified Backend Files
1. `apps/backend/prisma/schema.prisma` - Add NotificationPreference model
2. `apps/backend/src/services/lesson.service.ts` - Add reschedule notification
3. `apps/backend/src/services/hybridBooking.service.ts` - Add email triggers
4. `apps/backend/src/services/invoice.service.ts` - Add email triggers
5. `apps/backend/src/config/queue.ts` - Add emailQueue instance
6. `apps/backend/src/routes/index.ts` - Register notification routes

### New Frontend Files
1. `apps/frontend/src/pages/ParentNotificationPreferencesPage.tsx` - Settings page
2. `apps/frontend/src/api/notifications.api.ts` - API client
3. `apps/frontend/src/hooks/useNotifications.ts` - React Query hooks
4. `apps/frontend/src/components/notifications/NotificationPreference.tsx` - Settings component

### Modified Frontend Files
1. `apps/frontend/src/pages/CalendarPage.tsx` - Add drag-and-drop handlers
2. `apps/frontend/src/App.tsx` - Add notification preferences route
3. `apps/frontend/src/pages/ParentDashboardPage.tsx` - Add link to preferences

---

## Key Business Rules

### Drag-and-Drop Scheduling
1. Only ADMIN role can drag lessons
2. Cannot drag lesson to past time
3. Cannot create double-bookings (teacher or room)
4. Dragging group lesson reschedules all enrolled students
5. Dragging individual session reschedules + notifies parent
6. 24-hour notice rule still applies to hybrid bookings

### Email Notifications
1. Send immediately for lesson changes (within 1 second)
2. Send immediately for booking confirmations
3. Send immediately for payment confirmations
4. Send within 1 hour for reminders (can batch)
5. Respect parent notification preferences
6. Retry failed sends up to 3 times with exponential backoff

### Hybrid Lesson Notifications (CRITICAL)
1. "Booking opened" email sent to ALL parents with hybrid enrollments
2. "Booking reminder" sent 48 hours before deadline to unbooked parents
3. Individual session confirmation sent immediately after booking
4. Individual session reschedule notification sent immediately after admin moves

---

## Multi-Tenancy Security

- ALL queries must filter by `schoolId`
- Notification preferences must respect schoolId
- Email templates can reference school name from context
- Queue jobs must isolate school data
- Parents can only modify their own preferences
- Teachers/admins cannot see parent preferences

---

## Dependencies

### Week 10 Depends On
- Week 5: Calendar view (react-big-calendar)
- Week 5: Hybrid booking system (booking logic, available slots)
- Week 7: Invoice system (payment notifications)
- Week 3: Email foundation (SendGrid setup)

### Week 10 Enables
- Week 11: Dashboard polish (notification badge counts)
- Week 12: E2E testing of notification flows
- Week 12: Production deployment with email sending

---

## Key Files to Review

| File | Purpose |
|------|---------|
| `Planning/roadmaps/12_Week_MVP_Plan.md` | Week 10 detailed spec |
| `Planning/archive/early-drafts/Drag_and_Drop_Scheduling_Specification.md` | DnD technical details |
| `Planning/archive/early-drafts/Email_SMS_Notifications_Specification.md` | Email architecture |
| `apps/backend/src/services/email.service.ts` | Email service (~450 lines) |
| `apps/backend/src/config/queue.ts` | Bull queue setup |
| `apps/frontend/src/pages/CalendarPage.tsx` | Existing calendar |
| `apps/backend/src/services/hybridBooking.service.ts` | Hybrid booking system |

---

## Estimated Scope

| Category | Lines of Code |
|----------|---------------|
| Backend Code | 2,000-2,500 |
| Frontend Code | 1,500-2,000 |
| Test Code | 1,200-1,500 |
| **Total** | **~5,000-6,500** |

- Database Migration: 1 new model (NotificationPreference)
- New Files: 8-10 files
- Modified Files: 8-10 files

---

## Week 10 Deliverables Checklist

- [ ] Drag-and-drop reschedule lessons on calendar
- [ ] Hybrid lesson rescheduling works correctly (group + individual)
- [ ] Email notifications sent for key events (9 templates)
- [ ] Hybrid booking opened emails sent (CRITICAL)
- [ ] Notification preferences page (parent control)
- [ ] Email queue with retry logic (Bull + Redis)
- [ ] 100% multi-tenancy security
- [ ] All tests passing (unit + integration)

---

## Critical Success Factors

1. **Drag-and-Drop UX**: Must be smooth and responsive (< 200ms drag response)
2. **Email Reliability**: Notifications must arrive within SLA (immediate for changes)
3. **Hybrid Booking Emails**: CRITICAL - determines parent engagement
4. **Multi-Tenancy**: No data leakage across schools in notifications
5. **Notification Queue**: Must handle retries reliably without data loss
6. **Preference Respect**: Must honor parent preferences (don't over-email)
