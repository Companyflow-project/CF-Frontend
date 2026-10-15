export const managementHandbookRoutes = {
    root: '/management-handbook',
    page: (nid: number | string) => `/management-handbook/${nid}`,
} as const;
