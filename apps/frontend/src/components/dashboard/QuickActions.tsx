// ===========================================
// QuickActions Component
// ===========================================
// Grid of shortcut buttons for common actions

import React from 'react';
import { Card, CardContent, CardHeader, Grid, Button, Typography, Divider, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// ===========================================
// TYPES
// ===========================================

export interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color?: 'primary' | 'secondary';
  disabled?: boolean;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  title?: string;
}

// ===========================================
// COMPONENT
// ===========================================

export function QuickActions({
  actions,
  columns = 2,
  title = 'Quick Actions',
}: QuickActionsProps) {
  const navigate = useNavigate();

  const handleClick = (action: QuickAction) => {
    if (action.href) {
      navigate(action.href);
    } else if (action.onClick) {
      action.onClick();
    }
  };

  // Calculate grid columns based on prop
  const gridSize = 12 / columns;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <Divider sx={{ mx: 2, mt: 2 }} />
      <CardContent>
        <Grid container spacing={1.5}>
          {actions.map((action, index) => (
            <Grid item xs={6} sm={gridSize} key={index}>
              <Button
                variant={action.color === 'secondary' ? 'outlined' : 'contained'}
                color={action.color || 'primary'}
                onClick={() => handleClick(action)}
                disabled={action.disabled}
                fullWidth
                sx={{
                  py: 1.5,
                  flexDirection: 'column',
                  gap: 0.5,
                  minHeight: 80,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ fontSize: 24, lineHeight: 1 }}>{action.icon}</Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    lineHeight: 1.2,
                    textTransform: 'none',
                  }}
                >
                  {action.label}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default QuickActions;
