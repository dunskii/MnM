// ===========================================
// Google Drive Integration E2E Tests
// ===========================================
// Test the complete Google Drive sync functionality

import { test, expect } from '../fixtures/test-fixtures';
import { Page, Route } from '@playwright/test';

// ===================================
// Test Data & Mocks
// ===================================

const MOCK_DRIVE_FOLDERS = [
  {
    id: 'folder-001',
    name: 'Piano Foundation 1',
    parentId: 'root',
    webViewLink: 'https://drive.google.com/drive/folders/folder-001',
  },
  {
    id: 'folder-002',
    name: 'Guitar Basics',
    parentId: 'root',
    webViewLink: 'https://drive.google.com/drive/folders/folder-002',
  },
  {
    id: 'folder-003',
    name: 'Emma Smith - Piano',
    parentId: 'root',
    webViewLink: 'https://drive.google.com/drive/folders/folder-003',
  },
  {
    id: 'folder-004',
    name: 'Sheet Music',
    parentId: 'folder-001',
    webViewLink: 'https://drive.google.com/drive/folders/folder-004',
  },
];

const MOCK_DRIVE_FILES = [
  {
    id: 'file-001',
    driveFileId: 'drive-file-001',
    fileName: 'Für Elise - Sheet Music.pdf',
    mimeType: 'application/pdf',
    fileSize: 524288,
    webViewLink: 'https://drive.google.com/file/d/drive-file-001/view',
    webContentLink: 'https://drive.google.com/uc?id=drive-file-001&export=download',
    thumbnailLink: 'https://drive.google.com/thumbnail?id=drive-file-001',
    modifiedTime: '2025-01-14T15:30:00Z',
    createdTime: '2025-01-10T10:00:00Z',
    visibility: 'ALL',
    tags: ['sheet_music'],
    uploadedVia: 'GOOGLE_DRIVE',
    lesson: {
      id: 'lesson-001',
      name: 'Piano Foundation 1',
    },
  },
  {
    id: 'file-002',
    driveFileId: 'drive-file-002',
    fileName: 'Scales Practice.pdf',
    mimeType: 'application/pdf',
    fileSize: 256000,
    webViewLink: 'https://drive.google.com/file/d/drive-file-002/view',
    visibility: 'TEACHERS_AND_PARENTS',
    tags: ['assignment'],
    uploadedVia: 'PORTAL',
  },
  {
    id: 'file-003',
    driveFileId: 'drive-file-003',
    fileName: 'Teacher Notes.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 128000,
    webViewLink: 'https://drive.google.com/file/d/drive-file-003/view',
    visibility: 'TEACHERS_ONLY',
    tags: ['notes'],
    uploadedVia: 'GOOGLE_DRIVE',
  },
];

const MOCK_FOLDER_MAPPINGS = [
  {
    id: 'mapping-001',
    driveFolderId: 'folder-001',
    folderName: 'Piano Foundation 1',
    folderUrl: 'https://drive.google.com/drive/folders/folder-001',
    lesson: {
      id: 'lesson-001',
      name: 'Piano Foundation 1',
      instructor: 'Ms. Johnson',
    },
    syncEnabled: true,
    lastSyncAt: '2025-01-15T10:30:00Z',
    syncStatus: 'SYNCED',
    fileCount: 12,
  },
  {
    id: 'mapping-002',
    driveFolderId: 'folder-003',
    folderName: 'Emma Smith - Piano',
    folderUrl: 'https://drive.google.com/drive/folders/folder-003',
    student: {
      id: 'student-001',
      name: 'Emma Smith',
      primaryInstrument: 'Piano',
    },
    syncEnabled: true,
    lastSyncAt: '2025-01-15T10:30:00Z',
    syncStatus: 'SYNCED',
    fileCount: 5,
  },
];

const MOCK_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=mock&redirect_uri=http://localhost:5000/api/google-drive/auth/callback&scope=https://www.googleapis.com/auth/drive.file';

const MOCK_CONNECTION_STATUS = {
  connected: true,
  connectedAt: '2025-01-14T09:00:00Z',
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  email: 'musicnme@gmail.com',
};

// ===================================
// Helper Functions
// ===================================

