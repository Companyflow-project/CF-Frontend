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
  allowReset: boolean;
  countryCode: string;
  category: string;
  customerNumber: number;
  employmentTypesCount: number;
  ownHandbooksCount: number;
  optionalDesign: boolean;
  hasSop: boolean;
  languageCodes: string[];
  latestActivityTitle: string | null;
  latestActivityFup: string | null;
}

export interface AdminInfoListEmployee {
  id: number;
  name: string;
  email: string | null;
  mobileNumber: string | null;
  isPublic: boolean;
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
  keyFigures: {
    licenses: number;
    used: number;
    exploitationPct: number;
    lastAccess: number | null;
    lastEdited: number | null;
    published: boolean;
  };
  crmActivities: Array<{
    id: number;
    title: string;
    body: string;
    typeName: string;
    statusName: string;
    created: number;
    responsibleName: string;
    authorName: string;
    fupDate: string | null;
  }>;
  contacts: Array<{
    uid: number;
    name: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
  extended: {
    customerGroup: number | null;
    customerCategory: number | null;
    customerSource: number | null;
    product: number | null;
    sop: string;
    numOwnHandbooks: number;
    discountByLicenses: number;
    logoFid: number | null;
    referenceLogoFid: number | null;
    alwaysShowImageTab: boolean;
    homepage: string;
    smsSender: string;
    whistleblowerType: string;
    whistleblowerDisableAnon: boolean;
    whistleblowerContactUid: number | null;
    linkGdpr: string;
    linkIntranet: string;
    linkDrivesheet: string;
    linkFirePlan: string;
    linkTimesheet: string;
    additionalInfo: string;
    phonebookShowEmployees: boolean;
    phonebookShowLinks: boolean;
    phonebookShowDocuments: boolean;
    phonebookShowRelations: boolean;
    phonebookCollapseEmpl: boolean;
    ownHandbookReady: boolean;
    freeDone: boolean;
    demoCompany: boolean;
    testCompany: boolean;
    customTerms: boolean;
    allowReset: boolean;
  };
}

export interface UpdateCompanyPayload {
  title?: string;
  cvr?: string;
  phone?: string;
  email?: string;
  customerGroup?: number | null;
  customerCategory?: number | null;
  customerSource?: number | null;
  street?: string;
  city?: string;
  zipCode?: string;
  product?: number | null;
  licensesTotal?: number;
  smsCreditsTotal?: number;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  paymentInterval?: string;
  nextInvoice?: string;
  invoiceNote?: string;
  sop?: string;
  numOwnHandbooks?: number;
  discountByLicenses?: number;
  logoFid?: number | null;
  referenceLogoFid?: number | null;
  alwaysShowImageTab?: boolean;
  homepage?: string;
  senderName?: string;
  smsSender?: string;
  whistleblowerAccess?: boolean;
  whistleblowerType?: string;
  whistleblowerDisableAnon?: boolean;
  whistleblowerContactUid?: number | null;
  linkGdpr?: string;
  linkIntranet?: string;
  linkDrivesheet?: string;
  linkFirePlan?: string;
  linkTimesheet?: string;
  additionalInfo?: string;
  phonebookShowEmployees?: boolean;
  phonebookShowLinks?: boolean;
  phonebookShowDocuments?: boolean;
  phonebookShowRelations?: boolean;
  phonebookCollapseEmpl?: boolean;
  handbookReady?: boolean;
  ownHandbookReady?: boolean;
  freeDone?: boolean;
  demoCompany?: boolean;
  testCompany?: boolean;
  customTerms?: boolean;
  allowReset?: boolean;
  status?: number;
}

export interface CreateCrmActivityPayload {
  title: string;
  companyId: number;
  typeTid?: number;
  statusTid?: number;
  responsibleUid?: number;
  body?: string;
  fupDate?: string;
  nextActionDate?: string;
  published?: boolean;
}

export interface CrmActivityDetail {
  id: number;
  title: string;
  body: string;
  bodyFormat: string;
  companyId: number | null;
  companyName: string;
  typeTid: number | null;
  typeName: string;
  statusTid: number | null;
  statusName: string;
  responsibleUid: number | null;
  responsibleName: string;
  fupDate: string | null;
  nextActionDate: string | null;
  published: boolean;
  authorUid: number;
  authorName: string;
  created: number;
  changed: number;
}

export interface UpdateCrmActivityPayload {
  title?: string;
  body?: string;
  typeTid?: number | null;
  statusTid?: number | null;
  responsibleUid?: number | null;
  fupDate?: string | null;
  nextActionDate?: string | null;
  published?: boolean;
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

// --- Key Figures ---
export interface KeyFigureRow {
  nid: number;
  business: string;
  licenses: number;
  used: number;
  exploitationPct: number;
  lastAccess: number | null;
  lastEdited: number | null;
  published: boolean;
  flagged: 'none' | 'pink';
}

export interface TrafficUserRow {
  uid: number;
  name: string;
  business: string;
  roles: string[];
  lastAccess: number;
}

export interface KeywordRow {
  word: string;
  count: number;
  latestSearch: number;
}

// --- Tickets ---
export interface TicketFilters {
  priorities: Array<{ key: string; label: string; count: number }>;
  statuses: Array<{ tid: number; key: string; label: string; count: number }>;
  lists: Array<{ tid: number; name: string }>;
  responsibles: Array<{ uid: number; name: string; colorSeed: string }>;
  authors: Array<{ uid: number; name: string; colorSeed: string }>;
}

export interface TicketRow {
  nid: number;
  title: string;
  body: string;
  created: number;
  priority: string;
  priorityKey: string;
  status: string;
  statusKey: string;
  listName: string | null;
  responsibleUid: number | null;
  responsibleName: string;
  authorUid: number;
  authorName: string;
}

export interface TicketListParams {
  page?: number;
  limit?: number;
  priority?: string;
  statusTid?: string;
  listTid?: string;
  responsibleUid?: string;
  authorUid?: string;
  search?: string;
  sort?: string;
}

export interface TicketCreateOptions {
  priorities: Array<{ key: string; label: string }>;
  statuses: Array<{ tid: number; key: string; label: string }>;
  lists: Array<{ tid: number; name: string }>;
  staff: Array<{ uid: number; name: string; colorSeed: string }>;
}

export interface CreateTicketPayload {
  title: string;
  body?: string;
  priority?: string;
  statusTid?: number;
  responsibleUid?: number;
  orientedUids?: number[];
  listTids?: number[];
  connectedToNids?: number[];
  sendMail?: boolean;
  published?: boolean;
}

export interface UpdateTicketPayload {
  title?: string;
  body?: string;
  priority?: string;
  statusTid?: number;
  responsibleUid?: number | null;
  orientedUids?: number[];
  listTids?: number[];
  connectedToNids?: number[];
  sendMail?: boolean;
  published?: boolean;
}

export interface TicketDetail {
  nid: number;
  title: string;
  body: string;
  bodyFormat: string;
  created: number;
  changed: number;
  published: boolean;
  priority: string | null;
  priorityLabel: string | null;
  statusTid: number | null;
  statusKey: string;
  statusLabel: string;
  responsibleUid: number | null;
  responsibleName: string;
  orientedUids: number[];
  listTids: number[];
  connectedToNids: number[];
  sendMail: boolean;
  authorUid: number;
  authorName: string;
}

// --- Invoices ---
export interface InvoiceRow {
  nid: number;
  business: string;
  category: string;
  licenses: number;
  addPurchases: string;
  payment: string;
  paymentKey: string;
  beginner: string | null;
  ends: string | null;
  endsAboutMonths: number | null;
  invoicing: string | null;
  whenMonths: number | null;
  notes: string;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  customersOnly?: boolean;
  search?: string;
}

// --- CRM ---
export interface CrmUser {
  uid: number;
  name: string;
  initials: string;
  colorSeed: string;
}

export interface CrmSummary {
  total: number;
  meetings: number;
  automatic: number;
  other: number;
}

export interface CrmActivity {
  id: number;
  companyId: number;
  companyName: string;
  activity: string;
  type: string;
  typeKey: string;
  status: string;
  fupDate: string | null;
  writtenOn: string;
  responsibleUid: number | null;
  responsibleName: string;
  colorSeed: string;
  authorUid: number | null;
  authorName: string;
  authorColorSeed: string;
}

export interface CrmListParams {
  page?: number;
  limit?: number;
  userId?: string;
  authorUid?: string;
  period?: 'previous' | 'latest_week' | 'next_week' | 'next_month' | 'all_upcoming';
  status?: string;
  followUp?: 'all' | 'fup_date' | 'no_fup_date';
  type?: string;
}

// --- Taxonomy ---
export interface AdminTaxonomyVocabulary {
  vid: string;
  name: string;
  description: string | null;
  weight: number;
  termCount: number;
}

export interface AdminTaxonomyTerm {
  tid: number;
  vid: string;
  name: string;
  description: string | null;
  weight: number;
  parentTid: number;
  status: boolean;
  langcode: string;
  color: string | null;
  textColor: string | null;
}

export interface CreateVocabularyPayload {
  vid: string;
  name: string;
  description?: string;
}

export interface CreateTermPayload {
  name: string;
  description?: string;
  weight?: number;
  parentTid?: number;
  status?: boolean;
}

export interface UpdateTermPayload {
  name?: string;
  description?: string | null;
  weight?: number;
  parentTid?: number;
  status?: boolean;
}

export interface AdminTaxonomyTermVersion {
  revisionId: number;
  name: string;
  status: boolean;
  changed: number;
  uid: number;
  authorName: string;
  logMessage: string;
  isCurrent: boolean;
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
