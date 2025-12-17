# Drag-and-Drop Lesson Scheduling - Implementation Specification

## Overview

Drag-and-drop lesson rescheduling is a **Must Have** Phase 1 feature addressing the current pain point of manual scheduling. This document specifies the technical requirements, business logic, and implementation approach.

---

## Why This Matters

**Current Pain Point:**
- Schools manage schedules in spreadsheets or static systems
- Moving one lesson requires manual conflict checking
- Double-bookings happen easily
- Changes require manual notifications

**What We're Solving:**
- Visual calendar view of all lessons
- Instant drag-and-drop to new time
- Automatic conflict detection
- Automatic validation of teacher availability
- Instant notification to affected parties

---

## Architecture Overview

### Components

**Frontend:**
- Calendar UI library (FullCalendar.io or React Big Calendar)
- Real-time validation feedback
- Conflict warning dialogs
- Undo/revert functionality

**Backend:**
- Lesson validation service
- Conflict detection engine
- Teacher availability checker
- Change notification service

**Database:**
- Lesson records with start/end times
- Teacher availability patterns
- Recurrence rules for recurring lessons
- Change history/audit log

---

## Feature Specifications

### 1. Calendar Views

#### Admin Calendar
```
Shows: ALL lessons across entire school
Filter options:
  - By location (Main Studio, Downtown Branch)
  - By teacher
  - By lesson type (group, individual, hybrid)
  - By date range

Display: 
  - Week view (default)
  - Day view
  - Month view
  - Time grid 9am-6pm or custom range

Color coding:
  - Different colors by lesson type
  - Different shades by location
  - Greyed out = completed/past
```

#### Teacher Calendar
```
Shows: ONLY their own lessons
Filter options:
  - By location
  - By date range

Display:
  - Week view
  - Day view
  - Time grid showing their availability
```

#### Admin - By Location View
```
Shows: All lessons at specific location + rooms
Displays:
  - Room A: [Lesson 1] [Lesson 2] [Available]
  - Room B: [Lesson 3] [Available] [Lesson 4]
  - Room C: [Lesson 5] [Lesson 6] [Available]
```

### 2. Drag-and-Drop Interaction

#### Single Lesson Move

**User Action:**
```
1. Admin views calendar
2. Clicks and holds Piano Basics lesson (Thu 3pm)
3. Drags to new time (Tue 4pm, same week)
4. Releases mouse
```

**System Response:**
```
Step 1: Real-time validation during drag
- Show possible landing spots in green
- Show blocked spots in red
- Live feedback: "Available - Piano room, Tue 4pm"

Step 2: On drop, perform validation
- Is teacher available at new time?
- Is room available at new time?
- Are all students' schedules clear?
- Is this a reasonable reschedule?

Step 3: Confirmation dialog
"Reschedule Piano Basics?
 Thursday 3-4pm → Tuesday 4-5pm
 ✓ Teacher available
 ✓ Room available
 ⚠ 4 students will be notified
 [Reschedule] [Cancel]"

Step 4: Execute change
- Update lesson in database
- Send notifications
- Update calendar view
- Show success: "Rescheduled to Tuesday 4pm"
```

#### Recurring Lesson Move

**Special Handling for Recurring Lessons:**

```
User drags: "Piano Basics" (recurring every Thursday)
↓
Dialog appears:
"Piano Basics is a recurring lesson (every Thursday)
 How do you want to reschedule?
 
 ○ This occurrence only (Oct 19)
 ○ This and future occurrences (Oct 19 onwards)
 ○ All occurrences in series
 
 [Cancel] [Reschedule]"
```

### 3. Conflict Detection Engine

#### Validation Rules (in priority order)

**Rule 1: Teacher Double-Booking**
```javascript
function validateTeacherAvailability(
  teacherId: string,
  newStartTime: DateTime,
  newEndTime: DateTime,
  excludeLessonId: string  // Current lesson being moved
): ValidationResult {
  
  // Find all lessons for this teacher in the new time window
  const conflicts = await prisma.lesson.findMany({
    where: {
      instructorId: teacherId,
      id: { not: excludeLessonId },
      startTime: { lt: newEndTime },
      endTime: { gt: newStartTime }
    }
  });
  
  if (conflicts.length > 0) {
    return {
      valid: false,
      error: `Teacher is teaching another lesson at that time`,
      conflicts: conflicts.map(l => l.title)
    };
  }
  
  return { valid: true };
}
```

