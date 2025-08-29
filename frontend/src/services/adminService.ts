import { apiClient } from './api';
import type { PaginatedResponse, QueryParams } from '../types/api';
import type { User } from '../types/auth';
import type { Event } from '../types/events';

export interface AdminDashboardStats {
  users: {
    total: number;
    buyers: number;
    sellers: number;
    activeThisMonth: number;
  };
  events: {
    total: number;
    upcoming: number;
    active: number;
  };
  transactions: {
    total: number;
    pending: number;
    completed: number;
    volume: number;
    revenue: number;
  };
  offers: {
    total: number;
    active: number;
    accepted: number;
  };
  listings: {
    total: number;
    available: number;
    sold: number;
  };
}

export interface AdminAnalytics {
  userGrowth: Array<{ date: string; count: number }>;
  transactionVolume: Array<{ date: string; volume: number }>;
  revenueGrowth: Array<{ date: string; revenue: number }>;
  popularEvents: Array<{ name: string; transactions: number; revenue: number }>;
  topSellers: Array<{ name: string; sales: number; revenue: number }>;
  platformMetrics: {
    totalRevenue: number;
    platformFees: number;
    averageTicketPrice: number;
    conversionRate: number;
  };
}

export interface SystemSettings {
  platform: {
    commissionRate: number;
    maxListingDuration: number;
    minOfferAmount: number;
    maxRefundDays: number;
  };
  payment: {
    stripeEnabled: boolean;
    autoPayoutEnabled: boolean;
    payoutSchedule: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  security: {
    twoFactorRequired: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export const adminService = {
  // Dashboard
  async getDashboard(): Promise<AdminDashboardStats> {
    const response = await apiClient.get<AdminDashboardStats>('/admin/dashboard');
    return response.data!;
  },

  // User Management
  async getAllUsers(params?: QueryParams & {
    role?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User>>('/admin/users', params);
    return response.data!;
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/admin/users/${id}`);
    return response.data!;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/admin/users/${id}`, userData);
    return response.data!;
  },

  async deactivateUser(id: string, reason: string): Promise<User> {
    const response = await apiClient.post<User>(`/admin/users/${id}/deactivate`, { reason });
    return response.data!;
  },

  async reactivateUser(id: string): Promise<User> {
    const response = await apiClient.post<User>(`/admin/users/${id}/reactivate`);
    return response.data!;
  },

  // Event Management
  async getAllEvents(params?: QueryParams & {
    status?: string;
    eventType?: string;
    city?: string;
    state?: string;
  }): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get<PaginatedResponse<Event>>('/admin/events', params);
    return response.data!;
  },

  // Transaction Management
  async getAllTransactions(params?: QueryParams & {
    status?: string;
    eventId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<PaginatedResponse<any>>('/admin/transactions', params);
    return response.data!;
  },

  // Analytics
  async getAnalytics(params?: {
    period?: string;
    metric?: string;
  }): Promise<AdminAnalytics> {
    const response = await apiClient.get<AdminAnalytics>('/admin/analytics', params);
    return response.data!;
  },

  // Support Tickets
  async getSupportTickets(params?: QueryParams & {
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<PaginatedResponse<SupportTicket>> {
    const response = await apiClient.get<PaginatedResponse<SupportTicket>>('/admin/support-tickets', params);
    return response.data!;
  },

  async assignSupportTicket(id: string, assignedTo: string): Promise<SupportTicket> {
    const response = await apiClient.post<SupportTicket>(`/admin/support-tickets/${id}/assign`, { assignedTo });
    return response.data!;
  },

  async resolveSupportTicket(id: string, resolution: string): Promise<SupportTicket> {
    const response = await apiClient.post<SupportTicket>(`/admin/support-tickets/${id}/resolve`, { resolution });
    return response.data!;
  },

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    const response = await apiClient.get<SystemSettings>('/admin/settings');
    return response.data!;
  },

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await apiClient.put<SystemSettings>('/admin/settings', settings);
    return response.data!;
  },

  // Activity Logs
  async getActivityLogs(params?: QueryParams & {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiClient.get<PaginatedResponse<ActivityLog>>('/admin/activity-logs', params);
    return response.data!;
  },

  // Data Export
  async exportData(params: {
    type: string;
    format?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ url: string; expiresAt: string }> {
    const response = await apiClient.post<{ url: string; expiresAt: string }>('/admin/export', params);
    return response.data!;
  },
};