// ===========================================
// Playwright Global Setup
// ===========================================
// Database seeding and test environment setup

import { chromium, FullConfig } from '@playwright/test';

/**
 * Test user credentials for E2E tests
 * These should match the seed data in the backend
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@musicnme.test',
    password: 'TestPassword123!',
    role: 'ADMIN',
  },
  teacher: {
    email: 'teacher@musicnme.test',
    password: 'TestPassword123!',
    role: 'TEACHER',
  },
  parent: {
    email: 'parent@musicnme.test',
    password: 'TestPassword123!',
    role: 'PARENT',
  },
  student: {
    email: 'student@musicnme.test',
    password: 'TestPassword123!',
    role: 'STUDENT',
  },
};

/**
 * Test school configuration
 */
export const TEST_SCHOOL = {
  name: 'Music n Me Test School',
  slug: 'music-n-me-test',
  email: 'test@musicnme.test',
};

/**
 * Global setup runs once before all tests
 * Use this to:
 * - Seed test database
 * - Set up authentication state
 * - Initialize test data
 */
async function globalSetup(config: FullConfig) {
  console.log('🎭 Starting Playwright Global Setup...');

  const baseURL = config.use.baseURL || 'http://localhost:3001';
  const apiURL = process.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  console.log(`📍 Base URL: ${baseURL}`);
  console.log(`📍 API URL: ${apiURL}`);

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Step 1: Verify frontend is accessible
    console.log('🔍 Checking frontend availability...');
    const frontendResponse = await page.goto(baseURL, { timeout: 30000 });
    if (!frontendResponse || frontendResponse.status() >= 400) {
      throw new Error(`Frontend not accessible: ${frontendResponse?.status()}`);
    }
    console.log('✅ Frontend is accessible');

    // Step 2: Verify backend API is accessible
    console.log('🔍 Checking backend API availability...');
    const healthResponse = await page.request.get(`${apiURL.replace('/api/v1', '')}/health`);
    if (!healthResponse.ok()) {
      console.warn('⚠️ Backend health check failed, tests may fail');
    } else {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is healthy:', healthData.status || 'OK');
    }

    // Step 3: Seed test database (via API endpoint if available)
    console.log('🌱 Checking test data...');
    try {
      // Try to verify test users exist by checking login endpoint
      const loginCheck = await page.request.post(`${apiURL}/auth/login`, {
        data: {
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password,
          schoolSlug: TEST_SCHOOL.slug,
        },
      });

      if (loginCheck.ok()) {
        console.log('✅ Test data already seeded');
      } else {
        console.log('⚠️ Test users may not exist. Run backend seed: npm run seed:test');
        console.log('   Expected test users:', Object.keys(TEST_USERS).join(', '));
      }
    } catch {
      console.log('⚠️ Could not verify test data, proceeding anyway...');
    }

    // Step 4: Clear any previous auth state
    console.log('🧹 Clearing previous auth state...');
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('✅ Global setup complete');
    console.log('');
    console.log('📋 Test Configuration:');
    console.log(`   School: ${TEST_SCHOOL.name} (${TEST_SCHOOL.slug})`);
    console.log(`   Admin: ${TEST_USERS.admin.email}`);
    console.log(`   Teacher: ${TEST_USERS.teacher.email}`);
    console.log(`   Parent: ${TEST_USERS.parent.email}`);
    console.log(`   Student: ${TEST_USERS.student.email}`);
    console.log('');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Ensure frontend is running: cd apps/frontend && npm run dev');
    console.error('   2. Ensure backend is running: cd apps/backend && npm run dev');
    console.error('   3. Ensure database is seeded: cd apps/backend && npm run seed:test');
    console.error('');
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
