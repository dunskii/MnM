// ===========================================
// Authentication Helpers
// ===========================================
// Helper functions for logging in as different user roles

import { Page, expect } from '@playwright/test';

/**
 * Test users for different roles
 * These should match the seeded data in your test database
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@musicnme.test',
    password: 'TestPassword123!',
    role: 'ADMIN' as const,
  },
  teacher: {
    email: 'teacher@musicnme.test',
    password: 'TestPassword123!',
    role: 'TEACHER' as const,
  },
  parent: {
    email: 'parent@musicnme.test',
    password: 'TestPassword123!',
    role: 'PARENT' as const,
  },
  student: {
    email: 'student@musicnme.test',
    password: 'TestPassword123!',
    role: 'STUDENT' as const,
  },
} as const;

export const TEST_SCHOOL_SLUG = 'music-n-me-test';

/**
 * Login via UI
 */
async function loginViaUI(
  page: Page,
  email: string,
  password: string,
  schoolSlug: string = TEST_SCHOOL_SLUG
) {
  // Navigate to login page
  await page.goto('/login');

  // Fill in login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // School slug field might be optional or auto-detected
  const schoolSlugInput = page.locator('input[name="schoolSlug"]');
  if (await schoolSlugInput.isVisible()) {
    await schoolSlugInput.fill(schoolSlug);
  }

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete (should redirect to dashboard)
  await page.waitForURL(/\/(admin|teacher|parent|student)/, { timeout: 10000 });
}

/**
 * Login via API (faster for setup)
 */
async function loginViaAPI(
  page: Page,
  email: string,
  password: string,
  schoolSlug: string = TEST_SCHOOL_SLUG
) {
  const baseURL = page.context().baseURL || 'http://localhost:3001';
  const apiURL = baseURL.replace(':3001', ':5000'); // Backend is on port 5000

  // Login via API
  const response = await page.request.post(`${apiURL}/api/auth/login`, {
    data: {
      email,
      password,
      schoolSlug,
    },
  });

  expect(response.ok()).toBeTruthy();

  const { data } = await response.json();
  const { accessToken, refreshToken } = data;

  // Set tokens in localStorage
  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    { accessToken, refreshToken }
  );
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page, viaAPI = true) {
  const { email, password } = TEST_USERS.admin;

  if (viaAPI) {
    await loginViaAPI(page, email, password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  } else {
    await loginViaUI(page, email, password);
  }

  // Verify we're on admin dashboard
  await expect(page).toHaveURL(/\/admin/);
}

/**
 * Login as teacher user
 */
export async function loginAsTeacher(page: Page, viaAPI = true) {
  const { email, password } = TEST_USERS.teacher;

  if (viaAPI) {
    await loginViaAPI(page, email, password);
    await page.goto('/teacher');
    await page.waitForLoadState('networkidle');
  } else {
    await loginViaUI(page, email, password);
  }

  // Verify we're on teacher dashboard
  await expect(page).toHaveURL(/\/teacher/);
}

/**
 * Login as parent user
 */
export async function loginAsParent(page: Page, viaAPI = true) {
  const { email, password } = TEST_USERS.parent;

  if (viaAPI) {
    await loginViaAPI(page, email, password);
    await page.goto('/parent');
    await page.waitForLoadState('networkidle');
  } else {
    await loginViaUI(page, email, password);
  }

  // Verify we're on parent dashboard
  await expect(page).toHaveURL(/\/parent/);
}

/**
 * Login as student user
 */
export async function loginAsStudent(page: Page, viaAPI = true) {
  const { email, password } = TEST_USERS.student;

  if (viaAPI) {
    await loginViaAPI(page, email, password);
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
  } else {
    await loginViaUI(page, email, password);
  }

  // Verify we're on student dashboard
  await expect(page).toHaveURL(/\/student/);
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Look for user menu or logout button
  const userMenuButton = page.locator('[data-testid="user-menu-button"]').or(
    page.locator('button:has-text("Logout")').first()
  ).or(
    page.getByRole('button', { name: /profile|account|user/i })
  );

  if (await userMenuButton.isVisible()) {
    await userMenuButton.click();

    // Click logout option in dropdown
    const logoutButton = page.locator('[data-testid="logout-button"]').or(
      page.getByRole('menuitem', { name: /logout|sign out/i })
    );

    await logoutButton.click();

    // Wait for redirect to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });
  } else {
    // Fallback: clear localStorage directly
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });

    await page.goto('/login');
  }

  // Verify we're logged out
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
  return !!accessToken;
}

/**
 * Get stored auth tokens
 */
export async function getAuthTokens(page: Page) {
  return await page.evaluate(() => ({
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  }));
}
