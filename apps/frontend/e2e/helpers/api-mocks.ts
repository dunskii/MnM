// ===========================================
// API Mocking Helpers
// ===========================================
// Helper functions for mocking API responses in E2E tests

import { Page, Route } from '@playwright/test';
import { TEST_SCHOOL, TEST_STUDENTS, TEST_LESSONS } from './test-data';

/**
 * Mock successful login response
 */
export async function mockLoginSuccess(page: Page, role: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT') {
  await page.route('**/api/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: `user-${role.toLowerCase()}`,
            email: `${role.toLowerCase()}@musicnme.test`,
            firstName: role.charAt(0) + role.slice(1).toLowerCase(),
            lastName: 'User',
            role,
            schoolId: TEST_SCHOOL.id,
            schoolName: TEST_SCHOOL.name,
          },
        },
      }),
    });
  });
}

/**
 * Mock login failure (invalid credentials)
 */
export async function mockLoginFailure(page: Page, errorMessage = 'Invalid credentials') {
  await page.route('**/api/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'error',
        message: errorMessage,
      }),
    });
  });
}

/**
 * Mock /auth/me endpoint (get current user)
 */
export async function mockAuthMe(page: Page, role: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT') {
  await page.route('**/api/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          user: {
            id: `user-${role.toLowerCase()}`,
            email: `${role.toLowerCase()}@musicnme.test`,
            firstName: role.charAt(0) + role.slice(1).toLowerCase(),
            lastName: 'User',
            role,
            schoolId: TEST_SCHOOL.id,
            schoolName: TEST_SCHOOL.name,
          },
        },
      }),
    });
  });
}

/**
 * Mock students list
 */
export async function mockStudentsList(page: Page, students = TEST_STUDENTS) {
  await page.route('**/api/students', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: students,
      }),
    });
  });
}

/**
 * Mock lessons list
 */
export async function mockLessonsList(page: Page, lessons = TEST_LESSONS) {
  await page.route('**/api/lessons', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: lessons,
      }),
    });
  });
}

/**
 * Mock dashboard stats (admin)
 */
export async function mockAdminDashboardStats(page: Page) {
  await page.route('**/api/dashboard/admin/stats', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          totalStudents: 142,
          activeStudents: 138,
          totalTeachers: 8,
          activeTeachers: 7,
          totalLessons: 45,
          activeLessons: 42,
          totalFamilies: 95,
          activeFamilies: 92,
          attendanceRate: 94.5,
          revenueThisMonth: 28450.0,
          pendingInvoices: 12,
          upcomingLessons: 156,
        },
      }),
    });
  });
}

/**
 * Mock network error
 */
export async function mockNetworkError(page: Page, urlPattern: string) {
  await page.route(urlPattern, async (route: Route) => {
    await route.abort('failed');
  });
}

/**
 * Mock slow network response (for loading state tests)
 */
export async function mockSlowResponse(page: Page, urlPattern: string, delayMs = 3000) {
  await page.route(urlPattern, async (route: Route) => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * Clear all route mocks
 */
export async function clearAllMocks(page: Page) {
  await page.unrouteAll();
}

/**
 * Mock API error response
 */
export async function mockApiError(
  page: Page,
  urlPattern: string,
  status: number,
  message: string
) {
  await page.route(urlPattern, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'error',
        message,
      }),
    });
  });
}

/**
 * Mock pagination response
 */
export async function mockPaginatedResponse<T>(
  page: Page,
  urlPattern: string,
  data: T[],
  total: number,
  page_num = 1,
  pageSize = 20
) {
  await page.route(urlPattern, async (route: Route) => {
    const start = (page_num - 1) * pageSize;
    const end = start + pageSize;
    const pageData = data.slice(start, end);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: pageData,
        pagination: {
          total,
          page: page_num,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      }),
    });
  });
}
