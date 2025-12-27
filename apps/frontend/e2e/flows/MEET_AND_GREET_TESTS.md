# Meet & Greet E2E Tests - Quick Reference

## Overview

Comprehensive E2E test suite for the Meet & Greet booking system, covering the complete lead conversion flow from initial booking through account creation.

**Total Coverage:** 1,080 lines of test code + 532 lines of helper functions

## Files Created

1. **`meet-and-greet.spec.ts`** - Main test file (1,080 lines)
2. **`../helpers/meet-and-greet.ts`** - Helper functions (532 lines)
3. **Updated `../README.md`** - Documentation with Meet & Greet section

## Test Suites

### 1. Public Booking Flow (8 tests)
Tests the public-facing booking form without authentication.

```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts -g "Public Booking Flow"
```

**Tests:**
- Form displays without authentication
- Validates required fields
- Validates email format
- Validates phone number format
- Submits valid booking successfully
- Allows adding notes/comments
- Shows available time slots
- Prevents duplicate bookings

### 2. Email Verification (5 tests)
Tests email verification flow after booking.

```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts -g "Email Verification"
```

**Tests:**
- Displays verification page with valid token
- Shows error for invalid token
- Shows error for expired token
- Shows success for valid verification
- Shows appropriate message for already verified

### 3. Admin Approval Flow (6 tests)
Tests admin management of Meet & Greet bookings.

```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts -g "Admin Approval Flow"
```

**Tests:**
- Displays pending bookings in admin dashboard
- Filters bookings by status
- Views booking details
- Approves bookings
- Rejects bookings with reason
- Adds notes to bookings

### 4. Registration & Payment Flow (8 tests)
Tests the registration process with pre-filled data and Stripe payment.

```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts -g "Registration & Payment"
```

**Tests:**
- Loads registration page with valid token
- Shows error for invalid token
- Shows error for expired token
- Requires password creation
- Validates password strength
- Validates password confirmation
- Allows adding additional children
- Initiates Stripe checkout

### 5. Edge Cases (4 tests)
Tests error handling and special scenarios.

```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts -g "Edge Cases"
```

**Tests:**
- Handles network errors gracefully
- Handles session timeout on registration page
- Prevents booking filled time slots
- Handles multi-child family registration

### 6. Accessibility (2 tests)
Tests keyboard navigation and ARIA compliance.

```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts -g "Accessibility"
```

**Tests:**
- Booking form is keyboard accessible
- Form labels are properly associated

## Running Tests

### Run All Meet & Greet Tests
```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts
```

### Run in UI Mode (Recommended for Development)
```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts --ui
```

### Run in Headed Mode (See Browser)
```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts --headed
```

### Run Specific Test
```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts -g "should submit valid booking form successfully"
```

### Debug Tests
```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts --debug
```

## Helper Functions Reference

### Generate Test Data

```typescript
import { generateMeetAndGreetData } from '../helpers/meet-and-greet';

const bookingData = generateMeetAndGreetData({
  childName: 'Emma',
  childAge: 7,
  instrumentInterest: 'Piano',
});
```

### Fill Booking Form

```typescript
import { fillMeetAndGreetForm } from '../helpers/meet-and-greet';

await fillMeetAndGreetForm(page, bookingData);
```

### Complete Entire Flow

```typescript
import { completeMeetAndGreetBooking } from '../helpers/meet-and-greet';

const data = await completeMeetAndGreetBooking(page, {
  childName: 'Emma',
});
```

### Mock API Responses

```typescript
import {
  mockMeetAndGreetBookingSuccess,
  mockEmailVerificationSuccess,
  mockMeetAndGreetList,
  mockMeetAndGreetApproval,
  mockRegistrationTokenValidation,
  mockStripeCheckoutCreation,
} from '../helpers/meet-and-greet';

// Mock booking submission
await mockMeetAndGreetBookingSuccess(page);

// Mock email verification
await mockEmailVerificationSuccess(page, bookingData);

// Mock admin list
await mockMeetAndGreetList(page);

// Mock approval
await mockMeetAndGreetApproval(page, 'mag-123');

// Mock registration
await mockRegistrationTokenValidation(page, bookingData);
await mockStripeCheckoutCreation(page);
```

### Admin Actions

```typescript
import {
  approveMeetAndGreetAsAdmin,
  rejectMeetAndGreetAsAdmin,
  addNotesToMeetAndGreet,
} from '../helpers/meet-and-greet';

// Approve booking
await approveMeetAndGreetAsAdmin(page);

// Reject booking
await rejectMeetAndGreetAsAdmin(page, 'Not suitable for program');

// Add notes
await addNotesToMeetAndGreet(page, 'Great meeting!');
```

## Expected API Flow

The complete Meet & Greet flow hits these endpoints in order:

1. **Public Booking**
   - `POST /api/v1/public/meet-and-greet/book`
   - Creates booking with status PENDING
   - Sends verification email

