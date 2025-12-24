// ===========================================
// Invoices API Functions
// ===========================================
// API calls for invoice and payment management endpoints

import { apiClient } from '../services/api';

// ===========================================
// TYPES
// ===========================================

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'STRIPE'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'CHECK'
  | 'OTHER';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  pricingPackageId: string | null;
  description: string;
  quantity: number;
  unitPrice: string;
  total: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  method: PaymentMethod;
  stripePaymentId: string | null;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    description: string | null;
  };
}

export interface InvoiceFamily {
  id: string;
  name: string;
  parents: Array<{
    id: string;
    contact1Name: string;
    contact1Email: string;
    contact1Phone: string | null;
  }>;
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
}

export interface InvoiceTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Invoice {
  id: string;
  schoolId: string;
  familyId: string;
  termId: string | null;
  invoiceNumber: string;
  description: string | null;
  subtotal: string;
  tax: string;
  total: string;
  amountPaid: string;
  status: InvoiceStatus;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  family: InvoiceFamily;
  term: InvoiceTerm | null;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceFilters {
  familyId?: string;
  termId?: string;
  status?: InvoiceStatus;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  pricingPackageId?: string;
}

export interface CreateInvoiceInput {
  familyId: string;
  termId?: string;
  description?: string;
  dueDate: string;
  items: CreateInvoiceItemInput[];
}

export interface UpdateInvoiceInput {
  description?: string | null;
  dueDate?: string;
  items?: CreateInvoiceItemInput[];
}

export interface RecordPaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface GenerateTermInvoiceInput {
  termId: string;
  familyIds?: string[];
  dueDate?: string;
  groupRate?: number;
  individualRate?: number;
  standardLessonRate?: number;
}

export interface GenerateInvoicesResult {
  created: Invoice[];
  errors: Array<{ familyId: string; error: string }>;
}

export interface InvoiceStatistics {
  totalOutstanding: number;
  totalOverdue: number;
  invoicesByStatus: Record<InvoiceStatus, number>;
  recentPayments: Payment[];
}

export interface PricingPackageItem {
  type: 'lesson' | 'addon' | 'material';
  name: string;
  quantity?: number;
  lessonTypeId?: string;
  instrumentId?: string;
  price?: number;
}

export interface PricingPackage {
  id: string;
  schoolId: string;
  name: string;
  description: string | null;
  price: string;
  items: PricingPackageItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    invoiceItems: number;
  };
}

export interface CreatePricingPackageInput {
  name: string;
  description?: string;
  price: number;
  items: PricingPackageItem[];
}

export interface UpdatePricingPackageInput {
  name?: string;
  description?: string | null;
  price?: number;
  items?: PricingPackageItem[];
  isActive?: boolean;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

// ===========================================
// API RESPONSE TYPE
// ===========================================

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// ===========================================
// ADMIN - PRICING PACKAGES API
// ===========================================

export const pricingPackagesApi = {
  /**
   * Get all pricing packages
   */
  getAll: async (includeInactive = false): Promise<PricingPackage[]> => {
    const response = await apiClient.get<ApiResponse<PricingPackage[]>>(
      '/invoices/admin/pricing-packages',
      { params: { includeInactive: includeInactive.toString() } }
    );
    return response.data.data;
  },

  /**
   * Get a single pricing package
   */
  getById: async (id: string): Promise<PricingPackage> => {
    const response = await apiClient.get<ApiResponse<PricingPackage>>(
      `/invoices/admin/pricing-packages/${id}`
    );
    return response.data.data;
  },

  /**
   * Create a new pricing package
   */
  create: async (data: CreatePricingPackageInput): Promise<PricingPackage> => {
    const response = await apiClient.post<ApiResponse<PricingPackage>>(
      '/invoices/admin/pricing-packages',
      data
    );
    return response.data.data;
  },

  /**
   * Update a pricing package
   */
  update: async (
    id: string,
    data: UpdatePricingPackageInput
  ): Promise<PricingPackage> => {
    const response = await apiClient.patch<ApiResponse<PricingPackage>>(
      `/invoices/admin/pricing-packages/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete a pricing package
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/admin/pricing-packages/${id}`);
  },
};

// ===========================================
// ADMIN - INVOICES API
// ===========================================

export const adminInvoicesApi = {
  /**
   * Get all invoices with optional filters
   */
  getAll: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>(
      '/invoices/admin/invoices',
      { params: filters }
    );
    return response.data.data;
  },

