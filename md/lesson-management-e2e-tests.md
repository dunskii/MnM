# Lesson Management E2E Tests - Implementation Summary

**Created:** 2025-12-26
**File:** `apps/frontend/e2e/flows/lesson-management.spec.ts`
**Total Tests:** 42 comprehensive E2E tests

## Quick Summary

Created complete E2E test suite for Music 'n Me lesson management flow covering:
- Lesson creation (all 4 types)
- Student enrollment
- Teacher attendance marking
- Required teacher notes
- Google Drive resource management
- Calendar integration
- Multi-tenancy security

## File Structure

### Main Test File
`apps/frontend/e2e/flows/lesson-management.spec.ts` - 42 tests across 8 test suites

### Documentation
`apps/frontend/e2e/flows/lesson-management.README.md` - Comprehensive documentation

## Test Suites Breakdown

### 1. Lesson Creation (8 tests)
- Create Individual lesson (45 min)
- Create Group lesson (60 min)
- Create Band lesson (60 min)
- Create Hybrid lesson with pattern configuration
- Field validation
- Schedule conflict detection
- Calendar integration

### 2. Lesson Enrollment (6 tests)
- Single student enrollment
- Bulk enrollment (multiple students)
- Student removal
- Capacity enforcement
- Waitlist functionality
- Enrollment count updates

### 3. Teacher View - All Lessons (4 tests)
**Per CLAUDE.md requirement:** Teachers can view ALL school lessons for coverage
- View all lessons in school
- Filter by assigned lessons
- View lesson details
- View enrolled students

### 4. Attendance Marking (7 tests)
- Mark present/absent/late
- Batch mark all present
- Attendance history
- Attendance statistics

### 5. Teacher Notes - REQUIRED (5 tests)
**Per CLAUDE.md requirement:** Notes required per student AND per class
- Add class note
- Add student-specific note
- Edit existing note
- Notes completion tracking
- View note history

### 6. Resource Management - Google Drive (5 tests)
- Link Google Drive folder (admin)
- Upload file (teacher)
- Set file visibility (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)
- File access based on visibility
- Download file

### 7. Calendar Integration (4 tests)
- Lesson displays on correct day/time
- Drag-and-drop rescheduling
- Conflict warnings
- Recurring lessons display

### 8. Multi-Tenancy Security (3 tests)
**CRITICAL:** Prevent data leakage between schools
- Cross-school access prevention
- Student enrollment filtering
- Parent family filtering

## Key Features Tested

### Lesson Types (All 4)
- Individual: 45 minutes, 1 student
- Group: 60 minutes, 6+ students
- Band: 60 minutes, 4-6 students
- Hybrid: Mixed group/individual pattern (CORE FEATURE)

### User Roles
- **Admin:** Full CRUD on lessons, enrollment, settings
- **Teacher:** View all lessons, mark attendance, add notes, upload resources
- **Parent:** View children's lessons, book hybrid individual sessions
- **Student:** View enrolled lessons, download resources

### Critical Requirements (From CLAUDE.md)

1. **Multi-Tenancy Security**
   - Always filter by schoolId
   - No cross-school data access
   - Tested in 3 dedicated security tests

2. **Teacher Notes (Required)**
   - Per student AND per class
   - Expected daily, must complete by end of week
   - Completion tracking

3. **Teachers View All Classes**
   - For coverage and substitution
   - Can filter to "My Lessons"

4. **Google Drive Integration**
   - Two-way sync
   - File visibility rules enforced
   - Upload/download tested

5. **Hybrid Lessons**
   - Core differentiator
   - Pattern configuration tested
   - See separate `hybrid-booking.spec.ts`

## Test Helpers Used

### Fixtures (`apps/frontend/e2e/fixtures/test-fixtures.ts`)
- `adminPage` - Auto-login as admin
- `teacherPage` - Auto-login as teacher
- `parentPage` - Auto-login as parent
- `studentPage` - Auto-login as student
- `testData` - Test data factory

### Auth Helpers (`apps/frontend/e2e/helpers/auth.ts`)
- `loginAsAdmin(page)`
- `loginAsTeacher(page)`
- `loginAsParent(page)`
- `loginAsStudent(page)`

