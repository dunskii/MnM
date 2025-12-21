# Family Accounts - Phase 1 Specification

## Overview

Family accounts allow one parent to manage multiple children in a single account. This is a **Must Have** Phase 1 feature essential for households with multiple music students.

---

## Why This is Critical for MVP

**User Problem:**
- Family with Emma (Piano) and Liam (Violin) needs two separate logins
- Frustration: Two passwords to remember, two dashboards to check
- Friction: Parents abandon platform, manual coordination needed

**Solution:**
- One login for entire family
- Unified schedule showing all children
- One payment/billing address
- Seamless switching between children

---

## Data Model

### Database Schema

```prisma
model FamilyGroup {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Family identification
  name      String   // e.g., "Smith Family"
  
  // Admin of the family account
  adminId   String
  admin     User     @relation("FamilyAdmin", fields: [adminId], references: [id])

  // All members (parents and students)
  members   User[]   @relation("FamilyMembers")

  // Billing (Phase 1: storage only)
  billingEmail String?
  billingPhone String?
  billingAddress String?

  // Preferences
  primaryLanguage String? @default("en")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([adminId])
}

// Update User model to link to family
model User {
  // ... existing fields ...

  // Family linkage
  familyGroupId  String?
  familyGroup    FamilyGroup? @relation("FamilyMembers", fields: [familyGroupId], references: [id])
  
  // If this user is a family admin
  familyGroupsManaged FamilyGroup[] @relation("FamilyAdmin")

  @@index([familyGroupId])
}

model Student {
  // ... existing fields ...
  // Users in same familyGroup can see this student's info
}
```

---

## User Workflows

### Workflow 1: Parent Creates Account + Adds Child

**Scenario:** Sarah signs up, needs to add children Emma and Liam

```
Step 1: Account Creation
├─ Sarah enters: email, password
├─ Creates personal account
└─ Role: PARENT

Step 2: Create Family
├─ Button: "Add your children"
├─ Family name: "Smith Family"
├─ Phone: (555) 123-4567
├─ Address: 123 Main St (optional for Phase 1)
└─ [Create Family]

Step 3: Add Children
├─ "Add student to family"
├─ Name: Emma Smith
├─ Date of Birth: 2015-03-15
├─ Instrument: Piano
├─ Level: Beginner
├─ [Add Another Child] or [Done]

Step 4: Add Second Child
├─ Name: Liam Smith
├─ Date of Birth: 2017-07-22
├─ Instrument: Violin
├─ Level: Beginner
├─ [Add Another Child] or [Done]

Step 5: Dashboard
├─ "Smith Family Account - 2 members"
├─ Emma's lessons
├─ Liam's lessons
├─ Family billing
└─ Preferences
```

### Workflow 2: Switch Between Children

**After login, parent sees:**

```
┌─────────────────────────────────────────┐
│  Smith Family Account                   │
│                                         │
│  👤 Sarah (You) | Settings | Logout    │
│                                         │
│  📚 Select a student:                   │
│                                         │
│  [👧 Emma - Piano]  ← Currently viewing │
│  [🎻 Liam - Violin]                     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  EMMA'S SCHEDULE                        │
│  ─────────────────────────────────────  │
│                                         │
│  Thu 3-4pm: Piano Basics                │
│             Main Studio, Room A         │
│             Maria Garcia                │
│                                         │
│  Upcoming 1-on-1: Mon 2-2:30pm          │
│                                         │
│  [View Attendance] [View Materials]     │
│  [View Progress] [Make Payment]         │
│                                         │
└─────────────────────────────────────────┘
```

**Student Switcher Behavior:**
```typescript
// When parent clicks on different student
function switchStudentContext(studentId: string) {
  // Load that student's:
  // - Enrollments
  // - Attendance
  // - Resources
  // - Awards
  // - Payments (for this student)
  
  // Update page title
  // Update all dashboard components
  // Clear previous student's data
}
```

### Workflow 3: Add Another Parent to Family

**Scenario:** Sarah wants to add spouse (Michael) to family account (Phase 1 basic, Phase 2 advanced)

**Phase 1 Simple Approach:**
- Only one parent can be admin
- Spouse needs separate account initially
- Phase 2: Multi-parent support with shared access

**Phase 1 Implementation:**
```
Sarah's account -> Family Admin
Michael's account -> Separate (no family link)

When Michael registers:
- Creates his own account
- Can see his own children
- Can't see Sarah's family group initially

Phase 2: Invite system
- Sarah can invite Michael: "Add to family"
- Michael gets invitation email
- Accepts → Now shares family group
- Both can see all children
```

---

## Dashboard Architecture

### Family Dashboard Structure

