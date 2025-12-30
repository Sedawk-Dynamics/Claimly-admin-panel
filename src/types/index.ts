export interface Admin {
  adminId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'STAFF';
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export interface User {
  id: string;
  email: string;
  name: string;
  mobileNumber: string;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  dob?: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    policiesCount: number;
    nomineesCount: number;
    documentsCount: number;
    subscriptionsCount?: number;
    alertsCount?: number;
  };
}

export interface UserDocument {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
}

export interface NomineeDocument extends UserDocument { }

export interface NomineePolicyLink {
  id: string;
  policyNumber: string;
  sumAssured?: string;
  status?: string;
  sharePercentage?: string;
}

export interface NomineeDetail {
  id: string;
  name: string;
  relationship: string;
  mobileNumber: string;
  dob?: string | null;
  email?: string | null;
  address?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  policies: NomineePolicyLink[];
  documents: NomineeDocument[];
}

export interface PolicyDocument {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
}

export interface UserPolicySummary {
  id: string;
  policyNumber: string;
  sumAssured: string;
  status: string;
  uploadedAt?: string;
  insuranceCompany?: {
    id: string;
    name: string;
    contactEmail?: string | null;
    contactNumber?: string | null;
    websiteUrl?: string | null;
    address?: string | null;
  };
  nominees?: Array<{
    id: string;
    name: string;
    relationship: string;
    sharePercentage: string;
  }>;
  documents?: PolicyDocument[];
}

export interface UserSubscriptionSummary {
  id: string;
  planName: string;
  amount: string;
  paymentStatus: string;
  transactionDate: string;
}

export interface UserAlertSummary {
  id: string;
  detectedVia: string;
  detectionDate: string;
  verificationStatus: string;
  createdAt: string;
}

export interface UserDetail extends User {
  firebaseUid?: string | null;
  deviceId?: string | null;
  referralCode?: string | null;
  walletBalance?: number;
  stats: {
    policiesCount: number;
    nomineesCount: number;
    documentsCount: number;
    subscriptionsCount: number;
    alertsCount: number;
  };
  nominees: NomineeDetail[];
  documents: UserDocument[];
  recentPolicies: UserPolicySummary[];
  recentSubscriptions: UserSubscriptionSummary[];
  recentAlerts: UserAlertSummary[];
}

export interface Company {
  id: string;
  name: string;
  contactEmail: string;
  contactNumber: string;
  websiteUrl: string | null;
  address: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: string;
  policyNumber: string;
  userId: string;
  sumAssured: string;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  uploadedAt: string;
  user?: {
    id: string;
    name: string;
    mobileNumber: string;
    email: string;
  };
  insuranceCompany?: {
    id: string;
    name: string;
    contactEmail: string;
    contactNumber: string;
  };
  nominees?: Array<{
    id: string;
    nominee: {
      id: string;
      name: string;
      relationship: string;
      dob?: string | null;
      status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    };
    sharePercentage: string;
  }>;
  documents?: Array<{
    id: string;
    documentType: string;
    documentName: string;
    isVerified: boolean;
  }>;
  stats?: {
    nomineesCount: number;
    documentsCount: number;
  };
}

export interface Alert {
  id: string;
  detectedVia: string;
  detectionDate: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FALSE_ALERT';
  remarks: string | null;
  verifiedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  alertType?: string;
  smsText?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    mobileNumber: string;
  };
}

export interface AdminAction {
  id: string;
  actionType: string;
  notes: string | null;
  createdAt: string;
  admin?: {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'STAFF';
  };
  user?: {
    id: string;
    name: string;
    email: string;
    mobileNumber?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Backend response formats
export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CompaniesResponse {
  companies: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PoliciesResponse {
  policies: Policy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AlertsResponse {
  alerts: Alert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminActionsResponse {
  actions: AdminAction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AlertStats {
  total: number;
  pending: number;
  verified: number;
  falseAlerts: number;
  smsAlerts?: number;
  manualAlerts?: number;
  typeStats?: {
    NEW_USER: number;
    NEW_POLICY: number;
    NEW_NOMINEE: number;
    SUBSCRIPTION: number;
    OTHER: number;
  };
}

export interface KycUserDocument {
  id: string;
  documentType: 'AADHAAR' | 'PAN';
  documentName: string;
  documentUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
}

export interface KycUser {
  id: string;
  name: string;
  email: string | null;
  mobileNumber: string;
  status?: 'REJECTED' | 'ACCEPTED' | 'PENDING' | 'DRAFT';
  documents: KycUserDocument[];
  pendingDocuments: Array<'AADHAAR' | 'PAN'>;
  verifiedDocuments: Array<'AADHAAR' | 'PAN'>;
}

export interface KycUsersResponse {
  users: KycUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


export interface PolicyUserDocument {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
}

export interface PolicyUser {
  id: string;
  policyNumber: string;
  sumAssured: string;
  status: string;
  uploadedAt: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    mobileNumber: string;
  };
  insuranceCompany: {
    id: string;
    name: string;
  };
  documents: PolicyUserDocument[];
  verifiedDocuments: string[];
  nominees?: Array<{
    id: string;
    nominee: {
      id: string;
      name: string;
      relationship: string;
      mobileNumber: string;
      email: string | null;
      dob: string | null;
      address: string | null;
      status: string;
      isVerified: boolean;
      documentsCount: number;
      verifiedDocumentsCount: number;
      documents?: Array<{
        id: string;
        documentType: string;
        documentName: string;
        documentUrl: string;
        isVerified: boolean;
        uploadedAt: string;
        verifiedAt: string | null;
        rejectedAt: string | null;
      }>;
    };
    sharePercentage: string;
  }>;
}

export interface PolicyUsersResponse {
  policies: PolicyUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NomineeUserDocument {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
}

export interface NomineeUser {
  id: string;
  name: string;
  relationship: string;
  mobileNumber: string;
  email?: string | null;
  address?: string | null;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    mobileNumber: string;
  };
  documents: NomineeUserDocument[];
  verifiedDocuments: string[];
}

export interface NomineeUsersResponse {
  nominees: NomineeUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserActivityLog {
  id: string;
  userId: string;
  activityType: string;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface UserActivityLogsResponse {
  logs: UserActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


