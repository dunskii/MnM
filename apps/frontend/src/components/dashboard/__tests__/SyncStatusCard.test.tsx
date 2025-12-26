// ===========================================
// SyncStatusCard Component Tests
// ===========================================
// Unit tests for the Google Drive sync status card component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncStatusCard, DriveSyncStatus, SyncStatusType } from '../SyncStatusCard';
import { createWrapper } from '../../../test/utils';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SyncStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock status
  const createMockStatus = (overrides: Partial<DriveSyncStatus> = {}): DriveSyncStatus => ({
    isConnected: true,
    lastSyncAt: new Date().toISOString(),
    syncedFoldersCount: 5,
    errorCount: 0,
    status: 'healthy',
    ...overrides,
  });

  // ===========================================
  // RENDERING TESTS
  // ===========================================

  it('should render Google Drive title', () => {
    render(
      <SyncStatusCard status={createMockStatus()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Google Drive')).toBeInTheDocument();
  });

  it('should render status chip', () => {
    render(
      <SyncStatusCard status={createMockStatus({ status: 'healthy' })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  // ===========================================
  // STATUS TYPE TESTS
  // ===========================================

  it.each([
    ['healthy', 'Synced'],
    ['warning', 'Warning'],
    ['error', 'Error'],
    ['disconnected', 'Not Connected'],
  ] as [SyncStatusType, string][])('should render %s status with label "%s"', (status, label) => {
    render(
      <SyncStatusCard status={createMockStatus({ status })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('should render appropriate icon for healthy status', () => {
    render(
      <SyncStatusCard status={createMockStatus({ status: 'healthy' })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('CloudDoneIcon')).toBeInTheDocument();
  });

  it('should render warning icon for warning status', () => {
    render(
      <SyncStatusCard status={createMockStatus({ status: 'warning' })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
  });

  it('should render error icon for error status', () => {
    render(
      <SyncStatusCard status={createMockStatus({ status: 'error' })} />,
      { wrapper: createWrapper() }
    );

    // Multiple error icons may be present, just check at least one exists
    expect(screen.getAllByTestId('ErrorIcon').length).toBeGreaterThan(0);
  });

  it('should render disconnected icon when not connected', () => {
    render(
      <SyncStatusCard status={createMockStatus({ isConnected: false, status: 'disconnected' })} />,
      { wrapper: createWrapper() }
    );

    // Multiple icons may be present, just check at least one exists
    expect(screen.getAllByTestId('CloudQueueIcon').length).toBeGreaterThan(0);
  });

  // ===========================================
  // CONNECTED STATE TESTS
  // ===========================================

  it('should show last sync time when connected', () => {
    render(
      <SyncStatusCard status={createMockStatus()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Last sync:/)).toBeInTheDocument();
  });

  it('should show folder count when connected', () => {
    render(
      <SyncStatusCard status={createMockStatus({ syncedFoldersCount: 3 })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('3 folders linked')).toBeInTheDocument();
  });

  it('should use singular "folder" when count is 1', () => {
    render(
      <SyncStatusCard status={createMockStatus({ syncedFoldersCount: 1 })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('1 folder linked')).toBeInTheDocument();
  });

  it('should show "Manage Sync" button when connected', () => {
    render(
      <SyncStatusCard status={createMockStatus()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: /Manage Sync/i })).toBeInTheDocument();
  });

  // ===========================================
  // DISCONNECTED STATE TESTS
  // ===========================================

  it('should show connect message when disconnected', () => {
    render(
      <SyncStatusCard status={createMockStatus({ isConnected: false, status: 'disconnected' })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Connect to sync files with Google Drive')).toBeInTheDocument();
  });

  it('should show "Connect Drive" button when disconnected', () => {
    render(
      <SyncStatusCard status={createMockStatus({ isConnected: false, status: 'disconnected' })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: /Connect Drive/i })).toBeInTheDocument();
  });

  // ===========================================
  // ERROR COUNT TESTS
  // ===========================================

  it('should show error count when errors exist', () => {
    render(
      <SyncStatusCard status={createMockStatus({ errorCount: 3 })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('3 errors')).toBeInTheDocument();
  });

  it('should use singular "error" when count is 1', () => {
    render(
      <SyncStatusCard status={createMockStatus({ errorCount: 1 })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('1 error')).toBeInTheDocument();
  });

  it('should not show error text when no errors', () => {
    render(
      <SyncStatusCard status={createMockStatus({ errorCount: 0 })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText(/\d+ error/)).not.toBeInTheDocument();
  });

  // ===========================================
  // LOADING STATE TESTS
  // ===========================================

  it('should show skeletons when loading', () => {
    const { container } = render(
      <SyncStatusCard status={null} loading={true} />,
      { wrapper: createWrapper() }
    );

    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not show content when loading', () => {
    render(
      <SyncStatusCard status={createMockStatus()} loading={true} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Google Drive')).not.toBeInTheDocument();
  });

  // ===========================================
  // NULL STATUS TESTS
  // ===========================================

  it('should show disconnected state when status is null', () => {
    render(
      <SyncStatusCard status={null} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Not Connected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect Drive/i })).toBeInTheDocument();
  });

  // ===========================================
  // NAVIGATION TESTS
  // ===========================================

  it('should navigate to google-drive page when Manage Sync clicked', async () => {
    const user = userEvent.setup();

    render(
      <SyncStatusCard status={createMockStatus()} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole('button', { name: /Manage Sync/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/google-drive');
  });

  it('should navigate to google-drive page when Connect Drive clicked', async () => {
    const user = userEvent.setup();

    render(
      <SyncStatusCard status={createMockStatus({ isConnected: false, status: 'disconnected' })} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole('button', { name: /Connect Drive/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/google-drive');
  });

  it('should call onViewDetails when provided instead of navigating', async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    render(
      <SyncStatusCard status={createMockStatus()} onViewDetails={onViewDetails} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole('button', { name: /Manage Sync/i }));

    expect(onViewDetails).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should call onConnect when provided instead of navigating', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();

    render(
      <SyncStatusCard
        status={createMockStatus({ isConnected: false, status: 'disconnected' })}
        onConnect={onConnect}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole('button', { name: /Connect Drive/i }));

    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ===========================================
  // COMPACT MODE TESTS
  // ===========================================

  it('should render compact version', () => {
    render(
      <SyncStatusCard status={createMockStatus()} compact />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Google Drive')).toBeInTheDocument();
    // "Synced" may appear in multiple places (text and chip)
    expect(screen.getAllByText('Synced').length).toBeGreaterThan(0);
  });

  it('should not show buttons in compact mode', () => {
    render(
      <SyncStatusCard status={createMockStatus()} compact />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should not show last sync time in compact mode', () => {
    render(
      <SyncStatusCard status={createMockStatus()} compact />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText(/Last sync:/)).not.toBeInTheDocument();
  });

  // ===========================================
  // TIMESTAMP FORMATTING TESTS
  // ===========================================

  it('should show "Never" when lastSyncAt is null', () => {
    render(
      <SyncStatusCard status={createMockStatus({ lastSyncAt: null })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Last sync: Never')).toBeInTheDocument();
  });

  it('should format lastSyncAt as relative time', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    render(
      <SyncStatusCard status={createMockStatus({ lastSyncAt: fiveMinutesAgo })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Last sync:.*minutes? ago/)).toBeInTheDocument();
  });

  it('should show "Unknown" for invalid timestamp', () => {
    render(
      <SyncStatusCard status={createMockStatus({ lastSyncAt: 'invalid-date' })} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Last sync: Unknown')).toBeInTheDocument();
  });
});
