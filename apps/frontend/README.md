# Music 'n Me - Frontend

React frontend for the Music 'n Me platform.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Material-UI v5** - Component library
- **React Query** - Server state management
- **React Router** - Routing
- **Axios** - HTTP client
- **Notistack** - Toast notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:5000
```

## Project Structure

```
src/
├── api/              # API client functions
│   ├── auth.api.ts
│   ├── lessons.api.ts
│   ├── googleDrive.api.ts
│   └── ...
├── components/       # Reusable components
│   ├── googleDrive/  # Google Drive components
│   │   ├── GoogleDriveConnection.tsx
│   │   ├── FolderBrowser.tsx
│   │   ├── DriveFileUploader.tsx
│   │   └── ...
│   ├── layout/       # Layout components
│   └── common/       # Shared components
├── hooks/            # Custom React hooks
│   ├── useAuth.ts
│   ├── useLessons.ts
│   ├── useGoogleDrive.ts
│   └── ...
├── pages/            # Page components
│   ├── LoginPage.tsx
│   ├── AdminDashboardPage.tsx
│   ├── ParentDashboardPage.tsx
│   └── ...
├── services/         # Service utilities
│   ├── api.ts        # Axios instance
│   └── auth.ts       # Auth helpers
├── theme/            # MUI theme configuration
├── utils/            # Utility functions
│   └── fileIcons.tsx # File icon mapping
├── App.tsx           # Root component
└── main.tsx          # Entry point
```

## Google Drive Components

### Connection Management

- **GoogleDriveConnection.tsx** - OAuth flow and connection status
  - Connect/disconnect Google Drive
  - Visual status indicators
  - Error handling

### Folder Management

- **FolderBrowser.tsx** - Browse Google Drive folders
  - Search and filter folders
  - Navigate folder hierarchy
  - Select folders for linking

- **LinkFolderDialog.tsx** - Link folders to lessons/students
  - Validation (lesson XOR student)
  - Automatic sync trigger

### File Management

- **DriveFileUploader.tsx** - Upload files with drag-and-drop
  - Progress tracking
  - Visibility settings
  - Tag management

- **FileMetadataEditor.tsx** - Edit file metadata
  - Update visibility
  - Manage tags
  - Delete files

- **FileList.tsx** - Display files in grid/list view
  - Filter by lesson, student, visibility, tags
  - Sort by name, date, size
  - Search functionality

- **FileCard.tsx** - Grid view file card
  - Thumbnail display
  - Quick actions
  - Sync status

- **FileDownloadCard.tsx** - Simplified view for parents/students
  - Read-only display
  - Download and view links

- **VirtualizedFileGrid.tsx** - Optimized grid for large lists
  - Renders only visible items
  - Smooth scrolling with 1000+ files

### Status Monitoring

- **SyncStatusBadge.tsx** - Real-time sync status
  - Color-coded indicators
  - Auto-refresh (30s)
  - Error details

### Panels

- **TeacherResourcesPanel.tsx** - Lesson resources panel
  - Embedded in lesson detail page
  - Upload and manage files
  - Context-aware

## Hooks

### useGoogleDrive

Custom hooks for Google Drive operations:

**Auth Hooks:**
- `useGoogleDriveAuthStatus()` - Connection status
- `useGoogleDriveAuthUrl()` - Get OAuth URL
- `useRevokeGoogleDriveAccess()` - Disconnect

**Folder Hooks:**
- `useBrowseFolders()` - Browse folders
- `useFolderMappings()` - Get mappings
- `useLinkFolder()` - Link folder
- `useUpdateFolderSettings()` - Update settings
- `useUnlinkFolder()` - Unlink folder
- `useResetFolderSync()` - Reset sync status

**File Hooks:**
- `useGoogleDriveFiles()` - Get files with filters
- `useGoogleDriveFile()` - Get single file
- `useUploadDriveFile()` - Upload file
- `useUpdateDriveFile()` - Update metadata
- `useDeleteDriveFile()` - Delete file

**Sync Hooks:**
- `useSyncStatus()` - Overall sync status
- `useJobStatus()` - Job progress
- `useTriggerSync()` - Manual sync

**Stats Hooks:**
- `useStorageStats()` - Storage statistics

## API Client

### googleDrive.api.ts

18 endpoint methods:

**OAuth:**
- `getAuthUrl()`
- `getAuthStatus()`
- `revokeAccess()`

**Folders:**
- `browseFolders()`
- `getMappings()`
- `linkFolder()`
- `updateFolderSettings()`
- `unlinkFolder()`
- `resetFolderSync()`

**Files:**
- `getFiles()`
- `getFileById()`
- `uploadFile()`
- `updateFile()`
- `deleteFile()`

**Sync:**
- `getSyncStatus()`
- `triggerSync()`
- `getJobStatus()`

**Stats:**
- `getStats()`

## Utilities

### fileIcons.tsx

Maps MIME types to Material-UI icons:

```typescript
import { getFileIconName } from '@/utils/fileIcons';

