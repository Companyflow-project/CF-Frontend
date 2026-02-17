export const handbookRoutes = {
  manage: '/handbook',
  pages: '/handbook/pages',
  editTheme: (id: string) => `/handbook/edit-theme/${id}`,
  editPage: (id: string | number) => `/handbook/pages/${id}/edit`,
  createPage: '/handbook/pages/new',
  publish: (id: string | number) => `/handbook/publish/${id}`,
  links: '/handbook/links',
  notes: '/handbook/notes',
  documents: '/handbook/documents',
} as const;

