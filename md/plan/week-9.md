# Week 9 Implementation Plan: Google Drive Integration - Frontend

## Overview

**Week 9** focuses on building the frontend UI for the Google Drive integration on top of the Week 8 backend (Grade A+ 97/100). This includes admin folder management, teacher file operations, and student/parent file access.

**Timeline:** 5 days
**Current Progress:** Week 8 complete (backend APIs ready)
**Backend Status:** 14 API endpoints available, fully tested

---

## Phase 1: API Client Layer (Day 1 - Morning)

### 1.1 Create Google Drive API Client

**File:** `apps/frontend/src/api/googleDrive.api.ts`

**Pattern Reference:** Follow `apps/frontend/src/api/resources.api.ts` structure

**Types to Define:**
```typescript
// Sync status enum
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';

// File visibility (reuse from resources.api.ts)
export type { FileVisibility } from './resources.api';

// OAuth status
export interface GoogleDriveAuthStatus {
  isConnected: boolean;
  email?: string;
}

// Drive folder (from browsing)
export interface DriveFolder {
  id: string;
  name: string;
  parentId: string | null;
  webViewLink: string;
}

// Folder mapping (linked to lesson/student)
export interface GoogleDriveFolderMapping {
  id: string;
  driveFolderId: string;
  folderName: string;
  folderUrl: string;
  syncEnabled: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  syncError: string | null;
  lesson?: { id: string; name: string; teacher?: { user: { firstName: string; lastName: string } } } | null;
  student?: { id: string; firstName: string; lastName: string; ageGroup: string } | null;
  _count?: { files: number };
}

// Google Drive file
export interface GoogleDriveFile {
  id: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  webViewLink: string;
  thumbnailLink: string | null;
  visibility: FileVisibility;
  tags: string[];
  uploadedVia: 'GOOGLE_DRIVE' | 'PORTAL';
  syncStatus: SyncStatus;
  deletedInDrive: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: { id: string; firstName: string; lastName: string } | null;
  folder?: { id: string; folderName: string; lesson?: { id: string; name: string } | null };
}

// Sync status response
export interface SyncStatusResponse {
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  folders: Array<{
    id: string;
    folderName: string;
    syncStatus: SyncStatus;
    lastSyncAt: string | null;
    filesAdded: number;
    filesUpdated: number;
    filesDeleted: number;
  }>;
}

// Storage stats
export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byMimeType: Record<string, number>;
  byVisibility: Record<string, number>;
}
```

**API Functions:**
```typescript
export const googleDriveApi = {
  // OAuth
  getAuthUrl: () => Promise<{ authUrl: string }>,
  getAuthStatus: () => Promise<GoogleDriveAuthStatus>,
  revokeAccess: () => Promise<void>,

  // Folder Browsing
  browseFolders: (parentId?: string, query?: string) => Promise<DriveFolder[]>,

  // Folder Mappings
  getMappings: () => Promise<GoogleDriveFolderMapping[]>,
  linkFolder: (input: LinkFolderInput) => Promise<GoogleDriveFolderMapping>,
  updateFolder: (id: string, syncEnabled: boolean) => Promise<GoogleDriveFolderMapping>,
  unlinkFolder: (id: string) => Promise<void>,

  // Files
  getFiles: (filters?: FilesQuery) => Promise<GoogleDriveFile[]>,
  getFileById: (id: string) => Promise<GoogleDriveFile>,
  uploadFile: (input: UploadFileInput) => Promise<GoogleDriveFile>,
  updateFile: (id: string, data: UpdateFileInput) => Promise<GoogleDriveFile>,
  deleteFile: (id: string) => Promise<void>,

  // Sync
  getSyncStatus: () => Promise<SyncStatusResponse>,
  triggerSync: (folderId?: string) => Promise<{ jobId: string }>,
  getJobStatus: (jobId: string) => Promise<JobStatus>,
  resetFolderSync: (folderId: string) => Promise<GoogleDriveFolderMapping>,

  // Stats
  getStats: () => Promise<StorageStats>,
};
```

**Success Criteria:**
- All 14 backend endpoints have corresponding API functions
- TypeScript types match backend Zod validators
- Error handling follows existing `apiClient` patterns
- JSDoc comments on all public functions

---

### 1.2 Create React Query Hooks

**File:** `apps/frontend/src/hooks/useGoogleDrive.ts`

