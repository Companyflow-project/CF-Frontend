// Type definitions based on OpenAPI spec

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  error: null;
}

export interface ApiErrorResponse {
  data: null;
  meta: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  offset?: number;
}

// Company types
export interface Company {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  companyCity?: string | null;
  companyCvr?: string | null;
}

// Contact types
export interface Contact {
  nid: number;
  title: string;
  uid: number;
  created: number;
  changed: number;
  status: number;
}

// Handbook types
export interface Handbook {
  id: string;
  title: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// HandbookPage types (actual API response structure)
// Note: The API response only includes nid, title, uid, created, changed, status
// The OpenAPI spec mentions handbookId, parentId, depth, weight, hasChildren
// but these are not present in the actual response
export interface HandbookPage {
  nid: number;
  title: string;
  uid: number;
  created: number;
  changed: number;
  status: number;
  // These fields are in the OpenAPI spec but not in actual API responses
  handbookId?: number;
  parentId?: number | null;
  depth?: number;
  weight?: number;
  hasChildren?: number;
}

// Employee types (actual API response structure)
export interface Employee {
  id: number;
  name: string;
  email: string;
  position: string | null;
  companyId: string;
  departmentId: number | null;
  createdAt: number;
  updatedAt: number;
}

// Page types (for content)
export interface Page {
  nid: number;
  title: string;
  uid: number;
  created: number;
  changed: number;
  status: number;
  [key: string]: unknown; // Additional properties may exist
}

// Query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CompanyContactsParams extends PaginationParams {
  companyId: string;
}

export interface CompanyHandbooksParams extends PaginationParams {
  companyId: string;
}

export interface HandbookPagesParams extends PaginationParams {
  handbookId: string;
  langcode?: string;
}

export interface PageContentParams {
  pageId: string;
  langcode?: string;
}

export interface EmployeesParams extends PaginationParams {
  companyId?: string;
}

