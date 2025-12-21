// ===========================================
// Dashboard Page
// ===========================================

import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import { Logout, Person, School } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const roleColors: Record<string, 'primary' | 'secondary' | 'success' | 'info'> = {
  ADMIN: 'primary',
  TEACHER: 'secondary',
  PARENT: 'success',
  STUDENT: 'info',
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <Person fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h5">
                  Welcome, {user.firstName}!
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip
                    label={user.role}
                    color={roleColors[user.role] || 'default'}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    <School sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                    {user.schoolName}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Logout />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Paper>

        {/* Dashboard Content */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Monkey Mayhem", "Comic Sans MS", cursive',
                  color: 'primary.main',
                  mb: 2,
                }}
              >
                Dashboard
              </Typography>
              <Typography color="text.secondary">
                Your {user.role.toLowerCase()} dashboard is coming soon.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This will include your schedule, lessons, and more.
              </Typography>
            </Paper>
          </Grid>

          {/* User Info Card */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {user.firstName} {user.lastName}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {user.email}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body1">
                  {user.role}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="outlined" disabled>
                  View Schedule (Coming Soon)
                </Button>
                <Button variant="outlined" disabled>
                  View Lessons (Coming Soon)
                </Button>
                <Button variant="outlined" disabled>
                  Change Password (Coming Soon)
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
