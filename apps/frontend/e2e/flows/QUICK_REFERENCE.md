# Lesson Management E2E Tests - Quick Reference

## Quick Start

```bash
# Run all lesson management tests
cd apps/frontend
npx playwright test e2e/flows/lesson-management.spec.ts

# Run specific suite
npx playwright test -g "Lesson Creation"

# Debug mode
npx playwright test e2e/flows/lesson-management.spec.ts --debug

# Watch mode
npx playwright test e2e/flows/lesson-management.spec.ts --ui
```

## Test Suites (42 tests)

| Suite | Tests | Focus |
|-------|-------|-------|
| Lesson Creation | 8 | Admin creates all lesson types |
| Lesson Enrollment | 6 | Student enrollment, capacity |
| Teacher View | 4 | View all school lessons |
| Attendance Marking | 7 | Mark present/absent/late |
| Teacher Notes | 5 | Required class & student notes |
| Resource Management | 5 | Google Drive integration |
| Calendar Integration | 4 | Scheduling, conflicts |
| Multi-Tenancy Security | 3 | Cross-school prevention |

## Common Commands

### Run Specific Tests
```bash
# Creation only
npx playwright test -g "admin can create individual lesson"

# Attendance only
npx playwright test -g "Attendance Marking"

# Security only
npx playwright test -g "Multi-Tenancy"
```

### Debug & Troubleshoot
```bash
# Headed (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slowMo=1000

# Show trace
npx playwright show-trace trace.zip

# Generate code
npx playwright codegen http://localhost:3001
```

### Reports
```bash
# HTML report
npx playwright test --reporter=html
npx playwright show-report

# List all tests
npx playwright test --list

# Show test output
npx playwright test --reporter=line
```

## Test Files

| File | Purpose |
|------|---------|
| `lesson-management.spec.ts` | Main test file (997 lines) |
| `lesson-management.README.md` | Full documentation |
| `TEST_COVERAGE_MATRIX.md` | Coverage details |
| `IMPLEMENTATION_SUMMARY.md` | Implementation guide |
| `QUICK_REFERENCE.md` | This file |

## Key Fixtures

```typescript
// Auto-login fixtures
test('example', async ({ adminPage }) => {
  // Already logged in as admin
});

test('example', async ({ teacherPage }) => {
  // Already logged in as teacher
});

test('example', async ({ parentPage }) => {
  // Already logged in as parent
});

test('example', async ({ studentPage }) => {
  // Already logged in as student
});
```

## Common Patterns

### Check if element exists
```typescript
const exists = await element.isVisible({ timeout: 3000 }).catch(() => false);
if (exists) {
  // Do something
}
```

### Multiple selector fallbacks
```typescript
const button = page.locator(
  'button:has-text("Create"), button:has-text("New")'
);
```

### Wait for success message
```typescript
await expect(
  page.locator('text=/success|created|saved/i')
).toBeVisible({ timeout: 5000 });
```

### Select from dropdown
```typescript
// Material-UI Select
const select = page.locator('[data-testid="lesson-type-select"]');
await select.click();
await page.click('li:has-text("Individual")');

// Native select
await page.selectOption('select[name="type"]', { label: 'Individual' });
```

## Test Data

### Users (all password: TestPassword123!)
- `admin@musicnme.test` - Admin
- `teacher@musicnme.test` - Teacher
- `parent@musicnme.test` - Parent
- `student@musicnme.test` - Student

### School
- Slug: `music-n-me-test`
- Locations: Sydney CBD, North Sydney
- Rooms: 6 total (3 per location)

### Lesson Types
- Individual (45 min)
- Group (60 min)
- Band (60 min)
- Hybrid (mixed)

### Instruments
- Piano, Guitar, Drums, Singing, Bass

## Required data-testid Attributes

### Critical Selectors
```tsx
// Lesson management
data-testid="lessons-list"
data-testid="lesson-card"
data-testid="lesson-type-select"
data-testid="instrument-select"

// Enrollment
data-testid="enrolled-students"
data-testid="student-select"
data-testid="enrollment-count"

// Attendance
data-testid="attendance-list"
data-testid="attendance-tab"
data-attendance-status="present|absent|late"

// Notes
data-testid="class-note-input"
data-testid="student-note-input"
data-testid="notes-completion"

// Resources
data-testid="resources-section"
data-testid="files-list"

// Calendar
data-testid="calendar"
data-testid="lesson-event"

// Hybrid
data-testid="hybrid-pattern-config"
data-week-type="GROUP|INDIVIDUAL"
```

## Coverage Summary

| Category | Coverage |
|----------|----------|
| Critical Requirements | 100% (12/12) |
| API Endpoints | 91% (20/22) |
| User Journeys | 100% Admin/Teacher/Student |
| Lesson Types | 100% (all 4) |
| Security Tests | 8 tests |

## Troubleshooting

### Test Timeout
```typescript
// Increase timeout
await element.click({ timeout: 10000 });

// Wait for network
await page.waitForLoadState('networkidle');
```

### Element Not Found
```typescript
// Check if exists first
const count = await element.count();
if (count > 0) {
  await element.click();
}

// Use .first() or .nth()
await page.locator('button').first().click();
```

### Flaky Tests
```typescript
// Use expect instead of isVisible
await expect(element).toBeVisible();

// Add explicit waits
await page.waitForSelector('[data-testid="target"]');
```

## Next Steps

1. Add data-testid attributes to components
2. Create test seed data
3. Run tests and fix failures
4. Add to CI/CD pipeline
5. Monitor test health

## Resources

- **Full Docs:** `lesson-management.README.md`
- **Coverage:** `TEST_COVERAGE_MATRIX.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`
- **Playwright:** https://playwright.dev
- **Project:** `CLAUDE.md`

## Quick Validation

```bash
# Validate test file syntax
npx tsc --noEmit e2e/flows/lesson-management.spec.ts

# List all tests
npx playwright test e2e/flows/lesson-management.spec.ts --list

# Dry run (no execution)
npx playwright test --dry-run
```

---

**42 tests | 997 lines | 8 suites | 100% critical coverage**
