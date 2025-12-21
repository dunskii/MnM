# Enrollment Workflow Specification

## Overview

The enrollment system has two distinct workflows:

1. **Group Lesson Assignment** - Admin/Teacher assigns students to group classes
2. **1-on-1 Booking** - Parents book individual sessions during hybrid cycle periods

---

## Group Lesson Assignment Workflow

### Who: School Administrators or Teachers

### When: 
- When setting up new group classes
- During class management (add/remove students)
- Beginning of term/semester

### Process:

#### Step 1: View Available Students
```
Admin Dashboard → Lessons → Select Group Lesson
→ "Manage Enrollments" button
→ Shows: All students in school with skill level & instrument
```

#### Step 2: Filter Students
Admin can filter by:
- Instrument (Piano, Violin, Flute, etc.)
- Skill Level (Beginner, Intermediate, Advanced, etc.)
- Age range (optional)
- Current enrollment status (not enrolled, already enrolled elsewhere)

#### Step 3: Assign Students to Group
- Select students from filtered list (checkbox selection)
- Bulk action: "Assign to this lesson"
- System confirmation: "Enroll 4 students in Piano Basics?"
- Success: Students now enrolled with status = ACTIVE

#### Step 4: Notify Parents (Optional/Auto)
- System can auto-send notification: "Emma has been enrolled in Piano Basics, Thursdays 3pm"
- Or admin manually sends notification

#### Step 5: Remove Students (if needed)
- Admin can unenroll students from group
- Options: "Unenroll" (removes from active class) or "Drop" (marks as dropped)
- Parent is notified of change

### Database Operations:

```typescript
// Create enrollments for group lesson
async function assignStudentsToGroupLesson(
  lessonId: string,
  studentIds: string[]
): Promise<Enrollment[]> {
  return prisma.enrollment.createMany({
    data: studentIds.map(studentId => ({
      lessonId,
      studentId,
      status: 'ACTIVE',
      enrolledAt: new Date()
    }))
  });
}

// Unenroll student from group
async function unenrollStudentFromLesson(
  lessonId: string,
  studentId: string
): Promise<Enrollment> {
  return prisma.enrollment.update({
    where: {
      lessonId_studentId: { lessonId, studentId }
    },
    data: {
      status: 'UNENROLLED',
      unenrolledAt: new Date()
    }
  });
}
```

### Validation Rules:

- ✅ Cannot enroll same student twice in same lesson (unique constraint)
- ✅ Cannot exceed max group size (check `lesson.maxStudents`)
- ✅ Can only enroll students from same school
- ✅ Cannot enroll student already in conflicting time slot (optional - enforce in Phase 2)
- ✅ Student must exist and have active profile

---

## 1-on-1 Hybrid Booking Workflow

### Who: Parents/Family Members

### When: 
- Only during designated "1-on-1 booking weeks" in hybrid cycle
- Parents notified when booking period opens

### How System Detects Booking Period:

```typescript
function isOneOnOneBookingPeriod(lesson: Lesson): boolean {
  if (!lesson.isHybrid || !lesson.hybridConfig) {
    return false;
  }

  // Calculate which week of the cycle we're in
  const daysSinceStart = 
    (Date.now() - lesson.hybridConfig.cycleStartDate.getTime()) / 
    (24 * 60 * 60 * 1000);
  
  const weeksSinceStart = Math.floor(daysSinceStart / 7);
  const currentCycleWeek = (weeksSinceStart % lesson.hybridConfig.cycleLength) + 1;
  
  // Check if current week is a 1-on-1 booking week
  return lesson.hybridConfig.oneOnOneWeeks.includes(currentCycleWeek);
}
```

### Process:

#### Step 1: System Detects Booking Period
- Scheduled job or real-time check detects: "This is week 4 of 8-week cycle"
- System checks: "Week 4 is in oneOnOneWeeks [4, 8]? YES"
- System action: "Activate 1-on-1 booking for this hybrid lesson"

#### Step 2: Parents Notified
- Notification to all parents with children enrolled in this group:
  ```
  "1-on-1 Booking Open: Piano Basics
   Your child has group piano on Thursdays, but this week (Oct 18-24) 
   is a 1-on-1 session week. Book a 30-min slot with Maria below.
   Available times: Mon 2pm, Mon 3pm, Tue 4pm, Wed 3:30pm"
  ```

#### Step 3: Parent Views Available Slots
```
Parent Dashboard → My Child → Piano Basics → "Book 1-on-1 Session"
→ Shows: Calendar with available time slots for that week
→ Shows: Teacher availability + existing bookings
```

