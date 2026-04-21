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
        <p className="text-gray-500">{t('dashboard.loading', 'Loading…')}</p>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">{t('dashboard.loadError', 'Failed to load dashboard.')}</p>
      </div>
    );
  }

  const { stats: _stats, latestCompanies, employeeTraffic, adminTraffic, recentActivities } = dashboard;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6 sm:space-y-8">
      {/* Subscription Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs sm:text-sm">
            <span className="text-green-600 font-medium">{t('dashboard.freeSampleActive', 'Free sample is active')}</span>
            {' '}{t('dashboard.for', 'for')} {user?.name ?? t('dashboard.adminFallback', 'Admin')}.
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" size="sm">
            {t('dashboard.viewInvoices', 'View Invoices')}
          </Button>
          <Button size="sm" className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90">
            {t('dashboard.createBusiness', 'Create a Business')}
          </Button>
        </div>
      </div>

      {/* Welcome + Title */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('dashboard.welcomeBack', 'Welcome back')}, {user?.name?.split(' ')[0] ?? t('dashboard.adminFallback', 'Admin')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e]">{t('dashboard.title', 'Control Panel')}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link to={adminRoutes.activity}>{t('dashboard.informationList', 'Information List')}</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link to={adminRoutes.keyFigures}>{t('dashboard.keyFigures', 'Key Figures')}</Link>
          </Button>
        </div>
      </div>

      {/* Top Cards Row — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Companies */}
        <div className="border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">{t('dashboard.cards.companies.title', 'Companies')}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('dashboard.cards.companies.desc', 'Searchable company overview and management.')}</p>
          </div>
          <Button className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg w-full sm:w-auto" asChild>
            <Link to={adminRoutes.companies}>{t('dashboard.cards.companies.cta', 'Go to Companies →')}</Link>
          </Button>
          <div className="space-y-2">
            <CardLink to={adminRoutes.createCompany} label={t('dashboard.cards.companies.createBusiness', 'Create a business')} icon="arrow" />
            <CardLink to={`${adminRoutes.companies}?view=sources`} label={t('dashboard.cards.companies.sources', 'Sources')} icon="arrow" />
          </div>
        </div>

        {/* Support Tickets */}
        <div className="border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">{t('dashboard.cards.tickets.title', 'Support Tickets')}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('dashboard.cards.tickets.desc', 'View and create support tickets for your customers.')}</p>
          </div>
          <Button className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg w-full sm:w-auto">
            {t('dashboard.cards.tickets.cta', 'Open Tickets →')}
          </Button>
          <div className="space-y-2">
            <CardLink to="/admin/tickets/create" label={t('dashboard.cards.tickets.create', 'Create new ticket')} icon="arrow" />
            <CardLink to="/admin/tickets/settings" label={t('dashboard.cards.tickets.settings', 'Ticket settings')} icon="arrow" />
          </div>
        </div>
      </div>

      {/* Bottom Cards Row — 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {/* CRM To-Do */}
        <div className="border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">{t('dashboard.cards.crm.title', 'CRM To-Do')}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('dashboard.cards.crm.desc', 'List of CRM activities and follow-ups.')}</p>
          </div>
          <Button className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg w-full sm:w-auto">
            {t('dashboard.cards.crm.cta', 'Open CRM →')}
          </Button>
          <CardLink to="/admin/crm/add" label={t('dashboard.cards.crm.add', 'Add activity')} icon="plus" />
        </div>

        {/* Newsletters */}
        <div className="border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">{t('dashboard.cards.newsletters.title', 'Newsletters')}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('dashboard.cards.newsletters.desc', 'View and create newsletters.')}</p>
          </div>
          <Button asChild className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg w-full sm:w-auto">
            <Link to={adminRoutes.newsletters}>
              {t('dashboard.cards.newsletters.cta', 'Open Newsletters →')}
            </Link>
          </Button>
          <CardLink to={adminRoutes.newsletterCreate} label={t('dashboard.cards.newsletters.create', 'Create newsletter')} icon="arrow" />
        </div>

        {/* Management Handbook */}
        <div className="border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 sm:col-span-2 md:col-span-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">{t('dashboard.cards.handbook.title', 'Management Handbook')}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('dashboard.cards.handbook.desc', 'Good advice for business leaders.')}</p>
          </div>
          <Button asChild className="bg-[#1a5948] text-white hover:bg-[#154a3c] rounded-lg w-full sm:w-auto">
            <Link to={adminRoutes.handbook}>
              {t('dashboard.cards.handbook.cta', 'Open Handbook →')}
            </Link>
          </Button>
          <CardLink to={adminRoutes.handbookTableOfContents} label={t('dashboard.cards.handbook.browse', 'Browse articles')} icon="arrow" />
        </div>
      </div>

      {/* Latest Companies */}
      <div className="border border-gray-200 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5">
          <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">{t('dashboard.latestCompanies', 'Latest Companies')}</h2>
          <Button variant="outline" size="sm" className="rounded-lg self-start sm:self-auto" asChild>
            <Link to={adminRoutes.companies}>{t('dashboard.viewAll', 'View All')}</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('dashboard.table.business', 'Business')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('dashboard.table.name', 'Name')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('dashboard.table.category', 'Category')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('dashboard.table.tel', 'Tel.')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('dashboard.table.created', 'Created')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    {t('dashboard.noCompaniesFound', 'No companies found.')}
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
      </div>

      {/* Traffic Tables — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Employees Traffic */}
        <div className="border border-gray-200 rounded-xl">
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">{t('dashboard.employeesTraffic', 'Employees Traffic')}</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('dashboard.table.daysAgo', 'Days Ago')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('dashboard.table.number', 'Number')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeTraffic.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-400 py-6">{t('dashboard.noData', 'No data')}</TableCell>
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
        </div>

        {/* Administrators Traffic */}
        <div className="border border-gray-200 rounded-xl">
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">{t('dashboard.administratorsTraffic', 'Administrators Traffic')}</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('dashboard.table.daysAgo', 'Days Ago')}</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('dashboard.table.number', 'Number')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminTraffic.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-400 py-6">{t('dashboard.noData', 'No data')}</TableCell>
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
      </div>

      {/* Recent Activities */}
      <div className="border border-gray-200 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5">
          <h2 className="text-base sm:text-lg font-bold text-[#0d0e0e]">{t('dashboard.recentActivities', 'Recent Activities')}</h2>
          <Button variant="outline" size="sm" className="rounded-lg self-start sm:self-auto">
            {t('dashboard.addActivity', '+ Add Activity')}
          </Button>
        </div>
        <div className="px-4 sm:px-6 pb-5 sm:pb-6">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('dashboard.noRecentActivities', 'No recent activities.')}</p>
          ) : (
            <div className="space-y-5">
              {recentActivities.map((a, i) => (
                <div key={`${a.timestamp}-${i}`} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2.5 h-2.5 mt-1.5 rounded-full bg-amber-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500">
                      <span>{formatRelativeTime(a.timestamp)}</span>
                      <span className="font-medium text-[#0d0e0e]">{a.companyName}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#0d0e0e] mt-0.5">{a.title}</p>
                    {a.description && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{a.description}</p>
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
