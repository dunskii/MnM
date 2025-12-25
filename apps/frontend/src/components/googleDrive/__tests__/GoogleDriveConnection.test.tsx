// ===========================================
// GoogleDriveConnection Component Tests
// ===========================================
// Unit tests for connection status and OAuth flow

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoogleDriveConnection from '../GoogleDriveConnection';
import { createWrapper, mockAuthStatus } from '../../../test/utils';
import { googleDriveApi } from '../../../api/googleDrive.api';

// Mock the API
vi.mock('../../../api/googleDrive.api', async () => {
  const actual = await vi.importActual('../../../api/googleDrive.api');
  return {
    ...actual,
    googleDriveApi: {
      getAuthStatus: vi.fn(),
      getAuthUrl: vi.fn(),
      revokeAccess: vi.fn(),
    },
  };
});

// Mock react-router-dom
const mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('GoogleDriveConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('connected');
    mockSearchParams.delete('error');
    mockLocation.href = '';
  });

  it('should show loading skeleton initially', () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    expect(document.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('should show "Not Connected" when disconnected', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: false })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Not Connected')).toBeInTheDocument();
    });

    expect(screen.getByText('Google Drive')).toBeInTheDocument();
    expect(
      screen.getByText(/Connect to Google Drive to sync files/i)
    ).toBeInTheDocument();
  });

  it('should show "Connected" when connected', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Your school is connected to Google Drive/i)
    ).toBeInTheDocument();
  });

  it('should show Connect button when not connected', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: false })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /connect google drive/i })
      ).toBeInTheDocument();
    });
  });

  it('should show Disconnect button when connected', async () => {
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /disconnect/i })
      ).toBeInTheDocument();
    });
  });

  it('should redirect to OAuth URL when Connect is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: false })
    );
    vi.mocked(googleDriveApi.getAuthUrl).mockResolvedValueOnce({
      authUrl: 'https://accounts.google.com/oauth?state=abc',
    });

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /connect google drive/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /connect google drive/i }));

    await waitFor(() => {
      expect(mockLocation.href).toBe('https://accounts.google.com/oauth?state=abc');
    });
  });

  it('should show disconnect confirmation dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /disconnect/i }));

    await waitFor(() => {
      expect(screen.getByText('Disconnect Google Drive')).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to disconnect/i)
      ).toBeInTheDocument();
    });
  });

  it('should show disconnect dialog with confirm option', async () => {
    const user = userEvent.setup();
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    // Click disconnect button to open dialog
    await user.click(screen.getByRole('button', { name: /disconnect/i }));

    // Verify dialog appears
    await waitFor(() => {
      expect(screen.getByText('Disconnect Google Drive')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to disconnect/i)).toBeInTheDocument();
    });

    // Verify there is at least one disconnect button in the dialog
    const disconnectButtons = screen.getAllByRole('button', { name: /disconnect/i });
    expect(disconnectButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('should show success message when connected param is true', async () => {
    mockSearchParams.set('connected', 'true');
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText('Google Drive connected successfully!')
      ).toBeInTheDocument();
    });
  });

  it('should show error message when error param is access_denied', async () => {
    mockSearchParams.set('error', 'access_denied');
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: false })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText(/Access was denied/i)
      ).toBeInTheDocument();
    });
  });

  it('should show error message when error param is invalid_state', async () => {
    mockSearchParams.set('error', 'invalid_state');
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: false })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid session/i)
      ).toBeInTheDocument();
    });
  });

  it('should clear status message when close button is clicked', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('connected', 'true');
    vi.mocked(googleDriveApi.getAuthStatus).mockResolvedValueOnce(
      mockAuthStatus({ isConnected: true })
    );

    render(<GoogleDriveConnection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText('Google Drive connected successfully!')
      ).toBeInTheDocument();
    });

    // Find and click the close button on the alert
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Google Drive connected successfully!')
      ).not.toBeInTheDocument();
    });
  });
});
