# Week 5 Implementation Plan: Calendar & Hybrid Lesson Booking System

**Plan Date:** 2025-12-23
**Sprint:** Week 5 of 12-Week MVP
**Focus:** Calendar View, Hybrid Booking Backend, Parent Booking Interface
**Estimated Duration:** 5 days (40 hours)
**Dependencies:** Week 4 complete (Lesson Management + Enrollment)

---

## Executive Summary

Week 5 implements the **CORE differentiator** of the Music 'n Me platform: the Hybrid Lesson Booking System. This is the most critical week in the MVP timeline. Parents will be able to book individual sessions from hybrid lessons, and the calendar will display lessons with hybrid placeholders.

**Key Deliverables:**
1. Hybrid Booking Service (backend slot generation + booking logic)
2. Hybrid Booking API (parent and admin endpoints)
3. Calendar Page with react-big-calendar
4. Admin Hybrid Management Dashboard
5. Parent Booking Interface
6. Integration tests for booking flow

---

## Phase 1: Backend - Hybrid Booking Service

**Estimated Time:** 8 hours
**Agent:** full-stack-developer
**Priority:** Critical

### 1.1 New File: `apps/backend/src/services/hybridBooking.service.ts`

Create a new service file (~500 lines) with the following functions:

```typescript
// ===========================================
// Types
// ===========================================

export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  weekNumber: number;
  isAvailable: boolean;
}

export interface BookingStats {
  totalStudents: number;
  bookedCount: number;
  completionRate: number;
  pendingBookings: number;
}

export interface CreateBookingInput {
  lessonId: string;
  studentId: string;
  weekNumber: number;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
}

// ===========================================
// Core Functions
// ===========================================

// Get available time slots for a specific week
export async function getAvailableSlots(
  schoolId: string,
  lessonId: string,
  weekNumber: number
): Promise<TimeSlot[]>

// Create a hybrid booking with validation
export async function createHybridBooking(
  schoolId: string,
  parentId: string,
  input: CreateBookingInput
): Promise<HybridBooking>

// Reschedule an existing booking with 24h validation
export async function rescheduleHybridBooking(
  schoolId: string,
  parentId: string,
  bookingId: string,
  newDate: Date,
  newStartTime: string,
  newEndTime: string
): Promise<HybridBooking>

// Cancel a booking
export async function cancelHybridBooking(
  schoolId: string,
  parentId: string,
  bookingId: string,
  reason?: string
): Promise<void>

// Get parent's bookings
export async function getParentBookings(
  schoolId: string,
  parentId: string,
  filters?: { lessonId?: string; status?: string }
): Promise<HybridBooking[]>

// Get booking statistics for a lesson
export async function getHybridBookingStats(
  schoolId: string,
  lessonId: string
): Promise<BookingStats>

// Check for booking conflicts
export async function checkBookingConflict(
  schoolId: string,
  lessonId: string,
  weekNumber: number,
  scheduledDate: Date,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<boolean>

// Open/close bookings for a lesson
export async function toggleBookingsOpen(
  schoolId: string,
  lessonId: string,
  open: boolean
): Promise<HybridLessonPattern>

// Get all bookings for a lesson (admin view)
export async function getLessonBookings(
  schoolId: string,
  lessonId: string,
  filters?: { weekNumber?: number; status?: string }
): Promise<HybridBooking[]>

// Generate calendar events for hybrid lessons
export async function generateHybridCalendarEvents(
  schoolId: string,
  filters?: { termId?: string; teacherId?: string }
): Promise<CalendarEvent[]>

// Verify parent can book for student
export async function verifyParentStudentRelationship(
  schoolId: string,
  parentId: string,
  studentId: string
): Promise<boolean>
```

### 1.2 Key Business Logic Implementation

**24-Hour Notice Rule:**
```typescript
function validate24HourNotice(scheduledDate: Date, startTime: string): boolean {
  const [hours, minutes] = startTime.split(':').map(Number);
  const bookingTime = new Date(scheduledDate);
  bookingTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilBooking >= 24;
}
```

**Time Slot Generation:**
```typescript
function generateTimeSlots(
  baseDate: Date,
  lessonPattern: HybridLessonPattern,
  existingBookings: HybridBooking[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = lessonPattern.individualSlotDuration;

  // Generate slots from teacher's available hours
  // Check against existing bookings for conflicts
  // Return available slots only

  return slots;
}
```

