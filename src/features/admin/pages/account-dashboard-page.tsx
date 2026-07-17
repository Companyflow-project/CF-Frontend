import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks';
import { adminRoutes } from '../routes';
import {
  useAdminUserStats,
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useUserConsoleActivity,
} from '../hooks';
import type { AdminUser, UserConsoleActivityEntry } from '../types';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { resolveRbacRole, permissionLevel, can, type RbacRole } from '@/lib/rbac';
import { Plus, Search } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Role helpers. The assignable values are the Drupal role machine names that
    the canonical RBAC mapping (resolveRbacRole) recognises as admin-console
    roles. Keep these in sync with src/lib/rbac.ts.                            */
/* -------------------------------------------------------------------------- */

type RoleKey = RbacRole;

/** Display label -> RBAC key, derived from the canonical role mapping. */
const roleKey = (role: string): RoleKey => resolveRbacRole(role);

/** Assignable role -> machine name written back via updateUser. Each value must
 *  round-trip through resolveRbacRole to the matching RBAC key, otherwise the
 *  assignee gets no admin-console access. */
const ROLE_OPTIONS: { value: string; key: RoleKey }[] = [
  { value: 'administrator', key: 'superadmin' },
  { value: 'platform_admin', key: 'admin' },
  { value: 'staff_user', key: 'user' },
  { value: 'crm_user', key: 'crmUser' },
  // 'none' is the "No access" tier: backend strips all console roles for this value.
  // Assigning it demotes a console user to no admin-console access.
  { value: 'none', key: 'none' },
];

/** Raw Drupal roles that grant customer / user-console access. Assigning a console
 *  role to such a user REPLACES all their roles, stripping this customer access — so
 *  we confirm first. 'EMPLOYEE' is intentionally excluded: the API returns it both for
 *  real employees and for role-less accounts, so warning on it would false-positive. */
const CUSTOMER_ROLES = new Set(['company_admin', 'account_owner', 'senior_employee', 'seller']);

const roleBadgeClass: Record<RoleKey, string> = {
  superadmin: 'bg-amber-100 text-amber-800 border-amber-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  user: 'bg-gray-100 text-gray-700 border-gray-200',
  crmUser: 'bg-pink-100 text-pink-700 border-pink-200',
  none: 'bg-gray-100 text-gray-500 border-gray-200',
};

