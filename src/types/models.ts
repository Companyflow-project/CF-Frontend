export type Role = "administrator" | "account_owner" | "company_admin" | "senior_employee" | "EMPLOYEE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  companyId?: string;
  preferredLangcode?: string;
  companyLanguages?: string[];
  employeeLanguages?: string[];
}

export interface Account {
  id: string;
  name: string;
  domain?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export interface Employee {
  id: string;
  accountId: string;
  name: string;
  email: string;
  role?: string;
  mobileNumber?: string;
  alternateNumber?: string;
  telephone?: string;
  employmentType?: string;
  /** Taxonomy term ID for the employment type */
  employmentTypeId?: number | null;
  employmentTitle?: string;
  recentVisitAt?: string | null;
  messagesCount?: number;
  /** Emergency contact name (relative) */
  emergencyContactName?: string;
  /** Emergency contact mobile number (relative's phone) */
  emergencyContactMobile?: string;
  /** Profile visibility — maps from API's isPublic: 0|1 */
  isPublic?: boolean;
  /** Emergency contact visibility — maps from API's isEmergencyPublic: 0|1 */
  isEmergencyPublic?: boolean;
  status: EmployeeStatus;
  createdAt: string;
  /** Drupal CDN URI for the employee's profile photo (already rewritten from public://) */
  userPictureUri?: string | null;
  /** Taxonomy nids for areas of responsibility assigned to this employee */
  responsibilityIds?: number[];
  /** Whether the employee has the senior_employee role */
  isSeniorEmployee?: boolean;
  /** Whether the employee has the administrator (business admin) role */
  isBusinessAdmin?: boolean;
  /** Language codes assigned to this employee (e.g. ['da', 'en']) */
  languages?: string[];
}

export interface HandbookSection {
  id: string;
  title: string;
  slug: string;
  order: number;
  accountId: string;
}

export type HandbookPageStatus = "READY" | "NOT_READY" | "OPTED_OUT";

export interface HandbookPageSummary {
  id: string;
  sectionId: string;
  title: string;
  status: HandbookPageStatus;
  updatedAt: string;
}

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  email: string;
  telephone?: string;
  functionTitle?: string;
  /** Area-of-responsibility names assigned to this contact */
  areas?: string[];
  /** Visibility flag — true = public, false = private. Sourced from contact.visibility (0|1) in GET /contacts. */
  isPublic?: boolean;
  isEmployeeContact?: boolean;
  isExternalContact?: boolean;
  /** True when this row is the current user (placeholder); use "Add as contact" instead of Edit. */
  isCurrentUser?: boolean;
  /** Role of the underlying employee (e.g. 'company_admin', 'ADMIN'). Used for pinning & protecting rows. */
  role?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
}

export interface EmployeePageViewStat {
  title: string;
  url: string;
  views: number;
  lastViewed: string;
}

export interface EmployeeSummaryStat {
  employeeId: string;
  name: string;
  pageViews: number;
  lastVisitAt?: string | null;
  messagesCount: number;
}

export interface EmployeeMessageLog {
  id: number;
  date: string;
  name: string;
  email: string;
  message: string;
}

// Handbook types
export interface HandbookNode {
  id: number;
  title: string;
  type: 'chapter' | 'page';
  status: 'ready' | 'opted_out' | 'not_ready';
  badge: 'custom' | 'premade';
  isPublished?: boolean;
  hasNote?: boolean;
  hasDocuments?: boolean;
  hasLinks?: boolean;
  hasImage?: boolean;
  hasCustomBody?: boolean;
  hasText?: boolean;
  hasReceipt?: boolean;
  isDeletable: boolean;
  pages?: HandbookNode[];
}

export interface HandbookPageVersion {
  title: string;
  content: string;
}

export interface HandbookDocument {
  id: number;
  url: string;
  name: string;
  description: string | null;
}

export interface HandbookLink {
  uri: string;
  title: string;
  url?: string; // from read-side
}

export interface HandbookPageDetail {
  id: number;
  title: string;
  content: string;
  internalNote: string;
  sourceMode: 'company' | 'custom' | 'own';
  versions: {
    premade: string;
    custom: string | null;
  };
  /**
   * Optional array of rendered picture objects for this page.
   * We primarily use pictures[0] when showing the "own image".
   */
  pictures?: Array<{
    id: number;
    url: string;
    name: string;
  }>;
  imageId: number | null;
  imagePlacement: string | null;
  documents: HandbookDocument[];
  links: HandbookLink[];
  owners: number[];
  /**
   * Optional per-page settings controlling receipts, readiness and publication.
   */
  settings?: {
    askForReceipt: boolean;
    isReady: boolean;
    includeInHandbook: boolean;
    notifyEmployees: boolean;
  };
  isDeletable: boolean;
}

export interface HandbookPage extends HandbookPageDetail { }

export interface UpdatePagePayload {
  /**
   * "0" = use CompanyFlow text, "1" = use custom text
   */
  textMode: '0' | '1';
  /**
   * HTML string from the rich text editor
   */
  customText: string;
  /**
   * Internal notes, not visible to employees
   */
  notes: string;
  imageId: number | null;
  imagePlacement: string | null;
  documents: Array<{ id: number; description: string | null }>;
  links: Array<{ uri: string; title: string }>;
  /**
   * Array of user ids who own this page
   */
  owners: number[];
  /**
   * Optional per-page settings sent to the backend.
   */
  settings?: {
    askForReceipt: boolean;
    isReady: boolean;
    includeInHandbook: boolean;
    notifyEmployees: boolean;
  };
}

export interface CompanyProfile {
  id: number;
  businessName: string;
  cvrNumber: string;
  street: string;
  town: string;
  zipCode: string;
  mobile: string;
  logoUrl: string | null;
  senderName: string;
}

// Handbook Resources
export interface HandbookResourceLink {
  pageId: number;
  pageTitle: string;
  url: string | null;
  label: string | null;
  bookTitle: string | null;
}

export interface HandbookResourceNote {
  pageId: number;
  pageTitle: string;
  note: string | null;
  bookTitle: string | null;
}

export interface HandbookResourceDocument {
  pageId: number;
  pageTitle: string;
  filename: string | null;
  fileUrl: string | null;
  description: string | null;
  bookTitle: string | null;
}
