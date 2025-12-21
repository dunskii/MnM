# Google Drive Sync - Technical Specification

## Overview

The Google Drive sync feature provides **two-way synchronization** between Google Drive folders and the Music 'n Me portal, allowing teachers and admins to manage files in either location while ensuring students always have access to the latest materials.

**Key Benefit**: Teachers can use their familiar Google Drive interface while students access files seamlessly through the portal.

---

## Architecture

### High-Level Flow

```
Google Drive Folder (Source of Truth)
         ↕
    Sync Service
    (Every 15 min)
         ↕
   Portal Database
         ↕
  DigitalOcean Spaces
         ↓
  Student Downloads
```

### Sync Direction

**One-Way: Google Drive → Portal (Primary)**
- Files added/modified/deleted in Google Drive → synced to portal
- Google Drive is the source of truth
- Sync runs every 15 minutes via background job

**One-Way: Portal → Google Drive (Secondary)**
- When teacher/admin uploads file in portal → immediately pushed to Google Drive
- Ensures both systems stay aligned
- Portal upload creates file in both locations simultaneously

**Important**: Files are NOT synced bidirectionally (no conflict resolution needed). Each upload location is the source for that file.

---

## Google Drive Setup

### Prerequisites

1. **Google Workspace Account**
   - School must have Google Workspace (G Suite)
   - Admin creates shared drives or folders for Music 'n Me

2. **Google Cloud Project**
   - Create project: "MusicNMe Portal"
   - Enable APIs:
     - Google Drive API
     - Google Picker API (for folder browsing UI)

3. **Service Account**
   - Create service account for backend
   - Generate JSON key file
   - Grant service account access to shared drives/folders
   - Or use OAuth 2.0 for user-based access (recommended)

4. **OAuth 2.0 Configuration** (Recommended)
   - Client ID and Secret
   - Scopes:
     - `https://www.googleapis.com/auth/drive.readonly` (for syncing FROM Drive)
     - `https://www.googleapis.com/auth/drive.file` (for uploading TO Drive)
   - Redirect URI: `https://portal.musicnme.com/api/v1/google/oauth/callback`

---

## Database Schema

### GoogleDriveFolder Model

Stores the mapping between portal entities (classes, students) and Google Drive folders.

```prisma
model GoogleDriveFolder {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Google Drive folder details
  driveFolderId   String  // Google Drive folder ID
  folderName      String  // Human-readable name
  folderUrl       String  // Direct link to folder

  // Mapping to portal entities
  lessonId        String? @unique
  lesson          Lesson? @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  studentId       String? @unique
  student         Student? @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Sync settings
  syncEnabled     Boolean @default(true)
  lastSyncAt      DateTime?
  syncStatus      SyncStatus @default(PENDING)
  syncError       String?

  // Files in this folder
  files           GoogleDriveFile[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([driveFolderId])
  @@index([lessonId])
  @@index([studentId])
  @@unique([schoolId, driveFolderId])
}

enum SyncStatus {
  PENDING       // Never synced
  SYNCING       // Sync in progress
  SYNCED        // Last sync successful
  ERROR         // Last sync failed
}
```

### GoogleDriveFile Model

Stores metadata about files synced from Google Drive.

```prisma
model GoogleDriveFile {
  id        String   @id @default(cuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Google Drive file details
  driveFileId     String  @unique  // Google Drive file ID
  fileName        String
  mimeType        String
  fileSize        Int?    // Bytes
  webViewLink     String  // Link to view in Drive
  webContentLink  String? // Direct download link
  thumbnailLink   String?
  modifiedTime    DateTime
  createdTime     DateTime

  // Portal mapping
  driveFolderId   String
  driveFolder     GoogleDriveFolder @relation(fields: [driveFolderId], references: [id], onDelete: Cascade)

  // Portal storage (for offline access)
  portalFileId    String?  // ID in DigitalOcean Spaces (optional)
  portalFileUrl   String?  // CDN URL for fast downloads

  // File metadata
  visibility      FileVisibility @default(ALL)
  tags            String[]  // ["sheet_music", "backing_track"]

  // Upload source
  uploadedBy      String?  // User ID if uploaded via portal
  uploadedVia     UploadSource @default(GOOGLE_DRIVE)

  // Deletion tracking
  deletedInDrive  Boolean @default(false)
  deletedAt       DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
  @@index([driveFileId])
  @@index([driveFolderId])
  @@index([uploadedBy])
}

enum FileVisibility {
  ALL                   // Students, parents, teachers
  TEACHERS_AND_PARENTS  // Visible to teachers and parents only
  TEACHERS_ONLY         // Visible to teachers only
}

enum UploadSource {
  GOOGLE_DRIVE  // Synced from Drive
  PORTAL        // Uploaded via portal (then pushed to Drive)
}
```