**Rule 2: Room Double-Booking**
```javascript
function validateRoomAvailability(
  roomId: string,
  newStartTime: DateTime,
  newEndTime: DateTime,
  excludeLessonId: string
): ValidationResult {
  
  // Find all lessons in this room at the new time
  const conflicts = await prisma.lesson.findMany({
    where: {
      roomId: roomId,
      id: { not: excludeLessonId },
      startTime: { lt: newEndTime },
      endTime: { gt: newStartTime }
    }
  });
  
  if (conflicts.length > 0) {
    return {
      valid: false,
      error: `Room is occupied at that time`,
      conflicts: conflicts.map(l => l.title)
    };
  }
  
  return { valid: true };
}
```

**Rule 3: Teacher Availability Hours**
```javascript
function validateTeacherHours(
  teacherId: string,
  newStartTime: DateTime,
  newEndTime: DateTime
): ValidationResult {
  
  // Get teacher's availability for this day of week
  const dayOfWeek = newStartTime.getDay();  // 0-6
  
  const availability = await prisma.teacherAvailability.findFirst({
    where: {
      teacherId: teacherId,
      dayOfWeek: dayOfWeek
    }
  });
  
  if (!availability) {
    return {
      valid: false,
      error: `Teacher is not available on ${getDayName(dayOfWeek)}`
    };
  }
  
  const newStart = timeToMinutes(newStartTime);
  const availStart = timeToMinutes(availability.startTime);
  const availEnd = timeToMinutes(availability.endTime);
  
  if (newStart < availStart || newStart >= availEnd) {
    return {
      valid: false,
      error: `Outside teacher's available hours (${availability.startTime}-${availability.endTime})`
    };
  }
  
  return { valid: true };
}
```

**Rule 4: Student Conflict (Optional - Phase 2)**
```
Note: In Phase 1, assume each student is typically in one lesson
In Phase 2, prevent a student from being double-booked
```

**Rule 5: Location Consistency (Optional)**
```
If moving between locations, verify room exists at new location
Warn if moving to different location (requires parent notification)
```

#### Validation Summary Response

```javascript
{
  valid: true,  // Overall result
  errors: [],   // Any blocking errors
  warnings: [
    "Different location - parents will be notified",
    "Moving from morning to afternoon - check parent preferences"
  ],
  affectedStudents: 4,
  affectedTeacher: "Maria Garcia",
  conflictingLessons: [],
  timestamp: "2024-10-15T14:30:00Z"
}
```

### 4. Notification System

#### When Lesson is Rescheduled

**Parents Notified:**
```
Email/App Notification:
Subject: Piano Basics Lesson Rescheduled
"Hi Sarah,

Emma's Piano Basics lesson has been rescheduled:

Old time: Thursday, October 19, 3:00 PM - 4:00 PM
New time: Tuesday, October 24, 4:00 PM - 5:00 PM

Location: Main Studio, Room A
Teacher: Maria Garcia

Updated schedule: [View]

If you have questions, contact: [school email]"
```

**Teachers Notified:**
```
Email/App Notification:
Subject: Your Lesson Schedule Updated
"Hi Maria,

One of your lessons has been rescheduled:

Lesson: Piano Basics
Old: Thursday 3-4pm
New: Tuesday 4-5pm
Students: Emma Johnson, Liam Chen, Sofia Rodriguez, Jackson Lee

You'll be teaching at: Main Studio, Room A

[View Updated Schedule]"
```

**Students Notified:**
```
For students old enough, send to their app/email:
"Piano Basics has been moved!
Thursday 3-4pm → Tuesday 4-5pm
Same teacher (Maria), same location"
```

### 5. Undo/Revert Functionality

#### Undo Recent Changes

```
Admin clicks: [↶ Undo] button (visible after reschedule)

System reverts:
- Lesson time returns to original
- All notifications sent again (revert notification)
- Change logged in audit trail

Undo available for: 5 minutes after change
(Can be extended in settings)
```

#### Change History/Audit Trail

```
Admin clicks: Lesson → [View History]

Shows:
Original time: Thursday 3-4pm (since Sept 1, 2024)
Change 1: Moved to Tuesday 4-5pm (Oct 15, 2024 by Admin Sarah)
Change 2: Moved to Friday 5-6pm (Oct 16, 2024 by Admin Sarah)
Current: Friday 5-6pm

[Revert to Thursday 3pm] [Revert to Tuesday 4pm]
```

### 6. Bulk Operations

#### Reschedule Recurring Lesson Series

**Scenario:** Piano Basics every Thursday, need to move entire month

```
Admin right-clicks: "Piano Basics" recurring lesson
Menu appears:
├─ Move This Occurrence
├─ Move Series
│  ├─ Move to different day (Thu → Tue)
│  ├─ Move to different time (3pm → 4pm)
│  └─ Move to different room
└─ View Occurrences

