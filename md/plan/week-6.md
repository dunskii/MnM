# Week 6 Implementation Plan: Attendance, Teacher Notes, Family Accounts & Teacher Dashboard

**Date:** 2025-12-23
**Status:** Planning Complete
**Phase:** Phase 3 - Core Operations (Week 6 of 12)

---

## Executive Summary

Week 6 represents the final week of Phase 3 (Core Operations), focusing on five key features:

1. **Attendance System** - Mark attendance with statuses (PRESENT, ABSENT, LATE, EXCUSED, CANCELLED)
2. **Teacher Notes** - REQUIRED class notes AND student notes (expected daily, MUST complete by Sunday EOW)
3. **Family Accounts** - Parent-facing family management UI
4. **Teacher Dashboard** - Full school access view with attendance marking
5. **Resource Upload** - Basic file management (local storage; Drive sync deferred to Week 8-9)

This plan follows existing codebase patterns from `hybridBooking.service.ts` (1,214 lines), `lesson.service.ts` (976 lines), and frontend patterns from `HybridBookingPage.tsx` (603 lines).

---

## Phase 1: Backend - Attendance System

### 1.1 Validators (Day 1, Morning)

**File:** `apps/backend/src/validators/attendance.validators.ts`
**Estimated Lines:** ~150

**Schemas to implement:**
```typescript
- markAttendanceSchema (lessonId, studentId, date, status, absenceReason?)
- batchMarkAttendanceSchema (lessonId, date, attendances[])
- attendanceFiltersSchema (lessonId?, studentId?, startDate?, endDate?, status?)
- updateAttendanceSchema (status, absenceReason?)
- attendanceReportQuerySchema (lessonId, startDate?, endDate?)
```

**Key Validations:**
- AttendanceStatus enum: PRESENT, ABSENT, LATE, EXCUSED, CANCELLED
- Date must be valid ISO date string
- absenceReason required when status is ABSENT or EXCUSED
- UUID validation for lessonId, studentId

---

### 1.2 Attendance Service (Day 1, Afternoon)

**File:** `apps/backend/src/services/attendance.service.ts`
**Estimated Lines:** 300-400

**Functions to Implement:**
```typescript
// Core CRUD
export async function markAttendance(schoolId, data: MarkAttendanceInput): Promise<AttendanceWithRelations>
export async function batchMarkAttendance(schoolId, lessonId, date, attendances[]): Promise<AttendanceWithRelations[]>
export async function updateAttendance(schoolId, attendanceId, data): Promise<AttendanceWithRelations>
export async function getAttendance(schoolId, attendanceId): Promise<AttendanceWithRelations | null>

// Queries
export async function getAttendanceByLesson(schoolId, lessonId, filters?): Promise<AttendanceWithRelations[]>
export async function getAttendanceByStudent(schoolId, studentId, filters?): Promise<AttendanceWithRelations[]>
export async function getAttendanceByDate(schoolId, date): Promise<AttendanceWithRelations[]>

// Reports
export async function getAttendanceReport(schoolId, lessonId, startDate?, endDate?): Promise<AttendanceReport>
export async function getStudentAttendanceStats(schoolId, studentId): Promise<AttendanceStats>
```

**Types:**
```typescript
interface AttendanceWithRelations {
  id, lessonId, studentId, date, status, absenceReason, createdAt, updatedAt
  lesson: { name, teacher: { user: { firstName, lastName } } }
  student: { firstName, lastName, ageGroup }
}

interface MarkAttendanceInput {
  lessonId: string
  studentId: string
  date: Date
  status: AttendanceStatus
  absenceReason?: string
}

interface AttendanceReport {
  lessonId: string
  lessonName: string
  totalSessions: number
  studentStats: Array<{
    studentId: string
    studentName: string
    present: number
    absent: number
    late: number
    excused: number
    cancelled: number
    attendanceRate: number
  }>
}
```

