// ===========================================
// StatWidget Component
// ===========================================
// Reusable stat card with consistent brand styling
// Used across Admin, Teacher, and Parent dashboards

import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

// ===========================================
// TYPES
// ===========================================

export interface StatWidgetProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  loading?: boolean;
  onClick?: () => void;
  href?: string;
}

// Color mappings for icon backgrounds (using brand colors)
const colorBackgrounds: Record<string, { bg: string; icon: string }> = {
  primary: { bg: '#a3d9f6', icon: '#4580E4' },   // Blue
  secondary: { bg: '#FFE066', icon: '#E6B800' }, // Yellow
  success: { bg: '#c5ebe2', icon: '#5cb399' },   // Mint
  warning: { bg: '#ffd4cc', icon: '#e67761' },   // Coral
  error: { bg: '#ffcccc', icon: '#ff4040' },     // Red
  info: { bg: '#a3d9f6', icon: '#4580E4' },      // Blue (same as primary)
};

// ===========================================
// COMPONENT
// ===========================================

export function StatWidget({
  title,
  value,
  icon,
  color = 'primary',
  subtitle,
  trend,
  loading = false,
  onClick,
  href,
}: StatWidgetProps) {
  const navigate = useNavigate();
  const colors = colorBackgrounds[color] || colorBackgrounds.primary;

  const handleClick = () => {
    if (href) {
      navigate(href);
    } else if (onClick) {
      onClick();
    }
  };

  const isClickable = !!href || !!onClick;

  const cardContent = (
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Left side - Text content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ fontWeight: 500, mb: 0.5 }}
          >
            {title}
          </Typography>

          {loading ? (
            <Skeleton variant="text" width={80} height={48} />
          ) : (
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
          )}

          {/* Subtitle or Trend */}
          {(subtitle || trend) && !loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              {trend && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mr: 1,
                    color:
                      trend.direction === 'up'
                        ? 'success.main'
                        : trend.direction === 'down'
                          ? 'error.main'
                          : 'text.secondary',
                  }}
                >
                  {trend.direction === 'up' && <TrendingUp fontSize="small" />}
                  {trend.direction === 'down' && <TrendingDown fontSize="small" />}
                  {trend.direction === 'neutral' && <TrendingFlat fontSize="small" />}
                  <Typography variant="caption" sx={{ ml: 0.25, fontWeight: 600 }}>
                    {trend.value > 0 ? '+' : ''}
                    {trend.value}%
                  </Typography>
                </Box>
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          )}

          {loading && subtitle && <Skeleton variant="text" width={60} height={20} />}
        </Box>

        {/* Right side - Icon */}
        <Box
          sx={{
            bgcolor: colors.bg,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.icon,
            ml: 2,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  );

  if (isClickable) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardActionArea onClick={handleClick} sx={{ height: '100%' }}>
          {cardContent}
        </CardActionArea>
      </Card>
    );
  }

  return <Card sx={{ height: '100%' }}>{cardContent}</Card>;
}

export default StatWidget;
