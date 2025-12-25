# Week 10: Advanced Scheduling & Notifications - Implementation Plan

**Created**: 2025-12-25
**Project Status**: 75% complete (9/12 weeks)
**Estimated Duration**: 5 days (34 hours)

---

## Executive Summary

Week 10 focuses on two critical features:
1. **Drag-and-Drop Calendar Scheduling** - Enhanced UX for lesson rescheduling with real-time validation
2. **Email Notifications System** - Comprehensive transactional email system via SendGrid with notification preferences

### Dependencies (Already Complete)
- Week 5: Calendar view (react-big-calendar in `CalendarPage.tsx`)
- Week 5: Hybrid booking system (`hybridBooking.service.ts`)
- Week 7: Invoice system (`invoice.service.ts`)
- Week 3: Email foundation (`email.service.ts` with SendGrid)
- Week 8: Bull queue system (`queue.ts` and `googleDriveSync.job.ts`)

---

## Phase 1: Database Layer

### 1.1 Create NotificationPreference Model

**File**: `apps/backend/prisma/schema.prisma`

Add after existing models:
```prisma
enum NotificationType {
  LESSON_REMINDER
  LESSON_RESCHEDULED
  PAYMENT_RECEIVED
  INVOICE_CREATED
  HYBRID_BOOKING_OPENED
  HYBRID_BOOKING_REMINDER
  FILE_UPLOADED
  ATTENDANCE_SUMMARY
}

model NotificationPreference {
  id                           String    @id @default(uuid())
  userId                       String
  schoolId                     String
  emailNotificationsEnabled    Boolean   @default(true)
  notificationTypes            Json      @default("{}")
  quietHoursEnabled            Boolean   @default(true)
  quietHoursStart              String?   @default("21:00")
  quietHoursEnd                String?   @default("07:00")
  createdAt                    DateTime  @default(now())
  updatedAt                    DateTime  @updatedAt

  user                         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  school                       School    @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@unique([userId, schoolId])
  @@index([schoolId])
  @@index([userId])
}
```

Add relations to User and School models.

### 1.2 Run Migration

```bash
cd apps/backend
npx prisma migrate dev --name add_notification_preferences
npx prisma generate
```

### Success Criteria
- [ ] NotificationPreference model added to schema
- [ ] Migration runs without errors
- [ ] Prisma client regenerated
- [ ] Relations configured

---

## Phase 2: API Layer

### 2.1 Notification Validators

**New File**: `apps/backend/src/validators/notification.validators.ts`

- `updatePreferencesSchema` - Validate preference updates
- `rescheduleSchema` - Validate drag-and-drop reschedule requests

### 2.2 Notification Routes

**New File**: `apps/backend/src/routes/notifications.routes.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/notifications/preferences` | Get user's preferences |
| PATCH | `/notifications/preferences` | Update preferences |

### 2.3 Lesson Reschedule Endpoints

**Modify**: `apps/backend/src/routes/lessons.routes.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/lessons/:id/reschedule` | Reschedule via drag-and-drop |
| GET | `/lessons/:id/check-conflicts` | Pre-validate reschedule |

### 2.4 Register Routes

**Modify**: `apps/backend/src/routes/index.ts`

### Success Criteria
- [ ] Validators created with Zod schemas
- [ ] GET/PATCH preferences endpoints working
- [ ] POST reschedule endpoint working
- [ ] GET check-conflicts endpoint working
- [ ] Routes registered
- [ ] All endpoints filter by schoolId

---

## Phase 3: Service Layer

### 3.1 Notification Service

**New File**: `apps/backend/src/services/notification.service.ts`

Functions:
- `getPreferences(schoolId, userId)` - Get or create default preferences
- `updatePreferences(schoolId, userId, data)` - Update preferences
- `shouldSendNotification(userId, type)` - Check if user wants notification
- `isInQuietHours(preferences)` - Check quiet hours

Default preferences (all enabled except ATTENDANCE_SUMMARY):
```typescript
const DEFAULT_NOTIFICATION_TYPES = {
  LESSON_REMINDER: true,
  LESSON_RESCHEDULED: true,
  PAYMENT_RECEIVED: true,
  INVOICE_CREATED: true,
  HYBRID_BOOKING_OPENED: true,
  HYBRID_BOOKING_REMINDER: true,
  FILE_UPLOADED: true,
  ATTENDANCE_SUMMARY: false,
};
```

### 3.2 Lesson Service Updates

**Modify**: `apps/backend/src/services/lesson.service.ts`

Add functions:
- `checkRescheduleConflicts(schoolId, lessonId, input)` - Check teacher/room conflicts
- `rescheduleLesson(schoolId, lessonId, input, userId)` - Perform reschedule + queue notification

### 3.3 Email Notification Queue

