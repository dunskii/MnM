# Week 5 Study: Calendar & Hybrid Lesson Booking System

## Overview

Week 5 is one of the most critical weeks in the 12-week MVP timeline. It focuses on implementing the **CORE differentiator** of the platform: the **Hybrid Lesson Booking System**. This is the feature that makes Music 'n Me unique compared to Simply Portal.

**Week 5 Goals:**
- Implement calendar view for all lessons with hybrid lesson placeholders
- Build parent-facing booking interface for hybrid individual sessions
- Create admin hybrid management dashboard
- Implement drag-and-drop rescheduling (basic)
- Ensure conflict prevention and 24-hour cancellation notice

**Current Status:**
- Week 4 is complete (Lesson management + enrollment)
- Week 5 is fully planned but not yet started
- Foundation is solid: All 4 lesson types working, including hybrid lesson pattern storage

---

## 1. Architecture & Design

### 1.1 Hybrid Lesson System Overview

**What is a Hybrid Lesson?**
- Alternates between group sessions and individual sessions within a term
- Example: Weeks 1-3 are group lessons (60 min), Week 4 is individual bookable slots (30 min), Weeks 5-7 are group again, Week 8 is individual, etc.
- Parents must book their child's individual session time from available slots
- Admin controls which weeks are group vs individual

**Three Key Components:**

1. **Lesson Configuration** (Already complete in Week 4)
   - All lessons have `HybridLessonPattern` if they're hybrid type
   - Pattern defines `groupWeeks` and `individualWeeks`
   - Stores `individualSlotDuration` (usually 30 min)
   - `bookingDeadlineHours` (default 24h notice)
   - `bookingsOpen` boolean controls if parents can book

2. **Calendar Display** (Week 5 - Frontend)
   - Show all lessons color-coded by type
   - For hybrid lessons in "group weeks": show normal lesson at scheduled time
   - For hybrid lessons in "individual weeks": show placeholder at group lesson time + individual booked sessions separately
   - Calendar should be interactive with filters

3. **Hybrid Booking System** (Week 5 - Backend + Frontend)
   - Parents view available individual session slots for their hybrid lessons
   - Book specific time for their child
   - See their bookings in calendar
   - Reschedule with 24h notice
   - Admin controls booking periods and availability

---

## 2. Database Models

### 2.1 Key Hybrid-Related Models (Already in Prisma Schema)

**HybridLessonPattern** (Lines 547-566)
```prisma
- id: string
- lessonId: string (unique, FK to Lesson)
- termId: string (FK to Term)
- patternType: ALTERNATING | CUSTOM
- groupWeeks: Json[] (e.g., [1,2,3,5,6,7,9,10])
- individualWeeks: Json[] (e.g., [4,8])
- individualSlotDuration: Int (minutes, default 30)
- bookingDeadlineHours: Int (default 24)
- bookingsOpen: Boolean (controls booking availability)
```

**HybridBooking** (Lines 568-596)
```prisma
- id: string
- lessonId: string (FK to Lesson)
- studentId: string (FK to Student)
- parentId: string (FK to Parent)
- weekNumber: Int
- scheduledDate: DateTime
- startTime: string ("09:00")
- endTime: string ("09:30")
- status: PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
- bookedAt: DateTime (when parent booked)
- confirmedAt: DateTime (when parent confirmed)
- cancelledAt: DateTime
- cancellationReason: string
- completedAt: DateTime
```

### 2.2 Key Relationships

- **Lesson** → **HybridLessonPattern** (1:1 optional)
- **Lesson** → **HybridBooking[]** (1:many)
- **Student** → **HybridBooking[]** (1:many)
- **Parent** → **HybridBooking[]** (1:many)

### 2.3 Multi-Tenancy Considerations

- All lessons must be filtered by `schoolId`
- HybridBooking indirectly filters by school via lesson.schoolId
- Parents can only see/book for their own children
- Admin sees all bookings for their school

---

## 3. Backend Requirements

### 3.1 Hybrid Booking API Endpoints

**Parent Booking APIs** (Parent must be authenticated, viewing own family):
```
GET    /hybrid-bookings/available-slots
       - Query: lessonId, weekNumber
       - Returns: List of available time slots for booking
       - Access: Parent (only for their own students)

POST   /hybrid-bookings
       - Body: { lessonId, studentId, scheduledDate, startTime, endTime }
       - Returns: Created HybridBooking
       - Access: Parent (only for their own students)
       - Validation: Check 24h notice, no conflicts

PATCH  /hybrid-bookings/:id
       - Body: { scheduledDate, startTime, endTime }
       - Returns: Updated HybridBooking
       - Access: Parent (only their own bookings)
       - Validation: Check 24h notice before reschedule

DELETE /hybrid-bookings/:id
       - Access: Parent (only their own)
       - Sets status to CANCELLED, records cancelledAt

GET    /hybrid-bookings/my-bookings
       - Returns: List of parent's booked sessions
       - Access: Parent

GET    /lessons/:id/hybrid-status
       - Returns: Booking status (% booked, who hasn't booked, etc.)
       - Access: Admin/Teacher
```

