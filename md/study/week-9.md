# Week 9 Study: Google Drive Integration - Frontend

## Overview

**Week 9** is the frontend counterpart to Week 8 (Google Drive Backend). Week 8 implemented the backend infrastructure including OAuth 2.0 authentication, folder mapping, sync service, and background jobs. **Week 9 focuses on building the admin UI and file management interfaces** for teachers and students to interact with the synced Google Drive content.

**Current Status:**
- Week 8 (Google Drive Backend): COMPLETE (Grade: A+ 97/100)
- Week 9 (Google Drive Frontend): NOT STARTED
- Overall Progress: 67% (8/12 weeks complete)

---

## Week 9 Goals & Scope

**Primary Goal:** Build admin folder mapping UI and file management interfaces

### Days 1-2: Admin Folder Selection UI
- Google Drive folder browser component (search, hierarchy display)
- Folder mapping management page (link folders to classes/students)
- Edit/remove mapping functionality
- Manual sync button to trigger immediate sync

### Days 3-4: File Management Interface
- Teacher file upload interface (saves to both portal + Drive)
- Visibility settings (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)
- File metadata editing (name, visibility, tags)
- Sync status indicators (synced, pending, error)
- Delete files from both portal and Drive

### Day 5: Student/Parent File Access
- Student file portal (view/download from classes + personal folder)
- Parent file access (view children's class folders)
- File download logging
- Visibility filtering by role

---

## Architecture & Components

### Admin Features
1. **FolderBrowserComponent** - Interactive Drive folder browser with search
2. **FolderMappingPage** - Management page for linking folders to lessons/students
3. **FileManagerPage** - Manage synced files, edit metadata, delete files
4. **SyncStatusPanel** - Show current sync status and last sync timestamp
5. **ManualSyncButton** - Trigger immediate folder/file sync

### Teacher Features
1. **FileUploadComponent** - Upload files with visibility and tag settings
2. **ClassResourcesTab** - View/manage class folder files
3. **SyncStatusBadge** - Show file sync status (pending, synced, error)

### Student/Parent Features
1. **ResourcesLibraryPage** - Browse synced files by class
2. **FileDownloadCard** - Display file with download button
3. **FileVisibilityFilter** - Show only files they have access to

---

## Database Models (Already Implemented in Week 8)

### GoogleDriveFolder Model
```prisma
model GoogleDriveFolder {
  id            String   @id @default(uuid())
  schoolId      String
  driveFolderId String
  name          String
  driveUrl      String?
  entityType    EntityType  // LESSON, STUDENT
  entityId      String
  syncStatus    SyncStatus  // PENDING, SYNCING, SYNCED, ERROR
  lastSyncAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### GoogleDriveFile Model
```prisma
model GoogleDriveFile {
  id            String   @id @default(uuid())
  schoolId      String
  folderId      String
  driveFileId   String
  fileName      String
  mimeType      String?
  fileSize      Int?
  visibility    FileVisibility  // ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY
  uploadedVia   UploadSource    // GOOGLE_DRIVE, PORTAL
  uploadedById  String?
  tags          String[]
  deletedInDrive Boolean @default(false)
  deletedAt     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### GoogleDriveAuth Model
```prisma
model GoogleDriveAuth {
  id            String   @id @default(uuid())
  schoolId      String   @unique
  accessToken   String   // Encrypted with AES-256-GCM
  refreshToken  String   // Encrypted
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## API Endpoints (Already Implemented in Week 8)

### OAuth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/google-drive/auth/url` | Get OAuth authorization URL |
| GET | `/google-drive/auth/callback` | OAuth callback handler |
| POST | `/google-drive/auth/revoke` | Revoke Google Drive access |
| GET | `/google-drive/auth/status` | Check connection status |

### Folder Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/google-drive/folders` | Browse Drive folders |
| GET | `/google-drive/folders/mappings` | List folder mappings |
| POST | `/google-drive/folders/link` | Link folder to lesson/student |
| PATCH | `/google-drive/folders/:id` | Update folder settings |
| DELETE | `/google-drive/folders/:id` | Unlink folder |

### File Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/google-drive/files` | List files with visibility filtering |
| GET | `/google-drive/files/:id` | Get file details |
| POST | `/google-drive/files/upload` | Upload file |
| PATCH | `/google-drive/files/:id` | Update file metadata |
| DELETE | `/google-drive/files/:id` | Delete file |

### Sync Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/google-drive/sync/status` | Get sync status |
| POST | `/google-drive/sync/trigger` | Trigger manual sync |

---

## Key Features & Business Rules

### File Visibility Control
- **ALL**: Students, parents, and teachers can see
- **TEACHERS_AND_PARENTS**: Only teachers and parents
- **TEACHERS_ONLY**: Only teachers

### Sync Strategy
- **Google Drive is source of truth**
- Sync runs every 15 minutes via Bull queue
- Manual sync trigger available in admin UI
- Soft delete in portal when removed from Drive
- File restoration when re-added to Drive

### Rate Limiting
- 100 requests/minute per school (prevents Google API quota exhaustion)
- 5-minute caching for folder/file listings
- Cache invalidation on mutations

### Multi-Tenancy Security
- All queries filter by schoolId (100% compliance verified)
- Each school has separate OAuth credentials
- Folder mappings isolated per school

---

## Existing Implementations (Week 8 Completed)

### Backend Services (1,539 lines total)
| File | Lines | Purpose |
|------|-------|---------|
| `googleDrive.service.ts` | 651 | OAuth, folder browsing, file operations |
| `googleDriveSync.service.ts` | 422 | Two-way sync logic, conflict resolution |
| `googleDriveFile.service.ts` | 466 | File visibility filtering, access control |

### Backend Routes & Validation
- `googleDrive.routes.ts` - 14 API endpoints with auth
- `googleDrive.validators.ts` - Zod schemas for all inputs
- `googleDriveSync.job.ts` - Bull queue background job (15-min recurring)
- `googleDrive.openapi.yaml` - Complete API documentation

### Testing
- 18 integration tests for Google Drive operations
- 17 rate limiter unit tests
- 100% pass rate
- Multi-tenancy isolation verified

---

## Frontend API Integration (Partially Ready)

### Existing Frontend
- `resources.api.ts` - Basic file upload/download functions
- `ResourceUploader.tsx` - Component for file uploads with visibility settings
- Resource type definitions include driveFileId and driveFolderId fields
- File icons and sync status already referenced

### NOT YET IMPLEMENTED
- `googleDrive.api.ts` - API client for OAuth, folder browsing, sync control
- Folder browser component
- Folder mapping management page
- File manager with metadata editing
- Sync status UI components
- Integration with existing admin pages

---

## Week 9 Implementation Plan

### Phase 1: API Client (Day 1)
- Create `apps/frontend/src/api/googleDrive.api.ts`
- Functions: getAuthUrl, linkFolder, browseFolder, uploadFile, etc.
- React Query hooks for all operations

### Phase 2: Admin Folder Management (Days 1-2)
- Create `FolderBrowserComponent` with search/hierarchy
- Create `FolderMappingPage` in admin section
- Link to AdminDashboard sidebar
- Manual sync trigger

### Phase 3: File Management (Days 3-4)
- Create `FileManagerComponent` for viewing/editing files
- Enhance `ResourceUploader` with Drive folder selection
- Add sync status indicators throughout
- File deletion confirmation dialogs

### Phase 4: Student/Parent Access (Day 5)
- Enhance `ParentDashboardPage` with synced resources
- Enhance `ParentPortalResourcesPage` (if exists)
- File download tracking
- Visibility filtering

---

## Critical Files to Reference

### Backend (Already Complete)
- `apps/backend/src/services/googleDrive.service.ts`
- `apps/backend/src/services/googleDriveSync.service.ts`
- `apps/backend/src/services/googleDriveFile.service.ts`
- `apps/backend/src/routes/googleDrive.routes.ts`
- `apps/backend/src/validators/googleDrive.validators.ts`

### Frontend (Already Exist)
- `apps/frontend/src/api/resources.api.ts`
- `apps/frontend/src/components/resources/ResourceUploader.tsx`

### Documentation
- `Planning/specifications/Google_Drive_Sync_Specification.md`
- `Planning/roadmaps/12_Week_MVP_Plan.md` (lines 396-436)
- `md/study/week-8.md` (comprehensive backend study)
- `md/plan/week-8.md` (backend implementation plan)
- `md/review/week-8.md` (backend QA review)

---

## Testing Requirements for Week 9

### Integration Tests Needed
- Admin can authorize Google Drive (OAuth flow)
- Admin can browse and link Drive folders
- Teachers can upload files (syncs to Drive)
- Students can download synced files
- File visibility filtering works correctly
- Sync status updates display properly
- Multi-tenancy isolation maintained

### Manual Testing Checklist
- [ ] OAuth flow completes successfully
- [ ] Folder browser displays hierarchy
- [ ] Folder linking works for lessons and students
- [ ] File uploads appear in Drive
- [ ] Sync status indicators update
- [ ] File visibility rules enforced
- [ ] Admin can manually trigger sync
- [ ] Parents see only appropriate files

---

## Dependencies & Tech Stack

### Frontend
- React 18+
- Material-UI v5
- React Query for API state management
- Zod for runtime validation
- Axios for HTTP requests

### Backend (Already Installed)
- googleapis (Google Drive API client)
- bull (queue management)
- ioredis (Redis client)
- AES-256-GCM encryption for tokens

---

## Success Criteria for Week 9

- [ ] Admin can browse and link Google Drive folders to classes and students
- [ ] Teachers can upload files which sync to Drive automatically
- [ ] Students can download files from synced Drive folders
- [ ] Parents can view class resources based on file visibility rules
- [ ] File metadata (name, visibility, tags) can be edited
- [ ] Sync status is displayed and manual sync can be triggered
- [ ] All new components integrate with existing admin/teacher/parent pages
- [ ] Multi-tenancy security maintained (100% schoolId filtering)
- [ ] React Query hooks cache properly
- [ ] TypeScript compiles with 0 errors
- [ ] Integration tests pass (15+ tests)

---

## Known Constraints & Notes

1. **Google Drive is Source of Truth** - Always sync FROM Drive to Portal, not bidirectional
2. **24h Notice Rule Still Applies** - Hybrid bookings maintain existing 24h reschedule window
3. **Rate Limiting Critical** - Must stay under Google API quotas (100 req/min per school)
4. **Token Refresh Automatic** - Backend handles token refresh automatically (5-min buffer)
5. **File Size Limits** - 25MB max file size (configurable)
6. **Soft Deletes Only** - Portal files marked deleted, not hard deleted
7. **CDN Delivery** - Files can be cached in DigitalOcean Spaces for faster access

---

## Summary

Week 9 builds the user-facing frontend for Google Drive integration on top of the solid Week 8 backend foundation (Grade A+). The primary focus is:

1. **Admin UI** - Folder browser and mapping management
2. **Teacher Tools** - File upload with Drive sync
3. **Student/Parent Access** - File download with visibility filtering
4. **Sync Status** - Visual indicators and manual trigger

The backend APIs are fully tested and production-ready, so Week 9 is primarily React component development with React Query integration.
