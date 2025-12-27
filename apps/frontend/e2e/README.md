# E2E Testing with Playwright

This directory contains end-to-end (E2E) tests for the Music 'n Me frontend application using Playwright.

## Structure

```
e2e/
├── setup/
│   └── global-setup.ts       # Global setup for all tests (database seeding, etc.)
├── helpers/
│   ├── auth.ts               # Authentication helpers (login, logout)
│   ├── test-data.ts          # Test data factories and constants
│   ├── api-mocks.ts          # API response mocking utilities
│   └── meet-and-greet.ts     # Meet & Greet specific helpers
├── fixtures/
│   └── test-fixtures.ts      # Custom Playwright fixtures
├── flows/
│   ├── smoke.spec.ts         # Sample smoke tests
│   ├── authentication.spec.ts # Login/logout flows
│   ├── hybrid-booking.spec.ts # Hybrid lesson booking
│   └── meet-and-greet.spec.ts # Meet & Greet complete flow
└── README.md                 # This file
```

## Running Tests

### Run all tests

```bash
npm run e2e
```

### Run with UI mode (recommended for development)

```bash
npm run e2e:ui
```

### Run in headed mode (see browser)

```bash
npm run e2e:headed
```

### Debug tests

```bash
npm run e2e:debug
```

### View test report

```bash
npm run e2e:report
```

## Writing Tests

### Basic Test

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-page');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Using Authentication Fixtures

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Admin Dashboard', () => {
  test('should show admin stats', async ({ adminPage }) => {
    // adminPage is already logged in as admin
    await expect(adminPage).toHaveURL(/\/admin/);
  });
});
```

### Using Test Data Factories

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Students', () => {
  test('should create a student', async ({ testData, adminPage }) => {
    const student = await testData.createStudent({
      firstName: 'Test',
      lastName: 'Student',
    });

    // Test continues with created student...
  });
});
```

### Mocking API Responses

```typescript
import { test, expect } from '../fixtures/test-fixtures';
import { mockStudentsList } from '../helpers/api-mocks';

test.describe('Students List', () => {
  test('should display students', async ({ page }) => {
    // Mock the API response
    await mockStudentsList(page);

    await page.goto('/admin/students');

    // Verify students are displayed
    await expect(page.locator('[data-testid="student-card"]')).toHaveCount(3);
  });
});
```

## Best Practices

1. **Use data-testid attributes** - Add `data-testid` attributes to important elements for stable selectors
2. **Avoid hard-coded waits** - Use Playwright's auto-waiting and explicit assertions
3. **Clean up test data** - Use the testData fixture which automatically cleans up
4. **Test user journeys** - Focus on critical user flows, not individual components
5. **Use fixtures** - Leverage custom fixtures for common setup (authentication, test data)
6. **Multi-tenancy testing** - Always verify data isolation between schools
7. **Mobile testing** - Test responsive design on different viewports

## Test Organization

Organize tests by user journey or feature:

- `smoke.spec.ts` - Basic functionality smoke tests
- `authentication.spec.ts` - Login, logout, and session management
- `hybrid-booking.spec.ts` - Hybrid booking flow (core differentiator)
- `meet-and-greet.spec.ts` - Complete Meet & Greet flow (public booking → verification → admin approval → registration → payment)
- `admin-dashboard.spec.ts` - Admin dashboard features
- `teacher-resources.spec.ts` - Teacher file upload/management
- `parent-portal.spec.ts` - Parent-facing features

## Meet & Greet E2E Tests

The Meet & Greet test suite (`meet-and-greet.spec.ts`) covers the complete lead conversion flow:

### Test Coverage

**1. Public Booking Flow** (No authentication required)
- Form validation (required fields, email format, phone format)
- Successful booking submission
- Time slot selection
- Duplicate booking prevention
- Notes/comments field
- Available time slots display

**2. Email Verification**
- Valid token verification
- Invalid token error handling
- Expired token error handling
- Already verified email handling

**3. Admin Approval Flow**
- Viewing pending Meet & Greets
- Filtering by status
- Viewing booking details
- Approving bookings (sends registration email)
- Rejecting bookings with reason
- Adding notes to bookings

**4. Registration & Payment**
- Pre-filled form from Meet & Greet data
- Password creation and validation
- Password confirmation matching
- Adding additional children
- Stripe checkout initiation
- Account creation after successful payment
- Payment requirement notice

