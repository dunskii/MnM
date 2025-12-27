// ===========================================
// Test Data Factories
// ===========================================
// Factory functions for creating test data

import { Page } from '@playwright/test';

/**
 * Test school data
 */
export const TEST_SCHOOL = {
  id: 'school-test-001',
  name: 'Music n Me Test School',
  slug: 'music-n-me-test',
  email: 'info@musicnme.test',
  phone: '+61 2 1234 5678',
  timezone: 'Australia/Sydney',
};

/**
 * Test locations
 */
export const TEST_LOCATIONS = [
  {
    id: 'location-001',
    name: 'Sydney CBD',
    address: '123 Music St, Sydney NSW 2000',
  },
  {
    id: 'location-002',
    name: 'North Sydney',
    address: '456 Harmony Ave, North Sydney NSW 2060',
  },
];

/**
 * Test rooms
 */
export const TEST_ROOMS = [
  {
    id: 'room-001',
    locationId: 'location-001',
    name: 'Room 1',
    capacity: 10,
  },
  {
    id: 'room-002',
    locationId: 'location-001',
    name: 'Room 2',
    capacity: 8,
  },
  {
    id: 'room-003',
    locationId: 'location-002',
    name: 'Room 1',
    capacity: 12,
  },
];

/**
 * Test instruments
 */
export const TEST_INSTRUMENTS = [
  { id: 'instrument-001', name: 'Piano' },
  { id: 'instrument-002', name: 'Guitar' },
  { id: 'instrument-003', name: 'Drums' },
  { id: 'instrument-004', name: 'Singing' },
  { id: 'instrument-005', name: 'Bass' },
];

/**
 * Test lesson types
 */
export const TEST_LESSON_TYPES = [
  {
    id: 'lesson-type-001',
    name: 'Individual',
    type: 'INDIVIDUAL',
    defaultDuration: 45,
  },
  {
    id: 'lesson-type-002',
    name: 'Group',
    type: 'GROUP',
    defaultDuration: 60,
  },
  {
    id: 'lesson-type-003',
    name: 'Band',
    type: 'BAND',
    defaultDuration: 60,
  },
  {
    id: 'lesson-type-004',
    name: 'Hybrid',
    type: 'HYBRID',
    defaultDuration: 45,
  },
];

/**
 * Test terms
 */
export const TEST_TERMS = [
  {
    id: 'term-2025-1',
    name: 'Term 1 2025',
    startDate: new Date('2025-01-27'),
    endDate: new Date('2025-04-11'),
    isActive: true,
  },
  {
    id: 'term-2025-2',
    name: 'Term 2 2025',
    startDate: new Date('2025-04-28'),
    endDate: new Date('2025-07-04'),
    isActive: false,
  },
];

/**
 * Test students
 */
export const TEST_STUDENTS = [
  {
    id: 'student-001',
    firstName: 'Alice',
    lastName: 'Smith',
    birthDate: new Date('2018-05-15'),
    ageGroup: 'PRESCHOOL',
  },
  {
    id: 'student-002',
    firstName: 'Bob',
    lastName: 'Johnson',
    birthDate: new Date('2014-08-22'),
    ageGroup: 'KIDS',
  },
  {
    id: 'student-003',
    firstName: 'Charlie',
    lastName: 'Williams',
    birthDate: new Date('2010-03-10'),
    ageGroup: 'TEENS',
  },
];

/**
 * Test families
 */
export const TEST_FAMILIES = [
  {
    id: 'family-001',
    name: 'The Smith Family',
    students: ['student-001'],
  },
  {
    id: 'family-002',
    name: 'The Johnson Family',
    students: ['student-002'],
  },
];

/**
 * Test lessons
 */
export const TEST_LESSONS = [
  {
    id: 'lesson-001',
    name: 'Piano Beginners',
    lessonTypeId: 'lesson-type-001',
    instrumentId: 'instrument-001',
    termId: 'term-2025-1',
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '09:45',
    durationMins: 45,
    maxStudents: 1,
  },
  {
    id: 'lesson-002',
    name: 'Guitar Group',
    lessonTypeId: 'lesson-type-002',
    instrumentId: 'instrument-002',
    termId: 'term-2025-1',
    dayOfWeek: 3, // Wednesday
    startTime: '14:00',
    endTime: '15:00',
    durationMins: 60,
    maxStudents: 6,
  },
  {
    id: 'lesson-003',
    name: 'Hybrid Piano',
    lessonTypeId: 'lesson-type-004',
    instrumentId: 'instrument-001',
    termId: 'term-2025-1',
    dayOfWeek: 2, // Tuesday
    startTime: '10:00',
    endTime: '11:00',
    durationMins: 60,
    maxStudents: 6,
  },
];

/**
 * Test hybrid lesson patterns
 */
export const TEST_HYBRID_PATTERNS = [
  {
    id: 'hybrid-001',
    lessonId: 'lesson-003',
    patternType: 'CUSTOM',
    groupWeeks: [1, 2, 3, 5, 6, 7, 9, 10], // Group weeks
    individualWeeks: [4, 8], // Individual weeks
    individualSlotDuration: 30,
    bookingDeadlineHours: 24,
  },
];

/**
 * Helper to create test data via API
 */
export class TestDataFactory {
  constructor(private page: Page) {}

  /**
   * Create test school (usually done in setup/seeds)
   */
  async createSchool(data: Partial<typeof TEST_SCHOOL> = {}) {
    // This would typically be done via API or database seeding
    // For E2E tests, we assume test data exists
    return { ...TEST_SCHOOL, ...data };
  }

  /**
   * Create test lesson via API
   */
  async createLesson(data: Partial<typeof TEST_LESSONS[0]>) {
    const apiURL = this.getApiURL();

    const response = await this.page.request.post(`${apiURL}/api/lessons`, {
      data: {
        ...TEST_LESSONS[0],
        ...data,
      },
    });

    return await response.json();
  }

  /**
   * Create test student via API
   */
  async createStudent(data: Partial<typeof TEST_STUDENTS[0]>) {
    const apiURL = this.getApiURL();

    const response = await this.page.request.post(`${apiURL}/api/students`, {
      data: {
        ...TEST_STUDENTS[0],
        ...data,
      },
    });

    return await response.json();
  }

  /**
   * Create test family via API
   */
  async createFamily(data: Partial<typeof TEST_FAMILIES[0]>) {
    const apiURL = this.getApiURL();

    const response = await this.page.request.post(`${apiURL}/api/families`, {
      data: {
        ...TEST_FAMILIES[0],
        ...data,
      },
    });

    return await response.json();
  }

  /**
   * Clean up test data (call in afterEach)
   */
  async cleanup() {
    // This would delete test data created during the test
    // Implementation depends on your API endpoints
    // For now, we rely on database rollback/reset between test runs
  }

  /**
   * Get API base URL
   */
  private getApiURL(): string {
    const baseURL = this.page.context().baseURL || 'http://localhost:3001';
    return baseURL.replace(':3001', ':5000');
  }
}

/**
 * Generate random test data
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}@musicnme.test`;
}

export function generateRandomPhone(): string {
  const prefix = '+61 4';
  const suffix = Math.random().toString().substring(2, 10);
  return `${prefix}${suffix.substring(0, 2)} ${suffix.substring(2, 5)} ${suffix.substring(5, 8)}`;
}

export function generateRandomName(): string {
  const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'James'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}