### Test Data (`apps/frontend/e2e/helpers/test-data.ts`)
- `TEST_SCHOOL` - School configuration
- `TEST_INSTRUMENTS` - Piano, Guitar, Drums, etc.
- `TEST_LESSON_TYPES` - Individual, Group, Band, Hybrid
- `TEST_STUDENTS` - Sample students
- `TestDataFactory` - Create test data via API

## Running Tests

### All Lesson Management Tests
```bash
cd apps/frontend
npx playwright test e2e/flows/lesson-management.spec.ts
```

### Specific Test Suites
```bash
# Lesson creation only
npx playwright test -g "Lesson Creation"

# Attendance only
npx playwright test -g "Attendance Marking"

# Security only
npx playwright test -g "Multi-Tenancy Security"
```

### Debug Mode
```bash
npx playwright test e2e/flows/lesson-management.spec.ts --debug
```

### Headed Mode (See Browser)
```bash
npx playwright test e2e/flows/lesson-management.spec.ts --headed
```

### Generate HTML Report
```bash
npx playwright test e2e/flows/lesson-management.spec.ts --reporter=html
npx playwright show-report
```

## Test Data Requirements

Tests assume seed data exists:

### School Setup
- School slug: `music-n-me-test`
- 2 locations: Sydney CBD, North Sydney
- 6 rooms total (3 per location)
- 4 lesson types: Individual, Group, Band, Hybrid
- 5 instruments: Piano, Guitar, Drums, Singing, Bass

### Users
- `admin@musicnme.test` - Admin access
- `teacher@musicnme.test` - Teacher access
- `parent@musicnme.test` - Parent access
- `student@musicnme.test` - Student access
- All passwords: `TestPassword123!`

### Test Lessons
- At least 1 lesson of each type
- Some with enrolled students
- Some at capacity (for waitlist)
- At least 1 hybrid with pattern

## API Endpoints Covered

### Lessons
- `GET/POST /api/lessons` - List/Create
- `GET/PUT/DELETE /api/lessons/:id` - CRUD

### Enrollment
- `POST /api/lessons/:id/enrollments` - Enroll
- `DELETE /api/lessons/:id/enrollments/:studentId` - Remove
- `GET /api/lessons/:id/enrollments` - List

### Attendance
- `GET/POST /api/attendance` - Get/Mark
- `PUT /api/attendance/:id` - Update
- `GET /api/attendance/stats` - Statistics

### Notes
- `GET/POST /api/notes` - Get/Create
- `PUT /api/notes/:id` - Update
- `GET /api/notes/history` - History

### Resources
- `GET/POST /api/resources` - List/Upload
- `PUT /api/resources/:id` - Update settings
- `GET /api/resources/:id/download` - Download

### Calendar
- `GET /api/calendar/events` - Events
- `PUT /api/calendar/events/:id` - Reschedule

## Selector Strategy

### Preferred Selectors (in order)
1. `data-testid` attributes - Most stable
2. ARIA roles/labels - Semantic
3. Text content - User-facing
4. CSS selectors - Last resort

### Examples Used
```typescript
// data-testid (best)
adminPage.locator('[data-testid="lesson-type-select"]')

// ARIA role
adminPage.locator('[role="dialog"]')

// Text content
adminPage.locator('button:has-text("Create Lesson")')

// Multiple selectors with fallback
const createButton = adminPage.locator(
  'button:has-text("Create Lesson"), button:has-text("New Lesson")'
);
```

## Known Limitations & Future Work

### Current Limitations

1. **File Upload/Download**
   - Simplified simulation
   - Production needs `setInputFiles()` and download event handling

2. **Drag-and-Drop**
   - Basic approach
   - Depends on calendar library (FullCalendar, React Big Calendar)
   - May need mouse events for precision

3. **Real-Time Updates**
   - Uses page reload instead of true real-time
   - Production should use WebSocket/SSE

### Future Test Coverage

1. **Lesson Management**
   - Lesson editing
   - Lesson deletion (soft delete)
   - Advanced filtering
   - Search functionality
   - Lesson duplication