### GoogleDriveAuth Model

Stores OAuth tokens for Google Drive access.

```prisma
model GoogleDriveAuth {
  id            String   @id @default(cuid())
  schoolId      String   @unique
  school        School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  accessToken   String   // Encrypted
  refreshToken  String   // Encrypted
  expiresAt     DateTime

  scope         String   // Comma-separated scopes
  tokenType     String   @default("Bearer")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([schoolId])
}
```

---

## API Endpoints

### Google Drive Authentication

#### `GET /api/v1/google-drive/auth/url`
Get OAuth URL for admin to authorize Google Drive access.

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=..."
}
```

#### `GET /api/v1/google-drive/auth/callback`
OAuth callback endpoint (handles authorization code exchange).

**Query Params:**
- `code`: Authorization code from Google
- `state`: CSRF token

**Side Effects:**
- Exchanges code for access/refresh tokens
- Stores tokens in `GoogleDriveAuth` table (encrypted)
- Redirects admin to success page

#### `POST /api/v1/google-drive/auth/revoke`
Revoke Google Drive access.

**Response:**
```json
{
  "message": "Google Drive access revoked successfully"
}
```

---

### Folder Browsing & Mapping

#### `GET /api/v1/google-drive/folders`
Browse Google Drive folders (using Google Picker API).

**Query Params:**
- `parentId` (optional): Folder ID to browse (if not provided, shows root)
- `query` (optional): Search query

**Response:**
```json
{
  "folders": [
    {
      "id": "1a2b3c4d5e6f",
      "name": "Piano Foundation 1",
      "parentId": "root",
      "webViewLink": "https://drive.google.com/drive/folders/1a2b3c4d5e6f"
    },
    {
      "id": "9z8y7x6w5v4u",
      "name": "Emma Smith - Piano",
      "parentId": "root",
      "webViewLink": "https://drive.google.com/drive/folders/9z8y7x6w5v4u"
    }
  ]
}
```

#### `POST /api/v1/google-drive/folders/link`
Link a Google Drive folder to a class or student.

**Request:**
```json
{
  "driveFolderId": "1a2b3c4d5e6f",
  "folderName": "Piano Foundation 1",
  "lessonId": "lesson_123"  // OR studentId: "student_456"
}
```

**Response:**
```json
{
  "id": "gdf_abc123",
  "message": "Google Drive folder linked successfully",
  "syncStatus": "PENDING"
}
```

**Side Effects:**
- Creates `GoogleDriveFolder` record
- Triggers immediate sync job

#### `GET /api/v1/google-drive/folders/mappings`
List all folder mappings for the school.

**Response:**
```json
{
  "mappings": [
    {
      "id": "gdf_abc123",
      "driveFolderId": "1a2b3c4d5e6f",
      "folderName": "Piano Foundation 1",
      "folderUrl": "https://drive.google.com/drive/folders/1a2b3c4d5e6f",
      "lesson": {
        "id": "lesson_123",
        "name": "Piano Foundation 1",
        "instructor": "Ms. Johnson"
      },
      "syncEnabled": true,
      "lastSyncAt": "2025-01-15T10:30:00Z",
      "syncStatus": "SYNCED",
      "fileCount": 12
    },
    {
      "id": "gdf_xyz789",
      "driveFolderId": "9z8y7x6w5v4u",
      "folderName": "Emma Smith - Piano",
      "folderUrl": "https://drive.google.com/drive/folders/9z8y7x6w5v4u",
      "student": {
        "id": "student_456",
        "name": "Emma Smith",
        "primaryInstrument": "Piano"
      },
      "syncEnabled": true,
      "lastSyncAt": "2025-01-15T10:30:00Z",
      "syncStatus": "SYNCED",
      "fileCount": 5
    }
  ]
}
```

#### `DELETE /api/v1/google-drive/folders/:id`
Unlink a Google Drive folder.

**Response:**
```json
{
  "message": "Google Drive folder unlinked successfully"
}
```

**Side Effects:**
- Deletes `GoogleDriveFolder` record
- DOES NOT delete files in Google Drive (only unlinks)
- Optionally: soft-delete synced files in portal (mark as `deletedInDrive: true`)

---

### File Management

#### `GET /api/v1/google-drive/files`
List files from Google Drive folders (synced to portal).

**Query Params:**
- `lessonId` (optional): Filter by class
- `studentId` (optional): Filter by student
- `visibility` (optional): Filter by visibility
- `tags` (optional): Filter by tags (comma-separated)

**Response:**
```json
{
  "files": [
    {
      "id": "gdf_file_123",
      "driveFileId": "file_abc123",
      "fileName": "Für Elise - Sheet Music.pdf",
      "mimeType": "application/pdf",
      "fileSize": 524288,
      "webViewLink": "https://drive.google.com/file/d/file_abc123/view",
      "thumbnailLink": "https://drive.google.com/thumbnail?id=file_abc123",
      "modifiedTime": "2025-01-14T15:30:00Z",
      "visibility": "ALL",
      "tags": ["sheet_music"],
      "uploadedBy": {
        "id": "teacher_789",
        "name": "Ms. Johnson"
      },
      "uploadedVia": "GOOGLE_DRIVE",
      "lesson": {
        "id": "lesson_123",
        "name": "Piano Foundation 1"
      }
    }
    // ... more files
  ],
  "total": 25
}
```

#### `POST /api/v1/google-drive/files/upload`
Upload a file via portal (will be pushed to Google Drive).

**Request:** `multipart/form-data`
```
file: [binary]
lessonId: "lesson_123"  // OR studentId: "student_456"
visibility: "ALL"
tags: "sheet_music,beginner"
```

**Response:**
```json
{
  "id": "gdf_file_456",
  "driveFileId": "file_xyz789",
  "fileName": "Scales Practice.pdf",
  "message": "File uploaded successfully and synced to Google Drive",
  "webViewLink": "https://drive.google.com/file/d/file_xyz789/view"
}
```

**Side Effects:**
- Uploads file to Google Drive folder (linked to lesson/student)
- Creates `GoogleDriveFile` record
- Optionally: stores copy in DigitalOcean Spaces for fast CDN delivery

#### `PATCH /api/v1/google-drive/files/:id`
Update file metadata (visibility, tags).

**Request:**
```json
{
  "visibility": "TEACHERS_AND_PARENTS",
  "tags": ["sheet_music", "intermediate"]
}
```

**Response:**
```json
{
  "id": "gdf_file_123",
  "visibility": "TEACHERS_AND_PARENTS",
  "tags": ["sheet_music", "intermediate"]
}
```

**Note:** This updates portal metadata only (not Google Drive file metadata).

#### `DELETE /api/v1/google-drive/files/:id`
Delete a file (removes from both portal and Google Drive).

**Response:**
```json
{
  "message": "File deleted successfully from portal and Google Drive"
}
```

**Side Effects:**
- Deletes file from Google Drive
- Marks `deletedInDrive: true` in portal
- DOES NOT hard-delete from database (for audit trail)

---

### Sync Management

#### `POST /api/v1/google-drive/sync/trigger`
Manually trigger a sync for all folders or specific folder.

**Request:**
```json
{
  "folderId": "gdf_abc123"  // Optional, if not provided syncs all
}
```

**Response:**
```json
{
  "message": "Sync job queued successfully",
  "jobId": "sync_job_123"
}
```

#### `GET /api/v1/google-drive/sync/status`
Check sync status.

**Response:**
```json
{
  "lastSyncAt": "2025-01-15T10:30:00Z",
  "nextSyncAt": "2025-01-15T10:45:00Z",
  "folders": [
    {
      "id": "gdf_abc123",
      "folderName": "Piano Foundation 1",
      "syncStatus": "SYNCED",
      "lastSyncAt": "2025-01-15T10:30:00Z",
      "filesAdded": 2,
      "filesUpdated": 1,
      "filesDeleted": 0
    }
  ]
}
```

---

## Sync Service Implementation

### Background Job (Bull Queue)

**Job Name:** `google-drive-sync`

**Frequency:** Every 15 minutes (cron: `*/15 * * * *`)

**Process:**
```typescript
async function syncGoogleDriveFolders(schoolId: string) {
  // 1. Get all linked folders for school
  const folders = await prisma.googleDriveFolder.findMany({
    where: { schoolId, syncEnabled: true },
  });

  for (const folder of folders) {
    try {
      await syncFolder(folder);
    } catch (error) {
      await prisma.googleDriveFolder.update({
        where: { id: folder.id },
        data: {
          syncStatus: 'ERROR',
          syncError: error.message,
        },
      });
    }
  }
}

