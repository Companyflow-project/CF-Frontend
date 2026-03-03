import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { PageShell } from '@/components/layout/page-shell';
import { EmployeeStatsTable } from '../components/employee-stats-table';
import { EmployeeStatsModal } from '../components/employee-stats-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Search, ArrowUpDown, ArrowDownWideNarrow } from 'lucide-react';
import { employeesRoutes } from '../routes';
import { employeesApi } from '../api';
import { Employee, EmployeeSummaryStat, EmployeePageViewStat } from '@/types/models';
import { companiesApi, type LicenseUsage } from '@/features/companies/api';
import { useAuth } from '@/context/auth-context';

export const EmployeeStatsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : undefined;
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{
    name: string;
    pageViews: number;
    messages: number;
    lastVisit: string | null;
  } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingModalStats, setIsFetchingModalStats] = useState(false);
  const [modalStats, setModalStats] = useState<EmployeePageViewStat[]>([]);

  const [licenseUsage, setLicenseUsage] = useState<LicenseUsage | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchEmployeeAndStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const [employeeData, statsData] = await Promise.all([
          employeesApi.getEmployee(id).catch(() => null),
          employeesApi.getEmployeeStatistics(id),
        ]);

        if (!isMounted) return;

        setEmployee(employeeData);
        setStatistics({
          name: statsData.name,
          pageViews: statsData.pageViews,
          messages: statsData.messages,
          lastVisit: statsData.lastVisit,
        });
      } catch (err) {
        if (!isMounted) return;

        console.error('Failed to fetch employee statistics:', err);

        if (err instanceof AxiosError) {
          const status = err.response?.status;
          if (status === 404) {
            setError('employee not found');
          } else if (status === 400) {
            setError('invalid employee id');
          } else {
            setError(`Error: ${err.message}`);
          }
        } else {
          setError('Error: Failed to load employee statistics');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEmployeeAndStats();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!companyId) return;

    let isMounted = true;

    const fetchLicenseUsage = async () => {
      try {
        const usage = await companiesApi.getLicenseUsage(companyId);
        if (!isMounted) return;
        setLicenseUsage(usage);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('failed to load license usage', err);
      }
    };

    void fetchLicenseUsage();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const handleViewStats = async (employeeId: string) => {
    try {
      setIsFetchingModalStats(true);
      const data = await employeesApi.listEmployeePageViewStats(employeeId);
      setModalStats(data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch page views:', err);
      // Optional: show a toast error
    } finally {
      setIsFetchingModalStats(false);
    }
  };

  // Mock stats for the table using the actual employee data
  const stats: EmployeeSummaryStat[] = useMemo(() => {
    const name = statistics?.name || employee?.name;
    if (!name) return [];

    return [
      {
        employeeId: id || '',
        name: name,
        pageViews: statistics?.pageViews ?? 0,
        lastVisitAt: statistics?.lastVisit ?? employee?.recentVisitAt ?? null,
        messagesCount: statistics?.messages ?? employee?.messagesCount ?? 0,
      }
    ];
  }, [employee, statistics, id]);

  const [sortField, setSortField] = useState<'name' | 'pageViews' | 'lastVisit' | 'messagesCount'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredStats = useMemo(() => {
    return stats.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [stats, search]);

  const sortedStats = useMemo(() => {
    return [...filteredStats].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'pageViews') {
        cmp = (a.pageViews ?? 0) - (b.pageViews ?? 0);
      } else if (sortField === 'lastVisit') {
        cmp = (a.lastVisitAt ?? '').localeCompare(b.lastVisitAt ?? '');
      } else if (sortField === 'messagesCount') {
        cmp = (a.messagesCount ?? 0) - (b.messagesCount ?? 0);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredStats, sortField, sortDirection]);

  const employeeName = statistics?.name || employee?.name || (loading ? 'Loading...' : 'Employee');

  const licensesInSubscription = licenseUsage?.licensesInSubscription ?? 0;
  const licensesUsed = licenseUsage?.licensesUsed ?? 0;
  const smsMessagesUsed = licenseUsage?.smsMessagesUsed ?? 0;
  const licensesLeft = Math.max(licensesInSubscription - licensesUsed, 0);

  return (
    <PageShell
      sidebar={
        <div className="space-y-4">
          <Card className="bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_12px_30px_rgba(15,23,42,0.08)] rounded-[12px]">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[#0f172a]">License usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex justify-between items-center py-2 border-b border-dashed border-[rgba(88,172,146,0.5)]">
                <span className="text-sm text-[#0f172a]">Licenses in subscription</span>
                <span className="text-sm font-bold text-[#0f172a]">{licensesInSubscription}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-[rgba(88,172,146,0.5)]">
                <span className="text-sm text-[#0f172a]">Licenses used</span>
                <span className="text-sm font-bold text-[#0f172a]">{licensesUsed}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-[rgba(88,172,146,0.5)]">
                <span className="text-sm text-[#0f172a]">Licenses left</span>
                <span className="text-sm font-bold text-[#0f172a]">{licensesLeft}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#0f172a]">SMS messages used</span>
                <span className="text-sm font-bold text-[#0f172a]">{smsMessagesUsed}</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-2 justify-end">
              <Button variant="outline" className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] rounded-[10px]">
                More licenses
              </Button>
              <Button variant="outline" className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] rounded-[10px]">
                Manage SMS
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_12px_30px_rgba(15,23,42,0.08)] rounded-[12px]">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[#0f172a]">Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Company settings', route: '/account' },
                { label: 'Employment types', route: '/account/employment-types' },
                { label: 'Departments', route: '/account/departments' },
                { label: 'Import CSV', route: '#' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.route !== '#' && navigate(item.route)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[10px] border border-[rgba(88,172,146,0.5)] text-left hover:bg-[#f0f7f5] transition-colors"
                >
                  <span className="text-sm text-[#0d0e0e]">{item.label}</span>
                  <span className="text-base leading-[1] text-[#1d1f1f]">⇢</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(employeesRoutes.list)}
          className="bg-white border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[10px] px-3.5 py-[9px] h-auto shadow-[0_6px_14px_rgba(15,23,42,0.05)] flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-semibold text-[13.3px]">Back</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0b0c0c]">
          Employee Statistics - {employeeName}
        </h1>
      </div>

      {error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">
            {error}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
            <div className="text-sm text-[#0d0e0e] max-w-3xl">
              <p className="text-sm">
                <span className="font-bold">Help.</span>{' '}
                See employee activities like when they last visited the employee handbook and what pages they viewed.
              </p>
            </div>
          </div>

          <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] flex flex-col overflow-hidden">
            <div className="bg-[#f2f7f5] border border-[#d6e8e1] rounded-[16px] px-4 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 m-0">
              <div className="relative w-full lg:max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a85]" />
                <Input
                  placeholder="Search employees (name, email, phone)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 rounded-[999px] border border-[#c8d8d3] bg-white text-sm"
                />
              </div>
              <Button
                onClick={() => navigate(employeesRoutes.statistics)}
                className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] shadow-[0_10px_20px_rgba(23,102,79,0.35)] lg:ml-auto"
              >
                View All Employees
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
                      const fields: typeof sortField[] = ['name', 'pageViews', 'lastVisit', 'messagesCount'];
                      const next = fields[(fields.indexOf(sortField) + 1) % fields.length];
                      setSortField(next);
                    }}
                    className="border-[rgba(15,23,42,0.18)] text-[#242727] rounded-[10px] px-4 py-[9px] h-auto bg-white shadow-[0_6px_14px_rgba(15,23,42,0.05)]"
                  >
                    {sortField === 'name' ? 'Name' : sortField === 'pageViews' ? 'Page Views' : sortField === 'lastVisit' ? 'Last Visit' : 'Messages'}
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
                    onClick={() => { setSortField('name'); setSortDirection('asc'); }}
                    className="h-9 w-9 text-[#1a5948] rounded-full bg-white shadow-[0_6px_14px_rgba(28,91,72,0.25)]"
                  >
                    <ArrowDownWideNarrow className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="border-[rgba(88,172,146,0.5)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] bg-white"
                >
                  Send Follow Up
                </Button>
              </div>

              <div className="min-h-0 overflow-auto">
                <EmployeeStatsTable
                  stats={sortedStats}
                  selectedIds={selectedIds}
                  onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  onSelectAll={(selected) => setSelectedIds(selected ? sortedStats.map(s => s.employeeId) : [])}
                  onViewStats={handleViewStats}
                  onSendMessage={(id) => navigate(employeesRoutes.messageLogsDetail(id))}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <EmployeeStatsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        stats={modalStats}
        employeeName={employeeName}
        onSendFollowUp={() => console.log('Send follow up for', employeeName)}
      />

      {isFetchingModalStats && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">Loading stats...</div>
        </div>
      )}
    </PageShell>
  );
};

