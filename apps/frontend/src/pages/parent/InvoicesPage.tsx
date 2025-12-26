// ===========================================
// Parent Invoices Page
// ===========================================
// View and pay invoices for the family

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  Alert,
  Skeleton,
  Divider,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import PageHeader from '../../components/common/PageHeader';
import {
  useParentInvoices,
  useCreatePaymentSession,
} from '../../hooks/useInvoices';
import { Invoice, InvoiceStatus, PaymentMethod } from '../../api/invoices.api';

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

function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

// ===========================================
// INVOICE CARD COMPONENT
// ===========================================

interface InvoiceCardProps {
  invoice: Invoice;
  onPay: (invoice: Invoice) => void;
  isPaymentLoading: boolean;
}

function InvoiceCard({ invoice, onPay, isPaymentLoading }: InvoiceCardProps) {
  const remainingBalance =
    parseFloat(invoice.total) - parseFloat(invoice.amountPaid);
  const isPayable =
    invoice.status === 'SENT' ||
    invoice.status === 'PARTIALLY_PAID' ||
    invoice.status === 'OVERDUE';
  const isOverdue =
    invoice.status !== 'PAID' &&
    invoice.status !== 'CANCELLED' &&
    new Date(invoice.dueDate) < new Date();

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {invoice.invoiceNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.description || invoice.term?.name || 'Invoice'}
            </Typography>
          </Box>
          <Chip
            label={invoice.status.replace('_', ' ')}
            sx={{
              backgroundColor: STATUS_COLORS[invoice.status].bg,
              color: STATUS_COLORS[invoice.status].text,
              fontWeight: 600,
            }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {formatCurrency(invoice.total)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Paid
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'success.main', fontWeight: 500 }}
            >
              {formatCurrency(invoice.amountPaid)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Balance
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: remainingBalance > 0 ? 'warning.main' : 'success.main',
              }}
            >
              {formatCurrency(remainingBalance)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Due Date
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: isOverdue ? 'error.main' : 'text.primary' }}
            >
              {formatShortDate(invoice.dueDate)}
            </Typography>
          </Grid>
        </Grid>

        {/* Line Items Preview */}
        {invoice.items && invoice.items.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
              Items:
            </Typography>
            {invoice.items.slice(0, 3).map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
                <Typography variant="body2">{formatCurrency(item.total)}</Typography>
              </Box>
            ))}
            {invoice.items.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                + {invoice.items.length - 3} more items
              </Typography>
            )}
          </Box>
        )}

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Payment History:
            </Typography>
            {invoice.payments.map((payment) => (
              <Box
                key={payment.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 1,
                  bgcolor: '#FCF6E6',
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(payment.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatShortDate(payment.paidAt)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Pay Button */}
        {isPayable && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<PaymentIcon />}
            onClick={() => onPay(invoice)}
            disabled={isPaymentLoading}
          >
            {isPaymentLoading ? 'Processing...' : `Pay ${formatCurrency(remainingBalance)}`}
          </Button>
        )}

        {invoice.status === 'PAID' && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mt: 1 }}
          >
            This invoice has been paid in full
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================================
// SUMMARY CARD COMPONENT
// ===========================================

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}

