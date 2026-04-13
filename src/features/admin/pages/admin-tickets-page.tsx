import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight, Plus, Ticket } from 'lucide-react';
import { useTicketFilters, useTickets } from '../hooks';
import { adminRoutes } from '../routes';

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
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const filtersQuery = useTicketFilters();
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

  const hasFilters = tab === 'chronological' || Boolean(priority || statusTid || listTid || responsibleUid || authorUid || debouncedSearch);
  const ticketsQuery = useTickets(params, hasFilters);

  const tickets = ticketsQuery.data?.data ?? [];
  const meta = ticketsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / perPage) : 1;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

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
        <Button size="sm" className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 rounded-lg">
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
              {(filtersQuery.data?.responsibles ?? []).map(u => {
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

      {/* Results */}
      {!hasFilters ? (
        <div className="border border-gray-200 rounded-xl py-16 px-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
            <Ticket className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-[#0d0e0e] mb-1">
            {t('tickets.empty.title', 'Select filters to view tickets')}
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            {t('tickets.empty.subtitle', 'Use the priority, status, list, and responsible filters above to narrow down your support tickets.')}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.date', 'Date')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.title', 'Title')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.bodyText', 'Body text')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.responsible', 'Responsible')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.author', 'Author')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.priority', 'Priority')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.status', 'Status')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('tickets.columns.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">{t('common.loading', 'Loading…')}</TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">{t('tickets.noResults', 'No tickets found.')}</TableCell>
                  </TableRow>
                ) : (
                  tickets.map(tk => {
                    const dot = PRIORITY_DOT[tk.priorityKey] ?? '#9ca3af';
                    const statusCls = STATUS_BADGE[tk.statusKey] ?? 'bg-gray-50 text-gray-700 border-gray-200';
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
                            <Button variant="outline" size="sm" className="h-7 text-xs">{t('tickets.actions.edit', 'Edit')}</Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs">{t('tickets.actions.view', 'View')}</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
      )}
    </div>
  );
};