**Conflict Detection with Race Condition Prevention:**
```typescript
async function createBookingWithLock(
  prisma: PrismaClient,
  input: CreateBookingInput
): Promise<HybridBooking> {
  return prisma.$transaction(async (tx) => {
    // Lock the lesson row for update
    const lesson = await tx.$queryRaw`
      SELECT * FROM "Lesson" WHERE id = ${input.lessonId} FOR UPDATE
    `;

    // Check for conflicts
    const conflict = await tx.hybridBooking.findFirst({
      where: {
        lessonId: input.lessonId,
        weekNumber: input.weekNumber,
        scheduledDate: input.scheduledDate,
        startTime: input.startTime,
        status: { notIn: ['CANCELLED'] }
      }
    });

    if (conflict) throw new AppError('Slot already booked', 409);

    // Create booking
    return tx.hybridBooking.create({ data: {...} });
  });
}
```

### 1.3 Multi-Tenancy Security

All functions must filter by `schoolId`:

```typescript
// ✅ CORRECT: Filter via lesson relationship
const bookings = await prisma.hybridBooking.findMany({
  where: {
    lesson: { schoolId },
    parentId,
    status: { notIn: ['CANCELLED'] }
  },
  include: {
    lesson: true,
    student: true
  }
});

// ✅ CORRECT: Verify parent-student relationship
const parent = await prisma.parent.findFirst({
  where: { id: parentId, schoolId },
  include: { family: { include: { students: true } } }
});
const studentIds = parent?.family?.students.map(s => s.id) || [];
if (!studentIds.includes(studentId)) {
  throw new AppError('Cannot book for this student', 403);
}
```

---

## Phase 2: Backend - Hybrid Booking API

**Estimated Time:** 6 hours
**Agent:** full-stack-developer
**Priority:** Critical

### 2.1 New File: `apps/backend/src/routes/hybridBooking.routes.ts`

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { parentOrAbove, adminOnly, teacherOrAdmin } from '../middleware/authorize';
import * as hybridBookingService from '../services/hybridBooking.service';
import {
  validateCreateBooking,
  validateRescheduleBooking,
  validateCancelBooking,
  validateAvailabilityQuery,
} from '../validators/hybridBooking.validators';

const router = Router();
router.use(authenticate);

// ===========================================
// PARENT BOOKING ENDPOINTS
// ===========================================

// GET /hybrid-bookings/available-slots
// Query: lessonId, weekNumber
router.get('/available-slots', parentOrAbove, validateAvailabilityQuery, ...)

// POST /hybrid-bookings
// Body: { lessonId, studentId, weekNumber, scheduledDate, startTime, endTime }
router.post('/', parentOrAbove, validateCreateBooking, ...)

// PATCH /hybrid-bookings/:id
// Body: { scheduledDate, startTime, endTime }
router.patch('/:id', parentOrAbove, validateRescheduleBooking, ...)

// DELETE /hybrid-bookings/:id
// Body: { reason? }
router.delete('/:id', parentOrAbove, validateCancelBooking, ...)

// GET /hybrid-bookings/my-bookings
// Query: lessonId?, status?
router.get('/my-bookings', parentOrAbove, ...)

// ===========================================
// ADMIN HYBRID MANAGEMENT ENDPOINTS
// ===========================================

// PATCH /lessons/:id/hybrid/open-bookings
router.patch('/lessons/:id/hybrid/open-bookings', adminOnly, ...)

// PATCH /lessons/:id/hybrid/close-bookings
router.patch('/lessons/:id/hybrid/close-bookings', adminOnly, ...)

// GET /lessons/:id/hybrid/bookings
router.get('/lessons/:id/hybrid/bookings', teacherOrAdmin, ...)

// GET /lessons/:id/hybrid/stats
router.get('/lessons/:id/hybrid/stats', teacherOrAdmin, ...)

// POST /lessons/:id/hybrid/send-reminders
router.post('/lessons/:id/hybrid/send-reminders', adminOnly, ...)

