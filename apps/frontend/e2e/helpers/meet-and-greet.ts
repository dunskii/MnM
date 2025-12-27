// ===========================================
// Meet & Greet Test Helpers
// ===========================================
// Helper functions for Meet & Greet E2E testing

import { Page } from '@playwright/test';
import { generateRandomEmail, generateRandomPhone, generateRandomName } from './test-data';

/**
 * Meet & Greet booking data interface
 */
export interface MeetAndGreetBooking {
  parent1Name: string;
  parent1Email: string;
  parent1Phone: string;
  parent2Name?: string;
  parent2Email?: string;
  parent2Phone?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  childName: string;
  childAge: number;
  instrumentInterest: string;
  notes?: string;
}

/**
 * Generate random Meet & Greet booking data
 */
export function generateMeetAndGreetData(overrides: Partial<MeetAndGreetBooking> = {}): MeetAndGreetBooking {
  return {
    parent1Name: generateRandomName(),
    parent1Email: generateRandomEmail(),
    parent1Phone: generateRandomPhone(),
    emergencyContactName: generateRandomName(),
    emergencyContactPhone: generateRandomPhone(),
    childName: generateRandomName().split(' ')[0],
    childAge: 7,
    instrumentInterest: 'Piano',
    ...overrides,
  };
}

/**
 * Fill out Meet & Greet booking form
 */
export async function fillMeetAndGreetForm(page: Page, data: MeetAndGreetBooking) {
  // Fill Parent 1 information
  await page.fill('input[name="parent1Name"]', data.parent1Name);
  await page.fill('input[name="parent1Email"]', data.parent1Email);
  await page.fill('input[name="parent1Phone"]', data.parent1Phone);

  // Fill Parent 2 if provided
  if (data.parent2Name && data.parent2Email) {
    const addParent2Button = page.locator('button:has-text("Add Second Parent")').or(
      page.locator('[data-testid="add-parent-2"]')
    );

    if (await addParent2Button.isVisible({ timeout: 1000 }).catch(() => false)) {
      await addParent2Button.click();
    }

    await page.fill('input[name="parent2Name"]', data.parent2Name);
    await page.fill('input[name="parent2Email"]', data.parent2Email);
    if (data.parent2Phone) {
      await page.fill('input[name="parent2Phone"]', data.parent2Phone);
    }
  }

  // Fill Emergency Contact
  await page.fill('input[name="emergencyContactName"]', data.emergencyContactName);
  await page.fill('input[name="emergencyContactPhone"]', data.emergencyContactPhone);

  // Fill Child information
  await page.fill('input[name="childName"]', data.childName);
  await page.fill('input[name="childAge"]', data.childAge.toString());

  // Select instrument
  const instrumentSelect = page.locator('select[name="instrumentInterest"]');
  if (await instrumentSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await instrumentSelect.selectOption(data.instrumentInterest);
  } else {
    // Try autocomplete/dropdown approach
    const instrumentField = page.locator('[data-testid="instrument-select"]').or(
      page.locator('input[name="instrumentInterest"]')
    );
    if (await instrumentField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await instrumentField.click();
      await page.click(`text=${data.instrumentInterest}`);
    }
  }

  // Add notes if provided
  if (data.notes) {
    const notesField = page.locator('textarea[name="notes"]').or(
      page.locator('textarea[name="comments"]')
    );
    if (await notesField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await notesField.fill(data.notes);
    }
  }
}

/**
 * Select a time slot from the calendar
 */
export async function selectTimeSlot(page: Page, options?: { date?: string; time?: string }) {
  // Select date slot (if date picker exists)
  const dateSlot = options?.date
    ? page.locator(`[data-date="${options.date}"]`)
    : page.locator('[data-testid="date-slot"]').first();

  if (await dateSlot.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dateSlot.click();
  }

  // Select time slot
  const timeSlot = options?.time
    ? page.locator(`[data-time="${options.time}"]`)
    : page.locator('[data-testid="time-slot"]').first();

  if (await timeSlot.isVisible({ timeout: 2000 }).catch(() => false)) {
    await timeSlot.click();
  }
}

/**
 * Submit Meet & Greet booking form
 */
export async function submitMeetAndGreetForm(page: Page) {
  await page.click('button[type="submit"]');
}

/**
 * Complete full Meet & Greet booking flow
 */
export async function completeMeetAndGreetBooking(
  page: Page,
  data?: Partial<MeetAndGreetBooking>
): Promise<MeetAndGreetBooking> {
  const bookingData = generateMeetAndGreetData(data);

  await page.goto('/book-meet-and-greet');
  await fillMeetAndGreetForm(page, bookingData);
  await selectTimeSlot(page);
  await submitMeetAndGreetForm(page);

  return bookingData;
}

