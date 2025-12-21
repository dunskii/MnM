# Week 2 Implementation Plan - Music 'n Me MVP

## School Setup & User Management

**Timeline:** Week 2 of 12-week MVP
**Dependencies:** Week 1 Authentication (COMPLETE)
**Goal:** Complete school configuration and user management

---

## Executive Summary

Week 2 focuses on building the administrative foundation for the Music 'n Me platform. This includes:

1. **School Configuration** - Terms, locations, rooms, instruments, lesson types, durations
2. **User Management** - Teachers, students, parents (with 2 contacts + emergency contact)
3. **Frontend Setup** - Admin dashboard with brand styling, login/register pages

Week 1 has established:
- Full authentication system (login, logout, refresh tokens, password change)
- Prisma schema with all core models
- Rate limiting and password security (HIBP integration, common password detection)
- Material-UI theme with brand colors
- Basic frontend routing and protected routes

---

## Phase 1: Database Layer (Day 1)

### 1.1 Prisma Schema Verification

The schema is already complete from Week 1. Verify the following models exist and are correct:

**File:** `C:\Users\dunsk\code\MnM\apps\backend\prisma\schema.prisma`

Required models for Week 2:
- `School` - Lines 112-146
- `User` - Lines 148-185
- `Teacher` - Lines 219-237
- `TeacherInstrument` - Lines 239-252
- `Parent` - Lines 254-287
- `Student` - Lines 289-319
- `Family` - Lines 321-339
- `Term` - Lines 345-363
- `Location` - Lines 365-380
- `Room` - Lines 382-396
- `Instrument` - Lines 398-415
- `LessonType` - Lines 417-435
- `LessonDuration` - Lines 437-450

### 1.2 Database Seed Data

Create seed file for development and testing.

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\prisma\seed.ts`

```typescript
// Seed data structure:
// 1. Create demo school "Music 'n Me Demo" with slug "musicnme-demo"
// 2. Create admin user
// 3. Create default instruments: Piano, Guitar, Drums, Singing, Bass, Preschool
// 4. Create default lesson types: Individual (45min), Group (60min), Band (60min), Hybrid (configurable)
// 5. Create default lesson durations: 30, 45, 60 minutes
// 6. Create 4 terms for 2025
// 7. Create 2 locations with 3 rooms each
// 8. Create sample teachers (2-3)
// 9. Create sample family with parent and students
```

**Seed Data Details:**

```typescript
const seedData = {
  school: {
    name: 'Music \'n Me Demo',
    slug: 'musicnme-demo',
    email: 'demo@musicnme.com.au',
    timezone: 'Australia/Sydney',
  },
  instruments: [
    { name: 'Piano', sortOrder: 1 },
    { name: 'Guitar', sortOrder: 2 },
    { name: 'Drums', sortOrder: 3 },
    { name: 'Singing', sortOrder: 4 },
    { name: 'Bass', sortOrder: 5 },
    { name: 'Preschool', sortOrder: 6 },
  ],
  lessonTypes: [
    { name: 'Individual', type: 'INDIVIDUAL', defaultDuration: 45 },
    { name: 'Group', type: 'GROUP', defaultDuration: 60 },
    { name: 'Band', type: 'BAND', defaultDuration: 60 },
    { name: 'Hybrid', type: 'HYBRID', defaultDuration: 60 },
  ],
  lessonDurations: [30, 45, 60],
  terms: [
    { name: 'Term 1 2025', startDate: '2025-01-27', endDate: '2025-04-04' },
    { name: 'Term 2 2025', startDate: '2025-04-21', endDate: '2025-06-27' },
    { name: 'Term 3 2025', startDate: '2025-07-14', endDate: '2025-09-19' },
    { name: 'Term 4 2025', startDate: '2025-10-06', endDate: '2025-12-12' },
  ],
  locations: [
    {
      name: 'North Shore Studio',
      address: '123 Music Lane, Sydney NSW 2060',
      rooms: ['Studio A', 'Studio B', 'Studio C'],
    },
    {
      name: 'City Centre Studio',
      address: '456 Harmony Street, Sydney NSW 2000',
      rooms: ['Room 1', 'Room 2', 'Room 3'],
    },
  ],
};
```

---

## Phase 2: API Layer - Backend Services (Days 1-3)

### 2.1 School Configuration Service

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\services\school.service.ts`

```typescript
// Service functions needed:
export async function getSchoolSettings(schoolId: string): Promise<SchoolSettings>
export async function updateSchoolSettings(schoolId: string, data: UpdateSchoolInput): Promise<School>
```

### 2.2 Term Management Service

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\services\term.service.ts`

```typescript
// Service functions:
export async function getTerms(schoolId: string): Promise<Term[]>
export async function getTerm(schoolId: string, termId: string): Promise<Term | null>
export async function createTerm(schoolId: string, data: CreateTermInput): Promise<Term>
export async function updateTerm(schoolId: string, termId: string, data: UpdateTermInput): Promise<Term>
export async function deleteTerm(schoolId: string, termId: string): Promise<void>