export default router;
```

### 2.2 New File: `apps/backend/src/validators/hybridBooking.validators.ts`

```typescript
import { z } from 'zod';
import { validate } from '../middleware/validate';

const uuidSchema = z.string().uuid('Invalid ID format');
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format');
const dateSchema = z.string().datetime().or(z.date()).transform(val => new Date(val));

export const availabilityQuerySchema = z.object({
  lessonId: uuidSchema,
  weekNumber: z.coerce.number().int().min(1).max(15),
});

export const createBookingSchema = z.object({
  lessonId: uuidSchema,
  studentId: uuidSchema,
  weekNumber: z.number().int().min(1).max(15),
  scheduledDate: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
}).refine((data) => {
  // Validate end time is after start time
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  return endH * 60 + endM > startH * 60 + startM;
}, { message: 'End time must be after start time' });

export const rescheduleBookingSchema = z.object({
  scheduledDate: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

// Exports
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

export const validateCreateBooking = validate(createBookingSchema);
export const validateRescheduleBooking = validate(rescheduleBookingSchema);
export const validateCancelBooking = validate(cancelBookingSchema);
export const validateAvailabilityQuery = validate(availabilityQuerySchema, 'query');
```

### 2.3 Update: `apps/backend/src/routes/index.ts`

Add the new routes:
```typescript
import hybridBookingRoutes from './hybridBooking.routes';

// Add after lessons routes
router.use('/hybrid-bookings', csrfProtection, hybridBookingRoutes);
```

---

## Phase 3: Frontend - Calendar Setup

**Estimated Time:** 6 hours
**Agent:** full-stack-developer
**Priority:** High

### 3.1 Install Calendar Library

```bash
cd apps/frontend
npm install react-big-calendar date-fns
npm install -D @types/react-big-calendar
```

### 3.2 New File: `apps/frontend/src/api/hybridBooking.api.ts`

```typescript
import { apiClient } from '../services/api';
import { Lesson } from './lessons.api';
import { Student } from './users.api';

// Types
export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  weekNumber: number;
  isAvailable: boolean;
}

export interface HybridBooking {
  id: string;
  lessonId: string;
  studentId: string;
  parentId: string;
  weekNumber: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  bookedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  lesson: Lesson;
  student: Student;
}

export interface BookingStats {
  totalStudents: number;
  bookedCount: number;
  completionRate: number;
  pendingBookings: number;
}

export interface CreateBookingInput {
  lessonId: string;
  studentId: string;
  weekNumber: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
}

// Calendar event type for react-big-calendar
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    type: 'INDIVIDUAL' | 'GROUP' | 'BAND' | 'HYBRID_GROUP' | 'HYBRID_INDIVIDUAL' | 'HYBRID_PLACEHOLDER';
    lessonId: string;
    lessonName: string;
    teacherName: string;
    roomName: string;
    locationName: string;
    enrolledCount: number;
    maxStudents: number;
    isBooking?: boolean;
    studentName?: string;
  };
}