```
FamilyDashboard
├─ FamilyHeader
│  ├─ Family name "Smith Family"
│  ├─ Student selector dropdown
│  └─ Settings link
│
├─ StudentContext
│  └─ Current student: Emma
│
├─ StudentDashboard
│  ├─ StudentHeader (Emma, Piano, Beginner)
│  │
│  ├─ QuickStats
│  │  ├─ Next lesson: Thu 3pm
│  │  ├─ Attendance: 92% (11/12)
│  │  ├─ Outstanding balance: $40
│  │  └─ Progress: 85% through Section 1
│  │
│  ├─ Schedule
│  │  ├─ Recurring lessons
│  │  ├─ Upcoming 1-on-1 booking weeks
│  │  └─ Calendar view
│  │
│  ├─ Resources
│  │  ├─ Available materials
│  │  └─ Download links
│  │
│  ├─ Progress
│  │  ├─ Awards/badges earned
│  │  └─ Milestones completed
│  │
│  └─ Actions
│     ├─ Book 1-on-1 (if available)
│     ├─ Make payment
│     └─ View full enrollment details
│
└─ FamilyBilling (Phase 2: consolidated)
   ├─ Combined invoice for all children
   ├─ Payment status
   └─ Payment method
```

### UI Component: Student Selector

```tsx
// StudentSelector.tsx
import React, { useState } from 'react';
import { Tabs, Tab, Badge } from '@mui/material';

export function StudentSelector({ students, currentStudent, onSelect }) {
  return (
    <div className="student-selector">
      <div className="selector-header">
        <h2>{students[0]?.familyGroup?.name || 'My Family'}</h2>
        <p>{students.length} student{students.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="student-tabs">
        {students.map((student) => (
          <button
            key={student.id}
            className={`student-tab ${currentStudent?.id === student.id ? 'active' : ''}`}
            onClick={() => onSelect(student)}
          >
            <div className="student-avatar">
              {student.user.firstName.charAt(0)}
            </div>
            <div className="student-info">
              <div className="student-name">{student.user.firstName}</div>
              <div className="student-instrument">{student.instrument}</div>
            </div>
            {currentStudent?.id === student.id && <Badge color="primary">Current</Badge>}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Backend Implementation

### Family Creation Flow

```typescript
// services/family.service.ts

async function createFamilyForParent(parentId: string, familyData: {
  name: string;
  billingEmail?: string;
  children: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    instrument?: string;
    level?: string;
  }[]
}): Promise<FamilyGroup> {
  
  // 1. Create family group
  const family = await prisma.familyGroup.create({
    data: {
      name: familyData.name,
      adminId: parentId,
      schoolId: parent.schoolId,
      billingEmail: familyData.billingEmail || parent.email
    }
  });

  // 2. Add parent to family
  await prisma.user.update({
    where: { id: parentId },
    data: { familyGroupId: family.id }
  });

  // 3. Create student records for each child
  for (const childData of familyData.children) {
    // Create student user
    const childUser = await prisma.user.create({
      data: {
        email: `${family.id}-student-${crypto.randomUUID()}@internal.school`,
        // System-generated email (not used for login)
        password: '***',  // No password - uses parent login
        firstName: childData.firstName,
        lastName: childData.lastName,
        role: 'STUDENT',
        schoolId: parent.schoolId,
        familyGroupId: family.id
      }
    });

    // Create student profile
    await prisma.student.create({
      data: {
        userId: childUser.id,
        schoolId: parent.schoolId,
        instrument: childData.instrument,
        level: childData.level,
        dateOfBirth: childData.dateOfBirth
      }
    });
  }

  return family;
}

// Get all students in a family
async function getFamilyStudents(familyId: string): Promise<Student[]> {
  const students = await prisma.student.findMany({
    where: {
      user: { familyGroupId: familyId }
    },
    include: {
      user: true,
      enrollments: {
        include: { lesson: true }
      }
    },
    orderBy: { user: { firstName: 'asc' } }
  });

  return students;
}

// Get family info including all members
async function getFamily(familyId: string): Promise<FamilyGroup> {
  return prisma.familyGroup.findUnique({
    where: { id: familyId },
    include: {
      admin: true,
      members: {
        include: {
          studentProfile: true
        }
      }
    }
  });
}
```

### Access Control

```typescript
// middleware/familyAuth.middleware.ts

/**
 * Verify that requester can access family data
 * - Parent can access their own family
 * - Student can access their own family's data (limited)
 * - Teachers can see students in their classes
 */
async function requireFamilyAccess(req, res, next) {
  const userId = req.user.id;
  const familyId = req.params.familyId;

  // Get user's family group
  const userFamily = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyGroupId: true, role: true }
  });

  // Case 1: Parent accessing own family
  if (userFamily.familyGroupId === familyId && userFamily.role === 'PARENT') {
    return next();
  }

  // Case 2: Student accessing own family
  if (userFamily.familyGroupId === familyId && userFamily.role === 'STUDENT') {
    return next();
  }

  // Case 3: Teacher accessing students in their classes
  if (userFamily.role === 'TEACHER') {
    const family = await prisma.familyGroup.findUnique({
      where: { id: familyId },
      include: {
        members: {
          where: { role: 'STUDENT' }
        }
      }
    });

    // Check if any student in family is in teacher's classes
    // ... check enrollments ...
    // If found, allow limited access
  }

  // Default: deny
  return res.status(403).json({ error: 'Unauthorized' });
}
```

---

## API Endpoints

```
POST /api/families
  Create new family for current parent
  Body: { name, billingEmail?, children: [] }
  Response: { family: FamilyGroup, students: Student[] }