**Admin Hybrid Management APIs:**
```
PATCH  /lessons/:id/hybrid/open-bookings
       - Sets bookingsOpen = true
       - Access: Admin

PATCH  /lessons/:id/hybrid/close-bookings
       - Sets bookingsOpen = false
       - Access: Admin

GET    /lessons/:id/hybrid/bookings
       - Returns: All HybridBooking records for lesson
       - Access: Admin/Teacher

POST   /lessons/:id/hybrid/send-reminders
       - Sends email to parents who haven't booked
       - Access: Admin

GET    /lessons/:id/hybrid/booking-stats
       - Returns: Total students, booked count, % completion
       - Access: Admin
```

### 3.2 Service Layer Functions (lesson.service.ts expansion)

```typescript
// Get available time slots for a specific week
getAvailableSlots(lessonId, weekNumber): Promise<TimeSlot[]>

// Create hybrid booking
createHybridBooking(lessonId, studentId, parentId, scheduledDate, startTime, endTime): Promise<HybridBooking>

// Get parent's bookings
getParentBookings(parentId, schoolId): Promise<HybridBooking[]>

// Reschedule booking with 24h validation
rescheduleHybridBooking(bookingId, parentId, newDate, newTime): Promise<HybridBooking>

// Get booking statistics
getHybridBookingStats(lessonId): Promise<BookingStats>

// Check for booking conflicts
checkBookingConflict(lessonId, weekNumber, startTime, endTime): Promise<boolean>

// Generate calendar placeholders for hybrid lessons
generateHybridCalendarEvents(lessonId): Promise<CalendarEvent[]>
```

### 3.3 Validators (lesson.validators.ts expansion)

```typescript
// HybridBooking validation schemas
hybridBookingCreateSchema
hybridBookingUpdateSchema
bookingAvailabilitySchema
```

---

## 4. Frontend Requirements

### 4.1 New Pages/Components

**CalendarPage** (`apps/frontend/src/pages/admin/CalendarPage.tsx`)
- Install calendar library (FullCalendar or react-big-calendar)
- Display all lessons color-coded:
  - Individual: Purple
  - Group: Blue
  - Band: Green
  - Hybrid (group weeks): Blue
  - Hybrid (individual weeks): Orange with placeholders
- Show booked individual sessions as separate events
- Click event to see details
- Filters: By teacher, location, lesson type, week view/month view
- Show teacher, room, enrolled student count
- For hybrid lessons, show booking status (X booked / Y total)

**Parent Booking Interface** (`apps/frontend/src/pages/parent/HybridBookingPage.tsx`)
- List hybrid lessons parent's children are enrolled in
- For each lesson:
  - Show term, teacher, instrument
  - Show which weeks are individual vs group
  - For individual weeks: show "Book" button
  - Show already booked dates
- Click "Book" → Modal opens with:
  - Week selector
  - Available time slots (fetched from API)
  - Click slot to book
  - Confirmation dialog
- Show booked sessions with "Reschedule" and "Cancel" buttons
- Reschedule modal with 24h notice warning

**Admin Hybrid Management** (`apps/frontend/src/pages/admin/HybridManagementPage.tsx`)
- List all hybrid lessons
- For each:
  - Show booking status (X/Y booked)
  - "Open/Close Bookings" button
  - "Send Reminder Email" button
  - View all bookings table (student, date, time, status)
  - Set availability slots (teacher schedule → available times)

### 4.2 React Query Hooks (useLessons.ts expansion)

```typescript
useAvailableSlots(lessonId, weekNumber)
useCreateHybridBooking()
useUpdateHybridBooking()
useDeleteHybridBooking()
useParentBookings()
useHybridBookingStats(lessonId)
useOpenBookings(lessonId)
useCloseBookings(lessonId)
useSendBookingReminders(lessonId)
```

### 4.3 Calendar Library

**Recommended:** `react-big-calendar` (mentioned in Week 5 plan)
```bash
npm install react-big-calendar date-fns
```

Or alternatively: `@fullcalendar/react`

---

## 5. Hybrid Lesson Booking Flow (Critical Path)