**CRITICAL Security:**
- Every query MUST filter by `schoolId`
- Teachers can mark attendance for ANY lesson (coverage support)
- Verify student is enrolled in lesson before marking

---

### 1.3 Attendance Routes (Day 1, End of Day)

**File:** `apps/backend/src/routes/attendance.routes.ts`
**Estimated Lines:** 150-200

**Endpoints:**

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/attendance` | Teacher, Admin | Mark single attendance |
| POST | `/attendance/batch` | Teacher, Admin | Mark batch attendance for lesson |
| PATCH | `/attendance/:id` | Teacher, Admin | Update attendance record |
| GET | `/attendance/:id` | Teacher, Admin | Get single attendance |
| GET | `/attendance/lesson/:lessonId` | Teacher, Admin | Get attendance for lesson |
| GET | `/attendance/student/:studentId` | Teacher, Admin, Parent (own) | Get student attendance history |
| GET | `/attendance/lesson/:lessonId/report` | Teacher, Admin | Get attendance report |
| GET | `/attendance/student/:studentId/stats` | Teacher, Admin | Get student stats |
| GET | `/attendance/today` | Teacher, Admin | Get today's attendance for school |

---

## Phase 2: Backend - Teacher Notes System

### 2.1 Notes Validators (Day 2, Morning)

**File:** `apps/backend/src/validators/notes.validators.ts`
**Estimated Lines:** ~200

**Schemas:**
```typescript
// Create/Update
- createNoteSchema (lessonId?, studentId?, date, content, isPrivate?)
- updateNoteSchema (content?, status?, isPrivate?)

// Queries
- notesFiltersSchema (lessonId?, studentId?, authorId?, date?, status?, isPrivate?)
- noteCompletionQuerySchema (date, lessonId?)

// Status update
- updateNoteStatusSchema (status: PENDING | PARTIAL | COMPLETE)
```

**Business Rules:**
- A note MUST have either `lessonId` OR `studentId` (XOR validation)
- Class notes: `lessonId` set, `studentId` null
- Student notes: `studentId` set, `lessonId` optionally set (for context)
- `isPrivate` defaults to false (visible to parents)
- Content max length: 5000 characters

---

### 2.2 Notes Service (Day 2, Full Day)

**File:** `apps/backend/src/services/notes.service.ts`
**Estimated Lines:** 500-600

**Functions:**
```typescript
// CRUD
export async function createNote(schoolId, authorId, data): Promise<NoteWithRelations>
export async function updateNote(schoolId, noteId, data): Promise<NoteWithRelations>
export async function deleteNote(schoolId, noteId): Promise<void>
export async function getNote(schoolId, noteId): Promise<NoteWithRelations | null>

// Queries
export async function getNotesByLesson(schoolId, lessonId, filters?): Promise<NoteWithRelations[]>
export async function getNotesByStudent(schoolId, studentId, filters?): Promise<NoteWithRelations[]>
export async function getNotesByDate(schoolId, date, lessonId?): Promise<NoteWithRelations[]>
export async function getNotesByAuthor(schoolId, authorId, filters?): Promise<NoteWithRelations[]>

// Completion Status
export async function getLessonNoteCompletion(schoolId, lessonId, date): Promise<NoteCompletionStatus>
export async function getTeacherNoteCompletionSummary(schoolId, teacherId, weekStartDate): Promise<WeeklyCompletionSummary>
export async function getSchoolNoteCompletionSummary(schoolId, weekStartDate): Promise<SchoolCompletionSummary>

// Status Management
export async function calculateNoteStatus(schoolId, lessonId, date): Promise<NoteStatus>
export async function getIncompleteNotes(schoolId, beforeDate): Promise<IncompleteNoteSummary[]>
export async function getNotesNeedingReminders(schoolId): Promise<ReminderTarget[]>
```

**Types:**
```typescript
interface NoteWithRelations {
  id, schoolId, authorId, lessonId, studentId, date, content, status, isPrivate, createdAt, updatedAt
  author: { id, firstName, lastName }
  lesson?: { id, name, teacher: { user: { firstName, lastName } } }
  student?: { id, firstName, lastName, ageGroup }
}