GET /api/families/:familyId
  Get family details (must own family)
  Response: { family: FamilyGroup, members: User[], students: Student[] }

GET /api/families/:familyId/students
  Get all students in family
  Response: { students: Student[] }

PATCH /api/families/:familyId
  Update family info (name, billing)
  Body: { name?, billingEmail? }
  Response: { family: FamilyGroup }

POST /api/families/:familyId/students
  Add new student to family
  Body: { firstName, lastName, instrument?, level?, dateOfBirth? }
  Response: { student: Student }

DELETE /api/families/:familyId/students/:studentId
  Remove student from family
  Response: { success: boolean }

GET /api/families/:familyId/schedule
  Get combined schedule for all students
  Query: ?startDate=2024-10-15&endDate=2024-10-30
  Response: { schedule: Lesson[], byStudent: { [studentId]: Lesson[] } }

GET /api/families/:familyId/billing
  Get billing summary for family
  Response: { 
    familyId, 
    outstandingBalance, 
    totalDue, 
    invoices: Invoice[],
    byStudent: { [studentId]: { balance, invoices } }
  }

POST /api/families/:familyId/switch-context
  Switch active student context (UI only, stored in client state)
  Body: { studentId }
  Response: { currentStudent: Student, permissions: String[] }
```

---

## Enrollment Visibility

### Question: Can parents see each other's children?

**Answer (Phase 1): No**
- Each parent account is independent
- Parents don't automatically see siblings
- Michael would need to create separate account for Liam

**Phase 2: Yes (with consent)**
- Parents can be invited to same family
- Shared access with role-based permissions
- One unified family account

### Current Phase 1 Limitation Accepted

**Trade-off:**
- Simplicity: One parent = one family
- Scaling: Multi-parent support in Phase 2

**Workaround if needed:**
```
Sarah (admin) has Emma and Liam
Michael doesn't have account yet

Option A: Sarah manages both
- Uses Sarah's account for both children
- Michael gets access on demand (Phase 2)

Option B: Michael creates separate account
- Michael manages own account
- Sees Liam's info
- Separate login but same school
```

---

## Implementation Timeline (Weeks 5-6)

### Week 5

**Day 1-2:**
- ✅ Create FamilyGroup and update User/Student models
- ✅ Database migration
- ✅ Create family service (createFamily, getFamily, addStudent)

**Day 3-4:**
- ✅ Create API endpoints for family management
- ✅ Implement family access middleware
- ✅ Create family data retrieval queries

**Day 5:**
- ✅ Testing: Create family, add students, retrieve data

### Week 6

**Day 1-2:**
- ✅ Build StudentSelector component (React)
- ✅ Build family dashboard layout
- ✅ Implement context switching

**Day 3-4:**
- ✅ Integrate with existing lesson/enrollment views
- ✅ Update billing views to show family totals
- ✅ Build student management UI

**Day 5:**
- ✅ Full UI testing
- ✅ Edge case handling (delete student, empty family, etc.)

---

## Phase 1 Success Criteria

✅ One parent can create account with multiple children  
✅ Parent sees all children's schedules  
✅ Parent can switch between children  
✅ Attendance/progress visible per child  
✅ One login for entire family  
✅ Family billing (combined invoice)  
✅ Notifications addressed to family  

❌ Phase 2 features:
- Multi-parent access
- Family admin controls
- Shared calendars
- Invite system

---

## Edge Cases to Handle

### Edge Case 1: What if parent has kids at different schools?

**Phase 1 Answer:** Each school is separate
- Need separate accounts per school
- Family groups are school-specific
- Limitation accepted for MVP

**Phase 2:** Could support multi-school families

### Edge Case 2: What if family name is offensive/inappropriate?

**Solution:**
```typescript
// Validation
if (familyName.length < 2 || familyName.length > 100) {
  throw new Error('Family name must be 2-100 characters');
}

// Could add word filter in future
```

### Edge Case 3: Delete student from family

**Current behavior:**
```typescript
async function removeStudentFromFamily(familyId, studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { enrollments: true }
  });

  // Only allow if no active enrollments
  const activeEnrollments = student.enrollments.filter(
    e => e.status === 'ACTIVE'
  );

  if (activeEnrollments.length > 0) {
    throw new Error('Cannot remove student with active enrollments');
  }

  // Remove from family
  await prisma.user.update({
    where: { id: student.userId },
    data: { familyGroupId: null }
  });

  // Archive student record (Phase 2: hard delete after delay)
}
```

---

## Future Enhancements (Phase 2+)

- Multi-parent support with role-based access
- Grandparent/guardian accounts
- Shared calendar exports for families
- Family notifications digest (one email per family)
- Sibling discounts in billing
- Family progress reports
- Multi-school family support
- Family messaging system

This family account structure provides the essential foundation for Phase 1, with clear paths for enhancement in later phases.
