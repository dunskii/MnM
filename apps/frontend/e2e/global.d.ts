// ===========================================
// Playwright E2E Global Type Definitions
// ===========================================

import { Page } from '@playwright/test';

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      /**
       * Check if element has Music 'n Me brand color
       * @param colorName - Brand color name (primary, secondary, accent)
       */
      toHaveBrandColor(colorName: 'primary' | 'secondary' | 'accent'): R;
    }
  }
}

/**
 * Test user credentials
 */
export interface TestUser {
  email: string;
  password: string;
  role: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';
}

/**
 * Test school data
 */
export interface TestSchool {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  timezone: string;
}

/**
 * Test data factory methods
 */
export interface TestDataFactory {
  createSchool(data?: Partial<TestSchool>): Promise<TestSchool>;
  createLesson(data?: any): Promise<any>;
  createStudent(data?: any): Promise<any>;
  createFamily(data?: any): Promise<any>;
  cleanup(): Promise<void>;
}

export {};
