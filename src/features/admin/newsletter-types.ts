export type NewsletterBodyFormat = 'basic_html' | 'full_html' | 'plain_text';

export interface AdminNewsletterListItem {
  nid: number;
  title: string;
  subject: string;
  recipientCount: number;
  sentAt: number | null;
  published: boolean;
  changed: number;
}

export interface AdminNewsletterListResponse {
  items: AdminNewsletterListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminNewsletterDetail {
  nid: number;
  title: string;
  subject: string;
  body: string;
  bodyFormat: NewsletterBodyFormat;
  smsText: string;
  useAsTemplate: boolean;

  mailCategoryTid: number | null;
  mailCategoryName: string | null;

  doNotSend: boolean;
  onlyTest: boolean;
  sendOn: number | null;
  sentAt: number | null;

  testAddresses: string[];
  manualReceivers: string[];
  businessNid: number | null;
  recipientUids: number[];
  recipientCount: number;

  langcode: string;
  published: boolean;

  created: number;
  changed: number;
  authorUid: number;
  authorName: string;
}

export interface CreateAdminNewsletterPayload {
  title: string;
  subject: string;
  body: string;
  bodyFormat?: NewsletterBodyFormat;
  smsText?: string;
  useAsTemplate?: boolean;
  mailCategoryTid?: number | null;
  doNotSend?: boolean;
  onlyTest?: boolean;
  sendOn?: number | null;
  testAddresses?: string[];
  manualReceivers?: string[];
  businessNid?: number | null;
  recipientUids?: number[];
  langcode?: string;
  published?: boolean;
}

export type UpdateAdminNewsletterPayload = Partial<CreateAdminNewsletterPayload>;

export interface AdminNewsletterCategoryOption {
  tid: number;
  name: string;
}
