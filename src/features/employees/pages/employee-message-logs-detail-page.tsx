import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ChevronsRight
} from 'lucide-react';
import { employeesRoutes } from '../routes';
import { employeesApi } from '../api';
import type { Employee, EmployeeMessageLog } from '@/types/models';

export const EmployeeMessageLogsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [logs, setLogs] = useState<EmployeeMessageLog[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const fetchEmployeeAndLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const [empData, logsResponse] = await Promise.all([
          employeesApi.getEmployee(id).catch(() => null),
          employeesApi.listEmployeeMessageLogs({
            employeeId: id,
            page,
            limit,
          })
        ]);

        if (!isMounted) return;

        setEmployee(empData);
        if (logsResponse && logsResponse.data) {
          setLogs(logsResponse.data);
          setTotalPages(logsResponse.meta?.totalPages || 1);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to fetch message logs:', err);
        setError('Failed to load message logs');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEmployeeAndLogs();

    return () => {
      isMounted = false;
    };
  }, [id, page, limit]);

  const [sortField, setSortField] = useState<'name' | 'email' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredLogs = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];
    if (!search.trim()) return logs;
    return logs.filter(log =>
      (log.message?.toLowerCase().includes(search.toLowerCase())) ||
      (log.name?.toLowerCase().includes(search.toLowerCase())) ||
      (log.email?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [logs, search]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = (a.name ?? '').localeCompare(b.name ?? '');
      } else if (sortField === 'email') {
        cmp = (a.email ?? '').localeCompare(b.email ?? '');
      } else if (sortField === 'date') {
        cmp = (a.date ?? '').localeCompare(b.date ?? '');
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredLogs, sortField, sortDirection]);

  const employeeName = employee?.name || logs[0]?.name || 'Employee';

  return (
    <PageShell>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="bg-white border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[10px] px-3.5 py-[9px] h-auto shadow-[0_6px_14px_rgba(15,23,42,0.05)] flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-semibold text-[13.3px]">Back</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0b0c0c]">
          Employee Message Logs - {employeeName}
        </h1>
      </div>

      <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
        <div className="text-sm text-[#0d0e0e] max-w-3xl">
          <p className="text-sm">
            <span className="font-bold">Help.</span>{' '}
            See which messages have been sent to your employees and when. Click <span className="font-bold italic">View All Messages</span> to see all messages sent to all employees.
          </p>
        </div>
      </div>

      <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] flex flex-col overflow-hidden">
        <div className="bg-[#f2f7f5] border border-[#d6e8e1] rounded-[16px] px-4 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 m-0">
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a85]" />
            <Input
              placeholder="Search employee records"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-[10px] border border-[#c8d8d3] bg-white text-sm"
            />
          </div>
          <Button
            onClick={() => navigate(employeesRoutes.messageLogs)}
            className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[10px] px-5 py-[11px] h-auto text-[13.3px] shadow-[0_10px_20px_rgba(23,102,79,0.35)] lg:ml-auto"
          >
            View All Message Logs
          </Button>
        </div>

        <CardContent className="pt-6 flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 justify-between pb-4 border-b border-dashed border-[#d5e7e1] mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#0d0e0e]">Sort</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const fields: typeof sortField[] = ['date', 'name', 'email'];
                  const next = fields[(fields.indexOf(sortField) + 1) % fields.length];
                  setSortField(next);
                }}
                className="border-[rgba(15,23,42,0.18)] text-[#242727] rounded-[10px] px-4 py-[9px] h-auto bg-white shadow-[0_6px_14px_rgba(15,23,42,0.05)]"
              >
                {sortField === 'name' ? 'Name' : sortField === 'email' ? 'Email' : 'Date'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                className="h-9 w-9 text-[#707677] rounded-full bg-white shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSortField('date'); setSortDirection('desc'); }}
                className="h-9 w-9 text-[#1a5948] rounded-full bg-white shadow-[0_6px_14px_rgba(28,91,72,0.25)]"
              >
                <ArrowDownWideNarrow className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => id && navigate(employeesRoutes.followUp(id))}
              className="border-[rgba(88,172,146,0.5)] text-[#0d0e0e] rounded-[10px] px-5 py-[11px] h-auto text-[13.3px] bg-white shadow-[0_6px_14px_rgba(0,0,0,0.02)]"
            >
              Send Follow Up
            </Button>
          </div>

          <div className="min-h-0 overflow-auto">
            {loading && !logs.length ? (
              <div className="py-12 text-center text-gray-400">Loading messages...</div>
            ) : error ? (
              <div className="py-12 text-center text-red-400">{error}</div>
            ) : (
              <EmployeeMessageLogsTable logs={sortedLogs} />
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 pb-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-[10px] border-[#d6e8e1]"
              disabled={page === 1 || loading}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-[10px] border-[#d6e8e1]"
              disabled={page === 1 || loading}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => {
                const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                    <Button
                      variant={page === p ? 'default' : 'outline'}
                      className={`h-9 min-w-[36px] rounded-[10px] border-[#d6e8e1] ${page === p ? 'bg-[#3d997d] hover:bg-[#3d997d]/90 text-white shadow-md' : 'text-gray-600 hover:bg-[#f0f7f5]'
                        }`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                );
              })}

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-[10px] border-[#d6e8e1]"
              disabled={page === totalPages || loading}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-[10px] border-[#d6e8e1]"
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

