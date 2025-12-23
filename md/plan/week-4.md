# Week 4 Implementation Plan: Lesson Management and Enrollment

## Executive Summary

Week 4 focuses on creating the lesson management system and student enrollment workflow. This is a critical week as it establishes the foundation for hybrid lessons (the CORE differentiator) which will be fully implemented in Week 5.

Based on the 12-Week MVP Plan, Week 4 deliverables are:
- Admin can create group lessons (1 hour)
- Admin can create one-on-one lessons (45 minutes)
- Admin can create band lessons (1 hour)
- Admin can create hybrid lessons with week patterns
- Bulk enroll students in group lessons
- View lesson rosters
- Teachers can view all school lessons and students

---

## Phase 1: Database Layer

### 1.1 Schema Verification (Already Complete)

The Prisma schema already has all necessary models defined:
- `Lesson` model with all required fields
- `LessonEnrollment` model for student-lesson relationships
- `HybridLessonPattern` model for hybrid lesson configuration
- `HybridBooking` model for parent bookings (Week 5)

**Files to reference:**
- `apps/backend/prisma/schema.prisma` (lines 486-595)

### 1.2 No Migration Required

The schema is already in place. No new migrations are needed for Week 4.

---

## Phase 2: Backend Service Layer

### 2.1 Create Lesson Service

**File:** `apps/backend/src/services/lesson.service.ts`

**Functions to implement:**

```typescript
// Types
interface CreateLessonInput {
  lessonTypeId: string;
  termId: string;
  teacherId: string;
  roomId: string;
  instrumentId?: string;
  name: string;
  description?: string;
  dayOfWeek: number;      // 0-6
  startTime: string;      // "HH:mm"
  endTime: string;        // "HH:mm"
  durationMins: number;
  maxStudents: number;
  isRecurring?: boolean;
  // For HYBRID lessons only:
  hybridPattern?: {
    patternType: 'ALTERNATING' | 'CUSTOM';
    groupWeeks: number[];
    individualWeeks: number[];
    individualSlotDuration: number;
    bookingDeadlineHours: number;
  };
}

// CRUD Operations
async function getLessons(schoolId: string, filters?: LessonFilters): Promise<LessonWithRelations[]>
async function getLesson(schoolId: string, lessonId: string): Promise<LessonWithRelations | null>
async function createLesson(schoolId: string, data: CreateLessonInput): Promise<LessonWithRelations>
async function updateLesson(schoolId: string, lessonId: string, data: UpdateLessonInput): Promise<LessonWithRelations>
async function deleteLesson(schoolId: string, lessonId: string): Promise<void>

// Enrollment Operations
async function enrollStudent(schoolId: string, lessonId: string, studentId: string): Promise<LessonEnrollment>
async function bulkEnrollStudents(schoolId: string, lessonId: string, studentIds: string[]): Promise<LessonEnrollment[]>
async function unenrollStudent(schoolId: string, lessonId: string, studentId: string): Promise<void>
async function getEnrollments(schoolId: string, lessonId: string): Promise<EnrollmentWithStudent[]>

// Validation Helpers
async function validateRoomAvailability(schoolId: string, roomId: string, dayOfWeek: number, startTime: string, endTime: string, excludeLessonId?: string): Promise<boolean>
async function validateTeacherAvailability(schoolId: string, teacherId: string, dayOfWeek: number, startTime: string, endTime: string, excludeLessonId?: string): Promise<boolean>
async function checkEnrollmentCapacity(schoolId: string, lessonId: string): Promise<{ current: number; max: number; available: number }>
```

**Multi-tenancy requirements:**
- ALL queries must include `schoolId` filter
- Validate that referenced IDs (teacherId, roomId, termId, instrumentId, lessonTypeId) belong to the same school
- Validate that studentIds being enrolled belong to the same school

**Pattern to follow:** `apps/backend/src/services/teacher.service.ts`