**Modify**: `apps/backend/src/config/queue.ts`

Add `emailNotificationQueue` with:
- 3 retry attempts
- Exponential backoff (3s initial delay)
- Remove completed/failed jobs

### 3.4 Email Job Processor

**New File**: `apps/backend/src/jobs/emailNotification.job.ts`

Queue helper functions:
- `queueLessonRescheduledEmail(schoolId, lessonId, reason)`
- `queueHybridBookingOpenedEmails(schoolId, lessonId)`
- `queueHybridBookingReminderEmails(schoolId, lessonId)`
- `queueIndividualSessionBookedEmail(schoolId, bookingId)`
- `queueIndividualSessionRescheduledEmail(schoolId, bookingId)`
- `queueInvoiceCreatedEmail(schoolId, invoiceId)`
- `queuePaymentReceivedEmail(schoolId, paymentId)`
- `queueMeetAndGreetReminderEmail(schoolId, meetAndGreetId)`

Processor functions:
- `processLessonRescheduledEmails(schoolId, data)`
- `processHybridBookingOpenedEmails(schoolId, data)`
- etc.

### 3.5 Email Templates

**Modify**: `apps/backend/src/services/email.service.ts`

Add 9 email template functions:
1. `sendLessonRescheduledEmail(to, data)`
2. `sendHybridBookingOpenedEmail(to, data)`
3. `sendHybridBookingReminderEmail(to, data)`
4. `sendIndividualSessionBookedEmail(to, data)`
5. `sendIndividualSessionRescheduledEmail(to, data)`
6. `sendMeetAndGreetReminderEmail(to, data)`
7. `sendPaymentReceivedEmail(to, data)`
8. `sendInvoiceCreatedEmail(to, data)`
9. `sendLessonReminderEmail(to, data)` (for future scheduling)

