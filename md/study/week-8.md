# Week 8 Study: Google Drive Integration - Part 1 (Backend)

*Research Date: 2025-12-24*

## Overview

**Week 8** is a critical week in the 12-week Music 'n Me MVP plan focused on implementing **Google Drive Two-Way Sync Backend Integration**. This is Part 1 of a two-week Google Drive feature (Week 8 backend + Week 9 frontend). The feature enables seamless synchronization between Google Drive folders and the portal, allowing teachers to manage files in either location while students and parents access materials through the portal.

**Current Project Status:** 58% complete (7/12 weeks done as of 2025-12-24)
- Week 7 (Invoicing & Payments): COMPLETE
- Week 8 (Google Drive Backend): NOT STARTED (Next phase)

---

## Week 8 Goals & Scope

**Primary Goal:** Implement backend infrastructure for two-way Google Drive synchronization

**Key Deliverables:**
1. Google Drive API connected and authenticated (OAuth 2.0)
2. Service can browse and search Google Drive folders
3. Sync engine downloads files from Drive → Portal database + DigitalOcean Spaces
4. Sync engine uploads portal files → Push to linked Google Drive folder
5. Background job runs every 15 minutes (Bull queue + Redis)
6. Error handling and retry logic

---

## Architecture

### High-Level Sync Flow
```
Google Drive Folder (Source of Truth)
         ↕
    Sync Service (Every 15 min)
         ↕
   Portal Database
         ↓
  DigitalOcean Spaces (CDN)
         ↓
  Student Downloads
```

### Sync Direction Strategy

**Primary (Google Drive → Portal):** One-way sync
- Files added/modified/deleted in Google Drive → synced to portal
- Google Drive is source of truth
- Sync runs every 15 minutes via background job

**Secondary (Portal → Google Drive):** One-way sync
- When teacher/admin uploads file in portal → immediately pushed to Google Drive
- Ensures both systems stay aligned
- Portal upload creates file in both locations simultaneously

**Important:** Files are NOT synced bidirectionally. Each upload location is the source for that file. Google Drive is primary for file discovery.

---

## Database Models (Prisma Schema)

### 1. GoogleDriveFolder Model
Maps portal entities (lessons/students) to Google Drive folders
```prisma
model GoogleDriveFolder {
  id              String            @id @default(cuid())
  schoolId        String

  // Google Drive folder details
  driveFolderId   String  @unique
  folderName      String
  folderUrl       String

  // Mapping to portal entities
  lessonId        String? @unique      // Class-level folder
  studentId       String? @unique      // Student-level folder

  // Sync settings
  syncEnabled     Boolean @default(true)
  lastSyncAt      DateTime?
  syncStatus      SyncStatus @default(PENDING)
  syncError       String?

  // Relations
  files           GoogleDriveFile[]

  @@unique([schoolId, driveFolderId])
  @@index([schoolId])
  @@index([driveFolderId])
}

enum SyncStatus {
  PENDING       // Never synced
  SYNCING       // Sync in progress
  SYNCED        // Last sync successful
  ERROR         // Last sync failed
}
```

### 2. GoogleDriveFile Model
Stores metadata about files synced from Google Drive
```prisma
model GoogleDriveFile {
  id              String   @id @default(cuid())
  schoolId        String

  // Google Drive file details
  driveFileId     String  @unique
  fileName        String
  mimeType        String
  fileSize        Int?
  webViewLink     String
  webContentLink  String?
  thumbnailLink   String?
  modifiedTime    DateTime
  createdTime     DateTime

  // Portal storage
  driveFolderId   String
  portalFileId    String?      // ID in DigitalOcean Spaces
  portalFileUrl   String?      // CDN URL

  // File metadata
  visibility      FileVisibility @default(ALL)
  tags            String[]

  // Upload source
  uploadedBy      String?
  uploadedVia     UploadSource @default(GOOGLE_DRIVE)

  // Deletion tracking
  deletedInDrive  Boolean @default(false)
  deletedAt       DateTime?

  @@index([schoolId])
  @@index([driveFileId])
  @@index([driveFolderId])
}

enum FileVisibility {
  ALL                   // Students, parents, teachers
  TEACHERS_AND_PARENTS
  TEACHERS_ONLY
}

enum UploadSource {
  GOOGLE_DRIVE
  PORTAL
}
```

### 3. GoogleDriveAuth Model
Stores OAuth tokens for Google Drive access (encrypted)
```prisma
model GoogleDriveAuth {
  id           String    @id @default(cuid())
  schoolId     String    @unique

  accessToken  String    // Encrypted
  refreshToken String    // Encrypted
  expiresAt    DateTime

  scope        String    // Comma-separated scopes
  tokenType    String    @default("Bearer")

  @@index([schoolId])
}
```

