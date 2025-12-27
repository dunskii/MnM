# Payment E2E Tests - Quick Start Guide

## Running the Tests

### All Payment Tests

```bash
# From frontend directory
cd apps/frontend

# Run all payment tests (all browsers)
npm run e2e -- e2e/flows/payment.spec.ts

# Run in Chromium only (fastest)
npm run e2e -- e2e/flows/payment.spec.ts --project=chromium

# Run with UI mode (interactive)
npm run e2e:ui -- e2e/flows/payment.spec.ts

# Run in headed mode (watch browser)
npm run e2e:headed -- e2e/flows/payment.spec.ts --project=chromium

# Debug mode (step through)
npm run e2e:debug -- e2e/flows/payment.spec.ts
```

### Specific Test Suites

```bash
# Admin invoice generation tests
npm run e2e -- payment.spec.ts -g "Admin - Invoice Generation"

# Parent invoice viewing tests
npm run e2e -- payment.spec.ts -g "Parent - Invoice Viewing"

# Stripe checkout tests
npm run e2e -- payment.spec.ts -g "Parent - Stripe Checkout"

# Manual payment tests
npm run e2e -- payment.spec.ts -g "Admin - Manual Payment"

# Hybrid billing tests
npm run e2e -- payment.spec.ts -g "Hybrid Lesson Billing"

# Security tests
npm run e2e -- payment.spec.ts -g "Multi-Tenancy Security"
```

### Single Test

```bash
# Run specific test by name
npm run e2e -- payment.spec.ts -g "admin can create single student invoice"

# Run all tests with "invoice" in the name
npm run e2e -- payment.spec.ts -g "invoice"

# Run all tests with "payment" in the name
npm run e2e -- payment.spec.ts -g "payment"
```

## Test Results

### View HTML Report

```bash
# After tests run, view report
npm run e2e:report
```

### Check Test Output

The tests will output:
- ✅ Pass/Fail status for each test
- Screenshots on failure
- Video recordings on failure
- Trace files for debugging

Report location: `apps/frontend/playwright-report/`

## Test Coverage Summary

### Total Tests: 42

| Test Suite | Count | Focus Area |
|------------|-------|------------|
| Admin - Invoice Generation | 6 | Creating invoices |
| Admin - Invoice Management | 7 | Lifecycle management |
| Parent - Invoice Viewing | 6 | Viewing invoices |
| Parent - Stripe Checkout | 3 | Online payment |
| Parent - Payment History | 5 | Payment records |
| Admin - Manual Payment | 5 | Recording payments |
| Hybrid Lesson Billing | 3 | CRITICAL feature |
| Multi-Tenancy Security | 2 | CRITICAL security |
| Edge Cases | 7 | Error handling |

## Expected Results

### All Tests Passing

```
  ✓ Admin - Invoice Generation (6)
  ✓ Admin - Invoice Management (7)
  ✓ Parent - Invoice Viewing (6)
  ✓ Parent - Stripe Checkout (2 passed, 1 skipped)
  ✓ Parent - Payment History (5)
  ✓ Admin - Manual Payment Recording (5)
  ✓ Hybrid Lesson Billing (3)
  ✓ Multi-Tenancy Security (2)
  ✓ Edge Cases & Error Handling (7)

  41 passed, 1 skipped (30s)
```

**Note:** 1 test is skipped by default (Stripe payment completion) - requires Stripe test mode setup.

## Prerequisites

### 1. Backend Running

```bash
# Terminal 1: Start backend
cd apps/backend
npm run dev

# Should be running on http://localhost:5000
```

### 2. Frontend Running

```bash
# Terminal 2: Start frontend
cd apps/frontend
npm run dev

# Should be running on http://localhost:3001
```

**Note:** Playwright config will auto-start frontend if not running.

### 3. Test Database

```bash
# Set up test database (if not done)
cd apps/backend
npm run test:db:setup
npm run test:db:seed
```

### 4. Environment Variables