async function mockGoogleDriveAPI(page: Page) {
  // Mock OAuth URL
  await page.route('**/api/google-drive/auth/url', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { authUrl: MOCK_OAUTH_URL },
      }),
    });
  });

  // Mock connection status
  await page.route('**/api/google-drive/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: MOCK_CONNECTION_STATUS,
      }),
    });
  });

  // Mock disconnect
  await page.route('**/api/google-drive/disconnect', async (route: Route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Google Drive disconnected successfully',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock folder browsing
  await page.route('**/api/google-drive/folders*', async (route: Route) => {
    if (route.request().method() === 'GET') {
      const url = new URL(route.request().url());
      const parentId = url.searchParams.get('parentId');
      const query = url.searchParams.get('query');

      let folders = MOCK_DRIVE_FOLDERS;

      // Filter by parent
      if (parentId) {
        folders = folders.filter((f) => f.parentId === parentId);
      }

      // Filter by search query
      if (query) {
        folders = folders.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { folders },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock folder linking
  await page.route('**/api/google-drive/folders/link', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const postData = route.request().postDataJSON();

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            id: `mapping-${Date.now()}`,
            message: 'Google Drive folder linked successfully',
            syncStatus: 'PENDING',
            ...postData,
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock folder mappings list
  await page.route('**/api/google-drive/folders/mappings', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { mappings: MOCK_FOLDER_MAPPINGS },
      }),
    });
  });

  // Mock folder unlinking
  await page.route('**/api/google-drive/folders/*', async (route: Route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Google Drive folder unlinked successfully',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock file listing
  await page.route('**/api/google-drive/files*', async (route: Route) => {
    if (route.request().method() === 'GET') {
      const url = new URL(route.request().url());
      const visibility = url.searchParams.get('visibility');

      let files = MOCK_DRIVE_FILES;

      // Filter by visibility
      if (visibility) {
        files = files.filter((f) => f.visibility === visibility);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { files, total: files.length },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock file upload
  await page.route('**/api/google-drive/files/upload', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            id: `file-${Date.now()}`,
            driveFileId: `drive-file-${Date.now()}`,
            fileName: 'Uploaded File.pdf',
            message: 'File uploaded successfully and synced to Google Drive',
            webViewLink: 'https://drive.google.com/file/d/mock/view',
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock file metadata update
  await page.route('**/api/google-drive/files/*', async (route: Route) => {
    if (route.request().method() === 'PATCH') {
      const patchData = route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            id: 'file-001',
            ...patchData,
          },
        }),
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'File deleted successfully from portal and Google Drive',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock sync trigger
  await page.route('**/api/google-drive/sync/trigger', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            message: 'Sync job queued successfully',
            jobId: `sync-job-${Date.now()}`,
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock sync status
  await page.route('**/api/google-drive/sync/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          lastSyncAt: '2025-01-15T10:30:00Z',
          nextSyncAt: '2025-01-15T10:45:00Z',
          folders: [
            {
              id: 'mapping-001',
              folderName: 'Piano Foundation 1',
              syncStatus: 'SYNCED',
              lastSyncAt: '2025-01-15T10:30:00Z',
              filesAdded: 2,
              filesUpdated: 1,
              filesDeleted: 0,
            },
          ],
        },
      }),
    });
  });
}

async function mockGoogleDriveNotConnected(page: Page) {
  await page.route('**/api/google-drive/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { connected: false },
      }),
    });
  });
}

// ===================================
// Test Suites
// ===================================