const AVATAR_COLORS = [
  '#3d997d', '#2563eb', '#9333ea', '#16a34a', '#db2777',
  '#ca8a04', '#dc2626', '#0891b2', '#7c3aed', '#ea580c',
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDateTime(input: string | number): string {
  const date = typeof input === 'number' ? new Date(input * 1000) : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('da-DK', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* -------------------------------------------------------------------------- */
/*  Small presentational pieces                                               */
/* -------------------------------------------------------------------------- */

function StatCard({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-5">
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
      style={{ backgroundColor: avatarColor(name || '?') }}
    >
      {initials(name || '?')}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export const AccountDashboardPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { user } = useAuth();

  const viewerRole = resolveRbacRole(user?.role);
  const isSuperadmin = viewerRole === 'superadmin';
  const title = isSuperadmin
    ? t('accountDashboard.titleSuperadmin', 'Team Management')
    : t('accountDashboard.titleAdmin', 'Admin Dashboard');

  // User-management update level drives who this viewer may edit and which
  // roles they can assign. 'all' = Superadmin; 'allExceptSuperadmin' = Admin.
  const umUpdateLevel = permissionLevel(viewerRole, 'userManagement', 'update');
  const roleOptions = umUpdateLevel === 'all'
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((o) => o.key !== 'superadmin');

  /* Users table state */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search box and reset to page 1 when the term changes.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const { data: stats } = useAdminUserStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({ page, limit: pageSize, search: debouncedSearch || undefined });
  const updateUser = useUpdateAdminUser();

  const users = usersData?.data ?? [];
  const usersTotal = usersData?.meta?.total ?? 0;
  const usersPages = Math.max(1, Math.ceil(usersTotal / pageSize));

  /* Activity log tab: 'admin' = all customer_activity; 'userConsole' = handbook events. */
  const [tab, setTab] = useState<'admin' | 'userConsole'>('admin');

  /* Add / Edit user dialogs */
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  /* Pending role change awaiting confirmation (set when the target is a real customer). */
  const [confirmRole, setConfirmRole] = useState<{ uid: number; role: string; name: string } | null>(null);
  const canCreateUsers = umUpdateLevel === 'all' || umUpdateLevel === 'allExceptSuperadmin';

  /* Permission: can the current viewer manage this row? */
  const isSelf = (u: AdminUser) => String(u.uid) === String(user?.id ?? '');
  const canManage = (u: AdminUser) => {
    if (isSelf(u)) return false;
    if (umUpdateLevel === 'all') return true;
    // Admins: full access except Superadmin accounts.
    if (umUpdateLevel === 'allExceptSuperadmin') return roleKey(u.role) !== 'superadmin';
    return false;
  };

  const handleRoleChange = (uid: number, role: string) => {
    updateUser.mutate(
      { userId: uid, data: { role } },
      {
        onSuccess: () => toast.success(t('accountDashboard.roleUpdated', 'Role updated')),
        onError: () => toast.error(t('accountDashboard.roleUpdateFailed', 'Could not update role')),
      },
    );
  };

  /* Gate role changes: if the target currently holds a customer role, assigning a
     console role would strip that access, so confirm first. Others change instantly. */
  const requestRoleChange = (u: AdminUser, role: string) => {
    if (CUSTOMER_ROLES.has(u.role)) {
      setConfirmRole({ uid: u.uid, role, name: u.name || u.mail });
    } else {
      handleRoleChange(u.uid, role);
    }
  };

  const handleStatusChange = (uid: number, status: number, kind: 'suspend' | 'revoke' | 'reactivate') => {
    updateUser.mutate(
      { userId: uid, data: { status } },
      {
        onSuccess: () =>
          toast.success(
            kind === 'reactivate'
              ? t('accountDashboard.reactivated', 'User reactivated')
              : kind === 'revoke'
              ? t('accountDashboard.revoked', 'Invitation revoked')
              : t('accountDashboard.suspended', 'User suspended'),
          ),
        onError: () => toast.error(t('accountDashboard.statusUpdateFailed', 'Could not update status')),
      },
    );
  };

  const statusBadge = (s: AdminUser['accountStatus'] | 'inactive') => {
    const map = {
      active: { cls: 'bg-green-50 text-green-700 border-green-200', label: t('accountDashboard.statuses.active', 'Active') },
      invited: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: t('accountDashboard.statuses.invited', 'Invited') },
      suspended: { cls: 'bg-red-50 text-red-700 border-red-200', label: t('accountDashboard.statuses.suspended', 'Suspended') },
      inactive: { cls: 'bg-gray-100 text-gray-500 border-gray-200', label: t('accountDashboard.statuses.inactive', 'Inactive') },
    }[s];
    return (
      <span className={cn('inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border', map.cls)}>
        {map.label}
      </span>
    );
  };

  // This dashboard is User Management — only roles that can read it may view it.
  if (!can(viewerRole, 'userManagement', 'read')) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-gray-500">{t('accountDashboard.noAccess', 'You do not have access to user management.')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <p className="text-xs sm:text-sm text-gray-500">
        {t('accountDashboard.breadcrumbConsole', 'Console')} <span className="mx-1">›</span> {title}
      </p>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e]">{title}</h1>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isSuperadmin && (
            <Link to={adminRoutes.books}>
              <Button className="bg-[#0d0e0e] hover:bg-black text-white rounded-lg">
                {t('accountDashboard.manageBooks', 'Manage Books')}
              </Button>
            </Link>
          )}
          {canCreateUsers && (
            <Button
              className="bg-[#1a8a5a] hover:bg-[#16774e] text-white rounded-lg"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {t('accountDashboard.addUser', 'Add user')}
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t('accountDashboard.stats.totalUsers', 'Total users')}
          value={stats?.totalUsers ?? '—'}
          sub={t('accountDashboard.stats.totalUsersSub', 'Across all roles')}
        />
        <StatCard
          label={t('accountDashboard.stats.admins', 'Admins')}
          value={stats?.admins ?? '—'}
          sub={t('accountDashboard.stats.adminsSub', 'Full panel access')}
        />
        <StatCard
          label={t('accountDashboard.stats.users', 'Users')}
          value={stats?.users ?? '—'}
          sub={t('accountDashboard.stats.usersSub', 'Standard access')}
        />
        <StatCard
          label={t('accountDashboard.stats.crmUsers', 'CRM users only')}
          value={stats?.crmUsers ?? '—'}
          sub={t('accountDashboard.stats.crmUsersSub', 'CRM module access')}
        />
      </div>

      {/* Users & roles */}
      <div className="border border-gray-200 rounded-xl">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">
            {t('accountDashboard.usersRoles', 'Users & roles')}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('accountDashboard.searchPlaceholder', 'Search by name or email…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.cols.user', 'User')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.cols.role', 'Role')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.cols.company', 'Company')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.cols.status', 'Status')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.cols.lastActive', 'Last active')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">{t('accountDashboard.cols.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-10">
                    {t('accountDashboard.loading', 'Loading…')}
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-10">
                    {t('accountDashboard.noUsers', 'No users found.')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const manageable = canManage(u);
                  const rk = roleKey(u.role);
                  return (
                    <TableRow key={u.uid} className="hover:bg-gray-50">
                      {/* User */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} />
                          <div className="min-w-0">
                            <p className="font-medium text-[#0d0e0e] truncate">{u.name || '—'}</p>
                            <p className="text-xs text-gray-500 truncate">{u.mail}</p>
                          </div>
                        </div>
                      </TableCell>
                      {/* Role. Managers (Superadmin/Admin) get the editable picker on every
                          row — including "No access" users — so they can grant a console role.
                          The picker includes the "No access" option, so an unmanageable row (or
                          self) still falls through to the read-only badge. */}
                      <TableCell>
                        {manageable ? (
                          <Select
                            value={ROLE_OPTIONS.find((o) => o.key === rk)?.value ?? 'none'}
                            onChange={(e) => requestRoleChange(u, e.target.value)}
                            disabled={updateUser.isPending}
                            className="w-40 h-8 text-xs"
                          >
                            {roleOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {t(`accountDashboard.roles.${o.key}`)}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <span className={cn('inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border', roleBadgeClass[rk])}>
                            {t(`accountDashboard.roles.${rk}`)}
                          </span>
                        )}
                      </TableCell>
                      {/* Company the user belongs to (blank for platform-level staff who aren't tied to one). */}
                      <TableCell className="text-gray-600 text-sm">{u.companyName ?? '—'}</TableCell>
                      {/* Status. No-access users (customers) can't use the admin console,
                          so they default to a read-only "Inactive" badge here — their real
                          account status is unchanged. */}
                      <TableCell>{statusBadge(rk === 'none' ? 'inactive' : u.accountStatus)}</TableCell>
                      {/* Last active */}
                      <TableCell className="text-gray-600 text-sm whitespace-nowrap">
                        {u.accountStatus === 'invited'
                          ? t('accountDashboard.pending', 'Pending')
                          : u.access
                          ? formatDateTime(u.access)
                          : t('accountDashboard.never', 'Never')}
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!manageable}
                            onClick={() => setEditTarget(u)}
                          >
                            {t('accountDashboard.actions.edit', 'Edit')}
                          </Button>
                          {manageable && u.accountStatus === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={updateUser.isPending}
                              onClick={() => handleStatusChange(u.uid, 0, 'suspend')}
                            >
                              {t('accountDashboard.actions.suspend', 'Suspend')}
                            </Button>
                          )}
                          {manageable && u.accountStatus === 'invited' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={updateUser.isPending}
                              onClick={() => handleStatusChange(u.uid, 0, 'revoke')}
                            >
                              {t('accountDashboard.actions.revoke', 'Revoke')}
                            </Button>
                          )}
                          {manageable && u.accountStatus === 'suspended' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-700 border-green-200 hover:bg-green-50"
                              disabled={updateUser.isPending}
                              onClick={() => handleStatusChange(u.uid, 1, 'reactivate')}
                            >
                              {t('accountDashboard.actions.reactivate', 'Reactivate')}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Users pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {t('accountDashboard.pagination.showing', {
              defaultValue: 'Showing {{from}}–{{to}} of {{total}} users',
              from: usersTotal === 0 ? 0 : (page - 1) * pageSize + 1,
              to: Math.min(page * pageSize, usersTotal),
              total: usersTotal,
            })}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('accountDashboard.prev', '← Prev')}
              </Button>
              <span className="text-sm text-gray-600 px-2 tabular-nums">
                {page} / {usersPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= usersPages} onClick={() => setPage((p) => p + 1)}>
                {t('accountDashboard.next', 'Next →')}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{t('accountDashboard.pagination.show', 'Show')}</span>
              <Select
                value={String(pageSize)}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="w-20 h-8 text-xs"
              >
                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
              <span>{t('accountDashboard.pagination.perPage', 'per page')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity log */}
      <div className="border border-gray-200 rounded-xl">
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">
            {t('accountDashboard.activityLog', 'Activity log')}
          </h2>
        </div>

        {/* Tabs: Admin panel = all activity; User console = handbook publish events */}
        <div className="px-4 sm:px-6">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            {(['admin', 'userConsole'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  tab === key ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900',
                )}
              >
                {key === 'admin'
                  ? t('accountDashboard.tabs.adminPanel', 'Admin panel')
                  : t('accountDashboard.tabs.userConsole', 'User console')}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {tab === 'admin' ? <ActivityFeed /> : <UserConsoleFeed />}
        </div>
      </div>

      <AddUserDialog open={addOpen} onClose={() => setAddOpen(false)} roleOptions={roleOptions} />
      <EditUserDialog user={editTarget} onClose={() => setEditTarget(null)} roleOptions={roleOptions} />

      {/* Confirm role change for users who currently have customer access */}
      <Dialog open={!!confirmRole} onOpenChange={(o) => { if (!o) setConfirmRole(null); }}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#0d0e0e]">
            {t('accountDashboard.confirmRole.title', 'Change this customer’s role?')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('accountDashboard.confirmRole.body', {
              defaultValue:
                '{{name}} currently has customer access. Assigning an admin-console role removes their customer / user-console access and converts them to staff. Continue?',
              name: confirmRole?.name ?? '',
            })}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setConfirmRole(null)}>
              {t('accountDashboard.form.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={updateUser.isPending}
              onClick={() => { if (confirmRole) handleRoleChange(confirmRole.uid, confirmRole.role); setConfirmRole(null); }}
            >
              {t('accountDashboard.confirmRole.confirm', 'Yes, change role')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Add / Edit user dialogs                                                   */
/* -------------------------------------------------------------------------- */

type RoleOption = { value: string; key: RoleKey };

const AddUserDialog: React.FC<{ open: boolean; onClose: () => void; roleOptions: RoleOption[] }> = ({ open, onClose, roleOptions }) => {
  const { t } = useTranslation('admin');
  const createUser = useCreateAdminUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff_user');

  React.useEffect(() => {
    if (open) { setName(''); setEmail(''); setPassword(''); setRole('staff_user'); }
  }, [open]);

  const valid = name.trim().length > 0 && email.trim().length > 2 && password.length >= 8;

  const submit = () => {
    if (!valid) return;
    createUser.mutate(
      { name: name.trim(), email: email.trim(), password, role },
      {
        onSuccess: () => { toast.success(t('accountDashboard.userCreated', 'User created')); onClose(); },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
          toast.error(msg ?? t('accountDashboard.userCreateFailed', 'Could not create user'));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#0d0e0e]">{t('accountDashboard.addUserTitle', 'Add user')}</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="au-name">{t('accountDashboard.form.name', 'Name')}</Label>
            <Input id="au-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="au-email">{t('accountDashboard.form.email', 'Email')}</Label>
            <Input id="au-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="au-pass">{t('accountDashboard.form.tempPassword', 'Temporary password')}</Label>
            <Input id="au-pass" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('accountDashboard.form.passwordHint', 'At least 8 characters')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="au-role">{t('accountDashboard.form.role', 'Role')}</Label>
            <Select id="au-role" value={role} onChange={(e) => setRole(e.target.value)}>
              {roleOptions.map((o) => <option key={o.value} value={o.value}>{t(`accountDashboard.roles.${o.key}`)}</option>)}
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>{t('accountDashboard.form.cancel', 'Cancel')}</Button>
          <Button disabled={!valid || createUser.isPending} onClick={submit} className="bg-[#1a8a5a] hover:bg-[#16774e] text-white">
            {createUser.isPending ? t('accountDashboard.form.creating', 'Creating…') : t('accountDashboard.form.create', 'Create user')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditUserDialog: React.FC<{ user: AdminUser | null; onClose: () => void; roleOptions: RoleOption[] }> = ({ user, onClose, roleOptions }) => {
  const { t } = useTranslation('admin');
  const updateUser = useUpdateAdminUser();
  const [name, setName] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [status, setStatus] = useState('1');

  React.useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setRole(ROLE_OPTIONS.find((o) => o.key === roleKey(user.role))?.value ?? 'EMPLOYEE');
      setStatus(String(user.status));
    }
  }, [user]);

  const submit = () => {
    if (!user) return;
    updateUser.mutate(
      { userId: user.uid, data: { name: name.trim(), role, status: Number(status) } },
      {
        onSuccess: () => { toast.success(t('accountDashboard.userUpdated', 'User updated')); onClose(); },
        onError: () => toast.error(t('accountDashboard.userUpdateFailed', 'Could not update user')),
      },
    );
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#0d0e0e]">{t('accountDashboard.editUserTitle', 'Edit user')}</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="eu-name">{t('accountDashboard.form.name', 'Name')}</Label>
            <Input id="eu-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eu-role">{t('accountDashboard.form.role', 'Role')}</Label>
            <Select id="eu-role" value={role} onChange={(e) => setRole(e.target.value)}>
              {roleOptions.map((o) => <option key={o.value} value={o.value}>{t(`accountDashboard.roles.${o.key}`)}</option>)}
            </Select>
            {user && CUSTOMER_ROLES.has(user.role) && (
              <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {t('accountDashboard.confirmRole.editWarning', 'This user currently has customer access. Changing their role removes their customer / user-console access.')}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eu-status">{t('accountDashboard.form.status', 'Status')}</Label>
            <Select id="eu-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="1">{t('accountDashboard.statuses.active', 'Active')}</option>
              <option value="0">{t('accountDashboard.statuses.suspended', 'Suspended')}</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>{t('accountDashboard.form.cancel', 'Cancel')}</Button>
          <Button disabled={updateUser.isPending || !name.trim()} onClick={submit} className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90">
            {updateUser.isPending ? t('accountDashboard.form.saving', 'Saving…') : t('accountDashboard.form.save', 'Save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/*  Activity feeds                                                            */
/* -------------------------------------------------------------------------- */

function ActivityPagination({
  page, total, pageSize, onPrev, onNext,
}: { page: number; total: number; pageSize: number; onPrev: () => void; onNext: () => void }) {
  const { t } = useTranslation('admin');
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        {t('accountDashboard.pagination.showingActivities', {
          defaultValue: 'Showing {{from}}–{{to}} of {{total}} activities',
          from: total === 0 ? 0 : (page - 1) * pageSize + 1,
          to: Math.min(page * pageSize, total),
          total,
        })}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>
          {t('accountDashboard.prev', '← Prev')}
        </Button>
        <span className="text-sm text-gray-600 px-2 tabular-nums">{page} / {pages}</span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={onNext}>
          {t('accountDashboard.next', 'Next →')}
        </Button>
      </div>
    </div>
  );
}

const ACTIVITY_PAGE_SIZE = 10;

const ActivityFeed: React.FC = () => {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUserConsoleActivity({ page, limit: ACTIVITY_PAGE_SIZE });
  const entries: UserConsoleActivityEntry[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.activityCols.activity', 'Activity')}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.activityCols.companyName', 'Company name')}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.activityCols.user', 'User')}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">{t('accountDashboard.activityCols.timestamp', 'Timestamp')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-10">{t('accountDashboard.loading', 'Loading…')}</TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-10">{t('accountDashboard.noActivities', 'No activity yet.')}</TableCell></TableRow>
            ) : (
              entries.map((e) => (
                <TableRow key={e.id} className="hover:bg-gray-50">
                  <TableCell>
                    <p className="text-sm font-medium text-[#0d0e0e]">{e.title}</p>
                    {e.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{e.description}</p>}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-[#0d0e0e]">{e.companyName || '—'}</p>
                    {e.cvr && <p className="text-xs text-gray-400">CVR: {e.cvr}</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {e.userName && <Avatar name={e.userName} />}
                      <span className="text-sm text-gray-700 whitespace-nowrap">{e.userName || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 text-right whitespace-nowrap">{formatDateTime(e.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ActivityPagination
        page={page} total={total} pageSize={ACTIVITY_PAGE_SIZE}
        onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)}
      />
    </>
  );
};

/** A handbook publish-status-change is an "unpublish" when the body says the
 *  handbook is no longer published; otherwise it's a publish. */
function isUnpublish(description: string): boolean {
  return /ikke længere udgivet|no longer published/i.test(description);
}

/* User console feed: handbook publish/unpublish events only (the user-console
   product actions actually recorded), rendered with a status badge. */
const UserConsoleFeed: React.FC = () => {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUserConsoleActivity({ page, limit: ACTIVITY_PAGE_SIZE, kind: 'handbook' });
  const entries: UserConsoleActivityEntry[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.activityCols.activity', 'Activity')}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.activityCols.companyName', 'Company name')}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accountDashboard.activityCols.user', 'User')}</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">{t('accountDashboard.activityCols.timestamp', 'Timestamp')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-10">{t('accountDashboard.loading', 'Loading…')}</TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-10">{t('accountDashboard.noActivities', 'No activity yet.')}</TableCell></TableRow>
            ) : (
              entries.map((e) => {
                const unpublished = isUnpublish(e.description);
                return (
                  <TableRow key={e.id} className="hover:bg-gray-50">
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border',
                        unpublished ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200',
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', unpublished ? 'bg-amber-500' : 'bg-green-500')} />
                        {unpublished
                          ? t('accountDashboard.badges.unpublishedHandbook', 'Unpublished handbook')
                          : t('accountDashboard.badges.publishedHandbook', 'Published handbook')}
                      </span>
                      {e.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{e.description}</p>}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-[#0d0e0e]">{e.companyName || '—'}</p>
                      {e.cvr && <p className="text-xs text-gray-400">CVR: {e.cvr}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {e.userName && <Avatar name={e.userName} />}
                        <span className="text-sm text-gray-700 whitespace-nowrap">{e.userName || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 text-right whitespace-nowrap">{formatDateTime(e.createdAt)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <ActivityPagination
        page={page} total={total} pageSize={ACTIVITY_PAGE_SIZE}
        onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)}
      />
    </>
  );
};