#### Step 4: Parent Selects and Books
- Parent clicks available time slot
- System shows: "Book with Maria - Monday, October 19 at 2:00 PM - 2:30 PM"
- Parent confirms booking
- System creates new individual lesson entry (or enrollment record)
- Confirmation shown: "Booked! See your updated schedule"

#### Step 5: Optional - Parent Doesn't Book
- Booking period passes without parent booking
- Child has no lesson this week (or admin decides on makeup/default)
- Next week: Group class resumes

### Database Operations:

```typescript
// Get available 1-on-1 slots for a hybrid lesson during booking week
async function getAvailableOneOnOneSlots(
  hybridLessonId: string,
  bookingWeekStartDate: Date
): Promise<AvailableSlot[]> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: hybridLessonId },
    include: { hybridConfig: true, instructor: true }
  });

  if (!lesson?.isHybrid) return [];

  // Get teacher availability for that week
  const availability = await prisma.teacherAvailability.findMany({
    where: {
      teacherId: lesson.instructorId,
      // Recurring availability that applies to this week
    }
  });

  // Get already booked 1-on-1 slots that week
  const bookedSlots = await prisma.lesson.findMany({
    where: {
      instructorId: lesson.instructorId,
      isIndividual: true,
      startTime: {
        gte: bookingWeekStartDate,
        lt: new Date(bookingWeekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  // Calculate available slots based on:
  // - Teacher availability
  // - Lesson duration (typically 30-60 min)
  // - Already booked slots
  return calculateAvailableSlots(availability, bookedSlots, lesson.duration);
}

// Create 1-on-1 enrollment during booking period
async function bookOneOnOneSession(
  groupLessonId: string,
  studentId: string,
  selectedTimeSlot: { startTime: Date; endTime: Date }
): Promise<{ lesson: Lesson; enrollment: Enrollment }> {
  const groupLesson = await prisma.lesson.findUnique({
    where: { id: groupLessonId },
    include: { hybridConfig: true }
  });

  if (!groupLesson?.isHybrid) {
    throw new Error('Not a hybrid lesson');
  }

  // Verify it's a booking week
  if (!isOneOnOneBookingPeriod(groupLesson)) {
    throw new Error('Not a 1-on-1 booking week');
  }

  // Create individual lesson for this slot
  const oneOnOneLesson = await prisma.lesson.create({
    data: {
      title: `${groupLesson.title} - 1-on-1`,
      description: `Individual session from group: ${groupLesson.title}`,
      type: 'INDIVIDUAL',
      schoolId: groupLesson.schoolId,
      instructorId: groupLesson.instructorId,
      locationId: groupLesson.locationId,
      roomId: groupLesson.roomId,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      duration: groupLesson.duration,
      isIndividual: true,
      pricePerStudent: groupLesson.hybridConfig?.oneOnOnePricePerStudent 
                       || groupLesson.pricePerStudent,
      status: 'SCHEDULED'
    }
  });

  // Create enrollment linking student to this 1-on-1
  const enrollment = await prisma.enrollment.create({
    data: {
      lessonId: oneOnOneLesson.id,
      studentId,
      schoolId: groupLesson.schoolId,
      status: 'ACTIVE'
    }
  });

  return { lesson: oneOnOneLesson, enrollment };
}
```

### UI Mockup - Parent Booking View:

```
═══════════════════════════════════════════════════════════
  PIANO BASICS - 1-ON-1 BOOKING WEEK
═══════════════════════════════════════════════════════════

📅 Your group class is paused this week. Book your 1-on-1 session:

AVAILABLE SLOTS (Week of Oct 18-24)
─────────────────────────────────────

☐ Monday, Oct 19
   [14:00 - 14:30] Available ✓
   [15:00 - 15:30] Available ✓
   [16:00 - 16:30] Booked ✗

☐ Tuesday, Oct 20
   [14:00 - 14:30] Available ✓
   [16:00 - 16:30] Available ✓

☐ Wednesday, Oct 21
   [15:30 - 16:00] Available ✓
   [16:30 - 17:00] Available ✓

☐ Thursday, Oct 22
   (Regular group class day - no 1-on-1 available)

[SELECT SLOT] [CLOSE]
```

### UI Mockup - Admin Management View:

```
═══════════════════════════════════════════════════════════
  PIANO BASICS - MANAGE ENROLLMENTS
═══════════════════════════════════════════════════════════

📋 Group Lesson: Piano Basics, Thursdays 3pm
📍 Location: Main Studio, Room A
👨‍🏫 Teacher: Maria Garcia
👥 Max Students: 4

CURRENT ENROLLMENTS
─────────────────────────────────────
☑ Emma Johnson    | Level: Beginner | Instrument: Piano | [Remove]
☑ Liam Chen       | Level: Beginner | Instrument: Piano | [Remove]
☑ Sofia Rodriguez | Level: Beginner | Instrument: Piano | [Remove]
☑ Jackson Lee    | Level: Beginner | Instrument: Piano | [Remove]

[4 / 4 SLOTS FULL]

ADD MORE STUDENTS
─────────────────────────────────────
Filter by:
  Instrument: [Piano ▼]
  Level: [Beginner ▼]
  Status: [Not Yet Enrolled ▼]

AVAILABLE STUDENTS:
  ☐ Ava Martinez   | Level: Beginner | Instrument: Piano
  ☐ Noah Williams  | Level: Beginner | Instrument: Piano
  ☐ Olivia Brown   | Level: Intermediate | Instrument: Piano

[ASSIGN SELECTED] [CLOSE]
```

---

## Key Differences from Phase 2

### Current (MVP) - Admin-Controlled:
- Group assignments are admin-only
- Parents can only see what's assigned
- Parents can only book during 1-on-1 periods

### Future (Phase 2) - More Flexible:
- Parents might request group transfers (with approval)
- Parents might see "recommended groups" based on level
- Waiting lists for popular groups
- Self-service group selection for certain lesson types

---

## Validation & Business Rules

### Group Assignment Rules:
1. ✅ Student cannot be enrolled in same group twice
2. ✅ Student cannot be in conflicting group times (same teacher, overlapping)
3. ✅ Cannot exceed group size maximum
4. ✅ Student must be from same school
5. ✅ Instrument/level should match group requirements (enforced by admin judgment)

### 1-on-1 Booking Rules:
1. ✅ Can only book during designated booking weeks
2. ✅ Can only book with instructor from their group lesson
3. ✅ Can only book available slots (no double-booking)
4. ✅ Booking duration matches lesson duration
5. ✅ Cannot have overlapping 1-on-1 bookings
6. ✅ Student must still be actively enrolled in the parent group lesson

### Payment Implications:
- Group lessons: Payment per cycle (admin invoices family)
- 1-on-1 sessions: Can be add-on fees or included in hybrid rate
- Pricing configured in `hybridConfig.oneOnOnePricePerStudent`

---

## API Endpoints Required

### Admin: Manage Group Enrollments

```
POST /api/lessons/:lessonId/enrollments/bulk
Body: { studentIds: string[] }
Response: { created: Enrollment[]; lesson: Lesson }

DELETE /api/enrollments/:enrollmentId
Response: { success: boolean }

GET /api/lessons/:lessonId/enrollments
Response: { enrollments: Enrollment[]; lesson: Lesson }

GET /api/students?filter[instrument]=Piano&filter[level]=Beginner
Response: { students: Student[] }
```

### Parent: Book 1-on-1 Sessions

```
GET /api/lessons/:hybridLessonId/one-on-one-slots?week=2024-10-18
Response: { availableSlots: AvailableSlot[] }

POST /api/lessons/:hybridLessonId/one-on-one-book
Body: { studentId: string; slotStartTime: DateTime; slotEndTime: DateTime }
Response: { lesson: Lesson; enrollment: Enrollment }

GET /api/my-child/:studentId/lessons
Response: { lessons: Lesson[] } // Shows both group and booked 1-on-1s
```

---

## Testing Scenarios

### Scenario 1: Admin Assigns 4 Students to Piano Group
1. Admin selects Piano Basics group lesson
2. Filters: Beginner, Piano instrument
3. Selects: Emma, Liam, Sofia, Jackson
4. Clicks "Assign to Lesson"
5. Verify: 4 enrollments created with status ACTIVE
6. Verify: System prevents 5th student from enrolling (max 4)

### Scenario 2: Parent Books During Hybrid Week
1. System detects: Current date is week 4 of 8 (cycle start Sept 1)
2. Hybrid config oneOnOneWeeks = [4, 8]
3. Parent logs in, sees notification: "1-on-1 Booking Open"
4. Parent clicks "Book Session"
5. Parent selects: Monday 2pm slot
6. Verify: New 1-on-1 lesson created
7. Verify: Enrollment for student created
8. Verify: Slot is no longer available for other students

### Scenario 3: Hybrid Cycle Transitions Back to Group
1. Week 5 starts
2. System detects: Not a 1-on-1 week (5 is not in [4,8])
3. Group class resumes
4. 1-on-1 slots are no longer offered
5. Parent cannot book new 1-on-1 sessions
6. Week 8 arrives - cycle repeats

---

## Summary

The enrollment system has clear separation of concerns:

- **Admins control**: Who is in group lessons (pedagogical decisions)
- **Parents control**: When they book 1-on-1 sessions (scheduling flexibility)
- **System controls**: Enforcement of business rules and conflict prevention

This gives schools the structure they need while providing parents flexibility where appropriate.
