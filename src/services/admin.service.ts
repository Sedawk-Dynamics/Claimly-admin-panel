import api from './api';
import {
  User,
  UserDetail,
  Company,
  Policy,
  Alert,
  AdminAction,
  PaginatedResponse,
  AlertStats,
  UsersResponse,
  CompaniesResponse,
  PoliciesResponse,
  AlertsResponse,
  AdminActionsResponse,
  KycUser,
  KycUsersResponse,
} from '../types';

const apiBaseUrl = (api.defaults.baseURL || window.location.origin).replace(/\/$/, '');
const toAbsoluteUrl = (url: string) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

export const adminService = {
  // Users
  async getUsers(page = 1, limit = 20, search?: string): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await api.get<{ success: boolean; data: UsersResponse }>(
      `/admin/users?${params.toString()}`
    );
    // Transform backend response to frontend format
    return {
      data: response.data.data.users,
      pagination: response.data.data.pagination,
    };
  },

  async getUserById(id: string): Promise<UserDetail> {
    const response = await api.get<{ success: boolean; data: UserDetail }>(`/admin/users/${id}`);
    const data = response.data.data;

    return {
      ...data,
      documents: data.documents.map((document) => ({
        ...document,
        documentUrl: toAbsoluteUrl(document.documentUrl),
      })),
      nominees: data.nominees.map((nominee) => ({
        ...nominee,
        documents: nominee.documents.map((document) => ({
          ...document,
          documentUrl: toAbsoluteUrl(document.documentUrl),
        })),
      })),
    };
  },

  async updateUserStatus(id: string, subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>(`/admin/users/${id}/status`, {
      subscriptionStatus,
    });
    return response.data.data;
  },

  // Companies
  async getCompanies(page = 1, limit = 20, status?: 'ACTIVE' | 'INACTIVE'): Promise<PaginatedResponse<Company>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    const response = await api.get<{ success: boolean; data: CompaniesResponse }>(
      `/admin/companies?${params.toString()}`
    );
    // Transform backend response to frontend format
    return {
      data: response.data.data.companies,
      pagination: response.data.data.pagination,
    };
  },

  async getCompanyById(id: string): Promise<Company> {
    const response = await api.get<{ success: boolean; data: Company }>(`/admin/companies/${id}`);
    return response.data.data;
  },

  async createCompany(data: {
    name: string;
    contactEmail: string;
    contactNumber: string;
    websiteUrl?: string;
    address?: string;
  }): Promise<Company> {
    const response = await api.post<{ success: boolean; data: Company }>('/admin/companies', data);
    return response.data.data;
  },

  async updateCompany(
    id: string,
    data: {
      name?: string;
      contactEmail?: string;
      contactNumber?: string;
      websiteUrl?: string;
      address?: string;
      status?: 'ACTIVE' | 'INACTIVE';
    }
  ): Promise<Company> {
    const response = await api.put<{ success: boolean; data: Company }>(`/admin/companies/${id}`, data);
    return response.data.data;
  },

  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/admin/companies/${id}`);
  },

  // Policies
  async getPolicies(page = 1, limit = 20): Promise<PaginatedResponse<Policy>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const response = await api.get<{ success: boolean; data: PoliciesResponse }>(
      `/admin/policies?${params.toString()}`
    );
    // Transform backend response to frontend format
    return {
      data: response.data.data.policies,
      pagination: response.data.data.pagination,
    };
  },

  // Alerts
  async getAlerts(
    page = 1,
    limit = 20,
    status?: 'PENDING' | 'VERIFIED' | 'FALSE_ALERT'
  ): Promise<PaginatedResponse<Alert>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    const response = await api.get<{ success: boolean; data: AlertsResponse }>(
      `/admin/alerts?${params.toString()}`
    );
    // Transform backend response to frontend format
    return {
      data: response.data.data.alerts,
      pagination: response.data.data.pagination,
    };
  },

  async getAlertById(id: string): Promise<Alert> {
    const response = await api.get<{ success: boolean; data: Alert }>(`/admin/alerts/${id}`);
    return response.data.data;
  },

  async verifyAlert(
    id: string,
    data: { verificationStatus: 'VERIFIED' | 'FALSE_ALERT'; remarks?: string }
  ): Promise<Alert> {
    const response = await api.put<{ success: boolean; data: Alert }>(`/admin/alerts/${id}/verify`, data);
    return response.data.data;
  },

  async getAlertStats(): Promise<AlertStats> {
    const response = await api.get<{ success: boolean; data: AlertStats }>('/admin/alerts/stats');
    return response.data.data;
  },

  // Admin Actions
  async getAdminActions(page = 1, limit = 20): Promise<PaginatedResponse<AdminAction>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const response = await api.get<{ success: boolean; data: AdminActionsResponse }>(
      `/admin/actions?${params.toString()}`
    );
    // Transform backend response to frontend format
    return {
      data: response.data.data.actions,
      pagination: response.data.data.pagination,
    };
  },

  async getAdminActionById(id: string): Promise<AdminAction> {
    const response = await api.get<{ success: boolean; data: AdminAction }>(`/admin/actions/${id}`);
    return response.data.data;
  },

  // KYC Documents
  async getKycDocuments(
    page = 1,
    limit = 20,
    status: 'pending' | 'verified' = 'pending'
  ): Promise<PaginatedResponse<KycUser>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });

    const response = await api.get<{ success: boolean; data: KycUsersResponse }>(
      `/admin/documents/kyc-documents?${params.toString()}`
    );

    return {
      data: response.data.data.users.map((user) => ({
        ...user,
        documents: user.documents.map((document) => ({
          ...document,
          documentUrl: toAbsoluteUrl(document.documentUrl),
        })),
      })),
      pagination: response.data.data.pagination,
    };
  },

  async verifyKycDocument(documentId: string): Promise<void> {
    await api.patch(`/admin/documents/verify-document/${documentId}`, {
      documentType: 'user',
    });
  },
};

