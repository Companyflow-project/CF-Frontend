import {
  Employee,
  Contact,
  HandbookPage,
  EmployeeStatus,
} from '@/types/models';

// Backend Employee model (from OpenAPI spec)
interface BackendEmployee {
  uid: number;
  name: string;
  mail: string | null;
  status: number;
  created: number;
  changed: number;
}

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

// Convert Unix timestamp to ISO string
const timestampToISO = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString();
};

// Convert status number to EmployeeStatus
const statusToEmployeeStatus = (status: number): EmployeeStatus => {
  return status === 1 ? 'ACTIVE' : 'INACTIVE';
};

// Transform backend employee to frontend employee
export const transformEmployee = (backend: BackendEmployee): Employee => {
  return {
    id: String(backend.uid),
    accountId: '', // Not available in backend response, may need to be set from context
    name: backend.name,
    email: backend.mail || '',
    status: statusToEmployeeStatus(backend.status),
    createdAt: timestampToISO(backend.created),
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

// Transform backend handbook page to frontend handbook page
export const transformHandbookPage = (backend: BackendHandbookPage): HandbookPage => {
  return {
    id: String(backend.nid),
    sectionId: String(backend.handbookId), // Using handbookId as sectionId
    title: backend.title,
    status: backend.status === 1 ? 'READY' : 'NOT_READY',
    updatedAt: timestampToISO(backend.changed),
  };
};

