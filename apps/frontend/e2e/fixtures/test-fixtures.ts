// ===========================================
// Playwright Test Fixtures
// ===========================================
// Custom fixtures for Music 'n Me E2E tests

import { test as base, Page } from '@playwright/test';
import { loginAsAdmin, loginAsTeacher, loginAsParent, loginAsStudent } from '../helpers/auth';
import { TestDataFactory } from '../helpers/test-data';

/**
 * Extended test context with custom fixtures
 */
type TestFixtures = {
  // Authenticated pages for each role
  adminPage: Page;
  teacherPage: Page;
  parentPage: Page;
  studentPage: Page;

  // Test data factory
  testData: TestDataFactory;
};

/**
 * Extend base test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Admin page fixture - automatically logged in as admin
   */
  adminPage: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
  },

  /**
   * Teacher page fixture - automatically logged in as teacher
   */
  teacherPage: async ({ page }, use) => {
    await loginAsTeacher(page);
    await use(page);
  },

  /**
   * Parent page fixture - automatically logged in as parent
   */
  parentPage: async ({ page }, use) => {
    await loginAsParent(page);
    await use(page);
  },

  /**
   * Student page fixture - automatically logged in as student
   */
  studentPage: async ({ page }, use) => {
    await loginAsStudent(page);
    await use(page);
  },

  /**
   * Test data factory fixture
   */
  testData: async ({ page }, use) => {
    const factory = new TestDataFactory(page);
    await use(factory);
    // Cleanup after test
    await factory.cleanup();
  },
});

/**
 * Re-export expect from @playwright/test
 */
export { expect } from '@playwright/test';

/**
 * Custom matchers (if needed)
 */
export const customMatchers = {
  /**
   * Check if element has Music 'n Me brand color
   */
  async toHaveBrandColor(element: any, colorName: 'primary' | 'secondary' | 'accent') {
    const brandColors = {
      primary: 'rgb(69, 128, 228)', // #4580E4
      secondary: 'rgb(255, 206, 0)', // #FFCE00
      accent: 'rgb(150, 218, 201)', // #96DAC9 (mint)
    };

    const color = await element.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).color;
    });

    const expectedColor = brandColors[colorName];
    const pass = color === expectedColor;

    return {
      message: () =>
        pass
          ? `Expected element not to have brand color ${colorName} (${expectedColor})`
          : `Expected element to have brand color ${colorName} (${expectedColor}), but got ${color}`,
      pass,
    };
  },
};