**Pattern Reference:** Follow `apps/frontend/src/hooks/useResources.ts` structure

**Query Keys:**
```typescript
export const googleDriveKeys = {
  all: ['googleDrive'] as const,
  authStatus: () => [...googleDriveKeys.all, 'authStatus'] as const,
  folders: () => [...googleDriveKeys.all, 'folders'] as const,
  browseFolders: (parentId?: string, query?: string) =>
    [...googleDriveKeys.folders(), 'browse', parentId, query] as const,
  mappings: () => [...googleDriveKeys.all, 'mappings'] as const,
  files: (filters?: FilesQuery) => [...googleDriveKeys.all, 'files', filters] as const,
  fileDetail: (id: string) => [...googleDriveKeys.all, 'files', 'detail', id] as const,
  syncStatus: () => [...googleDriveKeys.all, 'syncStatus'] as const,
  stats: () => [...googleDriveKeys.all, 'stats'] as const,
};
```

**Hooks to Create:**
```typescript
// Queries
export function useGoogleDriveAuthStatus();
export function useBrowseFolders(parentId?: string, query?: string);
export function useFolderMappings();
export function useGoogleDriveFiles(filters?: FilesQuery);
export function useGoogleDriveFile(id: string);
export function useSyncStatus();
export function useStorageStats();

// Mutations
export function useLinkFolder();
export function useUnlinkFolder();
export function useUpdateFolderSettings();
export function useUploadDriveFile();
export function useUpdateDriveFile();
export function useDeleteDriveFile();
export function useTriggerSync();
export function useResetFolderSync();
export function useRevokeGoogleDriveAccess();
```

**Success Criteria:**
- All hooks use `@tanstack/react-query`
- Proper cache invalidation on mutations
- Snackbar notifications using `notistack`
- Loading and error states handled
- 5-minute stale time for folder/file listings (match backend cache)

---

## Phase 2: Admin Components - OAuth & Folder Browser (Day 1 Afternoon - Day 2)

### 2.1 Google Drive Connection Component

**File:** `apps/frontend/src/components/googleDrive/GoogleDriveConnection.tsx`

**Purpose:** Display connection status, connect/disconnect buttons

**UI Elements:**
- Connection status indicator (connected/disconnected)
- "Connect Google Drive" button (if not connected)
- "Disconnect" button with confirmation dialog (if connected)
- Last sync timestamp display
- Error messages if OAuth failed

**Dependencies:**
- `useGoogleDriveAuthStatus()` hook
- `useRevokeGoogleDriveAccess()` mutation
- `ConfirmDialog` component from existing common components

---

### 2.2 Folder Browser Component

**File:** `apps/frontend/src/components/googleDrive/FolderBrowser.tsx`

**Purpose:** Hierarchical folder browser with search

**UI Elements:**
- Search TextField (debounced, 300ms)
- Breadcrumb navigation (shows current path)
- List of folders with:
  - Folder icon
  - Folder name
  - "Open" button (drill into folder)
  - "Select" button (choose this folder for linking)
- Back button to parent folder
- Loading skeleton during fetch
- Empty state when no folders

**Props:**
```typescript
interface FolderBrowserProps {
  onSelectFolder: (folder: DriveFolder) => void;
  selectedFolderId?: string;
}
```

**State:**
- `currentParentId: string | null`
- `searchQuery: string`
- `breadcrumbs: Array<{ id: string; name: string }>`

**Pattern:** Use MUI `List`, `ListItem`, `ListItemButton`, `TextField`, `Breadcrumbs`

---

### 2.3 Link Folder Dialog

**File:** `apps/frontend/src/components/googleDrive/LinkFolderDialog.tsx`

**Purpose:** Modal to link a Google Drive folder to a lesson or student

**UI Elements:**
- Dialog with title "Link Google Drive Folder"
- Radio group: Link to "Lesson" or "Student"
- If Lesson: Autocomplete dropdown with lessons (use `useLessons()`)
- If Student: Autocomplete dropdown with students (use `useStudents()`)
- FolderBrowser component embedded
- Selected folder display
- Cancel and "Link Folder" buttons
- Loading state during mutation

**Validation:**
- Must select either lesson OR student (not both)
- Must select a folder

---

### 2.4 Folder Mapping Management Page

**File:** `apps/frontend/src/pages/admin/GoogleDrivePage.tsx`