// CRITICAL: All queries MUST include schoolId filter
```

### 2.3 Location & Room Service

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\services\location.service.ts`

```typescript
// Location functions:
export async function getLocations(schoolId: string): Promise<Location[]>
export async function getLocation(schoolId: string, locationId: string): Promise<Location | null>
export async function createLocation(schoolId: string, data: CreateLocationInput): Promise<Location>
export async function updateLocation(schoolId: string, locationId: string, data: UpdateLocationInput): Promise<Location>
export async function deleteLocation(schoolId: string, locationId: string): Promise<void>

// Room functions:
export async function getRooms(schoolId: string, locationId?: string): Promise<Room[]>
export async function getRoom(schoolId: string, roomId: string): Promise<Room | null>
export async function createRoom(schoolId: string, locationId: string, data: CreateRoomInput): Promise<Room>
export async function updateRoom(schoolId: string, roomId: string, data: UpdateRoomInput): Promise<Room>
export async function deleteRoom(schoolId: string, roomId: string): Promise<void>
```

### 2.4 Configuration Items Service (Instruments, Lesson Types, Durations)

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\services\config.service.ts`

```typescript
// Instruments:
export async function getInstruments(schoolId: string): Promise<Instrument[]>
export async function createInstrument(schoolId: string, data: CreateInstrumentInput): Promise<Instrument>
export async function updateInstrument(schoolId: string, instrumentId: string, data: UpdateInstrumentInput): Promise<Instrument>
export async function deleteInstrument(schoolId: string, instrumentId: string): Promise<void>

// Lesson Types:
export async function getLessonTypes(schoolId: string): Promise<LessonType[]>
export async function createLessonType(schoolId: string, data: CreateLessonTypeInput): Promise<LessonType>
export async function updateLessonType(schoolId: string, lessonTypeId: string, data: UpdateLessonTypeInput): Promise<LessonType>
export async function deleteLessonType(schoolId: string, lessonTypeId: string): Promise<void>

// Lesson Durations:
export async function getLessonDurations(schoolId: string): Promise<LessonDuration[]>
export async function createLessonDuration(schoolId: string, data: CreateLessonDurationInput): Promise<LessonDuration>
export async function updateLessonDuration(schoolId: string, durationId: string, data: UpdateLessonDurationInput): Promise<LessonDuration>
export async function deleteLessonDuration(schoolId: string, durationId: string): Promise<void>
```

### 2.5 User Management Service

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\services\user.service.ts`

```typescript
// User listing and management:
export async function getUsers(schoolId: string, filters?: UserFilters): Promise<User[]>
export async function getUser(schoolId: string, userId: string): Promise<User | null>
export async function updateUser(schoolId: string, userId: string, data: UpdateUserInput): Promise<User>
export async function deactivateUser(schoolId: string, userId: string): Promise<void>
export async function reactivateUser(schoolId: string, userId: string): Promise<void>
```

### 2.6 Teacher Management Service

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\services\teacher.service.ts`

```typescript
// Teacher CRUD:
export async function getTeachers(schoolId: string): Promise<TeacherWithUser[]>
export async function getTeacher(schoolId: string, teacherId: string): Promise<TeacherWithUser | null>
export async function createTeacher(schoolId: string, data: CreateTeacherInput): Promise<TeacherWithUser>
export async function updateTeacher(schoolId: string, teacherId: string, data: UpdateTeacherInput): Promise<TeacherWithUser>
export async function deleteTeacher(schoolId: string, teacherId: string): Promise<void>

// Teacher instrument assignments:
export async function assignInstrument(teacherId: string, instrumentId: string, isPrimary: boolean): Promise<void>
export async function removeInstrument(teacherId: string, instrumentId: string): Promise<void>

// Types:
interface CreateTeacherInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string; // Auto-generate if not provided
  bio?: string;
  instrumentIds?: string[];
}
```

### 2.7 Parent Management Service

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\services\parent.service.ts`

```typescript
// Parent CRUD with 2 contacts + emergency contact:
export async function getParents(schoolId: string): Promise<ParentWithUser[]>
export async function getParent(schoolId: string, parentId: string): Promise<ParentWithUser | null>
export async function createParent(schoolId: string, data: CreateParentInput): Promise<ParentWithUser>
export async function updateParent(schoolId: string, parentId: string, data: UpdateParentInput): Promise<ParentWithUser>
export async function deleteParent(schoolId: string, parentId: string): Promise<void>

// Types:
interface CreateParentInput {
  // User account
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string;

  // Contact 1 (Primary) - REQUIRED
  contact1Name: string;
  contact1Email: string;
  contact1Phone: string;
  contact1Relationship: string; // 'Parent', 'Guardian', etc.

  // Contact 2 - OPTIONAL
  contact2Name?: string;
  contact2Email?: string;
  contact2Phone?: string;
  contact2Relationship?: string;

  // Emergency Contact - REQUIRED
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;

  // Family
  familyId?: string; // Existing family or create new
  isPrimary?: boolean;
}
```

