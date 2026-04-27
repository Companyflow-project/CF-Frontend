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

  availableLangcodes: string[];
  translations: AdminHandbookTranslationMeta[];
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
}

export interface UpdateAdminHandbookTocPayload {
  bid: number | null;
  pid?: number | null;
  weight?: number;
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
