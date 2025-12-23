# Week 6 Study: Attendance & Family Accounts

**Date:** 2025-12-23
**Status:** Research Complete
**Phase:** Phase 3 - Core Operations (Week 6 of 12)

---

## Overview

Week 6 focuses on **Attendance & Family Accounts**, the final week of Phase 3 (Core Operations). This week transitions from lesson setup to daily operations and parent experience management.

**Primary Goal:** Mark attendance, enable teacher notes per student AND per class, establish family accounts, and implement basic resource uploads.

**Timeline:** Week 6 of 12-week MVP (approximately Jan 2-9, 2025)

---

## Key Deliverables

### 1. Attendance System (Days 1-2)
- Mark attendance endpoint (present/absent/late/excused)
- Attendance history per student
- Attendance report per lesson
- Teacher attendance interface (frontend)
- **Teachers can mark attendance for ANY lesson** (coverage scenario)

### 2. Teacher Notes (Days 1-2) - CRITICAL
- **REQUIRED: Teacher notes per student AND per class**
- Individual student notes (progress, behavior, homework)
- Overall class notes (lesson summary, topics covered)
- Notes expected by end of day, MUST be completed by end of week
- **Notes do NOT block attendance saving** (show warning only)
- Note status tracking: PENDING → PARTIAL → COMPLETE

