export const handbookQueries = {
  all: ['handbook'] as const,
  sections: () => [...handbookQueries.all, 'sections'] as const,
  section: (id: string) => [...handbookQueries.sections(), id] as const,
  pages: (sectionId?: string) =>
    [...handbookQueries.all, 'pages', sectionId] as const,
  page: (id: string) => [...handbookQueries.all, 'page', id] as const,
} as const;

