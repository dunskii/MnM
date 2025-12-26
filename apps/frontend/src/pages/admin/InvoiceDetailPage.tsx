// ===========================================
// Invoice Detail Page
// ===========================================
// Detailed view of a single invoice with payment history

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import PaymentIcon from '@mui/icons-material/Payment';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import RecordPaymentDialog from '../../components/invoices/RecordPaymentDialog';
import {
  useAdminInvoice,
  useSendInvoice,
  useCancelInvoice,
  useDeleteInvoice,
} from '../../hooks/useInvoices';
import { InvoiceStatus, PaymentMethod } from '../../api/invoices.api';

// ===========================================
// CONSTANTS
// ===========================================

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  DRAFT: { bg: '#FCF6E6', text: '#9DA5AF' },
  SENT: { bg: '#a3d9f6', text: '#4580E4' },
  PAID: { bg: '#96DAC9', text: '#080808' },
  PARTIALLY_PAID: { bg: '#FFCE00', text: '#080808' },
  OVERDUE: { bg: '#FFAE9E', text: '#ff4040' },
  CANCELLED: { bg: '#e0e0e0', text: '#9DA5AF' },
  REFUNDED: { bg: '#e0e0e0', text: '#9DA5AF' },
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  STRIPE: 'Credit Card',
  BANK_TRANSFER: 'Bank Transfer',
  CASH: 'Cash',
  CHECK: 'Cheque',
  OTHER: 'Other',
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(num);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

// ===========================================
// COMPONENT
// ===========================================

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Dialog states
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Queries and mutations
  const { data: invoice, isLoading, error } = useAdminInvoice(id || '');
  const sendMutation = useSendInvoice();
  const cancelMutation = useCancelInvoice();
  const deleteMutation = useDeleteInvoice();

  // Handlers
  const handleSend = async () => {
    if (!invoice) return;
    await sendMutation.mutateAsync(invoice.id);
    setSendDialogOpen(false);
  };

  const handleCancel = async () => {
    if (!invoice) return;
    await cancelMutation.mutateAsync({ id: invoice.id });
    setCancelDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!invoice) return;
    await deleteMutation.mutateAsync(invoice.id);
    setDeleteDialogOpen(false);
    navigate('/admin/invoices');
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Invoice not found or failed to load.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/invoices')}
          sx={{ mt: 2 }}
        >
          Back to Invoices
        </Button>
      </Box>
    );
  }

  const remainingBalance =
    parseFloat(invoice.total) - parseFloat(invoice.amountPaid);
  const canRecordPayment =
    invoice.status === 'SENT' ||
    invoice.status === 'PARTIALLY_PAID' ||
    invoice.status === 'OVERDUE';

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`${invoice.family.name} - ${invoice.term?.name || 'No Term'}`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/admin/invoices')}
            >
              Back
            </Button>
            {invoice.status === 'DRAFT' && (
              <>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => setSendDialogOpen(true)}
                >
                  Send Invoice
                </Button>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </>
            )}
            {canRecordPayment && (
              <Button
                variant="contained"
                color="success"
                startIcon={<PaymentIcon />}
                onClick={() => setRecordPaymentOpen(true)}
              >
                Record Payment
              </Button>
            )}
            {invoice.status !== 'PAID' &&
              invoice.status !== 'CANCELLED' &&
              invoice.status !== 'DRAFT' && (
                <Button
                  color="warning"
                  startIcon={<CancelIcon />}
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancel Invoice
                </Button>
              )}
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Invoice Summary */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 3,
                }}
              >
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {invoice.family.name}
                  </Typography>
                  {invoice.family.parents.map((parent, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color="text.secondary"
                    >
                      {parent.contact1Name} - {parent.contact1Email}
                    </Typography>
                  ))}
                </Box>
                <Chip
                  label={invoice.status.replace('_', ' ')}
                  sx={{
                    backgroundColor: STATUS_COLORS[invoice.status].bg,
                    color: STATUS_COLORS[invoice.status].text,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    px: 1,
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Invoice Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {invoice.invoiceNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color:
                        invoice.status !== 'PAID' &&
                        new Date(invoice.dueDate) < new Date()
                          ? 'error.main'
                          : 'text.primary',
                    }}
                  >
                    {formatDate(invoice.dueDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(invoice.createdAt)}
                  </Typography>
                </Grid>
                {invoice.sentAt && (
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Sent
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(invoice.sentAt)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {invoice.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{invoice.description}</Typography>
                </Box>
              )}

              {/* Line Items Table */}
              <Typography variant="h6" gutterBottom>
                Line Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#FCF6E6' }}>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography>{formatCurrency(invoice.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Tax</Typography>
                  <Typography>{formatCurrency(invoice.tax)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 600 }}>Total</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                    {formatCurrency(invoice.total)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="success.main">Amount Paid</Typography>
                  <Typography color="success.main" sx={{ fontWeight: 500 }}>
                    {formatCurrency(invoice.amountPaid)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 1.5,
                    bgcolor:
                      remainingBalance > 0 ? 'warning.light' : 'success.light',
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>
                    {remainingBalance > 0 ? 'Balance Due' : 'Paid in Full'}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    {remainingBalance > 0
                      ? formatCurrency(remainingBalance)
                      : formatCurrency(0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment History
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {invoice.payments.map((payment) => (
                    <Box
                      key={payment.id}
                      sx={{
                        p: 1.5,
                        bgcolor: '#FCF6E6',
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(payment.amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {PAYMENT_METHOD_LABELS[payment.method]}
                            {payment.reference && ` - ${payment.reference}`}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(payment.paidAt)}
                        </Typography>
                      </Box>
                      {payment.notes && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {payment.notes}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Dialogs */}
      <RecordPaymentDialog
        open={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        invoice={invoice}
      />

      <ConfirmDialog
        open={sendDialogOpen}
        title="Send Invoice"
        message={`Are you sure you want to send this invoice to ${invoice.family.name}? They will receive an email notification.`}
        confirmLabel="Send"
        onConfirm={handleSend}
        onCancel={() => setSendDialogOpen(false)}
        loading={sendMutation.isPending}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        title="Cancel Invoice"
        message="Are you sure you want to cancel this invoice? This action cannot be undone."
        confirmLabel="Cancel Invoice"
        confirmColor="warning"
        onConfirm={handleCancel}
        onCancel={() => setCancelDialogOpen(false)}
        loading={cancelMutation.isPending}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Invoice"
        message="Are you sure you want to delete this draft invoice? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
