// ===========================================
// ActivityFeed Component
// ===========================================
// Displays recent school activity (enrollments, payments, bookings)

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Button,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  PersonAdd as EnrollmentIcon,
  Payment as PaymentIcon,
  EventAvailable as BookingIcon,
  CheckCircle as AttendanceIcon,
  CloudUpload as FileIcon,
  Handshake as MeetAndGreetIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// ===========================================
// TYPES
// ===========================================

export type ActivityType =
  | 'enrollment'
  | 'payment'
  | 'booking'
  | 'attendance'
  | 'file_upload'
  | 'meet_and_greet';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
  title?: string;
}

// Icon and color mapping for each activity type
const activityConfig: Record<ActivityType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  enrollment: {
    icon: <EnrollmentIcon />,
    color: '#4580E4',
    bgColor: '#a3d9f6',
  },
  payment: {
    icon: <PaymentIcon />,
    color: '#5cb399',
    bgColor: '#c5ebe2',
  },
  booking: {
    icon: <BookingIcon />,
    color: '#E6B800',
    bgColor: '#FFE066',
  },
  attendance: {
    icon: <AttendanceIcon />,
    color: '#96DAC9',
    bgColor: '#c5ebe2',
  },
  file_upload: {
    icon: <FileIcon />,
    color: '#4580E4',
    bgColor: '#a3d9f6',
  },
  meet_and_greet: {
    icon: <MeetAndGreetIcon />,
    color: '#e67761',
    bgColor: '#ffd4cc',
  },
};

// ===========================================
// COMPONENT
// ===========================================

export function ActivityFeed({
  items,
  loading = false,
  maxItems = 5,
  onViewAll,
  title = 'Recent Activity',
}: ActivityFeedProps) {
  const displayedItems = items.slice(0, maxItems);

  const formatRelativeTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <Divider sx={{ mx: 2, mt: 2 }} />
      <CardContent sx={{ flex: 1, pt: 1, pb: 1, overflow: 'auto' }}>
        {loading ? (
          <List disablePadding>
            {[1, 2, 3, 4, 5].map((i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" />}
                  secondary={<Skeleton variant="text" width="40%" />}
                />
              </ListItem>
            ))}
          </List>
        ) : displayedItems.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 150,
            }}
          >
            <Typography color="text.secondary">No recent activity</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {displayedItems.map((item, index) => {
              const config = activityConfig[item.type];
              return (
                <React.Fragment key={item.id}>
                  <ListItem
                    sx={{
                      px: 0,
                      py: 1.5,
                      '&:hover': { bgcolor: 'action.hover', borderRadius: 1 },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: config.bgColor,
                          color: config.color,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {config.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {item.title}
                        </Typography>
                      }
                      secondary={
                        <Box component="span">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="span"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.description}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                          >
                            {formatRelativeTime(item.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < displayedItems.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </CardContent>
      {onViewAll && items.length > maxItems && (
        <>
          <Divider />
          <Box sx={{ p: 1.5, textAlign: 'center' }}>
            <Button size="small" onClick={onViewAll}>
              View All Activity
            </Button>
          </Box>
        </>
      )}
    </Card>
  );
}

export default ActivityFeed;
