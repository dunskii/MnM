// ===========================================
// Jest Test Setup
// ===========================================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-32chars';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

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