// API
export const hybridBookingApi = {
  // Get available slots
  getAvailableSlots: (lessonId: string, weekNumber: number): Promise<TimeSlot[]> =>
    apiClient
      .get<{ status: string; data: TimeSlot[] }>('/hybrid-bookings/available-slots', {
        params: { lessonId, weekNumber }
      })
      .then(res => res.data),

  // Create booking
  create: (data: CreateBookingInput): Promise<HybridBooking> =>
    apiClient
      .post<{ status: string; data: HybridBooking }>('/hybrid-bookings', data)
      .then(res => res.data),

  // Reschedule booking
  reschedule: (id: string, data: { scheduledDate: string; startTime: string; endTime: string }): Promise<HybridBooking> =>
    apiClient
      .patch<{ status: string; data: HybridBooking }>(`/hybrid-bookings/${id}`, data)
      .then(res => res.data),

  // Cancel booking
  cancel: (id: string, reason?: string): Promise<void> =>
    apiClient.delete(`/hybrid-bookings/${id}`, { data: { reason } }),

  // Get my bookings
  getMyBookings: (filters?: { lessonId?: string; status?: string }): Promise<HybridBooking[]> =>
    apiClient
      .get<{ status: string; data: HybridBooking[] }>('/hybrid-bookings/my-bookings', { params: filters })
      .then(res => res.data),

  // Admin: Get lesson bookings
  getLessonBookings: (lessonId: string, filters?: { weekNumber?: number; status?: string }): Promise<HybridBooking[]> =>
    apiClient
      .get<{ status: string; data: HybridBooking[] }>(`/hybrid-bookings/lessons/${lessonId}/hybrid/bookings`, { params: filters })
      .then(res => res.data),

  // Admin: Get booking stats
  getBookingStats: (lessonId: string): Promise<BookingStats> =>
    apiClient
      .get<{ status: string; data: BookingStats }>(`/hybrid-bookings/lessons/${lessonId}/hybrid/stats`)
      .then(res => res.data),

  // Admin: Open bookings
  openBookings: (lessonId: string): Promise<void> =>
    apiClient.patch(`/hybrid-bookings/lessons/${lessonId}/hybrid/open-bookings`),

  // Admin: Close bookings
  closeBookings: (lessonId: string): Promise<void> =>
    apiClient.patch(`/hybrid-bookings/lessons/${lessonId}/hybrid/close-bookings`),

  // Admin: Send reminders
  sendReminders: (lessonId: string): Promise<void> =>
    apiClient.post(`/hybrid-bookings/lessons/${lessonId}/hybrid/send-reminders`),

  // Get calendar events
  getCalendarEvents: (filters?: { termId?: string; teacherId?: string; startDate?: string; endDate?: string }): Promise<CalendarEvent[]> =>
    apiClient
      .get<{ status: string; data: CalendarEvent[] }>('/calendar/events', { params: filters })
      .then(res => res.data),
};
```

### 3.3 New File: `apps/frontend/src/hooks/useHybridBooking.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { hybridBookingApi, CreateBookingInput } from '../api/hybridBooking.api';

export const hybridBookingKeys = {
  all: ['hybrid-bookings'] as const,
  availableSlots: (lessonId: string, weekNumber: number) =>
    [...hybridBookingKeys.all, 'slots', lessonId, weekNumber] as const,
  myBookings: (filters?: object) => [...hybridBookingKeys.all, 'my', filters] as const,
  lessonBookings: (lessonId: string, filters?: object) =>
    [...hybridBookingKeys.all, 'lesson', lessonId, filters] as const,
  stats: (lessonId: string) => [...hybridBookingKeys.all, 'stats', lessonId] as const,
  calendar: (filters?: object) => ['calendar', 'events', filters] as const,
};

// Available slots query
export function useAvailableSlots(lessonId: string, weekNumber: number) {
  return useQuery({
    queryKey: hybridBookingKeys.availableSlots(lessonId, weekNumber),
    queryFn: () => hybridBookingApi.getAvailableSlots(lessonId, weekNumber),
    enabled: !!lessonId && weekNumber > 0,
  });
}

// My bookings query
export function useMyBookings(filters?: { lessonId?: string; status?: string }) {
  return useQuery({
    queryKey: hybridBookingKeys.myBookings(filters),
    queryFn: () => hybridBookingApi.getMyBookings(filters),
  });
}

// Create booking mutation
export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: CreateBookingInput) => hybridBookingApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hybridBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: hybridBookingKeys.calendar() });
      enqueueSnackbar('Booking confirmed successfully!', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to create booking';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

// Reschedule booking mutation
export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { scheduledDate: string; startTime: string; endTime: string } }) =>
      hybridBookingApi.reschedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hybridBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: hybridBookingKeys.calendar() });
      enqueueSnackbar('Booking rescheduled successfully!', { variant: 'success' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to reschedule booking';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

// Cancel booking mutation
export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      hybridBookingApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hybridBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: hybridBookingKeys.calendar() });
      enqueueSnackbar('Booking cancelled', { variant: 'info' });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Failed to cancel booking';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });
}

// Admin: Booking stats query
export function useBookingStats(lessonId: string) {
  return useQuery({
    queryKey: hybridBookingKeys.stats(lessonId),
    queryFn: () => hybridBookingApi.getBookingStats(lessonId),
    enabled: !!lessonId,
  });
}