  /**
   * Get invoice statistics for dashboard
   */
  getStatistics: async (): Promise<InvoiceStatistics> => {
    const response = await apiClient.get<ApiResponse<InvoiceStatistics>>(
      '/invoices/admin/invoices/statistics'
    );
    return response.data.data;
  },

  /**
   * Get a single invoice with details
   */
  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<ApiResponse<Invoice>>(
      `/invoices/admin/invoices/${id}`
    );
    return response.data.data;
  },

  /**
   * Create a new invoice
   */
  create: async (data: CreateInvoiceInput): Promise<Invoice> => {
    const response = await apiClient.post<ApiResponse<Invoice>>(
      '/invoices/admin/invoices',
      data
    );
    return response.data.data;
  },

  /**
   * Generate term invoices for families
   */
  generateTermInvoices: async (
    data: GenerateTermInvoiceInput
  ): Promise<GenerateInvoicesResult> => {
    const response = await apiClient.post<ApiResponse<GenerateInvoicesResult>>(
      '/invoices/admin/invoices/generate',
      data
    );
    return response.data.data;
  },

  /**
   * Update an invoice (only DRAFT invoices)
   */
  update: async (id: string, data: UpdateInvoiceInput): Promise<Invoice> => {
    const response = await apiClient.patch<ApiResponse<Invoice>>(
      `/invoices/admin/invoices/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete an invoice (only DRAFT invoices)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/admin/invoices/${id}`);
  },

  /**
   * Send invoice to family (changes status to SENT)
   */
  send: async (id: string): Promise<Invoice> => {
    const response = await apiClient.post<ApiResponse<Invoice>>(
      `/invoices/admin/invoices/${id}/send`
    );
    return response.data.data;
  },

  /**
   * Cancel an invoice
   */
  cancel: async (id: string, reason?: string): Promise<Invoice> => {
    const response = await apiClient.post<ApiResponse<Invoice>>(
      `/invoices/admin/invoices/${id}/cancel`,
      { reason }
    );
    return response.data.data;
  },

  /**
   * Record a manual payment
   */
  recordPayment: async (
    id: string,
    data: RecordPaymentInput
  ): Promise<Payment> => {
    const response = await apiClient.post<ApiResponse<Payment>>(
      `/invoices/admin/invoices/${id}/payment`,
      data
    );
    return response.data.data;
  },
};

// ===========================================
// PARENT - INVOICES API
// ===========================================

export const parentInvoicesApi = {
  /**
   * Get all invoices for the parent's family
   */
  getAll: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>(
      '/invoices/parent/invoices'
    );
    return response.data.data;
  },

  /**
   * Get a single invoice (must belong to parent's family)
   */
  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<ApiResponse<Invoice>>(
      `/invoices/parent/invoices/${id}`
    );
    return response.data.data;
  },

  /**
   * Create a Stripe checkout session for invoice payment
   */
  createPaymentSession: async (
    id: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession> => {
    const response = await apiClient.post<ApiResponse<CheckoutSession>>(
      `/invoices/parent/invoices/${id}/pay`,
      { successUrl, cancelUrl }
    );
    return response.data.data;
  },

  /**
   * Get payment history for the parent's family
   */
  getPaymentHistory: async (): Promise<Payment[]> => {
    const response = await apiClient.get<ApiResponse<Payment[]>>(
      '/invoices/parent/payments'
    );
    return response.data.data;
  },
};
