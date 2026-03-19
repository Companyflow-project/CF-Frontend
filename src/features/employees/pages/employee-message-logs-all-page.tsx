import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { EmployeeMessageLogsTable } from '../components/employee-message-logs-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Search,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Send,
} from 'lucide-react';
import { employeesRoutes } from '../routes';
import { employeesApi } from '../api';
import { useEmployees } from '../hooks';
import type { EmployeeMessageLog } from '@/types/models';

export const EmployeeMessageLogsAllPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('employees');
  const { t: tCommon } = useTranslation('common');
  const [search, setSearch] = useState('');
  const { data: employees } = useEmployees();

  const [logs, setLogs] = useState<EmployeeMessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [sortField, setSortField] = useState<'date' | 'name' | 'email'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      if (employees.length === 0) return;
      try {
        setLoading(true);
        setError(null);

        const results = await Promise.all(
          employees.map((emp) =>
            employeesApi
              .listEmployeeMessageLogs({ employeeId: emp.id, page: 1, limit: 50 })
              .then((res) => res.data)
              .catch(() => [] as EmployeeMessageLog[]),
          ),
        );

        if (!isMounted) return;
        setLogs(results.flat());
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to fetch all message logs:', err);
        setError('failedToLoad');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLogs();
    return () => { isMounted = false; };
  }, [employees]);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (log) =>
        log.name?.toLowerCase().includes(q) ||
        log.email?.toLowerCase().includes(q) ||
        log.message?.toLowerCase().includes(q),
    );
  }, [logs, search]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = (a.name ?? '').localeCompare(b.name ?? '');
      else if (sortField === 'email') cmp = (a.email ?? '').localeCompare(b.email ?? '');
      else cmp = (a.date ?? '').localeCompare(b.date ?? '');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredLogs, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / limit));
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedLogs.slice(start, start + limit);
  }, [sortedLogs, page, limit]);

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(employeesRoutes.list)}
          className="bg-white border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[10px] px-3 py-2 h-auto flex items-center gap-2 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          {tCommon('back')}
        </Button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0b0c0c] truncate">
          {t('messageLogs.titleAll')}
        </h1>
      </div>

      {/* Help banner */}
      <div className="mb-5 bg-[#fff9f0] rounded-[12px] border border-[#f59e0b] border-l-[5px] px-4 py-3">
        <p className="text-[13px] text-[#0d0e0e]">
          <span className="font-bold">{tCommon('help')}</span>{' '}
          {t('messageLogs.helpAll')}
        </p>
      </div>

      {/* Main card */}
      <Card className="bg-white border border-[#e5efea] rounded-[16px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] overflow-hidden">
        {/* Search bar */}
        <div className="bg-[#f2f7f5] border-b border-[#d6e8e1] px-4 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a85]" />
            <Input
              placeholder={t('messageLogs.searchAll')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-[999px] border border-[#c8d8d3] bg-white text-sm w-full"
            />
          </div>
        </div>

        <CardContent className="p-4 sm:p-5">
          {/* Sort bar + Send Follow Up */}
          <div className="flex flex-wrap items-center gap-3 justify-between pb-3 border-b border-dashed border-[#d5e7e1] mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[#0d0e0e]">{tCommon('sort')}</span>
              <Button
                variant="outline"
                size="sm"
                title={t('manage.cycleSortField')}
                onClick={() => {
                  const fields: typeof sortField[] = ['date', 'name', 'email'];
                  setSortField(fields[(fields.indexOf(sortField) + 1) % fields.length]);
                }}
                className="border-[rgba(15,23,42,0.18)] text-[#242727] rounded-[10px] px-3 py-2 h-auto bg-white shadow-[0_6px_14px_rgba(15,23,42,0.05)] text-[13px]"
              >
                {sortField === 'name' ? t('messageLogs.sortName') : sortField === 'email' ? t('messageLogs.sortEmail') : t('messageLogs.sortDate')}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('manage.toggleSortDir')}
                onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="h-8 w-8 text-[#707677] rounded-full bg-white shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('manage.resetSort')}
                onClick={() => { setSortField('date'); setSortDirection('desc'); }}
                className="h-8 w-8 text-[#1a5948] rounded-full bg-white shadow-[0_6px_14px_rgba(28,91,72,0.25)]"
              >
                <ArrowDownWideNarrow className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(employeesRoutes.statistics)}
              className="rounded-[999px] px-4 py-2 h-auto text-[13px] shadow-[0_8px_16px_rgba(13,94,67,0.3)] gap-1.5"
              style={{ backgroundColor: 'var(--cf-primary-btn, #2f946f)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
            >
              <Send className="h-3.5 w-3.5" />
              {t('messageLogs.sendFollowUp')}
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-0">
            {loading ? (
              <div className="py-12 text-center text-[#6b7280] text-sm">{t('messageLogs.loading')}</div>
            ) : error ? (
              <div className="py-12 text-center text-red-500 text-sm">{t('messageLogs.failedToLoad')}</div>
            ) : (
              <EmployeeMessageLogsTable logs={paginatedLogs} />
            )}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[8px] border-[#d6e8e1]"
              disabled={page === 1 || loading}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[8px] border-[#d6e8e1]"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => {
                const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-[#9ca3af] text-sm">...</span>}
                    <Button
                      variant={page === p ? 'default' : 'outline'}
                      className={`h-8 min-w-[32px] rounded-[8px] border-[#d6e8e1] text-[13px] ${
                        page === p
                          ? 'shadow-md'
                          : 'text-[#374151] hover:bg-[#f0f7f5]'
                      }`}
                      onClick={() => setPage(p)}
                      {...(page === p ? { style: { backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' } } : {})}
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                );
              })}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[8px] border-[#d6e8e1]"
              disabled={page === totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[8px] border-[#d6e8e1]"
              disabled={page === totalPages || loading}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
};