### 2.8 Student Management Service

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\services\student.service.ts`

```typescript
// Student CRUD:
export async function getStudents(schoolId: string, filters?: StudentFilters): Promise<Student[]>
export async function getStudent(schoolId: string, studentId: string): Promise<StudentWithFamily | null>
export async function createStudent(schoolId: string, data: CreateStudentInput): Promise<Student>
export async function updateStudent(schoolId: string, studentId: string, data: UpdateStudentInput): Promise<Student>
export async function deleteStudent(schoolId: string, studentId: string): Promise<void>

// Age group calculation:
export function calculateAgeGroup(birthDate: Date): AgeGroup

// Types:
interface CreateStudentInput {
  firstName: string;
  lastName: string;
  birthDate: Date;
  familyId?: string;
  notes?: string;
}

// Age group ranges from CLAUDE.md:
// PRESCHOOL: 3-5 years (Alice - Pink)
// KIDS: 6-11 years (Steve - Yellow)
// TEENS: 12-17 years (Liam - Blue)
// ADULT: 18+ years (Floyd - Mint)
```

### 2.9 Family Management Service

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\services\family.service.ts`

```typescript
export async function getFamilies(schoolId: string): Promise<FamilyWithMembers[]>
export async function getFamily(schoolId: string, familyId: string): Promise<FamilyWithMembers | null>
export async function createFamily(schoolId: string, data: CreateFamilyInput): Promise<Family>
export async function updateFamily(schoolId: string, familyId: string, data: UpdateFamilyInput): Promise<Family>
export async function addStudentToFamily(familyId: string, studentId: string): Promise<void>
export async function removeStudentFromFamily(studentId: string): Promise<void>
```

---

## Phase 2: API Layer - Routes (Days 2-3)

### 2.10 Admin Routes

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\routes\admin.routes.ts`

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(adminOnly);

// School Settings
router.get('/school/settings', getSchoolSettings);
router.patch('/school/settings', validateSchoolSettings, updateSchoolSettings);

// Terms
router.get('/terms', getTerms);
router.post('/terms', validateCreateTerm, createTerm);
router.get('/terms/:id', getTerm);
router.patch('/terms/:id', validateUpdateTerm, updateTerm);
router.delete('/terms/:id', deleteTerm);

// Locations
router.get('/locations', getLocations);
router.post('/locations', validateCreateLocation, createLocation);
router.get('/locations/:id', getLocation);
router.patch('/locations/:id', validateUpdateLocation, updateLocation);
router.delete('/locations/:id', deleteLocation);

// Rooms
router.get('/rooms', getRooms); // Query param: ?locationId=xxx
router.post('/rooms', validateCreateRoom, createRoom);
router.get('/rooms/:id', getRoom);
router.patch('/rooms/:id', validateUpdateRoom, updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Instruments
router.get('/instruments', getInstruments);
router.post('/instruments', validateCreateInstrument, createInstrument);
router.patch('/instruments/:id', validateUpdateInstrument, updateInstrument);
router.delete('/instruments/:id', deleteInstrument);

// Lesson Types
router.get('/lesson-types', getLessonTypes);
router.post('/lesson-types', validateCreateLessonType, createLessonType);
router.patch('/lesson-types/:id', validateUpdateLessonType, updateLessonType);
router.delete('/lesson-types/:id', deleteLessonType);

// Lesson Durations
router.get('/lesson-durations', getLessonDurations);
router.post('/lesson-durations', validateCreateLessonDuration, createLessonDuration);
router.patch('/lesson-durations/:id', validateUpdateLessonDuration, updateLessonDuration);
router.delete('/lesson-durations/:id', deleteLessonDuration);

export default router;
```

### 2.11 Teacher Routes

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\routes\teacher.routes.ts`

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(adminOnly);

// Teacher CRUD
router.get('/', getTeachers);
router.post('/', validateCreateTeacher, createTeacher);
router.get('/:id', getTeacher);
router.patch('/:id', validateUpdateTeacher, updateTeacher);
router.delete('/:id', deleteTeacher);

// Instrument assignments
router.post('/:id/instruments', validateAssignInstrument, assignInstrument);
router.delete('/:id/instruments/:instrumentId', removeInstrument);

export default router;
```

### 2.12 Parent Routes

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\routes\parent.routes.ts`

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(adminOnly);

// Parent CRUD
router.get('/', getParents);
router.post('/', validateCreateParent, createParent);
router.get('/:id', getParent);
router.patch('/:id', validateUpdateParent, updateParent);
router.delete('/:id', deleteParent);

export default router;
```

### 2.13 Student Routes

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\routes\student.routes.ts`

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly, teacherOrAdmin } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

// List students - teachers can view all (for coverage)
router.get('/', teacherOrAdmin, getStudents);
router.get('/:id', teacherOrAdmin, getStudent);

// Create/Update/Delete - admin only
router.post('/', adminOnly, validateCreateStudent, createStudent);
router.patch('/:id', adminOnly, validateUpdateStudent, updateStudent);
router.delete('/:id', adminOnly, deleteStudent);

export default router;
```