/**
 * Mock Meet & Greet booking API success
 */
export async function mockMeetAndGreetBookingSuccess(page: Page, bookingId = 'mag-123') {
  await page.route('**/api/v1/public/meet-and-greet/book', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        message: 'Booking created! Please check your email to verify.',
        data: {
          id: bookingId,
          status: 'PENDING',
        },
      }),
    });
  });
}

/**
 * Mock email verification API success
 */
export async function mockEmailVerificationSuccess(page: Page, bookingData: Partial<MeetAndGreetBooking> = {}) {
  await page.route('**/api/v1/public/meet-and-greet/verify/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        message: 'Email verified! Your meet & greet is confirmed.',
        data: {
          meetAndGreet: {
            id: 'mag-123',
            parent1Name: bookingData.parent1Name || 'Sarah Smith',
            parent1Email: bookingData.parent1Email || 'sarah@example.com',
            childName: bookingData.childName || 'Emma',
            childAge: bookingData.childAge || 7,
            preferredDateTime: '2025-02-15T10:00:00Z',
            locationName: 'Sydney CBD',
            teacherName: 'Ms. Johnson',
            status: 'CONFIRMED',
            emailVerified: true,
          },
        },
      }),
    });
  });
}

/**
 * Mock Meet & Greet list API (for admin)
 */
export async function mockMeetAndGreetList(page: Page, bookings: any[] = []) {
  const defaultBookings = bookings.length > 0 ? bookings : [
    {
      id: 'mag-123',
      parent1Name: 'Sarah Smith',
      parent1Email: 'sarah@example.com',
      parent1Phone: '+61412345678',
      emergencyContactName: 'Mary Johnson',
      emergencyContactPhone: '+61411222333',
      childName: 'Emma',
      childAge: 7,
      instrumentInterest: 'Piano',
      preferredDateTime: '2025-02-15T10:00:00Z',
      location: { id: 'loc-001', name: 'Sydney CBD' },
      room: { id: 'room-001', name: 'Room 1' },
      teacher: { id: 'teacher-001', name: 'Ms. Johnson' },
      status: 'CONFIRMED',
      emailVerified: true,
      createdAt: new Date().toISOString(),
    },
  ];

  await page.route('**/api/v1/meet-and-greet', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          meetAndGreets: defaultBookings,
          total: defaultBookings.length,
          page: 1,
          pageSize: 20,
        },
      }),
    });
  });
}

/**
 * Mock Meet & Greet approval API
 */
export async function mockMeetAndGreetApproval(page: Page, bookingId = 'mag-123') {
  await page.route(`**/api/v1/meet-and-greet/${bookingId}/approve`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        message: 'Registration email sent to parent',
        data: {
          status: 'APPROVED',
          registrationLink: 'https://musicnme.com/register?token=reg_xyz789',
        },
      }),
    });
  });
}

/**
 * Mock registration token validation
 */
export async function mockRegistrationTokenValidation(
  page: Page,
  data: Partial<MeetAndGreetBooking> = {}
) {
  await page.route('**/api/v1/registration/token/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          schoolId: 'school-test-001',
          parent1Name: data.parent1Name || 'Sarah Smith',
          parent1Email: data.parent1Email || 'sarah@example.com',
          parent1Phone: data.parent1Phone || '+61412345678',
          parent2Name: data.parent2Name,
          parent2Email: data.parent2Email,
          parent2Phone: data.parent2Phone,
          emergencyContactName: data.emergencyContactName || 'Mary Johnson',
          emergencyContactPhone: data.emergencyContactPhone || '+61411222333',
          children: [
            {
              name: data.childName || 'Emma',
              age: data.childAge || 7,
              instrumentInterest: data.instrumentInterest || 'Piano',
            },
          ],
        },
      }),
    });
  });
}

/**
 * Mock Stripe checkout creation
 */
export async function mockStripeCheckoutCreation(page: Page, checkoutUrl?: string) {
  await page.route('**/api/v1/payments/create-checkout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          checkoutUrl: checkoutUrl || 'https://checkout.stripe.com/mock-session-123',
          sessionId: 'cs_test_123',
        },
      }),
    });
  });
}

/**
 * Mock successful registration completion
 */
export async function mockRegistrationCompletion(page: Page, userData: any = {}) {
  await page.route('**/api/v1/registration/complete', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        message: 'Account created successfully!',
        data: {
          user: {
            id: userData.id || 'user-123',
            email: userData.email || 'sarah@example.com',
            firstName: userData.firstName || 'Sarah',
            lastName: userData.lastName || 'Smith',
            role: 'PARENT',
            schoolId: 'school-test-001',
          },
          accessToken: 'mock-access-token-123',
          refreshToken: 'mock-refresh-token-123',
        },
      }),
    });
  });
}

