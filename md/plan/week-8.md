# Week 8: Google Drive Integration - Part 1 (Backend)

## Comprehensive Implementation Plan

*Generated: 2025-12-24*

---

## Executive Summary

Week 8 focuses on implementing the backend infrastructure for two-way Google Drive synchronization. This includes OAuth 2.0 authentication, folder mapping, file synchronization, and background jobs using Bull + Redis. Google Drive serves as the source of truth, with sync running every 15 minutes.

**Key Deliverables:**
- GoogleDriveAuth, GoogleDriveFolder, GoogleDriveFile Prisma models
- Google Drive API service with OAuth 2.0
- Sync service with conflict resolution
- Bull queue background jobs (15-minute sync)
- Complete API routes for auth, folders, files, and sync

**Dependencies:** googleapis, bull, ioredis packages

---

## Phase 1: Database Layer

### 1.1 Prisma Schema Updates

**File:** `apps/backend/prisma/schema.prisma`

Add the following models:

```prisma
// ===========================================
// GOOGLE DRIVE SYNC MODELS
// ===========================================

enum SyncStatus {
  PENDING       // Never synced
  SYNCING       // Sync in progress
  SYNCED        // Last sync successful
  ERROR         // Last sync failed
}

enum UploadSource {
  GOOGLE_DRIVE  // Synced from Drive
  PORTAL        // Uploaded via portal
}

model GoogleDriveAuth {
  id            String   @id @default(uuid())
  schoolId      String   @unique
  school        School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  accessToken   String   // Encrypted
  refreshToken  String   // Encrypted
  expiresAt     DateTime

  scope         String
  tokenType     String   @default("Bearer")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
}

model GoogleDriveFolder {
  id        String   @id @default(uuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  driveFolderId   String
  folderName      String
  folderUrl       String

  lessonId        String? @unique
  lesson          Lesson? @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  studentId       String? @unique
  student         Student? @relation(fields: [studentId], references: [id], onDelete: Cascade)

  syncEnabled     Boolean @default(true)
  lastSyncAt      DateTime?
  syncStatus      SyncStatus @default(PENDING)
  syncError       String?

  files           GoogleDriveFile[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([driveFolderId])
  @@unique([schoolId, driveFolderId])
}

model GoogleDriveFile {
  id        String   @id @default(uuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  driveFileId     String  @unique
  fileName        String
  mimeType        String
  fileSize        Int?
  webViewLink     String
  webContentLink  String?
  thumbnailLink   String?
  modifiedTime    DateTime
  createdTime     DateTime

  driveFolderId   String
  driveFolder     GoogleDriveFolder @relation(fields: [driveFolderId], references: [id], onDelete: Cascade)

  portalFileId    String?
  portalFileUrl   String?

  visibility      FileVisibility @default(ALL)
  tags            Json           @default("[]")

  uploadedBy      String?
  uploadedVia     UploadSource @default(GOOGLE_DRIVE)

  deletedInDrive  Boolean @default(false)
  deletedAt       DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([driveFileId])
  @@index([driveFolderId])
}
```

**Required Model Relation Updates:**
- School: `googleDriveAuth GoogleDriveAuth?`, `googleDriveFolders GoogleDriveFolder[]`, `googleDriveFiles GoogleDriveFile[]`
- Lesson: `googleDriveFolder GoogleDriveFolder?`
- Student: `googleDriveFolder GoogleDriveFolder?`

### 1.2 Migration Tasks

- [ ] Add new models to schema.prisma
- [ ] Update School, Lesson, Student relations
- [ ] Run `npx prisma migrate dev --name add_google_drive_models`
- [ ] Verify all indexes created

---

## Phase 2: Configuration & Dependencies

### 2.1 Package Installation

```bash
cd apps/backend
npm install googleapis@^140.0.1 bull@^4.16.0 ioredis@^5.4.1
npm install -D @types/bull@^4.10.0
```

### 2.2 Environment Variables

**File:** `apps/backend/.env.example`

```env
# Google Drive API (OAuth 2.0)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/google-drive/auth/callback

# Redis (for Bull queues)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Google Drive Sync Settings
DRIVE_SYNC_INTERVAL_MINUTES=15
DRIVE_MAX_FILE_SIZE_MB=25
```

### 2.3 Configuration Update

**File:** `apps/backend/src/config/index.ts`

```typescript
googleDrive: {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/google-drive/auth/callback',
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.file',
  ],
  syncIntervalMinutes: parseInt(process.env.DRIVE_SYNC_INTERVAL_MINUTES || '15', 10),
  maxFileSizeMB: parseInt(process.env.DRIVE_MAX_FILE_SIZE_MB || '25', 10),
},
redis: {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
},
```

---

## Phase 3: Encryption Utility

### 3.1 Token Encryption Service

**File:** `apps/backend/src/utils/encryption.ts`

- AES-256-GCM encryption for OAuth tokens
- `encrypt(plaintext: string): string`
- `decrypt(ciphertext: string): string`
- Uses IV + AuthTag for authenticated encryption

---

## Phase 4: Google Drive API Service

### 4.1 Drive Client Service