function SummaryCard({ title, value, subtitle, color = '#4580E4', icon }: SummaryCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon && (
            <Box
              sx={{
                bgcolor: `${color}20`,
                borderRadius: 2,
                p: 1.5,
                color: color,
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function ParentInvoicesPage() {
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  // Queries
  const { data: invoices, isLoading, error } = useParentInvoices();
  const paymentMutation = useCreatePaymentSession();

  // Handle payment
  const handlePay = async (invoice: Invoice) => {
    setPayingInvoiceId(invoice.id);
    try {
      const result = await paymentMutation.mutateAsync({
        id: invoice.id,
        successUrl: `${window.location.origin}/parent/invoices?success=true`,
        cancelUrl: `${window.location.origin}/parent/invoices?cancelled=true`,
      });

      // Redirect to Stripe checkout
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  // Calculate summary stats
  const totalOutstanding =
    invoices
      ?.filter(
        (i) =>
          i.status === 'SENT' ||
          i.status === 'PARTIALLY_PAID' ||
          i.status === 'OVERDUE'
      )
      .reduce(
        (sum, i) => sum + parseFloat(i.total) - parseFloat(i.amountPaid),
        0
      ) || 0;

  const overdueCount =
    invoices?.filter((i) => i.status === 'OVERDUE').length || 0;

  const paidThisYear =
    invoices
      ?.filter(
        (i) =>
          i.status === 'PAID' &&
          new Date(i.paidAt || i.updatedAt).getFullYear() ===
            new Date().getFullYear()
      )
      .reduce((sum, i) => sum + parseFloat(i.amountPaid), 0) || 0;

  // Check for URL params (payment result)
  const urlParams = new URLSearchParams(window.location.search);
  const paymentSuccess = urlParams.get('success') === 'true';
  const paymentCancelled = urlParams.get('cancelled') === 'true';

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="My Invoices" subtitle="View and pay your invoices" />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 3 }}>
          {[1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={200}
              sx={{ mb: 2 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader title="My Invoices" subtitle="View and pay your invoices" />
        <Alert severity="error">
          Failed to load invoices. Please try again later.
        </Alert>
      </Box>
    );
  }

  // Separate invoices by status
  const unpaidInvoices =
    invoices?.filter(
      (i) =>
        i.status === 'SENT' ||
        i.status === 'PARTIALLY_PAID' ||
        i.status === 'OVERDUE'
    ) || [];
  const paidInvoices = invoices?.filter((i) => i.status === 'PAID') || [];

  return (
    <Box>
      <PageHeader title="My Invoices" subtitle="View and pay your invoices" />

      {/* Payment Result Alerts */}
      {paymentSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => window.history.replaceState({}, '', '/parent/invoices')}>
          Payment successful! Thank you for your payment. You will receive a receipt via email.
        </Alert>
      )}
      {paymentCancelled && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => window.history.replaceState({}, '', '/parent/invoices')}>
          Payment was cancelled. You can try again at any time.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            title="Outstanding Balance"
            value={formatCurrency(totalOutstanding)}
            subtitle={`${unpaidInvoices.length} unpaid invoice(s)`}
            color={totalOutstanding > 0 ? '#FFCE00' : '#96DAC9'}
            icon={<ReceiptIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            title="Overdue"
            value={overdueCount.toString()}
            subtitle="invoice(s) past due date"
            color={overdueCount > 0 ? '#ff4040' : '#96DAC9'}
            icon={<WarningIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            title="Paid This Year"
            value={formatCurrency(paidThisYear)}
            color="#96DAC9"
            icon={<CheckCircleIcon />}
          />
        </Grid>
      </Grid>

      {/* Unpaid Invoices */}
      {unpaidInvoices.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Invoices Requiring Payment
          </Typography>
          {unpaidInvoices
            .sort((a, b) => {
              // Sort overdue first, then by due date
              if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
              if (a.status !== 'OVERDUE' && b.status === 'OVERDUE') return 1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            })
            .map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onPay={handlePay}
                isPaymentLoading={payingInvoiceId === invoice.id}
              />
            ))}
        </Box>
      )}

      {/* No Unpaid Invoices */}
      {unpaidInvoices.length === 0 && (
        <Alert severity="success" sx={{ mb: 4 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            All caught up!
          </Typography>
          <Typography variant="body2">
            You have no outstanding invoices at this time.
          </Typography>
        </Alert>
      )}

      {/* Paid Invoices */}
      {paidInvoices.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            Payment History
          </Typography>
          {paidInvoices
            .sort(
              (a, b) =>
                new Date(b.paidAt || b.updatedAt).getTime() -
                new Date(a.paidAt || a.updatedAt).getTime()
            )
            .slice(0, 5)
            .map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onPay={handlePay}
                isPaymentLoading={false}
              />
            ))}
          {paidInvoices.length > 5 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              Showing 5 of {paidInvoices.length} paid invoices
            </Typography>
          )}
        </Box>
      )}

      {/* No Invoices at All */}
      {(!invoices || invoices.length === 0) && (
        <Alert severity="info">
          No invoices found. Invoices will appear here when your school generates them.
        </Alert>
      )}
    </Box>
  );
}