### 2.2 Create Lesson Validators

**File:** `apps/backend/src/validators/lesson.validators.ts`

```typescript
// Zod schemas to create:
export const createLessonSchema = z.object({
  lessonTypeId: z.string().uuid(),
  termId: z.string().uuid(),
  teacherId: z.string().uuid(),
  roomId: z.string().uuid(),
  instrumentId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  durationMins: z.number().int().min(15).max(180),
  maxStudents: z.number().int().min(1).max(30),
  isRecurring: z.boolean().default(true),
  // Hybrid pattern (conditional)
  hybridPattern: z.object({
    patternType: z.enum(['ALTERNATING', 'CUSTOM']),
    groupWeeks: z.array(z.number().int().min(1).max(15)),
    individualWeeks: z.array(z.number().int().min(1).max(15)),
    individualSlotDuration: z.number().int().min(15).max(60).default(30),
    bookingDeadlineHours: z.number().int().min(0).max(168).default(24),
  }).optional(),
});

export const updateLessonSchema = z.object({...});
export const enrollStudentSchema = z.object({ studentId: z.string().uuid() });
export const bulkEnrollStudentsSchema = z.object({ studentIds: z.array(z.string().uuid()).min(1).max(30) });
export const lessonFiltersSchema = z.object({
  termId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  instrumentId: z.string().uuid().optional(),
  lessonTypeId: z.string().uuid().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  isActive: z.boolean().optional(),
});
```

**Pattern to follow:** `apps/backend/src/validators/user.validators.ts`

---

## Phase 3: Backend API Layer

### 3.1 Create Lesson Routes

**File:** `apps/backend/src/routes/lessons.routes.ts`

**Endpoints to implement:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/lessons` | List all lessons with filters | Admin/Teacher |
| GET | `/lessons/:id` | Get single lesson with enrollments | Admin/Teacher |
| POST | `/lessons` | Create new lesson | Admin only |
| PATCH | `/lessons/:id` | Update lesson | Admin only |
| DELETE | `/lessons/:id` | Soft delete lesson | Admin only |
| GET | `/lessons/:id/enrollments` | Get enrolled students | Admin/Teacher |
| POST | `/lessons/:id/enrollments` | Enroll single student | Admin only |
| POST | `/lessons/:id/enrollments/bulk` | Bulk enroll students | Admin only |
| DELETE | `/lessons/:id/enrollments/:studentId` | Unenroll student | Admin only |

**Pattern to follow:** `apps/backend/src/routes/teachers.routes.ts`

**Authorization notes:**
- Teachers should be able to VIEW all lessons (for coverage)
- Only Admins can CREATE/UPDATE/DELETE lessons
- Only Admins can manage enrollments
- Use `teacherOrAdmin` middleware for read operations
- Use `adminOnly` middleware for write operations

### 3.2 Update Routes Index

**File:** `apps/backend/src/routes/index.ts`

Add the lesson routes:
```typescript
import lessonsRoutes from './lessons.routes';
// ...
router.use('/lessons', csrfProtection, lessonsRoutes);
```

---

## Phase 4: Frontend API Layer

### 4.1 Create Lessons API Client

**File:** `apps/frontend/src/api/lessons.api.ts`

```typescript
// Types
export interface Lesson {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMins: number;
  maxStudents: number;
  isRecurring: boolean;
  isActive: boolean;
  lessonType: LessonType;
  term: Term;
  teacher: { id: string; user: { firstName: string; lastName: string } };
  room: { id: string; name: string; location: { id: string; name: string } };
  instrument: Instrument | null;
  hybridPattern: HybridPattern | null;
  enrollments: Enrollment[];
  _count: { enrollments: number };
}

export interface Enrollment {
  id: string;
  enrolledAt: string;
  isActive: boolean;
  student: { id: string; firstName: string; lastName: string; ageGroup: string };
}

