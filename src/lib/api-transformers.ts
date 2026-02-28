import {
  Employee,
  Contact,
  HandbookPageSummary,
  EmployeeStatus,
} from '@/types/models';

// Backend employee: actual API uses id/email/companyId; spec uses uid/mail/created
export type BackendEmployeeLike = {
  uid?: number;
  id?: number | string;
  name: string;
  mail?: string | null;
  email?: string | null;
  status?: number | string; // Can be number (0/1) or string ('ACTIVE'/'INACTIVE')
  created?: number;
  createdAt?: string; // string date or timestamp
  companyId?: string;
  position?: string | null;
  mobileNumber?: string | null;
  telephone?: string | null;
  alternateNumber?: string | null;
  employmentType?: string | null;
  employmentTitle?: string | null;
  role?: string | null;
  recentVisits?: string | null;
  messageCount?: number | string | null;
  /** API returns 0 or 1 (possibly as string with bigNumberStrings); we map to boolean in the frontend */
  isPublic?: number | string | boolean | null;
  /** API returns 0 or 1 (possibly as string with bigNumberStrings); we map to boolean in the frontend */
  isEmergencyPublic?: number | string | boolean | null;
  /** Rewritten CDN URI for the profile photo (public:// → /sites/default/files/) */
  userPictureUri?: string | null;
  /** Taxonomy nids for areas of responsibility */
  responsibilityIds?: number[];
  [key: string]: unknown;
};

// Backend Contact model (from OpenAPI spec)
interface BackendContact {
  nid: number;
  title: string;
  uid: number;
  created: number;
  changed: number;
  status: number;
}

// Backend HandbookPage model (from OpenAPI spec)
interface BackendHandbookPage {
  nid: number;
  title: string;
  uid: number;
  created: number;
  changed: number;
  status: number;
  handbookId: number;
  parentId: number | null;
  depth: number;
  weight: number;
  hasChildren: number;
}

// Convert Unix timestamp (seconds or ms) to ISO string; safe for null/undefined/invalid
const timestampToISO = (timestamp: number | null | undefined): string => {
  if (timestamp == null || typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    return '';
  }
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
};

// Convert status number to EmployeeStatus
const statusToEmployeeStatus = (status: number): EmployeeStatus => {
  return status === 1 ? 'ACTIVE' : 'INACTIVE';
};

// Transform backend employee to frontend employee (handles both uid/mail and id/email shapes)
export const transformEmployee = (backend: BackendEmployeeLike): Employee => {
  const id = backend.id != null ? String(backend.id) : backend.uid != null ? String(backend.uid) : '';
  const email = backend.email ?? backend.mail ?? '';
  const createdAt =
    typeof backend.createdAt === 'string'
      ? backend.createdAt
      : timestampToISO(backend.created);

  // Handle status which allows for 'ACTIVE'/'INACTIVE' string or 0/1 number
  let status: EmployeeStatus = 'ACTIVE';
  if (typeof backend.status === 'string') {
    status = backend.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
  } else if (typeof backend.status === 'number') {
    status = statusToEmployeeStatus(backend.status);
  }

  return {
    id,
    accountId: backend.companyId ?? '',
    name: backend.name ?? '',
    email: String(email ?? ''),
    role: backend.role ?? undefined,
    mobileNumber: backend.mobileNumber ?? undefined,
    alternateNumber: backend.alternateNumber ?? undefined,
    telephone: backend.telephone ?? undefined,
    employmentType: backend.employmentType ?? undefined,
    employmentTitle: backend.employmentTitle ?? undefined,
    recentVisitAt: backend.recentVisits ?? undefined,
    messagesCount: backend.messageCount != null ? Number(backend.messageCount) : 0,
    emergencyContactName: backend.emergencyContactName != null ? String(backend.emergencyContactName) : undefined,
    emergencyContactMobile: backend.emergencyContactMobile != null ? String(backend.emergencyContactMobile) : undefined,
    status,
    createdAt: createdAt || '',
    // Map 0|1 integers (or '0'|'1' strings with bigNumberStrings) to booleans
    isPublic:
      backend.isPublic == null
        ? true
        : typeof backend.isPublic === 'boolean'
          ? backend.isPublic
          : Number(backend.isPublic) === 1,
    isEmergencyPublic:
      backend.isEmergencyPublic == null
        ? false
        : typeof backend.isEmergencyPublic === 'boolean'
          ? backend.isEmergencyPublic
          : Number(backend.isEmergencyPublic) === 1,
    userPictureUri: backend.userPictureUri ?? null,
    responsibilityIds: Array.isArray(backend.responsibilityIds)
      ? backend.responsibilityIds.map(Number)
      : undefined,
  };
};

// Transform backend contact to frontend contact
export const transformContact = (backend: BackendContact): Contact => {
  return {
    id: String(backend.nid),
    accountId: '', // Not available in backend response, may need to be set from context
    name: backend.title,
    email: '', // Not available in backend response
    status: backend.status === 1 ? 'ACTIVE' : 'INACTIVE',
    createdAt: timestampToISO(backend.created),
  };
};

// Transform backend handbook page to frontend handbook page summary
export const transformHandbookPage = (backend: BackendHandbookPage): HandbookPageSummary => {
  return {
    id: String(backend.nid),
    sectionId: String(backend.handbookId), // Using handbookId as sectionId
    title: backend.title,
    status: backend.status === 1 ? 'READY' : 'NOT_READY',
    updatedAt: timestampToISO(backend.changed),
  };
};

