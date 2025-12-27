# Lesson Management E2E Tests

## Overview

Comprehensive end-to-end tests for the Music 'n Me lesson management flow, covering all lesson types (Individual, Group, Band, Hybrid), enrollment, attendance, teacher notes, and resource management.

## Test Coverage

### 1. Lesson Creation (Admin) - 8 Tests

Tests admin's ability to create and configure lessons:

- **Individual Lesson Creation** - Creates 45-minute individual lesson
- **Group Lesson Creation** - Creates 60-minute group lesson
- **Band Lesson Creation** - Creates 60-minute band lesson
- **Hybrid Lesson with Pattern** - Configures group/individual week pattern
- **Field Validation** - Ensures required fields are enforced
- **Schedule Conflict Detection** - Prevents overlapping lessons
- **Calendar Integration** - Verifies lesson appears in calendar after creation

**Key Features Tested:**
- All 4 lesson types supported
- Default durations (45 min individual, 60 min group/band)
- Room and teacher assignment
- Schedule configuration
- Hybrid pattern configuration (group/individual weeks)

### 2. Lesson Enrollment (Admin) - 6 Tests

Tests student enrollment and capacity management:

- **Single Student Enrollment** - Enroll one student at a time
- **Bulk Enrollment** - Enroll multiple students together
- **Student Removal** - Remove student from lesson
- **Capacity Enforcement** - Prevents over-enrollment
- **Waitlist Functionality** - Handles full lessons
- **Enrollment Count Updates** - Verifies accurate student counts

**Key Features Tested:**
- Individual lesson capacity (1 student)
- Group/Band capacity (configurable)
- Real-time enrollment count updates
- Waitlist when full

### 3. Teacher View (All Lessons) - 4 Tests

Tests teacher's ability to view all school lessons (per CLAUDE.md requirement):

- **View All School Lessons** - Teachers can see ALL classes
- **Filter by Assigned Lessons** - Filter to "My Lessons"
- **Lesson Detail View** - Complete lesson information
- **Enrolled Students List** - View all enrolled students

**Key Features Tested:**
- Global lesson access (for coverage/substitution)
- Personal lesson filtering
- Schedule information display
- Room and location details

### 4. Attendance Marking (Teacher) - 7 Tests

Tests attendance tracking functionality:

- **Mark Single Student Present** - Individual attendance marking
- **Mark Single Student Absent** - Track absences
- **Mark Student Late** - Late arrival tracking
- **Batch Mark All Present** - Quick marking for full attendance
- **Attendance History** - View past attendance records
- **Attendance Statistics** - Calculate attendance rates

**Key Features Tested:**
- Present/Absent/Late status options
- Bulk operations
- Historical tracking
- Statistical calculations (attendance rate)

### 5. Teacher Notes (Required) - 5 Tests

Tests teacher notes functionality (REQUIRED per CLAUDE.md):

- **Add Class Note** - Session-level notes for entire class
- **Add Student-Specific Note** - Individual student observations
- **Edit Existing Note** - Modify notes after creation
- **Notes Completion Tracking** - Track which notes are completed
- **View Note History** - Access past notes

**Key Features Tested:**
- Class-level notes (required per session)
- Student-level notes (required per student)
- Expected daily, must be completed by end of week
- Edit/update capability
- Historical access

### 6. Resource Management (Google Drive) - 5 Tests

Tests Google Drive integration for file sharing:

- **Link Drive Folder** - Admin connects Drive folder to lesson
- **Upload File** - Teacher uploads resources
- **Set File Visibility** - Configure ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY
- **Student File Access** - Files appear based on visibility rules
- **Download File** - Students can download allowed files

**Key Features Tested:**
- Two-way Google Drive sync
- File visibility rules:
  - `ALL` - Everyone can see
  - `TEACHERS_AND_PARENTS` - Parents and teachers only
  - `TEACHERS_ONLY` - Teachers only
- Upload/download functionality

### 7. Calendar Integration - 4 Tests

Tests calendar display and scheduling:

- **Lesson Display** - Lessons appear on correct day/time
- **Drag-and-Drop Rescheduling** - Move lessons on calendar
- **Conflict Warning** - Prevent scheduling conflicts
- **Recurring Lessons** - Display weekly recurring pattern

**Key Features Tested:**
- Calendar view (day/week/month)
- Drag-and-drop functionality
- Conflict detection
- Recurring lesson pattern display

### 8. Multi-Tenancy Security - 3 Tests

Critical security tests to prevent data leakage:

- **Cross-School Access Prevention** - Teachers cannot access other schools' lessons
- **Student Enrollment Filtering** - Students see only enrolled lessons
- **Parent Family Filtering** - Parents see only their children's lessons

**Key Features Tested:**
- schoolId filtering at all levels
- 404/Access Denied for unauthorized access
- Proper data isolation between schools

## Total Test Count: **42 Tests**

## Test Scenarios Covered

### Lesson Types
- Individual (45 minutes)
- Group (60 minutes)
- Band (60 minutes)
- Hybrid (mixed pattern)

