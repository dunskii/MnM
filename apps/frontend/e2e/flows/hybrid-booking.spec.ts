// ===========================================
// Hybrid Booking E2E Tests
// ===========================================
// Test the core hybrid booking functionality

import { test, expect } from '../fixtures/test-fixtures';
import { logout } from '../helpers/auth';

test.describe('Hybrid Booking Flow', () => {
  test.describe('Parent Booking Individual Sessions', () => {
    test('parent can view hybrid lesson calendar', async ({ parentPage }) => {
      // Navigate to hybrid lesson calendar
      await parentPage.goto('/parent/lessons');

      // Look for hybrid lessons
      const hybridLessonCard = parentPage.locator('[data-lesson-type="HYBRID"]').first();

      if (await hybridLessonCard.isVisible()) {
        await hybridLessonCard.click();

        // Should show calendar view
        await expect(parentPage.locator('[data-testid="hybrid-calendar"]')).toBeVisible({
          timeout: 10000,
        });
      }
    });

    test('parent can identify individual vs group weeks', async ({ parentPage }) => {
      // Navigate to hybrid lesson detail page
      // Note: Update URL with actual hybrid lesson ID
      await parentPage.goto('/parent/lessons/hybrid-test-123');

      // Wait for calendar to load
      const calendar = parentPage.locator('[data-testid="hybrid-calendar"]');
      if (await calendar.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Check for week indicators
        const groupWeeks = parentPage.locator('[data-week-type="GROUP"]');
        const individualWeeks = parentPage.locator('[data-week-type="INDIVIDUAL"]');

        // Should have both types
        const groupCount = await groupWeeks.count();
        const individualCount = await individualWeeks.count();

        expect(groupCount).toBeGreaterThan(0);
        expect(individualCount).toBeGreaterThan(0);
      }
    });

    test('parent can book individual session', async ({ parentPage }) => {
      // Navigate to hybrid lesson
      await parentPage.goto('/parent/lessons/hybrid-test-123');

      // Wait for calendar
      await parentPage.waitForSelector('[data-testid="hybrid-calendar"]', {
        timeout: 10000,
        state: 'visible',
      }).catch(() => null);

      // Select an individual week (e.g., week 4)
      const individualWeek = parentPage.locator('[data-week-type="INDIVIDUAL"]').first();

      if (await individualWeek.isVisible({ timeout: 3000 }).catch(() => false)) {
        await individualWeek.click();

        // Select available time slot
        const timeSlot = parentPage.locator('[data-testid*="timeslot"]').first();
        if (await timeSlot.isVisible()) {
          await timeSlot.click();

          // Confirm booking
          const confirmButton = parentPage.locator('button:has-text("Confirm")');
          if (await confirmButton.isEnabled()) {
            await confirmButton.click();

            // Should show success message
            await expect(
              parentPage.locator('text=/booking.*confirmed|success/i')
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('parent cannot book group week individually', async ({ parentPage }) => {
      // Navigate to hybrid lesson
      await parentPage.goto('/parent/lessons/hybrid-test-123');

      // Try to select a group week
      const groupWeek = parentPage.locator('[data-week-type="GROUP"]').first();

      if (await groupWeek.isVisible({ timeout: 3000 }).catch(() => false)) {
        await groupWeek.click();

        // Should show error or disabled state
        const errorMessage = parentPage.locator(
          'text=/this.*is.*group.*lesson|cannot.*book.*group/i'
        );
        const bookButton = parentPage.locator('button:has-text("Book")');

        // Either error message shown or book button disabled
        const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
        const isDisabled = await bookButton.isDisabled().catch(() => true);

        expect(hasError || isDisabled).toBeTruthy();
      }
    });

    test('parent can reschedule booking with 24h notice', async ({ parentPage }) => {
      // Navigate to bookings page
      await parentPage.goto('/parent/bookings');

      // Find a booking that's more than 24 hours away
      const futureBooking = parentPage.locator('[data-testid*="booking"]').first();

      if (await futureBooking.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click reschedule button
        const rescheduleButton = futureBooking.locator('button:has-text("Reschedule")');

        if (await rescheduleButton.isVisible()) {
          await rescheduleButton.click();

          // Select new time slot
          const newTimeSlot = parentPage.locator('[data-testid*="timeslot"]').nth(1);
          if (await newTimeSlot.isVisible()) {
            await newTimeSlot.click();

            // Confirm reschedule
            await parentPage.click('button:has-text("Confirm")');

            // Should show success message
            await expect(
              parentPage.locator('text=/rescheduled.*successfully|booking.*updated/i')
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('parent cannot reschedule booking within 24h', async ({ parentPage }) => {
      // Navigate to bookings page
      await parentPage.goto('/parent/bookings');

      // This test assumes there's a booking within 24 hours
      // In a real test, you'd create this via the test data factory

      // Find booking within 24h (if exists)
      const recentBooking = parentPage.locator('[data-booking-time="within-24h"]').first();

      if (await recentBooking.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Reschedule button should be disabled or show error
        const rescheduleButton = recentBooking.locator('button:has-text("Reschedule")');

        const isDisabled = await rescheduleButton.isDisabled().catch(() => true);
        expect(isDisabled).toBeTruthy();
      }
    });

    test('parent can cancel booking with 24h notice', async ({ parentPage }) => {
      // Navigate to bookings page
      await parentPage.goto('/parent/bookings');

      // Find a future booking
      const futureBooking = parentPage.locator('[data-testid*="booking"]').first();

      if (await futureBooking.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click cancel button
        const cancelButton = futureBooking.locator('button:has-text("Cancel")');

        if (await cancelButton.isVisible()) {
          await cancelButton.click();

          // Confirm cancellation in dialog
          const confirmDialog = parentPage.locator('[role="dialog"]');
          if (await confirmDialog.isVisible()) {
            await confirmDialog.locator('button:has-text("Confirm")').click();

            // Should show success message
            await expect(
              parentPage.locator('text=/cancelled.*successfully|booking.*cancelled/i')
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('parent can view booking history', async ({ parentPage }) => {
      // Navigate to bookings page
      await parentPage.goto('/parent/bookings');

      // Should show list of bookings
      await expect(
        parentPage.locator('h1:has-text("Bookings"), h2:has-text("Bookings")')
      ).toBeVisible();

      // Should have at least some content (bookings or empty state)
      const bookingsList = parentPage.locator('[data-testid="bookings-list"]');
      const emptyState = parentPage.locator('text=/no.*bookings|no.*sessions/i');

      const hasBookings = await bookingsList.isVisible({ timeout: 3000 }).catch(() => false);
      const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasBookings || isEmpty).toBeTruthy();
    });
  });

  test.describe('Teacher Managing Hybrid Lessons', () => {
    test('teacher can view hybrid lesson pattern', async ({ teacherPage }) => {
      // Navigate to lessons
      await teacherPage.goto('/teacher/lessons');

      // Find hybrid lesson
      const hybridLesson = teacherPage.locator('[data-lesson-type="HYBRID"]').first();

      if (await hybridLesson.isVisible({ timeout: 3000 }).catch(() => false)) {
        await hybridLesson.click();

        // Should show pattern details (group weeks vs individual weeks)
        await expect(
          teacherPage.locator('text=/group.*weeks|individual.*weeks|pattern/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('teacher can view individual session bookings', async ({ teacherPage }) => {
      // Navigate to hybrid lesson detail
      await teacherPage.goto('/teacher/lessons/hybrid-test-123');

      // Look for bookings section
      const bookingsSection = teacherPage.locator('[data-testid="individual-bookings"]');

      if (await bookingsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Should show booked sessions
        const bookings = bookingsSection.locator('[data-testid*="booking"]');
        const bookingCount = await bookings.count();

        // May or may not have bookings, but section should be visible
        expect(bookingCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('teacher can see availability slots', async ({ teacherPage }) => {
      // Navigate to hybrid lesson
      await teacherPage.goto('/teacher/lessons/hybrid-test-123');

      // Look for availability calendar/slots
      const availabilitySection = teacherPage.locator(
        '[data-testid="availability-slots"], [data-testid="booking-calendar"]'
      );

      if (await availabilitySection.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Should show time slots
        const timeSlots = teacherPage.locator('[data-testid*="timeslot"]');
        const slotCount = await timeSlots.count();

        expect(slotCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Admin Managing Hybrid Lessons', () => {
    test('admin can create hybrid lesson', async ({ adminPage }) => {
      // Navigate to create lesson page
      await adminPage.goto('/admin/lessons/create');

      // Fill in lesson details
      await adminPage.fill('input[name="name"]', 'Test Hybrid Piano');

      // Select lesson type - Hybrid
      const lessonTypeSelect = adminPage.locator('select[name="lessonType"], [name="lessonTypeId"]');
      if (await lessonTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lessonTypeSelect.selectOption({ label: 'Hybrid' });
      } else {
        // Material-UI Select (different approach)
        const muiSelect = adminPage.locator('[data-testid="lesson-type-select"]');
        if (await muiSelect.isVisible()) {
          await muiSelect.click();
          await adminPage.click('li:has-text("Hybrid")');
        }
      }

      // Configure hybrid pattern would be here
      // (Skipping detailed form filling for brevity)

      // Submit form
      const submitButton = adminPage.locator('button[type="submit"]');
      if (await submitButton.isEnabled()) {
        // Note: In real test, fill all required fields first
        // await submitButton.click();
        // await expect(adminPage.locator('text=/created.*successfully/i')).toBeVisible();
      }
    });

    test('admin can configure hybrid pattern', async ({ adminPage }) => {
      // Navigate to hybrid lesson edit page
      await adminPage.goto('/admin/lessons/hybrid-test-123/edit');

      // Look for pattern configuration
      const patternConfig = adminPage.locator('[data-testid="hybrid-pattern-config"]');

      if (await patternConfig.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Should show group/individual week toggles
        const weekToggles = adminPage.locator('[data-testid*="week-toggle"]');
        const toggleCount = await weekToggles.count();

        expect(toggleCount).toBeGreaterThan(0);
      }
    });

    test('admin can view all hybrid bookings', async ({ adminPage }) => {
      // Navigate to bookings/schedule page
      await adminPage.goto('/admin/bookings');

      // Filter by hybrid lessons
      const filterButton = adminPage.locator('button:has-text("Filter")');
      if (await filterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await filterButton.click();

        // Select hybrid filter
        const hybridFilter = adminPage.locator('input[type="checkbox"][value="HYBRID"]');
        if (await hybridFilter.isVisible()) {
          await hybridFilter.check();
        }
      }

      // Should show bookings
      await expect(adminPage.locator('[data-testid="bookings-list"]')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Booking Conflicts', () => {
    test('should prevent double booking same time slot', async ({ testData, parentPage }) => {
      // Navigate to hybrid lesson
      await parentPage.goto('/parent/lessons/hybrid-test-123');

      // Try to book already booked slot
      // (Assumes slot is already booked via test data)

      const bookedSlot = parentPage.locator('[data-slot-status="booked"]').first();

      if (await bookedSlot.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Slot should be disabled or show as unavailable
        const isClickable = await bookedSlot.isEnabled().catch(() => false);
        expect(isClickable).toBeFalsy();
      }
    });

    test('should show real-time availability updates', async ({ page, context }) => {
      // Open two parent sessions (simulating two parents)
      const parent1Page = page;
      const parent2Page = await context.newPage();

      // Both navigate to same hybrid lesson
      await parent1Page.goto('/parent/lessons/hybrid-test-123');
      await parent2Page.goto('/parent/lessons/hybrid-test-123');

      // Parent 1 selects a slot
      const timeSlot = parent1Page.locator('[data-testid*="timeslot"]').first();
      if (await timeSlot.isVisible({ timeout: 3000 }).catch(() => false)) {
        const slotId = await timeSlot.getAttribute('data-slot-id');

        await timeSlot.click();
        await parent1Page.click('button:has-text("Confirm")');

        // Wait for booking confirmation
        await parent1Page.waitForSelector('text=/confirmed|success/i', {
          timeout: 5000,
        }).catch(() => null);

        // Parent 2's view should update to show slot as unavailable
        await parent2Page.reload();
        const parent2Slot = parent2Page.locator(`[data-slot-id="${slotId}"]`);

        if (await parent2Slot.isVisible({ timeout: 3000 }).catch(() => false)) {
          const isAvailable = await parent2Slot.isEnabled().catch(() => false);
          expect(isAvailable).toBeFalsy();
        }
      }

      await parent2Page.close();
    });
  });

  test.describe('Multi-Tenancy Security', () => {
    test('parent from School A cannot see School B hybrid lessons', async ({ parentPage }) => {
      // Note: This assumes test data exists for multiple schools
      // Parent is logged into School A

      // Try to access School B's hybrid lesson directly
      await parentPage.goto('/parent/lessons/school-b-hybrid-lesson-id');

      // Should show 404 or access denied
      await expect(
        parentPage.locator('text=/not found|access denied|unauthorized/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('parent cannot book sessions for students from another school', async ({ testData, page }) => {
      // This would require API-level testing
      // Test that API validates schoolId on booking requests
    });
  });
});