interface NoteCompletionStatus {
  lessonId: string
  date: Date
  classNoteComplete: boolean
  studentNotesComplete: boolean
  enrolledStudentCount: number
  completedStudentNotes: number
  missingStudentNotes: Array<{ studentId, studentName }>
  status: NoteStatus // PENDING | PARTIAL | COMPLETE
}

interface WeeklyCompletionSummary {
  teacherId: string
  teacherName: string
  weekStartDate: Date
  lessons: Array<{
    lessonId: string
    lessonName: string
    dates: Array<{
      date: Date
      status: NoteStatus
    }>
  }>
  overallCompletionRate: number
}
```

**CRITICAL Business Rules:**
1. **Note status calculation:**
   - PENDING: No notes created
   - PARTIAL: Class note exists OR some student notes exist (but not all)
   - COMPLETE: Class note exists AND all enrolled students have notes

2. **Note completion NOT a blocker for attendance:**
   - Show warning in UI if notes incomplete
   - Do NOT prevent attendance saving

3. **Reminder schedule (implementation in Week 10 email):**
   - Friday 3PM: First reminder
   - Sunday 6PM: Urgent reminder
   - Monday 9AM: Admin summary of incomplete notes

---

### 2.3 Notes Routes (Day 2, End of Day)

**File:** `apps/backend/src/routes/notes.routes.ts`
**Estimated Lines:** 200-250

**Endpoints:**

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/notes` | Teacher, Admin | Create note |
| PATCH | `/notes/:id` | Teacher (author), Admin | Update note |
| DELETE | `/notes/:id` | Teacher (author), Admin | Delete note |
| GET | `/notes/:id` | Teacher, Admin, Parent (non-private) | Get single note |
| GET | `/notes/lesson/:lessonId` | Teacher, Admin | Get notes for lesson |
| GET | `/notes/student/:studentId` | Teacher, Admin, Parent (own child) | Get student notes |
| GET | `/notes/date/:date` | Teacher, Admin | Get all notes for date |
| GET | `/notes/lesson/:lessonId/completion` | Teacher, Admin | Get completion status |
| GET | `/notes/teacher/:teacherId/weekly` | Teacher (self), Admin | Get weekly summary |
| GET | `/notes/school/weekly` | Admin | Get school-wide summary |
| GET | `/notes/incomplete` | Admin | Get all incomplete notes |

**Access Control:**
- Parents can only see non-private notes for their children
- Teachers can only edit/delete their own notes
- Admins can manage all notes

---

## Phase 3: Backend - Resources System

### 3.1 Resources Validators (Day 3, Morning)

**File:** `apps/backend/src/validators/resources.validators.ts`
**Estimated Lines:** ~100

**Schemas:**
```typescript
- uploadResourceSchema (lessonId?, studentId?, visibility, tags[])
- updateResourceSchema (visibility?, tags?)
- resourceFiltersSchema (lessonId?, studentId?, visibility?, tags[]?)
```

**Visibility Enum:** ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY

---

### 3.2 Resources Service (Day 3, Afternoon)

**File:** `apps/backend/src/services/resources.service.ts`
**Estimated Lines:** 300-400

**Functions:**
```typescript
export async function uploadResource(schoolId, uploadedById, file, metadata): Promise<ResourceWithRelations>
export async function updateResource(schoolId, resourceId, data): Promise<ResourceWithRelations>
export async function deleteResource(schoolId, resourceId): Promise<void>
export async function getResource(schoolId, resourceId, userId, userRole): Promise<ResourceWithRelations | null>
export async function getResourcesByLesson(schoolId, lessonId, userId, userRole): Promise<ResourceWithRelations[]>
export async function getResourcesByStudent(schoolId, studentId, userId, userRole): Promise<ResourceWithRelations[]>
export async function downloadResource(schoolId, resourceId, userId, userRole): Promise<Buffer>
```

