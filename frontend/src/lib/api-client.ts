import axiosInstance from './axios';

// Base API response type
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

// Error response type
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

// Base API client class
class ApiClient {
  protected client = axiosInstance;

  protected async handleResponse<T>(promise: Promise<any>): Promise<T> {
    try {
      const response = await promise;
      return response.data;
    } catch (error: any) {
      // Transform error to consistent format
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'An unexpected error occurred',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: any): Promise<T> {
    return this.handleResponse<T>(this.client.get(url, config));
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.handleResponse<T>(this.client.post(url, data, config));
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.handleResponse<T>(this.client.patch(url, data, config));
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.handleResponse<T>(this.client.put(url, data, config));
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    return this.handleResponse<T>(this.client.delete(url, config));
  }
}

export default new ApiClient(); 