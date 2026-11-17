/** Adds ?book=<bid> (an extra handbook) to a path; the main handbook needs no parameter. */
const withBook = (path: string, bookBid?: number | null, params: Record<string, string> = {}) => {
  const search = new URLSearchParams(params);
  if (bookBid != null && bookBid > 0) search.set('book', String(bookBid));
  const q = search.toString();
  return q ? `${path}?${q}` : path;
};

/** The extra handbook in ?book=, or null for the main handbook. */
export const bookFromSearch = (searchParams: URLSearchParams): number | null => {
  const bid = Number(searchParams.get('book'));
  return Number.isInteger(bid) && bid > 0 ? bid : null;
};

export const handbookRoutes = {
  manage: '/handbook',
  pages: '/handbook/pages',
  /** The pages list of a handbook (bookBid = an extra handbook, omitted = the main handbook). */
  pagesOf: (bookBid?: number | null, params: Record<string, string> = {}) => withBook('/handbook/pages', bookBid, params),
  addThemeOf: (bookBid?: number | null) => withBook('/handbook/add-theme', bookBid),
  editThemeOf: (id: string | number, bookBid?: number | null) => withBook(`/handbook/edit-theme/${id}`, bookBid),
  editPageOf: (id: string | number, bookBid?: number | null) => withBook(`/handbook/pages/${id}/edit`, bookBid),
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

