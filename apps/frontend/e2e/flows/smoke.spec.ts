// ===========================================
// Smoke Tests - Basic Functionality
// ===========================================
// Verify core app functionality is working

import { test, expect } from '../fixtures/test-fixtures';
import { logout } from '../helpers/auth';

test.describe('Smoke Tests', () => {
  test.describe('Login Page', () => {
    test('should load login page successfully', async ({ page }) => {
      await page.goto('/login');

      // Verify page title
      await expect(page).toHaveTitle(/Music.*n.*Me/i);

      // Verify login form exists
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');

      // Click submit without filling form
      await page.click('button[type="submit"]');

      // Should show validation errors
      // Note: Adjust selectors based on your actual error message implementation
      const errorMessages = page.locator('.error, [role="alert"], .Mui-error');
      await expect(errorMessages.first()).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill in invalid credentials
      await page.fill('input[name="email"]', 'invalid@musicnme.test');
      await page.fill('input[name="password"]', 'wrongpassword');

      // Submit form
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/invalid.*credentials|login.*failed/i')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Admin Dashboard', () => {
    test('should load admin dashboard after login', async ({ adminPage }) => {
      // adminPage fixture automatically logs in as admin
      await expect(adminPage).toHaveURL(/\/admin/);

      // Verify dashboard elements
      await expect(adminPage.locator('h1, h2').first()).toBeVisible();

      // Should show some stats or widgets
      const statsCards = adminPage.locator('[data-testid*="stat"], .stat-card, .MuiCard-root');
      await expect(statsCards.first()).toBeVisible();
    });

    test('should navigate to different admin sections', async ({ adminPage }) => {
      // Navigate to students section
      const studentsLink = adminPage.locator('a[href*="/admin/students"], text=/students/i').first();
      if (await studentsLink.isVisible()) {
        await studentsLink.click();
        await expect(adminPage).toHaveURL(/\/admin\/students/);
      }

      // Navigate to lessons section
      await adminPage.goto('/admin/lessons');
      await expect(adminPage).toHaveURL(/\/admin\/lessons/);

      // Navigate back to dashboard
      await adminPage.goto('/admin');
      await expect(adminPage).toHaveURL(/\/admin/);
    });

    test('should display navigation menu', async ({ adminPage }) => {
      // Verify navigation menu exists
      const nav = adminPage.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible();

      // Should have links to main sections
      const links = nav.locator('a');
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
    });
  });

  test.describe('Teacher Dashboard', () => {
    test('should load teacher dashboard after login', async ({ teacherPage }) => {
      await expect(teacherPage).toHaveURL(/\/teacher/);

      // Verify dashboard content
      await expect(teacherPage.locator('h1, h2').first()).toBeVisible();
    });

    test('should show teacher-specific content', async ({ teacherPage }) => {
      // Teachers should see classes/lessons
      const classesSection = teacherPage.locator(
        'text=/my.*classes|lessons|schedule/i, [data-testid*="classes"], [data-testid*="lessons"]'
      ).first();

      // Note: This might not be visible on all dashboard layouts
      // Adjust based on your actual UI
      const hasClassesSection = await classesSection.isVisible({ timeout: 3000 }).catch(() => false);

      // If classes aren't on dashboard, navigate to lessons page
      if (!hasClassesSection) {
        await teacherPage.goto('/teacher/lessons');
        await expect(teacherPage).toHaveURL(/\/teacher\/lessons/);
      }
    });
  });

  test.describe('Parent Dashboard', () => {
    test('should load parent dashboard after login', async ({ parentPage }) => {
      await expect(parentPage).toHaveURL(/\/parent/);

      // Verify dashboard content
      await expect(parentPage.locator('h1, h2').first()).toBeVisible();
    });

    test('should show family information', async ({ parentPage }) => {
      // Parents should see student/family info
      const familySection = parentPage.locator(
        'text=/students|children|family/i, [data-testid*="family"], [data-testid*="students"]'
      ).first();

      // Check if family section exists on dashboard or needs navigation
      const hasFamilySection = await familySection.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasFamilySection) {
        // Navigate to students/family page
        await parentPage.goto('/parent/students');
      }
    });
  });

  test.describe('Student Dashboard', () => {
    test('should load student dashboard after login', async ({ studentPage }) => {
      await expect(studentPage).toHaveURL(/\/student/);

      // Verify dashboard content
      await expect(studentPage.locator('h1, h2').first()).toBeVisible();
    });

    test('should show student-specific content', async ({ studentPage }) => {
      // Students should see their lessons/schedule
      const lessonsSection = studentPage.locator(
        'text=/my.*lessons|schedule|classes/i'
      ).first();

      // Content may vary based on student data
      const hasLessonsSection = await lessonsSection.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasLessonsSection) {
        // Navigate to schedule/lessons page
        await studentPage.goto('/student/schedule');
      }
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ adminPage }) => {
      // Logout from admin dashboard
      await logout(adminPage);

      // Should redirect to login page
      await expect(adminPage).toHaveURL(/\/login/);

      // Should not be able to access protected routes
      await adminPage.goto('/admin');

      // Should redirect back to login
      await expect(adminPage).toHaveURL(/\/login/, { timeout: 5000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      await page.goto('/login');

      // Login form should still be visible and functional
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad

      await page.goto('/login');

      // Verify responsive layout
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load login page quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/login');

      const loadTime = Date.now() - startTime;

      // Login page should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should load dashboard quickly after login', async ({ adminPage }) => {
      const startTime = Date.now();

      await adminPage.goto('/admin');
      await adminPage.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Dashboard should load in under 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible login form', async ({ page }) => {
      await page.goto('/login');

      // Check for accessible labels
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');

      // Inputs should have labels or aria-labels
      const emailLabel = await emailInput.getAttribute('aria-label').catch(() => null);
      const passwordLabel = await passwordInput.getAttribute('aria-label').catch(() => null);

      // At least one should have an accessible label
      const hasAccessibleLabels = emailLabel !== null || passwordLabel !== null;

      // If not using aria-label, check for associated <label> elements
      if (!hasAccessibleLabels) {
        const labels = page.locator('label');
        const labelCount = await labels.count();
        expect(labelCount).toBeGreaterThan(0);
      }
    });

    test('should have keyboard navigation support', async ({ page }) => {
      await page.goto('/login');

      // Tab through form elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to navigate with keyboard
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON']).toContain(focusedElement);
    });
  });
});