const iconName = getFileIconName('application/pdf'); // 'PictureAsPdf'
```

Supported types:
- Images (Image)
- Audio (AudioFile)
- Video (VideoFile)
- PDFs (PictureAsPdf)
- Spreadsheets (TableChart)
- Presentations (Slideshow)
- Documents (Description)
- Fallback (InsertDriveFile)

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- FileList.test.tsx

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Run Google Drive tests
npm test -- src/components/googleDrive
```

### Test Coverage

Current coverage:
- **Google Drive Components:** 100% (176 tests)
- **Utilities:** 100%

Test files:
- `GoogleDriveConnection.test.tsx` (15 tests)
- `FolderBrowser.test.tsx` (18 tests)
- `LinkFolderDialog.test.tsx` (16 tests)
- `DriveFileUploader.test.tsx` (14 tests)
- `FileMetadataEditor.test.tsx` (12 tests)
- `FileList.test.tsx` (20 tests)
- `FileCard.test.tsx` (14 tests)
- `FileDownloadCard.test.tsx` (10 tests)
- `VirtualizedFileGrid.test.tsx` (12 tests)
- `SyncStatusBadge.test.tsx` (10 tests)
- `TeacherResourcesPanel.test.tsx` (15 tests)
- `fileIcons.test.tsx` (20 tests)

## Brand Guidelines

### Colors

Official Music 'n Me brand colors:

```typescript
primary: {
  main: '#4580E4',    // Blue
  light: '#a3d9f6',   // Light blue
  dark: '#3899ec'     // Dark blue
}
secondary: {
  main: '#FFCE00'     // Yellow
}
accent: {
  mint: '#96DAC9',    // Mint/Teal
  coral: '#FFAE9E',   // Pink/Coral
  cream: '#FCF6E6'    // Cream/Beige
}
```

### Typography

- **Headings:** Monkey Mayhem (playful display font)
- **Body:** Avenir (clean sans-serif)
- **Fallback:** System fonts (Roboto, SF Pro, Segoe UI)

### Visual Style

- Flat design (no gradients or drop shadows)
- Color blocking for dimension
- Soft, rounded edges
- Simple, basic shapes

## Performance Optimizations

### Virtualization

Files lists virtualize when count exceeds 50:

```typescript
const VIRTUALIZATION_THRESHOLD = 50;
```

Benefits:
- Smooth scrolling with 1000+ files
- Reduced memory usage
- Faster initial render

### Debouncing

Search inputs debounce at 300ms:

```typescript
const DEBOUNCE_DELAY = 300; // milliseconds
```

### Caching

React Query cache strategies:

- **Auth Status:** 5-minute stale time
- **Folder Mappings:** 1-minute stale time
- **Files:** 1-minute stale time
- **Sync Status:** 30-second stale time + auto-refresh

## Security

### Role-Based Access Control

Components automatically filter content by role:

- **ADMIN:** Full access
- **TEACHER:** Upload, edit own files, view all
- **PARENT:** View filtered files (ALL, TEACHERS_AND_PARENTS)
- **STUDENT:** View ALL visibility files only

### Input Validation

- File size limit: 25MB
- MIME type validation
- Required fields enforced
- Visibility enum validation

### XSS Prevention

- React's built-in escaping
- Material-UI secure components
- No dangerouslySetInnerHTML usage

## Deployment

### Build

```bash
# Production build
npm run build

# Preview build
npm run preview
```

### Environment Variables

Production environment:

```env
VITE_API_URL=https://api.musicnme.com.au
```

### Hosting

Deploy to:
- DigitalOcean App Platform (recommended)
- Vercel
- Netlify
- Cloudflare Pages

## Code Quality

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

### Formatting

```bash
npm run format
```

## Contributing

### Code Standards

- Use TypeScript strict mode
- Follow React best practices
- Write tests for new components
- Update documentation

### Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic to custom hooks
- Use Material-UI components

### Testing Guidelines

- Test user interactions
- Mock API calls
- Test error states
- Achieve 80%+ coverage

## License

Proprietary - Music 'n Me

## Support

For issues or questions, contact the development team.