**Local File Storage:**
- Store files in `uploads/` directory (or DigitalOcean Spaces)
- Generate unique file paths: `{schoolId}/{lessonId|studentId}/{uuid}-{filename}`
- Track metadata in database
- Drive sync fields left null (for Week 8-9)

**Visibility Filtering:**
- ALL: Everyone can see
- TEACHERS_AND_PARENTS: Filter out students
- TEACHERS_ONLY: Filter out parents and students

---

### 3.3 Resources Routes (Day 3, End of Day)

**File:** `apps/backend/src/routes/resources.routes.ts`
**Estimated Lines:** 150

**Endpoints:**

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/resources` | Teacher, Admin | Upload resource |
| PATCH | `/resources/:id` | Teacher (uploader), Admin | Update metadata |
| DELETE | `/resources/:id` | Teacher (uploader), Admin | Delete resource |
| GET | `/resources/:id` | Based on visibility | Get resource metadata |
| GET | `/resources/:id/download` | Based on visibility | Download file |
| GET | `/resources/lesson/:lessonId` | Based on visibility | Get lesson resources |
| GET | `/resources/student/:studentId` | Based on visibility | Get student resources |

---

## Phase 4: Backend - Update Index Files

### 4.1 Update Services Index (Day 3)

**File:** `apps/backend/src/services/index.ts`

**Add exports:**
```typescript
export * as attendanceService from './attendance.service';
export * as notesService from './notes.service';
export * as resourcesService from './resources.service';
```

### 4.2 Update Routes Index (Day 3)

**File:** `apps/backend/src/routes/index.ts`

**Add routes:**
```typescript
import attendanceRoutes from './attendance.routes';
import notesRoutes from './notes.routes';
import resourcesRoutes from './resources.routes';

router.use('/attendance', csrfProtection, attendanceRoutes);
router.use('/notes', csrfProtection, notesRoutes);
router.use('/resources', csrfProtection, resourcesRoutes);
```

---

## Phase 5: Frontend - API Layer & Hooks

### 5.1 Attendance API (Day 4, Morning)

**File:** `apps/frontend/src/api/attendance.api.ts`
**Estimated Lines:** ~150

```typescript
export interface Attendance { ... }
export interface AttendanceFilters { ... }
export interface AttendanceReport { ... }

export const attendanceApi = {
  markAttendance: (data) => apiClient.post('/attendance', data),
  batchMarkAttendance: (lessonId, date, attendances) => apiClient.post('/attendance/batch', ...),
  updateAttendance: (id, data) => apiClient.patch(`/attendance/${id}`, data),
  getByLesson: (lessonId, filters?) => apiClient.get(`/attendance/lesson/${lessonId}`, ...),
  getByStudent: (studentId, filters?) => apiClient.get(`/attendance/student/${studentId}`, ...),
  getReport: (lessonId, startDate?, endDate?) => apiClient.get(`/attendance/lesson/${lessonId}/report`, ...),
  getStudentStats: (studentId) => apiClient.get(`/attendance/student/${studentId}/stats`),
};
```

---

### 5.2 Notes API (Day 4, Morning)

**File:** `apps/frontend/src/api/notes.api.ts`
**Estimated Lines:** ~200

```typescript
export interface Note { ... }
export interface NoteCompletionStatus { ... }
export interface WeeklyCompletionSummary { ... }

