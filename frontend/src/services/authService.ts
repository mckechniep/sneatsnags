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
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    // Check if token is expired
    return !this.isTokenExpired(token);
  },

  getToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      // Token is expired, clear it manually to avoid circular dependency
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return null;
    }
    
    return token;
  },

  isTokenExpired(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return true;
    }
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      if (!payload || !payload.exp) {
        return true;
      }
      
      const currentTime = Date.now() / 1000;
      
      // Add 60 second buffer to account for clock differences
      return payload.exp <= (currentTime + 60);
    } catch (error) {
      // If we can't decode the token, consider it expired
      console.warn('Error decoding JWT token:', error);
      return true;
    }
  },

  getTokenExpiry(token?: string): Date | null {
    const tokenToCheck = token || localStorage.getItem('accessToken');
    if (!tokenToCheck) return null;
    
    try {
      const parts = tokenToCheck.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1]));
      if (!payload || !payload.exp) {
        return null;
      }
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  },

  getTimeUntilExpiry(token?: string): number | null {
    const expiryDate = this.getTokenExpiry(token);
    if (!expiryDate) return null;
    
    return Math.max(0, expiryDate.getTime() - Date.now());
  },

  shouldRefreshToken(token?: string): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry(token);
    if (!timeUntilExpiry) return false;
    
    // Refresh if token expires within 5 minutes (300000ms)
    return timeUntilExpiry < 300000;
  },
};