// Admin: Open/close bookings
export function useToggleBookings() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ lessonId, open }: { lessonId: string; open: boolean }) =>
      open ? hybridBookingApi.openBookings(lessonId) : hybridBookingApi.closeBookings(lessonId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      enqueueSnackbar(`Bookings ${variables.open ? 'opened' : 'closed'}`, { variant: 'success' });
    },
  });
}

// Calendar events query
export function useCalendarEvents(filters?: { termId?: string; teacherId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: hybridBookingKeys.calendar(filters),
    queryFn: () => hybridBookingApi.getCalendarEvents(filters),
  });
}
```

### 3.4 New File: `apps/frontend/src/pages/admin/CalendarPage.tsx`

Full calendar implementation with:
- react-big-calendar integration
- Color-coded lesson types
- Event filtering (term, teacher)
- Event detail dialog
- Legend showing event types

---

## Phase 4: Frontend - Admin Hybrid Management

**Estimated Time:** 6 hours
**Agent:** full-stack-developer
**Priority:** High

### 4.1 New File: `apps/frontend/src/pages/admin/HybridManagementPage.tsx`

This page allows admins to:
- View all hybrid lessons with booking status
- Open/close booking periods
- Send booking reminders
- View individual bookings per lesson

Key components:
- HybridLessonCard with booking stats
- BookingStatusTable showing enrolled students and their booking status
- Open/Close Bookings toggle
- Send Reminder button
- Filter by term, teacher

### 4.2 Update: `apps/frontend/src/pages/admin/LessonDetailPage.tsx`

Add Hybrid Booking Management section when lesson is HYBRID type:
- Booking statistics card
- Toggle bookings open/closed
- List of all bookings for the lesson
- Send reminders to parents who haven't booked

---

## Phase 5: Frontend - Parent Booking Interface

**Estimated Time:** 8 hours
**Agent:** full-stack-developer
**Priority:** Critical

### 5.1 New File: `apps/frontend/src/pages/parent/HybridBookingPage.tsx`

Parent-facing booking interface with:
- List of hybrid lessons enrolled children
- Week selector (individual vs group weeks)
- Available time slots grid
- Booking confirmation modal
- Existing bookings list with reschedule/cancel

### 5.2 New File: `apps/frontend/src/components/booking/SlotPicker.tsx`

Time slot selection grid component:
- Shows available slots in a visual grid
- Highlights selected slot
- Shows 24-hour notice warning if applicable

### 5.3 New File: `apps/frontend/src/components/booking/WeekSelector.tsx`

Week selection component:
- Shows term weeks with visual indicators
- Green = Group week (no booking needed)
- Orange = Individual week (booking available)
- Blue = Individual week (already booked)

### 5.4 Update: `apps/frontend/src/App.tsx`

Add parent routes:
```typescript
import HybridBookingPage from './pages/parent/HybridBookingPage';

// Add parent routes section
<Route
  path="/parent"
  element={
    <ProtectedRoute requiredRole="PARENT">
      <ParentLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<ParentDashboardPage />} />
  <Route path="hybrid-booking" element={<HybridBookingPage />} />
