// ===========================================
// Page Header Component
// ===========================================
// Consistent page header with title, subtitle, and action button

import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

// ===========================================
// TYPES
// ===========================================

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  action?: React.ReactNode; // Custom action content (overrides actionLabel/onAction)
}

// ===========================================
// COMPONENT
// ===========================================

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actionLabel,
  actionIcon = <AddIcon />,
  onAction,
  action,
}: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, index) =>
            crumb.path ? (
              <Link
                key={index}
                component={RouterLink}
                to={crumb.path}
                color="inherit"
                underline="hover"
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      {/* Title and Action */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom={!!subtitle}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action ? (
          action
        ) : (
          actionLabel && onAction && (
            <Button
              variant="contained"
              startIcon={actionIcon}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )
        )}
      </Box>
    </Box>
  );
}
