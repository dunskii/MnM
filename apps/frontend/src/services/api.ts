import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

// ===========================================
// CSRF Token Management
// ===========================================

let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

/**
 * Fetch CSRF token from server
 * Uses a singleton promise to prevent multiple simultaneous fetches
 */
async function fetchCsrfToken(): Promise<string> {
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = axios
    .get<{ csrfToken: string }>(`${API_BASE}/api/csrf-token`, {
      withCredentials: true,
    })
    .then((response) => {
      csrfToken = response.data.csrfToken;
      csrfTokenPromise = null;
      return csrfToken;
    })
    .catch((error) => {
      csrfTokenPromise = null;
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    });

  return csrfTokenPromise;
}

/**
 * Get current CSRF token, fetching if necessary
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  return fetchCsrfToken();
}

/**
 * Clear CSRF token (called on 403 to force refresh)
 */
function clearCsrfToken(): void {
  csrfToken = null;
}

/**
 * Initialize CSRF token on app load
 * Call this early in app initialization
 */
export async function initializeCsrf(): Promise<void> {
  try {
    await fetchCsrfToken();
  } catch (error) {
    console.warn('CSRF token initialization failed, will retry on first request');
  }
}

// ===========================================
// Axios Instance
// ===========================================

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ===========================================
// Request Interceptor
// ===========================================

// Methods that require CSRF protection
const CSRF_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  async (config) => {
    // Add auth token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing methods
    if (config.method && CSRF_METHODS.includes(config.method.toUpperCase())) {
      try {
        const csrf = await getCsrfToken();
        config.headers['x-csrf-token'] = csrf;
      } catch (error) {
        // If CSRF fetch fails, continue anyway - server will reject if needed
        console.warn('Could not get CSRF token for request');
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===========================================
// Response Interceptor
// ===========================================

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _csrfRetry?: boolean;
    };

    // Handle CSRF token mismatch (403 with CSRF error)
    if (
      error.response?.status === 403 &&
      !originalRequest._csrfRetry &&
      isCsrfError(error)
    ) {
      originalRequest._csrfRetry = true;

      // Clear and refresh CSRF token
      clearCsrfToken();

      try {
        const newCsrfToken = await fetchCsrfToken();
        if (originalRequest.headers) {
          originalRequest.headers['x-csrf-token'] = newCsrfToken;
        }
        return api(originalRequest);
      } catch (csrfError) {
        console.error('CSRF token refresh failed:', csrfError);
        return Promise.reject(error);
      }
    }

    // If 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Check if error is a CSRF-related error
 */
function isCsrfError(error: AxiosError): boolean {
  const data = error.response?.data as { message?: string } | undefined;
  const message = data?.message?.toLowerCase() || '';
  return message.includes('csrf');
}

export default api;

// Type-safe API methods
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((res) => res.data),

  // Raw response (includes headers) - use for blob downloads
  getRaw: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config),
};
