// ===========================================
// File Card Component
// ===========================================
// Card display for a single Google Drive file

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudDownload as DriveIcon,
  Upload as PortalIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import {
  GoogleDriveFile,
  getUploadSourceLabel,
} from '../../api/googleDrive.api';
import { getFileIconComponent } from '../../utils/fileIcons';
import {
  formatFileSize,
  getVisibilityColor,
  getVisibilityLabel,
} from '../../api/resources.api';
import SyncStatusBadge from './SyncStatusBadge';

// ===========================================
// TYPES
// ===========================================

interface FileCardProps {
  file: GoogleDriveFile;
  onEdit?: (file: GoogleDriveFile) => void;
  onDelete?: (file: GoogleDriveFile) => void;
  editable?: boolean;
}

// ===========================================
// COMPONENT
// ===========================================

export default function FileCard({
  file,
  onEdit,
  onDelete,
  editable = false,
}: FileCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit?.(file);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(file);
  };

  const handleOpenInDrive = () => {
    window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      {/* File Preview / Icon */}
      <Box
        sx={{
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          cursor: 'pointer',
        }}
        onClick={handleOpenInDrive}
      >
        {file.thumbnailLink ? (
          <Box
            component="img"
            src={file.thumbnailLink}
            alt={file.fileName}
            sx={{
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          getFileIconComponent(file.mimeType, { size: 'medium' })
        )}
      </Box>

      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* File Name */}
        <Tooltip title={file.fileName}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ cursor: 'pointer' }}
            onClick={handleOpenInDrive}
          >
            {file.fileName}
          </Typography>
        </Tooltip>

        {/* File Size & Source */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(file.fileSize)}
          </Typography>
          <Tooltip title={getUploadSourceLabel(file.uploadedVia)}>
            {file.uploadedVia === 'GOOGLE_DRIVE' ? (
              <DriveIcon fontSize="inherit" color="action" />
            ) : (
              <PortalIcon fontSize="inherit" color="action" />
            )}
          </Tooltip>
        </Box>

        {/* Visibility & Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Chip
            label={getVisibilityLabel(file.visibility)}
            size="small"
            color={getVisibilityColor(file.visibility)}
            variant="outlined"
          />
          {file.folder?.syncStatus && (
            <SyncStatusBadge
              status={file.folder.syncStatus}
              showLabel={false}
            />
          )}
        </Box>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {file.tags.slice(0, 2).map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
            {file.tags.length > 2 && (
              <Chip label={`+${file.tags.length - 2}`} size="small" variant="outlined" />
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
        <Tooltip title="Open in Google Drive">
          <IconButton size="small" onClick={handleOpenInDrive}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {editable && (
          <>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleEdit}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </CardActions>
    </Card>
  );
}
