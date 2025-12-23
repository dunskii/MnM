import { Routes, Route } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import TermsPage from './pages/admin/TermsPage';
import LocationsPage from './pages/admin/LocationsPage';
import RoomsPage from './pages/admin/RoomsPage';
import InstrumentsPage from './pages/admin/InstrumentsPage';
import LessonTypesPage from './pages/admin/LessonTypesPage';
import DurationsPage from './pages/admin/DurationsPage';
import TeachersPage from './pages/admin/TeachersPage';
import ParentsPage from './pages/admin/ParentsPage';
import StudentsPage from './pages/admin/StudentsPage';
import FamiliesPage from './pages/admin/FamiliesPage';
import MeetAndGreetPage from './pages/admin/MeetAndGreetPage';
import LessonsPage from './pages/admin/LessonsPage';
import LessonDetailPage from './pages/admin/LessonDetailPage';
import CalendarPage from './pages/admin/CalendarPage';

// Teacher Pages
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';

// Parent Pages
import ParentDashboardPage from './pages/parent/ParentDashboardPage';
import HybridBookingPage from './pages/parent/HybridBookingPage';

// Public Pages
import MeetAndGreetBookingPage from './pages/public/MeetAndGreetBookingPage';
import MeetAndGreetVerifyPage from './pages/public/MeetAndGreetVerifyPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

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
        <Button variant="outlined" color="secondary" size="large" href="/meet-and-greet/music-n-me">
          Book Meet & Greet
        </Button>
      </Box>
    </Box>
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
      <Route path="/meet-and-greet/:schoolSlug" element={<MeetAndGreetBookingPage />} />
      <Route path="/meet-and-greet/verify/:token" element={<MeetAndGreetVerifyPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="instruments" element={<InstrumentsPage />} />
        <Route path="lesson-types" element={<LessonTypesPage />} />
        <Route path="durations" element={<DurationsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="parents" element={<ParentsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="families" element={<FamiliesPage />} />
        <Route path="meet-and-greet" element={<MeetAndGreetPage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="lessons/:id" element={<LessonDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute requiredRole="TEACHER">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ErrorBoundary><TeacherDashboardPage /></ErrorBoundary>} />
      </Route>

      {/* Parent Routes */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute requiredRole="PARENT">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ErrorBoundary><ParentDashboardPage /></ErrorBoundary>} />
        <Route path="hybrid-booking" element={<ErrorBoundary><HybridBookingPage /></ErrorBoundary>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
