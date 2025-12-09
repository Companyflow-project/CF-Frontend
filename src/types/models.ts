export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
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
  mobileNumber?: string;
  alternateNumber?: string;
  telephone?: string;
  employmentType?: string;
  employmentTitle?: string;
  recentVisitAt?: string | null;
  messagesCount?: number;
  isPublic?: boolean;
  status: EmployeeStatus;
  createdAt: string;
}

export interface HandbookSection {
  id: string;
  title: string;
  slug: string;
  order: number;
  accountId: string;
}

export type HandbookPageStatus = "READY" | "NOT_READY" | "OPTED_OUT";

export interface HandbookPage {
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
  isPublic?: boolean;
  isEmployeeContact?: boolean;
  isExternalContact?: boolean;
  status: "ACTIVE" | "INACTIVE";
}

export interface EmployeePageViewStat {
  pageId: string;
  pageTitle: string;
  views: number;
}

export interface EmployeeSummaryStat {
  employeeId: string;
  name: string;
  pageViews: number;
  lastVisitAt?: string | null;
  messagesCount: number;
}

export interface EmployeeMessageLog {
  id: string;
  employeeId: string;
  sentAt: string;
  employeeName: string;
  employeeEmail: string;
  messagePreview: string;
}

