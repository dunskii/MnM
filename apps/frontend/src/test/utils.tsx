// ===========================================
// Test Utilities
// ===========================================
// Helper functions and providers for testing

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';

// ===========================================
// THEME
// ===========================================

const theme = createTheme({
  palette: {
    primary: { main: '#4580E4' },
    secondary: { main: '#FFCE00' },
  },
});

// ===========================================
// QUERY CLIENT
// ===========================================

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ===========================================
// WRAPPER PROVIDERS
// ===========================================

interface WrapperProps {
  children: ReactNode;
}

export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();

  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={client}>
        <ThemeProvider theme={theme}>
          <SnackbarProvider maxSnack={3}>
            <BrowserRouter>{children}</BrowserRouter>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };
}

// ===========================================
// CUSTOM RENDER
// ===========================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};
  const Wrapper = createWrapper(queryClient);

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

// ===========================================
// MOCK DATA FACTORIES
// ===========================================

export const mockDriveFolder = (overrides = {}) => ({
  id: 'folder-1',
  name: 'Test Folder',
  parentId: null,
  webViewLink: 'https://drive.google.com/folder/1',
  ...overrides,
});

export const mockFolderMapping = (overrides = {}) => ({
  id: 'mapping-1',
  driveFolderId: 'folder-1',
  folderName: 'Test Folder',
  folderUrl: 'https://drive.google.com/folder/1',
  syncEnabled: true,
  syncStatus: 'SYNCED' as const,
  lastSyncAt: new Date().toISOString(),
  syncError: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lesson: {
    id: 'lesson-1',
    name: 'Piano Beginners',
    teacher: {
      user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
    },
  },
  student: null,
  _count: { files: 5 },
  ...overrides,
});

export const mockGoogleDriveFile = (overrides = {}) => ({
  id: 'file-1',
  driveFileId: 'drive-file-1',
  fileName: 'test-document.pdf',
  mimeType: 'application/pdf',
  fileSize: 1024000,
  webViewLink: 'https://drive.google.com/file/1',
  thumbnailLink: null,
  visibility: 'ALL' as const,
  tags: ['homework', 'piano'],
  uploadedVia: 'GOOGLE_DRIVE' as const,
  deletedInDrive: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  uploadedBy: null,
  folder: {
    id: 'mapping-1',
    folderName: 'Test Folder',
    syncStatus: 'SYNCED' as const,
    lesson: { id: 'lesson-1', name: 'Piano Beginners' },
    student: null,
  },
  ...overrides,
});

export const mockAuthStatus = (overrides = {}) => ({
  isConnected: true,
  ...overrides,
});

export const mockSyncStatus = (overrides = {}) => ({
  lastSyncAt: new Date().toISOString(),
  nextSyncAt: new Date(Date.now() + 3600000).toISOString(),
  inProgress: false,
  folders: [],
  ...overrides,
});

export const mockStorageStats = (overrides = {}) => ({
  totalFiles: 100,
  totalSize: 104857600, // 100 MB
  byMimeType: {
    'application/pdf': 50,
    'image/jpeg': 30,
    'audio/mpeg': 20,
  },
  byVisibility: {
    ALL: 60,
    TEACHERS_AND_PARENTS: 30,
    TEACHERS_ONLY: 10,
  },
  ...overrides,
});
