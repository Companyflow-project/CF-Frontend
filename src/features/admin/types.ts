// --- Dashboard ---
export interface AdminDashboardStats {
  totalCompanies: number;
  activeUsers: number;
  expiringSubscriptions: number;
}

export interface AdminDashboardCompany {
  nid: number;
  title: string;
  created: number;
  cvr: string;
  contactName: string;
  category: string;
  telephone: string;
}

export interface TrafficBucket {
  label: string;
  count: number;
}

export interface AdminDashboardActivity {
  timestamp: string;
  companyName: string;
  title: string;
  description: string;
}

export interface AdminDashboard {
  stats: AdminDashboardStats;
  latestCompanies: AdminDashboardCompany[];
  employeeTraffic: TrafficBucket[];
  adminTraffic: TrafficBucket[];
  recentActivities: AdminDashboardActivity[];
}

// --- Companies ---
export interface AdminCompanyListItem {
  nid: number;
  title: string;
  created: number;
  status: number;
  cvr: string;
  city: string;
  phone: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  licensesTotal: number;
  licensesUsed: number;
  smsCreditsTotal: number;
  smsUsed: number;
  employeeCount: number;
  productName: string | null;
  senderName: string;
  whistleblowerAccess: boolean;
  countryCode: string;
  category: string;
  customerNumber: number;
}

export interface AdminCompanyEmployee {
  uid: number;
  name: string;
  mail: string;
  role: string;
  status: number;
  access: number;
}

export interface AdminCompanyHandbook {
  nid: number;
  title: string;
}

export interface AdminCompanyDetail extends AdminCompanyListItem {
  street: string;
  zipCode: string;
  email: string;
  subscriptionRemainingMonths: number | null;
  employees: AdminCompanyEmployee[];
  handbooks: AdminCompanyHandbook[];
}

export interface UpdateSubscriptionPayload {
  licensesTotal?: number;
  smsCreditsTotal?: number;
  subscriptionStart?: string;
  subscriptionEnd?: string;
}

export interface AdminCompanyListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  category?: string;
  source?: string;
}

// --- Users (Phase 2) ---
export interface AdminUser {
  uid: number;
  name: string;
  mail: string;
  role: string;
  status: number;
  companyId: number | null;
  companyName: string | null;
  created: number;
  access: number;
}

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  companyId?: string;
}

export interface UpdateAdminUserPayload {
  role?: string;
  status?: number;
  companyId?: number;
}

// --- Subscriptions (Phase 2) ---
export interface AdminSubscriptionItem {
  companyId: number;
  companyName: string;
  productName: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  daysRemaining: number | null;
  licensesTotal: number;
  licensesUsed: number;
  smsCreditsTotal: number;
  smsUsed: number;
  status: 'active' | 'expiring' | 'expired';
}

// --- Activity (Phase 3) ---
export interface AdminActivityLogEntry {
  id: number;
  action: string;
  targetType: string;
  targetId: number | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  adminName: string;
}

// --- Analytics (Phase 3) ---
export interface AdminAnalytics {
  signupsPerWeek: Array<{ week: string; count: number }>;
  userGrowth: Array<{ week: string; newUsers: number }>;
  smsUsage: Array<{ month: string; count: number }>;
}

// --- Settings (Phase 4) ---
export interface PlatformSettings {
  [key: string]: unknown;
}

// --- Create Company (Phase 4) ---
export interface CreateCompanyPayload {
  name: string;
  email: string;
  phone?: string;
  cvr?: string;
  category?: string;
  contactPerson?: {
    name: string;
    email: string;
    phone?: string;
  };
  subscription?: {
    product?: string;
    licenses?: number;
    source?: string;
  };
  sendEmail?: boolean;
}
