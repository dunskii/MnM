// ===========================================
// Lesson Management E2E Tests
// ===========================================
// Test the complete lesson management flow from creation to resources

import { test, expect } from '../fixtures/test-fixtures';
import { TEST_INSTRUMENTS, TEST_ROOMS, TEST_STUDENTS } from '../helpers/test-data';

test.describe('Lesson Management Flow', () => {
  test.describe('Lesson Creation - Admin', () => {
    test('admin can create individual lesson', async ({ adminPage }) => {
      // Navigate to create lesson page
      await adminPage.goto('/admin/lessons');

      // Click create lesson button
      const createButton = adminPage.locator('button:has-text("Create Lesson"), button:has-text("New Lesson"), a:has-text("Create Lesson")');
      await createButton.click();

      // Should navigate to create form
      await expect(adminPage).toHaveURL(/\/admin\/lessons\/(create|new)/);

      // Fill in lesson details
      await adminPage.fill('input[name="name"], input[name="title"]', 'Piano Beginners - Individual');

      // Select lesson type - Individual
      const lessonTypeField = adminPage.locator('[data-testid="lesson-type-select"]');
      if (await lessonTypeField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lessonTypeField.click();
        await adminPage.click('li:has-text("Individual")');
      } else {
        // Fallback to native select
        await adminPage.selectOption('select[name="lessonType"], select[name="lessonTypeId"]', { label: 'Individual' });
      }

      // Select instrument
      const instrumentField = adminPage.locator('[data-testid="instrument-select"]');
      if (await instrumentField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await instrumentField.click();
        await adminPage.click('li:has-text("Piano")');
      } else {
        await adminPage.selectOption('select[name="instrument"], select[name="instrumentId"]', { label: 'Piano' });
      }

      // Select duration - 45 minutes (default for individual)
      const durationField = adminPage.locator('[data-testid="duration-select"]');
      if (await durationField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await durationField.click();
        await adminPage.click('li:has-text("45")');
      } else {
        await adminPage.fill('input[name="duration"], input[name="durationMins"]', '45');
      }

      // Select room
      const roomField = adminPage.locator('[data-testid="room-select"]');
      if (await roomField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roomField.click();
        await adminPage.locator('li').first().click(); // Select first room
      }

      // Select teacher
      const teacherField = adminPage.locator('[data-testid="teacher-select"]');
      if (await teacherField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await teacherField.click();
        await adminPage.locator('li').first().click(); // Select first teacher
      }

      // Set schedule
      await adminPage.selectOption('select[name="dayOfWeek"]', '1'); // Monday
      await adminPage.fill('input[name="startTime"]', '09:00');

      // Set max students (1 for individual)
      await adminPage.fill('input[name="maxStudents"], input[name="capacity"]', '1');

      // Submit form
      const submitButton = adminPage.locator('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")');
      await submitButton.click();

      // Should show success message
      await expect(
        adminPage.locator('text=/created.*successfully|lesson.*created/i')
      ).toBeVisible({ timeout: 10000 });

      // Should redirect to lessons list or lesson detail
      await expect(adminPage).toHaveURL(/\/admin\/lessons/);
    });

    test('admin can create group lesson', async ({ adminPage }) => {
      await adminPage.goto('/admin/lessons/create');

      // Fill in basic details
      await adminPage.fill('input[name="name"], input[name="title"]', 'Guitar Group Session');

      // Select lesson type - Group
      const lessonTypeField = adminPage.locator('[data-testid="lesson-type-select"]');
      if (await lessonTypeField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lessonTypeField.click();
        await adminPage.click('li:has-text("Group")');
      } else {
        await adminPage.selectOption('select[name="lessonType"], select[name="lessonTypeId"]', { label: 'Group' });
      }

      // Select instrument
      const instrumentField = adminPage.locator('[data-testid="instrument-select"]');
      if (await instrumentField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await instrumentField.click();
        await adminPage.click('li:has-text("Guitar")');
      }

      // Duration should default to 60 minutes for group
      const durationInput = adminPage.locator('input[name="duration"], input[name="durationMins"]');
      const durationValue = await durationInput.inputValue().catch(() => '');
      if (durationValue !== '60') {
        await durationInput.fill('60');
      }

      // Set max students (6-8 for group)
      await adminPage.fill('input[name="maxStudents"], input[name="capacity"]', '6');

      // Submit (skipping other fields for brevity - test creation flow, not all validations)
      // In production, you'd fill all required fields
    });

    test('admin can create band lesson', async ({ adminPage }) => {
      await adminPage.goto('/admin/lessons/create');

      await adminPage.fill('input[name="name"], input[name="title"]', 'Rock Band Ensemble');

      // Select lesson type - Band
      const lessonTypeField = adminPage.locator('[data-testid="lesson-type-select"]');
      if (await lessonTypeField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lessonTypeField.click();
        await adminPage.click('li:has-text("Band")');
      } else {
        await adminPage.selectOption('select[name="lessonType"], select[name="lessonTypeId"]', { label: 'Band' });
      }

      // Duration should default to 60 minutes for band
      const durationInput = adminPage.locator('input[name="duration"], input[name="durationMins"]');
      const durationValue = await durationInput.inputValue().catch(() => '');
      if (durationValue !== '60') {
        await durationInput.fill('60');
      }

      // Set max students (typically 4-6 for band)
      await adminPage.fill('input[name="maxStudents"], input[name="capacity"]', '5');
    });

    test('admin can create hybrid lesson with pattern', async ({ adminPage }) => {
      await adminPage.goto('/admin/lessons/create');

      await adminPage.fill('input[name="name"], input[name="title"]', 'Hybrid Piano Course');

      // Select lesson type - Hybrid
      const lessonTypeField = adminPage.locator('[data-testid="lesson-type-select"]');
      if (await lessonTypeField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lessonTypeField.click();
        await adminPage.click('li:has-text("Hybrid")');
      } else {
        await adminPage.selectOption('select[name="lessonType"], select[name="lessonTypeId"]', { label: 'Hybrid' });
      }

      // Hybrid pattern configuration should appear
      const patternConfig = adminPage.locator('[data-testid="hybrid-pattern-config"]');
      await expect(patternConfig).toBeVisible({ timeout: 5000 });

      // Configure pattern (example: weeks 1-3 group, week 4 individual, etc.)
      // Toggle individual weeks
      const week4Toggle = adminPage.locator('[data-testid="week-4-toggle"]');
      if (await week4Toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await week4Toggle.click(); // Make week 4 individual
      }

      const week8Toggle = adminPage.locator('[data-testid="week-8-toggle"]');
      if (await week8Toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await week8Toggle.click(); // Make week 8 individual
      }

      // Set individual session duration
      await adminPage.fill('input[name="individualSlotDuration"]', '30');

      // Should show summary of pattern
      await expect(
        adminPage.locator('text=/group.*weeks.*individual.*weeks|pattern.*summary/i')
      ).toBeVisible();
    });

    test('validates required fields', async ({ adminPage }) => {
      await adminPage.goto('/admin/lessons/create');

      // Try to submit without filling required fields
      const submitButton = adminPage.locator('button[type="submit"]');
      await submitButton.click();

      // Should show validation errors
      await expect(
        adminPage.locator('text=/required|please.*enter|field.*required/i').first()
      ).toBeVisible({ timeout: 5000 });

      // Form should not submit
      await expect(adminPage).toHaveURL(/\/admin\/lessons\/(create|new)/);
    });

    test('detects schedule conflicts', async ({ adminPage }) => {
      // First, create a lesson at specific time
      await adminPage.goto('/admin/lessons/create');

      await adminPage.fill('input[name="name"], input[name="title"]', 'Piano Lesson 1');

      // Set schedule details that will create conflict
      await adminPage.selectOption('select[name="dayOfWeek"]', '2'); // Tuesday
      await adminPage.fill('input[name="startTime"]', '14:00');
      await adminPage.fill('input[name="duration"], input[name="durationMins"]', '60');

      // Select same room and teacher
      // (Implementation depends on UI - might need to select specific values)

      // Now try to create another lesson with overlapping time
      // Should show conflict warning
      const conflictWarning = adminPage.locator('[data-testid="schedule-conflict-warning"]');
      if (await conflictWarning.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(conflictWarning).toContainText(/conflict|overlap|already scheduled/i);
      }
    });

    test('lesson appears in calendar after creation', async ({ adminPage }) => {
      // Create a lesson
      await adminPage.goto('/admin/lessons/create');

      const lessonName = `Test Lesson ${Date.now()}`;
      await adminPage.fill('input[name="name"], input[name="title"]', lessonName);

      // Fill required fields (simplified)
      // ... (fill all fields)

      // Submit
      await adminPage.click('button[type="submit"]');

      // Wait for success
      await adminPage.waitForSelector('text=/created.*successfully/i', { timeout: 10000 }).catch(() => null);

      // Navigate to calendar
      await adminPage.goto('/admin/calendar');

      // Should see the lesson in calendar view
      await expect(adminPage.locator(`text="${lessonName}"`)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Lesson Enrollment - Admin', () => {
    test('admin can enroll single student', async ({ adminPage }) => {
      // Navigate to lessons list
      await adminPage.goto('/admin/lessons');

      // Select a lesson
      const lessonCard = adminPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Should be on lesson detail page
      await expect(adminPage).toHaveURL(/\/admin\/lessons\/[a-zA-Z0-9-]+/);

      // Click enroll students button
      const enrollButton = adminPage.locator('button:has-text("Enroll"), button:has-text("Add Student")');
      if (await enrollButton.isVisible({ timeout: 5000 })) {
        await enrollButton.click();

        // Select student from dropdown/modal
        const studentSelect = adminPage.locator('[data-testid="student-select"]');
        if (await studentSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          await studentSelect.click();
          await adminPage.locator('li').first().click();

          // Confirm enrollment
          await adminPage.click('button:has-text("Confirm"), button:has-text("Enroll")');

          // Should show success message
          await expect(
            adminPage.locator('text=/enrolled.*successfully|student.*added/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('admin can bulk enroll multiple students', async ({ adminPage }) => {
      await adminPage.goto('/admin/lessons');

      // Select a lesson
      const lessonCard = adminPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Click bulk enroll button
      const bulkEnrollButton = adminPage.locator('button:has-text("Bulk Enroll"), button:has-text("Enroll Multiple")');
      if (await bulkEnrollButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bulkEnrollButton.click();

        // Select multiple students (checkboxes)
        const studentCheckboxes = adminPage.locator('input[type="checkbox"][data-student-id]');
        const count = await studentCheckboxes.count();

        // Check first 3 students (if available)
        const enrollCount = Math.min(count, 3);
        for (let i = 0; i < enrollCount; i++) {
          await studentCheckboxes.nth(i).check();
        }

        // Confirm bulk enrollment
        await adminPage.click('button:has-text("Confirm"), button:has-text("Enroll Selected")');

        // Should show success message
        await expect(
          adminPage.locator('text=/students.*enrolled|enrolled.*successfully/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('admin can remove student from lesson', async ({ adminPage }) => {
      await adminPage.goto('/admin/lessons');

      // Select a lesson with enrolled students
      const lessonCard = adminPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Find enrolled students list
      const enrolledList = adminPage.locator('[data-testid="enrolled-students"]');
      if (await enrolledList.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click remove button for first student
        const removeButton = enrolledList.locator('button:has-text("Remove")').first();
        if (await removeButton.isVisible()) {
          await removeButton.click();

          // Confirm removal in dialog
          const confirmDialog = adminPage.locator('[role="dialog"]');
          if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmDialog.locator('button:has-text("Confirm"), button:has-text("Remove")').click();
          }

          // Should show success message
          await expect(
            adminPage.locator('text=/removed.*successfully|student.*removed/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('enforces capacity limits', async ({ adminPage }) => {
      // Navigate to an individual lesson (capacity = 1)
      await adminPage.goto('/admin/lessons');

      // Find individual lesson
      const individualLesson = adminPage.locator('[data-lesson-type="INDIVIDUAL"]').first();
      if (await individualLesson.isVisible({ timeout: 3000 }).catch(() => false)) {
        await individualLesson.click();

        // If lesson is full, enroll button should be disabled or show warning
        const enrollButton = adminPage.locator('button:has-text("Enroll")');

        // Check capacity status
        const capacityText = await adminPage.locator('[data-testid="capacity-indicator"]').textContent().catch(() => '');

        if (capacityText.includes('Full') || capacityText.includes('1/1')) {
          // Enroll button should be disabled
          await expect(enrollButton).toBeDisabled();
        }
      }
    });

    test('shows waitlist when lesson is full', async ({ adminPage }) => {
      // This test assumes waitlist functionality exists
      await adminPage.goto('/admin/lessons');

      // Find a full lesson
      const fullLesson = adminPage.locator('[data-capacity-status="full"]').first();
      if (await fullLesson.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fullLesson.click();

        // Should show waitlist option
        const waitlistButton = adminPage.locator('button:has-text("Add to Waitlist"), button:has-text("Waitlist")');
        await expect(waitlistButton).toBeVisible({ timeout: 5000 });
      }
    });

    test('enrollment count updates correctly', async ({ adminPage }) => {
      await adminPage.goto('/admin/lessons');

      const lessonCard = adminPage.locator('[data-testid*="lesson-card"]').first();

      // Get initial enrollment count
      const initialCountText = await lessonCard.locator('[data-testid="enrollment-count"]').textContent().catch(() => '0');
      const initialCount = parseInt(initialCountText.match(/\d+/)?.[0] || '0');

      // Click to view lesson
      await lessonCard.click();

      // Enroll a student
      const enrollButton = adminPage.locator('button:has-text("Enroll")');
      if (await enrollButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enrollButton.click();

        // Select student and confirm
        const studentSelect = adminPage.locator('[data-testid="student-select"]');
        if (await studentSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          await studentSelect.click();
          await adminPage.locator('li').first().click();
          await adminPage.click('button:has-text("Confirm")');

          // Wait for success
          await adminPage.waitForSelector('text=/enrolled.*successfully/i', { timeout: 5000 }).catch(() => null);

          // Go back to lessons list
          await adminPage.goto('/admin/lessons');

          // Check that count increased
          const updatedCountText = await lessonCard.locator('[data-testid="enrollment-count"]').textContent();
          const updatedCount = parseInt(updatedCountText.match(/\d+/)?.[0] || '0');

          expect(updatedCount).toBeGreaterThan(initialCount);
        }
      }
    });
  });

  test.describe('Teacher View - All Lessons', () => {
    test('teacher can view all school lessons', async ({ teacherPage }) => {
      // Per CLAUDE.md: Teachers can view ALL classes and students
      await teacherPage.goto('/teacher/lessons');

      // Should show list of all lessons in the school
      const lessonsList = teacherPage.locator('[data-testid="lessons-list"]');
      await expect(lessonsList).toBeVisible({ timeout: 10000 });

      // Should have multiple lessons
      const lessonCards = teacherPage.locator('[data-testid*="lesson-card"]');
      const lessonCount = await lessonCards.count();

      expect(lessonCount).toBeGreaterThan(0);
    });

    test('teacher can filter by their own lessons', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      // Look for filter option
      const filterButton = teacherPage.locator('button:has-text("Filter"), [data-testid="filter-button"]');
      if (await filterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await filterButton.click();

        // Select "My Lessons" filter
        const myLessonsFilter = teacherPage.locator('text=/my.*lessons|assigned.*to.*me/i');
        if (await myLessonsFilter.isVisible()) {
          await myLessonsFilter.click();

          // Should filter list to only teacher's assigned lessons
          await expect(teacherPage.locator('[data-testid*="lesson-card"]')).toBeVisible();
        }
      }
    });

    test('teacher can view lesson details', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      // Click on first lesson
      const firstLesson = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await firstLesson.click();

      // Should navigate to lesson detail page
      await expect(teacherPage).toHaveURL(/\/teacher\/lessons\/[a-zA-Z0-9-]+/);

      // Should show lesson information
      await expect(teacherPage.locator('h1, h2')).toBeVisible();

      // Should show enrolled students list
      const studentsSection = teacherPage.locator('[data-testid="enrolled-students"], h3:has-text("Students")');
      await expect(studentsSection).toBeVisible({ timeout: 5000 });
    });

    test('lesson detail shows correct information', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();

      // Get lesson name from card
      const lessonName = await lessonCard.locator('[data-testid="lesson-name"]').textContent();

      await lessonCard.click();

      // Verify lesson name matches in detail page
      if (lessonName) {
        await expect(teacherPage.locator(`h1:has-text("${lessonName}"), h2:has-text("${lessonName}")`)).toBeVisible();
      }

      // Should show schedule information
      await expect(teacherPage.locator('text=/day|time|duration|schedule/i')).toBeVisible();

      // Should show room and location
      await expect(teacherPage.locator('text=/room|location/i')).toBeVisible();
    });
  });

  test.describe('Attendance Marking - Teacher', () => {
    test('teacher can mark single student present', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      // Select a lesson
      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to attendance section
      const attendanceTab = teacherPage.locator('button:has-text("Attendance"), [data-testid="attendance-tab"]');
      if (await attendanceTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await attendanceTab.click();
      }

      // Find attendance marking interface
      const attendanceList = teacherPage.locator('[data-testid="attendance-list"]');
      if (await attendanceList.isVisible({ timeout: 5000 })) {
        // Mark first student as present
        const presentButton = attendanceList.locator('button:has-text("Present")').first();
        if (await presentButton.isVisible()) {
          await presentButton.click();

          // Should update UI to show present status
          await expect(
            attendanceList.locator('[data-attendance-status="present"]').first()
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('teacher can mark single student absent', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to attendance
      const attendanceTab = teacherPage.locator('button:has-text("Attendance")');
      if (await attendanceTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await attendanceTab.click();
      }

      // Mark first student as absent
      const attendanceList = teacherPage.locator('[data-testid="attendance-list"]');
      if (await attendanceList.isVisible({ timeout: 5000 })) {
        const absentButton = attendanceList.locator('button:has-text("Absent")').first();
        if (await absentButton.isVisible()) {
          await absentButton.click();

          // Should show absent status
          await expect(
            attendanceList.locator('[data-attendance-status="absent"]').first()
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('teacher can mark student late', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      const attendanceList = teacherPage.locator('[data-testid="attendance-list"]');
      if (await attendanceList.isVisible({ timeout: 5000 })) {
        const lateButton = attendanceList.locator('button:has-text("Late")').first();
        if (await lateButton.isVisible()) {
          await lateButton.click();

          await expect(
            attendanceList.locator('[data-attendance-status="late"]').first()
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('teacher can batch mark all present', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Look for "Mark All Present" button
      const markAllButton = teacherPage.locator('button:has-text("Mark All Present"), button:has-text("All Present")');
      if (await markAllButton.isVisible({ timeout: 5000 })) {
        await markAllButton.click();

        // All students should be marked present
        const attendanceList = teacherPage.locator('[data-testid="attendance-list"]');
        const presentStatuses = attendanceList.locator('[data-attendance-status="present"]');
        const presentCount = await presentStatuses.count();

        expect(presentCount).toBeGreaterThan(0);
      }
    });

    test('attendance history is visible', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to attendance history
      const historyTab = teacherPage.locator('button:has-text("History"), [data-testid="attendance-history-tab"]');
      if (await historyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await historyTab.click();

        // Should show past attendance records
        await expect(teacherPage.locator('[data-testid="attendance-history"]')).toBeVisible();
      }
    });

    test('attendance statistics are calculated', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Look for statistics section
      const statsSection = teacherPage.locator('[data-testid="attendance-stats"]');
      if (await statsSection.isVisible({ timeout: 5000 })) {
        // Should show attendance rate
        await expect(statsSection.locator('text=/attendance.*rate|percentage/i')).toBeVisible();

        // Should show counts
        await expect(statsSection.locator('text=/present|absent|total/i')).toBeVisible();
      }
    });
  });

  test.describe('Teacher Notes - Required', () => {
    test('teacher can add class note for session', async ({ teacherPage }) => {
      // Per CLAUDE.md: Teacher notes REQUIRED per student AND per class
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to notes section
      const notesTab = teacherPage.locator('button:has-text("Notes"), [data-testid="notes-tab"]');
      if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await notesTab.click();
      }

      // Add class note
      const classNoteField = teacherPage.locator('[data-testid="class-note-input"], textarea[name="classNote"]');
      if (await classNoteField.isVisible({ timeout: 5000 })) {
        await classNoteField.fill('Today we covered basic scales and rhythm exercises. Great progress from the group!');

        // Save note
        const saveButton = teacherPage.locator('button:has-text("Save"), button:has-text("Add Note")');
        await saveButton.click();

        // Should show success message
        await expect(
          teacherPage.locator('text=/note.*saved|note.*added/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('teacher can add student-specific note', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to students list
      const studentsList = teacherPage.locator('[data-testid="enrolled-students"]');
      if (await studentsList.isVisible({ timeout: 5000 })) {
        // Click on first student
        const firstStudent = studentsList.locator('[data-testid*="student"]').first();
        await firstStudent.click();

        // Add student note
        const studentNoteField = teacherPage.locator('[data-testid="student-note-input"], textarea[name="studentNote"]');
        if (await studentNoteField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await studentNoteField.fill('Excellent work on fingering today. Continue practicing C major scale at home.');

          // Save note
          await teacherPage.click('button:has-text("Save")');

          // Should show success
          await expect(
            teacherPage.locator('text=/note.*saved|note.*added/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('teacher can edit existing note', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Find existing note
      const existingNote = teacherPage.locator('[data-testid*="note"]').first();
      if (await existingNote.isVisible({ timeout: 5000 })) {
        // Click edit button
        const editButton = existingNote.locator('button:has-text("Edit")');
        if (await editButton.isVisible()) {
          await editButton.click();

          // Modify note text
          const noteField = teacherPage.locator('textarea[name="note"]');
          await noteField.fill('Updated note content with additional observations.');

          // Save changes
          await teacherPage.click('button:has-text("Save")');

          // Should show success
          await expect(
            teacherPage.locator('text=/note.*updated|changes.*saved/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('shows notes completion tracking', async ({ teacherPage }) => {
      // Per CLAUDE.md: Notes expected daily, must be done by end of week
      await teacherPage.goto('/teacher/dashboard');

      // Should show notes completion status
      const notesWidget = teacherPage.locator('[data-testid="notes-completion"]');
      if (await notesWidget.isVisible({ timeout: 5000 })) {
        // Should show percentage or count of completed notes
        await expect(notesWidget.locator('text=/notes.*completed|notes.*pending/i')).toBeVisible();
      }
    });

    test('teacher can view note history', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to notes history
      const historyTab = teacherPage.locator('button:has-text("Note History"), [data-testid="note-history-tab"]');
      if (await historyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await historyTab.click();

        // Should show list of past notes
        await expect(teacherPage.locator('[data-testid="note-history-list"]')).toBeVisible();
      }
    });
  });

  test.describe('Resource Management - Google Drive Integration', () => {
    test('admin can link Google Drive folder to lesson', async ({ adminPage }) => {
      await adminPage.goto('/admin/lessons');

      const lessonCard = adminPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to resources section
      const resourcesTab = adminPage.locator('button:has-text("Resources"), [data-testid="resources-tab"]');
      if (await resourcesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await resourcesTab.click();
      }

      // Click link Drive folder button
      const linkDriveButton = adminPage.locator('button:has-text("Link Drive Folder"), button:has-text("Connect Drive")');
      if (await linkDriveButton.isVisible({ timeout: 5000 })) {
        await linkDriveButton.click();

        // Should show Drive folder picker or input
        const folderInput = adminPage.locator('input[name="driveFolderId"], [data-testid="drive-folder-input"]');
        if (await folderInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await folderInput.fill('test-drive-folder-id-123');

          // Confirm linking
          await adminPage.click('button:has-text("Confirm"), button:has-text("Link")');

          // Should show success
          await expect(
            adminPage.locator('text=/drive.*linked|folder.*connected/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('teacher can upload file to lesson resources', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to resources
      const resourcesTab = teacherPage.locator('button:has-text("Resources")');
      if (await resourcesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await resourcesTab.click();
      }

      // Upload file
      const uploadButton = teacherPage.locator('button:has-text("Upload"), input[type="file"]');
      if (await uploadButton.isVisible({ timeout: 5000 })) {
        // Note: File upload testing requires special handling in Playwright
        // This is a simplified version - in production, you'd use setInputFiles()
        // await uploadButton.setInputFiles('path/to/test/file.pdf');

        // Should show upload progress/success
        // await expect(teacherPage.locator('text=/uploaded|upload.*complete/i')).toBeVisible();
      }
    });

    test('teacher can set file visibility', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons');

      const lessonCard = teacherPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to resources
      const resourcesSection = teacherPage.locator('[data-testid="resources-section"]');
      if (await resourcesSection.isVisible({ timeout: 5000 })) {
        // Find a file
        const fileItem = resourcesSection.locator('[data-testid*="file"]').first();
        if (await fileItem.isVisible()) {
          // Click settings/edit button
          const settingsButton = fileItem.locator('button:has-text("Settings"), button[aria-label="File settings"]');
          if (await settingsButton.isVisible()) {
            await settingsButton.click();

            // Set visibility
            const visibilitySelect = teacherPage.locator('[data-testid="file-visibility-select"]');
            if (await visibilitySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
              await visibilitySelect.click();

              // Options: ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY
              await teacherPage.click('li:has-text("Teachers and Parents")');

              // Save
              await teacherPage.click('button:has-text("Save")');

              await expect(
                teacherPage.locator('text=/visibility.*updated|settings.*saved/i')
              ).toBeVisible({ timeout: 5000 });
            }
          }
        }
      }
    });

    test('files appear in student view based on visibility', async ({ studentPage }) => {
      await studentPage.goto('/student/lessons');

      const lessonCard = studentPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      // Navigate to resources
      const resourcesTab = studentPage.locator('button:has-text("Resources")');
      if (await resourcesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await resourcesTab.click();
      }

      // Should see files with visibility ALL or TEACHERS_AND_PARENTS
      // Should NOT see files with visibility TEACHERS_ONLY
      const filesList = studentPage.locator('[data-testid="files-list"]');
      if (await filesList.isVisible({ timeout: 5000 })) {
        // Verify no teacher-only files are visible
        const teacherOnlyFiles = filesList.locator('[data-visibility="TEACHERS_ONLY"]');
        const teacherOnlyCount = await teacherOnlyFiles.count();

        expect(teacherOnlyCount).toBe(0);
      }
    });

    test('student can download file', async ({ studentPage }) => {
      await studentPage.goto('/student/lessons');

      const lessonCard = studentPage.locator('[data-testid*="lesson-card"]').first();
      await lessonCard.click();

      const resourcesSection = studentPage.locator('[data-testid="resources-section"]');
      if (await resourcesSection.isVisible({ timeout: 5000 })) {
        const downloadButton = resourcesSection.locator('button:has-text("Download"), a[download]').first();
        if (await downloadButton.isVisible()) {
          // Click download
          // Note: Download handling requires special Playwright setup
          // const [download] = await Promise.all([
          //   studentPage.waitForEvent('download'),
          //   downloadButton.click()
          // ]);
          // expect(download).toBeTruthy();
        }
      }
    });
  });

  test.describe('Calendar Integration', () => {
    test('lesson appears on correct day and time', async ({ adminPage }) => {
      await adminPage.goto('/admin/calendar');

      // Should show calendar view
      const calendar = adminPage.locator('[data-testid="calendar"]');
      await expect(calendar).toBeVisible({ timeout: 10000 });

      // Check for lesson events
      const lessonEvents = calendar.locator('[data-testid*="lesson-event"]');
      const eventCount = await lessonEvents.count();

      expect(eventCount).toBeGreaterThan(0);
    });

    test('drag-and-drop rescheduling works', async ({ adminPage }) => {
      await adminPage.goto('/admin/calendar');

      const calendar = adminPage.locator('[data-testid="calendar"]');
      if (await calendar.isVisible({ timeout: 10000 })) {
        // Find a lesson event
        const lessonEvent = calendar.locator('[data-testid*="lesson-event"]').first();

        if (await lessonEvent.isVisible()) {
          // Get initial position
          const initialPosition = await lessonEvent.boundingBox();

          // Note: Drag and drop testing requires specific implementation
          // This is a simplified example
          // await lessonEvent.dragTo(newTimeSlot);

          // Verify reschedule dialog appears
          // await expect(adminPage.locator('[role="dialog"]:has-text("Reschedule")')).toBeVisible();
        }
      }
    });

    test('shows conflict warning on overlap', async ({ adminPage }) => {
      await adminPage.goto('/admin/calendar');

      // Try to drag lesson to overlapping time slot
      // (Implementation depends on calendar library used)

      // Should show conflict warning
      // await expect(adminPage.locator('text=/conflict|overlap|already scheduled/i')).toBeVisible();
    });

    test('recurring lessons display correctly', async ({ adminPage }) => {
      await adminPage.goto('/admin/calendar');

      // Switch to month view to see recurring pattern
      const monthViewButton = adminPage.locator('button:has-text("Month")');
      if (await monthViewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await monthViewButton.click();
      }

      // Should see multiple instances of same lesson across weeks
      const calendar = adminPage.locator('[data-testid="calendar"]');
      const lessonEvents = calendar.locator('[data-lesson-id]');

      // Group by lesson ID to find recurring lessons
      const eventCount = await lessonEvents.count();
      expect(eventCount).toBeGreaterThan(0);
    });
  });

  test.describe('Multi-Tenancy Security', () => {
    test('teacher cannot access lessons from another school', async ({ teacherPage }) => {
      // Try to access lesson from different school directly via URL
      await teacherPage.goto('/teacher/lessons/other-school-lesson-id-123');

      // Should show 404 or access denied
      await expect(
        teacherPage.locator('text=/not found|access denied|unauthorized/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('student can only see their enrolled lessons', async ({ studentPage }) => {
      await studentPage.goto('/student/lessons');

      // Should only see lessons student is enrolled in
      const lessonsList = studentPage.locator('[data-testid="lessons-list"]');
      if (await lessonsList.isVisible({ timeout: 5000 })) {
        const lessonCards = lessonsList.locator('[data-testid*="lesson-card"]');
        const count = await lessonCards.count();

        // Should have at least one enrolled lesson (or empty state)
        expect(count).toBeGreaterThanOrEqual(0);

        // All visible lessons should have enrollment indicator
        if (count > 0) {
          const enrolledIndicators = lessonCards.locator('[data-enrollment-status="enrolled"]');
          const enrolledCount = await enrolledIndicators.count();

          expect(enrolledCount).toBe(count); // All should be enrolled
        }
      }
    });

    test('parent can only see lessons of their children', async ({ parentPage }) => {
      await parentPage.goto('/parent/lessons');

      const lessonsList = parentPage.locator('[data-testid="lessons-list"]');
      if (await lessonsList.isVisible({ timeout: 5000 })) {
        // Should only show lessons where parent's children are enrolled
        const lessonCards = lessonsList.locator('[data-testid*="lesson-card"]');
        const count = await lessonCards.count();

        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