2. **Integration Tests**
   - Invoicing triggered by enrollment
   - Meet & Greet conversion to enrollment
   - Family account management
   - Google Calendar sync (Phase 2)

3. **Performance Tests**
   - Large class sizes (50+ students)
   - Many lessons (100+)
   - Large file uploads (>10MB)
   - Calendar with 200+ events

4. **Mobile Testing**
   - Responsive design on mobile viewports
   - Touch interactions
   - Mobile-specific UI

## Success Metrics

Tests are successful when:
- All 42 tests pass consistently
- No flaky tests (random failures)
- Tests complete in <5 minutes
- Multi-tenancy security verified (100%)
- Teacher notes requirement enforced
- All critical user journeys covered

## Integration with CI/CD

### Pre-Commit
```bash
# Run quick smoke tests
npx playwright test e2e/flows/smoke.spec.ts
```

### Pull Request
```bash
# Run all E2E tests
npx playwright test
```

### Nightly Build
```bash
# Run all tests with retries
npx playwright test --retries=2 --workers=4
```

## Troubleshooting

### Test Failures

1. **Check Playwright trace**
   ```bash
   npx playwright test --trace on
   npx playwright show-trace trace.zip
   ```

2. **Check screenshots**
   ```bash
   # Screenshots saved to test-results/
   ```

3. **Run in headed mode**
   ```bash
   npx playwright test --headed --slowMo=1000
   ```

### Common Issues

1. **Timeout Errors**
   - Increase timeout: `await element.click({ timeout: 10000 })`
   - Check network speed
   - Wait for network idle: `await page.waitForLoadState('networkidle')`

2. **Element Not Found**
   - Verify selector with `page.locator().count()`
   - Check if element is in shadow DOM
   - Wait for element: `await page.waitForSelector()`

3. **Flaky Tests**
   - Add explicit waits
   - Check for race conditions
   - Use `expect().toBeVisible()` instead of `isVisible()`

## Related Files

### Test Files
- `apps/frontend/e2e/flows/authentication.spec.ts` - Auth flow
- `apps/frontend/e2e/flows/hybrid-booking.spec.ts` - Hybrid booking
- `apps/frontend/e2e/flows/smoke.spec.ts` - Smoke tests

### Helper Files
- `apps/frontend/e2e/helpers/auth.ts` - Auth helpers
- `apps/frontend/e2e/helpers/test-data.ts` - Test data
- `apps/frontend/e2e/helpers/api-mocks.ts` - API mocking
- `apps/frontend/e2e/fixtures/test-fixtures.ts` - Fixtures

### Documentation
- `apps/frontend/e2e/README.md` - E2E overview
- `apps/frontend/e2e/flows/lesson-management.README.md` - This test suite
- `CLAUDE.md` - Project requirements
- `docs/development-workflow.md` - Development process

## Next Steps

1. **Run Tests Locally**
   ```bash
   cd apps/frontend
   npx playwright test e2e/flows/lesson-management.spec.ts
   ```

2. **Add data-testid Attributes**
   - Update components to include `data-testid` props
   - More stable than text-based selectors

3. **Create Test Seed Data**
   - Database seed script for test data
   - Consistent data across test runs

4. **Integrate with CI/CD**
   - Add to GitHub Actions
   - Run on PR and nightly builds

5. **Monitor Test Health**
   - Track flaky tests
   - Measure test execution time
   - Review coverage reports

## Conclusion

Comprehensive lesson management E2E test suite covering all critical user journeys from lesson creation to resource sharing. Tests enforce Music 'n Me's core requirements including:
- Multi-tenancy security
- Teacher notes requirement
- All lesson types (especially Hybrid)
- Google Drive integration
- Teacher access to all school lessons

**Files Created:**
1. `apps/frontend/e2e/flows/lesson-management.spec.ts` (42 tests)
2. `apps/frontend/e2e/flows/lesson-management.README.md` (documentation)
3. `md/lesson-management-e2e-tests.md` (this summary)

Ready for integration with frontend implementation and CI/CD pipeline.
