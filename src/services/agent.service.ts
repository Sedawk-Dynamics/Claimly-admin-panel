import api from './api';

export interface AgentReferralInfo {
  referralCode: string;
}

export interface AgentReferredUser {
  id: string;
  name: string;
  email: string | null;
  mobileNumber: string;
  createdAt: string;
  hasSubscription: boolean;
  firstSubscriptionAt: string | null;
  commissionAmount: number;
}

export interface AgentReferralStats {
  totalReferredUsers: number;
  totalSubscribedUsers: number;
  totalCommissionAmount: number;
}

export interface AgentReferralTransaction {
  id: string;
  userId: string;
  userName: string;
  planName: string;
  amount: number;
  commissionAmount: number;
  transactionDate: string;
}

export interface AgentReferralResponse {
  referrals: AgentReferredUser[];
  stats: AgentReferralStats;
  transactions: AgentReferralTransaction[];
}

export const agentService = {
  async getReferralCode(): Promise<AgentReferralInfo> {
    const response = await api.get<{ success: boolean; data: AgentReferralInfo }>('/admin/agent/me/referral-code');
    return response.data.data;
  },

  async getReferrals(): Promise<AgentReferralResponse> {
    const response = await api.get<{ success: boolean; data: AgentReferralResponse }>('/admin/agent/me/referrals');
    return response.data.data;
  },
};