**File:** `apps/backend/src/services/googleDrive.service.ts`

**OAuth Functions:**
- `createOAuthClient()` - Create OAuth2 client
- `getAuthenticatedClient(schoolId)` - Get client with tokens
- `getDriveClient(schoolId)` - Get Drive API client
- `getAuthUrl(state)` - Generate authorization URL
- `exchangeCodeForTokens(schoolId, code)` - Exchange code for tokens
- `revokeAccess(schoolId)` - Revoke Google Drive access
- `isConnected(schoolId)` - Check connection status

**Folder Functions:**
- `browseFolders(schoolId, parentId?, query?)` - Browse Drive folders
- `getFolderDetails(schoolId, folderId)` - Get folder details
- `linkFolder(schoolId, input)` - Link folder to lesson/student
- `unlinkFolder(schoolId, folderId)` - Unlink folder
- `getFolderMappings(schoolId)` - Get all folder mappings

**File Functions:**
- `listDriveFiles(schoolId, driveFolderId)` - List files in folder
- `uploadFileToDrive(schoolId, driveFolderId, file)` - Upload file
- `deleteFileFromDrive(schoolId, driveFileId)` - Delete file
- `downloadFileFromDrive(schoolId, driveFileId)` - Download file

---

## Phase 5: Sync Service

### 5.1 Sync Engine Service

**File:** `apps/backend/src/services/googleDriveSync.service.ts`

**Core Sync Functions:**
- `syncFolder(folder)` - Sync a single folder
- `syncSchoolFolders(schoolId)` - Sync all school folders
- `syncAllSchools()` - Sync all schools (background job)
- `getSyncStatus(schoolId)` - Get sync status
- `triggerFolderSync(schoolId, folderId)` - Manual folder sync
- `triggerSchoolSync(schoolId)` - Manual school sync

**Sync Logic:**
1. Detect new files (in Drive but not portal) → Create
2. Detect updated files (Drive modifiedTime > portal) → Update
3. Detect deleted files (in portal but not Drive) → Soft delete
4. Drive is source of truth - always wins conflicts

---

## Phase 6: Background Jobs (Bull Queue)

### 6.1 Queue Configuration

**File:** `apps/backend/src/config/queue.ts`

- `googleDriveSyncQueue` - Bull queue instance
- Redis connection with error handling
- Job options: 3 attempts, exponential backoff
- Queue health check and graceful shutdown

### 6.2 Queue Processor

**File:** `apps/backend/src/jobs/googleDriveSync.job.ts`

- Job types: 'all', 'school', 'folder'
- `scheduleRecurringSync()` - Schedule 15-minute cron job
- `queueSchoolSync(schoolId)` - Queue school sync
- `queueFolderSync(schoolId, folderId)` - Queue folder sync

---

## Phase 7: API Routes

### 7.1 Validators

**File:** `apps/backend/src/validators/googleDrive.validators.ts`

- `authCallbackSchema` - OAuth callback validation
- `browseFoldersQuerySchema` - Folder browsing query
- `linkFolderSchema` - Folder linking (lessonId XOR studentId)
- `filesQuerySchema` - File query filters
- `updateFileSchema` - File metadata update
- `triggerSyncSchema` - Manual sync trigger

### 7.2 Google Drive Routes

**File:** `apps/backend/src/routes/googleDrive.routes.ts`

**OAuth Endpoints:**
- `GET /google-drive/auth/url` - Get authorization URL (Admin)
- `GET /google-drive/auth/callback` - OAuth callback (Admin)
- `POST /google-drive/auth/revoke` - Revoke access (Admin)
- `GET /google-drive/auth/status` - Connection status (Admin)

**Folder Endpoints:**
- `GET /google-drive/folders` - Browse Drive folders (Admin)
- `GET /google-drive/folders/mappings` - List folder mappings (Admin)
- `POST /google-drive/folders/link` - Link folder (Admin)
- `DELETE /google-drive/folders/:folderId` - Unlink folder (Admin)

**File Endpoints:**
- `GET /google-drive/files` - List files (Teacher/Admin)
- `POST /google-drive/files/upload` - Upload file (Teacher/Admin)
- `PATCH /google-drive/files/:fileId` - Update file (Teacher/Admin)
- `DELETE /google-drive/files/:fileId` - Delete file (Teacher/Admin)

**Sync Endpoints:**
- `GET /google-drive/sync/status` - Sync status (Admin)
- `POST /google-drive/sync/trigger` - Trigger sync (Admin)

### 7.3 File Service

**File:** `apps/backend/src/services/googleDriveFile.service.ts`

- `getFiles(schoolId, userRole, filters)` - Get files with visibility filtering
- `uploadFile(schoolId, uploadedBy, file, options)` - Upload and sync to Drive
- `updateFile(schoolId, fileId, userId, userRole, input)` - Update metadata
- `deleteFile(schoolId, fileId, userId, userRole)` - Delete from both systems

---

## Phase 8: Route Registration & App Updates

### 8.1 Routes Index Update

**File:** `apps/backend/src/routes/index.ts`

```typescript
import googleDriveRoutes from './googleDrive.routes';
router.use('/google-drive', csrfProtection, googleDriveRoutes);
```

