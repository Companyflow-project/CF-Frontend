import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Video, Mail, Phone, FileText, Monitor, Users as UsersIcon, Linkedin, Cog } from 'lucide-react';
import { useCrmUsers, useCrmSummary, useCrmActivities } from '../hooks';
import { adminRoutes } from '../routes';
import type { CrmListParams } from '../types';
import { SortableTableHead, toggleSort, type SortDirection } from '../components/sortable-table-head';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const PERIODS = [
  { key: 'previous', label: 'Previous' },
  { key: 'latest_week', label: 'Latest week' },
  { key: 'next_week', label: 'Next week' },
  { key: 'next_month', label: 'Next month' },
  { key: 'all_upcoming', label: 'All upcoming' },
] as const;

const STATUSES = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'pending', label: 'Pending' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Completed' },
] as const;

const FOLLOW_UPS = [
  { key: 'all', label: 'All' },
  { key: 'fup_date', label: 'FUP date' },
  { key: 'no_fup_date', label: 'No FUP date' },
] as const;

const TYPES = [
  { key: 'all', label: 'All', icon: null },
  { key: 'unknown', label: 'Unknown', icon: FileText },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'editorial', label: 'Editorial', icon: FileText },
  { key: 'telephone', label: 'Telephone', icon: Phone },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'physical_meeting', label: 'Physical meeting', icon: UsersIcon },
  { key: 'online_meeting', label: 'Online meeting', icon: Video },
  { key: 'automatic', label: 'Automatic', icon: Cog },
] as const;

