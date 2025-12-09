export const handbookRoutes = {
  list: '/handbook',
  editTheme: (id: string) => `/handbook/edit-theme/${id}`,
} as const;

