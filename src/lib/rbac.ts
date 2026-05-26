/**
 * Canonical RBAC permission matrix — single source of truth (frontend copy).
 *
 * Mirrored verbatim on the backend at
 * CF-Backend/src/common/rbac/permissions.ts. If you change a cell here,
 * change it there too.
 *
 * Currently *enforced* at: the /admin route guard and the Superadmin/Admin
 * dashboard. Other modules can adopt `can()` / `permissionLevel()`
 * incrementally — the matrix already describes their intended rules.
 */

export type RbacRole = 'superadmin' | 'admin' | 'user' | 'crmUser' | 'none';

export type RbacModule =
  | 'dashboard'
  | 'companies'
  | 'crm'
  | 'newsletters'
  | 'tickets'
  | 'blog'
  | 'invoices'
  | 'handbook'
  | 'books'
  | 'bookChapters'
  | 'taxonomy'
  | 'infoList'
  | 'keyFigures'
  | 'userManagement';

export type RbacAction = 'create' | 'read' | 'update' | 'delete';

/**
 * - 'none'                : no access
 * - 'own'                 : only records created by the user
 * - 'ownProfile'          : only the user's own profile
 * - 'all'                 : full, unrestricted access
 * - 'allExceptSuperadmin' : full access, but Superadmin records are hidden
 */
export type AccessLevel = 'none' | 'own' | 'ownProfile' | 'all' | 'allExceptSuperadmin';

type ModuleMatrix = Record<RbacModule, Record<RbacAction, AccessLevel>>;

const ALL: Record<RbacAction, AccessLevel> = { create: 'all', read: 'all', update: 'all', delete: 'all' };
const READ_ONLY: Record<RbacAction, AccessLevel> = { create: 'none', read: 'all', update: 'none', delete: 'none' };
const NO_ACCESS: Record<RbacAction, AccessLevel> = { create: 'none', read: 'none', update: 'none', delete: 'none' };
const OWN_PROFILE: Record<RbacAction, AccessLevel> = { create: 'none', read: 'none', update: 'ownProfile', delete: 'none' };

const superadmin: ModuleMatrix = {
  dashboard: ALL, companies: ALL, crm: ALL, newsletters: ALL, tickets: ALL, blog: ALL,
  invoices: ALL, handbook: ALL, books: ALL, bookChapters: ALL, taxonomy: ALL, infoList: ALL,
  keyFigures: ALL, userManagement: ALL,
};

const ADMIN_USER_MGMT: Record<RbacAction, AccessLevel> = {
  create: 'allExceptSuperadmin', read: 'allExceptSuperadmin', update: 'allExceptSuperadmin', delete: 'allExceptSuperadmin',
};

const admin: ModuleMatrix = {
  dashboard: ALL, companies: ALL, crm: ALL, newsletters: ALL, tickets: ALL, blog: ALL,
  invoices: ALL, handbook: ALL, books: ALL, bookChapters: ALL, taxonomy: ALL, infoList: ALL,
  keyFigures: ALL, userManagement: ADMIN_USER_MGMT,
};

const user: ModuleMatrix = {
  dashboard: READ_ONLY,
  companies: { create: 'none', read: 'all', update: 'own', delete: 'none' },
  crm: { create: 'all', read: 'all', update: 'own', delete: 'own' },
  newsletters: READ_ONLY,
  tickets: { create: 'all', read: 'all', update: 'own', delete: 'own' },
  blog: READ_ONLY,
  invoices: READ_ONLY,
  handbook: READ_ONLY,
  books: READ_ONLY,
  bookChapters: READ_ONLY,
  taxonomy: READ_ONLY,
  infoList: READ_ONLY,
  keyFigures: READ_ONLY,
  userManagement: OWN_PROFILE,
};

const crmUser: ModuleMatrix = {
  dashboard: READ_ONLY,
  companies: { create: 'all', read: 'all', update: 'own', delete: 'none' },
  crm: { create: 'all', read: 'all', update: 'own', delete: 'own' },
  newsletters: NO_ACCESS,
  tickets: { create: 'all', read: 'all', update: 'own', delete: 'own' },
  blog: NO_ACCESS,
  invoices: READ_ONLY,
  handbook: NO_ACCESS,
  books: NO_ACCESS,
  bookChapters: NO_ACCESS,
  taxonomy: NO_ACCESS,
  infoList: NO_ACCESS,
  keyFigures: READ_ONLY,
  userManagement: OWN_PROFILE,
};

/** Customers / unmapped Drupal roles: no admin-console access at all. */
const none: ModuleMatrix = {
  dashboard: NO_ACCESS, companies: NO_ACCESS, crm: NO_ACCESS, newsletters: NO_ACCESS,
  tickets: NO_ACCESS, blog: NO_ACCESS, invoices: NO_ACCESS, handbook: NO_ACCESS,
  books: NO_ACCESS, bookChapters: NO_ACCESS, taxonomy: NO_ACCESS, infoList: NO_ACCESS,
  keyFigures: NO_ACCESS, userManagement: NO_ACCESS,
};

export const PERMISSION_MATRIX: Record<RbacRole, ModuleMatrix> = { superadmin, admin, user, crmUser, none };

/**
 * Map a Drupal role machine name to an RBAC role. The four matrix roles are
 * dedicated internal-staff roles: administrator=>superadmin,
 * platform_admin=>admin, staff_user=>user, crm_user=>crmUser. Everything else
 * (customers: company_admin/account_owner/EMPLOYEE) => `none`: no /admin access.
 */
export function resolveRbacRole(drupalRole: string | null | undefined): RbacRole {
  switch (drupalRole) {
    case 'administrator':
      return 'superadmin';
    case 'platform_admin':
      return 'admin';
    case 'staff_user':
      return 'user';
    case 'crm_user':
      return 'crmUser';
    default:
      return 'none';
  }
}

export function permissionLevel(role: RbacRole, module: RbacModule, action: RbacAction): AccessLevel {
  return PERMISSION_MATRIX[role][module][action];
}

export function can(role: RbacRole, module: RbacModule, action: RbacAction): boolean {
  return permissionLevel(role, module, action) !== 'none';
}

/** Roles allowed into the /admin console — all four internal-staff roles; only
 *  the `none` bucket (customers) is shut out. */
export function canAccessAdminConsole(role: RbacRole): boolean {
  return role !== 'none';
}

/** The Superadmin/Admin account dashboard (user provisioning + activity tracking)
 *  is restricted to Superadmin and Admin. User/CRM-Sales roles use the operational
 *  console + their permitted modules, but never this hub. */
export function canAccessAccountDashboard(role: RbacRole): boolean {
  return role === 'superadmin' || role === 'admin';
}
