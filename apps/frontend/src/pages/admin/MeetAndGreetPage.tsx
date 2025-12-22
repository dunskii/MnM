// ===========================================
// Admin Meet & Greet Management Page
// ===========================================
// List and manage meet & greet bookings

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Skeleton,
  Tooltip,
  Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  useMeetAndGreets,
  useMeetAndGreetCounts,
  useApproveMeetAndGreet,
  useRejectMeetAndGreet,
  useCancelMeetAndGreet,
} from '../../hooks/useMeetAndGreet';
import { MeetAndGreet, MeetAndGreetStatus } from '../../api/meetAndGreet.api';
import { format } from 'date-fns';

// ===========================================
// STATUS CONFIGURATION
// ===========================================

const statusConfig: Record<
  MeetAndGreetStatus,
  { label: string; color: 'default' | 'warning' | 'primary' | 'error' | 'success' | 'info' }
> = {
  PENDING_VERIFICATION: { label: 'Pending Verification', color: 'default' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'primary' },
  REJECTED: { label: 'Rejected', color: 'error' },
  CONVERTED: { label: 'Converted', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

// ===========================================
// COMPONENT
// ===========================================

export default function MeetAndGreetPage() {
  const [statusFilter, setStatusFilter] = useState<MeetAndGreetStatus | 'ALL'>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<MeetAndGreet | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'cancel' | null>(null);

  // Queries
  const { data: bookings, isLoading, refetch } = useMeetAndGreets(
    statusFilter === 'ALL' ? undefined : { status: statusFilter }
  );
  const { data: counts } = useMeetAndGreetCounts();

  // Mutations
  const approveMutation = useApproveMeetAndGreet();
  const rejectMutation = useRejectMeetAndGreet();
  const cancelMutation = useCancelMeetAndGreet();

  // Handlers
  const handleViewDetails = (booking: MeetAndGreet) => {
    setSelectedBooking(booking);
    setDetailDialogOpen(true);
  };

  const handleApproveClick = (booking: MeetAndGreet) => {
    setSelectedBooking(booking);
    setConfirmAction('approve');
    setConfirmDialogOpen(true);
  };

  const handleRejectClick = (booking: MeetAndGreet) => {
    setSelectedBooking(booking);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleCancelClick = (booking: MeetAndGreet) => {
    setSelectedBooking(booking);
    setConfirmAction('cancel');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedBooking) return;

    if (confirmAction === 'approve') {
      await approveMutation.mutateAsync(selectedBooking.id);
    } else if (confirmAction === 'cancel') {
      await cancelMutation.mutateAsync(selectedBooking.id);
    }

    setConfirmDialogOpen(false);
    setSelectedBooking(null);
    setConfirmAction(null);
  };

  const handleRejectConfirm = async () => {
    if (!selectedBooking || !rejectReason.trim()) return;

    await rejectMutation.mutateAsync({
      id: selectedBooking.id,
      reason: rejectReason,
    });

    setRejectDialogOpen(false);
    setSelectedBooking(null);
    setRejectReason('');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd MMM yyyy, h:mm a');
  };

  // Tab counts
  const tabCounts = counts || {
    PENDING_VERIFICATION: 0,
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    REJECTED: 0,
    CONVERTED: 0,
    CANCELLED: 0,
  };
  const totalCount = Object.values(tabCounts).reduce((a: number, b: number) => a + b, 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Meet & Greet Bookings</Typography>
        <Button startIcon={<RefreshIcon />} onClick={() => refetch()}>
          Refresh
        </Button>
      </Box>

      {/* Status Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(_, value) => setStatusFilter(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All (${totalCount})`} value="ALL" />
          <Tab
            label={`Pending Approval (${tabCounts.PENDING_APPROVAL})`}
            value="PENDING_APPROVAL"
          />
          <Tab label={`Approved (${tabCounts.APPROVED})`} value="APPROVED" />
          <Tab label={`Converted (${tabCounts.CONVERTED})`} value="CONVERTED" />
          <Tab
            label={`Pending Verification (${tabCounts.PENDING_VERIFICATION})`}
            value="PENDING_VERIFICATION"
          />
          <Tab label={`Rejected (${tabCounts.REJECTED})`} value="REJECTED" />
          <Tab label={`Cancelled (${tabCounts.CANCELLED})`} value="CANCELLED" />
        </Tabs>
      </Paper>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Instrument</TableCell>
              <TableCell>Preferred Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : bookings?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No bookings found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              bookings?.map((booking: MeetAndGreet) => (
                <TableRow
                  key={booking.id}
                  sx={{
                    opacity: ['CANCELLED', 'REJECTED'].includes(booking.status) ? 0.6 : 1,
                  }}
                >
                  <TableCell>
                    <Typography fontWeight={500}>
                      {booking.studentFirstName} {booking.studentLastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.studentAge} years old
                    </Typography>
                  </TableCell>
                  <TableCell>{booking.contact1Name}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{booking.contact1Email}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.contact1Phone}
                    </Typography>
                  </TableCell>
                  <TableCell>{booking.instrument?.name || '-'}</TableCell>
                  <TableCell>{formatDate(booking.preferredDateTime)}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusConfig[booking.status].label}
                      color={statusConfig[booking.status].color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(booking.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewDetails(booking)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {booking.status === 'PENDING_APPROVAL' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApproveClick(booking)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRejectClick(booking)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {!['CONVERTED', 'CANCELLED', 'REJECTED'].includes(booking.status) && (
                      <Tooltip title="Cancel">
                        <IconButton size="small" onClick={() => handleCancelClick(booking)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Meet & Greet Details
          {selectedBooking && (
            <Chip
              label={statusConfig[selectedBooking.status].label}
              color={statusConfig[selectedBooking.status].color}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Student Info */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Student Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography>
                    <strong>Name:</strong> {selectedBooking.studentFirstName}{' '}
                    {selectedBooking.studentLastName}
                  </Typography>
                  <Typography>
                    <strong>Age:</strong> {selectedBooking.studentAge} years old
                  </Typography>
                  <Typography>
                    <strong>Instrument Interest:</strong>{' '}
                    {selectedBooking.instrument?.name || 'Not specified'}
                  </Typography>
                </Paper>
              </Grid>

              {/* Primary Contact */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Primary Contact
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography>
                    <strong>Name:</strong> {selectedBooking.contact1Name}
                  </Typography>
                  <Typography>
                    <strong>Relationship:</strong> {selectedBooking.contact1Relationship}
                  </Typography>
                  <Typography>
                    <strong>Email:</strong> {selectedBooking.contact1Email}
                  </Typography>
                  <Typography>
                    <strong>Phone:</strong> {selectedBooking.contact1Phone}
                  </Typography>
                </Paper>
              </Grid>

              {/* Secondary Contact */}
              {selectedBooking.contact2Name && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Secondary Contact
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography>
                      <strong>Name:</strong> {selectedBooking.contact2Name}
                    </Typography>
                    <Typography>
                      <strong>Relationship:</strong> {selectedBooking.contact2Relationship}
                    </Typography>
                    <Typography>
                      <strong>Email:</strong> {selectedBooking.contact2Email}
                    </Typography>
                    <Typography>
                      <strong>Phone:</strong> {selectedBooking.contact2Phone}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Emergency Contact */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Emergency Contact
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography>
                    <strong>Name:</strong> {selectedBooking.emergencyName}
                  </Typography>
                  <Typography>
                    <strong>Relationship:</strong> {selectedBooking.emergencyRelationship}
                  </Typography>
                  <Typography>
                    <strong>Phone:</strong> {selectedBooking.emergencyPhone}
                  </Typography>
                </Paper>
              </Grid>

              {/* Booking Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Booking Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography>
                    <strong>Preferred Date:</strong>{' '}
                    {formatDate(selectedBooking.preferredDateTime)}
                  </Typography>
                  <Typography>
                    <strong>Created:</strong> {formatDate(selectedBooking.createdAt)}
                  </Typography>
                  {selectedBooking.verifiedAt && (
                    <Typography>
                      <strong>Verified:</strong> {formatDate(selectedBooking.verifiedAt)}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Additional Notes */}
              {selectedBooking.additionalNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Additional Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography>{selectedBooking.additionalNotes}</Typography>
                  </Paper>
                </Grid>
              )}

              {/* Rejection Reason */}
              {selectedBooking.rejectionReason && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <strong>Rejection Reason:</strong> {selectedBooking.rejectionReason}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {selectedBooking?.status === 'PENDING_APPROVAL' && (
            <>
              <Button
                color="error"
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleRejectClick(selectedBooking);
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleApproveClick(selectedBooking);
                }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Meet & Greet</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Please provide a reason for rejecting this booking. This will be sent to the parent.
          </Typography>
          <TextField
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., No available slots, age requirements not met, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectConfirm}
            disabled={!rejectReason.trim() || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          {confirmAction === 'approve' ? 'Approve Booking?' : 'Cancel Booking?'}
        </DialogTitle>
        <DialogContent>
          {confirmAction === 'approve' ? (
            <Typography>
              This will send a registration email to the parent with a link to complete payment
              and create their account.
            </Typography>
          ) : (
            <Typography>
              This will cancel the booking. The parent will not be notified automatically.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmAction === 'approve' ? 'success' : 'error'}
            onClick={handleConfirmAction}
            disabled={approveMutation.isPending || cancelMutation.isPending}
          >
            {approveMutation.isPending || cancelMutation.isPending
              ? 'Processing...'
              : confirmAction === 'approve'
              ? 'Approve & Send Email'
              : 'Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
