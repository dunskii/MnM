// ===========================================
// Invoices Management Page
// ===========================================
// Admin interface for managing invoices and payments

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import PaymentIcon from '@mui/icons-material/Payment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useTerms } from '../../hooks/useAdmin';
import { useFamilies } from '../../hooks/useUsers';
import {
  useAdminInvoices,
  useInvoiceStatistics,
  useSendInvoice,
} from '../../hooks/useInvoices';
import {
  Invoice,
  InvoiceFilters,
  InvoiceStatus,
} from '../../api/invoices.api';
import GenerateInvoicesDialog from '../../components/invoices/GenerateInvoicesDialog';
import RecordPaymentDialog from '../../components/invoices/RecordPaymentDialog';

// ===========================================
// CONSTANTS
// ===========================================

const STATUS_OPTIONS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// Brand-compliant status colors
const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  DRAFT: { bg: '#FCF6E6', text: '#9DA5AF' },
  SENT: { bg: '#a3d9f6', text: '#4580E4' },
  PAID: { bg: '#96DAC9', text: '#080808' },
  PARTIALLY_PAID: { bg: '#FFCE00', text: '#080808' },
  OVERDUE: { bg: '#FFAE9E', text: '#ff4040' },
  CANCELLED: { bg: '#e0e0e0', text: '#9DA5AF' },
  REFUNDED: { bg: '#e0e0e0', text: '#9DA5AF' },
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
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

// ===========================================
// COMPONENT
// ===========================================

export default function InvoicesPage() {
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [recordPaymentDialogOpen, setRecordPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null);

  // Data queries
  const { data: invoicesData, isLoading, error } = useAdminInvoices(filters);
  const { data: statisticsData } = useInvoiceStatistics();
  const { data: termsData } = useTerms();
  const { data: familiesData } = useFamilies();

  const invoices = invoicesData ?? [];
  const statistics = statisticsData;
  const terms = termsData ?? [];
  const families = familiesData ?? [];

  // Mutations
  const sendMutation = useSendInvoice();

  // Filter invoices by search query
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;

    const query = searchQuery.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.family.name.toLowerCase().includes(query) ||
        invoice.description?.toLowerCase().includes(query)
    );
  }, [invoices, searchQuery]);

  // Handle filter changes
  const handleFilterChange = (field: keyof InvoiceFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  // Handle send invoice
  const handleSendInvoice = async () => {
    if (!invoiceToSend) return;
    await sendMutation.mutateAsync(invoiceToSend.id);
    setSendDialogOpen(false);
    setInvoiceToSend(null);
  };

  // Handle record payment
  const handleOpenRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setRecordPaymentDialogOpen(true);
  };

  // Table columns
  const columns: Column<Invoice>[] = [
    {
      id: 'invoiceNumber',
      label: 'Invoice #',
      format: (_value, invoice) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
          onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
        >
          {invoice.invoiceNumber}
        </Typography>
      ),
    },
    {
      id: 'family',
      label: 'Family',
      format: (_value, invoice) => invoice.family.name,
    },
    {
      id: 'description',
      label: 'Description',
      format: (_value, invoice) =>
        invoice.description || invoice.term?.name || '-',
    },
    {
      id: 'total',
      label: 'Total',
      format: (_value, invoice) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(invoice.total)}
        </Typography>
      ),
    },
    {
      id: 'amountPaid',
      label: 'Paid',
      format: (_value, invoice) => {
        const paid = parseFloat(invoice.amountPaid);
        const total = parseFloat(invoice.total);
        if (paid === 0) return '-';
        return (
          <Typography
            variant="body2"
            sx={{ color: paid >= total ? 'success.main' : 'warning.main' }}
          >
            {formatCurrency(invoice.amountPaid)}
          </Typography>
        );
      },
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      format: (_value, invoice) => {
        const isOverdue =
          invoice.status !== 'PAID' &&
          invoice.status !== 'CANCELLED' &&
          new Date(invoice.dueDate) < new Date();
        return (
          <Typography
            variant="body2"
            sx={{ color: isOverdue ? 'error.main' : 'text.primary' }}
          >
            {formatDate(invoice.dueDate)}
          </Typography>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      format: (_value, invoice) => (
        <Chip
          label={invoice.status.replace('_', ' ')}
          size="small"
          sx={{
            backgroundColor: STATUS_COLORS[invoice.status].bg,
            color: STATUS_COLORS[invoice.status].text,
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      format: (_value, invoice) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {invoice.status === 'DRAFT' && (
            <Tooltip title="Send Invoice">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  setInvoiceToSend(invoice);
                  setSendDialogOpen(true);
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {(invoice.status === 'SENT' ||
            invoice.status === 'PARTIALLY_PAID' ||
            invoice.status === 'OVERDUE') && (
            <Tooltip title="Record Payment">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleOpenRecordPayment(invoice)}
              >
                <PaymentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  // Render statistics cards
  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FCF6E6' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Outstanding
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#4580E4' }}>
                {formatCurrency(statistics.totalOutstanding)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFAE9E' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Overdue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#ff4040' }}>
                {formatCurrency(statistics.totalOverdue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Paid This Month
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#96DAC9' }}>
                {statistics.invoicesByStatus.PAID || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Pending
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {(statistics.invoicesByStatus.SENT || 0) +
                  (statistics.invoicesByStatus.PARTIALLY_PAID || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load invoices. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Invoices"
        subtitle="Manage invoices and payments"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AutorenewIcon />}
              onClick={() => setGenerateDialogOpen(true)}
            >
              Generate Invoices
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/invoices/new')}
            >
              Create Invoice
            </Button>
          </Box>
        }
      />

      {/* Statistics */}
      {renderStatistics()}

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                label="Status"
                onChange={(e: SelectChangeEvent) =>
                  handleFilterChange('status', e.target.value)
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Term</InputLabel>
              <Select
                value={filters.termId || ''}
                label="Term"
                onChange={(e: SelectChangeEvent) =>
                  handleFilterChange('termId', e.target.value)
                }
              >
                <MenuItem value="">All Terms</MenuItem>
                {terms.map((term) => (
                  <MenuItem key={term.id} value={term.id}>
                    {term.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Family</InputLabel>
              <Select
                value={filters.familyId || ''}
                label="Family"
                onChange={(e: SelectChangeEvent) =>
                  handleFilterChange('familyId', e.target.value)
                }
              >
                <MenuItem value="">All Families</MenuItem>
                {families.map((family) => (
                  <MenuItem key={family.id} value={family.id}>
                    {family.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        loading={isLoading}
        emptyMessage="No invoices found"
      />

      {/* Generate Invoices Dialog */}
      <GenerateInvoicesDialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        terms={terms}
        families={families}
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={recordPaymentDialogOpen}
        onClose={() => {
          setRecordPaymentDialogOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      {/* Send Invoice Confirmation */}
      <ConfirmDialog
        open={sendDialogOpen}
        title="Send Invoice"
        message={`Are you sure you want to send invoice ${invoiceToSend?.invoiceNumber} to ${invoiceToSend?.family.name}? They will receive an email notification.`}
        confirmLabel="Send"
        onConfirm={handleSendInvoice}
        onCancel={() => {
          setSendDialogOpen(false);
          setInvoiceToSend(null);
        }}
        loading={sendMutation.isPending}
      />
    </Box>
  );
}