All templates use brand colors (#4580E4, #FFCE00, #96DAC9, #FFAE9E, #FCF6E6).

### Success Criteria
- [ ] NotificationService created
- [ ] Lesson reschedule with notifications
- [ ] Email queue created (Bull/Redis)
- [ ] Email job processor with all types
- [ ] 9 email templates added
- [ ] All services filter by schoolId

---

## Phase 4: Frontend Layer

### 4.1 Drag-and-Drop Calendar

**Modify**: `apps/frontend/src/pages/admin/CalendarPage.tsx`

1. Import drag-and-drop wrapper:
```typescript
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const DnDCalendar = withDragAndDrop(Calendar);
```

2. Add state for confirmation dialog

3. Add drag handlers:
   - `handleEventDrop` - Check conflicts, show dialog
   - `handleConfirmReschedule` - Call API, refresh calendar

4. Add confirmation dialog with conflict display

5. Configure draggable events (exclude placeholders, meet-and-greets)

### 4.2 Notifications API

**New File**: `apps/frontend/src/api/notifications.api.ts`

- `getPreferences()` - GET /notifications/preferences
- `updatePreferences(data)` - PATCH /notifications/preferences

### 4.3 Notifications Hooks

**New File**: `apps/frontend/src/hooks/useNotifications.ts`

- `useNotificationPreferences()` - Query hook
- `useUpdateNotificationPreferences()` - Mutation hook

### 4.4 Notification Preferences Page

**New File**: `apps/frontend/src/pages/parent/NotificationPreferencesPage.tsx`

Features:
- Master email toggle
- 8 notification type toggles with descriptions
- Quiet hours configuration (start/end time)
- Save button with loading state

### 4.5 Routes

**Modify**: `apps/frontend/src/App.tsx`

Add route: `/parent/notifications` -> `NotificationPreferencesPage`

### 4.6 Parent Dashboard Link

**Modify**: `apps/frontend/src/pages/parent/ParentDashboardPage.tsx`

Add link to notification preferences.

### Success Criteria
- [ ] Drag-and-drop working on calendar
- [ ] Real-time conflict checking
- [ ] Confirmation dialog with conflicts
- [ ] NotificationPreferencesPage created
- [ ] All 8 notification types configurable
- [ ] Quiet hours configuration
- [ ] Routes registered
- [ ] Link in Parent Dashboard

---

## Phase 5: Integration

### 5.1 Hybrid Booking Email Triggers

**Modify**: `apps/backend/src/services/hybridBooking.service.ts`

- `toggleBookingsOpen()` - Queue HYBRID_BOOKING_OPENED emails
- `createHybridBooking()` - Queue INDIVIDUAL_SESSION_BOOKED email
- `rescheduleBooking()` - Queue INDIVIDUAL_SESSION_RESCHEDULED email

### 5.2 Invoice Email Triggers

**Modify**: `apps/backend/src/services/invoice.service.ts`

- `createInvoice()` - Queue INVOICE_CREATED email
- `recordPayment()` - Queue PAYMENT_RECEIVED email

### 5.3 Test Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| Admin drags lesson | Confirmation → Reschedule → Email queued → Email sent |
| Admin opens bookings | Emails queued → All parents notified |
| Parent books session | Confirmation email sent |
| Invoice created | Parent notified |
| Payment received | Receipt sent |

### Success Criteria
- [ ] Drag-and-drop triggers notifications
- [ ] Hybrid booking triggers emails
- [ ] Invoice/payment triggers emails
- [ ] All respects notification preferences

---

## Phase 6: Testing

### 6.1 Backend Unit Tests

**New File**: `apps/backend/src/services/__tests__/notification.service.test.ts`

- getPreferences creates defaults
- updatePreferences respects schoolId
- shouldSendNotification respects preferences
- isInQuietHours handles overnight
- isInQuietHours handles same-day

### 6.2 Backend Integration Tests

**New File**: `apps/backend/src/routes/__tests__/notifications.routes.test.ts`

- GET preferences returns data
- PATCH preferences updates correctly
- Unauthorized access rejected
- Multi-tenancy isolation verified

### 6.3 Frontend Tests

**New File**: `apps/frontend/src/pages/parent/__tests__/NotificationPreferencesPage.test.tsx`

- Renders all notification types
- Toggle switches update state
- Save button calls API
- Error state displayed

### 6.4 Calendar DnD Tests

**New File**: `apps/frontend/src/pages/admin/__tests__/CalendarPage.dnd.test.tsx`

- Dragging triggers conflict check
- Conflict dialog shows correctly
- Confirm calls API
- Non-draggable events protected

### Success Criteria
- [ ] 90%+ coverage on new services
- [ ] All preference tests pass
- [ ] Calendar DnD tests pass
- [ ] Multi-tenancy verified

---

## Phase 7: Documentation

### 7.1 API Documentation

Document endpoints:
- GET /notifications/preferences
- PATCH /notifications/preferences
- POST /lessons/:id/reschedule
- GET /lessons/:id/check-conflicts

### 7.2 Update PROGRESS.md

Mark Week 10 as complete.

### 7.3 Update CLAUDE.md

Add notification system to feature list.

---

## Multi-Tenancy Security Checklist

| Service/Function | schoolId Filter |
|------------------|-----------------|
| notification.service.getPreferences | Required |
| notification.service.updatePreferences | Required |
| notification.service.shouldSendNotification | Required |
| lesson.service.rescheduleLesson | Required |
| lesson.service.checkRescheduleConflicts | Required |
| emailNotification.job processors | Required |

---

## Risk Assessment

### High Risk
1. **Email Deliverability**
   - Ensure SendGrid domain verification
   - Test with real emails in staging

2. **Queue Connection**
   - Redis must be running
   - Add health checks, fallback to sync

### Medium Risk
1. **Drag-and-Drop UX**
   - Must be responsive (<200ms)
   - Show loading states, debounce API

2. **Notification Spam**
   - Don't over-notify
   - Implement quiet hours, respect preferences

### Low Risk
1. Schema migration (simple addition)
2. Template design (have brand base)

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `validators/notification.validators.ts` | Zod schemas |
| `routes/notifications.routes.ts` | API routes |
| `services/notification.service.ts` | Preference logic |
| `jobs/emailNotification.job.ts` | Queue processor |
| `api/notifications.api.ts` | Frontend API |
| `hooks/useNotifications.ts` | React Query hooks |
| `pages/parent/NotificationPreferencesPage.tsx` | Settings UI |

### Modified Files
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add NotificationPreference model |
| `routes/lessons.routes.ts` | Add reschedule endpoints |
| `routes/index.ts` | Register notification routes |
| `services/lesson.service.ts` | Add reschedule functions |
| `services/hybridBooking.service.ts` | Add email triggers |
| `services/invoice.service.ts` | Add email triggers |
| `services/email.service.ts` | Add 9 templates |
| `config/queue.ts` | Add emailNotificationQueue |
| `pages/admin/CalendarPage.tsx` | Add drag-and-drop |
| `App.tsx` | Add notification route |
| `pages/parent/ParentDashboardPage.tsx` | Add settings link |

---

## Week 10 Deliverables Checklist

- [ ] Drag-and-drop reschedule lessons on calendar
- [ ] Real-time conflict detection during drag
- [ ] Hybrid lesson rescheduling awareness
- [ ] Email notifications sent for key events (9 templates)
- [ ] Hybrid booking opened emails sent (CRITICAL)
- [ ] Hybrid booking reminder emails sent
- [ ] Notification preferences page (parent control)
- [ ] Quiet hours functionality
- [ ] Email queue with retry logic (Bull + Redis)
- [ ] 100% multi-tenancy security
- [ ] All tests passing (unit + integration)