**5. Edge Cases**
- Network errors
- Session timeout on registration page
- Booking on already filled time slots
- Multi-child family registration

**6. Accessibility**
- Keyboard navigation
- Form label associations

### Running Meet & Greet Tests

```bash
# Run all Meet & Greet tests
npx playwright test e2e/flows/meet-and-greet.spec.ts

# Run specific test group
npx playwright test e2e/flows/meet-and-greet.spec.ts -g "Public Booking Flow"

# Run in UI mode for debugging
npx playwright test e2e/flows/meet-and-greet.spec.ts --ui

# Run in headed mode to see browser
npx playwright test e2e/flows/meet-and-greet.spec.ts --headed
```

### Using Meet & Greet Helpers

```typescript
import {
  generateMeetAndGreetData,
  fillMeetAndGreetForm,
  completeMeetAndGreetBooking,
  mockMeetAndGreetBookingSuccess,
  mockEmailVerificationSuccess,
  mockMeetAndGreetList,
  mockMeetAndGreetApproval,
  approveMeetAndGreetAsAdmin,
  rejectMeetAndGreetAsAdmin,
  mockRegistrationTokenValidation,
  mockStripeCheckoutCreation,
} from '../helpers/meet-and-greet';

// Generate random test data
const bookingData = generateMeetAndGreetData({
  childName: 'Emma',
  childAge: 7,
  instrumentInterest: 'Piano',
});

// Fill booking form
await fillMeetAndGreetForm(page, bookingData);

// Complete entire booking flow
const data = await completeMeetAndGreetBooking(page, { childName: 'Emma' });

// Mock API responses
await mockMeetAndGreetBookingSuccess(page);
await mockEmailVerificationSuccess(page, bookingData);
await mockMeetAndGreetList(page);
await mockMeetAndGreetApproval(page);

// Admin actions
await approveMeetAndGreetAsAdmin(page);
await rejectMeetAndGreetAsAdmin(page, 'Not suitable for program');

// Registration mocks
await mockRegistrationTokenValidation(page, bookingData);
await mockStripeCheckoutCreation(page);
```

### Test Data Examples

**Meet & Greet Booking:**
```typescript
{
  parent1Name: 'Sarah Smith',
  parent1Email: 'sarah@example.com',
  parent1Phone: '+61412345678',
  parent2Name: 'John Smith',        // Optional
  parent2Email: 'john@example.com', // Optional
  parent2Phone: '+61498765432',     // Optional
  emergencyContactName: 'Mary Johnson',
  emergencyContactPhone: '+61411222333',
  childName: 'Emma',
  childAge: 7,
  instrumentInterest: 'Piano',
  notes: 'Very excited about learning piano!',
}
```

**Expected API Flow:**
1. POST `/api/v1/public/meet-and-greet/book` → Creates booking, sends verification email
2. GET `/api/v1/public/meet-and-greet/verify/:token` → Verifies email, confirms booking
3. GET `/api/v1/meet-and-greet` → Admin views pending bookings
4. POST `/api/v1/meet-and-greet/:id/approve` → Sends registration email
5. GET `/api/v1/registration/token/:token` → Validates token, returns pre-filled data
6. POST `/api/v1/payments/create-checkout` → Creates Stripe session
7. POST `/api/v1/registration/complete` → Creates account after payment

## Multi-Tenancy Testing

Always verify data isolation between schools:

```typescript
test('should not expose School A data to School B', async ({ page }) => {
  // Login as School A admin
  await loginAsAdmin(page); // School A

  // Create lesson for School A
  const lesson = await testData.createLesson({ name: 'School A Lesson' });

  // Logout and login as School B admin
  await logout(page);
  await loginAsAdmin(page); // School B (different school)

  // Try to access School A lesson - should fail
  await page.goto(`/admin/lessons/${lesson.id}`);
  await expect(page.locator('text=/not found|access denied/i')).toBeVisible();
});
```

## Debugging Tips

1. **Use Playwright Inspector**:
   ```bash
   npm run e2e:debug
   ```

2. **Check screenshots on failure** - Automatically saved to `test-results/`

3. **View trace files** - Use `npx playwright show-trace trace.zip`

4. **Slow down tests**:
   ```typescript
   test.use({ launchOptions: { slowMo: 500 } });
   ```

## CI/CD Integration

Tests will automatically:
- Run in headless mode on CI
- Retry failed tests (2 retries)
- Generate HTML reports
- Save screenshots/videos on failure

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
