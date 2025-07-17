import { apiClient } from './api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  User,
} from '../types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // The backend returns data in { success, message, data } format
    // where data contains the AuthResponse
    const authData = (response as any).data || response;
    
    if (authData && authData.tokens && authData.user) {
      localStorage.setItem('accessToken', authData.tokens.accessToken);
      localStorage.setItem('refreshToken', authData.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
    
    return authData;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    
    // The backend returns data in { success, message, data } format
    // where data contains the AuthResponse
    const authData = (response as any).data || response;
    
    if (authData && authData.tokens && authData.user) {
      localStorage.setItem('accessToken', authData.tokens.accessToken);
      localStorage.setItem('refreshToken', authData.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
    
    return authData;
  },

  async logout(): Promise<void> {
    try {
      console.log('AuthService: Attempting logout API call...');
      await apiClient.post('/auth/logout');
      console.log('AuthService: Logout API call succeeded');
    } catch (error) {
      console.error('AuthService: Logout API call failed:', error);
    } finally {
      console.log('AuthService: Clearing localStorage...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      console.log('AuthService: localStorage cleared');
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/users/change-password', passwordData);
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.get(`/auth/verify-email?token=${token}`);
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/users/profile');
    return (response as any).data || response;
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/users/profile', userData);
    
    // Handle both ApiResponse format and direct data format
    const userData_result = (response as any).data || response;
    
    if (userData_result) {
      localStorage.setItem('user', JSON.stringify(userData_result));
    }
    
    return userData_result;
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },
};