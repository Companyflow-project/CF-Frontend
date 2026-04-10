import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks';
import { useAdminDashboard } from '../hooks';
import { adminRoutes } from '../routes';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Check, ArrowRight, Plus } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function CategoryBadge({ category }: { category: string }) {
  if (!category) return null;
  const lower = category.toLowerCase();
  let cls = 'bg-gray-100 text-gray-700 border-gray-300';
  if (lower.includes('demo')) cls = 'bg-red-50 text-red-600 border-red-200';
  else if (lower.includes('free')) cls = 'bg-green-50 text-green-700 border-green-200';
  else if (lower === 'customer') cls = 'bg-green-50 text-green-700 border-green-200';
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded border ${cls}`}>
      {category}
    </span>
  );
}

/** Card link row — text on left, icon on right, bordered */
function CardLink({ to, label, icon }: { to: string; label: string; icon?: 'arrow' | 'plus' }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span>{label}</span>
      {icon === 'plus' ? (
        <Plus className="h-4 w-4 text-gray-400" />
      ) : (
        <ArrowRight className="h-4 w-4 text-gray-400" />
      )}
    </Link>
  );
}

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { user } = useAuth();
  const { data: dashboard, isLoading, isError } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">Failed to load dashboard.</p>
      </div>
    );
  }

  const { stats, latestCompanies, employeeTraffic, adminTraffic, recentActivities } = dashboard;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-8">
      {/* Subscription Banner */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm">
            <span className="text-green-600 font-medium">Free sample is active</span>
            {' '}for {user?.name ?? 'Admin'}.
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            View Invoices
          </Button>
          <Button size="sm" className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90">
            Create a Business
          </Button>
        </div>
      </div>

      {/* Welcome + Title */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}</p>
          <h1 className="text-3xl font-bold text-[#0d0e0e]">Control Panel</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link to={adminRoutes.activity}>Information List</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link to={adminRoutes.analytics}>Key Figures</Link>
          </Button>
        </div>
      </div>

      {/* Top Cards Row — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Companies */}
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#0d0e0e]">Companies</h2>
            <p className="text-sm text-gray-500 mt-1">Searchable company overview and management.</p>
          </div>
          <Button className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg" asChild>
            <Link to={adminRoutes.companies}>Go to Companies →</Link>
          </Button>
          <div className="space-y-2">
            <CardLink to={adminRoutes.createCompany} label="Create a business" icon="arrow" />
            <CardLink to={`${adminRoutes.companies}?view=sources`} label="Sources" icon="arrow" />
          </div>
        </div>

        {/* Support Tickets */}
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#0d0e0e]">Support Tickets</h2>
            <p className="text-sm text-gray-500 mt-1">View and create support tickets for your customers.</p>
          </div>
          <Button className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg">
            Open Tickets →
          </Button>
          <div className="space-y-2">
            <CardLink to="/admin/tickets/create" label="Create new ticket" icon="arrow" />
            <CardLink to="/admin/tickets/settings" label="Ticket settings" icon="arrow" />
          </div>
        </div>
      </div>

      {/* Bottom Cards Row — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CRM To-Do */}
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#0d0e0e]">CRM To-Do</h2>
            <p className="text-sm text-gray-500 mt-1">List of CRM activities and follow-ups.</p>
          </div>
          <Button className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg">
            Open CRM →
          </Button>
          <CardLink to="/admin/crm/add" label="Add activity" icon="plus" />
        </div>

        {/* Newsletters */}
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#0d0e0e]">Newsletters</h2>
            <p className="text-sm text-gray-500 mt-1">View and create newsletters.</p>
          </div>
          <Button className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg">
            Open Newsletters →
          </Button>
          <CardLink to="/admin/newsletters/create" label="Create newsletter" icon="arrow" />
        </div>

        {/* Management Handbook */}
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#0d0e0e]">Management Handbook</h2>
            <p className="text-sm text-gray-500 mt-1">Good advice for business leaders.</p>
          </div>
          <Button className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg">
            Open Handbook →
          </Button>
          <CardLink to="/admin/handbook/articles" label="Browse articles" icon="arrow" />
        </div>
      </div>

      {/* Latest Companies */}
      <div className="border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-bold text-[#0d0e0e]">Latest Companies</h2>
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link to={adminRoutes.companies}>View All</Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tel.</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No companies found.
                </TableCell>
              </TableRow>
            ) : (
              latestCompanies.map((c) => (
                <TableRow key={c.nid} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link
                      to={adminRoutes.companyDetail.replace(':id', String(c.nid))}
                      className="text-[#0d0e0e] hover:underline"
                    >
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-600">{c.contactName}</TableCell>
                  <TableCell>
                    <CategoryBadge category={c.category} />
                  </TableCell>
                  <TableCell className="text-gray-600">{c.telephone}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(c.created)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Traffic Tables — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees Traffic */}
        <div className="border border-gray-200 rounded-xl">
          <div className="px-6 py-5">
            <h2 className="text-lg font-bold text-[#0d0e0e]">Employees Traffic</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Ago</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeTraffic.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-gray-400 py-6">No data</TableCell>
                </TableRow>
              ) : (
                employeeTraffic.map((b) => (
                  <TableRow key={b.label}>
                    <TableCell className="text-gray-700">{b.label}</TableCell>
                    <TableCell className="text-gray-700">{b.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Administrators Traffic */}
        <div className="border border-gray-200 rounded-xl">
          <div className="px-6 py-5">
            <h2 className="text-lg font-bold text-[#0d0e0e]">Administrators Traffic</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Ago</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminTraffic.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-gray-400 py-6">No data</TableCell>
                </TableRow>
              ) : (
                adminTraffic.map((b) => (
                  <TableRow key={b.label}>
                    <TableCell className="text-gray-700">{b.label}</TableCell>
                    <TableCell className="text-gray-700">{b.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-bold text-[#0d0e0e]">Recent Activities</h2>
          <Button variant="outline" size="sm" className="rounded-lg">
            + Add Activity
          </Button>
        </div>
        <div className="px-6 pb-6">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No recent activities.</p>
          ) : (
            <div className="space-y-5">
              {recentActivities.map((a, i) => (
                <div key={`${a.timestamp}-${i}`} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2.5 h-2.5 mt-1.5 rounded-full bg-amber-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatRelativeTime(a.timestamp)}</span>
                      <span className="font-medium text-[#0d0e0e]">{a.companyName}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#0d0e0e] mt-0.5">{a.title}</p>
                    {a.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{a.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
