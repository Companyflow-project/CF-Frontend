import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TrendingUp, Globe, Search, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useKeyFigures, useKeyFiguresTraffic, useKeyFiguresKeywords } from '../hooks';
import { adminRoutes } from '../routes';

type Tab = 'overview' | 'traffic' | 'keywords' | null;

function formatTime(unix: number | null): string {
  if (!unix) return '—';
  const now = Date.now() / 1000;
  const diff = now - unix;
  const d = 86400;
  if (diff < d) return 'Today';
  if (diff < 2 * d) return '1 day';
  if (diff < 7 * d) return `${Math.floor(diff / d)} days`;
  if (diff < 30 * d) return `${Math.floor(diff / (7 * d))} weeks`;
  if (diff < 365 * d) return `${Math.floor(diff / (30 * d))} months`;
  return `${Math.floor(diff / (365 * d))} years`;
}

function formatDate(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' —');
}

function isStale(unix: number | null): boolean {
  if (!unix) return false;
  const sixMonths = 6 * 30 * 86400;
  return (Date.now() / 1000 - unix) > sixMonths;
}

// ─── Landing Page ────────────────────────────────────────────────────────────
const KeyFiguresLanding: React.FC = () => {
  const { t } = useTranslation('admin');
  const [helpOpen, setHelpOpen] = useState(true);

  const cards = [
    { tab: 'overview', icon: TrendingUp, title: t('keyFigures.cards.overview', 'Key Figures'), desc: t('keyFigures.cards.overviewDesc', 'Key figures for all companies') },
    { tab: 'traffic', icon: Globe, title: t('keyFigures.cards.traffic', 'Traffic'), desc: t('keyFigures.cards.trafficDesc', 'Traffic in the past 24 hours') },
    { tab: 'keywords', icon: Search, title: t('keyFigures.cards.keywords', 'Keywords'), desc: t('keyFigures.cards.keywordsDesc', 'What employees were looking for') },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">{t('nav.console', 'Console')}</Link>
          {' › '}
          <span className="text-gray-700">{t('keyFigures.title', 'Key Figures')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
          {t('keyFigures.title', 'Key Figures')}
        </h1>
      </div>

      {/* Help */}
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
        <button
          type="button"
          onClick={() => setHelpOpen(o => !o)}
          className="flex items-center gap-1 text-sm font-semibold text-[#0d0e0e]"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${helpOpen ? '' : '-rotate-90'}`} />
          {t('keyFigures.help', 'Help')}
        </button>
        {helpOpen && (
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p>{t('keyFigures.helpIntro', 'The functions are:')}</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" /><span>{t('keyFigures.helpKeyFigures', 'Key figures — company licenses, usage and latest access')}</span></li>
              <li className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" /><span>{t('keyFigures.helpTraffic', 'Traffic — user usage in recent days')}</span></li>
              <li className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" /><span>{t('keyFigures.helpKeywords', 'Keywords — the things users searched for in the handbook')}</span></li>
            </ul>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {cards.map(({ tab, icon: Icon, title, desc }) => (
          <Link
            key={tab}
            to={`${adminRoutes.keyFigures}?tab=${tab}`}
            className="border border-gray-200 rounded-xl p-6 hover:border-[#0d0e0e] hover:shadow-sm transition-all"
          >
            <Icon className="h-8 w-8 text-[#0d0e0e] mb-3" />
            <h3 className="font-semibold text-[#0d0e0e]">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ─── Key Figures Overview Tab ───────────────────────────────────────────────
const OverviewTab: React.FC = () => {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [helpOpen, setHelpOpen] = useState(true);
  const { data, isLoading } = useKeyFigures({ page, limit: perPage });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / perPage) : 1;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="space-y-6">
      {/* Help */}
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
        <button
          type="button"
          onClick={() => setHelpOpen(o => !o)}
          className="flex items-center gap-1 text-sm font-semibold text-[#0d0e0e]"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${helpOpen ? '' : '-rotate-90'}`} />
          {t('keyFigures.help', 'Help')}
        </button>
        {helpOpen && (
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <p>{t('keyFigures.overviewHelp', 'The overview shows all companies that are registered as customers. The weird ones are pink, their weirdness is highlighted. The columns show:')}</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" /><span>{t('keyFigures.col1', 'Number of licenses, employees and percentage utilized. Less than 25% utilized is odd.')}</span></li>
              <li className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" /><span>{t('keyFigures.col2', 'Latest user access (all users). Older than 6 months is weird.')}</span></li>
              <li className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" /><span>{t('keyFigures.col3', 'Latest edit of content. Older than 6 months is weird.')}</span></li>
              <li className="flex items-start gap-2"><span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" /><span>{t('keyFigures.col4', 'Release status. Either or is not considered odd.')}</span></li>
            </ul>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.business', 'Business')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.licenses', 'Licenses')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.used', 'Used')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.exploitation', 'Exploitation')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.access', 'Access')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.editing', 'Editing Content')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.published', 'Published')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">{t('common.loading', 'Loading…')}</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">{t('keyFigures.empty', 'No companies.')}</TableCell></TableRow>
              ) : (
                rows.map((r) => {
                  const overUtil = r.exploitationPct > 100;
                  const underUtil = r.licenses > 0 && r.exploitationPct < 25;
                  const barColor = overUtil ? 'bg-red-500' : underUtil ? 'bg-red-500' : 'bg-green-500';
                  const pctColor = overUtil ? 'text-red-600 font-semibold' : underUtil ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold';
                  const barWidth = Math.min(r.exploitationPct, 100);
                  const accessStale = isStale(r.lastAccess);
                  const editStale = isStale(r.lastEdited);
                  const flagged = r.flagged === 'pink';

                  return (
                    <TableRow key={r.nid} className={flagged ? 'bg-pink-50/50 hover:bg-pink-50' : 'hover:bg-gray-50'}>
                      <TableCell className="font-medium">
                        <Link
                          to={adminRoutes.companyDetail.replace(':id', String(r.nid))}
                          className="text-[#0d0e0e] hover:underline"
                        >
                          {r.business}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-700">{r.licenses}</TableCell>
                      <TableCell className="text-gray-700">{r.used}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div className={`h-full ${barColor}`} style={{ width: `${barWidth}%` }} />
                          </div>
                          <span className={`text-xs ${pctColor}`}>{r.exploitationPct}%</span>
                        </div>
                      </TableCell>
                      <TableCell className={accessStale ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {formatTime(r.lastAccess)}
                      </TableCell>
                      <TableCell className={editStale ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {formatTime(r.lastEdited)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded border ${r.published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {r.published ? t('keyFigures.yes', 'Yes') : t('keyFigures.no', 'No')}
                        </span>
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
            {t('keyFigures.showing', 'Showing {{from}}–{{to}} of {{total}} companies', { from, to, total })}
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
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="border border-gray-200 rounded-lg text-sm px-2 py-1">
                {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-500">{t('common.perPage', 'per page')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Traffic Tab ─────────────────────────────────────────────────────────────
const TrafficTab: React.FC = () => {
  const { t } = useTranslation('admin');
  const [period, setPeriod] = useState(1);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { data, isLoading } = useKeyFiguresTraffic({ page, limit: perPage, period: String(period) });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / perPage) : 1;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const periodLabel = period === 1 ? '1 day' : `${period - 1}–${period} days`;

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      administrator: 'bg-pink-50 text-pink-700 border-pink-200',
      company_admin: 'bg-amber-50 text-amber-700 border-amber-200',
      account_owner: 'bg-green-50 text-green-700 border-green-200',
      senior_employee: 'bg-blue-50 text-blue-700 border-blue-200',
      EMPLOYEE: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return map[role] ?? 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide sm:mr-2">{t('keyFigures.period', 'Period')}</span>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => { setPeriod(n); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border ${
                  period === n ? 'bg-[#0d0e0e] text-white border-[#0d0e0e]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {n === 1 ? t('keyFigures.period1day', '1 day') : t('keyFigures.periodDays', '{{from}}–{{to}} days', { from: n - 1, to: n })}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {periodLabel} — {t('keyFigures.userAccessLog', 'User Access Log')}
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">#</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.name', 'Name')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.business', 'Business')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.roles', 'Roles')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.lastAccess', 'Last Access')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">{t('common.loading', 'Loading…')}</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">{t('keyFigures.noTraffic', 'No users accessed in this period.')}</TableCell></TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow key={r.uid} className="hover:bg-gray-50">
                      <TableCell className="text-gray-400">{from + idx}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        <span className="text-green-700">{r.business || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {r.roles.map(role => (
                            <span key={role} className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${roleBadge(role)}`}>
                              {role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{formatDate(r.lastAccess)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {t('keyFigures.showingUsers', 'Showing {{from}}–{{to}} of {{total}} users', { from, to, total })}
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
                <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="border border-gray-200 rounded-lg text-sm px-2 py-1">
                  {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-sm text-gray-500">{t('common.perPage', 'per page')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Keywords Tab ────────────────────────────────────────────────────────────
const KeywordsTab: React.FC = () => {
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<'latest' | 'count' | 'word'>('latest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [search]);

  const sortParam = sort === 'latest' ? undefined : sort === 'count' ? 'count_desc' : 'word_asc';
  const { data, isLoading } = useKeyFiguresKeywords({ page, limit: perPage, search: debouncedSearch || undefined, sort: sortParam });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / perPage) : 1;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('keyFigures.searchKeywords', 'Search keywords...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as 'latest' | 'count' | 'word'); setPage(1); }}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2"
          >
            <option value="latest">{t('keyFigures.sortLatest', 'Sort: Latest search')}</option>
            <option value="count">{t('keyFigures.sortCount', 'Sort: Most searched')}</option>
            <option value="word">{t('keyFigures.sortWord', 'Sort: Word (A–Z)')}</option>
          </select>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t('keyFigures.allCompaniesKeywords', 'All Companies — Keyword Searches')}
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.word', 'Word')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.number', 'Number')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('keyFigures.columns.latestSearch', 'Latest search')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-8">{t('common.loading', 'Loading…')}</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-8">{t('keyFigures.noKeywords', 'No keywords found.')}</TableCell></TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.word} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-[#0d0e0e]">{r.word}</TableCell>
                      <TableCell>
                        <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${r.count > 1 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700'}`}>
                          {r.count}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{formatDate(r.latestSearch)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {t('keyFigures.showingKeywords', 'Showing {{from}}–{{to}} of {{total}} keywords', { from, to, total })}
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
                <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="border border-gray-200 rounded-lg text-sm px-2 py-1">
                  {[15, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-sm text-gray-500">{t('common.perPage', 'per page')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const AdminKeyFiguresPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab;
  const tab: Tab = tabParam && ['overview', 'traffic', 'keywords'].includes(tabParam) ? tabParam : null;

  if (!tab) return <KeyFiguresLanding />;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">{t('nav.console', 'Console')}</Link>
          {' › '}
          <Link to={adminRoutes.keyFigures} className="hover:underline">{t('keyFigures.title', 'Key Figures')}</Link>
          {' › '}
          <span className="text-gray-700">
            {tab === 'overview' ? t('keyFigures.checking', 'Checking Key Figures') : tab === 'traffic' ? t('keyFigures.cards.traffic', 'Traffic') : t('keyFigures.cards.keywords', 'Keywords')}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
          {t('keyFigures.title', 'Key Figures')}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { k: 'overview', l: t('keyFigures.cards.overview', 'Key Figures') },
          { k: 'traffic', l: t('keyFigures.cards.traffic', 'Traffic') },
          { k: 'keywords', l: t('keyFigures.cards.keywords', 'Keywords') },
        ].map(({ k, l }) => (
          <button
            key={k}
            type="button"
            onClick={() => setSearchParams({ tab: k })}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              tab === k ? 'bg-[#0d0e0e] text-white border-[#0d0e0e]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'traffic' && <TrafficTab />}
      {tab === 'keywords' && <KeywordsTab />}
    </div>
  );
};