### 8.2 App Startup Updates

**File:** `apps/backend/src/index.ts`

- Initialize Bull queue on startup
- Schedule recurring sync job
- Add graceful shutdown handler for queue

---

## Phase 9: Testing

### 9.1 Integration Tests

**File:** `apps/backend/src/__tests__/googleDrive.integration.test.ts`

| Test Category | Tests |
|---------------|-------|
| OAuth Flow | 6 tests |
| Folder Operations | 8 tests |
| Sync Service | 10 tests |
| File Operations | 8 tests |
| Multi-tenancy Security | 8 tests |
| **Total** | **40+ tests** |

### 9.2 Test Coverage Requirements

| Area | Target |
|------|--------|
| OAuth Service | 80% |
| Folder Operations | 90% |
| Sync Service | 85% |
| File Operations | 85% |
| Multi-tenancy | 100% |

---

## Phase 10: Documentation Updates

- [ ] Update PROGRESS.md with Week 8 status
- [ ] Mark TASKLIST.md items complete
- [ ] Update .env.example with new variables
- [ ] Document API endpoints

---

## Implementation Sequence

### Day 1: Database & Configuration
- [ ] Add Prisma models (GoogleDriveAuth, GoogleDriveFolder, GoogleDriveFile)
- [ ] Update School, Lesson, Student relations
- [ ] Run migration
- [ ] Install packages (googleapis, bull, ioredis)
- [ ] Update configuration

### Day 2: Core Services
- [ ] Create encryption utility
- [ ] Implement Google Drive service (OAuth)
- [ ] Implement Drive folder operations
- [ ] Implement Drive file operations

### Day 3: Sync Engine
- [ ] Implement sync service
- [ ] Add conflict detection logic
- [ ] Add deleted file handling
- [ ] Add sync status tracking

### Day 4: Background Jobs
- [ ] Configure Bull queue with Redis
- [ ] Implement sync job processor
- [ ] Schedule recurring sync (every 15 min)
- [ ] Add manual sync triggers

### Day 5: API Routes
- [ ] Create validators
- [ ] Implement OAuth routes
- [ ] Implement folder management routes
- [ ] Implement file management routes
- [ ] Implement sync control routes
- [ ] Register routes in index

### Day 6: File Service & Polish
- [ ] Implement googleDriveFile.service.ts
- [ ] Add visibility filtering logic
- [ ] Add file upload/update/delete
- [ ] Error handling refinement

### Day 7: Testing & Documentation
- [ ] Write integration tests (40+)
- [ ] Multi-tenancy security tests
- [ ] Update PROGRESS.md
- [ ] Update TASKLIST.md

---

## Risk Assessment

### High Risk Areas

| Risk | Mitigation |
|------|------------|
| OAuth Token Refresh | Robust refresh with error handling; clear auth and re-authorize on failure |
| Google Drive API Rate Limits | Exponential backoff; batch operations; monitor quota |
| Large File Handling | 25MB limit enforced; stream-based upload/download |
| Background Job Failures | 3 retry attempts; exponential backoff; failed job alerting |
| Multi-tenancy Data Leakage | 100% schoolId filtering; dedicated security tests |

---

## Multi-Tenancy Security Checklist

**CRITICAL:** Every database query MUST include schoolId filter.

- [ ] GoogleDriveAuth - schoolId is unique constraint
- [ ] GoogleDriveFolder - All queries include schoolId
- [ ] GoogleDriveFile - All queries include schoolId
- [ ] OAuth tokens - Isolated per school
- [ ] Folder mappings - Verify lesson/student belongs to school
- [ ] File visibility - Respect role-based access per school

---

## Success Criteria

| Criterion | Requirement |
|-----------|-------------|
| OAuth Authentication | Admin can connect Google Drive |
| Folder Browsing | Admin can browse and select folders |
| Folder Mapping | Folders linked to lessons/students |
| Automatic Sync | Background sync runs every 15 min |
| Manual Sync | Admin can trigger immediate sync |
| File Upload | Teachers can upload (synced to Drive) |
| Multi-tenancy | 100% schoolId filtering |
| Tests Passing | 40+ tests at 100% pass rate |
| Error Handling | All errors caught and logged |

---

## Key Files Summary

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Add 3 new models + relations |
| `src/utils/encryption.ts` | AES-256-GCM token encryption |
| `src/config/queue.ts` | Bull queue configuration |
| `src/services/googleDrive.service.ts` | OAuth & Drive API operations |
| `src/services/googleDriveSync.service.ts` | Sync engine |
| `src/services/googleDriveFile.service.ts` | File operations |
| `src/jobs/googleDriveSync.job.ts` | Background job processor |
| `src/validators/googleDrive.validators.ts` | Zod validation schemas |
| `src/routes/googleDrive.routes.ts` | All API endpoints |

---

## Next Steps (Week 9)

Week 8 backend enables Week 9 frontend:
1. Admin folder browser component (Google Drive picker)
2. Folder mapping management UI
3. Teacher file upload interface
4. File management dashboard
5. Student/parent file access view
6. File download logging
