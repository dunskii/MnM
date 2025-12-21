import { Routes, Route } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder pages
const Home = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography
        variant="h1"
        sx={{
          fontFamily: '"Monkey Mayhem", "Comic Sans MS", cursive',
          color: 'primary.main',
          mb: 2,
        }}
      >
        Music 'n Me
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
        SaaS Platform for Music Schools
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="contained" color="primary" size="large" href="/login">
          Login
        </Button>
        <Button variant="outlined" color="secondary" size="large" href="/meet-and-greet">
          Book Meet & Greet
        </Button>
      </Box>
    </Box>
  </Container>
);

const MeetAndGreet = () => (
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
      Book a Meet & Greet
    </Typography>
    <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
      Public booking form will be implemented in Week 3
    </Typography>
  </Container>
);

const NotFound = () => (
  <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
    <Typography variant="h1" color="primary" sx={{ fontSize: '6rem', fontWeight: 'bold' }}>
      404
    </Typography>
    <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
      Page not found
    </Typography>
    <Button variant="contained" href="/">
      Go Home
    </Button>
  </Container>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/meet-and-greet" element={<MeetAndGreet />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