</Route>
```

---

## Phase 6: Integration & Testing

**Estimated Time:** 6 hours
**Agent:** testing-qa-specialist
**Priority:** High

### 6.1 New File: `apps/backend/tests/integration/hybridBooking.routes.test.ts`

Test categories:

**Parent Booking Tests:**
- Parent can view available slots
- Parent can create booking
- Parent cannot book without 24h notice
- Parent cannot double-book
- Parent can reschedule with 24h notice
- Parent can cancel booking
- Parent cannot book for another family's child

**Admin Management Tests:**
- Admin can open/close bookings
- Admin can view all bookings
- Admin can view booking stats
- Teacher can view bookings (read-only)

**Multi-Tenancy Tests:**
- Parent in School A cannot access School B lessons
- Booking isolation between schools

**Conflict Prevention Tests:**
- Concurrent booking attempts handled correctly
- Slot conflicts detected
- 24-hour rule enforced

---

## Risk Assessment & Mitigation

### Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Race conditions in booking | High | Use database transactions with row locking |
| Time zone issues | Medium | Store all times in UTC, convert on display |
| Calendar performance | Medium | Lazy load events, paginate by date range |
| Complex validation | Medium | Comprehensive Zod schemas, service-layer checks |
| Parent-child verification | High | Verify family relationship in every request |

### Race Condition Prevention

```typescript
// Use pessimistic locking
await prisma.$transaction(async (tx) => {
  // Lock the booking slot
  await tx.$executeRaw`
    SELECT * FROM "HybridBooking"
    WHERE "lessonId" = ${lessonId}
    AND "weekNumber" = ${weekNumber}
    AND "status" != 'CANCELLED'
    FOR UPDATE
  `;

  // Check for conflicts
  const existing = await tx.hybridBooking.findFirst({...});
  if (existing) throw new AppError('Slot already booked', 409);

  // Create booking
  return tx.hybridBooking.create({...});
});
```

---

## File Summary

### New Backend Files
| File | Lines (est) | Purpose |
|------|-------------|---------|
| `services/hybridBooking.service.ts` | ~500 | Booking business logic |
| `validators/hybridBooking.validators.ts` | ~80 | Zod validation schemas |
| `routes/hybridBooking.routes.ts` | ~200 | API endpoints |
| `tests/integration/hybridBooking.routes.test.ts` | ~400 | Integration tests |

### New Frontend Files
| File | Lines (est) | Purpose |
|------|-------------|---------|
| `api/hybridBooking.api.ts` | ~150 | API client |
| `hooks/useHybridBooking.ts` | ~150 | React Query hooks |
| `pages/admin/CalendarPage.tsx` | ~300 | Calendar view |
| `pages/admin/HybridManagementPage.tsx` | ~400 | Admin booking management |
| `pages/parent/HybridBookingPage.tsx` | ~500 | Parent booking interface |
| `components/booking/SlotPicker.tsx` | ~150 | Slot selection component |
| `components/booking/WeekSelector.tsx` | ~100 | Week selection component |

### Modified Files
| File | Changes |
|------|---------|
| `routes/index.ts` | Add hybrid booking routes |
| `App.tsx` | Add calendar and parent routes |
| `AdminLayout.tsx` | Add Calendar nav item |
| `LessonDetailPage.tsx` | Add hybrid booking section |

**Total Estimated New Code:** ~2,930 lines

---

## Success Criteria

### Week 5 Checkpoint (from 12_Week_MVP_Plan.md)
- [ ] Parents can book individual sessions from hybrid lessons
- [ ] Parents can reschedule with 24h notice
- [ ] Admin can open/close booking periods
- [ ] Calendar shows hybrid lesson placeholders + booked sessions
- [ ] Calendar displays all lessons + meet & greets
- [ ] Can filter by teacher and location
- [ ] Conflict detection prevents double-booking

---

## Implementation Order

**Day 1 (Monday):**
1. Create `hybridBooking.service.ts` with core functions
2. Create `hybridBooking.validators.ts`
3. Create `hybridBooking.routes.ts`

**Day 2 (Tuesday):**
1. Complete service layer (slot generation, conflict detection)
2. Implement 24-hour notice validation
3. Add race condition prevention

**Day 3 (Wednesday):**
1. Install react-big-calendar
2. Create `hybridBooking.api.ts` and `useHybridBooking.ts`
3. Create `CalendarPage.tsx`

**Day 4 (Thursday):**
1. Create `HybridManagementPage.tsx`
2. Create `HybridBookingPage.tsx` (parent interface)
3. Create booking components

**Day 5 (Friday):**
1. Write integration tests
2. End-to-end testing
3. Bug fixes and polish

---

## Critical Files for Implementation

**Backend (patterns to follow):**
- `apps/backend/prisma/schema.prisma` - HybridLessonPattern and HybridBooking models (lines 543-596)
- `apps/backend/src/services/lesson.service.ts` - Service layer structure, multi-tenancy patterns
- `apps/backend/src/validators/lesson.validators.ts` - Zod validation schemas
- `apps/backend/src/middleware/authorize.ts` - Authorization middleware (`parentOrAbove`, `parentOfStudent`)

**Frontend (patterns to follow):**
- `apps/frontend/src/hooks/useLessons.ts` - React Query hook patterns
- `apps/frontend/src/pages/admin/LessonsPage.tsx` - Admin page structure
- `apps/frontend/src/pages/admin/LessonDetailPage.tsx` - Detail page pattern