### User Roles
- Admin (full CRUD)
- Teacher (view all, mark attendance, add notes, upload resources)
- Parent (view children's lessons)
- Student (view enrolled lessons, download resources)

### Critical Requirements

#### From CLAUDE.md:
1. **Multi-Tenancy Security** - Always filter by schoolId
2. **Teacher Notes Required** - Per student AND per class, expected daily, must complete by end of week
3. **Teachers View All Classes** - For coverage/substitution capability
4. **Google Drive Integration** - Two-way sync with visibility rules
5. **Hybrid Lessons** - Core differentiator, group/individual pattern

## API Endpoints Tested

### Lesson CRUD
- `GET /lessons` - List lessons
- `POST /lessons` - Create lesson
- `GET /lessons/:id` - Get lesson detail
- `PUT /lessons/:id` - Update lesson
- `DELETE /lessons/:id` - Delete lesson

### Enrollment
- `POST /lessons/:id/enrollments` - Enroll students
- `DELETE /lessons/:id/enrollments/:studentId` - Remove student
- `GET /lessons/:id/enrollments` - List enrolled students

### Attendance
- `GET /attendance` - Get attendance records
- `POST /attendance` - Mark attendance
- `PUT /attendance/:id` - Update attendance
- `GET /attendance/stats` - Get statistics

### Notes
- `GET /notes` - Get notes (class and student)
- `POST /notes` - Create note
- `PUT /notes/:id` - Update note
- `GET /notes/history` - Get note history

### Resources
- `GET /resources` - List files
- `POST /resources/upload` - Upload file
- `PUT /resources/:id` - Update file settings (visibility)
- `GET /resources/:id/download` - Download file

### Calendar
- `GET /calendar/events` - Get calendar events
- `PUT /calendar/events/:id` - Reschedule event

## Running the Tests

### Run All Lesson Management Tests
```bash
cd apps/frontend
npx playwright test e2e/flows/lesson-management.spec.ts
```

### Run Specific Test Suite
```bash
# Lesson Creation tests only
npx playwright test e2e/flows/lesson-management.spec.ts -g "Lesson Creation"

# Attendance tests only
npx playwright test e2e/flows/lesson-management.spec.ts -g "Attendance Marking"

# Security tests only
npx playwright test e2e/flows/lesson-management.spec.ts -g "Multi-Tenancy Security"
```

### Run in Headed Mode (See Browser)
```bash
npx playwright test e2e/flows/lesson-management.spec.ts --headed
```

### Run in Debug Mode
```bash
npx playwright test e2e/flows/lesson-management.spec.ts --debug
```

### Generate Test Report
```bash
npx playwright test e2e/flows/lesson-management.spec.ts --reporter=html
npx playwright show-report
```

## Test Data Requirements

Tests assume the following seed data exists in the test database:

### School Setup
- Test school: `music-n-me-test`
- 2 locations (Sydney CBD, North Sydney)
- 3 rooms per location
- 4 lesson types (Individual, Group, Band, Hybrid)
- 5 instruments (Piano, Guitar, Drums, Singing, Bass)

### Users
- Admin user: `admin@musicnme.test`
- Teacher user: `teacher@musicnme.test`
- Parent user: `parent@musicnme.test`
- Student user: `student@musicnme.test`

### Test Lessons
- At least 1 lesson of each type
- Some lessons with enrolled students
- Some lessons at capacity (for waitlist testing)
- At least 1 hybrid lesson with configured pattern

See `apps/frontend/e2e/helpers/test-data.ts` for complete test data structure.

## Known Limitations

### File Upload/Download
- File upload tests use simplified simulation
- In production, use Playwright's `setInputFiles()` method
- Download tests require `waitForEvent('download')` handling

### Drag-and-Drop
- Calendar drag-and-drop tests use simplified approach
- Full implementation depends on calendar library (FullCalendar, React Big Calendar, etc.)
- May require `page.mouse.down()`, `page.mouse.move()`, `page.mouse.up()` for precise control

### Real-Time Updates
- Hybrid booking conflict test simulates real-time with page reload
- Production should use WebSocket or Server-Sent Events for true real-time
- Consider adding WebSocket tests separately

## Test Maintenance

### When to Update Tests

1. **UI Changes** - Update selectors if component structure changes
2. **New Features** - Add tests for new lesson types or functionality
3. **API Changes** - Update endpoint paths and response structures
4. **Business Logic** - Adjust validation rules (capacity, duration, etc.)

### Best Practices

1. **Use data-testid attributes** - More stable than text-based selectors
2. **Avoid hard-coded waits** - Use `waitForSelector` or `expect().toBeVisible()`
3. **Test user behavior** - Focus on what users see/do, not implementation
4. **Keep tests independent** - Each test should work in isolation
5. **Clean up test data** - Use `testData.cleanup()` in teardown

## Next Steps

### Additional Test Coverage Needed

1. **Lesson Editing** - Update existing lessons
2. **Lesson Deletion** - Soft delete with confirmation
3. **Advanced Filtering** - Filter by type, instrument, teacher, location
4. **Search Functionality** - Search lessons by name
5. **Lesson Duplication** - Clone lesson configuration
6. **Print/Export** - Export lesson schedules
7. **Mobile Responsiveness** - Test on mobile viewports

### Integration with Other Flows

1. **Invoicing** - Lesson enrollment triggers invoice generation
2. **Meet & Greet** - Convert meet & greet to lesson enrollment
3. **Family Accounts** - Multiple students from same family
4. **Google Calendar Sync** - Lessons sync to Google Calendar (Phase 2)

### Performance Testing

1. **Large Class Sizes** - Test with 50+ students
2. **Many Lessons** - Test with 100+ lessons
3. **File Upload Limits** - Test large file uploads (>10MB)
4. **Calendar Performance** - Month view with 200+ events

## Success Criteria

Tests are passing when:
- All 42 tests pass consistently
- No flaky tests (pass/fail intermittently)
- Tests complete in <5 minutes
- Coverage includes all critical user journeys
- Multi-tenancy security is verified
- Teacher notes requirement is enforced

## Support

For questions or issues:
1. Check test output for detailed error messages
2. Review Playwright trace viewer for failed tests
3. Consult `apps/frontend/e2e/README.md` for general E2E guidance
4. See `CLAUDE.md` for Music 'n Me specific requirements