async function syncFolder(folder: GoogleDriveFolder) {
  // Update status to SYNCING
  await prisma.googleDriveFolder.update({
    where: { id: folder.id },
    data: { syncStatus: 'SYNCING' },
  });

  // 2. Get access token
  const auth = await getGoogleDriveAuth(folder.schoolId);
  const drive = google.drive({ version: 'v3', auth });

  // 3. List all files in Google Drive folder
  const response = await drive.files.list({
    q: `'${folder.driveFolderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime, createdTime)',
    pageSize: 100,
  });

  const driveFiles = response.data.files || [];
  const driveFileIds = new Set(driveFiles.map((f) => f.id));

  // 4. Get existing files in portal
  const existingFiles = await prisma.googleDriveFile.findMany({
    where: { driveFolderId: folder.id },
  });
  const existingFileIds = new Set(existingFiles.map((f) => f.driveFileId));

  // 5. Find new files (in Drive but not in portal)
  const newFiles = driveFiles.filter((f) => !existingFileIds.has(f.id));

  // 6. Find updated files (modified time changed)
  const updatedFiles = driveFiles.filter((driveFile) => {
    const existingFile = existingFiles.find((ef) => ef.driveFileId === driveFile.id);
    return (
      existingFile &&
      new Date(driveFile.modifiedTime) > existingFile.modifiedTime
    );
  });

  // 7. Find deleted files (in portal but not in Drive)
  const deletedFiles = existingFiles.filter((f) => !driveFileIds.has(f.driveFileId));

  // 8. Process new files
  for (const driveFile of newFiles) {
    await createPortalFile(driveFile, folder);
  }

  // 9. Process updated files
  for (const driveFile of updatedFiles) {
    await updatePortalFile(driveFile, folder);
  }

  // 10. Process deleted files
  for (const deletedFile of deletedFiles) {
    await markFileAsDeleted(deletedFile);
  }

  // 11. Update sync status
  await prisma.googleDriveFolder.update({
    where: { id: folder.id },
    data: {
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
      syncError: null,
    },
  });

  console.log(`Synced folder ${folder.folderName}: +${newFiles.length} new, ~${updatedFiles.length} updated, -${deletedFiles.length} deleted`);
}
```

### Helper Functions

```typescript
async function createPortalFile(driveFile: any, folder: GoogleDriveFolder) {
  // Optionally: download file and store in DigitalOcean Spaces for CDN
  const portalFileUrl = await downloadAndStoreInSpaces(driveFile);

  await prisma.googleDriveFile.create({
    data: {
      driveFileId: driveFile.id,
      fileName: driveFile.name,
      mimeType: driveFile.mimeType,
      fileSize: parseInt(driveFile.size || '0'),
      webViewLink: driveFile.webViewLink,
      webContentLink: driveFile.webContentLink,
      thumbnailLink: driveFile.thumbnailLink,
      modifiedTime: new Date(driveFile.modifiedTime),
      createdTime: new Date(driveFile.createdTime),
      driveFolderId: folder.id,
      schoolId: folder.schoolId,
      portalFileUrl,
      uploadedVia: 'GOOGLE_DRIVE',
      visibility: 'ALL', // Default, can be changed by teacher
    },
  });
}

async function updatePortalFile(driveFile: any, folder: GoogleDriveFolder) {
  await prisma.googleDriveFile.update({
    where: { driveFileId: driveFile.id },
    data: {
      fileName: driveFile.name,
      modifiedTime: new Date(driveFile.modifiedTime),
      webViewLink: driveFile.webViewLink,
      webContentLink: driveFile.webContentLink,
    },
  });
}

async function markFileAsDeleted(file: GoogleDriveFile) {
  await prisma.googleDriveFile.update({
    where: { id: file.id },
    data: {
      deletedInDrive: true,
      deletedAt: new Date(),
    },
  });
}

async function downloadAndStoreInSpaces(driveFile: any): Promise<string> {
  // Optional optimization: store file in Spaces for fast CDN delivery
  const auth = await getGoogleDriveAuth(driveFile.schoolId);
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.get(
    { fileId: driveFile.id, alt: 'media' },
    { responseType: 'stream' }
  );

  const s3 = new AWS.S3({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  });

  const uploadParams = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: `files/${driveFile.id}/${driveFile.name}`,
    Body: response.data,
    ACL: 'private',
  };

  const result = await s3.upload(uploadParams).promise();
  return result.Location; // CDN URL
}
```

### Portal Upload to Google Drive

```typescript
async function uploadFileToGoogleDrive(params: {
  schoolId: string;
  file: Express.Multer.File;
  lessonId?: string;
  studentId?: string;
  visibility: FileVisibility;
  tags?: string[];
  uploadedBy: string;
}) {
  // 1. Find linked Google Drive folder
  const driveFolder = await prisma.googleDriveFolder.findFirst({
    where: {
      schoolId: params.schoolId,
      ...(params.lessonId && { lessonId: params.lessonId }),
      ...(params.studentId && { studentId: params.studentId }),
    },
  });

  if (!driveFolder) {
    throw new Error('No Google Drive folder linked to this class/student');
  }

  // 2. Get Google Drive auth
  const auth = await getGoogleDriveAuth(params.schoolId);
  const drive = google.drive({ version: 'v3', auth });

  // 3. Upload file to Google Drive
  const fileMetadata = {
    name: params.file.originalname,
    parents: [driveFolder.driveFolderId],
  };

  const media = {
    mimeType: params.file.mimetype,
    body: fs.createReadStream(params.file.path),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, modifiedTime, createdTime',
  });

  const driveFile = response.data;

  // 4. Create portal record
  const portalFile = await prisma.googleDriveFile.create({
    data: {
      driveFileId: driveFile.id!,
      fileName: driveFile.name!,
      mimeType: driveFile.mimeType!,
      fileSize: parseInt(driveFile.size || '0'),
      webViewLink: driveFile.webViewLink!,
      webContentLink: driveFile.webContentLink,
      modifiedTime: new Date(driveFile.modifiedTime!),
      createdTime: new Date(driveFile.createdTime!),
      driveFolderId: driveFolder.id,
      schoolId: params.schoolId,
      visibility: params.visibility,
      tags: params.tags || [],
      uploadedBy: params.uploadedBy,
      uploadedVia: 'PORTAL',
    },
  });

  // 5. Clean up temporary file
  fs.unlinkSync(params.file.path);

  return portalFile;
}
```

---

## Frontend Components

### Admin Folder Linking

**Route:** `/admin/google-drive/folders`

**Components:**
- `GoogleDriveFolderBrowser.tsx`
  - Integrates Google Picker API
  - Shows folder hierarchy
  - Search functionality
  - Select folder button
- `FolderMappingList.tsx`
  - Table of all linked folders
  - Columns: Folder name, Linked to (Class/Student), Sync status, Last sync
  - Actions: View files, Sync now, Unlink
- `LinkFolderModal.tsx`
  - Select entity type: Class or Student
  - Dropdown to select class/student
  - Browse/search Drive folders
  - Link button

### Teacher File Upload

**Route:** `/teacher/files` or within lesson detail page

**Components:**
- `FileUploadForm.tsx`
  - Drag-and-drop file upload
  - Select class or student
  - Set visibility (ALL, TEACHERS_AND_PARENTS, TEACHERS_ONLY)
  - Add tags (checkboxes: sheet music, backing track, recording, assignment)
  - Upload button
  - Progress bar
- `FileList.tsx`
  - Grid/list view of files
  - Filter by class, student, visibility, tags
  - Actions: Edit metadata, Delete
  - Sync status indicator (synced, pending, error)

### Student/Parent File Access

**Route:** `/student/files` or `/parent/files`

**Components:**
- `FileGallery.tsx`
  - Grid view with thumbnails (for images/videos)
  - List view (for documents)
  - Filter by class, tag
  - Download button
  - Preview button (opens Google Drive viewer)
- `FileDownloadTracker.tsx`
  - Logs download events for analytics

---

## Security & Permissions

### Access Control

**Admin:**
- Link/unlink Google Drive folders
- View all files
- Upload files to any class/student
- Delete any file
- Trigger manual sync

**Teacher:**
- View all files (within their school)
- Upload files to any class/student
- Edit metadata (visibility, tags) for files they uploaded
- Delete files they uploaded

**Parent:**
- View files with visibility: ALL or TEACHERS_AND_PARENTS
- Filter by their children's classes
- Download files
- Cannot upload or delete

**Student:**
- View files with visibility: ALL
- Filter by their enrolled classes
- Download files
- Cannot upload or delete

### File Visibility Logic

```typescript
function canUserAccessFile(user: User, file: GoogleDriveFile): boolean {
  // Admin can access all files
  if (user.role === 'ADMIN') return true;

  // Teachers can access all files
  if (user.role === 'TEACHER') {
    if (file.visibility === 'TEACHERS_ONLY') return true;
    if (file.visibility === 'TEACHERS_AND_PARENTS') return true;
    if (file.visibility === 'ALL') return true;
  }

  // Parents can access TEACHERS_AND_PARENTS and ALL
  if (user.role === 'PARENT') {
    if (file.visibility === 'TEACHERS_ONLY') return false;
    if (file.visibility === 'TEACHERS_AND_PARENTS') return true;
    if (file.visibility === 'ALL') return true;
  }

  // Students can only access ALL
  if (user.role === 'STUDENT') {
    if (file.visibility === 'ALL') return true;
    return false;
  }

  return false;
}
```

---

## Error Handling

### Common Errors

1. **OAuth Token Expired**
   - Auto-refresh using refresh token
   - If refresh fails, notify admin to re-authorize

2. **Google Drive API Rate Limit**
   - Implement exponential backoff
   - Retry failed sync jobs
   - Show warning in admin dashboard

3. **File Too Large**
   - Limit file uploads to 25MB
   - Show error message: "File too large. Max size: 25MB"

4. **Folder Not Found**
   - Folder was deleted in Google Drive
   - Mark mapping as error
   - Notify admin to re-link folder

5. **Permission Denied**
   - Service account doesn't have access to folder
   - Show error: "Permission denied. Please grant access to folder."

---

## Performance Optimization

### Caching

- **Folder listings**: Cache for 5 minutes
- **File metadata**: Cache for 15 minutes
- **Access tokens**: Cache until expiry

### Batch Operations

- Sync multiple folders in parallel (max 5 concurrent)
- Batch file uploads to DigitalOcean Spaces

### CDN Delivery

- Store frequently accessed files in DigitalOcean Spaces
- Serve files via CDN (faster than Google Drive API)
- Fallback to Google Drive if file not in Spaces

---

## Testing Strategy

### Unit Tests
- OAuth token refresh logic
- File visibility filtering
- Sync logic (new, updated, deleted files)

### Integration Tests
- Full sync flow (Google Drive → Portal)
- Portal upload → Google Drive push
- File deletion in Drive → Portal marks as deleted

### E2E Tests
- Admin links folder → Sync runs → Files appear in portal
- Teacher uploads file → File synced to Drive → Student downloads

---

## Monitoring & Alerts

### Metrics to Track
- Sync success rate (% of successful syncs)
- Sync duration (time per folder)
- Files synced per day
- API quota usage (Google Drive API)
- Storage usage (DigitalOcean Spaces)

### Alerts
- Sync failed > 3 times → Email admin
- OAuth token expired → Email admin to re-authorize
- API quota > 80% → Email developer
- Sync duration > 5 minutes → Investigate slow sync

---

## Future Enhancements (Phase 2)

- **Real-time sync** (using Google Drive Push Notifications / Webhooks)
- **Automatic folder creation** (when new class created, auto-create Drive folder)
- **Bulk file operations** (upload multiple files at once)
- **File version history** (track file changes over time)
- **Student file uploads** (for assignments)
- **Shared folders between classes** (e.g., all piano classes share a "Piano Resources" folder)
- **Google Docs/Sheets integration** (embed documents in portal)
- **Video streaming** (optimize video playback from Drive)
