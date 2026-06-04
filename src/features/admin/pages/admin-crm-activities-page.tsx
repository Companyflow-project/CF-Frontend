import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useCrmActivities, useCrmUsers } from '../hooks';
import { adminRoutes } from '../routes';
import { SortableTableHead, toggleSort, type SortDirection } from '../components/sortable-table-head';

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function statusClasses(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-50 text-green-700 border-green-200';
    case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'paused': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'pending': return 'bg-gray-50 text-gray-700 border-gray-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function statusLabel(status: string, t: (k: string, fb: string) => string): string {
  switch (status) {
    case 'completed': return t('crmActivities.status.done', 'Done');
    case 'in_progress': return t('crmActivities.status.inProgress', 'In progress');
    case 'scheduled': return t('crmActivities.status.scheduled', 'Scheduled');
    case 'paused': return t('crmActivities.status.paused', 'Paused');
    case 'pending': return t('crmActivities.status.pending', 'Pending');
    default: return status;
  }
}

export const AdminCrmActivitiesPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const [createdByInput, setCreatedByInput] = useState('');
  const [appliedCreatedBy, setAppliedCreatedBy] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [sortColumn, setSortColumn] = useState<'created' | 'business' | 'activity' | 'responsible' | 'next' | 'of' | 'status' | 'writtenBy'>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: users = [] } = useCrmUsers();

  const matchingUser = useMemo(() => {
    const term = appliedCreatedBy.trim();
    if (!term) return null;
    const uidMatch = term.match(/\((\d+)\)\s*$/);
    if (uidMatch) {
      const uid = Number(uidMatch[1]);
      const byUid = users.find((u) => u.uid === uid);
      if (byUid) return byUid;
    }
    const lower = term.toLowerCase();
    return users.find((u) => u.name.toLowerCase().includes(lower)) ?? null;
  }, [users, appliedCreatedBy]);

  const filterLabel = matchingUser ? `${matchingUser.name} (${matchingUser.uid})` : appliedCreatedBy;

  const params = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(matchingUser ? { authorUid: String(matchingUser.uid) } : {}),
    }),
    [page, pageSize, matchingUser]
  );

  const { data, isLoading } = useCrmActivities(params);
  const activities = data?.data ?? [];
  const sortedActivities = useMemo(() => {
    const cloned = [...activities];
    cloned.sort((a, b) => {
      const aValue =
        sortColumn === 'created'
          ? new Date(a.writtenOn).getTime()
          : sortColumn === 'business'
          ? a.companyName ?? ''
          : sortColumn === 'activity'
          ? a.activity ?? ''
          : sortColumn === 'responsible'
          ? a.responsibleName ?? ''
          : sortColumn === 'next'
          ? a.fupDate ? new Date(a.fupDate).getTime() : 0
          : sortColumn === 'of'
          ? a.companyName ?? ''
          : sortColumn === 'status'
          ? a.status ?? ''
          : a.authorName ?? '';
      const bValue =
        sortColumn === 'created'
          ? new Date(b.writtenOn).getTime()
          : sortColumn === 'business'
          ? b.companyName ?? ''
          : sortColumn === 'activity'
          ? b.activity ?? ''
          : sortColumn === 'responsible'
          ? b.responsibleName ?? ''
          : sortColumn === 'next'
          ? b.fupDate ? new Date(b.fupDate).getTime() : 0
          : sortColumn === 'of'
          ? b.companyName ?? ''
          : sortColumn === 'status'
          ? b.status ?? ''
          : b.authorName ?? '';
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const compare = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? compare : -compare;
    });
    return cloned;
  }, [activities, sortColumn, sortDirection]);

  const handleSort = (column: 'created' | 'business' | 'activity' | 'responsible' | 'next' | 'of' | 'status' | 'writtenBy') => {
    const next = toggleSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / pageSize) : 1;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pageNumbers = useMemo(() => {
    const pages: Array<number | 'ellipsis'> = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  const handleApply = () => {
    const term = createdByInput.trim().toLowerCase();
    const match = term ? users.find((u) => u.name.toLowerCase().includes(term)) : null;
    if (match) {
      const resolved = `${match.name} (${match.uid})`;
      setCreatedByInput(resolved);
      setAppliedCreatedBy(resolved);
    } else {
      setAppliedCreatedBy(createdByInput);
    }
    setPage(1);
  };

  const handleClearFilter = () => {
    setCreatedByInput('');
    setAppliedCreatedBy('');
    setPage(1);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="text-sm text-gray-500">
          <span className="text-gray-700">{t('crmActivities.breadcrumb', 'CRM To-Do List')}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e]">
            {t('crmActivities.title', 'CRM To-Do List')}
          </h1>
          <Button asChild size="sm" className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 rounded-lg shrink-0">
            <Link to={adminRoutes.crmCreate}>
              <Plus className="h-4 w-4 mr-1" />
              {t('crmActivities.addActivity', 'Add Activity')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter card */}
      <div className="rounded-xl border border-gray-200 bg-[#fbfaee] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-[#0d0e0e] whitespace-nowrap">
            {t('crmActivities.createdBy', 'Created by')}
          </label>
          <div className="flex-1 min-w-[240px]">
            <Input
              value={createdByInput}
              placeholder={t('crmActivities.createdByPlaceholder', 'Enter a comma-separated list of usernames...')}
              onChange={(e) => setCreatedByInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
            />
          </div>
          <Button
            size="sm"
            className="bg-[#d6efc3] text-[#0d0e0e] hover:bg-[#c4e5a9] rounded-lg"
            onClick={handleApply}
          >
            {t('crmActivities.apply', 'Apply')}
          </Button>
          {appliedCreatedBy && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
            >
              {filterLabel}
              <span aria-hidden="true" className="text-gray-400">✕</span>
            </button>
          )}
          {!appliedCreatedBy && (
            <span className="text-xs text-gray-500">
              {t('crmActivities.leaveEmpty', 'Leave empty to show all')}
            </span>
          )}
        </div>
      </div>

      {/* Filter summary */}
      {matchingUser && (
        <div className="flex items-center justify-between text-xs uppercase tracking-wide font-semibold text-gray-500">
          <span>
            {t('crmActivities.showingForUser', 'Showing {{count}} activities for {{name}}', {
              count: total,
              name: matchingUser.name,
            })}
          </span>
          <button
            type="button"
            onClick={handleClearFilter}
            className="text-blue-600 normal-case tracking-normal font-normal hover:underline"
          >
            {t('crmActivities.viewAll', '← View all activities')}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <SortableTableHead column="created" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crmActivities.columns.created', 'Created')}</SortableTableHead>
                <SortableTableHead column="business" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crmActivities.columns.business', 'Business')}</SortableTableHead>
                <SortableTableHead column="activity" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crmActivities.columns.activity', 'Activity')}</SortableTableHead>
                <SortableTableHead column="responsible" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crmActivities.columns.responsible', 'Responsible')}</SortableTableHead>
                <SortableTableHead column="next" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crmActivities.columns.next', 'Next')}</SortableTableHead>
                <SortableTableHead column="of" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crmActivities.columns.of', 'Of')}</SortableTableHead>
                <SortableTableHead column="status" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crmActivities.columns.status', 'Status')}</SortableTableHead>
                <SortableTableHead column="writtenBy" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crmActivities.columns.writtenBy', 'Written By')}</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">{t('common.loading', 'Loading…')}</TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">{t('crmActivities.empty', 'No activities found.')}</TableCell>
                </TableRow>
              ) : (
                sortedActivities.map((a) => (
                  <TableRow key={a.id} className="hover:bg-gray-50 align-top">
                    <TableCell className="text-gray-600 text-xs whitespace-nowrap">{formatDate(a.writtenOn)}</TableCell>
                    <TableCell className="font-medium text-[#0d0e0e]">
                      {a.companyId ? (
                        <Link
                          to={adminRoutes.companyDetail.replace(':id', String(a.companyId))}
                          className="hover:underline"
                        >
                          {a.companyName}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700 max-w-[320px]">
                      <Link
                        to={adminRoutes.crmActivityEdit.replace(':id', String(a.id))}
                        className="font-medium hover:underline text-[#0d0e0e]"
                      >
                        {a.activity}
                      </Link>
                      {a.type && (
                        <div className="text-xs text-gray-500 mt-0.5">{a.type}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.responsibleName ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.colorSeed }} />
                          {a.responsibleName}
                        </span>
                      ) : a.authorName ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 italic">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.authorColorSeed }} />
                          {a.authorName}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-gray-600 text-xs whitespace-nowrap">
                      {a.fupDate ? formatDate(new Date(a.fupDate).toISOString()) : '—'}
                    </TableCell>
                    <TableCell className="text-gray-600 text-xs">
                      {a.companyName ? a.companyName : '—'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded border ${statusClasses(a.status)}`}>
                          {statusLabel(a.status, t)}
                        </span>
                        {a.isStatusInconsistent && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 text-amber-500 shrink-0"
                            aria-label={t(
                              'crmActivities.status.inconsistentTitle',
                              'Marked Done but follow-up is in the future',
                            )}
                          />
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {a.authorName ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.authorColorSeed }} />
                          {a.authorName}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {t('crmActivities.showing', 'Showing {{from}}–{{to}} of {{total}} activities', { from, to, total })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← {t('common.prev', 'Prev')}
                </Button>
                {pageNumbers.map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2 text-sm text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-[32px] h-8 px-2 text-sm rounded-md border transition-colors ${
                        p === page
                          ? 'bg-[#0d0e0e] text-white border-[#0d0e0e]'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t('common.next', 'Next')} →
                </Button>
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{t('crmActivities.show', 'Show')}</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span>{t('crmActivities.perPage', 'per page')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
