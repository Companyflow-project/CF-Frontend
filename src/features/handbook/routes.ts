export const handbookRoutes = {
  manage: '/handbook',
  pages: '/handbook/pages',
  printView: (params?: { bid?: number; lang?: string; pages?: number[] }) => {
    const search = new URLSearchParams();
    if (params?.bid != null) search.set('bid', String(params.bid));
    if (params?.lang) search.set('lang', params.lang);
    if (params?.pages && params.pages.length > 0) search.set('pages', params.pages.join(','));
    const q = search.toString();
    return `/handbook/print-view${q ? `?${q}` : ''}`;
  },
  addTheme: '/handbook/add-theme',
  editTheme: (id: string) => `/handbook/edit-theme/${id}`,
  editPage: (id: string | number) => `/handbook/pages/${id}/edit`,
  createPage: '/handbook/pages/new',
  publish: (id: string | number) => `/handbook/publish/${id}`,
  links: '/handbook/links',
  notes: '/handbook/notes',
  documents: '/handbook/documents',
  tableOfContents: '/handbook/table-of-contents',
} as const;

