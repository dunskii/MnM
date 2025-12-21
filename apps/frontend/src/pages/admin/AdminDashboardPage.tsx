// ===========================================
// Admin Dashboard Page
// ===========================================
// Overview dashboard for school administrators

import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  FamilyRestroom as FamilyIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  MusicNote as MusicIcon,
} from '@mui/icons-material';
import { useTerms, useLocations, useInstruments } from '../../hooks/useAdmin';
import { useTeachers, useStudents, useFamilies } from '../../hooks/useUsers';
import PageHeader from '../../components/common/PageHeader';
import { Term } from '../../api/admin.api';

// ===========================================
// STAT CARD COMPONENT
// ===========================================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, value, icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={60} height={40} />
            ) : (
              <Typography variant="h4" component="div">
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: 'primary.light',
              borderRadius: 2,
              p: 1.5,
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ===========================================
// COMPONENT
// ===========================================

export default function AdminDashboardPage() {
  const { data: terms, isLoading: termsLoading } = useTerms();
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const { data: instruments } = useInstruments();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: families, isLoading: familiesLoading } = useFamilies();

  // Get current term
  const currentTerm = terms?.find((t: Term) => t.isActive);

  // Get active counts
  const activeTeachers = teachers?.filter((t) => t.isActive).length ?? 0;
  const activeStudents = students?.filter((s) => s.isActive).length ?? 0;
  const activeFamilies = families?.filter((f) => f.isActive).length ?? 0;

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Welcome to the Music 'n Me admin dashboard" />

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Teachers"
            value={activeTeachers}
            icon={<PeopleIcon />}
            loading={teachersLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Students"
            value={activeStudents}
            icon={<SchoolIcon />}
            loading={studentsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Families"
            value={activeFamilies}
            icon={<FamilyIcon />}
            loading={familiesLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Locations"
            value={locations?.length ?? 0}
            icon={<LocationIcon />}
            loading={locationsLoading}
          />
        </Grid>
      </Grid>

      {/* Info Cards */}
      <Grid container spacing={3}>
        {/* Current Term */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Current Term
              </Typography>
              <Divider sx={{ my: 2 }} />
              {termsLoading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : currentTerm ? (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {currentTerm.name}
                  </Typography>
                  <Typography color="text.secondary">
                    {new Date(currentTerm.startDate).toLocaleDateString()} -{' '}
                    {new Date(currentTerm.endDate).toLocaleDateString()}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">No active term</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Links */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List dense disablePadding>
                <ListItem component="a" href="/admin/terms" sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Manage Terms"
                    secondary={`${terms?.length ?? 0} terms configured`}
                  />
                </ListItem>
                <ListItem component="a" href="/admin/locations" sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Manage Locations"
                    secondary={`${locations?.length ?? 0} locations configured`}
                  />
                </ListItem>
                <ListItem component="a" href="/admin/instruments" sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <MusicIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Manage Instruments"
                    secondary={`${instruments?.length ?? 0} instruments configured`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Terms */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Terms
              </Typography>
              <Divider sx={{ my: 2 }} />
              {termsLoading ? (
                <Skeleton variant="rectangular" height={100} />
              ) : terms && terms.length > 0 ? (
                <List dense>
                  {terms.map((term: Term) => (
                    <ListItem key={term.id}>
                      <ListItemIcon>
                        <CalendarIcon color={term.isActive ? 'primary' : 'disabled'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={term.name}
                        secondary={`${new Date(term.startDate).toLocaleDateString()} - ${new Date(
                          term.endDate
                        ).toLocaleDateString()}`}
                      />
                      {term.isActive && (
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: 'success.light',
                            color: 'success.dark',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                          }}
                        >
                          Current
                        </Typography>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No terms configured</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