### 5.1 Admin Workflow

1. Admin creates Hybrid lesson in Week 4 with:
   - Group weeks pattern (e.g., [1,2,3,5,6,7,9,10])
   - Individual weeks pattern (e.g., [4,8])
   - Individual slot duration (e.g., 30 min)
   - Booking deadline (e.g., 24 hours)

2. Admin enrolls students in the hybrid lesson

3. When individual week approaches, admin:
   - Sets available time slots for teacher
   - Opens bookings: `PATCH /lessons/:id/hybrid/open-bookings`

4. Admin can view booking status, send reminders

### 5.2 Parent Workflow

1. Parent logs in, goes to family dashboard
2. Sees child's enrolled hybrid lessons
3. For upcoming individual week:
   - Clicks "Book Individual Session"
   - Sees available time slots
   - Selects slot and confirms
   - Receives confirmation email (Week 10)

4. To reschedule:
   - Clicks existing booking
   - Selects new time (with 24h notice validation)
   - Confirms reschedule

5. To cancel:
   - Clicks cancel button
   - Status set to CANCELLED
   - Email sent to parent and teacher

### 5.3 Calendar Display

**Group Week (e.g., Week 1):**
- Shows single blue event on calendar at group lesson time
- "Hybrid Piano - Group Session"
- 60 min duration
- Shows all enrolled students

**Individual Week (e.g., Week 4):**
- Shows orange placeholder at same time as group would be
- "Hybrid Piano - Individual Booking Week (Sign-ups Close [date])"
- When parent books: Shows individual booking event at booked time
- "Hybrid Piano - [Student Name]'s Individual Session"
- 30 min duration at booked time

---

## 6. Critical Business Rules

### 6.1 Booking Rules

1. **24-Hour Notice Rule**
   - Parents must book or reschedule with 24 hours notice
   - Cannot book for same-day individual slots
   - Cannot reschedule within 24 hours of current booking
   - System blocks these actions, shows error message

2. **Conflict Prevention**
   - No two students can book same time slot
   - System must prevent double-booking
   - Check `HybridBooking.status !== CANCELLED` when checking conflicts

3. **Booking Status Lifecycle**
   ```
   PENDING → CONFIRMED (when parent confirms)
            → CANCELLED (if parent cancels)
            → COMPLETED (after lesson occurs)
            → NO_SHOW (if student didn't show)
   ```

4. **Teacher Availability**
   - Admin sets available time slots for teacher per week
   - These slots come from teacher's schedule
   - Only show available slots to parents

5. **Deadline Enforcement**
   - `HybridLessonPattern.bookingDeadlineHours` controls when bookings must close
   - Default 24 hours before first day of individual week
   - Admin can adjust per lesson

### 6.2 Calendar Placeholder Rules