### 2.14 Family Routes

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\routes\family.routes.ts`

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(adminOnly);

router.get('/', getFamilies);
router.post('/', validateCreateFamily, createFamily);
router.get('/:id', getFamily);
router.patch('/:id', validateUpdateFamily, updateFamily);
router.post('/:id/students', validateAddStudent, addStudentToFamily);
router.delete('/:id/students/:studentId', removeStudentFromFamily);

export default router;
```

### 2.15 Update Routes Index

**File to modify:** `C:\Users\dunsk\code\MnM\apps\backend\src\routes\index.ts`

```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import teacherRoutes from './teacher.routes';
import parentRoutes from './parent.routes';
import studentRoutes from './student.routes';
import familyRoutes from './family.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/teachers', teacherRoutes);
router.use('/parents', parentRoutes);
router.use('/students', studentRoutes);
router.use('/families', familyRoutes);

export default router;
```

---

## Phase 3: Validation Schemas (Day 2)

### 3.1 Admin Validation Schemas

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\validators\admin.validators.ts`

```typescript
import { z } from 'zod';
import { validate } from '../middleware/validate';

// School Settings
export const updateSchoolSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  timezone: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

// Terms
export const createTermSchema = z.object({
  name: z.string().min(1, 'Term name is required').max(50),
  startDate: z.string().datetime({ message: 'Invalid start date' }),
  endDate: z.string().datetime({ message: 'Invalid end date' }),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
  message: 'Start date must be before end date',
});

export const updateTermSchema = createTermSchema.partial();

// Locations
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

// Rooms
export const createRoomSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
  name: z.string().min(1, 'Room name is required').max(50),
  capacity: z.number().int().min(1).max(50).default(10),
});

export const updateRoomSchema = createRoomSchema.partial().omit({ locationId: true });

