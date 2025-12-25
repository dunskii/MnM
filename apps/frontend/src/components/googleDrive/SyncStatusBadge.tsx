// ===========================================
// Sync Status Badge Component
// ===========================================
// Visual indicator for folder/file sync status

import { Chip, Tooltip, CircularProgress } from '@mui/material';
import {
  CheckCircle as SyncedIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import {
  SyncStatus,
  getSyncStatusColor,
  getSyncStatusLabel,
  formatSyncTime,
} from '../../api/googleDrive.api';

// ===========================================
// TYPES
// ===========================================

interface SyncStatusBadgeProps {
  status: SyncStatus;
  lastSyncAt?: string | null;
  errorMessage?: string | null;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

// ===========================================
// COMPONENT
// ===========================================

export default function SyncStatusBadge({
  status,
  lastSyncAt,
  errorMessage,
  size = 'small',
  showLabel = true,
}: SyncStatusBadgeProps) {
  // Get icon based on status
  const getIcon = () => {
    switch (status) {
      case 'SYNCED':
        return <SyncedIcon fontSize="small" />;
      case 'SYNCING':
        return <CircularProgress size={14} color="inherit" />;
      case 'ERROR':
        return <ErrorIcon fontSize="small" />;
      case 'PENDING':
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  // Build tooltip content
  const getTooltipContent = () => {
    const lines: string[] = [];

    switch (status) {
      case 'SYNCED':
        lines.push('Sync Complete');
        if (lastSyncAt) {
          lines.push(`Last synced: ${formatSyncTime(lastSyncAt)}`);
        }
        break;
      case 'SYNCING':
        lines.push('Sync in progress...');
        break;
      case 'ERROR':
        lines.push('Sync Error');
        if (errorMessage) {
          lines.push(errorMessage);
        }
        if (lastSyncAt) {
          lines.push(`Last successful sync: ${formatSyncTime(lastSyncAt)}`);
        }
        break;
      case 'PENDING':
        lines.push('Sync Pending');
        lines.push('Waiting for initial sync');
        break;
    }

    return lines.join('\n');
  };

  return (
    <Tooltip title={getTooltipContent()} arrow placement="top">
      <Chip
        icon={getIcon()}
        label={showLabel ? getSyncStatusLabel(status) : undefined}
        color={getSyncStatusColor(status)}
        size={size}
        variant="outlined"
        sx={{
          '& .MuiChip-icon': {
            ml: showLabel ? undefined : 0,
            mr: showLabel ? undefined : 0,
          },
          ...(status === 'SYNCING' && {
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.7 },
            },
          }),
        }}
      />
    </Tooltip>
  );
}

// ===========================================
// ICON-ONLY VERSION
// ===========================================

interface SyncStatusIconProps {
  status: SyncStatus;
  lastSyncAt?: string | null;
  errorMessage?: string | null;
}

export function SyncStatusIcon({
  status,
  lastSyncAt,
  errorMessage,
}: SyncStatusIconProps) {
  return (
    <SyncStatusBadge
      status={status}
      lastSyncAt={lastSyncAt}
      errorMessage={errorMessage}
      showLabel={false}
    />
  );
}
