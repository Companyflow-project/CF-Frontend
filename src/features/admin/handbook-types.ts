export interface AdminHandbookBook {
  nid: number;
  title: string;
  status: number;
  created: number;
  changed: number;
}

export interface AdminHandbookTreeNode {
  nid: number;
  title: string;
  weight: number;
  depth: number;
  pid: number | null;
  children: AdminHandbookTreeNode[];
}

export interface AdminHandbookPageDetail {
  nid: number;
  bid: number | null;
  pid: number | null;
  weight: number;
  depth: number;
  title: string;
  type: string;
  status: number;
  langcode: string;
  created: number;
  changed: number;
  uid: number;
  authorName: string;

  body: string;
  bodyFormat: string;
  selectedText: string | null;
  handbookNote: string | null;

  helpPage: boolean;
  excludeFromHelpOverview: boolean;
  helpCategoryTid: number | null;
  helpCategoryName: string | null;
  userManual: string;
  routeUrl: string;
  heroImageFid: number | null;
  heroImageUrl: string | null;

  // Choice
  updatedDate: string | null;
  includeByDefault: boolean;
  optOutWarning: boolean;
  endHerePageNid: number | null;
  requiredProductTid: number | null;
  areasOfResponsibility: number[];

  // Help and inspiration
  helpText: string;
  helpTextFormat: string;
  inspirationalText: string;
  inspirationalTextFormat: string;
  helpTextForm: string;
  helpTextFormFormat: string;
  introText: string;
  managementHandbookPageNids: number[];

  // Visual elements and files
  picturePlacement: string;
  attachedDocumentFids: number[];
  videos: string[];

  // Technical fields
  smartLinkPageNids: number[];
  sop: string;
  businessTypeTid: number | null;
  departmentNids: number[];
  employmentTypeTids: number[];
  archivedFlag: number;
  archivedTime: string;
  machineTranslated: string;
  contactNids: number[];
  outroBody: string;
  outroBodyFormat: string;
  placeInManagementHandbook: boolean;
  machineTranslatedLangs: string[];

  availableLangcodes: string[];
  translations: AdminHandbookTranslationMeta[];
}

export interface AdminHandbookTaxonomyTerm {
  tid: number;
  name: string;
  vid: string;
}

export interface AdminHandbookTranslationMeta {
  langcode: string;
  title: string;
  published: boolean;
}

export interface UpdateAdminHandbookPagePayload {
  title?: string;
  body?: string;
  bodyFormat?: string;
  status?: boolean;
  selectedText?: string;
  handbookNote?: string | null;
  helpPage?: boolean;
  excludeFromHelpOverview?: boolean;
  helpCategoryTid?: number | null;
  userManual?: string;
  routeUrl?: string;
  heroImageFid?: number | null;

  // Choice
  updatedDate?: string | null;
  includeByDefault?: boolean;
  optOutWarning?: boolean;
  endHerePageNid?: number | null;
  requiredProductTid?: number | null;
  areasOfResponsibility?: number[];

  // Help and inspiration
  helpText?: string;
  helpTextFormat?: string;
  inspirationalText?: string;
  inspirationalTextFormat?: string;
  helpTextForm?: string;
  helpTextFormFormat?: string;
  introText?: string;
  managementHandbookPageNids?: number[];

  // Visual elements and files
  picturePlacement?: string;
  attachedDocumentFids?: number[];
  videos?: string[];

  // Technical fields
  smartLinkPageNids?: number[];
  sop?: string;
  businessTypeTid?: number | null;
  departmentNids?: number[];
  employmentTypeTids?: number[];
  archivedFlag?: number;
  archivedTime?: string;
  machineTranslated?: string;
  contactNids?: number[];
  outroBody?: string;
  outroBodyFormat?: string;
  placeInManagementHandbook?: boolean;
  machineTranslatedLangs?: string[];
}

export interface UpdateAdminHandbookTocPayload {
  bid: number | null;
  pid?: number | null;
  weight?: number;
}

export interface BulkReorderBookItem {
  nid: number;
  pid: number | null;
  weight: number;
  title?: string;
}

export type AdminHandbookMetaTags = Record<string, string>;

export interface AdminHandbookVersion {
  vid: number;
  title: string;
  changed: number;
  uid: number;
  authorName: string;
  logMessage: string;
  isCurrent: boolean;
}

export interface AdminHandbookCategoryOption {
  tid: number;
  name: string;
}