// Instruments
export const createInstrumentSchema = z.object({
  name: z.string().min(1, 'Instrument name is required').max(50),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateInstrumentSchema = createInstrumentSchema.partial();

// Lesson Types
export const createLessonTypeSchema = z.object({
  name: z.string().min(1, 'Lesson type name is required').max(50),
  type: z.enum(['INDIVIDUAL', 'GROUP', 'BAND', 'HYBRID']),
  defaultDuration: z.number().int().min(15).max(180),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateLessonTypeSchema = createLessonTypeSchema.partial();

// Lesson Durations
export const createLessonDurationSchema = z.object({
  minutes: z.number().int().min(15).max(180),
});

export const updateLessonDurationSchema = createLessonDurationSchema.partial();

// Export validators
export const validateSchoolSettings = validate(updateSchoolSettingsSchema);
export const validateCreateTerm = validate(createTermSchema);
export const validateUpdateTerm = validate(updateTermSchema);
export const validateCreateLocation = validate(createLocationSchema);
export const validateUpdateLocation = validate(updateLocationSchema);
export const validateCreateRoom = validate(createRoomSchema);
export const validateUpdateRoom = validate(updateRoomSchema);
export const validateCreateInstrument = validate(createInstrumentSchema);
export const validateUpdateInstrument = validate(updateInstrumentSchema);
export const validateCreateLessonType = validate(createLessonTypeSchema);
export const validateUpdateLessonType = validate(updateLessonTypeSchema);
export const validateCreateLessonDuration = validate(createLessonDurationSchema);
export const validateUpdateLessonDuration = validate(updateLessonDurationSchema);
```

### 3.2 User Management Validation Schemas

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\validators\user.validators.ts`

```typescript
import { z } from 'zod';
import { validate } from '../middleware/validate';

// Phone validation (Australian format)
const phoneSchema = z.string()
  .regex(/^(\+61|0)[2-9]\d{8}$/, 'Invalid Australian phone number')
  .optional();

// Teacher
export const createTeacherSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema,
  password: z.string().min(8).optional(), // Auto-generate if not provided
  bio: z.string().max(500).optional(),
  instrumentIds: z.array(z.string().uuid()).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial().omit({ email: true });

// Parent with 2 contacts + emergency
export const createParentSchema = z.object({
  // User account
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema,
  password: z.string().min(8).optional(),

  // Contact 1 (Primary) - REQUIRED
  contact1Name: z.string().min(1, 'Primary contact name is required').max(100),
  contact1Email: z.string().email('Invalid primary contact email'),
  contact1Phone: z.string().min(1, 'Primary contact phone is required'),
  contact1Relationship: z.string().min(1).max(50).default('Parent'),

  // Contact 2 - OPTIONAL
  contact2Name: z.string().max(100).optional(),
  contact2Email: z.string().email().optional(),
  contact2Phone: z.string().optional(),
  contact2Relationship: z.string().max(50).optional(),

  // Emergency Contact - REQUIRED
  emergencyName: z.string().min(1, 'Emergency contact name is required').max(100),
  emergencyPhone: z.string().min(1, 'Emergency contact phone is required'),
  emergencyRelationship: z.string().min(1, 'Emergency contact relationship is required').max(50),

  // Family
  familyId: z.string().uuid().optional(),
  isPrimary: z.boolean().default(true),
});

export const updateParentSchema = createParentSchema.partial().omit({ email: true });

// Student
export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  birthDate: z.string().datetime({ message: 'Invalid birth date' }),
  familyId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

// Family
export const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required').max(100),
  primaryParentId: z.string().uuid().optional(),
});

export const updateFamilySchema = createFamilySchema.partial();

// Export validators
export const validateCreateTeacher = validate(createTeacherSchema);
export const validateUpdateTeacher = validate(updateTeacherSchema);
export const validateCreateParent = validate(createParentSchema);
export const validateUpdateParent = validate(updateParentSchema);
export const validateCreateStudent = validate(createStudentSchema);
export const validateUpdateStudent = validate(updateStudentSchema);
export const validateCreateFamily = validate(createFamilySchema);
export const validateUpdateFamily = validate(updateFamilySchema);
```

---

## Phase 4: Frontend Layer (Days 3-5)

### 4.1 Frontend Directory Structure

Create the following directory structure:

```
C:\Users\dunsk\code\MnM\apps\frontend\src\
├── components/
│   ├── common/
│   │   ├── DataTable.tsx
│   │   ├── FormModal.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── LoadingState.tsx
│   │   ├── EmptyState.tsx
│   │   └── Toast.tsx
│   ├── layout/
│   │   ├── AdminLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Navigation.tsx
│   └── forms/
│       ├── TermForm.tsx
│       ├── LocationForm.tsx
│       ├── RoomForm.tsx
│       ├── InstrumentForm.tsx
│       ├── LessonTypeForm.tsx
│       ├── TeacherForm.tsx
│       ├── ParentForm.tsx
│       └── StudentForm.tsx
├── pages/
│   ├── admin/
│   │   ├── DashboardPage.tsx
│   │   ├── TermsPage.tsx
│   │   ├── LocationsPage.tsx
│   │   ├── RoomsPage.tsx
│   │   ├── InstrumentsPage.tsx
│   │   ├── LessonTypesPage.tsx
│   │   ├── LessonDurationsPage.tsx
│   │   ├── TeachersPage.tsx
│   │   ├── ParentsPage.tsx
│   │   ├── StudentsPage.tsx
│   │   └── FamiliesPage.tsx
│   └── LoginPage.tsx
├── hooks/
│   ├── useTerms.ts
│   ├── useLocations.ts
│   ├── useRooms.ts
│   ├── useInstruments.ts
│   ├── useLessonTypes.ts
│   ├── useLessonDurations.ts
│   ├── useTeachers.ts
│   ├── useParents.ts
│   ├── useStudents.ts
│   └── useFamilies.ts
├── api/
│   ├── admin.api.ts
│   ├── teachers.api.ts
│   ├── parents.api.ts
│   ├── students.api.ts
│   └── families.api.ts
└── types/
    ├── admin.types.ts
    └── user.types.ts
```

### 4.2 Admin Layout Component

**File to create:** `C:\Users\dunsk\code\MnM\apps\frontend\src\components\layout\AdminLayout.tsx`

```tsx
// Layout with:
// - Header with logo, user menu, logout
// - Sidebar with navigation
// - Main content area
// - Brand colors from theme
// - Responsive design (collapsible sidebar on mobile)

// Navigation items:
const navigationItems = [
  { label: 'Dashboard', path: '/admin', icon: Dashboard },
  { label: 'Terms', path: '/admin/terms', icon: CalendarMonth },
  { label: 'Locations', path: '/admin/locations', icon: LocationOn },
  { label: 'Rooms', path: '/admin/rooms', icon: MeetingRoom },
  { label: 'Instruments', path: '/admin/instruments', icon: MusicNote },
  { label: 'Lesson Types', path: '/admin/lesson-types', icon: Category },
  { label: 'Lesson Durations', path: '/admin/lesson-durations', icon: Timer },
  { divider: true },
  { label: 'Teachers', path: '/admin/teachers', icon: Person },
  { label: 'Parents', path: '/admin/parents', icon: FamilyRestroom },
  { label: 'Students', path: '/admin/students', icon: School },
  { label: 'Families', path: '/admin/families', icon: Groups },
];
```

### 4.3 Reusable Data Table Component

**File to create:** `C:\Users\dunsk\code\MnM\apps\frontend\src\components\common\DataTable.tsx`

```tsx
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

// Features:
// - Column sorting
// - Search/filter
// - Pagination
// - Edit/Delete action buttons
// - Loading state
// - Empty state
// - Brand styling (no shadows per guidelines)
```

### 4.4 Form Modal Component

**File to create:** `C:\Users\dunsk\code\MnM\apps\frontend\src\components\common\FormModal.tsx`

```tsx
interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

// Features:
// - Accessible modal (MUI Dialog)
// - Form validation feedback
// - Loading state on submit
// - Cancel/Submit buttons
// - Brand colors
```

### 4.5 API Client Functions

**File to create:** `C:\Users\dunsk\code\MnM\apps\frontend\src\api\admin.api.ts`

```typescript
import { apiClient } from '../services/api';

// Terms
export const termsApi = {
  getAll: () => apiClient.get('/admin/terms'),
  getById: (id: string) => apiClient.get(`/admin/terms/${id}`),
  create: (data: CreateTermInput) => apiClient.post('/admin/terms', data),
  update: (id: string, data: UpdateTermInput) => apiClient.patch(`/admin/terms/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admin/terms/${id}`),
};

// Locations
export const locationsApi = {
  getAll: () => apiClient.get('/admin/locations'),
  getById: (id: string) => apiClient.get(`/admin/locations/${id}`),
  create: (data: CreateLocationInput) => apiClient.post('/admin/locations', data),
  update: (id: string, data: UpdateLocationInput) => apiClient.patch(`/admin/locations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admin/locations/${id}`),
};

// Rooms
export const roomsApi = {
  getAll: (locationId?: string) => apiClient.get('/admin/rooms', { params: { locationId } }),
  getById: (id: string) => apiClient.get(`/admin/rooms/${id}`),
  create: (data: CreateRoomInput) => apiClient.post('/admin/rooms', data),
  update: (id: string, data: UpdateRoomInput) => apiClient.patch(`/admin/rooms/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admin/rooms/${id}`),
};

// Similar patterns for instruments, lessonTypes, lessonDurations...
```

### 4.6 React Query Hooks

**File to create:** `C:\Users\dunsk\code\MnM\apps\frontend\src\hooks\useTerms.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { termsApi } from '../api/admin.api';

export function useTerms() {
  return useQuery({
    queryKey: ['terms'],
    queryFn: termsApi.getAll,
  });
}

export function useTerm(id: string) {
  return useQuery({
    queryKey: ['terms', id],
    queryFn: () => termsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: termsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
  });
}

export function useUpdateTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTermInput }) =>
      termsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
  });
}

export function useDeleteTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: termsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
  });
}
```

### 4.7 Admin Pages

**File to create:** `C:\Users\dunsk\code\MnM\apps\frontend\src\pages\admin\TermsPage.tsx`

```tsx
// Example structure - apply to all admin pages:
import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { DataTable } from '../../components/common/DataTable';
import { FormModal } from '../../components/common/FormModal';
import { TermForm } from '../../components/forms/TermForm';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useTerms, useCreateTerm, useUpdateTerm, useDeleteTerm } from '../../hooks/useTerms';

export default function TermsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: terms, isLoading } = useTerms();
  const createMutation = useCreateTerm();
  const updateMutation = useUpdateTerm();
  const deleteMutation = useDeleteTerm();

  // ... handlers and render
}
```

### 4.8 Update App Routes

**File to modify:** `C:\Users\dunsk\code\MnM\apps\frontend\src\App.tsx`

```tsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import TermsPage from './pages/admin/TermsPage';
import LocationsPage from './pages/admin/LocationsPage';
import RoomsPage from './pages/admin/RoomsPage';
import InstrumentsPage from './pages/admin/InstrumentsPage';
import LessonTypesPage from './pages/admin/LessonTypesPage';
import LessonDurationsPage from './pages/admin/LessonDurationsPage';
import TeachersPage from './pages/admin/TeachersPage';
import ParentsPage from './pages/admin/ParentsPage';
import StudentsPage from './pages/admin/StudentsPage';
import FamiliesPage from './pages/admin/FamiliesPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/meet-and-greet" element={<MeetAndGreet />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/terms" element={<ProtectedRoute requiredRole="ADMIN"><TermsPage /></ProtectedRoute>} />
      <Route path="/admin/locations" element={<ProtectedRoute requiredRole="ADMIN"><LocationsPage /></ProtectedRoute>} />
      <Route path="/admin/rooms" element={<ProtectedRoute requiredRole="ADMIN"><RoomsPage /></ProtectedRoute>} />
      <Route path="/admin/instruments" element={<ProtectedRoute requiredRole="ADMIN"><InstrumentsPage /></ProtectedRoute>} />
      <Route path="/admin/lesson-types" element={<ProtectedRoute requiredRole="ADMIN"><LessonTypesPage /></ProtectedRoute>} />
      <Route path="/admin/lesson-durations" element={<ProtectedRoute requiredRole="ADMIN"><LessonDurationsPage /></ProtectedRoute>} />
      <Route path="/admin/teachers" element={<ProtectedRoute requiredRole="ADMIN"><TeachersPage /></ProtectedRoute>} />
      <Route path="/admin/parents" element={<ProtectedRoute requiredRole="ADMIN"><ParentsPage /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute requiredRole="ADMIN"><StudentsPage /></ProtectedRoute>} />
      <Route path="/admin/families" element={<ProtectedRoute requiredRole="ADMIN"><FamiliesPage /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

---

## Phase 5: Multi-Tenancy Security (Throughout)

### 5.1 Critical Security Pattern

**EVERY database query MUST include schoolId:**

```typescript
// Pattern for all services:
export async function getItems(schoolId: string): Promise<Item[]> {
  return prisma.item.findMany({
    where: {
      schoolId, // CRITICAL: Always filter by schoolId
    },
  });
}

export async function getItem(schoolId: string, itemId: string): Promise<Item | null> {
  return prisma.item.findFirst({
    where: {
      id: itemId,
      schoolId, // CRITICAL: Never use findUnique without schoolId check
    },
  });
}

export async function updateItem(schoolId: string, itemId: string, data: UpdateInput): Promise<Item> {
  // First verify item belongs to school
  const existing = await prisma.item.findFirst({
    where: { id: itemId, schoolId },
  });

  if (!existing) {
    throw new AppError('Item not found', 404);
  }

  return prisma.item.update({
    where: { id: itemId },
    data,
  });
}
```

### 5.2 Teacher Access Pattern

Teachers can VIEW all school data but only EDIT their own:

```typescript
// In routes - teachers can view all students
router.get('/students', teacherOrAdmin, getStudents);

// In service - filter by schoolId
export async function getStudents(schoolId: string): Promise<Student[]> {
  return prisma.student.findMany({
    where: { schoolId }, // All students in school
    include: { family: true },
  });
}
```

---

## Phase 6: Testing (Day 5)

### 6.1 Backend Unit Tests

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\__tests__\services\term.service.test.ts`

```typescript
describe('Term Service', () => {
  describe('getTerms', () => {
    it('should only return terms for the specified school', async () => {
      // Create terms for two schools
      // Verify only correct school's terms returned
    });

    it('should not return terms from other schools', async () => {
      // Multi-tenancy test
    });
  });

  describe('createTerm', () => {
    it('should create term with schoolId', async () => {});
    it('should reject overlapping term dates', async () => {});
    it('should validate date range', async () => {});
  });

  // Similar patterns for update, delete
});
```

### 6.2 Multi-Tenancy Tests

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\__tests__\security\multi-tenancy.test.ts`

```typescript
describe('Multi-Tenancy Security', () => {
  let schoolA: School;
  let schoolB: School;
  let userA: User;
  let userB: User;

  beforeEach(async () => {
    schoolA = await createTestSchool('School A');
    schoolB = await createTestSchool('School B');
    userA = await createTestUser(schoolA.id, 'ADMIN');
    userB = await createTestUser(schoolB.id, 'ADMIN');
  });

  it('should not allow School A admin to access School B terms', async () => {
    const termB = await createTerm(schoolB.id, { name: 'Term 1' });

    const result = await getTerm(schoolA.id, termB.id);
    expect(result).toBeNull();
  });

  it('should not allow School A admin to update School B teacher', async () => {
    const teacherB = await createTeacher(schoolB.id, { ... });

    await expect(
      updateTeacher(schoolA.id, teacherB.id, { bio: 'Hacked!' })
    ).rejects.toThrow('not found');
  });

  // Test for all entities: locations, rooms, students, etc.
});
```

### 6.3 API Integration Tests

**File to create:** `C:\Users\dunsk\code\MnM\apps\backend\src\__tests__\routes\admin.routes.test.ts`

```typescript
describe('Admin Routes', () => {
  describe('POST /admin/terms', () => {
    it('should create term with valid data', async () => {
      const response = await request(app)
        .post('/api/admin/terms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Term 1 2025',
          startDate: '2025-01-27T00:00:00Z',
          endDate: '2025-04-04T00:00:00Z',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Term 1 2025');
    });

    it('should reject request from non-admin', async () => {
      const response = await request(app)
        .post('/api/admin/terms')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'Term 1' });

      expect(response.status).toBe(403);
    });

    it('should reject request without auth', async () => {
      const response = await request(app)
        .post('/api/admin/terms')
        .send({ name: 'Term 1' });

      expect(response.status).toBe(401);
    });
  });
});
```

---

## Deliverables Checklist

### Week 2 Success Criteria

- [ ] School can configure 4 x 10-week terms
- [ ] Admin can create 2 locations with 3 rooms each
- [ ] Admin can create teachers and students
- [ ] Admin can add/edit instruments (Bass, Preschool + custom)
- [ ] Admin can add/edit lesson types and durations (including 30 min)
- [ ] Parent accounts support 2 contacts + emergency contact
- [ ] Teachers can view all school data (not just their own)
- [ ] Frontend implements Music 'n Me brand guidelines (colors, fonts, visual style)
- [ ] Frontend login working

### Files to Create

**Backend Services:**
1. `apps/backend/src/services/school.service.ts`
2. `apps/backend/src/services/term.service.ts`
3. `apps/backend/src/services/location.service.ts`
4. `apps/backend/src/services/config.service.ts`
5. `apps/backend/src/services/user.service.ts`
6. `apps/backend/src/services/teacher.service.ts`
7. `apps/backend/src/services/parent.service.ts`
8. `apps/backend/src/services/student.service.ts`
9. `apps/backend/src/services/family.service.ts`

**Backend Routes:**
10. `apps/backend/src/routes/admin.routes.ts`
11. `apps/backend/src/routes/teacher.routes.ts`
12. `apps/backend/src/routes/parent.routes.ts`
13. `apps/backend/src/routes/student.routes.ts`
14. `apps/backend/src/routes/family.routes.ts`

**Backend Validators:**
15. `apps/backend/src/validators/admin.validators.ts`
16. `apps/backend/src/validators/user.validators.ts`

**Frontend Components:**
17. `apps/frontend/src/components/layout/AdminLayout.tsx`
18. `apps/frontend/src/components/layout/Sidebar.tsx`
19. `apps/frontend/src/components/common/DataTable.tsx`
20. `apps/frontend/src/components/common/FormModal.tsx`
21. `apps/frontend/src/components/common/ConfirmDialog.tsx`
22. `apps/frontend/src/components/forms/TermForm.tsx`
23. `apps/frontend/src/components/forms/LocationForm.tsx`
24. `apps/frontend/src/components/forms/RoomForm.tsx`
25. `apps/frontend/src/components/forms/InstrumentForm.tsx`
26. `apps/frontend/src/components/forms/TeacherForm.tsx`
27. `apps/frontend/src/components/forms/ParentForm.tsx`
28. `apps/frontend/src/components/forms/StudentForm.tsx`

**Frontend Pages:**
29. `apps/frontend/src/pages/admin/DashboardPage.tsx`
30. `apps/frontend/src/pages/admin/TermsPage.tsx`
31. `apps/frontend/src/pages/admin/LocationsPage.tsx`
32. `apps/frontend/src/pages/admin/RoomsPage.tsx`
33. `apps/frontend/src/pages/admin/InstrumentsPage.tsx`
34. `apps/frontend/src/pages/admin/LessonTypesPage.tsx`
35. `apps/frontend/src/pages/admin/LessonDurationsPage.tsx`
36. `apps/frontend/src/pages/admin/TeachersPage.tsx`
37. `apps/frontend/src/pages/admin/ParentsPage.tsx`
38. `apps/frontend/src/pages/admin/StudentsPage.tsx`
39. `apps/frontend/src/pages/admin/FamiliesPage.tsx`

**Frontend API/Hooks:**
40. `apps/frontend/src/api/admin.api.ts`
41. `apps/frontend/src/api/teachers.api.ts`
42. `apps/frontend/src/api/parents.api.ts`
43. `apps/frontend/src/api/students.api.ts`
44. `apps/frontend/src/api/families.api.ts`
45. `apps/frontend/src/hooks/useTerms.ts`
46. `apps/frontend/src/hooks/useLocations.ts`
47. `apps/frontend/src/hooks/useRooms.ts`
48. `apps/frontend/src/hooks/useInstruments.ts`
49. `apps/frontend/src/hooks/useLessonTypes.ts`
50. `apps/frontend/src/hooks/useLessonDurations.ts`
51. `apps/frontend/src/hooks/useTeachers.ts`
52. `apps/frontend/src/hooks/useParents.ts`
53. `apps/frontend/src/hooks/useStudents.ts`
54. `apps/frontend/src/hooks/useFamilies.ts`

**Tests:**
55. `apps/backend/src/__tests__/services/term.service.test.ts`
56. `apps/backend/src/__tests__/services/teacher.service.test.ts`
57. `apps/backend/src/__tests__/security/multi-tenancy.test.ts`
58. `apps/backend/src/__tests__/routes/admin.routes.test.ts`

**Database:**
59. `apps/backend/prisma/seed.ts`

---

## Risk Assessment

### High Risk Areas

1. **Multi-tenancy data leakage** - Every query must filter by schoolId
   - Mitigation: Code review checklist, automated tests

2. **Parent contact data complexity** - 2 contacts + emergency contact
   - Mitigation: Clear validation schemas, form design

3. **Teacher cross-access permissions** - View all, edit own
   - Mitigation: Careful middleware configuration, tests

### Medium Risk Areas

1. **Form validation consistency** - Frontend and backend must match
2. **Brand styling adherence** - No shadows, specific colors
3. **Mobile responsiveness** - Admin dashboard on tablets

---

## Recommended Agent Assignment

| Task | Recommended Agent |
|------|------------------|
| Backend services | `full-stack` or `multi-tenancy` |
| API routes | `full-stack` |
| Validation schemas | `full-stack` |
| Frontend components | `full-stack` |
| Multi-tenancy tests | `multi-tenancy` |
| Integration tests | `testing` |

---

## Critical Files for Implementation

1. **`C:\Users\dunsk\code\MnM\apps\backend\src\services\teacher.service.ts`** - Core user management logic, needs proper multi-tenancy patterns
2. **`C:\Users\dunsk\code\MnM\apps\backend\src\services\parent.service.ts`** - Complex contact structure (2 contacts + emergency)
3. **`C:\Users\dunsk\code\MnM\apps\backend\src\routes\admin.routes.ts`** - Central admin API routes with authorization
4. **`C:\Users\dunsk\code\MnM\apps\frontend\src\components\layout\AdminLayout.tsx`** - Foundation for all admin pages
5. **`C:\Users\dunsk\code\MnM\apps\backend\prisma\seed.ts`** - Development data for testing
