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
// Disable Redis for tests
process.env.REDIS_URL = '';

// Extend Jest timeout for async operations
jest.setTimeout(15000);

// Mock Bull queues to avoid Redis connection issues in tests
jest.mock('../src/config/queue', () => ({
  googleDriveSyncQueue: {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
    close: jest.fn().mockResolvedValue(undefined),
  },
  emailNotificationQueue: {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
    close: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock email notification job to avoid queue issues
const emailJobMock = {
  queueLessonRescheduledEmail: jest.fn().mockResolvedValue('mock-job-id'),
  queueHybridBookingOpenedEmail: jest.fn().mockResolvedValue('mock-job-id'),
  queueHybridBookingReminderEmail: jest.fn().mockResolvedValue('mock-job-id'),
  queueIndividualSessionBookedEmail: jest.fn().mockResolvedValue('mock-job-id'),
  queueIndividualSessionRescheduledEmail: jest.fn().mockResolvedValue('mock-job-id'),
  queuePaymentReceivedEmail: jest.fn().mockResolvedValue('mock-job-id'),
  queueInvoiceCreatedEmail: jest.fn().mockResolvedValue('mock-job-id'),
  queueMeetGreetReminderEmail: jest.fn().mockResolvedValue('mock-job-id'),
  queueLessonReminderEmail: jest.fn().mockResolvedValue('mock-job-id'),
  registerEmailJobProcessor: jest.fn(),
};
jest.mock('../src/jobs/emailNotification.job', () => emailJobMock);

// Mock console.warn to reduce noise in tests
const originalWarn = console.warn;
const originalError = console.error;
beforeAll(() => {
  console.warn = jest.fn();
  // Filter out Redis connection errors in tests
  console.error = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('[Queue]') || msg.includes('ECONNREFUSED')) {
      return; // Suppress queue/Redis errors
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