**Purpose:** Admin page to manage all Drive folder mappings

**UI Sections:**

1. **Connection Panel** (top)
   - `GoogleDriveConnection` component
   - If not connected, show prominent "Connect" CTA

2. **Sync Status Panel**
   - Last sync time
   - Next scheduled sync time
   - "Sync Now" button (`useTriggerSync()`)
   - Sync progress indicator if syncing

3. **Folder Mappings Table**
   - Use `DataTable` component
   - Columns:
     - Folder Name (with Drive link icon)
     - Linked To (Lesson name or Student name)
     - Type (Lesson/Student chip)
     - Files Count
     - Sync Status (color-coded chip)
     - Last Sync
     - Actions (Edit, Unlink, Reset Sync if error)
   - "Link Folder" button opens `LinkFolderDialog`

4. **Storage Stats Card**
   - Total files
   - Total size (formatted)
   - Breakdown by file type

**Route:** `/admin/google-drive`

**Navigation:** Add to `AdminLayout.tsx` sidebar under new "Integrations" section

---

## Phase 3: File Management Interface (Days 3-4)

### 3.1 File List Component

**File:** `apps/frontend/src/components/googleDrive/FileList.tsx`

**Purpose:** Display list of synced files with filtering and actions

**UI Elements:**
- Filter bar:
  - Lesson dropdown
  - Student dropdown
  - Visibility filter
  - Tags filter (multi-select chips)
  - Search by file name
- View toggle: List view / Grid view
- File items showing:
  - Thumbnail (if available)
  - File name
  - File size (formatted)
  - Visibility badge
  - Sync status indicator
  - Upload source (Drive/Portal icon)
  - Actions: View, Edit, Delete (teacher/admin only)
- Empty state for no files
- Loading skeleton

**Props:**
```typescript
interface FileListProps {
  lessonId?: string;
  studentId?: string;
  showFilters?: boolean;
  editable?: boolean; // Show edit/delete actions
}
```

---

### 3.2 File Card Component

**File:** `apps/frontend/src/components/googleDrive/FileCard.tsx`

**Purpose:** Individual file display in grid view

**UI Elements:**
- Card with thumbnail or file type icon
- File name (truncated)
- File metadata (size, date)
- Visibility chip
- Sync status indicator
- Actions menu (three-dot)

---

### 3.3 File Upload Component with Drive Integration

**File:** `apps/frontend/src/components/googleDrive/DriveFileUploader.tsx`

**Purpose:** Enhanced file uploader that syncs to Google Drive

**UI Elements:**
- Similar to existing `ResourceUploader.tsx`
- Drag-and-drop zone
- Selected file preview
- Visibility dropdown (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)
- Tags input (max 10)
- Target selection (lesson or student - may be pre-selected)
- Upload progress with Drive sync indicator
- Success message with Drive link

**Differences from ResourceUploader:**
- Uses `useUploadDriveFile()` mutation
- Shows "Syncing to Google Drive..." status
- Displays Google Drive link after upload

---

### 3.4 File Metadata Editor

**File:** `apps/frontend/src/components/googleDrive/FileMetadataEditor.tsx`

**Purpose:** Edit file visibility and tags

**UI Elements:**
- Dialog with:
  - File name (read-only)
  - File preview/thumbnail
  - Visibility dropdown
  - Tags editor (add/remove chips)
  - Upload info (by whom, when, from where)
- Save and Cancel buttons

---

### 3.5 Sync Status Indicator Component

**File:** `apps/frontend/src/components/googleDrive/SyncStatusBadge.tsx`

**Purpose:** Visual indicator for sync status

**UI:**
- PENDING: Gray clock icon
- SYNCING: Blue spinning icon
- SYNCED: Green check icon with timestamp tooltip
- ERROR: Red error icon with error message tooltip

---

### 3.6 File Manager Page

**File:** `apps/frontend/src/pages/admin/GoogleDriveFilesPage.tsx`

**Purpose:** Admin page to view/manage all synced files

**UI:**
- PageHeader with title and upload button
- FileList component with all filters enabled
- Bulk actions (future enhancement)

**Route:** `/admin/google-drive/files`

---

## Phase 4: Teacher File Access (Day 4)

### 4.1 Enhance Lesson Detail Page

**File:** Modify `apps/frontend/src/pages/admin/LessonDetailPage.tsx`