### 3. Family Accounts (Days 3-4)
- Family group creation
- Add multiple children to family
- Family schedule view (all children's lessons)
- Parent dashboard foundation

### 4. Teacher Dashboard (Day 5)
- Teacher view of ALL school lessons (not just assigned)
- Mark attendance interface for any lesson
- View all students (with search/filter)
- View weekly schedule

### 5. Resource Upload (Basic)
- File upload component (drag-and-drop)
- Validate file types (PDF, images, audio, video)
- Store files in local storage (Drive sync deferred to Week 8-9)
- Set visibility (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)
- Link resources to lessons or students

---

## Database Models (Already Defined)

### Attendance Model
```prisma
model Attendance {
  id            String           @id @default(uuid())
  lessonId      String
  studentId     String
  date          DateTime
  status        AttendanceStatus @default(PRESENT)
  absenceReason String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  lesson  Lesson  @relation(...)
  student Student @relation(...)

  @@unique([lessonId, studentId, date])
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
  CANCELLED
}
```

### Note Model
```prisma
model Note {
  id        String     @id @default(uuid())
  schoolId  String
  authorId  String
  lessonId  String?    // For class notes
  studentId String?    // For student notes
  date      DateTime   // Date the note refers to
  content   String
  status    NoteStatus @default(PENDING)
  isPrivate Boolean    @default(false)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  school  School   @relation(...)
  author  User     @relation(...)
  lesson  Lesson?  @relation(...)
  student Student? @relation(...)
}

enum NoteStatus {
  PENDING
  PARTIAL
  COMPLETE
}
```

### Family Model (Already Complete)
```prisma
model Family {
  id              String         @id @default(uuid())
  schoolId        String
  name            String
  primaryParentId String?
  deletionStatus  DeletionStatus @default(ACTIVE)
  deletedAt       DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  school   School    @relation(...)
  parents  Parent[]
  students Student[]
  invoices Invoice[]
}
```

---

## Already Implemented (From Previous Weeks)

### Family Management Backend (Week 2)
- `apps/backend/src/services/family.service.ts` - CRUD operations
- `apps/backend/src/routes/families.routes.ts` - API routes
- Full create/read/update/delete with parent/student management

### Family Management Frontend (Week 2)
- `apps/frontend/src/pages/admin/FamiliesPage.tsx` - Admin UI
- List families, add/edit/delete, view members

### All Prisma Models (Week 1)
- Attendance, Note, Family models defined
- NoteStatus enum (PENDING, PARTIAL, COMPLETE)
- AttendanceStatus enum

---

## Backend Implementation Required

### Attendance Service (`attendance.service.ts`)
**Estimated: ~300-400 lines**

```typescript
// Key functions:
- markAttendance(schoolId, lessonId, studentId, date, status, absenceReason?)
- getAttendanceByLesson(schoolId, lessonId, date)
- getAttendanceHistory(schoolId, studentId, options)
- updateAttendance(schoolId, attendanceId, updates)
- getAttendanceReport(schoolId, lessonId, startDate, endDate)
- calculateAttendanceRate(schoolId, studentId)
```

### Notes Service (`notes.service.ts`)
**Estimated: ~500-600 lines** - More complex due to deadline tracking

```typescript
// Key functions:
- createClassNote(schoolId, authorId, lessonId, date, content)
- createStudentNote(schoolId, authorId, studentId, lessonId?, date, content, isPrivate)
- getNotesByLesson(schoolId, lessonId, date)
- getNotesByStudent(schoolId, studentId, options)
- updateNote(schoolId, noteId, updates)
- deleteNote(schoolId, noteId)
- getLessonNoteStatus(schoolId, lessonId, date) // Returns PENDING/PARTIAL/COMPLETE
- getOverdueNotes(schoolId, teacherId?) // For admin monitoring
- getTeacherPendingNotes(schoolId, teacherId)

// Note completion logic:
// PENDING: No notes added
// PARTIAL: Class note OR student notes (not both)
// COMPLETE: Class note AND all student notes added
```

### Resources Service (`resources.service.ts`)
**Estimated: ~300-400 lines**

```typescript
// Key functions:
- uploadResource(schoolId, file, metadata)
- getResourcesByLesson(schoolId, lessonId)
- getResourcesByStudent(schoolId, studentId)
- deleteResource(schoolId, resourceId)
- updateResourceVisibility(schoolId, resourceId, visibility)
```

### API Routes Required
- `attendance.routes.ts` (~150 lines)
- `notes.routes.ts` (~150 lines)
- `resources.routes.ts` (~150 lines)

---

## Frontend Implementation Required

### Teacher Dashboard Page (`TeacherDashboardPage.tsx`)
**Estimated: ~800-1000 lines** - Largest component

Features:
- Today's schedule widget
- "My Classes" view (ALL school lessons, not just assigned)
- "All Students" view with search/filter
- Attendance marking interface
- Class notes editor
- Student notes editor
- Missing notes alerts
- Resource upload
- Weekly calendar view

### Components Required
```
components/
  attendance/
    AttendanceMarker.tsx (~400 lines)
    AttendanceView.tsx (~300 lines)
  notes/
    NoteEditor.tsx (~300 lines)
    StudentNotesList.tsx (~200 lines)
  resources/
    ResourceUploader.tsx (~300 lines)
    ResourceList.tsx (~200 lines)
```

### API Client & Hooks
```
api/
  attendance.api.ts (~150 lines)
  notes.api.ts (~150 lines)
  resources.api.ts (~150 lines)

hooks/
  useAttendance.ts (~200 lines)
  useNotes.ts (~200 lines)
  useResources.ts (~200 lines)
```

### Parent Dashboard (Foundation)
- `ParentDashboardPage.tsx` (~500 lines, basic structure)
- Family overview display
- Family schedule (calendar of all children's lessons)

---

## Critical Business Rules

### Teacher Notes Requirements
1. **Two Types of Notes Required:**
   - Class notes: One per lesson (lesson-level summary)
   - Student notes: One per student per lesson

2. **Completion Status Logic:**
   - PENDING: No notes added
   - PARTIAL: Either class note OR student notes (not both)
   - COMPLETE: BOTH class note AND all student notes

3. **Deadline Policy:**
   - Notes expected daily
   - MUST be completed by Sunday 11:59 PM (school timezone)
   - **NOT a blocker on attendance** - show warning, allow save
   - Track and report separately

4. **Reminder System:**
   - Friday 3 PM: Reminder email for incomplete notes
   - Sunday 6 PM: Final warning email
   - Monday 9 AM: Admin summary of overdue notes

### Teacher Dashboard Access
- Teachers can see and mark attendance for ANY lesson (coverage support)
- Teachers can see ALL students in school
- Not limited to assigned lessons

### Multi-Tenancy (CRITICAL)
**EVERY query must filter by schoolId:**
```typescript
// ✅ CORRECT
const attendance = await prisma.attendance.findMany({
  where: {
    lesson: { schoolId: req.user.schoolId },
    lessonId: lessonId
  }
});

// ❌ WRONG
const attendance = await prisma.attendance.findMany({
  where: { lessonId: lessonId }  // Missing schoolId!
});
```

---

## Dependencies from Previous Weeks

### Week 5 (CRITICAL)
- ✓ Hybrid booking service (1,214 lines)
- ✓ Calendar integration (react-big-calendar)
- ✓ CalendarPage (379 lines)
- ✓ HybridBookingPage (603 lines)

### Week 1-4
- ✓ Authentication & authorization
- ✓ Multi-tenancy middleware
- ✓ School/Term/Location/Room setup
- ✓ Teacher & student management
- ✓ Lesson management (all 4 types)
- ✓ Family management (backend + admin UI)
- ✓ Meet & Greet system

---

## File Locations Reference

### Backend (New Files)
```
apps/backend/src/
  services/
    attendance.service.ts (NEW)
    notes.service.ts (NEW)
    resources.service.ts (NEW)
  validators/
    attendance.validators.ts (NEW)
    notes.validators.ts (NEW)
    resources.validators.ts (NEW)
  routes/
    attendance.routes.ts (NEW)
    notes.routes.ts (NEW)
    resources.routes.ts (NEW)
    index.ts (MODIFY - add routes)
```

### Frontend (New Files)
```
apps/frontend/src/
  pages/
    teacher/TeacherDashboardPage.tsx (NEW)
    parent/ParentDashboardPage.tsx (NEW)
  components/
    attendance/ (NEW directory)
    notes/ (NEW directory)
    resources/ (NEW directory)
  api/
    attendance.api.ts (NEW)
    notes.api.ts (NEW)
    resources.api.ts (NEW)
  hooks/
    useAttendance.ts (NEW)
    useNotes.ts (NEW)
    useResources.ts (NEW)
```

---

## Success Criteria

- [ ] Teachers mark attendance for any lesson
- [ ] Attendance records created and retrievable
- [ ] Teacher notes per student AND per class (both required for completion)
- [ ] Notes deadline enforced (Sunday EOW, not blocking attendance)
- [ ] Family accounts fully functional (admin + parent UI)
- [ ] Family schedule shows all children's lessons
- [ ] Teacher dashboard shows all school lessons
- [ ] Resource upload working (basic, local storage)
- [ ] 100% multi-tenancy security (schoolId filtering)
- [ ] Integration tests passing (20+ tests)
- [ ] Brand compliant UI (colors, fonts, responsive)

---

## Estimated Effort

**Total: 4,000-5,500 lines**
- Backend: ~1,500-2,000 lines (services, routes, validators)
- Frontend: ~2,500-3,500 lines (pages, components, hooks, API client)
- Tests: ~500-700 lines

**Complexity:** MEDIUM
- Attendance: Simple (CRUD operations)
- Notes: Complex (deadline tracking, reminders, two types)
- Teacher Dashboard: Complex (integrating multiple features)
- Resources: Medium (file upload, storage, linking)

---

## Key References

1. `Planning/roadmaps/12_Week_MVP_Plan.md` - Lines 262-301 (Week 6 spec)
2. `Planning/roadmaps/Development_Task_List.md` - Lines 730-808 (detailed tasks)
3. `apps/backend/src/services/hybridBooking.service.ts` - Pattern reference (1,214 lines)
4. `apps/frontend/src/pages/parent/HybridBookingPage.tsx` - Complex component pattern (603 lines)
5. `apps/frontend/src/pages/admin/CalendarPage.tsx` - Frontend pattern (379 lines)
6. `CLAUDE.md` - Brand guidelines and teacher note requirements