Select: "Move Series"
Dialog:
"Reschedule all occurrences of Piano Basics?
 Current: Every Thursday 3-4pm
 
 New day: [Thursday ▼]
 New time: [3:00 PM ▼]
 New room: [Room A ▼]
 
 Affected: 8 occurrences (Oct 5 - Nov 23)
 
 [Cancel] [Reschedule All]"
```

#### Batch Reschedule by Date Range

```
Admin selects: Week view
Selects date range: Oct 18-24
Right-click menu:
├─ Reschedule all lessons this week
│  └─ Move to: [Week of ▼] [Offset time: ▼]
├─ Cancel lessons this week
└─ Export schedule for this week
```

### 7. UI/UX Components

#### Calendar View (FullCalendar Example)

```html
<div class="calendar-header">
  <button>← Week</button>
  <h2>Schedule - Week of Oct 15-21</h2>
  <button>Week →</button>
  
  <div class="filters">
    <select>Location: [All ▼]</select>
    <select>Teacher: [All ▼]</select>
    <select>View: [Week ▼]</select>
  </div>
</div>

<div class="calendar-container">
  <!-- FullCalendar renders here -->
  <!-- Lessons are draggable -->
  <!-- Conflicts highlighted in red -->
  <!-- Available slots highlighted in green during drag -->
</div>

<div class="legend">
  ■ Group Class ■ Individual ■ Hybrid
  ■ Main Studio ■ Downtown ■ Conflict
</div>
```

#### Conflict Alert Dialog

```
╔════════════════════════════════════════╗
║  ⚠️ Cannot Move Lesson               ║
╠════════════════════════════════════════╣
║                                        ║
║  Piano Basics                          ║
║  Tuesday 4:00 PM - 5:00 PM            ║
║                                        ║
║  ✗ Teacher Not Available              ║
║    Maria is teaching "Violin Basics"   ║
║    at the same time                    ║
║                                        ║
║  Try these alternatives:               ║
║  • Tuesday 5:00 PM - 6:00 PM          ║
║  • Wednesday 4:00 PM - 5:00 PM        ║
║  • Friday 3:00 PM - 4:00 PM           ║
║                                        ║
║           [Close]                      ║
╚════════════════════════════════════════╝
```

#### Success Confirmation

```
╔════════════════════════════════════════╗
║  ✓ Lesson Rescheduled                 ║
╠════════════════════════════════════════╣
║                                        ║
║  Piano Basics                          ║
║  Thursday 3:00 PM → Tuesday 4:00 PM    ║
║                                        ║
║  ✓ Room A - Main Studio               ║
║  ✓ Teacher available                  ║
║  ✓ 4 parents notified                 ║
║                                        ║
║  [Undo]  [View Updated Schedule]      ║
╚════════════════════════════════════════╝
```

---

## Technical Implementation

### Backend API Endpoints

```
GET /api/calendar/lessons
  Query params: ?startDate=2024-10-15&endDate=2024-10-21&location=loc1&teacher=tea1
  Response: { lessons: Lesson[]; metadata: { totalCount, conflicts } }

GET /api/lessons/:lessonId
  Response: { lesson: Lesson; history: HistoryEntry[]; affectedStudents: Student[] }

POST /api/lessons/:lessonId/reschedule
  Body: {
    newStartTime: DateTime,
    newEndTime: DateTime,
    reason?: string,
    notifyParents?: boolean
  }
  Response: { 
    success: boolean,
    lesson: Lesson,
    notifications: { emailsSent: number, appNotificationsSent: number }
  }

POST /api/lessons/:lessonId/undo
  Response: { 
    success: boolean,
    lesson: Lesson,
    previousTime: { startTime, endTime }
  }

GET /api/lessons/:lessonId/conflicts
  Query params: ?startTime=2024-10-15T16:00:00Z&endTime=2024-10-15T17:00:00Z&roomId=room1
  Response: {
    hasConflicts: boolean,
    conflicts: {
      teacherConflicts: [],
      roomConflicts: [],
      studentConflicts: []
    }
  }

GET /api/teacher/:teacherId/availability
  Query params: ?dayOfWeek=2&startTime=09:00&endTime=18:00
  Response: { availability: TeacherAvailability[], availableSlots: TimeSlot[] }

POST /api/lessons/:lessonId/reschedule-series
  Body: {
    action: "move-all" | "move-future" | "move-this",
    recurrenceOption: { changeDay?: true, changTime?: true, newTime?: string },
    affectUntil?: DateTime
  }
  Response: { success: boolean, lessonsMoved: number, notificationsSent: number }
