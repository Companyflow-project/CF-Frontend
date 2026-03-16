import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { EmployeesTable } from '../components/employees-table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useEmployees } from '@/lib/api-hooks';
import { transformEmployee, type BackendEmployeeLike } from '@/lib/api-transformers';
import { employeesRoutes } from '../routes';
import { accountRoutes } from '@/features/account/routes';
import { contactsRoutes } from '@/features/contacts/routes';
import { useSubscription } from '@/features/account/hooks';
import { Search, ArrowUpDown, ArrowDownWideNarrow, AlertTriangle } from 'lucide-react';
import { useViewAsEmployee } from '@/context/view-as-employee-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { employeesApi } from '../api';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { isAdminRole, isAdminEmployeeRole } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const companyId = authUser?.companyId ? String(authUser.companyId) : undefined;
  const isAdmin = isAdminRole(authUser?.role);
  const isStrictAdmin = isAdminRole(authUser?.role);
  const { viewAsEmployee, toggleViewAsEmployee } = useViewAsEmployee();
  const { t } = useTranslation('employees');
  const effectiveAdmin = isAdmin && !viewAsEmployee;
  const { data: subscriptionData } = useSubscription(companyId);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'email' | 'employment'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    employeeId: string | null;
    employeeName: string;
  }>({
    isOpen: false,
    employeeId: null,
    employeeName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input to avoid excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: apiEmployees, loading, error, refetch } = useEmployees(
    {
      search: debouncedSearch.trim() || undefined,
      limit: debouncedSearch.trim() ? 10000 : 100,
    }
  );

  const employees = useMemo(() => {
    if (!apiEmployees) return [];
    return (apiEmployees as unknown as BackendEmployeeLike[]).map(transformEmployee);
  }, [apiEmployees]);

  const filteredEmployees = useMemo(() => {
    const isCurrentUser = (emp: ReturnType<typeof transformEmployee>) =>
      authUser?.email && emp.email.toLowerCase() === authUser.email.toLowerCase();

    let filtered = [...employees];

    if (isStrictAdmin) {
      // Admins/company_admins see all by default; toggles narrow the list
      if (showInactive) {
        filtered = filtered.filter((emp) => isCurrentUser(emp) || emp.status === 'INACTIVE');
      }
      if (publicOnly) {
        filtered = filtered.filter((emp) => isCurrentUser(emp) || emp.isPublic);
      }
    } else {
      // Non-admins (including managers) only see active, public employees (+ themselves)
      filtered = filtered.filter((emp) => isCurrentUser(emp) || (emp.status !== 'INACTIVE' && emp.isPublic));
    }

    return filtered;
  }, [employees, showInactive, publicOnly, authUser?.email, isStrictAdmin]);

  const sortedEmployees = useMemo(() => {
    const getKey = (emp: ReturnType<typeof transformEmployee>) => {
      if (sortField === 'name') return emp.name ?? '';
      if (sortField === 'email') return emp.email ?? '';
      return emp.employmentTitle || emp.employmentType || '';
    };

    return [...filteredEmployees].sort((a, b) => {
      // Admins/owners always stay at the top, regardless of sort direction or field.
      const aIsAdmin = isAdminEmployeeRole(a.role);
      const bIsAdmin = isAdminEmployeeRole(b.role);
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;

      // Within the same group, sort by the selected field.
      const av = getKey(a).toLowerCase();
      const bv = getKey(b).toLowerCase();
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      const cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredEmployees, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedEmployees.slice(startIndex, endIndex);
  }, [sortedEmployees, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, showInactive, publicOnly]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (!selected) {
      setSelectedIds([]);
      return;
    }
    const selectable = paginatedEmployees.filter(
      (emp) =>
        !isAdminEmployeeRole(emp.role) &&
        (!authUser?.email || emp.email.toLowerCase() !== authUser.email.toLowerCase())
    );
    setSelectedIds(selectable.map((emp) => emp.id));
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteDialog({
      isOpen: true,
      employeeId: id,
      employeeName: name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.employeeId) return;

    setIsDeleting(true);
    try {
      await employeesApi.deleteEmployee(deleteDialog.employeeId);
      setDeleteDialog({ isOpen: false, employeeId: null, employeeName: '' });
      setSelectedIds((prev) => prev.filter((id) => id !== deleteDialog.employeeId));
      refetch();
    } catch (err) {
      console.error('Failed to delete employee:', err);
      toast.error(t('toast.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const [isBulkBusy, setIsBulkBusy] = useState(false);

  // Set visibility for a list of ids
  const handleSetVisibility = async (ids: string[], isPublic: boolean) => {
    if (ids.length === 0) return;
    setIsBulkBusy(true);
    try {
      await Promise.all(ids.map((id) => employeesApi.updateEmployee(id, { isPublic })));
      toast.success(t('toast.visibilitySuccess', { count: ids.length, visibility: isPublic ? 'public' : 'private' }));
      refetch();
    } catch {
      toast.error(t('toast.updatesFailed'));
    } finally {
      setIsBulkBusy(false);
    }
  };

  // Deactivate selected employees
  const handleDeactivateSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkBusy(true);
    try {
      await Promise.all(selectedIds.map((id) => employeesApi.updateEmployee(id, { status: false })));
      toast.success(t('toast.deactivated', { count: selectedIds.length }));
      setSelectedIds([]);
      refetch();
    } catch {
      toast.error(t('toast.updatesFailed'));
    } finally {
      setIsBulkBusy(false);
    }
  };

  // Delete all selected (runs sequentially; stops on first error)
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    // Confirm via simple window confirm for bulk delete
    if (!window.confirm(t('toast.bulkDeleteConfirm', { count: selectedIds.length }))) return;
    setIsBulkBusy(true);
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await employeesApi.deleteEmployee(id);
      } catch {
        failed++;
      }
    }
    if (failed > 0) toast.error(t('toast.deletionsFailed', { count: failed }));
    else toast.success(t('toast.bulkDeleted', { count: selectedIds.length }));
    setSelectedIds([]);
    setIsBulkBusy(false);
    refetch();
  };

  const handleUpdateLanguages = async (id: string, languages: string[]) => {
    try {
      await employeesApi.updateEmployee(id, { languages });
      refetch();
    } catch {
      toast.error(t('toast.updatesFailed'));
    }
  };

  const hasSelection = selectedIds.length > 0;

  if (loading) {
    return (
      <PageShell>
        <PageHeader title={t('manage.title')} />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">{t('manage.loading')}</div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader title={t('manage.title')} />
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">{t('manage.error', { message: error.message })}</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={t('manage.title')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isStrictAdmin && !viewAsEmployee && (
              <Button
                variant="outline"
                onClick={() => { toggleViewAsEmployee(); navigate('/'); }}
                className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] bg-white"
              >
                {t('manage.viewAsEmployee')}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(employeesRoutes.informationList)}
              className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] bg-white"
            >
              {t('manage.viewInfoList')}
            </Button>
            {effectiveAdmin && (
              <Button
                variant="outline"
                className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] bg-white"
              >
                {t('manage.moreLicenses')}
              </Button>
            )}
            {effectiveAdmin && (
              <Button
                onClick={() => navigate(employeesRoutes.add)}
                className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] shadow-[0_10px_20px_rgba(23,102,79,0.35)]"
              >
                {t('manage.addEmployee')}
              </Button>
            )}
          </div>
        }
      />

      {/* help banner */}
      <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-[#0d0e0e] max-w-3xl">
            <p className="text-sm mb-1">
              <span className="font-bold">{t('manage.helpLabel')}</span>{' '}
              {t('manage.helpLine1').split('<bold>').map((part, i) => {
                if (i === 0) return part;
                const [bold, rest] = part.split('</bold>');
                return <React.Fragment key={i}><span className="font-bold">{bold}</span>{rest}</React.Fragment>;
              })}
            </p>
            <p className="text-sm">
              {t('manage.helpLine2')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[11px] py-[9px] h-auto whitespace-nowrap self-start sm:self-auto"
          >
            {t('manage.userManual')}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 overflow-hidden">
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* employee tools + table card */}
          <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] flex flex-col overflow-hidden">
            {/* search + filter bar */}
            <div className="bg-[#f2f7f5] border border-[#d6e8e1] rounded-[16px] mx-4 mt-4 px-4 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div className={`relative w-full ${isStrictAdmin ? 'lg:max-w-sm' : ''}`}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a85]" />
                <Input
                  placeholder={t('manage.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 rounded-[999px] border border-[#c8d8d3] bg-white text-sm"
                />
              </div>
              {isStrictAdmin && (
                <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2 rounded-[999px] border transition-colors ${showInactive
                      ? 'border-[#2c7860] bg-white text-[#0f172a]'
                      : 'border-transparent bg-[#e9f3ef] text-[#7b8a85]'
                      }`}
                    onClick={() => setShowInactive((v) => !v)}
                  >
                    <Checkbox
                      checked={showInactive}
                      onChange={(event) => {
                        event.stopPropagation();
                        setShowInactive(event.target.checked);
                      }}
                      className="h-3 w-3 rounded-[2.5px] border-[#3d997d]"
                    />
                    <span className="text-xs font-medium">{t('manage.showInactive')}</span>
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2 rounded-[999px] border transition-colors ${publicOnly
                      ? 'border-[#2c7860] bg-white text-[#0f172a]'
                      : 'border-transparent bg-[#e9f3ef] text-[#7b8a85]'
                      }`}
                    onClick={() => setPublicOnly((v) => !v)}
                  >
                    <Checkbox
                      checked={publicOnly}
                      onChange={(event) => {
                        event.stopPropagation();
                        setPublicOnly(event.target.checked);
                      }}
                      className="h-3 w-3 rounded-[2.5px] border-[#3d997d]"
                    />
                    <span className="text-xs font-medium">{t('manage.publicOnly')}</span>
                  </button>
                </div>
              )}
            </div>

            <CardContent className="pt-5 pb-0 flex-1 flex flex-col overflow-hidden">
              {/* sort + set all bar */}
              <div className="flex flex-wrap items-center gap-3 justify-between pb-4 border-b border-dashed border-[#d5e7e1]">
                <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#0d0e0e]">{t('manage.sort')}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[rgba(15,23,42,0.18)] text-[#242727] rounded-[10px] px-4 py-[9px] h-auto bg-white shadow-[0_6px_14px_rgba(15,23,42,0.05)]"
                        onClick={() =>
                          setSortField((prev) =>
                            prev === 'name' ? 'email' : prev === 'email' ? 'employment' : 'name',
                          )
                        }
                      >
                        {sortField === 'name' ? t('manage.sortName') : sortField === 'email' ? t('manage.sortEmail') : t('manage.sortEmployment')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('manage.cycleSortField')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-[#707677] rounded-full bg-white shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
                        aria-label="Toggle sort direction"
                        onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                      >
                        <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('manage.toggleSortDir')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-[#1a5948] rounded-full bg-white shadow-[0_6px_14px_rgba(28,91,72,0.25)]"
                        aria-label="Reset sort"
                        onClick={() => {
                          setSortField('name');
                          setSortDirection('asc');
                        }}
                      >
                        <ArrowDownWideNarrow className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('manage.resetSort')}</TooltipContent>
                  </Tooltip>
                </div>
                </TooltipProvider>
              </div>

              {!loading && !error && employees.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="text-sm text-[#6b7475]">
                    {t('manage.noEmployees')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="border-[#c8d8d3] text-[#0d0e0e] rounded-[10px]"
                  >
                    {t('manage.refetch')}
                  </Button>
                </div>
              )}

              <div className="min-h-0 overflow-auto max-h-[calc(100vh-360px)]">
                <EmployeesTable
                  employees={paginatedEmployees}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                  onDelete={effectiveAdmin ? handleDeleteRequest : undefined}
                  onEdit={effectiveAdmin ? (id) => navigate(employeesRoutes.edit(id)) : undefined}
                  onStatistics={(id) => navigate(employeesRoutes.statisticsDetail(id))}
                  onMessageLogs={(id) => navigate(employeesRoutes.messageLogsDetail(id))}
                  onUpdateLanguages={effectiveAdmin ? handleUpdateLanguages : undefined}
                  companyLanguages={authUser?.companyLanguages ?? ['da']}
                  emptyStateTitle={t('manage.noEmployeesTitle')}
                  emptyStateDescription={t('manage.noEmployeesDesc')}
                  currentUserEmail={authUser?.email ?? undefined}
                />
              </div>

              {filteredEmployees.length > itemsPerPage && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#d5e7e1] px-2 pb-2">
                  <div className="text-sm text-[#6b7475]">
                    {t('manage.showing', { from: ((currentPage - 1) * itemsPerPage) + 1, to: Math.min(currentPage * itemsPerPage, filteredEmployees.length), total: filteredEmployees.length })}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-[#c8d8d3] text-[#0d0e0e] rounded-[10px] px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('manage.previous')}
                    </Button>
                    <span className="px-4 py-2 text-sm text-[#0d0e0e] font-medium">
                      {t('manage.pageOf', { current: currentPage, total: totalPages })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="border-[#c8d8d3] text-[#0d0e0e] rounded-[10px] px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('manage.next')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>

            {/* bulk actions bar — inside the table card at the bottom (admin only) */}
            {effectiveAdmin && <div className="border-t border-[#e5efea] px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-b-[22px]">
              <div
                className="flex items-center gap-3 cursor-pointer h-9"
                onClick={() => {
                  if (hasSelection) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(filteredEmployees.map((emp) => emp.id));
                  }
                }}
              >
                <div
                  className={`h-4 w-4 rounded-[4px] border ${hasSelection ? 'bg-[#1a5948] border-[#1a5948]' : 'bg-transparent border-[#cfd6d4]'
                    }`}
                />
                <span
                  className={`text-sm whitespace-nowrap ${hasSelection ? 'text-[#484b4b]' : 'text-[#9fa4a4]'
                    }`}
                >
                  {t('manage.selected', { count: selectedIds.length })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasSelection || isBulkBusy}
                  className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13px] px-4 h-9 bg-white disabled:opacity-50"
                >
                  {t('manage.sendMessage')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasSelection || isBulkBusy}
                  onClick={() => handleSetVisibility(selectedIds, true)}
                  className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13px] px-4 h-9 bg-white disabled:opacity-50"
                >
                  {t('manage.setSelectedPublic')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasSelection || isBulkBusy}
                  onClick={() => handleSetVisibility(selectedIds, false)}
                  className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13px] px-4 h-9 bg-white disabled:opacity-50"
                >
                  {t('manage.setSelectedPrivate')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasSelection || isBulkBusy}
                  onClick={handleDeactivateSelected}
                  className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13px] px-4 h-9 bg-white disabled:opacity-50"
                >
                  {t('manage.deactivate')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasSelection || isBulkBusy}
                  onClick={handleDeleteSelected}
                  className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13px] px-4 h-9 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {t('manage.delete')}
                </Button>
              </div>
            </div>}

            {/* "Set everyone" bulk actions row — admin only */}
            {isStrictAdmin && effectiveAdmin && (
              <div className="border-t border-[#e5efea] px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-b-[22px]">
                <span className="text-sm font-medium text-[#484b4b]">{t('manage.bulkActions')}</span>
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBulkBusy || employees.length === 0}
                    onClick={() => handleSetVisibility(filteredEmployees.map((e) => e.id), false)}
                    className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13px] px-4 h-9 bg-white disabled:opacity-50"
                  >
                    {t('manage.setAllPrivate')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBulkBusy || employees.length === 0}
                    onClick={() => handleSetVisibility(filteredEmployees.map((e) => e.id), true)}
                    className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13px] px-4 h-9 bg-white disabled:opacity-50"
                  >
                    {t('manage.setAllPublic')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {/* license usage card — values from GET /companies/{id}/subscription */}
          <Card className="bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_12px_30px_rgba(15,23,42,0.08)] rounded-[12px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#0f172a]">{t('license.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 px-6 pb-0">
              <div className="flex justify-between items-center py-2 border-b border-dashed border-[rgba(88,172,146,0.5)]">
                <span className="text-sm text-[#0f172a]">{t('license.inSubscription')}</span>
                <span className="text-sm font-bold text-[#0f172a]">
                  {subscriptionData?.licensesTotal ?? '–'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-[rgba(88,172,146,0.5)]">
                <span className="text-sm text-[#0f172a]">{t('license.used')}</span>
                <span className="text-sm font-bold text-[#0f172a]">
                  {subscriptionData?.licensesUsed ?? '–'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-[rgba(88,172,146,0.5)]">
                <span className="text-sm text-[#0f172a]">{t('license.left')}</span>
                <span className="text-sm font-bold text-[#0f172a]">
                  {subscriptionData
                    ? subscriptionData.licensesTotal - subscriptionData.licensesUsed
                    : '–'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#0f172a]">{t('license.smsUsed')}</span>
                <span className="text-sm font-bold text-[#0f172a]">
                  {subscriptionData?.smsUsed ?? '–'}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-4 pb-4 px-6 justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(accountRoutes.subscription)}
                className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] rounded-[10px] text-xs px-4"
              >
                {t('license.moreLicenses')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(accountRoutes.subscription)}
                className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] rounded-[10px] text-xs px-4"
              >
                {t('license.manageSms')}
              </Button>
            </CardFooter>
          </Card>

          {/* shortcuts card */}
          <Card className="bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_12px_30px_rgba(15,23,42,0.08)] rounded-[12px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#0f172a]">{t('shortcuts.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-6 pb-5">
              {([
                { label: t('shortcuts.companySettings'), route: accountRoutes.editCompanyProfile },
                { label: t('shortcuts.employmentTypes'), route: accountRoutes.employmentTypes },
                { label: t('shortcuts.departments'), route: accountRoutes.departments },
                { label: t('shortcuts.importCsv'), route: `${contactsRoutes.list}?open=import` },
              ] as { label: string; route: string | null }[]).map(({ label, route }) => (
                <button
                  key={label}
                  onClick={() => route && navigate(route)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] border border-[rgba(88,172,146,0.5)] text-left hover:bg-[#f0f7f5] transition-colors ${!route ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="text-sm text-[#0d0e0e]">{label}</span>
                  <span className="text-base leading-[1] text-[#1d1f1f]">⇢</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteDialog((prev) => ({ ...prev, isOpen }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-amber-600">{t('deleteDialog.title')}</DialogTitle>
            </div>
            <DialogDescription className="py-4" dangerouslySetInnerHTML={{ __html: t('deleteDialog.confirm', { name: deleteDialog.employeeName }).replace('<bold>', '<strong>').replace('</bold>', '</strong>') }} />
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, employeeId: null, employeeName: '' })}
              disabled={isDeleting}
            >
              {t('deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t('deleteDialog.deleting') : t('deleteDialog.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};
