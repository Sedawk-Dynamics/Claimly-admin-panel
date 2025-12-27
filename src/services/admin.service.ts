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
  PolicyUser,
  PolicyUsersResponse,
  NomineeUser,
  NomineeUsersResponse,
  UserActivityLog,
  UserActivityLogsResponse,
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
      recentPolicies: data.recentPolicies.map((policy) => ({
        ...policy,
        documents: policy.documents?.map((document) => ({
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
  async getCompanies(page = 1, limit = 20, status?: 'ACTIVE' | 'INACTIVE', search?: string): Promise<PaginatedResponse<Company>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());
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
  async getPolicies(page = 1, limit = 20, search?: string): Promise<PaginatedResponse<Policy>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search && search.trim()) params.append('search', search.trim());
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
    status?: 'PENDING' | 'VERIFIED' | 'FALSE_ALERT',
    search?: string,
    detectedVia?: 'SMS' | 'MANUAL',
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResponse<Alert>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (detectedVia) params.append('detectedVia', detectedVia);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
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

  async bulkVerifyAlerts(
    alertIds: string[],
    data: { verificationStatus: 'VERIFIED' | 'FALSE_ALERT'; remarks?: string }
  ): Promise<{ success: number; failed: number; results: Alert[]; errors: any[] }> {
    const response = await api.post<{ success: boolean; data: { success: number; failed: number; results: Alert[]; errors: any[] } }>(
      '/admin/alerts/bulk-verify',
      { alertIds, ...data }
    );
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

  // Notifications
  async sendNotification(payload: { userId: string; title: string; message: string }): Promise<void> {
    await api.post('/admin/notifications', {
      user_id: payload.userId,
      title: payload.title,
      message: payload.message,
    });
  },

  // KYC Documents
  async getKycDocuments(
    page = 1,
    limit = 25,
    status: 'pending' | 'verified' | 'rejected' | 'draft' | 'all' = 'all',
    search?: string
  ): Promise<PaginatedResponse<KycUser>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });
    
    if (search && search.trim()) {
      params.append('search', search.trim());
    }

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

  async rejectKycDocument(documentId: string): Promise<void> {
    await api.patch(`/admin/documents/reject-document/${documentId}`, {
      documentType: 'user',
    });
  },

  async deleteKycDocument(documentId: string): Promise<void> {
    await api.delete(`/admin/documents/document/${documentId}`, {
      data: { documentType: 'user' },
    });
  },

  async acceptUserWithoutDocuments(userId: string): Promise<void> {
    await api.post(`/admin/documents/accept-entity/${userId}`, {
      entityType: 'user',
    });
  },

  async rejectUserWithoutDocuments(userId: string): Promise<void> {
    await api.post(`/admin/documents/reject-entity/${userId}`, {
      entityType: 'user',
    });
  },

  // Policy Documents
  async getPolicyDocuments(
    page = 1,
    limit = 25,
    status: 'pending' | 'verified' | 'rejected' | 'draft' | 'all' = 'all',
    search?: string
  ): Promise<PaginatedResponse<PolicyUser>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });
    
    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    const response = await api.get<{ success: boolean; data: PolicyUsersResponse }>(
      `/admin/documents/policy-documents?${params.toString()}`
    );

    return {
      data: response.data.data.policies.map((policy) => ({
        ...policy,
        documents: policy.documents.map((document) => ({
          ...document,
          documentUrl: toAbsoluteUrl(document.documentUrl),
        })),
      })),
      pagination: response.data.data.pagination,
    };
  },

  async verifyPolicyDocument(documentId: string): Promise<void> {
    await api.patch(`/admin/documents/verify-document/${documentId}`, {
      documentType: 'policy',
    });
  },

  async rejectPolicyDocument(documentId: string): Promise<void> {
    await api.patch(`/admin/documents/reject-document/${documentId}`, {
      documentType: 'policy',
    });
  },

  async acceptPolicyWithoutDocuments(policyId: string): Promise<void> {
    await api.post(`/admin/documents/accept-entity/${policyId}`, {
      entityType: 'policy',
    });
  },

  async rejectPolicyWithoutDocuments(policyId: string): Promise<void> {
    await api.post(`/admin/documents/reject-entity/${policyId}`, {
      entityType: 'policy',
    });
  },

  async verifyPolicyDetails(policyId: string): Promise<void> {
    await api.post(`/admin/documents/verify-details/${policyId}`, {
      entityType: 'policy',
    });
  },
  async verifyNomineeDetails(nomineeId: string): Promise<void> {
    await api.post(`/admin/documents/verify-details/${nomineeId}`, {
      entityType: 'nominee',
    });
  },
  async verifyUserDetails(userId: string): Promise<void> {
    await api.post(`/admin/documents/verify-details/${userId}`, {
      entityType: 'user',
    });
  },

  // Nominee Documents
  async getNomineeDocuments(
    page = 1,
    limit = 25,
    status: 'pending' | 'verified' | 'rejected' | 'draft' | 'all' = 'all',
    search?: string
  ): Promise<PaginatedResponse<NomineeUser>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });
    
    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    const response = await api.get<{ success: boolean; data: NomineeUsersResponse }>(
      `/admin/documents/nominee-documents?${params.toString()}`
    );

    return {
      data: response.data.data.nominees.map((nominee) => ({
        ...nominee,
        documents: nominee.documents.map((document) => ({
          ...document,
          documentUrl: toAbsoluteUrl(document.documentUrl),
        })),
      })),
      pagination: response.data.data.pagination,
    };
  },
  async verifyNomineeDocument(documentId: string): Promise<void> {
    await api.patch(`/admin/documents/verify-document/${documentId}`, {
      documentType: 'nominee',
    });
  },

  async rejectNomineeDocument(documentId: string): Promise<void> {
    await api.patch(`/admin/documents/reject-document/${documentId}`, {
      documentType: 'nominee',
    });
  },

  async acceptNomineeWithoutDocuments(nomineeId: string): Promise<void> {
    await api.post(`/admin/documents/accept-entity/${nomineeId}`, {
      entityType: 'nominee',
    });
  },

  async rejectNomineeWithoutDocuments(nomineeId: string): Promise<void> {
    await api.post(`/admin/documents/reject-entity/${nomineeId}`, {
      entityType: 'nominee',
    });
  },


  // User Activity Logs
  async getUserActivityLogs(userId: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<UserActivityLog>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const response = await api.get<{ success: boolean; data: UserActivityLogsResponse }>(
      `/admin/users/${userId}/activity-logs?${params.toString()}`
    );
    return {
      data: response.data.data.logs,
      pagination: response.data.data.pagination,
    };
  },

  // Subscription Plans
  async getSubscriptionPlans(): Promise<any[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/subscription-plan/admin');
    return response.data.data;
  },

  async getSubscriptionPlanById(id: string): Promise<any> {
    const response = await api.get<{ success: boolean; data: any }>(`/subscription-plan/admin/${id}`);
    return response.data.data;
  },

  async createSubscriptionPlan(data: {
    name: string;
    price: number;
    features: string[];
    isPopular?: boolean;
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>('/subscription-plan/admin', data);
    return response.data.data;
  },

  async updateSubscriptionPlan(id: string, data: {
    name?: string;
    price?: number;
    features?: string[];
    isPopular?: boolean;
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<any> {
    const response = await api.put<{ success: boolean; data: any }>(`/subscription-plan/admin/${id}`, data);
    return response.data.data;
  },

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await api.delete(`/subscription-plan/admin/${id}`);
  },

  // Delete entities by admin
  async deleteKycDocuments(userId: string): Promise<void> {
    await api.delete(`/admin/documents/kyc/${userId}`);
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/documents/user/${userId}`);
  },

  async deletePolicy(policyId: string): Promise<void> {
    await api.delete(`/admin/documents/policy/${policyId}`);
  },

  async deleteNominee(nomineeId: string): Promise<void> {
    await api.delete(`/admin/documents/nominee/${nomineeId}`);
  },
};