- Individual weeks show placeholder at group lesson's scheduled day/time
- Placeholder is informational only (can't be edited directly)
- Actual bookings appear as separate events at booked times
- Color-coding helps distinguish group vs individual weeks

---

## 7. Multi-Tenancy & Security

### 7.1 Critical Security Checks

```typescript
// ✅ CORRECT
const bookings = await prisma.hybridBooking.findMany({
  where: {
    lesson: { schoolId: req.user.schoolId },
    parent: { schoolId: req.user.schoolId }
  }
});

// ❌ WRONG
const bookings = await prisma.hybridBooking.findMany({
  where: { studentId }
});
```

### 7.2 Access Control

- **Parents**: Can only view/book/reschedule their own children's lessons
- **Teachers**: Can view all bookings for their lessons (read-only)
- **Admin**: Can view/manage all bookings, open/close bookings
- **Students**: Read-only view of bookings (if they have portal account)

### 7.3 Data Isolation

- All queries must go through lesson relationship to verify schoolId
- Never query HybridBooking without verifying parent/student belong to school
- Email notifications must respect privacy (only notify relevant parties)

---

## 8. Integration with Other Features

### 8.1 Calendar Integration (Week 5)
- Lessons calendar shows hybrid lesson placeholders
- Booked individual sessions appear as events
- Must distinguish visually from group lessons

### 8.2 Invoicing Integration (Week 7)
- Hybrid lessons need special billing:
  - Count group weeks at group price
  - Count individual weeks at individual rate
  - Generate separate line items
  - Example: "Piano - Group (3 weeks × $50)" + "Piano - Individual (2 weeks × $35)"

### 8.3 Attendance Integration (Week 6)
- Mark attendance for individual sessions from HybridBooking records
- Auto-populate calendar date from booking

### 8.4 Email Notifications (Week 10)
- Booking confirmation email
- Booking reminder (2 days before)
- Reschedule confirmation
- Cancellation notice
- Weekly reminder for parents who haven't booked

---

## 9. Database Considerations

### 9.1 Indexes & Query Performance

Already in schema:
```prisma
@@index([lessonId])
@@index([studentId])
@@index([parentId])
@@index([scheduledDate])
@@index([status])
```

Good for:
- Finding bookings by lesson (calendar display)
- Finding student bookings
- Finding parent bookings
- Checking conflicts by date
- Status-based queries

### 9.2 Data Consistency

- Use transactions when creating bookings to prevent race conditions
- Update `HybridBooking.confirmedAt` only after parent confirms
- Soft delete: Set `status = CANCELLED` rather than hard delete
- No cascade deletes (keep audit trail)

---

## 10. Testing Strategy

Critical test scenarios:
- Parent can book available slot
- Parent cannot book without 24h notice
- Parent cannot double-book
- Conflict prevention works
- Calendar shows placeholders correctly
- Reschedule with validation
- Email notifications sent
- Multi-tenancy isolation (parent sees only own family)

---

## 11. Key Files to Understand

### Backend
- `apps/backend/prisma/schema.prisma` - Lines 546-596 (HybridLessonPattern, HybridBooking)
- `apps/backend/src/services/lesson.service.ts` - 976 lines of lesson logic
- `apps/backend/src/validators/lesson.validators.ts` - Validation schemas
- `apps/backend/src/routes/lessons.routes.ts` - Lesson API endpoints

### Frontend
- `apps/frontend/src/pages/admin/LessonsPage.tsx` - Lesson management UI
- `apps/frontend/src/pages/admin/LessonDetailPage.tsx` - Lesson details + enrollment
- `apps/frontend/src/hooks/useLessons.ts` - React Query hooks
- `apps/frontend/src/api/lessons.api.ts` - API client functions
- `apps/frontend/package.json` - Calendar library needs to be added

### Reference Docs
- `Planning/roadmaps/12_Week_MVP_Plan.md` - Lines 207-259 (Week 5 full spec)
- `PROGRESS.md` - Current project status
- `md/report/week-4.md` - Week 4 implementation patterns to follow
- `md/review/week-4.md` - Week 4 QA review and code quality standards

---

## 12. Lessons from Week 4 (Apply to Week 5)

### Code Quality Standards to Follow
1. Create comprehensive Zod validators for all inputs
2. Implement proper error handling with AppError
3. Use React Query for all API calls with proper caching
4. Add toast notifications for user feedback
5. Implement complete multi-tenancy filtering
6. Write integration tests for critical paths
7. Create TypeScript interfaces for all data structures

### UI/UX Patterns
1. Use Material-UI components consistently
2. Brand colors: Primary blue (#4580E4), Yellow (#FFCE00), Mint (#96DAC9)
3. Toast notifications for all async operations
4. Loading states and error messages
5. Modals for forms (create, edit, confirm actions)

### Backend Patterns
1. Service layer handles business logic
2. API routes handle HTTP concerns
3. Validators ensure data integrity
4. Multi-tenancy in EVERY query
5. Proper transaction support
6. Soft deletes, not hard deletes

---

## 13. Week 5 Deliverables Checklist

From 12_Week_MVP_Plan.md:

- [ ] **Parents can book individual sessions from hybrid lessons**
- [ ] **Parents can reschedule with 24h notice**
- [ ] **Admin can open/close booking periods**
- [ ] **Calendar shows hybrid lesson placeholders + booked sessions**
- [ ] Calendar displays all lessons + meet & greets
- [ ] Can filter by teacher and location
- [ ] Conflict detection prevents double-booking

---

## Summary: Week 5 at a Glance

| Aspect | Details |
|--------|---------|
| **Core Feature** | Hybrid lesson booking system (CORE DIFFERENTIATOR) |
| **Duration** | 5 days |
| **Phase** | Phase 3: Core Operations |
| **Difficulty** | High (complex calendar logic + booking constraints) |
| **Dependencies** | Week 4 (lessons complete) |
| **Blocks** | Week 6 (attendance), Week 7 (invoicing), Week 10 (email) |
| **Key Models** | HybridLessonPattern, HybridBooking, Calendar Events |
| **API Endpoints** | 8+ hybrid booking endpoints, calendar integration |
| **Frontend** | CalendarPage, HybridBookingPage, HybridManagementPage |
| **Security** | Multi-tenancy isolation critical, 24h rule enforcement |
| **Testing** | Integration tests for booking flow, conflict prevention |
| **Complexity** | Medium-high (calendar UI + booking logic with constraints) |