```env
# apps/backend/.env.test
DATABASE_URL="postgresql://user:pass@localhost:5432/music_n_me_test"
JWT_SECRET="test-secret-key-change-in-production"
STRIPE_SECRET_KEY="sk_test_..." # Stripe test mode key
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."
```

## Troubleshooting

### Backend Not Running

```
Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Solution:** Start backend server
```bash
cd apps/backend && npm run dev
```

### Database Connection Error

```
Error: Database "music_n_me_test" does not exist
```

**Solution:** Create test database
```bash
cd apps/backend && npm run test:db:setup
```

### Missing Test Data

```
Error: Invoice not found
Error: Family not found
```

**Solution:** Seed test database
```bash
cd apps/backend && npm run test:db:seed
```

### Timeout Errors

```
Error: Timeout 30000ms exceeded
```

**Solution:** Increase timeout in test or check server response time
```typescript
test('slow test', async ({ adminPage }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Stripe Checkout Redirect Fails

```
Error: waiting for URL /checkout.stripe.com/ failed
```

**Solution:** This is expected if Stripe test mode not configured. Test is skipped by default.

### Tests Failing Randomly

**Possible causes:**
1. Network latency
2. Database not reset between tests
3. Cached data interfering

**Solution:**
```bash
# Reset test database
cd apps/backend
npm run test:db:reset
npm run test:db:seed

# Clear browser cache (Playwright does this automatically)
```

## Debugging Failed Tests

### 1. Run in UI Mode

```bash
npm run e2e:ui -- payment.spec.ts
```

- Click on failed test
- See step-by-step execution
- Inspect DOM at each step
- View screenshots/videos

### 2. Run in Debug Mode

```bash
npm run e2e:debug -- payment.spec.ts -g "failing test name"
```

- Pause at breakpoints
- Step through code
- Inspect page state
- Run commands in console

### 3. Check Screenshots

```bash
# Screenshots saved on failure
apps/frontend/test-results/*/screenshot.png
```

### 4. Check Videos

```bash
# Videos saved on failure
apps/frontend/test-results/*/video.webm
```

### 5. View Trace

```bash
# Trace files for debugging
apps/frontend/test-results/*/trace.zip

# Open trace viewer
npx playwright show-trace test-results/.../trace.zip
```

## Next Steps

1. **Run tests locally** - Verify everything passes
2. **Add to CI/CD** - Run on every PR
3. **Monitor flakiness** - Track unreliable tests
4. **Expand coverage** - Add more edge cases
5. **Enable Stripe test** - Set up test mode

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests - Payment

on: [pull_request]

jobs:
  payment-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: music_n_me_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: npm run test:db:setup
        working-directory: apps/backend

      - name: Seed test data
        run: npm run test:db:seed
        working-directory: apps/backend

      - name: Start backend
        run: npm run dev &
        working-directory: apps/backend

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run payment E2E tests
        run: npm run e2e -- e2e/flows/payment.spec.ts --project=chromium
        working-directory: apps/frontend

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/frontend/playwright-report/
```

## Key Metrics

### Performance Targets

- **Test Suite Duration**: < 2 minutes (Chromium only)
- **Individual Test**: < 10 seconds average
- **Slowest Tests**: < 30 seconds

### Coverage Targets

- **Invoice Generation**: 100% of user flows
- **Payment Recording**: 100% of payment methods
- **Hybrid Billing**: 100% of calculation scenarios
- **Security**: 100% of multi-tenancy checks

### Success Criteria

- ✅ All tests passing on latest Chrome/Firefox/Safari
- ✅ No flaky tests (>95% pass rate)
- ✅ Test execution time < 2 minutes
- ✅ All critical paths covered

## Support

For help with payment tests:
1. Check `PAYMENT_TESTS_README.md` for detailed documentation
2. Review `payment.spec.ts` for test implementation
3. See CLAUDE.md for project context
4. Check Planning/12_Week_MVP_Plan.md for requirements
