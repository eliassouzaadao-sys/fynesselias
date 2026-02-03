/**
 * Base API service with common methods for HTTP requests
 * Includes retry logic and concurrency handling to prevent 400 errors
 */

import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { requestQueue } from '@/lib/request-queue';

export class ApiService {
  private baseUrl: string;
  private requestTimeout = 30000; // 30 seconds

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Creates an abort signal with timeout
   */
  private createAbortSignal(): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), this.requestTimeout);
    return controller.signal;
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return requestQueue.execute(async () => {
      try {
        const url = new URL(endpoint, window.location.origin);

        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.append(key, String(value));
            }
          });
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: this.createAbortSignal(),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }

        return {
          data,
          success: true,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    });
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return requestQueue.execute(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: this.createAbortSignal(),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }

        return {
          data,
          success: true,
          message: data.message,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    });
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return requestQueue.execute(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: this.createAbortSignal(),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }

        return {
          data,
          success: true,
          message: data.message,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    });
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return requestQueue.execute(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: this.createAbortSignal(),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }

        return {
          data,
          success: true,
          message: data.message,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    });
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return requestQueue.execute(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: this.createAbortSignal(),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }

        return {
          data,
          success: true,
          message: data.message,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        };
      }
    });
  }
}

export const apiService = new ApiService();