export interface HybridPattern {
  id: string;
  patternType: 'ALTERNATING' | 'CUSTOM';
  groupWeeks: number[];
  individualWeeks: number[];
  individualSlotDuration: number;
  bookingDeadlineHours: number;
  bookingsOpen: boolean;
}

// API functions
export const lessonsApi = {
  getAll: (filters?: LessonFilters) => apiClient.get<ApiResponse<Lesson[]>>('/lessons', { params: filters }).then(res => res.data),
  getById: (id: string) => apiClient.get<ApiResponse<Lesson>>(`/lessons/${id}`).then(res => res.data),
  create: (data: CreateLessonInput) => apiClient.post<ApiResponse<Lesson>>('/lessons', data).then(res => res.data),
  update: (id: string, data: UpdateLessonInput) => apiClient.patch<ApiResponse<Lesson>>(`/lessons/${id}`, data).then(res => res.data),
  delete: (id: string) => apiClient.delete<ApiResponse<void>>(`/lessons/${id}`),

  // Enrollments
  getEnrollments: (lessonId: string) => apiClient.get<ApiResponse<Enrollment[]>>(`/lessons/${lessonId}/enrollments`).then(res => res.data),
  enrollStudent: (lessonId: string, studentId: string) => apiClient.post<ApiResponse<Enrollment>>(`/lessons/${lessonId}/enrollments`, { studentId }).then(res => res.data),
  bulkEnroll: (lessonId: string, studentIds: string[]) => apiClient.post<ApiResponse<Enrollment[]>>(`/lessons/${lessonId}/enrollments/bulk`, { studentIds }).then(res => res.data),
  unenrollStudent: (lessonId: string, studentId: string) => apiClient.delete<ApiResponse<void>>(`/lessons/${lessonId}/enrollments/${studentId}`),
};
```

**Pattern to follow:** `apps/frontend/src/api/users.api.ts`

### 4.2 Create Lessons React Query Hooks

**File:** `apps/frontend/src/hooks/useLessons.ts`

```typescript
export const lessonKeys = {
  all: ['lessons'] as const,
  list: (filters?: LessonFilters) => [...lessonKeys.all, 'list', filters] as const,
  detail: (id: string) => [...lessonKeys.all, 'detail', id] as const,
  enrollments: (id: string) => [...lessonKeys.all, 'enrollments', id] as const,
};

// Queries
export function useLessons(filters?: LessonFilters)
export function useLesson(id: string)
export function useLessonEnrollments(lessonId: string)