export const notesApi = {
  createNote: (data) => apiClient.post('/notes', data),
  updateNote: (id, data) => apiClient.patch(`/notes/${id}`, data),
  deleteNote: (id) => apiClient.delete(`/notes/${id}`),
  getNotesByLesson: (lessonId, filters?) => ...,
  getNotesByStudent: (studentId, filters?) => ...,
  getLessonCompletion: (lessonId, date) => ...,
  getTeacherWeeklySummary: (teacherId, weekStart) => ...,
};
```

---

### 5.3 Resources API (Day 4, Morning)

**File:** `apps/frontend/src/api/resources.api.ts`
**Estimated Lines:** ~120

```typescript
export interface Resource { ... }
export const resourcesApi = {
  upload: (formData) => apiClient.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => apiClient.patch(`/resources/${id}`, data),
  delete: (id) => apiClient.delete(`/resources/${id}`),
  getByLesson: (lessonId) => ...,
  getByStudent: (studentId) => ...,
  download: (id) => apiClient.get(`/resources/${id}/download`, { responseType: 'blob' }),
};
```

---

### 5.4 React Query Hooks (Day 4, Afternoon)

**Files:**
- `apps/frontend/src/hooks/useAttendance.ts` (~150 lines)
- `apps/frontend/src/hooks/useNotes.ts` (~200 lines)
- `apps/frontend/src/hooks/useResources.ts` (~120 lines)

**Pattern (following useHybridBooking.ts):**
```typescript
export const attendanceKeys = {
  all: ['attendance'] as const,
  byLesson: (lessonId) => [...attendanceKeys.all, 'lesson', lessonId],
  byStudent: (studentId) => [...attendanceKeys.all, 'student', studentId],
  report: (lessonId) => [...attendanceKeys.all, 'report', lessonId],
};

export function useAttendanceByLesson(lessonId, filters?) {
  return useQuery({
    queryKey: attendanceKeys.byLesson(lessonId),
    queryFn: () => attendanceApi.getByLesson(lessonId, filters),
    enabled: !!lessonId,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data) => attendanceApi.markAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      enqueueSnackbar('Attendance marked successfully', { variant: 'success' });
    },
  });
}
```

---

## Phase 6: Frontend - Components

### 6.1 Attendance Components (Day 4, End of Day)

**File:** `apps/frontend/src/components/attendance/AttendanceMarker.tsx`
**Estimated Lines:** ~300

**Features:**
- Display enrolled students for a lesson
- Status selector (PRESENT, ABSENT, LATE, EXCUSED, CANCELLED)
- Absence reason input (required for ABSENT/EXCUSED)
- Batch save button
- Warning indicator if notes incomplete (NOT blocking)
- Visual feedback (chips with brand colors)

---

**File:** `apps/frontend/src/components/attendance/AttendanceView.tsx`
**Estimated Lines:** ~200

**Features:**
- Table view of attendance history
- Filter by date range, status
- Attendance statistics summary

---

### 6.2 Notes Components (Day 5, Morning)

**File:** `apps/frontend/src/components/notes/NoteEditor.tsx`
**Estimated Lines:** ~350

**Features:**
- Rich text or plain text editor for notes
- Toggle between class note / student notes
- Auto-save indicator
- Private/public toggle
- Character count
- Note completion status indicator

---

**File:** `apps/frontend/src/components/notes/StudentNotesList.tsx`
**Estimated Lines:** ~200

**Features:**
- List all notes for a student (parent view)
- Filter by date, lesson
- Note preview cards
- Hide private notes from parents

---

### 6.3 Resource Components (Day 5, Afternoon)

**File:** `apps/frontend/src/components/resources/ResourceUploader.tsx`
**Estimated Lines:** ~250

**Features:**
- Drag-and-drop file upload
- File type restrictions (docs, images, audio, video)
- Max size validation (25MB)
- Visibility selector
- Upload progress indicator
- Link to lesson or student

---

**File:** `apps/frontend/src/components/resources/ResourceList.tsx`
**Estimated Lines:** ~200

**Features:**
- Grid/list view toggle
- File type icons
- Download button
- Visibility badge
- Delete button (for author/admin)

---

## Phase 7: Frontend - Pages

### 7.1 Teacher Dashboard Page (Day 5, Full Day Focus)

**File:** `apps/frontend/src/pages/teacher/TeacherDashboardPage.tsx`
**Estimated Lines:** 800-1000

**Layout Structure:**
```tsx
<Box>
  <PageHeader title="Teacher Dashboard" />

  <Grid container spacing={3}>
    {/* Today's Lessons Card */}
    <Grid item xs={12} md={8}>
      <TodayLessonsCard lessons={todayLessons} onMarkAttendance={openModal} />
    </Grid>

    {/* Quick Stats Card */}
    <Grid item xs={12} md={4}>
      <WeeklyStatsCard stats={weeklyStats} />
    </Grid>

    {/* Full School Lessons */}
    <Grid item xs={12}>
      <AllSchoolLessonsTable lessons={allLessons} />
    </Grid>

    {/* Note Completion Warnings */}
    {incompleteNotes.length > 0 && (
      <Alert severity="warning">
        You have {incompleteNotes.length} lessons with incomplete notes.
      </Alert>
    )}
  </Grid>

  {/* Attendance Modal */}
  <AttendanceModal open={modalOpen} lessonId={selectedId} date={selectedDate} />