```

### Database Queries

```sql
-- Find conflicting lessons for a teacher
SELECT * FROM "Lesson"
WHERE "instructorId" = $1
AND "startTime" < $2  -- newEndTime
AND "endTime" > $3    -- newStartTime
AND id != $4          -- excludeLessonId
AND status != 'CANCELLED'
ORDER BY "startTime";

-- Find conflicting lessons in a room
SELECT * FROM "Lesson"
WHERE "roomId" = $1
AND "startTime" < $2
AND "endTime" > $3
AND id != $4
AND status != 'CANCELLED'
ORDER BY "startTime";

-- Get teacher availability for specific day
SELECT * FROM "TeacherAvailability"
WHERE "teacherId" = $1
AND "dayOfWeek" = $2
AND ("recurring" = true OR "validFrom" <= NOW() OR "validUntil" >= NOW());

-- Get all students enrolled in lesson
SELECT s.* FROM "Student" s
JOIN "Enrollment" e ON s.id = e."studentId"
WHERE e."lessonId" = $1
AND e.status = 'ACTIVE';
```

### Change Audit Log

```sql
-- New table
CREATE TABLE "LessonChangeHistory" (
  id UUID PRIMARY KEY,
  "lessonId" UUID NOT NULL REFERENCES "Lesson"(id),
  "changedBy" UUID NOT NULL REFERENCES "User"(id),
  
  "previousStartTime" TIMESTAMP NOT NULL,
  "previousEndTime" TIMESTAMP NOT NULL,
  "newStartTime" TIMESTAMP NOT NULL,
  "newEndTime" TIMESTAMP NOT NULL,
  
  reason TEXT,
  status VARCHAR(50),  -- 'active' or 'reverted'
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "revertedAt" TIMESTAMP
);
```

### State Management (Frontend)

```typescript
// Context or Redux store
interface ScheduleState {
  // Calendar data
  lessons: Lesson[];
  selectedDateRange: { start: Date; end: Date };
  selectedLocation?: string;
  selectedTeacher?: string;
  
  // Drag state
  isDragging: boolean;
  draggedLesson?: Lesson;
  proposedNewTime?: { start: Date; end: Date };
  validationResult?: ValidationResult;
  
  // Recent changes (for undo)
  recentChanges: LessonChange[];
  undoAvailable: boolean;
  
  // Loading/error
  loading: boolean;
  error?: string;
  success?: string;
}
```

---

## Implementation Timeline (Weeks 7-8)

### Week 7 - Backend Foundation

**Day 1-2:**
- ✅ Create LessonChangeHistory table migration
- ✅ Implement conflict detection service
- ✅ Implement teacher availability validation
- ✅ Create API endpoints (GET calendar, check conflicts)

**Day 3-4:**
- ✅ Implement reschedule endpoint with full validation
- ✅ Implement notification service integration
- ✅ Add audit logging

**Day 5:**
- ✅ Backend testing (conflict scenarios, edge cases)
- ✅ API documentation

### Week 8 - Frontend + Integration

**Day 1-2:**
- ✅ Install FullCalendar / React Big Calendar
- ✅ Create calendar component
- ✅ Implement drag-and-drop handlers

**Day 3-4:**
- ✅ Add real-time validation feedback
- ✅ Create conflict dialogs
- ✅ Implement success feedback

**Day 5:**
- ✅ Add undo functionality
- ✅ Full system testing
- ✅ Edge case handling (recurring lessons, time zones, etc.)

---

## Rollout & Safeguards

### Phase 1 Safeguards

```typescript
// Log all changes initially
AUDIT_LOG_ALL_RESCHEDULING = true;

// Require confirmation for all moves
REQUIRE_CONFIRMATION_ON_DRAG = true;

// Limit undo window
UNDO_AVAILABLE_FOR_MINUTES = 60;

// Notify on every change
NOTIFY_PARENTS_ON_RESCHEDULE = true;
NOTIFY_TEACHERS_ON_RESCHEDULE = true;

// Backup before production
DAILY_DATABASE_BACKUP = true;
```

### Testing Checklist

- [ ] Single lesson move (no conflicts)
- [ ] Teacher conflict detected
- [ ] Room conflict detected
- [ ] Teacher outside availability hours
- [ ] Undo functionality works
- [ ] Parent notifications sent
- [ ] Recurring lesson move (this, future, all)
- [ ] Bulk operations
- [ ] Time zone handling
- [ ] Permission checks (only admin can reschedule)

---

## Future Enhancements (Phase 2+)

- Visual availability heatmap (show busy/free times)
- AI-suggested reschedule times
- Automatic makeup lesson creation
- Mobile drag-and-drop
- Bulk reschedule wizard
- Integration with parent calendar (Google Calendar export)
- Lesson blocking (prevent changes in past, locked lessons)
- Batch import/export schedules
