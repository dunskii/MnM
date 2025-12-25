// ===========================================
// Folder Browser Component
// ===========================================
// Interactive Google Drive folder browser with search and navigation

import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Breadcrumbs,
  Link,
  Typography,
  Skeleton,
  Alert,
  InputAdornment,
  Chip,
  Paper,
} from '@mui/material';
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useBrowseFolders } from '../../hooks/useGoogleDrive';
import { DriveFolder } from '../../api/googleDrive.api';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

// ===========================================
// TYPES
// ===========================================

interface FolderBrowserProps {
  onSelectFolder: (folder: DriveFolder) => void;
  selectedFolderId?: string;
  disabled?: boolean;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

// ===========================================
// COMPONENT
// ===========================================

export default function FolderBrowser({
  onSelectFolder,
  selectedFolderId,
  disabled = false,
}: FolderBrowserProps) {
  // State
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Debounce search query
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Query folders
  const { data: folders, isLoading, error } = useBrowseFolders(
    {
      parentId: currentParentId,
      query: debouncedQuery || undefined,
    },
    { enabled: !disabled }
  );

  // Navigate into a folder
  const handleNavigateInto = useCallback((folder: DriveFolder) => {
    setCurrentParentId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSearchQuery('');
  }, []);

  // Navigate to breadcrumb
  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index === -1) {
      // Home (root)
      setCurrentParentId(undefined);
      setBreadcrumbs([]);
    } else {
      // Navigate to specific folder
      const targetFolder = breadcrumbs[index];
      setCurrentParentId(targetFolder.id);
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
    }
    setSearchQuery('');
  }, [breadcrumbs]);

  // Go back one level
  const handleGoBack = useCallback(() => {
    if (breadcrumbs.length === 0) return;

    if (breadcrumbs.length === 1) {
      setCurrentParentId(undefined);
      setBreadcrumbs([]);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      setCurrentParentId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
      setBreadcrumbs(newBreadcrumbs);
    }
    setSearchQuery('');
  }, [breadcrumbs]);

  // Memoize folder list
  const folderList = useMemo(() => folders || [], [folders]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={48} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error">
        Failed to load folders. Please ensure Google Drive is connected.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Search Input */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search folders..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {/* Breadcrumb Navigation */}
      <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {breadcrumbs.length > 0 && (
            <IconButton size="small" onClick={handleGoBack} disabled={disabled}>
              <BackIcon fontSize="small" />
            </IconButton>
          )}

          <Breadcrumbs
            separator={<ChevronRightIcon fontSize="small" />}
            sx={{ flex: 1, '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
          >
            <Link
              component="button"
              variant="body2"
              underline="hover"
              color={breadcrumbs.length === 0 ? 'text.primary' : 'inherit'}
              onClick={() => handleBreadcrumbClick(-1)}
              disabled={disabled}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <HomeIcon fontSize="small" />
              My Drive
            </Link>

            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography
                  key={crumb.id}
                  variant="body2"
                  color="text.primary"
                  sx={{ fontWeight: 500 }}
                >
                  {crumb.name}
                </Typography>
              ) : (
                <Link
                  key={crumb.id}
                  component="button"
                  variant="body2"
                  underline="hover"
                  onClick={() => handleBreadcrumbClick(index)}
                  disabled={disabled}
                >
                  {crumb.name}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>
      </Paper>

      {/* Folder List */}
      {folderList.length === 0 ? (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            color: 'text.secondary',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <FolderOpenIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">
            {searchQuery
              ? 'No folders match your search'
              : 'No folders found in this location'}
          </Typography>
        </Box>
      ) : (
        <List
          dense
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          {folderList.map((folder) => {
            const isSelected = folder.id === selectedFolderId;

            return (
              <ListItem
                key={folder.id}
                disablePadding
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isSelected && (
                      <Chip
                        label="Selected"
                        size="small"
                        color="primary"
                        icon={<CheckIcon />}
                      />
                    )}
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateInto(folder);
                      }}
                      disabled={disabled}
                      title="Open folder"
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onSelectFolder(folder)}
                  disabled={disabled}
                  sx={{
                    pr: 12, // Space for secondary action
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <FolderIcon color={isSelected ? 'primary' : 'action'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={folder.name}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontWeight: isSelected ? 500 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}

      {/* Help Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Click a folder to select it, or click the arrow to navigate into it.
      </Typography>
    </Box>
  );
}
