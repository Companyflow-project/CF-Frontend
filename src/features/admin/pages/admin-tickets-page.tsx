import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { generatePath } from 'react-router-dom';
import { useTicketFilters, useTickets, useTicketCreateOptions, useUpdateAnyTicket } from '../hooks';
import { adminRoutes } from '../routes';
import { SortableTableHead, toggleSort, type SortDirection } from '../components/sortable-table-head';

const PRIORITY_DOT: Record<string, string> = {
  critical: '#ef4444',
  embarrassing: '#ef4444',
  urgent: '#f97316',
  high: '#3b82f6',
  normal: '#10b981',
  nice_to_have: '#9ca3af',
};

const STATUS_BADGE: Record<string, string> = {
  created: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  waiting: 'bg-orange-50 text-orange-700 border-orange-200',
  stopped: 'bg-red-50 text-red-700 border-red-200',
  done: 'bg-green-50 text-green-700 border-green-200',
  to_be_tested: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  ready_to_upload: 'bg-purple-50 text-purple-700 border-purple-200',
};

function Initials({ name, color, size = 7 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white text-xs font-medium flex-shrink-0"
      style={{ backgroundColor: color, width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      {initials}
    </span>
  );
}

function formatDate(unix: number) {
  const d = new Date(unix * 1000);
  return d.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export const AdminTicketsPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const [tab, setTab] = useState<'tickets' | 'chronological'>('tickets');
  const [priority, setPriority] = useState<string | undefined>();
  const [statusTid, setStatusTid] = useState<string | undefined>();
  const [listTid, setListTid] = useState<string | undefined>();
  const [responsibleUid, setResponsibleUid] = useState<string | undefined>();
  const [authorUid, setAuthorUid] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [hiddenStatusKeys, setHiddenStatusKeys] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<'date' | 'title' | 'body' | 'responsible' | 'author' | 'priority' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const filtersQuery = useTicketFilters({ authorUid });
  const params = useMemo(() => ({
    page,
    limit: perPage,
    priority,
    statusTid,
    listTid,
    responsibleUid,
    authorUid,
    search: debouncedSearch || undefined,
    sort: tab === 'chronological' ? 'created_desc' : undefined,
  }), [page, perPage, priority, statusTid, listTid, responsibleUid, authorUid, debouncedSearch, tab]);

  // Always load tickets — Drupal parity (no "select a filter first" gate).
  const ticketsQuery = useTickets(params, true);
  const optionsQuery = useTicketCreateOptions();
  const updateMutation = useUpdateAnyTicket();
  const doneStatusTid = useMemo(
    () => optionsQuery.data?.statuses.find(s => s.key === 'done')?.tid,
    [optionsQuery.data]
  );

  const handleEdit = (nid: number) => {
    navigate(generatePath(adminRoutes.editTicket, { nid: String(nid) }));
  };

  const handleMarkDone = async (nid: number) => {
    if (!doneStatusTid) {
      toast.error(t('tickets.errors.noDoneStatus', 'Done status is not configured.'));
      return;
    }
    try {
      await updateMutation.mutateAsync({ nid, data: { statusTid: doneStatusTid } });
      toast.success(t('tickets.markedDone', 'Ticket #{{nid}} marked as done', { nid }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(t('tickets.errors.markDoneFailed', 'Failed to mark done: {{message}}', { message }));
    }
  };

  const updatingNid = updateMutation.variables?.nid;
  const isUpdating = updateMutation.isPending;

  const activeFilterCount =
    (priority ? 1 : 0) +
    (statusTid ? 1 : 0) +
    (listTid ? 1 : 0) +
    (responsibleUid ? 1 : 0) +
    (authorUid ? 1 : 0) +
    (debouncedSearch ? 1 : 0);

  const clearAllFilters = () => {
    setPriority(undefined);
    setStatusTid(undefined);
    setListTid(undefined);
    setResponsibleUid(undefined);
    setAuthorUid(undefined);
    setSearch('');
    setPage(1);
  };

  const tickets = ticketsQuery.data?.data ?? [];
  const meta = ticketsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / perPage) : 1;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const visibleTickets = useMemo(
    () => tickets.filter(tk => !hiddenStatusKeys.has(tk.statusKey)),
    [tickets, hiddenStatusKeys]
  );

  const sortedVisibleTickets = useMemo(() => {
    const cloned = [...visibleTickets];
    cloned.sort((a, b) => {
      const aValue =
        sortColumn === 'date'
          ? a.created
          : sortColumn === 'title'
          ? a.title ?? ''
          : sortColumn === 'body'
          ? a.body ?? ''
          : sortColumn === 'responsible'
          ? a.responsibleName ?? ''
          : sortColumn === 'author'
          ? a.authorName ?? ''
          : sortColumn === 'priority'
          ? a.priority ?? ''
          : a.status ?? '';
      const bValue =
        sortColumn === 'date'
          ? b.created
          : sortColumn === 'title'
          ? b.title ?? ''
          : sortColumn === 'body'
          ? b.body ?? ''
          : sortColumn === 'responsible'
          ? b.responsibleName ?? ''
          : sortColumn === 'author'
          ? b.authorName ?? ''
          : sortColumn === 'priority'
          ? b.priority ?? ''
          : b.status ?? '';
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const compare = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? compare : -compare;
    });
    return cloned;
  }, [visibleTickets, sortColumn, sortDirection]);

  const priorityGroups = useMemo(() => {
    const order: string[] = [];
    const groups = new Map<string, { key: string; label: string; rows: typeof visibleTickets }>();
    for (const tk of sortedVisibleTickets) {
      const key = tk.priorityKey || 'other';
      if (!groups.has(key)) {
        order.push(key);
        groups.set(key, { key, label: tk.priority || key, rows: [] });
      }
      groups.get(key)!.rows.push(tk);
    }
    return order.map(k => groups.get(k)!);
  }, [sortedVisibleTickets]);

  const handleSort = (column: 'date' | 'title' | 'body' | 'responsible' | 'author' | 'priority' | 'status') => {
    const next = toggleSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const allStatuses = filtersQuery.data?.statuses ?? [];
  const availableResponsibles = filtersQuery.data?.responsibles ?? [];

  useEffect(() => {
    if (!responsibleUid) return;
    const responsibleStillAvailable = availableResponsibles.some((u) => String(u.uid) === responsibleUid);
    if (!responsibleStillAvailable) {
      setResponsibleUid(undefined);
      setPage(1);
    }
  }, [responsibleUid, availableResponsibles]);

  const toggleHideStatus = (key: string) => {
    setHiddenStatusKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const showAllStatuses = () => setHiddenStatusKeys(new Set());
  const allShown = hiddenStatusKeys.size === 0;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">
            <Link to={adminRoutes.dashboard} className="hover:underline">{t('nav.console', 'Console')}</Link>
            {' › '}
            <span className="text-gray-700">{t('tickets.breadcrumb', 'Support Tickets')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
            {t('tickets.title', 'Support Tickets')}
          </h1>
        </div>
        <Button
          size="sm"
          className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 rounded-lg"
          onClick={() => navigate(adminRoutes.createTicket)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('tickets.create', 'Create Ticket')}
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setTab('tickets'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              tab === 'tickets' ? 'bg-[#0d0e0e] text-white border-[#0d0e0e]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t('tickets.tabs.tickets', 'Tickets')}
          </button>
          <button
            type="button"
            onClick={() => { setTab('chronological'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              tab === 'chronological' ? 'bg-[#0d0e0e] text-white border-[#0d0e0e]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t('tickets.tabs.chronological', 'Chronological')}
          </button>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('tickets.searchPlaceholder', 'Search ticket...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters card */}
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Priority */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('tickets.filters.priority', 'Priority')}
            </div>
            <div className="space-y-2">
              {(filtersQuery.data?.priorities ?? []).map(p => {
                const dot = PRIORITY_DOT[p.key] ?? '#9ca3af';
                const active = priority === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => { setPriority(active ? undefined : p.key); setPage(1); }}
                    className={`flex items-center gap-2 text-sm w-full text-left transition-colors ${active ? 'font-semibold text-[#0d0e0e]' : 'text-gray-700 hover:text-[#0d0e0e]'}`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                    <span className="flex-1">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('tickets.filters.status', 'Status')}
            </div>
            <div className="space-y-2">
              {(filtersQuery.data?.statuses ?? []).map(s => {
                const active = statusTid === String(s.tid);
                return (
                  <button
                    key={s.tid}
                    type="button"
                    onClick={() => { setStatusTid(active ? undefined : String(s.tid)); setPage(1); }}
                    className={`flex items-center justify-between gap-2 text-sm w-full text-left transition-colors ${active ? 'font-semibold text-[#0d0e0e]' : 'text-gray-700 hover:text-[#0d0e0e]'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: active ? '#0d0e0e' : '#9ca3af' }} />
                      <span>{s.label}</span>
                    </span>
                    <span className="text-xs text-gray-400">{s.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lists */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('tickets.filters.lists', 'Lists')}
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {(filtersQuery.data?.lists ?? []).map(l => {
                const active = listTid === String(l.tid);
                return (
                  <button
                    key={l.tid}
                    type="button"
                    onClick={() => { setListTid(active ? undefined : String(l.tid)); setPage(1); }}
                    className={`block text-sm w-full text-left transition-colors ${active ? 'font-semibold text-[#0d0e0e]' : 'text-gray-700 hover:text-[#0d0e0e]'}`}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsible */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('tickets.filters.responsible', 'Responsible')}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableResponsibles.map(u => {
                const active = responsibleUid === String(u.uid);
                return (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => { setResponsibleUid(active ? undefined : String(u.uid)); setPage(1); }}
                    className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-xs transition-colors ${
                      active ? 'bg-pink-50 border-pink-300 text-pink-900' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Initials name={u.name} color={u.colorSeed} size={6} />
                    <span className="truncate max-w-[120px]">{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Author (Orientation) */}
        <div className="pt-4 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('tickets.filters.orientation', 'Orientation')}
          </div>
          <div className="flex flex-wrap gap-2">
            {(filtersQuery.data?.authors ?? []).map(u => {
              const active = authorUid === String(u.uid);
              return (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => { setAuthorUid(active ? undefined : String(u.uid)); setPage(1); }}
                  className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-xs transition-colors ${
                    active ? 'bg-pink-50 border-pink-300 text-pink-900' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Initials name={u.name} color={u.colorSeed} size={6} />
                  <span className="truncate max-w-[120px]">{u.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active filter summary chip row */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 -mt-2">
          <span className="text-xs text-gray-500">
            {t('tickets.filters.activeCount', '{{count}} active filter(s)', { count: activeFilterCount })}
          </span>
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs text-gray-700 hover:text-[#0d0e0e] underline"
          >
            <X className="h-3 w-3" />
            {t('tickets.filters.clearAll', 'Clear all')}
          </button>
        </div>
      )}

      {/* Results */}
      <>
          {tab === 'chronological' && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('tickets.chronoHeader', 'All — Sorted by Date (Newest First)')}
            </div>
          )}

          {/* Show / Hide status toggles */}
          {allStatuses.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
                {t('tickets.showHide.label', 'Show / Hide')}
              </span>
              <button
                type="button"
                onClick={showAllStatuses}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  allShown ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t('tickets.showHide.showAll', 'Show all')}
              </button>
              {allStatuses.map(s => {
                const hidden = hiddenStatusKeys.has(s.key);
                return (
                  <button
                    key={s.tid}
                    type="button"
                    onClick={() => toggleHideStatus(s.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      hidden ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t('tickets.showHide.hide', 'Hide')} {s.label}
                  </button>
                );
              })}
            </div>
          )}

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <SortableTableHead column="date" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.date', 'Date')}</SortableTableHead>
                  <SortableTableHead column="title" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.title', 'Title')}</SortableTableHead>
                  <SortableTableHead column="body" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.bodyText', 'Body text')}</SortableTableHead>
                  <SortableTableHead column="responsible" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.responsible', 'Responsible')}</SortableTableHead>
                  <SortableTableHead column="author" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.author', 'Author')}</SortableTableHead>
                  <SortableTableHead column="priority" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.priority', 'Priority')}</SortableTableHead>
                  <SortableTableHead column="status" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.status', 'Status')}</SortableTableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">{t('common.loading', 'Loading…')}</TableCell>
                  </TableRow>
                ) : visibleTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">{t('tickets.noResults', 'No tickets found.')}</TableCell>
                  </TableRow>
                ) : tab === 'tickets' ? (
                  priorityGroups.flatMap(group => {
                    const groupDot = PRIORITY_DOT[group.key] ?? '#9ca3af';
                    return [
                      <TableRow key={`group-${group.key}`} className="bg-gray-50/60 hover:bg-gray-50/60">
                        <TableCell colSpan={8} className="py-2.5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#0d0e0e]">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: groupDot }} />
                            <span>{group.label}</span>
                            <span className="text-xs text-gray-500 font-normal">
                              {t('tickets.groupCount', '{{count}} tickets', { count: group.rows.length })}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>,
                      ...group.rows.map(tk => renderTicketRow(tk, t, {
                      onEdit: handleEdit,
                      onDone: handleMarkDone,
                      busy: isUpdating && updatingNid === tk.nid,
                    })),
                    ];
                  })
                ) : (
                  sortedVisibleTickets.map(tk => renderTicketRow(tk, t, {
                    onEdit: handleEdit,
                    onDone: handleMarkDone,
                    busy: isUpdating && updatingNid === tk.nid,
                  }))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {t('tickets.showing', 'Showing {{from}}–{{to}} of {{total}} tickets', { from, to, total })}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" /> {t('common.prev', 'Prev')}
              </Button>
              <span className="text-sm text-gray-700 px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                {t('common.next', 'Next')} <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="hidden sm:flex items-center gap-2 ml-3">
                <span className="text-sm text-gray-500">{t('common.show', 'Show')}</span>
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                  className="border border-gray-200 rounded-lg text-sm px-2 py-1"
                >
                  {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-sm text-gray-500">{t('common.perPage', 'per page')}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

type TicketRowData = {
  nid: number;
  created: number;
  title: string;
  listName?: string | null;
  body: string;
  responsibleName?: string | null;
  authorName: string;
  priority: string;
  priorityKey: string;
  status: string;
  statusKey: string;
};

function renderTicketRow(
  tk: TicketRowData,
  t: (key: string, fallback: string) => string,
  handlers: { onEdit: (nid: number) => void; onDone: (nid: number) => void; busy: boolean }
) {
  const dot = PRIORITY_DOT[tk.priorityKey] ?? '#9ca3af';
  const statusCls = STATUS_BADGE[tk.statusKey] ?? 'bg-gray-50 text-gray-700 border-gray-200';
  const isDone = tk.statusKey === 'done';
  return (
    <TableRow key={tk.nid} className="hover:bg-gray-50">
      <TableCell className="text-gray-600 text-xs whitespace-nowrap">{formatDate(tk.created)}</TableCell>
      <TableCell className="font-medium text-[#0d0e0e] max-w-[220px]">
        <div className="truncate">{tk.title}</div>
        {tk.listName && (
          <div className="text-xs text-gray-400 mt-0.5">{tk.listName}</div>
        )}
      </TableCell>
      <TableCell className="text-gray-600 text-sm max-w-[320px]">
        <div className="line-clamp-2">{tk.body}</div>
      </TableCell>
      <TableCell>
        {tk.responsibleName ? (
          <span className="inline-flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-gray-700">{tk.responsibleName}</span>
          </span>
        ) : <span className="text-gray-400 text-xs">—</span>}
      </TableCell>
      <TableCell className="text-gray-700 text-xs">{tk.authorName}</TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
          {tk.priority}
        </span>
      </TableCell>
      <TableCell>
        <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded border ${statusCls}`}>
          {tk.status}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handlers.onEdit(tk.nid)}
            disabled={handlers.busy}
          >
            {t('tickets.actions.edit', 'Edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handlers.onDone(tk.nid)}
            disabled={handlers.busy || isDone}
          >
            {t('tickets.actions.done', 'Done')}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