function Pill({
  active,
  children,
  onClick,
  variant = 'default',
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'green' | 'dark';
}) {
  const base = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors';
  const styles = active
    ? variant === 'green'
      ? 'bg-green-50 text-green-700 border-green-200'
      : variant === 'dark'
      ? 'bg-[#0d0e0e] text-white border-[#0d0e0e]'
      : 'bg-[#0d0e0e] text-white border-[#0d0e0e]'
    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function Avatar({ name, color, active, onClick }: { name: string; color: string; active?: boolean; onClick?: () => void }) {
  const initials = name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 pr-3 pl-1 py-1 rounded-full border text-xs sm:text-sm transition-colors ${
        active ? 'bg-pink-50 border-pink-300 text-pink-900' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
      }`}
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
        style={{ backgroundColor: color }}
      >
        {initials}
      </span>
      <span className="truncate max-w-[140px]">{name}</span>
    </button>
  );
}

function TypeBadge({ type }: { type: string }) {
  const lower = type.toLowerCase();
  let bg = 'bg-gray-100 text-gray-700';
  let Icon: React.ComponentType<{ className?: string }> | null = null;

  if (lower.includes('online')) { bg = 'bg-blue-50 text-blue-700'; Icon = Video; }
  else if (lower.includes('automatic')) { bg = 'bg-gray-100 text-gray-700'; Icon = Cog; }
  else if (lower.includes('email')) { bg = 'bg-purple-50 text-purple-700'; Icon = Mail; }
  else if (lower.includes('telephone') || lower.includes('phone')) { bg = 'bg-green-50 text-green-700'; Icon = Phone; }
  else if (lower.includes('physical')) { bg = 'bg-amber-50 text-amber-700'; Icon = UsersIcon; }
  else if (lower.includes('linkedin')) { bg = 'bg-indigo-50 text-indigo-700'; Icon = Linkedin; }
  else { Icon = Monitor; }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${bg}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {type}
    </span>
  );
}

export const AdminCrmPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const [selectedUser, setSelectedUser] = useState<string | undefined>();
  const [period, setPeriod] = useState<CrmListParams['period']>('latest_week');
  const [status, setStatus] = useState<string | undefined>();
  const [followUp, setFollowUp] = useState<'all' | 'fup_date' | 'no_fup_date'>('all');
  const [activeType, setActiveType] = useState<string>('all');
  const [appliedType, setAppliedType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showHidden, setShowHidden] = useState(false);
  const [sortColumn, setSortColumn] = useState<'business' | 'activity' | 'type' | 'writtenOn' | 'next' | 'responsible'>('writtenOn');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const usersQuery = useCrmUsers();
  const summaryParams = useMemo(() => ({ userId: selectedUser, period, status, followUp }), [selectedUser, period, status, followUp]);
  const summaryQuery = useCrmSummary(summaryParams);
  const listParams = useMemo(() => ({
    page,
    limit: perPage,
    userId: selectedUser,
    period,
    status,
    followUp,
    type: appliedType === 'all' ? undefined : appliedType,
  }), [page, perPage, selectedUser, period, status, followUp, appliedType]);
  const activitiesQuery = useCrmActivities(listParams);

  const activities = activitiesQuery.data?.data ?? [];
  const sortedActivities = useMemo(() => {
    const cloned = [...activities];
    cloned.sort((a, b) => {
      const aValue =
        sortColumn === 'business'
          ? a.companyName ?? ''
          : sortColumn === 'activity'
          ? a.activity ?? ''
          : sortColumn === 'type'
          ? a.type ?? ''
          : sortColumn === 'writtenOn'
          ? new Date(a.writtenOn).getTime()
          : sortColumn === 'next'
          ? (a.fupDate ? new Date(a.fupDate).getTime() : 0)
          : a.responsibleName ?? '';
      const bValue =
        sortColumn === 'business'
          ? b.companyName ?? ''
          : sortColumn === 'activity'
          ? b.activity ?? ''
          : sortColumn === 'type'
          ? b.type ?? ''
          : sortColumn === 'writtenOn'
          ? new Date(b.writtenOn).getTime()
          : sortColumn === 'next'
          ? (b.fupDate ? new Date(b.fupDate).getTime() : 0)
          : b.responsibleName ?? '';
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const compare = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? compare : -compare;
    });
    return cloned;
  }, [activities, sortColumn, sortDirection]);

  const handleSort = (column: 'business' | 'activity' | 'type' | 'writtenOn' | 'next' | 'responsible') => {
    const next = toggleSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const meta = activitiesQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / perPage) : 1;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const selectedUserName =
    usersQuery.data?.find(u => String(u.uid) === selectedUser)?.name ?? t('crm.allUsers', 'All Users');
  const selectedUserColor =
    usersQuery.data?.find(u => String(u.uid) === selectedUser)?.colorSeed ?? '#d97706';
  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? '';

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">{t('nav.console', 'Console')}</Link>
          {' › '}
          <span className="text-gray-700">{t('crm.breadcrumb', 'CRM To-Do List')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
          {t('crm.title', 'CRM To-Do List')}
        </h1>
      </div>

      {/* Filters card */}
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6 space-y-5">
        {/* Users */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('crm.filters.users', 'Users')}
          </div>
          <div className="flex flex-wrap gap-2">
            {(usersQuery.data ?? []).map(u => (
              <Avatar
                key={u.uid}
                name={u.name}
                color={u.colorSeed}
                active={selectedUser === String(u.uid)}
                onClick={() => {
                  setSelectedUser(prev => prev === String(u.uid) ? undefined : String(u.uid));
                  setPage(1);
                }}
              />
            ))}
            {usersQuery.isLoading && (
              <span className="text-xs text-gray-400">{t('common.loading', 'Loading…')}</span>
            )}
          </div>
        </div>

        {/* Period + Status + Follow-up */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-gray-100">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('crm.filters.period', 'Period')}
            </div>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map(p => (
                <Pill
                  key={p.key}
                  active={period === p.key}
                  variant="green"
                  onClick={() => { setPeriod(p.key); setPage(1); }}
                >
                  {t(`crm.periods.${p.key}`, p.label)}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('crm.filters.status', 'Status')}
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <Pill
                  key={s.key}
                  active={status === s.key}
                  onClick={() => { setStatus(prev => prev === s.key ? undefined : s.key); setPage(1); }}
                >
                  {t(`crm.statuses.${s.key}`, s.label)}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('crm.filters.followUp', 'Follow-up')}
            </div>
            <div className="flex flex-wrap gap-2">
              {FOLLOW_UPS.map(f => (
                <Pill
                  key={f.key}
                  active={followUp === f.key}
                  variant="green"
                  onClick={() => { setFollowUp(f.key); setPage(1); }}
                >
                  {t(`crm.followUps.${f.key}`, f.label)}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* CRM Activities */}
        <div className="pt-4 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('crm.filters.activities', 'CRM Activities')}
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill active={!showHidden} variant="green" onClick={() => setShowHidden(false)}>
              {t('crm.filters.all', 'All')}
            </Pill>
            <Pill active={showHidden} onClick={() => setShowHidden(v => !v)}>
              {t('crm.filters.showHidden', 'Show Hidden')} (0)
            </Pill>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: selectedUserColor }}
            >
              {selectedUserName.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)}
            </span>
            <div>
              <div className="font-semibold text-[#0d0e0e]">{selectedUserName}</div>
              <div className="text-xs text-gray-500">
                {t('crm.summary.viewing', 'Viewing all activities · {{period}}', { period: t(`crm.periods.${period}`, periodLabel) })}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 sm:gap-8 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0d0e0e]">{summaryQuery.data?.total ?? 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('crm.summary.total', 'Total')}</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0d0e0e]">{summaryQuery.data?.meetings ?? 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('crm.summary.meetings', 'Meetings')}</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0d0e0e]">{summaryQuery.data?.automatic ?? 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('crm.summary.automatic', 'Automatic')}</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0d0e0e]">{summaryQuery.data?.other ?? 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('crm.summary.other', 'Other')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Type filter + Apply */}
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide lg:mr-2">
            {t('crm.filters.type', 'Type')}
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {TYPES.map(typ => (
              <Pill
                key={typ.key}
                active={activeType === typ.key}
                variant="dark"
                onClick={() => setActiveType(typ.key)}
              >
                {typ.icon && <typ.icon className="h-3.5 w-3.5" />}
                {t(`crm.types.${typ.key}`, typ.label)}
              </Pill>
            ))}
          </div>
          <Button
            size="sm"
            className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 rounded-lg w-full lg:w-auto"
            onClick={() => { setAppliedType(activeType); setPage(1); }}
          >
            {t('crm.apply', 'Apply')}
          </Button>
        </div>
      </div>

      {/* Activities table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <SortableTableHead column="business" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crm.columns.business', 'Business')}</SortableTableHead>
                <SortableTableHead column="activity" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crm.columns.activity', 'Activity')}</SortableTableHead>
                <SortableTableHead column="type" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crm.columns.type', 'Type')}</SortableTableHead>
                <SortableTableHead column="writtenOn" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crm.columns.writtenOn', 'Written On')}</SortableTableHead>
                <SortableTableHead column="next" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crm.columns.next', 'Next')}</SortableTableHead>
                <SortableTableHead column="responsible" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crm.columns.responsible', 'Responsible')}</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activitiesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">{t('common.loading', 'Loading…')}</TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">{t('crm.empty', 'No activities found.')}</TableCell>
                </TableRow>
              ) : (
                sortedActivities.map(a => (
                  <TableRow key={a.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <Link
                        to={adminRoutes.companyDetail.replace(':id', String(a.companyId))}
                        className="text-[#0d0e0e] hover:underline"
                      >
                        {a.companyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-700 max-w-[340px]">{a.activity}</TableCell>
                    <TableCell><TypeBadge type={a.type} /></TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(a.writtenOn).toLocaleDateString('da-DK')}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {a.fupDate ? new Date(a.fupDate).toLocaleDateString('da-DK') : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {a.responsibleName ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.colorSeed || '#ef4444' }} />
                          <span className="text-gray-700">{a.responsibleName}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {t('crm.showing', 'Showing {{from}}–{{to}} of {{total}} activities', { from, to, total })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> {t('common.prev', 'Prev')}
            </Button>
            <span className="text-sm text-gray-700 px-2">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              {t('common.next', 'Next')} <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 ml-3">
              <span className="text-sm text-gray-500">{t('common.show', 'Show')}</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm px-2 py-1"
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-500">{t('common.perPage', 'per page')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
