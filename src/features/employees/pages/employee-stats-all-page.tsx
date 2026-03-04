import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { HelpBanner } from '@/components/common/help-banner';
import { EmployeeStatsTable } from '../components/employee-stats-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Search, ArrowUpDown, ArrowDownWideNarrow } from 'lucide-react';
import { employeesRoutes } from '../routes';
import { accountRoutes } from '@/features/account/routes';
import { contactsRoutes } from '@/features/contacts/routes';
import { EmployeeSummaryStat } from '@/types/models';
import { employeesApi } from '../api';
import { companiesApi, type LicenseUsage } from '@/features/companies/api';
import { useAuth } from '@/context/auth-context';

export const EmployeeStatsAllPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : undefined;
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'pageViews' | 'lastVisit' | 'messagesCount'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [stats, setStats] = useState<EmployeeSummaryStat[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [licenseUsage, setLicenseUsage] = useState<LicenseUsage | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsResponse, licenseResponse] = await Promise.all([
          employeesApi.listEmployeeStats({
            companyId: companyId ? String(companyId) : undefined,
            page: 1,
            limit: 100,
          }),
          companyId ? companiesApi.getLicenseUsage(companyId) : Promise.resolve<LicenseUsage | null>(null),
        ]);

        if (!isMounted) return;

        setStats(statsResponse);
        if (licenseResponse) {
          setLicenseUsage(licenseResponse);
        }
      } catch (err) {
        if (!isMounted) return;
        // eslint-disable-next-line no-console
        console.error('failed to load employee statistics', err);
        setError('failed to load employee statistics');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (companyId) {
      void fetchData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const filteredStats = useMemo(() => {
    return stats.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [stats, search]);

  const sortedStats = useMemo(() => {
    return [...filteredStats].sort((a, b) => {
      // Current user (admin/owner viewing the page) always stays at the top.
      const aIsSelf = !!user?.id && a.employeeId === user.id;
      const bIsSelf = !!user?.id && b.employeeId === user.id;
      if (aIsSelf && !bIsSelf) return -1;
      if (!aIsSelf && bIsSelf) return 1;

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
  }, [filteredStats, sortField, sortDirection, user?.id]);

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
            <CardContent className="space-y-2 px-6 pb-5">
              {([
                { label: 'Company settings', route: accountRoutes.editCompanyProfile },
                { label: 'Employment types', route: accountRoutes.employmentTypes },
                { label: 'Departments', route: accountRoutes.departments },
                { label: 'Import CSV', route: `${contactsRoutes.list}?open=import` },
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
      }
    >
          <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(employeesRoutes.list)}
          className="bg-white border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[10px] px-3 py-2 h-auto flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-[#0f172a]">
          Employee Statistics - All
        </h1>
      </div>

          <HelpBanner
        title="Help."
        description="See employee activities like when they last visited the employee handbook and what pages they viewed for all employees."
      />

          <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] mb-6">
        <div className="p-4 bg-[#f2f7f5] rounded-t-[22px] border-b border-[#d6e8e1] flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a85]" />
            <Input
              placeholder="Search employees (name, email, phone)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-[999px] border border-[#c8d8d3] bg-white text-sm"
            />
          </div>
        </div>

        <div className="p-6">
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
              className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-6 py-2 h-auto"
              onClick={() => navigate(employeesRoutes.messageLogs)}
            >
              Send Follow Up
            </Button>
          </div>

          {error ? (
            <div className="text-sm text-red-600">
              {error}
            </div>
          ) : (
            <EmployeeStatsTable
              stats={sortedStats}
              selectedIds={selectedIds}
              onSelect={(id) =>
                setSelectedIds((prev) =>
                  prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                )
              }
              onSelectAll={(selected) =>
                setSelectedIds(selected ? sortedStats.map((s) => s.employeeId) : [])
              }
              onViewStats={(id) => navigate(employeesRoutes.statisticsDetail(id))}
              onSendMessage={(id) => navigate(employeesRoutes.messageLogsDetail(id))}
            />
          )}
        </div>
      </Card>
    </PageShell>
  );
};