**Changes:**
- Add "Resources" tab
- Show FileList for lesson's linked folder
- Show DriveFileUploader for adding files
- Display folder sync status

---

### 4.2 Teacher Resources Component

**File:** `apps/frontend/src/components/googleDrive/TeacherResourcesPanel.tsx`

**Purpose:** Panel for teachers to manage lesson resources

**UI:**
- Embedded in lesson detail
- Shows files from linked Drive folder
- Upload button (if folder linked)
- "No folder linked" message with link to admin page

---

## Phase 5: Student/Parent File Access (Day 5)

### 5.1 Resources Library Page

**File:** `apps/frontend/src/pages/parent/ResourcesPage.tsx`

**Purpose:** Parent/student view of shared resources

**UI:**
- Child selector tabs (if multiple children)
- Lesson filter dropdown
- FileList (editable=false)
- Only shows files visible to their role
- Download button on each file
- File type icons

**Route:** `/parent/resources`

**Navigation:** Add to parent sidebar in AdminLayout

---

### 5.2 Enhance Parent Dashboard

**File:** Modify `apps/frontend/src/pages/parent/ParentDashboardPage.tsx`

**Changes:**
- Replace current "Shared Resources" section with Google Drive files
- Use `useGoogleDriveFiles({ studentId })` hook
- Show only visibility=ALL files
- "View All" links to ResourcesPage

---

### 5.3 File Download Component

**File:** `apps/frontend/src/components/googleDrive/FileDownloadCard.tsx`

**Purpose:** Student/parent-friendly file display with download

**UI:**
- Card with:
  - File type icon (large)
  - File name
  - Lesson name
  - Date added
  - Download button
- Opens webViewLink in new tab (Google Drive viewer)

---

## Phase 6: Integration & Testing (Day 5)

### 6.1 Update App Routes

**File:** Modify `apps/frontend/src/App.tsx`

**Add Routes:**
```typescript
// Under /admin
<Route path="google-drive" element={<GoogleDrivePage />} />
<Route path="google-drive/files" element={<GoogleDriveFilesPage />} />

// Under /parent
<Route path="resources" element={<ResourcesPage />} />
```

---

### 6.2 Update Admin Navigation

**File:** Modify `apps/frontend/src/components/layout/AdminLayout.tsx`

**Add:**
```typescript
// Add after Lessons section
{ divider: true },
{ label: 'Google Drive', path: '/admin/google-drive', icon: CloudIcon },
```

Import: `import { Cloud as CloudIcon } from '@mui/icons-material';`

---

### 6.3 Create Component Tests

**Files:**
- `apps/frontend/src/components/googleDrive/__tests__/FolderBrowser.test.tsx`
- `apps/frontend/src/components/googleDrive/__tests__/FileList.test.tsx`
- `apps/frontend/src/components/googleDrive/__tests__/DriveFileUploader.test.tsx`
- `apps/frontend/src/hooks/__tests__/useGoogleDrive.test.ts`

**Test Coverage:**
- OAuth flow (redirect to Google, handle callback)
- Folder browsing (navigation, search)
- File listing with visibility filtering
- File upload success/error states
- Sync trigger and status display
- Role-based visibility (admin/teacher vs parent/student)

---

## Risk Assessment & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth redirect UX confusion | Medium | Clear loading states, error messages, redirect handling |
| Large file browser lists | Medium | Pagination in folder browser, virtualized list for files |
| Sync status delays | Low | Optimistic updates, polling every 30 seconds |
| Error handling complexity | Medium | Centralized error handler, user-friendly messages |
| Role-based visibility bugs | High | Thorough testing, backend handles filtering |
| Token expiry mid-session | Medium | Backend handles refresh, frontend shows reconnect prompt |

---

## File Structure Summary