### 4. Existing Resource Model
Already has Google Drive fields for file linking:
```prisma
model Resource {
  // ... existing fields ...
  driveFileId   String?       // Google Drive file ID
  driveFolderId String?       // Google Drive folder ID
  visibility    FileVisibility
  syncStatus    String        // "synced", "pending", "error"
}
```

**Note:** The Prisma schema already includes `FileVisibility` enum and Resource model with Drive integration fields, but GoogleDriveFolder and GoogleDriveFile models need to be added.

---

## Week 8 Daily Breakdown

### Days 1-2: Google Drive API Setup
**Deliverables:**
- [ ] Google Cloud Project setup
- [ ] Service account or OAuth 2.0 configuration
- [ ] Google Drive API authentication utility
- [ ] Folder browsing/search API wrapper
- [ ] File upload/download API wrapper
- [ ] File listing with metadata

**Key Tasks:**
1. Create Google Cloud project "MusicNMe Portal"
2. Enable Google Drive API + Google Picker API
3. Create service account with JSON key file
4. Grant service account access to shared drives/folders
5. Implement OAuth 2.0 redirect handler
6. Create `googleDrive.service.ts` with:
   - `authenticateWithOAuth()` - OAuth flow handler
   - `listFolders()` - Browse folders
   - `searchFolders()` - Search by name
   - `listFiles()` - Get files in folder
   - `uploadFile()` - Upload to Google Drive
   - `downloadFile()` - Download from Google Drive
   - `deleteFile()` - Delete from Google Drive
   - `getFileMetadata()` - Get file details

### Days 3-4: Sync Service Implementation
**Deliverables:**
- [ ] Folder mapping models
- [ ] Sync service implementation
- [ ] File watching/polling mechanism
- [ ] File visibility rules
- [ ] Conflict resolution logic

**Key Tasks:**
1. Create Prisma migration for new models (GoogleDriveFolder, GoogleDriveFile, GoogleDriveAuth)
2. Implement `googleDriveSync.service.ts` with:
   - `syncFolder()` - Main sync logic
   - `detectNewFiles()` - Compare Drive vs portal
   - `detectUpdatedFiles()` - Check modified timestamps
   - `detectDeletedFiles()` - Handle Drive deletions
   - `createPortalFile()` - Add new file to portal DB
   - `updatePortalFile()` - Update file metadata
   - `markFileAsDeleted()` - Soft delete in portal
   - `downloadAndStoreInSpaces()` - Optional CDN optimization

3. Implement `googleDriveUpload.service.ts` for portal→Drive sync:
   - `uploadFileToGoogleDrive()` - Push portal upload to Drive
   - Link to existing lesson/student folder

### Day 5: Background Sync Job
**Deliverables:**
- [ ] Bull queue job for periodic sync
- [ ] Manual sync trigger endpoint
- [ ] Error handling and retry logic
- [ ] Conflict resolution

**Key Tasks:**
1. Install Bull queue and configure Redis
2. Create background job handler:
   ```typescript
   registerJob('google-drive-sync', {
     pattern: '*/15 * * * *',  // Every 15 minutes
     handler: syncAllSchoolFolders
   })
   ```
3. Implement exponential backoff for retries
4. Create error logging and admin alerts
5. Implement conflict resolution (Drive is source of truth)

---

## API Endpoints for Week 8

### Authentication
- `GET /api/v1/google-drive/auth/url` - Get OAuth authorization URL
- `GET /api/v1/google-drive/auth/callback` - OAuth callback handler
- `POST /api/v1/google-drive/auth/revoke` - Revoke access

### Folder Browsing & Mapping
- `GET /api/v1/google-drive/folders` - Browse folders (with optional search)
- `POST /api/v1/google-drive/folders/link` - Link Drive folder to lesson/student
- `GET /api/v1/google-drive/folders/mappings` - List all folder mappings
- `DELETE /api/v1/google-drive/folders/:id` - Unlink folder

### File Management
- `GET /api/v1/google-drive/files` - List files (with filters)
- `POST /api/v1/google-drive/files/upload` - Upload file (syncs to Drive)
- `PATCH /api/v1/google-drive/files/:id` - Update file metadata
- `DELETE /api/v1/google-drive/files/:id` - Delete file (from both locations)

### Sync Management
- `POST /api/v1/google-drive/sync/trigger` - Manually trigger sync
- `GET /api/v1/google-drive/sync/status` - Check sync status

---

## Key Business Logic

