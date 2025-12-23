// ===========================================
// Jest Test Setup
// ===========================================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'mnm-dev-secret-key-change-in-production-2024';
process.env.DATABASE_URL = 'postgresql://postgres:Pr0phet5@localhost:5433/music_n_me?schema=public';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_tests';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake_webhook_secret_for_tests';
process.env.SENDGRID_API_KEY = 'SG.fake_sendgrid_key_for_tests';
process.env.FRONTEND_URL = 'http://localhost:3001';

// Extend Jest timeout for async operations
jest.setTimeout(10000);

// Mock console.warn to reduce noise in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});