```
apps/frontend/src/
├── api/
│   └── googleDrive.api.ts                    # NEW
├── hooks/
│   └── useGoogleDrive.ts                     # NEW
├── components/
│   └── googleDrive/
│       ├── index.ts                          # NEW (barrel export)
│       ├── GoogleDriveConnection.tsx         # NEW
│       ├── FolderBrowser.tsx                 # NEW
│       ├── LinkFolderDialog.tsx              # NEW
│       ├── FileList.tsx                      # NEW
│       ├── FileCard.tsx                      # NEW
│       ├── DriveFileUploader.tsx             # NEW
│       ├── FileMetadataEditor.tsx            # NEW
│       ├── SyncStatusBadge.tsx               # NEW
│       ├── TeacherResourcesPanel.tsx         # NEW
│       └── FileDownloadCard.tsx              # NEW
├── pages/
│   ├── admin/
│   │   ├── GoogleDrivePage.tsx               # NEW
│   │   └── GoogleDriveFilesPage.tsx          # NEW
│   └── parent/
│       └── ResourcesPage.tsx                 # NEW
├── components/layout/
│   └── AdminLayout.tsx                       # MODIFY
└── App.tsx                                   # MODIFY
```

---

## Task Breakdown by Agent

### Full-Stack Agent
1. Create `googleDrive.api.ts` with all types and API functions
2. Create `useGoogleDrive.ts` with all hooks
3. Update `App.tsx` with new routes
4. Update `AdminLayout.tsx` with navigation

### Frontend Agent
1. Create `GoogleDriveConnection.tsx`
2. Create `FolderBrowser.tsx`
3. Create `LinkFolderDialog.tsx`
4. Create `GoogleDrivePage.tsx`
5. Create `FileList.tsx` and `FileCard.tsx`
6. Create `DriveFileUploader.tsx`
7. Create `FileMetadataEditor.tsx`
8. Create `SyncStatusBadge.tsx`
9. Create `GoogleDriveFilesPage.tsx`
10. Create `TeacherResourcesPanel.tsx`
11. Create `FileDownloadCard.tsx`
12. Create `ResourcesPage.tsx`
13. Modify `ParentDashboardPage.tsx`
14. Modify `LessonDetailPage.tsx`

### Testing Agent
1. Create API client tests
2. Create hook tests
3. Create component tests
4. Integration tests for OAuth flow

---

## Success Criteria

- [ ] Admin can connect/disconnect Google Drive via OAuth
- [ ] Admin can browse Drive folders with search and navigation
- [ ] Admin can link Drive folders to lessons and students
- [ ] Admin can view sync status and trigger manual sync
- [ ] Teachers can upload files that sync to Google Drive
- [ ] Teachers can edit file visibility and tags
- [ ] Students can view files with visibility=ALL
- [ ] Parents can view files with visibility=ALL or TEACHERS_AND_PARENTS
- [ ] File download works via Google Drive viewer
- [ ] All components follow Material-UI v5 patterns
- [ ] Brand colors used consistently (#4580E4, #FFCE00, #96DAC9, etc.)
- [ ] TypeScript compiles with 0 errors
- [ ] All tests pass
- [ ] No console errors in browser

---

## Critical Files for Implementation

1. **`apps/frontend/src/api/googleDrive.api.ts`** - Core API client with types matching backend Zod schemas
2. **`apps/frontend/src/hooks/useGoogleDrive.ts`** - React Query hooks following existing patterns
3. **`apps/frontend/src/pages/admin/GoogleDrivePage.tsx`** - Main admin page for folder management and OAuth
4. **`apps/frontend/src/components/googleDrive/FolderBrowser.tsx`** - Key interactive component for Drive navigation
5. **`apps/frontend/src/components/googleDrive/FileList.tsx`** - Reusable file display component used across multiple pages

---

## Dependencies on Week 8 Backend

All these backend endpoints are ready (from Week 8):

| Endpoint | Used By |
|----------|---------|
| `GET /google-drive/auth/url` | GoogleDriveConnection |
| `GET /google-drive/auth/status` | GoogleDriveConnection |
| `POST /google-drive/auth/revoke` | GoogleDriveConnection |
| `GET /google-drive/folders` | FolderBrowser |
| `GET /google-drive/folders/mappings` | GoogleDrivePage |
| `POST /google-drive/folders/link` | LinkFolderDialog |
| `PATCH /google-drive/folders/:id` | GoogleDrivePage |
| `DELETE /google-drive/folders/:id` | GoogleDrivePage |
| `GET /google-drive/files` | FileList, ResourcesPage |
| `POST /google-drive/files/upload` | DriveFileUploader |
| `PATCH /google-drive/files/:id` | FileMetadataEditor |
| `DELETE /google-drive/files/:id` | FileList |
| `GET /google-drive/sync/status` | GoogleDrivePage |
| `POST /google-drive/sync/trigger` | GoogleDrivePage |