### File Visibility Rules
```typescript
function canUserAccessFile(user: User, file: GoogleDriveFile): boolean {
  if (user.role === 'ADMIN') return true;           // Admin sees all

  if (user.role === 'TEACHER') {
    return true;  // Teachers see ALL files
  }

  if (user.role === 'PARENT') {
    return file.visibility === 'TEACHERS_AND_PARENTS' ||
           file.visibility === 'ALL';
  }

  if (user.role === 'STUDENT') {
    return file.visibility === 'ALL';
  }

  return false;
}
```

### Sync Conflict Resolution
1. **Files in Drive but not in portal** → Create in portal
2. **Files in Drive with modified time newer than portal** → Update in portal
3. **Files in portal but not in Drive** → Mark as soft-deleted (not hard delete)
4. **Google Drive is source of truth** → If conflict, Drive wins

---

## Multi-Tenancy Security

**CRITICAL:** All queries MUST filter by `schoolId` to prevent data leakage:

```typescript
// CORRECT
const folders = await prisma.googleDriveFolder.findMany({
  where: { schoolId: req.user.schoolId, syncEnabled: true }
});

// WRONG - Missing schoolId!
const folders = await prisma.googleDriveFolder.findMany({
  where: { syncEnabled: true }
});
```

**Every API endpoint must:**
1. Verify `req.user.schoolId` from JWT token
2. Include `schoolId` in all database queries
3. Validate folder/file ownership by comparing schoolId
4. Return 403 if user tries to access another school's data

---

## Related Features & Dependencies

### From Previous Weeks (Already Complete)
- **Week 1-2:** Auth system, JWT tokens, multi-tenancy middleware
- **Week 3:** Email service (SendGrid) - for sync notifications
- **Week 4-6:** Lesson management, student enrollment
- **Week 7:** Invoice system (for payment flow if applicable)

### Resource Model Already Exists
- File visibility rules: `ALL`, `TEACHERS_AND_PARENTS`, `TEACHERS_ONLY`
- File upload support with tags
- lesson/student associations

### What Depends on Week 8
- **Week 9:** Frontend folder linking UI, file management interface
- **Week 10:** Email notifications for file uploads
- **Week 12:** Testing, security audit, deployment

---

## Current Codebase Status

### Backend Services Already Implemented
- `attendance.service.ts` - 352 lines
- `auth.service.ts` - Authentication with password security
- `email.service.ts` - SendGrid integration (ready for sync notifications)
- `invoice.service.ts` - 1108 lines (payments system)
- `hybridBooking.service.ts` - 1214 lines (core feature)
- `lesson.service.ts` - 955 lines (lesson management)
- `resources.service.ts` - 387 lines (file uploads)
- `notes.service.ts` - 512 lines (teacher notes)

### Missing for Week 8
- [ ] `googleDrive.service.ts` - Google Drive API wrapper
- [ ] `googleDriveSync.service.ts` - Sync engine
- [ ] `googleDriveAuth.service.ts` - Token management
- [ ] `googleDriveUpload.service.ts` - Portal→Drive upload
- [ ] Routes for all endpoints listed above

---

## Key Files to Reference

| File | Purpose | Status |
|------|---------|--------|
| `Planning/roadmaps/12_Week_MVP_Plan.md` | Sprint breakdown | Reference |
| `Planning/specifications/Google_Drive_Sync_Specification.md` | Technical spec | CRITICAL |
| `apps/backend/prisma/schema.prisma` | Data models | Review for Google Drive models |
| `apps/backend/src/services/resources.service.ts` | File upload patterns | Reference |
| `apps/backend/src/services/invoice.service.ts` | Service patterns | Reference |
| `PROGRESS.md` | Project status | Track progress |
| `TASKLIST.md` | Quick checklist | Check off items |

---

## Performance & Optimization Considerations

### Caching Strategy
- Folder listings: Cache for 5 minutes
- File metadata: Cache for 15 minutes
- Access tokens: Cache until expiry

### Batch Operations
- Sync multiple folders in parallel (max 5 concurrent)
- Batch file uploads to DigitalOcean Spaces
- Paginate folder listings (max 100 items per request)

### CDN Delivery
- Store frequently accessed files in DigitalOcean Spaces
- Serve via CDN (faster than Google Drive API)
- Fallback to Google Drive if file not in Spaces

### Rate Limiting
- Google Drive API: Implement exponential backoff
- Respect quota limits (typical: 10 billion/day)
- Monitor usage in admin dashboard

---

## Testing Strategy for Week 8

