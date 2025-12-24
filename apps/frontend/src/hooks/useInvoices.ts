// ===========================================
// Invoices React Query Hooks
// ===========================================
// Custom hooks for invoice and payment management API operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  adminInvoicesApi,
  parentInvoicesApi,
  pricingPackagesApi,
  InvoiceFilters,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  RecordPaymentInput,
  GenerateTermInvoiceInput,
  CreatePricingPackageInput,
  UpdatePricingPackageInput,
} from '../api/invoices.api';

// ===========================================
// QUERY KEYS
// ===========================================

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters?: InvoiceFilters) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  statistics: () => [...invoiceKeys.all, 'statistics'] as const,
  parent: {
    all: ['parent-invoices'] as const,
    list: () => ['parent-invoices', 'list'] as const,
    detail: (id: string) => ['parent-invoices', 'detail', id] as const,
    payments: () => ['parent-invoices', 'payments'] as const,
  },
};

export const pricingPackageKeys = {
  all: ['pricing-packages'] as const,
  lists: () => [...pricingPackageKeys.all, 'list'] as const,
  list: (includeInactive?: boolean) =>
    [...pricingPackageKeys.lists(), { includeInactive }] as const,
  details: () => [...pricingPackageKeys.all, 'detail'] as const,
  detail: (id: string) => [...pricingPackageKeys.details(), id] as const,
};

// ===========================================
// ADMIN - PRICING PACKAGE QUERIES & MUTATIONS
// ===========================================

/**
 * Get all pricing packages
 */
export function usePricingPackages(includeInactive = false) {
  return useQuery({
    queryKey: pricingPackageKeys.list(includeInactive),
    queryFn: () => pricingPackagesApi.getAll(includeInactive),
  });
}

/**
 * Get a single pricing package
 */
export function usePricingPackage(id: string) {
  return useQuery({
    queryKey: pricingPackageKeys.detail(id),
    queryFn: () => pricingPackagesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Create a new pricing package
 */
export function useCreatePricingPackage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: CreatePricingPackageInput) =>
      pricingPackagesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingPackageKeys.all });
      enqueueSnackbar('Pricing package created successfully', {
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to create pricing package', {
        variant: 'error',
      });
    },
  });
}

/**
 * Update a pricing package
 */
export function useUpdatePricingPackage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePricingPackageInput }) =>
      pricingPackagesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pricingPackageKeys.all });
      queryClient.invalidateQueries({ queryKey: pricingPackageKeys.detail(id) });
      enqueueSnackbar('Pricing package updated successfully', {
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to update pricing package', {
        variant: 'error',
      });
    },
  });
}

/**
 * Delete a pricing package
 */
export function useDeletePricingPackage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => pricingPackagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingPackageKeys.all });
      enqueueSnackbar('Pricing package deleted successfully', {
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to delete pricing package', {
        variant: 'error',
      });
    },
  });
}

// ===========================================
// ADMIN - INVOICE QUERIES
// ===========================================

/**
 * Get all invoices with optional filters
 */
export function useAdminInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => adminInvoicesApi.getAll(filters),
  });
}

/**
 * Get invoice statistics for dashboard
 */
export function useInvoiceStatistics() {
  return useQuery({
    queryKey: invoiceKeys.statistics(),
    queryFn: () => adminInvoicesApi.getStatistics(),
  });
}

/**
 * Get a single invoice by ID
 */
export function useAdminInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => adminInvoicesApi.getById(id),
    enabled: !!id,
  });
}

// ===========================================
// ADMIN - INVOICE MUTATIONS
// ===========================================

/**
 * Create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => adminInvoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      enqueueSnackbar('Invoice created successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to create invoice', {
        variant: 'error',
      });
    },
  });
}

/**
 * Generate term invoices for families
 */
export function useGenerateTermInvoices() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (data: GenerateTermInvoiceInput) =>
      adminInvoicesApi.generateTermInvoices(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      const successCount = result.created.length;
      const errorCount = result.errors.length;

      if (errorCount === 0) {
        enqueueSnackbar(`Successfully generated ${successCount} invoice(s)`, {
          variant: 'success',
        });
      } else {
        enqueueSnackbar(
          `Generated ${successCount} invoice(s), ${errorCount} error(s)`,
          { variant: 'warning' }
        );
      }
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to generate invoices', {
        variant: 'error',
      });
    },
  });
}

/**
 * Update an invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceInput }) =>
      adminInvoicesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      enqueueSnackbar('Invoice updated successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to update invoice', {
        variant: 'error',
      });
    },
  });
}

/**
 * Delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => adminInvoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      enqueueSnackbar('Invoice deleted successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to delete invoice', {
        variant: 'error',
      });
    },
  });
}

/**
 * Send invoice to family
 */
export function useSendInvoice() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => adminInvoicesApi.send(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      enqueueSnackbar('Invoice sent successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to send invoice', {
        variant: 'error',
      });
    },
  });
}

/**
 * Cancel an invoice
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminInvoicesApi.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      enqueueSnackbar('Invoice cancelled successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to cancel invoice', {
        variant: 'error',
      });
    },
  });
}

/**
 * Record a manual payment
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecordPaymentInput }) =>
      adminInvoicesApi.recordPayment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.statistics() });
      enqueueSnackbar('Payment recorded successfully', { variant: 'success' });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to record payment', {
        variant: 'error',
      });
    },
  });
}

// ===========================================
// PARENT - INVOICE QUERIES & MUTATIONS
// ===========================================

/**
 * Get all invoices for parent's family
 */
export function useParentInvoices() {
  return useQuery({
    queryKey: invoiceKeys.parent.list(),
    queryFn: () => parentInvoicesApi.getAll(),
  });
}

/**
 * Get a single invoice for parent
 */
export function useParentInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.parent.detail(id),
    queryFn: () => parentInvoicesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Get payment history for parent
 */
export function useParentPaymentHistory() {
  return useQuery({
    queryKey: invoiceKeys.parent.payments(),
    queryFn: () => parentInvoicesApi.getPaymentHistory(),
  });
}

/**
 * Create a Stripe checkout session for invoice payment
 */
export function useCreatePaymentSession() {
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({
      id,
      successUrl,
      cancelUrl,
    }: {
      id: string;
      successUrl: string;
      cancelUrl: string;
    }) => parentInvoicesApi.createPaymentSession(id, successUrl, cancelUrl),
    onSuccess: (result) => {
      // Redirect to Stripe checkout
      window.location.href = result.url;
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || 'Failed to start payment', {
        variant: 'error',
      });
    },
  });
}
