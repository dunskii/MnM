// ===========================================
// File Download Card Component
// ===========================================
// Student/parent-friendly file display with download button

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { GoogleDriveFile } from '../../api/googleDrive.api';
import { formatFileSize } from '../../api/resources.api';
import { getFileIconComponent, getFileTypeName } from '../../utils/fileIcons';

// ===========================================
// TYPES
// ===========================================

interface FileDownloadCardProps {
  file: GoogleDriveFile;
  showLesson?: boolean;
}

// ===========================================
// COMPONENT
// ===========================================

export default function FileDownloadCard({
  file,
  showLesson = true,
}: FileDownloadCardProps) {
  const handleOpen = () => {
    window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = new Date(file.createdAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      {/* File Icon / Thumbnail */}
      <Box
        sx={{
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
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
          getFileIconComponent(file.mimeType, { size: 'large', useMusicIcon: true })
        )}
      </Box>

      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* File Name */}
        <Tooltip title={file.fileName}>
          <Typography
            variant="subtitle1"
            fontWeight={500}
            noWrap
            sx={{ mb: 0.5 }}
          >
            {file.fileName}
          </Typography>
        </Tooltip>

        {/* File Type & Size */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip
            label={getFileTypeName(file.mimeType)}
            size="small"
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(file.fileSize)}
          </Typography>
        </Box>

        {/* Lesson Name */}
        {showLesson && file.folder?.lesson && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {file.folder.lesson.name}
          </Typography>
        )}

        {/* Date Added */}
        <Typography variant="caption" color="text.secondary">
          Added {formattedDate}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<OpenInNewIcon />}
          onClick={handleOpen}
        >
          View File
        </Button>
      </CardActions>
    </Card>
  );
}

// ===========================================
// COMPACT VERSION
// ===========================================

interface FileDownloadListItemProps {
  file: GoogleDriveFile;
}

export function FileDownloadListItem({ file }: FileDownloadListItemProps) {
  const handleOpen = () => {
    window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
    >
      {/* Icon */}
      {getFileIconComponent(file.mimeType, { size: 'small', useMusicIcon: true })}

      {/* File Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" noWrap>
          {file.fileName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatFileSize(file.fileSize)}
          {file.folder?.lesson && ` - ${file.folder.lesson.name}`}
        </Typography>
      </Box>

      {/* Download Button */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<OpenInNewIcon />}
        onClick={handleOpen}
      >
        View
      </Button>
    </Box>
  );
}