// Mutations
export function useCreateLesson()
export function useUpdateLesson()
export function useDeleteLesson()
export function useEnrollStudent()
export function useBulkEnrollStudents()
export function useUnenrollStudent()
```

**Pattern to follow:** `apps/frontend/src/hooks/useUsers.ts`

---

## Phase 5: Frontend UI Layer

### 5.1 Create Lessons List Page

**File:** `apps/frontend/src/pages/admin/LessonsPage.tsx`

**Features:**
- DataTable showing all lessons with columns:
  - Name
  - Type (with colored chip: GROUP, INDIVIDUAL, BAND, HYBRID)
  - Day/Time
  - Duration
  - Teacher
  - Location/Room
  - Enrolled/Max
  - Status
- Filter dropdowns for: Term, Teacher, Room, Instrument, Lesson Type, Day
- "Add Lesson" button
- Edit/Delete actions
- Click to view lesson detail

**Pattern to follow:** `apps/frontend/src/pages/admin/TeachersPage.tsx`

### 5.2 Create Add/Edit Lesson Form Modal

**File:** Part of `LessonsPage.tsx` or separate `LessonFormModal.tsx`

**Form fields:**
- Name (text)
- Lesson Type (select from school's lesson types)
- Term (select)
- Teacher (select with instrument filter)
- Location + Room (cascading selects)
- Instrument (select)
- Day of Week (select: Mon-Sun)
- Start Time (time picker)
- Duration (select from school's durations, auto-calculates end time)
- Max Students (number)
- Description (textarea)

**For HYBRID type (conditional section):**
- Pattern Type (Alternating / Custom)
- Group Weeks selector (multi-select week numbers 1-10)
- Individual Weeks selector (multi-select)
- Individual Slot Duration (select: 30, 45 min)
- Booking Deadline Hours (number)

**Validation:**
- All required fields must be filled
- Conflict checking on submit (room/teacher availability)

### 5.3 Create Lesson Detail Page

**File:** `apps/frontend/src/pages/admin/LessonDetailPage.tsx`

**Sections:**
1. **Header:** Lesson name, type badge, edit button
2. **Details Card:** Day/time, duration, teacher, room, instrument, term, max students
3. **Hybrid Pattern Card (if HYBRID):** Pattern type, group weeks, individual weeks, slot duration
4. **Enrollment Card:**
   - List of enrolled students with: Name, Age Group, Enrolled Date, Actions (unenroll)
   - "Add Student" button → opens StudentEnrollmentModal
   - Current/Max indicator

### 5.4 Create Student Enrollment Modal

**File:** `apps/frontend/src/components/admin/StudentEnrollmentModal.tsx`

**Features:**
- Search students by name
- Filter by age group, family
- Show already-enrolled indicator (disabled)
- Multi-select checkboxes for bulk enrollment
- "Enroll Selected" button
- Show capacity warning when approaching max

### 5.5 Update Admin Layout Navigation

**File:** `apps/frontend/src/components/layout/AdminLayout.tsx`

Add to `navigationItems` array:
```typescript
{ divider: true },
{ label: 'Lessons', path: '/admin/lessons', icon: LibraryMusic },
```

### 5.6 Update App Routes

**File:** `apps/frontend/src/App.tsx`

Add routes:
```typescript
import LessonsPage from './pages/admin/LessonsPage';
import LessonDetailPage from './pages/admin/LessonDetailPage';
// ...
<Route path="lessons" element={<LessonsPage />} />
<Route path="lessons/:id" element={<LessonDetailPage />} />
```

---

## Phase 6: Integration and Testing

### 6.1 Manual Testing Checklist

**Lesson CRUD:**
- [ ] Create GROUP lesson - verify 60 min default
- [ ] Create INDIVIDUAL lesson - verify 45 min default
- [ ] Create BAND lesson - verify 60 min default
- [ ] Create HYBRID lesson with custom week pattern
- [ ] Edit lesson - verify updates persist
- [ ] Delete lesson - verify soft delete
- [ ] List lessons with filters working

**Enrollment:**
- [ ] Enroll single student
- [ ] Bulk enroll multiple students
- [ ] Verify max capacity enforcement
- [ ] Unenroll student
- [ ] Verify enrolled count updates

**Availability Validation:**
- [ ] Try creating lesson in occupied room slot - should fail
- [ ] Try creating lesson for busy teacher - should fail
- [ ] Verify editing respects same validation

**Multi-tenancy:**
- [ ] Login as different school admin - verify lessons are isolated
- [ ] Attempt to access lesson from another school via URL - should 404

**Teacher Access:**
- [ ] Login as teacher - verify can view all lessons
- [ ] Verify teacher cannot create/edit/delete lessons

### 6.2 Backend Integration Tests

**File:** `apps/backend/src/__tests__/lessons.test.ts`

Test cases:
- Create lesson with all types
- Create hybrid lesson with pattern
- Validate room/teacher conflicts
- Test enrollment operations
- Test bulk enrollment
- Test multi-tenancy isolation
- Test authorization (admin vs teacher)

---

## Phase 7: Documentation Updates

### 7.1 Update PROGRESS.md

Mark Week 4 tasks as complete/in-progress

### 7.2 Update TASKLIST.md

Check off completed items in Phase 3 section

---

## Task Breakdown Summary

| Phase | Task | Agent |
|-------|------|-------|
| 2.1 | Create lesson.service.ts | full-stack-developer |
| 2.2 | Create lesson.validators.ts | full-stack-developer |
| 3.1 | Create lessons.routes.ts | full-stack-developer |
| 3.2 | Update routes index | full-stack-developer |
| 4.1 | Create lessons.api.ts | full-stack-developer |
| 4.2 | Create useLessons.ts hooks | full-stack-developer |
| 5.1 | Create LessonsPage.tsx | full-stack-developer |
| 5.2 | Create lesson form modal | full-stack-developer |
| 5.3 | Create LessonDetailPage.tsx | full-stack-developer |
| 5.4 | Create StudentEnrollmentModal | full-stack-developer |
| 5.5-5.6 | Update navigation/routes | full-stack-developer |
| 6.1 | Manual testing | testing-qa-specialist |
| 6.2 | Integration tests | test-writer-fixer |

---

## Multi-Tenancy Security Checklist

All lesson service functions MUST include schoolId filtering:

1. **getLessons:** `where: { schoolId, ...filters }`
2. **getLesson:** `where: { id, schoolId }`
3. **createLesson:**
   - Verify lessonTypeId belongs to school
   - Verify termId belongs to school
   - Verify teacherId belongs to school
   - Verify roomId belongs to school
   - Verify instrumentId belongs to school (if provided)
4. **updateLesson:** `where: { id, schoolId }`
5. **deleteLesson:** `where: { id, schoolId }`
6. **enrollStudent:**
   - Verify lesson belongs to school
   - Verify student belongs to school
7. **bulkEnrollStudents:** Same as above for each student
8. **unenrollStudent:** `where: { lessonId, studentId }` + verify lesson.schoolId

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Room conflict logic complexity | Medium | High | Add comprehensive unit tests |
| Hybrid pattern validation | Medium | Medium | Clear UI feedback on week selection |
| Bulk enrollment performance | Low | Medium | Use Prisma createMany |
| Missing schoolId filter | Medium | Critical | Code review checklist |
| Calendar integration delay | Low | Low | Week 4 focus is CRUD, calendar is Week 5 |

---

## Integration Points

### Dependencies (Already Complete):
- Terms CRUD (Week 2) - required for termId
- Locations/Rooms CRUD (Week 2) - required for roomId
- Instruments CRUD (Week 2) - required for instrumentId
- Lesson Types CRUD (Week 2) - required for lessonTypeId
- Teachers CRUD (Week 2) - required for teacherId
- Students CRUD (Week 2) - required for enrollments

### Future Dependencies (Week 5+):
- Calendar view will consume lesson data
- Hybrid booking (Week 5) will use HybridLessonPattern
- Attendance (Week 6) will reference lessons
- Invoicing (Week 7) will calculate from enrollments

---

## Success Criteria

Week 4 is complete when:
1. Admin can create lessons of all 4 types (GROUP, INDIVIDUAL, BAND, HYBRID)
2. Hybrid lessons store correct week patterns
3. Correct durations are enforced by lesson type
4. Students can be enrolled/unenrolled
5. Bulk enrollment works
6. Room/teacher conflicts are detected and blocked
7. Teachers can view all lessons (read-only)
8. All queries filter by schoolId
9. Frontend provides clear feedback on all operations
10. All manual test cases pass

---

## Critical Files for Implementation

- **`apps/backend/src/services/teacher.service.ts`** - Pattern for service structure with multi-tenancy
- **`apps/backend/prisma/schema.prisma`** - Lesson, LessonEnrollment, HybridLessonPattern models (lines 486-595)
- **`apps/backend/src/validators/user.validators.ts`** - Pattern for Zod validation schemas
- **`apps/frontend/src/pages/admin/TeachersPage.tsx`** - Pattern for admin CRUD page with DataTable
- **`apps/frontend/src/hooks/useUsers.ts`** - Pattern for React Query hooks with cache invalidation
