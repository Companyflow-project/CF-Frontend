export const userManualRoutes = {
    root: '/user-manual',
    section: (nid: number | string) => `/user-manual/${nid}`,
} as const;
