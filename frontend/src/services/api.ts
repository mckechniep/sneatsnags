import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiResponse, ApiError, QueryParams } from '../types/api';
import SweetAlert from '../utils/sweetAlert';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = 'https://sneatsnags-backend.onrender.com/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${this.baseURL}/auth/refresh`, {
                refreshToken,
              });
              
              const { accessToken } = response.data.data;
              localStorage.setItem('accessToken', accessToken);
              
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }

        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          status: error.response?.status || 500,
          errors: error.response?.data?.errors,
        };

        // Handle common errors automatically (unless suppressed)
        if (error.response?.status === 500 && !originalRequest._suppressErrorAlert) {
          SweetAlert.error('Server Error', 'We\'re experiencing technical difficulties. Please try again later.');
        }

        return Promise.reject(apiError);
      }
    );
  }

  async get<T = any>(
    endpoint: string,
    params?: QueryParams,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get(endpoint, { params, ...config });
    return response.data;
  }

  async getSilent<T = any>(
    endpoint: string,
    params?: QueryParams,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const silentConfig = { 
      ...config, 
      _suppressErrorAlert: true 
    };
    const response = await this.client.get(endpoint, { params, ...silentConfig });
    return response.data;
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(endpoint, data, config);
    return response.data;
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put(endpoint, data, config);
    return response.data;
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch(endpoint, data, config);
    return response.data;
  }

  async delete<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete(endpoint, config);
    return response.data;
  }

  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient;