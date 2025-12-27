# Playwright E2E Testing - Quick Start Guide

## Overview

This guide will help you get started with E2E testing for the Music 'n Me frontend using Playwright.

## Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:5000`
- Frontend dev server running on `http://localhost:3001`
- Test database seeded with test users

## Installation

Playwright is already installed. If you need to reinstall:

```bash
cd apps/frontend
npm install -D @playwright/test
npx playwright install
```

## Running Tests

### 1. Start the Development Servers

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
```

### 2. Run E2E Tests

**Terminal 3 - Tests:**

```bash
cd apps/frontend

# Run all tests (headless)
npm run e2e

# Run with UI mode (recommended for development)
npm run e2e:ui

# Run in headed mode (see the browser)
npm run e2e:headed

# Debug a specific test
npm run e2e:debug

# Run specific test file
npx playwright test smoke.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Data Setup

### Required Test Users

Make sure your test database has these users:

```sql
-- Admin User
email: admin@musicnme.test
password: TestPassword123!
role: ADMIN

-- Teacher User
email: teacher@musicnme.test
password: TestPassword123!
role: TEACHER

-- Parent User
email: parent@musicnme.test
password: TestPassword123!
role: PARENT

-- Student User
email: student@musicnme.test
password: TestPassword123!
role: STUDENT
```

### School Data

School slug: `music-n-me-test`

You can create these users using the backend seed script or manually via the database.

## Writing Your First Test

### 1. Create a New Test File

Create `apps/frontend/e2e/flows/my-feature.spec.ts`:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('My Feature', () => {
  test('should do something', async ({ adminPage }) => {
    // adminPage is already logged in as admin
    await adminPage.goto('/admin/my-feature');

    // Your test code here
    await expect(adminPage.locator('h1')).toContainText('My Feature');
  });
});
```

### 2. Run Your Test

```bash
npm run e2e my-feature.spec.ts
```

## Using Fixtures

### Authenticated Pages

```typescript
test('admin test', async ({ adminPage }) => {
  // Already logged in as admin
});

test('teacher test', async ({ teacherPage }) => {
  // Already logged in as teacher
});

test('parent test', async ({ parentPage }) => {
  // Already logged in as parent
});

test('student test', async ({ studentPage }) => {
  // Already logged in as student
});
```

### Manual Login

```typescript
import { loginAsAdmin, logout } from '../helpers/auth';

test('manual login', async ({ page }) => {
  await loginAsAdmin(page);

  // Do stuff...

  await logout(page);
});
```

### Test Data Factory

```typescript
test('create data', async ({ testData }) => {
  const student = await testData.createStudent({
    firstName: 'Test',
    lastName: 'Student',
  });

  // Use student data in test...
});
```

## Best Practices

### 1. Use data-testid Attributes

Add to your components:

```tsx
<button data-testid="submit-button">Submit</button>
<div data-testid="student-card">...</div>
```

In tests:

```typescript
await page.click('[data-testid="submit-button"]');
await expect(page.locator('[data-testid="student-card"]')).toBeVisible();
```

### 2. Wait for Elements Properly

```typescript
// ✅ Good - Playwright auto-waits
await expect(page.locator('h1')).toBeVisible();

// ❌ Bad - Arbitrary waits
await page.waitForTimeout(5000);
```

### 3. Use Role-Based Selectors

```typescript
// ✅ Good
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('heading', { name: 'Dashboard' });

// ⚠️ Okay
await page.locator('button:has-text("Submit")').click();
```

### 4. Test Multi-Tenancy

Always test data isolation:

```typescript
test('should isolate school data', async ({ adminPage }) => {
  // Create data for School A
  // Try to access as School B
  // Should fail
});
```

## Debugging Tests

### 1. Playwright Inspector

```bash
npm run e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- Inspect selectors
- View console logs
- See screenshots

### 2. Screenshots and Videos

Automatically captured on test failure in `test-results/`:

```
test-results/
  my-test-chromium/
    test-failed-1.png
    video.webm
    trace.zip
```

### 3. Trace Viewer

```bash
npx playwright show-trace test-results/.../trace.zip
```

Shows:
- Network requests
- Console logs
- DOM snapshots
- Screenshots

### 4. Headed Mode

See the browser while tests run:

```bash
npm run e2e:headed
```

### 5. Slow Motion

Add to test:

```typescript
test.use({
  launchOptions: { slowMo: 500 } // 500ms delay between actions
});
```

## Common Issues

### 1. Tests Timing Out

Increase timeout:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### 2. Flaky Tests

Usually caused by:
- Race conditions
- Not waiting for elements
- Timing-dependent logic

Fix:
- Use proper waiting strategies
- Check for element visibility before clicking
- Ensure test data is properly set up

### 3. Port Already in Use

Make sure backend (5000) and frontend (3001) ports are available.

Kill processes:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### 4. Authentication Failing

Check:
- Test users exist in database
- Passwords match
- Backend API is running
- CORS is configured

## CI/CD Integration

Tests will run automatically in CI:

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Reports

### HTML Report

Generated automatically after test run:

```bash
# View report
npm run e2e:report

# Or open manually
open playwright-report/index.html
```

Shows:
- Test results (pass/fail)
- Screenshots
- Videos
- Traces
- Timing information

### CI Report

On CI, reports are uploaded as artifacts.

## Next Steps

1. Add more test files in `e2e/flows/`
2. Add `data-testid` attributes to your components
3. Create test data seed scripts
4. Set up CI/CD pipeline
5. Add visual regression testing (optional)

## Resources

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Support

For issues or questions:
- Check the Playwright docs
- Review existing test examples in `e2e/flows/`
- Check test output and screenshots in `test-results/`