/**
 * Mock available time slots
 */
export async function mockAvailableTimeSlots(page: Page, slots: any[] = []) {
  const defaultSlots = slots.length > 0 ? slots : [
    {
      dateTime: '2025-02-15T10:00:00Z',
      locationId: 'loc-001',
      locationName: 'Sydney CBD',
      roomId: 'room-001',
      roomName: 'Room 1',
      teacherId: 'teacher-001',
      teacherName: 'Ms. Johnson',
      available: true,
    },
    {
      dateTime: '2025-02-15T10:15:00Z',
      locationId: 'loc-001',
      locationName: 'Sydney CBD',
      roomId: 'room-001',
      roomName: 'Room 1',
      teacherId: 'teacher-001',
      teacherName: 'Ms. Johnson',
      available: true,
    },
  ];

  await page.route('**/api/v1/public/meet-and-greet/availability', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          slots: defaultSlots,
        },
      }),
    });
  });
}

/**
 * Verify email link (simulates clicking verification email)
 */
export async function verifyEmailViaLink(page: Page, token: string) {
  await page.goto(`/verify-email/${token}`);
}

/**
 * Navigate to registration page with token
 */
export async function navigateToRegistrationWithToken(page: Page, token: string) {
  await page.goto(`/register?token=${token}`);
}

/**
 * Fill registration password fields
 */
export async function fillRegistrationPassword(page: Page, password: string) {
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
}

/**
 * Complete registration form
 */
export async function completeRegistrationForm(
  page: Page,
  password = 'SecurePassword123!'
) {
  await fillRegistrationPassword(page, password);

  // Submit form
  await page.click('button[type="submit"]');
}

/**
 * Add additional child during registration
 */
export async function addAdditionalChild(
  page: Page,
  childData: { name: string; age: number }
) {
  const addChildButton = page.locator('button:has-text("Add")').filter({ hasText: /child/i });

  if (await addChildButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addChildButton.click();

    // Fill child data (field names may vary)
    const childNameField = page.locator('input[name*="child"][name*="name"]').last();
    const childAgeField = page.locator('input[name*="child"][name*="age"]').last();

    if (await childNameField.isVisible()) {
      await childNameField.fill(childData.name);
    }
    if (await childAgeField.isVisible()) {
      await childAgeField.fill(childData.age.toString());
    }
  }
}

/**
 * Approve Meet & Greet as admin
 */
export async function approveMeetAndGreetAsAdmin(page: Page, bookingId?: string) {
  // Navigate to Meet & Greet management
  await page.goto('/admin/meet-and-greet');

  // Click on first booking or specific booking
  const booking = bookingId
    ? page.locator(`[data-booking-id="${bookingId}"]`)
    : page.locator('[data-testid="booking-row"]').first().or(page.locator('tbody tr').first());

  if (await booking.isVisible({ timeout: 2000 }).catch(() => false)) {
    await booking.click();

    // Click approve button
    const approveButton = page.locator('button:has-text("Approve")').or(
      page.locator('[data-testid="approve-button"]')
    );

    if (await approveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await approveButton.click();
    }
  }
}

/**
 * Reject Meet & Greet as admin
 */
export async function rejectMeetAndGreetAsAdmin(
  page: Page,
  reason: string,
  bookingId?: string
) {
  // Navigate to Meet & Greet management
  await page.goto('/admin/meet-and-greet');

  // Click on first booking or specific booking
  const booking = bookingId
    ? page.locator(`[data-booking-id="${bookingId}"]`)
    : page.locator('[data-testid="booking-row"]').first().or(page.locator('tbody tr').first());

  if (await booking.isVisible({ timeout: 2000 }).catch(() => false)) {
    await booking.click();

    // Click reject button
    const rejectButton = page.locator('button:has-text("Reject")').or(
      page.locator('[data-testid="reject-button"]')
    );

    if (await rejectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rejectButton.click();

      // Fill rejection reason
      const reasonField = page.locator('textarea[name="reason"]').or(
        page.locator('[data-testid="rejection-reason"]')
      );

      if (await reasonField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reasonField.fill(reason);

        // Confirm rejection
        await page.click('button:has-text("Confirm")');
      }
    }
  }
}

/**
 * Add notes to Meet & Greet
 */
export async function addNotesToMeetAndGreet(page: Page, notes: string) {
  const notesField = page.locator('textarea[name="notes"]').or(
    page.locator('[data-testid="notes-field"]')
  );

  if (await notesField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await notesField.fill(notes);

    // Save notes
    const saveButton = page.locator('button:has-text("Save")');
    if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await saveButton.click();
    }
  }
}