2. **Email Verification**
   - `GET /api/v1/public/meet-and-greet/verify/:token`
   - Updates status to CONFIRMED
   - Notifies admin/teacher

3. **Admin Management**
   - `GET /api/v1/meet-and-greet` - List bookings
   - `PATCH /api/v1/meet-and-greet/:id` - Update status/notes
   - `POST /api/v1/meet-and-greet/:id/approve` - Approve for registration

4. **Registration**
   - `GET /api/v1/registration/token/:token` - Validate token, get pre-filled data
   - `POST /api/v1/payments/create-checkout` - Create Stripe session
   - `POST /api/v1/registration/complete` - Create account after payment

## Test Data Structure

### Booking Data
```typescript
{
  parent1Name: string;           // Required
  parent1Email: string;          // Required
  parent1Phone: string;          // Required
  parent2Name?: string;          // Optional
  parent2Email?: string;         // Optional
  parent2Phone?: string;         // Optional
  emergencyContactName: string;  // Required
  emergencyContactPhone: string; // Required
  childName: string;             // Required
  childAge: number;              // Required
  instrumentInterest: string;    // Required
  notes?: string;                // Optional
}
```

### Example
```typescript
{
  parent1Name: 'Sarah Smith',
  parent1Email: 'sarah@example.com',
  parent1Phone: '+61412345678',
  parent2Name: 'John Smith',
  parent2Email: 'john@example.com',
  parent2Phone: '+61498765432',
  emergencyContactName: 'Mary Johnson',
  emergencyContactPhone: '+61411222333',
  childName: 'Emma',
  childAge: 7,
  instrumentInterest: 'Piano',
  notes: 'Very excited about learning!',
}
```

## Common Testing Patterns

### Test with Mock Data

```typescript
test('should approve booking', async ({ adminPage }) => {
  // Mock API responses
  await mockMeetAndGreetList(adminPage, [
    {
      id: 'mag-123',
      parent1Name: 'Sarah Smith',
      childName: 'Emma',
      status: 'COMPLETED',
    },
  ]);

  await mockMeetAndGreetApproval(adminPage, 'mag-123');

  // Navigate and interact
  await adminPage.goto('/admin/meet-and-greet');
  await approveMeetAndGreetAsAdmin(adminPage, 'mag-123');

  // Assert
  await expect(adminPage.locator('text=/approved/i')).toBeVisible();
});
```

### Test with Real API (Integration)

```typescript
test('should complete full flow', async ({ page, adminPage }) => {
  // Public booking
  const bookingData = await completeMeetAndGreetBooking(page);

  // Verify email (simulate clicking link)
  await page.goto(`/verify-email/${mockToken}`);

  // Admin approval
  await adminPage.goto('/admin/meet-and-greet');
  await approveMeetAndGreetAsAdmin(adminPage);

  // Registration
  await page.goto(`/register?token=${registrationToken}`);
  await fillRegistrationPassword(page, 'SecurePassword123!');
  await page.click('button[type="submit"]');

  // Assert account created
  await expect(page).toHaveURL(/\/parent/);
});
```

## Debugging Tips

### 1. Use UI Mode
```bash
npx playwright test e2e/flows/meet-and-greet.spec.ts --ui
```
- Step through tests visually
- Inspect DOM at any point
- See network requests

### 2. Add Console Logs
```typescript
console.log('Booking data:', bookingData);
await page.screenshot({ path: 'debug.png' });
```

### 3. Slow Down Tests
```typescript
test.use({ launchOptions: { slowMo: 500 } });
```

### 4. Check Screenshots
Failed tests automatically save screenshots to `test-results/`

### 5. Use Playwright Inspector
```bash
npx playwright test --debug e2e/flows/meet-and-greet.spec.ts
```

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```yaml
- name: Run Meet & Greet E2E Tests
  run: |
    cd apps/frontend
    npx playwright test e2e/flows/meet-and-greet.spec.ts
```

Tests will:
- Run in headless mode
- Retry failures (2 retries)
- Generate HTML report
- Save screenshots on failure

## Known Limitations

1. **Stripe Integration:** Tests mock Stripe checkout. Full Stripe testing requires webhook setup.
2. **Email Sending:** Tests don't actually send emails. Use SendGrid test mode or mocks.
3. **Time-based Tests:** Availability slot tests may need specific test data setup.

## Next Steps

After running these tests:

1. **Backend Implementation:** Ensure all API endpoints match test expectations
2. **Frontend Components:** Build UI components tested here
3. **Database Seeding:** Create seed data for test scenarios
4. **Stripe Setup:** Configure Stripe test keys and webhooks
5. **Email Templates:** Create email templates for verification and registration

## Questions?

See the main E2E README at `apps/frontend/e2e/README.md` for:
- General test setup
- Playwright configuration
- Test data factories
- Authentication helpers
- Best practices
