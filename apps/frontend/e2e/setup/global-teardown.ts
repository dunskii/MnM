// ===========================================
// Playwright Global Teardown
// ===========================================
// Cleanup after all tests complete

import { FullConfig } from '@playwright/test';

/**
 * Global teardown runs once after all tests complete
 * Use this to:
 * - Clean up test data
 * - Close connections
 * - Generate reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('');
  console.log('🧹 Starting Playwright Global Teardown...');

  try {
    // Log test completion
    console.log('✅ All E2E tests completed');

    // Cleanup notes
    console.log('');
    console.log('📋 Post-Test Notes:');
    console.log('   - Test data remains in database for debugging');
    console.log('   - Run "npm run seed:reset" to reset test data if needed');
    console.log('   - Check playwright-report/ for detailed test results');
    console.log('   - Check test-results/ for screenshots and traces on failure');
    console.log('');

    console.log('✅ Global teardown complete');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - we don't want teardown failures to fail the test run
  }
}

export default globalTeardown;