</Box>
```

**Key Features:**
- Shows ALL school lessons (not just teacher's own)
- Mark attendance for ANY lesson (coverage support)
- Notes editor integrated with attendance
- Weekly note completion progress
- Warning alerts for incomplete notes

---

### 7.2 Parent Dashboard Page (Day 5, Afternoon)

**File:** `apps/frontend/src/pages/parent/ParentDashboardPage.tsx`
**Estimated Lines:** ~500

**Layout Structure:**
```tsx
<Box>
  <PageHeader title="Family Dashboard" />

  <Grid container spacing={3}>
    {/* Children Overview */}
    <Grid item xs={12}>
      <ChildrenCards children={children} />
    </Grid>

    {/* Combined Schedule */}
    <Grid item xs={12} md={8}>
      <FamilyScheduleCalendar children={children} />
    </Grid>

    {/* Upcoming Lessons */}
    <Grid item xs={12} md={4}>
      <UpcomingLessonsList lessons={upcomingLessons} />
    </Grid>

    {/* Hybrid Booking CTA */}
    {hasHybridLessons && <HybridBookingAlert />}

    {/* Recent Notes */}
    <Grid item xs={12}>
      <RecentTeacherNotes studentIds={childIds} />
    </Grid>
  </Grid>
</Box>
```

---

## Phase 8: Testing

### 8.1 Integration Tests (Day 5, Final Hour)

**File:** `apps/backend/tests/integration/attendance.test.ts`

**Test Cases (~20 tests):**
```
Attendance Endpoints:
  POST /attendance
    - should mark attendance for enrolled student
    - should require teacher or admin role
    - should validate attendance status
    - should require absenceReason for ABSENT status
    - should reject for non-enrolled student
    - should filter by schoolId (multi-tenancy)

  POST /attendance/batch
    - should mark attendance for multiple students
    - should handle partial failures gracefully

  GET /attendance/lesson/:lessonId
    - should return all attendance for lesson
    - should filter by date range
    - should filter by schoolId
```

**File:** `apps/backend/tests/integration/notes.test.ts`

**Test Cases (~25 tests):**
```
Notes Endpoints:
  POST /notes
    - should create class note
    - should create student note
    - should require lessonId or studentId

  GET /notes/lesson/:lessonId/completion
    - should return PENDING when no notes
    - should return PARTIAL when only class note
    - should return COMPLETE when all notes present

  Note Visibility:
    - teacher should see private notes
    - parent should not see private notes