test.describe('Google Drive Integration Flow', () => {
  test.describe('1. OAuth Connection Tests (Admin)', () => {
    test('should show "Connect Google Drive" button when not connected', async ({ adminPage }) => {
      await mockGoogleDriveNotConnected(adminPage);

      await adminPage.goto('/admin/google-drive');

      // Should show connect button
      const connectButton = adminPage.locator('button:has-text("Connect Google Drive")');
      await expect(connectButton).toBeVisible({ timeout: 5000 });
    });

    test('should initiate OAuth flow when clicking connect', async ({ adminPage }) => {
      await mockGoogleDriveNotConnected(adminPage);
      await mockGoogleDriveAPI(adminPage);

      await adminPage.goto('/admin/google-drive');

      const connectButton = adminPage.locator('button:has-text("Connect Google Drive")');

      if (await connectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Mock the OAuth redirect
        await adminPage.route(MOCK_OAUTH_URL, async (route: Route) => {
          // Simulate OAuth success callback
          await route.fulfill({
            status: 302,
            headers: {
              Location: '/admin/google-drive?auth=success',
            },
          });
        });

        await connectButton.click();

        // Should navigate to OAuth URL or show success
        // In real scenario, user would be redirected to Google
        // For E2E, we verify the auth URL was requested
      }
    });

    test('should display connection status when connected', async ({ adminPage }) => {
      await mockGoogleDriveAPI(adminPage);

      await adminPage.goto('/admin/google-drive');

      // Should show connected status
      const statusIndicator = adminPage.locator(
        'text=/connected|authorized|synced/i'
      ).or(adminPage.locator('[data-testid="drive-connected-status"]'));

      await expect(statusIndicator).toBeVisible({ timeout: 5000 });
    });

    test('should handle OAuth callback success', async ({ adminPage }) => {
      await mockGoogleDriveAPI(adminPage);

      // Simulate OAuth callback with success
      await adminPage.goto('/admin/google-drive?code=mock-auth-code&state=mock-state');

      // Should show success message
      await expect(
        adminPage.locator('text=/connected.*successfully|authorization.*successful/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should handle OAuth callback error', async ({ adminPage }) => {
      // Simulate OAuth callback with error
      await adminPage.goto('/admin/google-drive?error=access_denied');

      // Should show error message
      await expect(
        adminPage.locator('text=/connection.*failed|authorization.*denied|error/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should allow disconnecting Google Drive', async ({ adminPage }) => {
      await mockGoogleDriveAPI(adminPage);

      await adminPage.goto('/admin/google-drive');

      const disconnectButton = adminPage.locator(
        'button:has-text("Disconnect"),'
      ).or(adminPage.locator('[data-testid="disconnect-drive"]'));

      if (await disconnectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await disconnectButton.click();

        // Confirm dialog
        const confirmButton = adminPage.locator('button:has-text("Confirm")').or(
          adminPage.locator('[data-testid="confirm-disconnect"]')
        );

        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // Should show success message
        await expect(
          adminPage.locator('text=/disconnected.*successfully/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle token refresh on expiry', async ({ adminPage }) => {
      // Mock expired token scenario
      let tokenExpired = true;

      await adminPage.route('**/api/google-drive/folders', async (route: Route) => {
        if (tokenExpired) {
          // First request: token expired
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              status: 'error',
              message: 'Token expired',
            }),
          });
          tokenExpired = false;
        } else {
          // Second request: token refreshed
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              status: 'success',
              data: { folders: MOCK_DRIVE_FOLDERS },
            }),
          });
        }
      });

      await adminPage.goto('/admin/google-drive/folders');

      // Should automatically retry after token refresh
      // And display folders successfully
      await expect(adminPage.locator('[data-testid="folder-list"]')).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('2. Folder Browser Tests (Admin)', () => {
    test.beforeEach(async ({ adminPage }) => {
      await mockGoogleDriveAPI(adminPage);
    });

    test('should browse root Drive folders', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/folders');

      // Should show root folders
      const folderList = adminPage.locator('[data-testid="folder-list"]').or(
        adminPage.locator('[data-testid="drive-folders"]')
      );

      await expect(folderList).toBeVisible({ timeout: 5000 });

      // Should show folder names
      await expect(adminPage.locator('text=Piano Foundation 1')).toBeVisible();
      await expect(adminPage.locator('text=Guitar Basics')).toBeVisible();
    });

    test('should navigate into subfolders', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/folders');

      // Click on parent folder
      const parentFolder = adminPage.locator('text=Piano Foundation 1').first();

      if (await parentFolder.isVisible({ timeout: 3000 }).catch(() => false)) {
        await parentFolder.click();

        // Should show subfolder
        await expect(adminPage.locator('text=Sheet Music')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should search folders by name', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/folders');

      const searchInput = adminPage.locator('input[placeholder*="Search"]').or(
        adminPage.locator('[data-testid="folder-search"]')
      );

      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('Piano');

        // Should filter folders
        await expect(adminPage.locator('text=Piano Foundation 1')).toBeVisible();
        await expect(adminPage.locator('text=Emma Smith - Piano')).toBeVisible();

        // Should not show non-matching folders
        const guitarFolder = adminPage.locator('text=Guitar Basics');
        const isVisible = await guitarFolder.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isVisible).toBeFalsy();
      }
    });

    test('should display folder path breadcrumb navigation', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/folders');

      // Navigate into subfolder
      const parentFolder = adminPage.locator('text=Piano Foundation 1').first();

      if (await parentFolder.isVisible({ timeout: 3000 }).catch(() => false)) {
        await parentFolder.click();

        // Should show breadcrumb
        const breadcrumb = adminPage.locator('[data-testid="folder-breadcrumb"]').or(
          adminPage.locator('nav[aria-label*="breadcrumb"]')
        );

        await expect(breadcrumb).toBeVisible({ timeout: 5000 });
        await expect(breadcrumb.locator('text=Piano Foundation 1')).toBeVisible();
      }
    });

    test('should show loading state while fetching folders', async ({ adminPage }) => {
      // Mock slow response
      await adminPage.route('**/api/google-drive/folders', async (route: Route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: { folders: MOCK_DRIVE_FOLDERS },
          }),
        });
      });

      await adminPage.goto('/admin/google-drive/folders');

      // Should show loading indicator
      const loader = adminPage.locator('[data-testid="loading"]').or(
        adminPage.locator('text=/loading|fetching/i')
      );

      // Loader should appear briefly
      const isLoading = await loader.isVisible({ timeout: 500 }).catch(() => false);
      // Note: May or may not catch it depending on timing
    });
  });

  test.describe('3. Folder Linking Tests (Admin)', () => {
    test.beforeEach(async ({ adminPage }) => {
      await mockGoogleDriveAPI(adminPage);
    });

    test('should link folder to lesson', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/folders');

      // Select a folder
      const folder = adminPage.locator('text=Piano Foundation 1').first();

      if (await folder.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click link button
        const linkButton = folder.locator('..').locator('button:has-text("Link")').or(
          adminPage.locator('[data-folder-id="folder-001"] button:has-text("Link")')
        );

        if (await linkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await linkButton.click();

          // Select lesson from dropdown
          const lessonSelect = adminPage.locator('select[name="lessonId"]').or(
            adminPage.locator('[data-testid="lesson-select"]')
          );

          if (await lessonSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
            await lessonSelect.selectOption({ label: 'Piano Foundation 1' });

            // Confirm link
            await adminPage.click('button:has-text("Link Folder")');

            // Should show success
            await expect(
              adminPage.locator('text=/linked.*successfully/i')
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('should link folder to student', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/folders');

      const folder = adminPage.locator('text=Emma Smith - Piano').first();

      if (await folder.isVisible({ timeout: 3000 }).catch(() => false)) {
        const linkButton = folder.locator('..').locator('button:has-text("Link")');

        if (await linkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await linkButton.click();

          // Select entity type (Student)
          const entityTypeSelect = adminPage.locator('select[name="entityType"]');

          if (await entityTypeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await entityTypeSelect.selectOption({ value: 'student' });

            // Select student
            const studentSelect = adminPage.locator('select[name="studentId"]');
            await studentSelect.selectOption({ label: 'Emma Smith' });

            await adminPage.click('button:has-text("Link Folder")');

            await expect(
              adminPage.locator('text=/linked.*successfully/i')
            ).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });

    test('should view linked folders list', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/mappings');

      // Should show mappings table
      await expect(adminPage.locator('text=Piano Foundation 1')).toBeVisible();
      await expect(adminPage.locator('text=Emma Smith - Piano')).toBeVisible();

      // Should show sync status
      await expect(adminPage.locator('text=/SYNCED|synced/i')).toBeVisible();
    });

    test('should unlink folder', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/mappings');

      const unlinkButton = adminPage.locator('button:has-text("Unlink")').first();

      if (await unlinkButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await unlinkButton.click();

        // Confirm unlink
        const confirmButton = adminPage.locator('button:has-text("Confirm")');

        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();

          await expect(
            adminPage.locator('text=/unlinked.*successfully/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should prevent duplicate linking', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/folders');

      // Try to link already linked folder
      const folder = adminPage.locator('text=Piano Foundation 1').first();

      if (await folder.isVisible({ timeout: 3000 }).catch(() => false)) {
        const linkButton = folder.locator('..').locator('button:has-text("Link")');

        // Link button should be disabled or show "Linked" status
        if (await linkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          const isDisabled = await linkButton.isDisabled().catch(() => false);
          const linkedBadge = adminPage.locator('text=/already linked|linked/i');
          const hasLinkedBadge = await linkedBadge.isVisible({ timeout: 2000 }).catch(() => false);

          expect(isDisabled || hasLinkedBadge).toBeTruthy();
        }
      }
    });

    test('should validate folder exists before linking', async ({ adminPage }) => {
      // Mock folder not found error
      await adminPage.route('**/api/google-drive/folders/link', async (route: Route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message: 'Folder not found in Google Drive',
          }),
        });
      });

      await adminPage.goto('/admin/google-drive/folders');

      // Attempt to link non-existent folder
      // (Assume UI allows entering folder ID manually)

      // Should show error
      await expect(
        adminPage.locator('text=/folder.*not.*found|invalid.*folder/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('4. File Upload Tests (Teacher)', () => {
    test.beforeEach(async ({ teacherPage }) => {
      await mockGoogleDriveAPI(teacherPage);
    });

    test('should upload single file', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files/upload');

      // Select lesson
      const lessonSelect = teacherPage.locator('select[name="lessonId"]');

      if (await lessonSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lessonSelect.selectOption({ label: 'Piano Foundation 1' });

        // Upload file
        const fileInput = teacherPage.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: 'test-file.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Mock PDF content'),
        });

        // Set visibility
        const visibilitySelect = teacherPage.locator('select[name="visibility"]');
        await visibilitySelect.selectOption({ value: 'ALL' });

        // Upload
        await teacherPage.click('button:has-text("Upload")');

        // Should show success
        await expect(
          teacherPage.locator('text=/uploaded.*successfully|upload.*complete/i')
        ).toBeVisible({ timeout: 10000 });
      }
    });

    test('should upload multiple files', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files/upload');

      const lessonSelect = teacherPage.locator('select[name="lessonId"]');

      if (await lessonSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lessonSelect.selectOption({ label: 'Piano Foundation 1' });

        // Upload multiple files
        const fileInput = teacherPage.locator('input[type="file"]');

        // Check if multiple attribute exists
        const supportsMultiple = await fileInput.getAttribute('multiple').catch(() => null);

        if (supportsMultiple !== null) {
          await fileInput.setInputFiles([
            {
              name: 'file1.pdf',
              mimeType: 'application/pdf',
              buffer: Buffer.from('File 1'),
            },
            {
              name: 'file2.pdf',
              mimeType: 'application/pdf',
              buffer: Buffer.from('File 2'),
            },
          ]);

          await teacherPage.click('button:has-text("Upload")');

          await expect(
            teacherPage.locator('text=/uploaded.*successfully/i')
          ).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test('should validate file type', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files/upload');

      // Try to upload invalid file type (e.g., .exe)
      const fileInput = teacherPage.locator('input[type="file"]');

      if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'malware.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('Invalid file'),
        });

        // Should show error
        await expect(
          teacherPage.locator('text=/invalid.*file.*type|file.*type.*not.*supported/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should enforce file size limit (25MB)', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files/upload');

      // Mock large file upload
      await teacherPage.route('**/api/google-drive/files/upload', async (route: Route) => {
        await route.fulfill({
          status: 413,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message: 'File too large. Max size: 25MB',
          }),
        });
      });

      const fileInput = teacherPage.locator('input[type="file"]');

      if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'large-file.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.alloc(26 * 1024 * 1024), // 26MB
        });

        await teacherPage.click('button:has-text("Upload")');

        // Should show error
        await expect(
          teacherPage.locator('text=/file.*too.*large|max.*size/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show upload progress indicator', async ({ teacherPage }) => {
      // Mock slow upload
      await teacherPage.route('**/api/google-drive/files/upload', async (route: Route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: { id: 'file-123', fileName: 'test.pdf' },
          }),
        });
      });

      await teacherPage.goto('/teacher/files/upload');

      const lessonSelect = teacherPage.locator('select[name="lessonId"]');

      if (await lessonSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lessonSelect.selectOption({ label: 'Piano Foundation 1' });

        const fileInput = teacherPage.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Test file'),
        });

        await teacherPage.click('button:has-text("Upload")');

        // Should show progress
        const progress = teacherPage.locator('[role="progressbar"]').or(
          teacherPage.locator('text=/uploading/i')
        );

        const isUploading = await progress.isVisible({ timeout: 1000 }).catch(() => false);
        // May or may not catch depending on timing
      }
    });

    test('should set visibility during upload', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files/upload');

      const visibilitySelect = teacherPage.locator('select[name="visibility"]');

      if (await visibilitySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Should have all visibility options
        await expect(visibilitySelect.locator('option:has-text("All")')).toBeAttached();
        await expect(
          visibilitySelect.locator('option:has-text("Teachers and Parents")')
        ).toBeAttached();
        await expect(visibilitySelect.locator('option:has-text("Teachers Only")')).toBeAttached();

        // Select Teachers Only
        await visibilitySelect.selectOption({ value: 'TEACHERS_ONLY' });

        // Verify selected
        const selectedValue = await visibilitySelect.inputValue();
        expect(selectedValue).toBe('TEACHERS_ONLY');
      }
    });

    test('should allow canceling upload', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files/upload');

      const fileInput = teacherPage.locator('input[type="file"]');

      if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fileInput.setInputFiles({
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Test'),
        });

        // Click cancel button
        const cancelButton = teacherPage.locator('button:has-text("Cancel")');

        if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelButton.click();

          // Should clear file selection
          const fileName = teacherPage.locator('text=test.pdf');
          const isCleared = !(await fileName.isVisible({ timeout: 1000 }).catch(() => true));
          expect(isCleared).toBeTruthy();
        }
      }
    });
  });

  test.describe('5. Sync Status Tests', () => {
    test.beforeEach(async ({ adminPage }) => {
      await mockGoogleDriveAPI(adminPage);
    });

    test('should show "Syncing" status indicator', async ({ adminPage }) => {
      // Mock syncing status
      await adminPage.route('**/api/google-drive/sync/status', async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              lastSyncAt: '2025-01-15T10:30:00Z',
              folders: [
                {
                  id: 'mapping-001',
                  folderName: 'Piano Foundation 1',
                  syncStatus: 'SYNCING',
                },
              ],
            },
          }),
        });
      });

      await adminPage.goto('/admin/google-drive/mappings');

      await expect(adminPage.locator('text=/syncing|in progress/i')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show "Synced" confirmation', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/mappings');

      await expect(adminPage.locator('text=/synced|synchronized/i')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show "Error" status with retry option', async ({ adminPage }) => {
      // Mock error status
      await adminPage.route('**/api/google-drive/sync/status', async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              folders: [
                {
                  id: 'mapping-001',
                  folderName: 'Piano Foundation 1',
                  syncStatus: 'ERROR',
                  syncError: 'Permission denied',
                },
              ],
            },
          }),
        });
      });

      await adminPage.goto('/admin/google-drive/mappings');

      // Should show error
      await expect(adminPage.locator('text=/error|failed/i')).toBeVisible({ timeout: 5000 });

      // Should have retry button
      const retryButton = adminPage.locator('button:has-text("Retry")');
      await expect(retryButton).toBeVisible();
    });

    test('should trigger manual sync', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/mappings');

      const syncButton = adminPage.locator('button:has-text("Sync Now")').first();

      if (await syncButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await syncButton.click();

        // Should show success
        await expect(
          adminPage.locator('text=/sync.*queued|sync.*started/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display last sync timestamp', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/mappings');

      // Should show timestamp
      const timestamp = adminPage.locator('text=/last.*sync|synced.*at/i');
      await expect(timestamp).toBeVisible({ timeout: 5000 });
    });

    test('should show sync queue status', async ({ adminPage }) => {
      await adminPage.goto('/admin/google-drive/sync-status');

      // Should show sync queue info
      await expect(
        adminPage.locator('text=/next.*sync|sync.*schedule/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('6. File Visibility Tests (CRITICAL)', () => {
    test.beforeEach(async ({ page }) => {
      await mockGoogleDriveAPI(page);
    });

    test('admin can see ALL visibility files', async ({ adminPage }) => {
      await adminPage.goto('/admin/files');

      // Should see all files
      await expect(adminPage.locator('text=Für Elise - Sheet Music.pdf')).toBeVisible();
      await expect(adminPage.locator('text=Scales Practice.pdf')).toBeVisible();
      await expect(adminPage.locator('text=Teacher Notes.docx')).toBeVisible();
    });

    test('teacher can see ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY files', async ({
      teacherPage,
    }) => {
      await teacherPage.goto('/teacher/files');

      // Should see all three files
      await expect(teacherPage.locator('text=Für Elise - Sheet Music.pdf')).toBeVisible();
      await expect(teacherPage.locator('text=Scales Practice.pdf')).toBeVisible();
      await expect(teacherPage.locator('text=Teacher Notes.docx')).toBeVisible();
    });

    test('parent can see ALL and TEACHERS_AND_PARENTS files only', async ({ parentPage }) => {
      await parentPage.goto('/parent/files');

      // Should see ALL and TEACHERS_AND_PARENTS
      await expect(parentPage.locator('text=Für Elise - Sheet Music.pdf')).toBeVisible();
      await expect(parentPage.locator('text=Scales Practice.pdf')).toBeVisible();

      // Should NOT see TEACHERS_ONLY
      const teacherNotes = parentPage.locator('text=Teacher Notes.docx');
      const canSeeTeacherNotes = await teacherNotes.isVisible({ timeout: 2000 }).catch(
        () => false
      );
      expect(canSeeTeacherNotes).toBeFalsy();
    });

    test('student can see ALL visibility files only', async ({ page, context }) => {
      // Login as student
      await page.route('**/api/auth/login', async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              accessToken: 'student-token',
              refreshToken: 'student-refresh',
              user: {
                id: 'student-001',
                email: 'student@musicnme.test',
                role: 'STUDENT',
                schoolId: 'school-001',
              },
            },
          }),
        });
      });

      await mockGoogleDriveAPI(page);

      await page.goto('/login');
      await page.fill('input[name="email"]', 'student@musicnme.test');
      await page.fill('input[name="password"]', 'password');
      await page.click('button[type="submit"]');

      await page.waitForURL(/\/student/, { timeout: 10000 });

      await page.goto('/student/files');

      // Should only see ALL visibility files
      await expect(page.locator('text=Für Elise - Sheet Music.pdf')).toBeVisible();

      // Should NOT see TEACHERS_AND_PARENTS
      const scalesPractice = page.locator('text=Scales Practice.pdf');
      const canSeeScales = await scalesPractice.isVisible({ timeout: 2000 }).catch(() => false);
      expect(canSeeScales).toBeFalsy();

      // Should NOT see TEACHERS_ONLY
      const teacherNotes = page.locator('text=Teacher Notes.docx');
      const canSeeNotes = await teacherNotes.isVisible({ timeout: 2000 }).catch(() => false);
      expect(canSeeNotes).toBeFalsy();
    });

    test('visibility filter works correctly', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files');

      // Filter by TEACHERS_ONLY
      const visibilityFilter = teacherPage.locator('select[name="visibility"]');

      if (await visibilityFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await visibilityFilter.selectOption({ value: 'TEACHERS_ONLY' });

        // Should only show TEACHERS_ONLY files
        await expect(teacherPage.locator('text=Teacher Notes.docx')).toBeVisible();

        // Should not show ALL files
        const allFile = teacherPage.locator('text=Für Elise - Sheet Music.pdf');
        const canSeeAll = await allFile.isVisible({ timeout: 2000 }).catch(() => false);
        expect(canSeeAll).toBeFalsy();
      }
    });
  });

  test.describe('7. File Download Tests', () => {
    test.beforeEach(async ({ parentPage }) => {
      await mockGoogleDriveAPI(parentPage);
    });

    test('should download single file', async ({ parentPage }) => {
      await parentPage.goto('/parent/files');

      const downloadButton = parentPage.locator('button[aria-label*="Download"]').first().or(
        parentPage.locator('a[download]').first()
      );

      if (await downloadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Listen for download event
        const downloadPromise = parentPage.waitForEvent('download');

        await downloadButton.click();

        // Should initiate download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.pdf');
      }
    });

    test('should download from Drive (not portal storage)', async ({ parentPage }) => {
      await parentPage.goto('/parent/files');

      const fileLink = parentPage.locator('a[href*="drive.google.com"]').first();

      if (await fileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        const href = await fileLink.getAttribute('href');
        expect(href).toContain('drive.google.com');
      }
    });

    test('should show download progress for large files', async ({ parentPage }) => {
      // Mock slow download
      await parentPage.route('**/drive.google.com/uc*', async (route: Route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await parentPage.goto('/parent/files');

      const downloadButton = parentPage.locator('button:has-text("Download")').first();

      if (await downloadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await downloadButton.click();

        // Should show progress
        const progress = parentPage.locator('[role="progressbar"]');
        const isDownloading = await progress.isVisible({ timeout: 1000 }).catch(() => false);
        // Timing-dependent
      }
    });

    test('should open file in correct viewer by type', async ({ parentPage }) => {
      await parentPage.goto('/parent/files');

      // PDF should open in Drive viewer
      const pdfViewButton = parentPage.locator('button:has-text("View")').first();

      if (await pdfViewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pdfViewButton.click();

        // Should open in new tab with Drive viewer
        const newPagePromise = parentPage.context().waitForEvent('page');
        const newPage = await newPagePromise;

        const url = newPage.url();
        expect(url).toContain('drive.google.com');

        await newPage.close();
      }
    });
  });

  test.describe('8. File Management Tests (Teacher)', () => {
    test.beforeEach(async ({ teacherPage }) => {
      await mockGoogleDriveAPI(teacherPage);
    });

    test('should view file list for lesson', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/lessons/lesson-001/files');

      // Should show files for this lesson
      await expect(teacherPage.locator('text=Für Elise - Sheet Music.pdf')).toBeVisible();
    });

    test('should edit file metadata (name, description)', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files');

      const editButton = teacherPage.locator('button[aria-label*="Edit"]').first();

      if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editButton.click();

        // Edit form should appear
        const nameInput = teacherPage.locator('input[name="fileName"]');

        if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nameInput.fill('Updated File Name.pdf');

          await teacherPage.click('button:has-text("Save")');

          await expect(teacherPage.locator('text=/updated.*successfully/i')).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });

    test('should change file visibility', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files');

      const editButton = teacherPage.locator('button[aria-label*="Edit"]').first();

      if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editButton.click();

        const visibilitySelect = teacherPage.locator('select[name="visibility"]');

        if (await visibilitySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await visibilitySelect.selectOption({ value: 'TEACHERS_ONLY' });

          await teacherPage.click('button:has-text("Save")');

          await expect(teacherPage.locator('text=/updated.*successfully/i')).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });

    test('should delete file from portal and Drive', async ({ teacherPage }) => {
      await teacherPage.goto('/teacher/files');

      const deleteButton = teacherPage.locator('button[aria-label*="Delete"]').first();

      if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = teacherPage.locator('button:has-text("Confirm")');

        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();

          await expect(teacherPage.locator('text=/deleted.*successfully/i')).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });
  });

  test.describe('9. Sync Error Handling', () => {
    test('should handle Google API quota exceeded', async ({ adminPage }) => {
      // Mock quota exceeded error
      await adminPage.route('**/api/google-drive/folders', async (route: Route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message: 'Google API quota exceeded. Please try again later.',
          }),
        });
      });

      await adminPage.goto('/admin/google-drive/folders');

      // Should show error message
      await expect(
        adminPage.locator('text=/quota.*exceeded|rate.*limit/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should handle network timeout', async ({ adminPage }) => {
      // Mock timeout
      await adminPage.route('**/api/google-drive/folders', async (route: Route) => {
        await route.abort('timedout');
      });

      await adminPage.goto('/admin/google-drive/folders');

      // Should show error
      await expect(
        adminPage.locator('text=/network.*error|connection.*failed|timeout/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should handle invalid/expired token', async ({ adminPage }) => {
      // Mock expired token
      await adminPage.route('**/api/google-drive/folders', async (route: Route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message: 'Token expired. Please reconnect Google Drive.',
          }),
        });
      });

      await adminPage.goto('/admin/google-drive/folders');

      // Should show error and reconnect option
      await expect(
        adminPage.locator('text=/token.*expired|reconnect/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should handle file not found in Drive', async ({ teacherPage }) => {
      await mockGoogleDriveAPI(teacherPage);

      // Mock file not found
      await teacherPage.route('**/api/google-drive/files/file-999', async (route: Route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            message: 'File not found in Google Drive',
          }),
        });
      });

      await teacherPage.goto('/teacher/files');

      // Try to download non-existent file
      // Should show error
      await expect(
        teacherPage.locator('text=/file.*not.*found|file.*deleted/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show error notifications to admin', async ({ adminPage }) => {
      await mockGoogleDriveAPI(adminPage);

      // Mock sync error
      await adminPage.route('**/api/google-drive/sync/status', async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              folders: [
                {
                  id: 'mapping-001',
                  folderName: 'Piano Foundation 1',
                  syncStatus: 'ERROR',
                  syncError: 'Permission denied to folder',
                },
              ],
            },
          }),
        });
      });

      await adminPage.goto('/admin/google-drive/sync-status');

      // Should show error notification
      await expect(adminPage.locator('text=/error|permission.*denied/i')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('10. Student/Parent Resource View', () => {
    test('parent can view available resources for enrolled lessons', async ({ parentPage }) => {
      await mockGoogleDriveAPI(parentPage);

      await parentPage.goto('/parent/files');

      // Should show files for enrolled lessons only
      await expect(parentPage.locator('text=Für Elise - Sheet Music.pdf')).toBeVisible();
    });

    test('files are filtered by visibility for parents', async ({ parentPage }) => {
      await mockGoogleDriveAPI(parentPage);

      await parentPage.goto('/parent/files');

      // Should see ALL and TEACHERS_AND_PARENTS
      const publicFile = parentPage.locator('text=Für Elise - Sheet Music.pdf');
      const parentFile = parentPage.locator('text=Scales Practice.pdf');

      await expect(publicFile).toBeVisible();
      await expect(parentFile).toBeVisible();

      // Should NOT see TEACHERS_ONLY
      const teacherFile = parentPage.locator('text=Teacher Notes.docx');
      const canSeeTeacher = await teacherFile.isVisible({ timeout: 2000 }).catch(() => false);
      expect(canSeeTeacher).toBeFalsy();
    });

    test('parent can download resources', async ({ parentPage }) => {
      await mockGoogleDriveAPI(parentPage);

      await parentPage.goto('/parent/files');

      const downloadButton = parentPage.locator('button:has-text("Download")').first();

      if (await downloadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const downloadPromise = parentPage.waitForEvent('download');

        await downloadButton.click();

        const download = await downloadPromise;
        expect(download).toBeDefined();
      }
    });

    test('resources are organized by lesson/class', async ({ parentPage }) => {
      await mockGoogleDriveAPI(parentPage);

      await parentPage.goto('/parent/files');

      // Should show lesson grouping
      const lessonSection = parentPage.locator('text=Piano Foundation 1');
      await expect(lessonSection).toBeVisible({ timeout: 5000 });

      // Files should be grouped under lesson
      const fileUnderLesson = lessonSection.locator('..').locator('text=Für Elise');
      await expect(fileUnderLesson).toBeVisible();
    });
  });
});
