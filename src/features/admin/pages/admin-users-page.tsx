import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAdminUsers, useUpdateAdminUser } from '../hooks';
import type { AdminUserListParams } from '../types';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { SortableTableHead, toggleSort, type SortDirection } from '../components/sortable-table-head';

const ROLES = ['all', 'admin', 'company_admin', 'employee'] as const;
const STATUSES = ['all', 'active', 'blocked'] as const;
const PAGE_SIZE = 20;

export const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation('admin');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'name' | 'email' | 'role' | 'company' | 'status' | 'lastActive'>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const params: AdminUserListParams = {
    page,
    limit: PAGE_SIZE,
    ...(search && { search }),
    ...(roleFilter !== 'all' && { role: roleFilter }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(companyFilter && { companyId: companyFilter }),
  };

  const { data, isLoading } = useAdminUsers(params);
  const updateUser = useUpdateAdminUser();

  const users = data?.data ?? [];
  const sortedUsers = useMemo(() => {
    const cloned = [...users];
    cloned.sort((a, b) => {
      const aValue =
        sortColumn === 'name'
          ? a.name ?? ''
          : sortColumn === 'email'
          ? a.mail ?? ''
          : sortColumn === 'role'
          ? a.role ?? ''
          : sortColumn === 'company'
          ? a.companyName ?? ''
          : sortColumn === 'status'
          ? a.status
          : a.access;
      const bValue =
        sortColumn === 'name'
          ? b.name ?? ''
          : sortColumn === 'email'
          ? b.mail ?? ''
          : sortColumn === 'role'
          ? b.role ?? ''
          : sortColumn === 'company'
          ? b.companyName ?? ''
          : sortColumn === 'status'
          ? b.status
          : b.access;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const compare = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? compare : -compare;
    });
    return cloned;
  }, [users, sortColumn, sortDirection]);

  const handleSort = (column: 'name' | 'email' | 'role' | 'company' | 'status' | 'lastActive') => {
    const next = toggleSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const meta = data?.meta;
  const totalPages = meta?.total ? Math.ceil(meta.total / PAGE_SIZE) : 1;

  const handleRoleChange = (userId: number, newRole: string) => {
    updateUser.mutate(
      { userId, data: { role: newRole } },
      {
        onSuccess: () => toast.success(t('users.roleUpdated')),
        onError: () => toast.error(t('users.roleUpdateFailed')),
      }
    );
  };

  const handleToggleStatus = (userId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    updateUser.mutate(
      { userId, data: { status: newStatus } },
      {
        onSuccess: () =>
          toast.success(
            newStatus === 1 ? t('users.activated') : t('users.deactivated')
          ),
        onError: () => toast.error(t('users.statusUpdateFailed')),
      }
    );
  };

  const formatLastActive = (timestamp: number) => {
    if (!timestamp) return t('users.never');
    return new Date(timestamp * 1000).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('users.title', 'Users')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('users.description', 'Manage platform users')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.allUsers', 'All users')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-6">
            <div className="relative flex-1 min-w-full sm:min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('users.searchPlaceholder', 'Search users...')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-44"
            >
              <option value="all">{t('users.allRoles', 'All roles')}</option>
              {ROLES.filter((r) => r !== 'all').map((role) => (
                <option key={role} value={role}>
                  {t(`users.roles.${role}`)}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-40"
            >
              <option value="all">{t('users.allStatuses', 'All statuses')}</option>
              {STATUSES.filter((s) => s !== 'all').map((status) => (
                <option key={status} value={status}>
                  {t(`users.statuses.${status}`)}
                </option>
              ))}
            </Select>
            <Input
              placeholder={t('users.companyIdFilter', 'Company ID')}
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-44"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              {t('common.loading', 'Loading...')}
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              {t('users.noResults', 'No users found')}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="name" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>{t('users.columns.name', 'Name')}</SortableTableHead>
                    <SortableTableHead column="email" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>{t('users.columns.email', 'Email')}</SortableTableHead>
                    <SortableTableHead column="role" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>{t('users.columns.role', 'Role')}</SortableTableHead>
                    <SortableTableHead column="company" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>{t('users.columns.company', 'Company')}</SortableTableHead>
                    <SortableTableHead column="status" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>{t('users.columns.status', 'Status')}</SortableTableHead>
                    <SortableTableHead column="lastActive" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>{t('users.columns.lastActive', 'Last active')}</SortableTableHead>
                    <TableHead className="text-right">
                      {t('users.columns.actions', 'Actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-gray-500">{user.mail}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.uid, e.target.value)
                          }
                          className="w-40 h-8 text-xs"
                          disabled={updateUser.isPending}
                        >
                          {ROLES.filter((r) => r !== 'all').map((role) => (
                            <option key={role} value={role}>
                              {t(`users.roles.${role}`)}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {user.companyName ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.status === 1
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {user.status === 1
                            ? t('users.statuses.active')
                            : t('users.statuses.blocked')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatLastActive(user.access)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updateUser.isPending}
                          onClick={() =>
                            handleToggleStatus(user.uid, user.status)
                          }
                        >
                          {user.status === 1
                            ? t('users.deactivate', 'Deactivate')
                            : t('users.activate', 'Activate')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  {t('common.pagination', {
                    from: (page - 1) * PAGE_SIZE + 1,
                    to: Math.min(page * PAGE_SIZE, meta?.total ?? 0),
                    total: meta?.total ?? 0,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
