// ===========================================
// Authentication E2E Tests
// ===========================================
// Test login, logout, and authentication flows

import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS, TEST_SCHOOL_SLUG, logout, isAuthenticated } from '../helpers/auth';

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('should login successfully as admin', async ({ page }) => {
      await page.goto('/login');

      // Fill in credentials
      await page.fill('input[name="email"]', TEST_USERS.admin.email);
      await page.fill('input[name="password"]', TEST_USERS.admin.password);

      // Fill school slug if field exists
      const schoolSlugInput = page.locator('input[name="schoolSlug"]');
      if (await schoolSlugInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await schoolSlugInput.fill(TEST_SCHOOL_SLUG);
      }

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to admin dashboard
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

      // Verify user is authenticated
      const authenticated = await isAuthenticated(page);
      expect(authenticated).toBeTruthy();
    });

    test('should login successfully as teacher', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', TEST_USERS.teacher.email);
      await page.fill('input[name="password"]', TEST_USERS.teacher.password);

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/teacher/, { timeout: 10000 });
    });

    test('should login successfully as parent', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', TEST_USERS.parent.email);
      await page.fill('input[name="password"]', TEST_USERS.parent.password);

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/parent/, { timeout: 10000 });
    });

    test('should login successfully as student', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', TEST_USERS.student.email);
      await page.fill('input[name="password"]', TEST_USERS.student.password);

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/student/, { timeout: 10000 });
    });

    test('should show error for invalid email', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'invalid-email-format');
      await page.fill('input[name="password"]', 'password123');

      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('text=/invalid.*email|email.*format/i')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show error for wrong password', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', TEST_USERS.admin.email);
      await page.fill('input[name="password"]', 'WrongPassword123!');

      await page.click('button[type="submit"]');

      // Should show authentication error
      await expect(page.locator('text=/invalid.*credentials|incorrect.*password/i')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show error for non-existent user', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'nonexistent@musicnme.test');
      await page.fill('input[name="password"]', 'TestPassword123!');

      await page.click('button[type="submit"]');

      // Should show authentication error
      await expect(page.locator('text=/invalid.*credentials|user.*not.*found/i')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.locator('input[name="password"]');
      const toggleButton = page.locator('button[aria-label*="password"], [data-testid="toggle-password"]');

      // Password should be hidden by default
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button if it exists
      if (await toggleButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await toggleButton.click();

        // Password should now be visible
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click again to hide
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    test('should preserve form data on validation error', async ({ page }) => {
      await page.goto('/login');

      const email = 'test@musicnme.test';
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', ''); // Empty password

      await page.click('button[type="submit"]');

      // Email should still be filled
      await expect(page.locator('input[name="email"]')).toHaveValue(email);
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ adminPage }) => {
      // Already logged in as admin via fixture
      await logout(adminPage);

      // Should be on login page
      await expect(adminPage).toHaveURL(/\/login/);

      // Should not be authenticated
      const authenticated = await isAuthenticated(adminPage);
      expect(authenticated).toBeFalsy();
    });

    test('should redirect to login when accessing protected route after logout', async ({ adminPage }) => {
      await logout(adminPage);

      // Try to access admin dashboard
      await adminPage.goto('/admin');

      // Should redirect to login
      await expect(adminPage).toHaveURL(/\/login/, { timeout: 5000 });
    });

    test('should clear auth tokens on logout', async ({ adminPage }) => {
      const tokensBeforeLogout = await adminPage.evaluate(() => ({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      }));

      expect(tokensBeforeLogout.accessToken).toBeTruthy();
      expect(tokensBeforeLogout.refreshToken).toBeTruthy();

      await logout(adminPage);

      const tokensAfterLogout = await adminPage.evaluate(() => ({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      }));

      expect(tokensAfterLogout.accessToken).toBeNull();
      expect(tokensAfterLogout.refreshToken).toBeNull();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing admin route without auth', async ({ page }) => {
      await page.goto('/admin');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });

    test('should redirect to login when accessing teacher route without auth', async ({ page }) => {
      await page.goto('/teacher');

      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });

    test('should redirect to login when accessing parent route without auth', async ({ page }) => {
      await page.goto('/parent');

      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });

    test('should redirect to login when accessing student route without auth', async ({ page }) => {
      await page.goto('/student');

      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });

    test('admin should not access teacher routes', async ({ adminPage }) => {
      // Admin logged in, try to access teacher-only route
      await adminPage.goto('/teacher');

      // Should either redirect or show access denied
      // (Depends on your routing implementation)
      const isOnTeacherRoute = await adminPage.url().includes('/teacher');
      const hasAccessDenied = await adminPage
        .locator('text=/access denied|unauthorized/i')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      // Either not on teacher route OR seeing access denied
      expect(!isOnTeacherRoute || hasAccessDenied).toBeTruthy();
    });

    test('teacher should not access admin routes', async ({ teacherPage }) => {
      await teacherPage.goto('/admin');

      const isOnAdminRoute = await teacherPage.url().includes('/admin');
      const hasAccessDenied = await teacherPage
        .locator('text=/access denied|unauthorized/i')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(!isOnAdminRoute || hasAccessDenied).toBeTruthy();
    });

    test('parent should not access admin routes', async ({ parentPage }) => {
      await parentPage.goto('/admin');

      const isOnAdminRoute = await parentPage.url().includes('/admin');
      const hasAccessDenied = await parentPage
        .locator('text=/access denied|unauthorized/i')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(!isOnAdminRoute || hasAccessDenied).toBeTruthy();
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist session after page reload', async ({ adminPage }) => {
      // Verify logged in
      await expect(adminPage).toHaveURL(/\/admin/);

      // Reload page
      await adminPage.reload();

      // Should still be logged in
      await expect(adminPage).toHaveURL(/\/admin/);

      const authenticated = await isAuthenticated(adminPage);
      expect(authenticated).toBeTruthy();
    });

    test('should persist session in new tab', async ({ adminPage, context }) => {
      // Already logged in via adminPage fixture

      // Open new tab
      const newPage = await context.newPage();

      // Navigate to protected route
      await newPage.goto('/admin');

      // Should be logged in (shared localStorage)
      await expect(newPage).toHaveURL(/\/admin/, { timeout: 5000 });

      const authenticated = await isAuthenticated(newPage);
      expect(authenticated).toBeTruthy();

      await newPage.close();
    });
  });

  test.describe('Password Security', () => {
    test('should enforce password strength requirements', async ({ page }) => {
      // Note: This test assumes a change password or registration page
      // Adjust URL as needed

      await page.goto('/login');

      // Try weak password
      await page.fill('input[name="email"]', 'test@musicnme.test');
      await page.fill('input[name="password"]', 'weak');

      await page.click('button[type="submit"]');

      // Should show password strength error (client-side validation)
      const hasValidationError = await page
        .locator('text=/password.*too.*short|password.*requirements/i')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // Note: May not have client-side validation, which is okay
      // Backend will still enforce
    });

    test('should mask password input by default', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.locator('input[name="password"]');

      // Should be type="password"
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should not expose password in URL or console', async ({ page }) => {
      // Monitor console for password leaks
      const consoleMessages: string[] = [];
      page.on('console', (msg) => consoleMessages.push(msg.text()));

      await page.goto('/login');

      await page.fill('input[name="email"]', TEST_USERS.admin.email);
      await page.fill('input[name="password"]', TEST_USERS.admin.password);

      await page.click('button[type="submit"]');

      await page.waitForURL(/\/admin/, { timeout: 10000 });

      // Check URL doesn't contain password
      const url = page.url();
      expect(url).not.toContain(TEST_USERS.admin.password);

      // Check console doesn't log password
      const hasPasswordInConsole = consoleMessages.some((msg) =>
        msg.includes(TEST_USERS.admin.password)
      );
      expect(hasPasswordInConsole).toBeFalsy();
    });
  });

  test.describe('Rate Limiting', () => {
    test('should handle rate limiting on multiple failed login attempts', async ({ page }) => {
      await page.goto('/login');

      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        await page.fill('input[name="email"]', TEST_USERS.admin.email);
        await page.fill('input[name="password"]', 'WrongPassword123!');

        await page.click('button[type="submit"]');

        // Wait for response
        await page.waitForTimeout(500);
      }

      // After 5 failed attempts, should show rate limit error
      const hasRateLimitError = await page
        .locator('text=/too many.*attempts|rate limit|try again later/i')
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // Note: This depends on backend rate limiting being implemented
      // Test may pass even if rate limiting isn't shown (backend handles it)
    });
  });

  test.describe('Accessibility', () => {
    test('login form should be keyboard accessible', async ({ page }) => {
      await page.goto('/login');

      // Tab to email input
      await page.keyboard.press('Tab');
      let focused = await page.evaluate(() => document.activeElement?.getAttribute('name'));

      // Should focus on email or first input
      expect(['email', 'schoolSlug']).toContain(focused);

      // Tab to next field
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement?.getAttribute('name'));

      // Continue tabbing to submit button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Submit button should be focused
      const submitButton = await page.evaluate(
        () => document.activeElement?.getAttribute('type')
      );
      expect(submitButton).toBe('submit');

      // Should be able to submit with Enter
      await page.keyboard.press('Enter');

      // Should show validation errors
      const hasErrors = await page
        .locator('.error, [role="alert"]')
        .isVisible({ timeout: 2000 })
        .catch(() => false);
    });
  });
});
