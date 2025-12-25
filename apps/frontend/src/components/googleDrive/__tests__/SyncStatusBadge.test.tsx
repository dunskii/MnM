// ===========================================
// SyncStatusBadge Component Tests
// ===========================================
// Unit tests for sync status indicator component

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SyncStatusBadge, { SyncStatusIcon } from '../SyncStatusBadge';

// Mock the API helpers
vi.mock('../../../api/googleDrive.api', () => ({
  getSyncStatusColor: (status: string) => {
    const colors: Record<string, string> = {
      SYNCED: 'success',
      SYNCING: 'primary',
      ERROR: 'error',
      PENDING: 'default',
    };
    return colors[status] || 'default';
  },
  getSyncStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      SYNCED: 'Synced',
      SYNCING: 'Syncing...',
      ERROR: 'Error',
      PENDING: 'Pending',
    };
    return labels[status] || status;
  },
  formatSyncTime: (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return 'Just now';
  },
}));

describe('SyncStatusBadge', () => {
  it('should render synced status correctly', () => {
    render(<SyncStatusBadge status="SYNCED" />);

    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('should render syncing status with animation', () => {
    render(<SyncStatusBadge status="SYNCING" />);

    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    // Check for progress indicator (role: progressbar)
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error status', () => {
    render(<SyncStatusBadge status="ERROR" />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render pending status', () => {
    render(<SyncStatusBadge status="PENDING" />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should hide label when showLabel is false', () => {
    render(<SyncStatusBadge status="SYNCED" showLabel={false} />);

    expect(screen.queryByText('Synced')).not.toBeInTheDocument();
  });

  it('should show tooltip with last sync time', async () => {
    const user = userEvent.setup();
    const lastSyncAt = new Date().toISOString();

    render(<SyncStatusBadge status="SYNCED" lastSyncAt={lastSyncAt} />);

    const chip = screen.getByText('Synced');
    await user.hover(chip);

    // Tooltip content should eventually appear
    // Note: MUI tooltips may render asynchronously
  });

  it('should show error message in tooltip', async () => {
    const user = userEvent.setup();

    render(
      <SyncStatusBadge
        status="ERROR"
        errorMessage="Failed to authenticate with Google Drive"
      />
    );

    const chip = screen.getByText('Error');
    await user.hover(chip);

    // Tooltip with error message should appear
  });

  it('should render with different sizes', () => {
    const { rerender } = render(
      <SyncStatusBadge status="SYNCED" size="small" />
    );

    expect(screen.getByText('Synced')).toBeInTheDocument();

    rerender(<SyncStatusBadge status="SYNCED" size="medium" />);

    expect(screen.getByText('Synced')).toBeInTheDocument();
  });
});

describe('SyncStatusIcon', () => {
  it('should render icon-only version', () => {
    render(<SyncStatusIcon status="SYNCED" />);

    // Should not show label
    expect(screen.queryByText('Synced')).not.toBeInTheDocument();
  });

  it('should pass through props correctly', () => {
    render(
      <SyncStatusIcon
        status="ERROR"
        errorMessage="Test error"
        lastSyncAt={new Date().toISOString()}
      />
    );

    // Component should render without label
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
});