```

---

## Implementation Sequence

### Day 1: Attendance Backend
1. Create `attendance.validators.ts`
2. Create `attendance.service.ts`
3. Create `attendance.routes.ts`
4. Update `routes/index.ts`
5. Test with Postman/curl

### Day 2: Notes Backend
1. Create `notes.validators.ts`
2. Create `notes.service.ts` (most complex)
3. Create `notes.routes.ts`
4. Update `routes/index.ts`
5. Test note completion logic

### Day 3: Resources Backend + Integration
1. Create `resources.validators.ts`
2. Create `resources.service.ts`
3. Create `resources.routes.ts`
4. Update `services/index.ts`
5. Configure multer for file uploads

### Day 4: Frontend API Layer
1. Create all API files
2. Create all hooks files
3. Create attendance components
4. Begin notes components

### Day 5: Frontend Pages + Testing
1. Complete notes components
2. Create resource components
3. Create TeacherDashboardPage
4. Create ParentDashboardPage
5. Run integration tests

---

## Multi-Tenancy Security Checklist

Every service function MUST include schoolId filtering:

| Service | Function | schoolId Filter Required |
|---------|----------|-------------------------|
| attendance | markAttendance | Yes - verify lesson belongs to school |
| attendance | getAttendanceByLesson | Yes - filter lessons |
| attendance | getAttendanceByStudent | Yes - filter students |
| notes | createNote | Yes - store with schoolId |
| notes | getNotesByLesson | Yes - filter lessons |
| notes | getNotesByStudent | Yes - filter by school |
| resources | uploadResource | Yes - store with schoolId |
| resources | getResourcesByLesson | Yes - filter lessons |
| resources | getResourcesByStudent | Yes - filter students |

---

## Success Criteria

| Feature | Acceptance Criteria |
|---------|---------------------|
| Attendance marking | Teachers can mark PRESENT/ABSENT/LATE/EXCUSED/CANCELLED for any lesson |
| Batch attendance | Teachers can mark all students at once |
| Attendance history | Can view attendance by lesson or student |
| Attendance reports | Statistics calculated correctly |
| Class notes | Teachers can create/edit class notes |
| Student notes | Teachers can create/edit per-student notes |
| Note completion | Status correctly shows PENDING/PARTIAL/COMPLETE |
| Note privacy | Private notes hidden from parents |
| Resource upload | Files upload successfully to local storage |
| Resource visibility | Visibility rules enforced correctly |
| Teacher dashboard | Shows ALL school lessons |
| Teacher coverage | Can mark attendance for any lesson |
| Parent dashboard | Shows family schedule |
| Multi-tenancy | 100% schoolId filtering |
| Tests | All integration tests pass |

---

## Agent Assignments

| Task | Recommended Agent | Rationale |
|------|-------------------|-----------|
| Backend services | `full-stack-developer` | Complex service logic |
| Backend routes/validators | `full-stack-developer` | Standard patterns |
| Frontend API layer | `frontend-developer` | Follow existing patterns |
| Frontend components | `frontend-developer` | React + MUI |
| TeacherDashboardPage | `full-stack-developer` | Complex page |
| Integration tests | `testing-qa-specialist` | Comprehensive coverage |
| Multi-tenancy review | `multi-tenancy-enforcer` | Security audit |
| QA review | Run `/qa` skill | Final quality check |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Note completion logic complexity | Start with simple rules, iterate |
| File upload security | Validate file types, size limits |
| Teacher coverage permission bugs | Extensive testing with different roles |
| Note reminder timing | Defer email sending to Week 10 |
| Resource storage costs | Implement file size limits (25MB) |

---

## Critical Files for Implementation

1. **`apps/backend/src/services/notes.service.ts`** - Core business logic for teacher notes including completion status calculation (most complex new service)

2. **`apps/frontend/src/pages/teacher/TeacherDashboardPage.tsx`** - Main teacher interface combining attendance marking, notes editing, and full school view (largest new frontend file)

3. **`apps/backend/src/services/hybridBooking.service.ts`** - Reference implementation pattern for service layer

4. **`apps/frontend/src/pages/parent/HybridBookingPage.tsx`** - Reference for complex React Query state management

5. **`apps/backend/prisma/schema.prisma`** - Contains Attendance, Note, and Resource models

---

## Estimated Total Lines

- **Backend:** ~1,500-2,000 lines (services, routes, validators)
- **Frontend:** ~2,500-3,500 lines (pages, components, hooks, API client)
- **Tests:** ~500-700 lines
- **Total:** ~4,500-6,200 lines
