import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEffectiveApiUrl } from '../config/api';

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  retryable: boolean;
}

export interface ApiRequestConfig extends RequestInit {
  skipAuth?: boolean;
  maxRetries?: number;
  retryDelays?: number[];
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  status: number;
}

// =============================================
// ERROR CLASSIFICATIONS
// =============================================

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'Request timeout. Please check your connection.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
  502: 'Server is temporarily unavailable.',
  503: 'Service unavailable. Please try again later.',
  504: 'Gateway timeout. Please try again.',
};

// Determine if an error is retryable
function isRetryableError(status?: number, error?: any): boolean {
  // Network errors are retryable
  if (!status && error) {
    return true;
  }
  
  // Server errors (5xx) are retryable
  if (status && status >= 500 && status < 600) {
    return true;
  }
  
  // Request timeout is retryable
  if (status === 408) {
    return true;
  }
  
  // Too many requests might be retryable after delay
  if (status === 429) {
    return true;
  }
  
  return false;
}

// =============================================
// TOKEN REFRESH SINGLETON
// =============================================

let refreshPromise: Promise<boolean> | null = null;

/**
 * Singleton pattern for token refresh
 * Ensures only one refresh request happens at a time
 * Other requests wait for the same refresh to complete
 */
async function refreshAccessToken(): Promise<boolean> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    console.log('🔄 API Client: Waiting for existing token refresh...');
    return refreshPromise;
  }

  // Start new refresh process
  refreshPromise = (async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        console.log('❌ API Client: No refresh token available');
        return false;
      }

      console.log('🔄 API Client: Starting token refresh...');
      
      const response = await fetch(`${getEffectiveApiUrl()}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store new access token
        await AsyncStorage.setItem('accessToken', data.access);
        
        // Store new refresh token if provided (token rotation)
        if (data.refresh) {
          await AsyncStorage.setItem('refreshToken', data.refresh);
        }
        
        console.log('✅ API Client: Token refresh successful');
        return true;
      } else {
        console.log('❌ API Client: Refresh token expired');
        // Clear all auth data
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return false;
      }
    } catch (error) {
      console.error('❌ API Client: Token refresh failed:', error);
      return false;
    } finally {
      // Clear the promise so next refresh can proceed
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// =============================================
// REQUEST DEDUPLICATION
// =============================================

// Store parsed responses instead of Response objects to avoid "Already read" error
const ongoingRequests = new Map<string, Promise<{data: any, status: number}>>();

function getRequestKey(url: string, config?: ApiRequestConfig): string {
  const method = config?.method || 'GET';
  const body = config?.body || '';
  return `${method}:${url}:${body}`;
}

// =============================================
// EXPONENTIAL BACKOFF RETRY LOGIC
// =============================================


// =============================================
// MAIN API CLIENT
// =============================================

class ApiClient {
  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make an API request with automatic retry and error handling
   */
  async request<T = any>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${getEffectiveApiUrl()}${endpoint}`;
    
    // No retries - fail immediately and let user pull to refresh
    const maxRetries = config.maxRetries ?? 0;
    
    // Temporarily disabled deduplication due to issues
    // TODO: Re-implement properly later

    let lastError: ApiError | null = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Get auth headers unless explicitly skipped
        let headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...config.headers,
        };

        if (!config.skipAuth) {
          const authHeaders = await this.getAuthHeaders();
          headers = { ...headers, ...authHeaders };
        }

        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutMs = 30000; // 30 second timeout
        
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeoutMs);

        // Create the fetch promise with abort signal
        const fetchPromise = fetch(url, {
          ...config,
          headers,
          signal: controller.signal,
        });

        try {
          const response = await fetchPromise;
          clearTimeout(timeoutId);

          // Handle 401 Unauthorized - try token refresh once
          if (response.status === 401 && !config.skipAuth && attempt === 0) {
          console.log('🔐 API Client: Got 401, attempting token refresh...');
          const refreshSuccess = await refreshAccessToken();
          
          if (refreshSuccess) {
            console.log('🔄 API Client: Retrying after token refresh...');
            attempt++; // Count this as an attempt
            continue; // Retry with new token
          } else {
            // Refresh failed, return auth error
            return {
              error: {
                message: ERROR_MESSAGES[401],
                status: 401,
                code: 'AUTH_EXPIRED',
                retryable: false,
              },
              status: 401,
            };
          }
        }

        // Success or client error (4xx) - return response
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          let data: T | undefined;
          
          // Try to parse JSON response
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              data = await response.json();
            } catch {
              // JSON parse error, leave data undefined
            }
          }

          if (!response.ok) {
            return {
              error: {
                message: ERROR_MESSAGES[response.status] || 'An error occurred',
                status: response.status,
                retryable: false,
              },
              status: response.status,
              data,
            };
          }

          return { data, status: response.status };
        }

        // Server error (5xx) - might retry
        if (isRetryableError(response.status) && attempt < maxRetries) {
          
          lastError = {
            message: ERROR_MESSAGES[response.status] || 'Server error',
            status: response.status,
            retryable: true,
          };

          await new Promise(resolve => setTimeout(resolve, 1000));
          attempt++;
          continue;
        }

        // Non-retryable error or max retries reached
        return {
          error: {
            message: ERROR_MESSAGES[response.status] || 'An error occurred',
            status: response.status,
            retryable: false,
          },
          status: response.status,
        };
        
        } catch (error: any) {
          clearTimeout(timeoutId);
          
          // Check if it's an abort error (timeout)
          if (error.name === 'AbortError') {
            lastError = {
              message: 'Request timed out. Please try again.',
              code: 'TIMEOUT',
              retryable: true,
            };
          } else {
            // Other network errors - use log instead of error to avoid Expo overlay
            lastError = {
              message: 'Network error. Please check your connection.',
              code: 'NETWORK_ERROR',
              retryable: true,
            };
          }
          
          // If we're not retrying, return the error immediately
          if (attempt >= maxRetries) {
            return {
              error: lastError,
              status: 0,
            };
          }
        }

      } catch (error: any) {
        // This should never happen now since we handle errors inside

        lastError = {
          message: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR',
          retryable: true,
        };

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempt++;
          continue;
        }

        // Max retries reached
        return {
          error: lastError,
          status: 0,
        };
      }
    }

    // Should not reach here, but return last error if we do
    return {
      error: lastError || {
        message: 'Unknown error occurred',
        retryable: false,
      },
      status: 0,
    };
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<T = any>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Clear all ongoing requests (useful for cleanup)
   */
  clearOngoingRequests(): void {
    ongoingRequests.clear();
  }

  /**
   * Clear all API cache and ongoing requests
   * Useful when logging out or switching accounts
   */
  clearCache(): void {
    ongoingRequests.clear();
    console.log('✅ API Client: Cache cleared');
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const accessToken = await AsyncStorage.getItem('accessToken');
    return !!accessToken;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for testing
export const testHelpers = {
  isRetryableError,
  getRequestKey,
};