### Unit Tests
- [ ] OAuth token refresh logic
- [ ] File visibility filtering
- [ ] Sync logic (new, updated, deleted files)
- [ ] Conflict resolution (Drive vs Portal)
- [ ] Multi-tenancy isolation

### Integration Tests
- [ ] Full sync flow (Google Drive → Portal)
- [ ] Portal upload → Google Drive push
- [ ] File deletion in Drive → Portal marks as deleted
- [ ] Error handling and retries

### Manual Testing Checklist
- [ ] Admin can authorize Google Drive access (OAuth flow)
- [ ] Sync service connects to test Google Drive folder
- [ ] New files in Drive appear in portal (within 15 min)
- [ ] Modified files in Drive sync correctly
- [ ] Deleted files in Drive marked as deleted in portal
- [ ] Portal uploads immediately appear in Drive
- [ ] File visibility rules respected
- [ ] Multi-tenancy isolation verified

---

## Success Criteria for Week 8

- Google Drive API connected and authenticated
- Service can browse/search Drive folders
- Sync engine downloads files from Drive
- Sync engine uploads portal files to Drive
- Background job runs every 15 minutes without errors
- All new Google Drive models in Prisma schema
- Multi-tenancy security (100% schoolId filtering)
- Error handling with retry logic
- 12+ integration tests passing
- No TypeScript compilation errors

---

## Week 8 Completion Checklist

### Backend Services
- [ ] `googleDrive.service.ts` implemented
- [ ] `googleDriveSync.service.ts` implemented
- [ ] `googleDriveAuth.service.ts` implemented
- [ ] `googleDriveUpload.service.ts` implemented
- [ ] All validators created (Zod schemas)

### Database
- [ ] Prisma schema updated with 3 new models
- [ ] Migration created and applied
- [ ] Indexes optimized for performance

### Routes & Endpoints
- [ ] OAuth endpoints (url, callback, revoke)
- [ ] Folder browsing endpoints
- [ ] Folder mapping endpoints
- [ ] File management endpoints
- [ ] Sync management endpoints

### Background Jobs
- [ ] Bull queue configured with Redis
- [ ] Sync job runs every 15 minutes
- [ ] Manual sync trigger endpoint works
- [ ] Error handling and retry logic

### Security
- [ ] Multi-tenancy filtering on all queries
- [ ] OAuth token encryption
- [ ] Rate limiting on API endpoints
- [ ] Input validation with Zod

### Testing
- [ ] Unit tests for critical functions
- [ ] Integration tests (15+ tests)
- [ ] Multi-tenancy isolation verified
- [ ] All tests passing with 100% pass rate

---

## Next Steps (Week 9)

Week 8 completion enables Week 9, which includes:
1. **Admin Folder Selection UI** - Google Drive folder browser component
2. **Folder Mapping Management** - List, edit, remove mappings
3. **Teacher File Upload** - Upload with visibility settings
4. **File Management Interface** - View, edit, delete files
5. **Student/Parent File Access** - Download files with proper permissions
6. **File Download Logging** - Track access for analytics

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Week 8: Google Drive Backend              │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Google Drive │ (Source of Truth)
└──────────────┘
      ↓↑ (OAuth 2.0)
┌──────────────────────────────────────────────────────────────┐
│        Google Drive API Service Layer                         │
│  - OAuth authentication                                       │
│  - Folder browsing/search                                     │
│  - File upload/download                                       │
│  - File metadata operations                                   │
└──────────────────────────────────────────────────────────────┘
      ↓↑ (Sync Engine)
┌──────────────────────────────────────────────────────────────┐
│        Sync Service (Every 15 minutes)                        │
│  - Detect new files in Drive                                  │
│  - Detect updated files (timestamp comparison)                │
│  - Detect deleted files (soft delete in portal)               │
│  - Conflict resolution (Drive wins)                           │
│  - Error handling & retry logic                               │
└──────────────────────────────────────────────────────────────┘
      ↓↑ (Portal Upload)
┌──────────────────────────────────────────────────────────────┐
│        Portal File Upload Service                             │
│  - Upload to Drive immediately                                │
│  - Store metadata in portal DB                                │
│  - Create/update Resource record                              │
└──────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────┐
│        Portal Database (PostgreSQL)                           │
│  - GoogleDriveFolder (folder mappings)                        │
│  - GoogleDriveFile (file metadata)                            │
│  - GoogleDriveAuth (OAuth tokens)                             │
│  - Resource (existing file records)                           │
└──────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────┐
│        DigitalOcean Spaces (CDN)                              │
│  - Frequently accessed files                                  │
│  - Fast downloads for students/parents                        │
└──────────────────────────────────────────────────────────────┘
```
