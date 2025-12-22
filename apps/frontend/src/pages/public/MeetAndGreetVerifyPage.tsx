// ===========================================
// Meet & Greet Email Verification Page
// ===========================================
// Handles email verification from verification link

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useVerifyMeetAndGreet } from '../../hooks/useMeetAndGreet';

export default function MeetAndGreetVerifyPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const verifyMutation = useVerifyMeetAndGreet();

  useEffect(() => {
    if (token && !verifyMutation.isSuccess && !verifyMutation.isError) {
      verifyMutation.mutate(token);
    }
  }, [token]);

  // Loading state
  if (verifyMutation.isPending) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Verifying your email...
        </Typography>
      </Container>
    );
  }

  // Error state
  if (verifyMutation.isError) {
    const errorMessage =
      (verifyMutation.error as any)?.response?.data?.message ||
      'Invalid or expired verification link.';

    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Verification Failed
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The verification link may have expired or already been used.
            Please contact us if you need assistance.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Return Home
          </Button>
        </Paper>
      </Container>
    );
  }

  // Success state
  if (verifyMutation.isSuccess) {
    const data = verifyMutation.data;

    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Monkey Mayhem", "Comic Sans MS", cursive',
              color: 'primary.main',
              mb: 2,
            }}
          >
            Email Verified!
          </Typography>
          <Typography variant="h6" gutterBottom>
            {data.message}
          </Typography>

          <Paper
            variant="outlined"
            sx={{ p: 2, my: 3, bgcolor: 'background.default' }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Booking Details
            </Typography>
            <Typography variant="h6">
              {data.meetAndGreet.childName}
            </Typography>
            <Typography color="text.secondary">
              Contact: {data.meetAndGreet.parentName}
            </Typography>
          </Paper>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Our team will review your booking and contact you shortly to
            schedule your meet & greet session.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/')}>
              Return Home
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // No token state
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Alert severity="warning">
        No verification token provided. Please use the link from your email.
      </Alert>
      <Button sx={{ mt: 2 }} onClick={() => navigate('/')}>
        Return Home
      </Button>
    </Container>
  );
}
