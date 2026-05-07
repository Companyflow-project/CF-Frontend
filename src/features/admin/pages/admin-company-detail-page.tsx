import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  FileText,
  Upload as UploadIcon,
  Pencil,
  Eye,
  RefreshCw,
  Trash2,
  Files as FilesIcon,
  BookOpen,
  Settings as SettingsIcon,
  Users as UsersIcon,
  CalendarPlus,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useAdminCompany, useDeleteCompany } from '../hooks';
import { adminRoutes } from '../routes';
import { handbookRoutes } from '@/features/handbook/routes';
import { employeesRoutes } from '@/features/employees/routes';
import { DeleteCompanyDialog } from '../components/delete-company-dialog';
import type { AdminCompanyDetail } from '../types';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

function formatRelativeFromUnix(
  unix: number | null | undefined,
  t: (k: string, fb: string, opts?: Record<string, unknown>) => string,
): string {
  if (!unix) return '—';
  const now = Date.now();
  const diffMs = now - unix * 1000;
  const day = 86400 * 1000;
  if (diffMs < day) return t('companyDashboard.today', 'today');
  const days = Math.floor(diffMs / day);
  if (days < 7) return t('companyDashboard.nDaysAgo', '{{count}} days ago', { count: days });
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1
      ? t('companyDashboard.oneWeekAgo', '1 week ago')
      : t('companyDashboard.nWeeksAgo', '{{count}} weeks ago', { count: weeks });
  }
  const months = Math.floor(days / 30);
  return months === 1
    ? t('companyDashboard.oneMonthAgo', '1 month ago')
    : t('companyDashboard.nMonthsAgo', '{{count}} months ago', { count: months });
}

function monthsRemaining(endIso: string | null | undefined): number | null {
  if (!endIso) return null;
  try {
    const end = new Date(endIso).getTime();
    const now = Date.now();
    if (end <= now) return 0;
    return Math.max(1, Math.floor((end - now) / (30 * 86400 * 1000)));
  } catch {
    return null;
  }
}

function getCountryFlag(code: string): string {
  if (!code) return '';
  const cc = code.toUpperCase();
  return [...cc].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
}

interface KvRowProps {
  label: string;
  children: React.ReactNode;
}
const KvRow: React.FC<KvRowProps> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-t border-gray-100 first:border-t-0">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-sm text-gray-900 text-right">{children}</div>
  </div>
);

interface SectionLabelProps {
  children: React.ReactNode;
  editHref?: string;
}
const SectionLabel: React.FC<SectionLabelProps> = ({ children, editHref }) => (
  <div className="flex items-center justify-between gap-2 px-4 sm:px-5 pt-4 pb-2">
    <div className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
      {children}
    </div>
    {editHref && (
      <Link
        to={editHref}
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#0d0e0e]"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Link>
    )}
  </div>
);

const PlainValue: React.FC<{ value: React.ReactNode }> = ({ value }) =>
  value === '' || value == null ? <span className="text-gray-400">—</span> : <>{value}</>;

const YesNo: React.FC<{ value: boolean | null | undefined }> = ({ value }) => {
  if (value == null) return <span className="text-gray-400">—</span>;
  return <span className="text-gray-900">{value ? 'Yes' : 'No'}</span>;
};

export const AdminCompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { data: company, isLoading, isError } = useAdminCompany(id) as {
    data: AdminCompanyDetail | undefined;
    isLoading: boolean;
    isError: boolean;
  };
  const deleteCompany = useDeleteCompany();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">{t('companyView.loading', 'Loading…')}</p>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">{t('companyView.loadError', 'Failed to load company.')}</p>
      </div>
    );
  }

  const primaryContact = company.contacts.find((c) => c.isPrimary) ?? company.contacts[0];
  const editPath = adminRoutes.companyEdit.replace(':id', id ?? '');
  const remaining = monthsRemaining(company.subscriptionEnd);
  const langCodes: string[] = (company as unknown as { languageCodes?: string[] }).languageCodes ?? [];
  const ext = company.extended;

  const handleReset = () => {
    setResetOpen(false);
    toast.info(t('companyDashboard.resetPending', 'Reset is not yet available — backend endpoint pending.'));
  };

  const handleDelete = () => {
    if (!id) return;
    deleteCompany.mutate(id, {
      onSuccess: () => {
        toast.success(t('companies.delete.success', 'Business has been deleted.'));
        setDeleteOpen(false);
        navigate(adminRoutes.companies);
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : t('companies.delete.error', 'Failed to delete business.');
        toast.error(msg);
      },
    });
  };

  const handbookListUrl = `${handbookRoutes.pages}?asCompany=${id}`;
  const handbookHomeUrl = `${handbookRoutes.manage}?asCompany=${id}`;
  const userPanelHomeUrl = `/?asCompany=${id}`;
  const employeesUrl = `${employeesRoutes.list}?asCompany=${id}`;
  const addCrmUrl = `${adminRoutes.crmCreate}?companyId=${id}`;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top row: breadcrumb / title (left) + back link (right) */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
            <Link to={adminRoutes.dashboard} className="hover:text-gray-700">
              {t('companyView.breadcrumb.console', 'Console')}
            </Link>
            <span className="text-gray-300">›</span>
            <Link to={adminRoutes.companies} className="hover:text-gray-700">
              {t('companyView.breadcrumb.companies', 'Companies')}
            </Link>
            <span className="text-gray-300">›</span>
            <span className="text-gray-700 font-medium truncate">{company.title}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mt-1">
            {company.title}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(adminRoutes.companies)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('companyView.allCompanies', 'All Companies')}
        </Button>
      </div>

      {/* Key Figures */}
      <section>
        <h2 className="text-base font-semibold text-[#0d0e0e] mb-2">
          {t('companyDashboard.keyFigures', 'Key Figures')}
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.business', 'Business')}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.licenses', 'Licenses')}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.used', 'Used')}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.exploitation', 'Exploitation')}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.access', 'Access')}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.editingContent', 'Editing Content')}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.published', 'Published')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-green-50/40">
                  <TableCell className="font-semibold text-[#0d0e0e]">{company.title}</TableCell>
                  <TableCell>{company.keyFigures?.licenses ?? 0}</TableCell>
                  <TableCell>{company.keyFigures?.used ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${
                        (company.keyFigures?.exploitationPct ?? 0) < 25 ? 'text-red-600' :
                        (company.keyFigures?.exploitationPct ?? 0) > 100 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {company.keyFigures?.exploitationPct ?? 0}%
                      </span>
                      <div className="h-1.5 w-32 bg-gray-100 rounded-full">
                        <div
                          className={`h-full rounded-full ${
                            (company.keyFigures?.exploitationPct ?? 0) < 25 ? 'bg-red-500' :
                            (company.keyFigures?.exploitationPct ?? 0) > 100 ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(company.keyFigures?.exploitationPct ?? 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 text-xs">
                    {formatRelativeFromUnix(company.keyFigures?.lastAccess, t)}
                  </TableCell>
                  <TableCell className="text-gray-700 text-xs">
                    {formatRelativeFromUnix(company.keyFigures?.lastEdited, t)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${company.keyFigures?.published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {company.keyFigures?.published ? t('companyView.yes', 'Yes') : t('companyView.no', 'No')}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Business Details + Activity & Subscription */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Business Details */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <SectionLabel editHref={`${editPath}#about-section`}>{t('companyView.businessDetails', 'Business details')}</SectionLabel>
          <KvRow label={t('companyView.field.businessName', 'Business Name')}>
            <div className="flex items-center gap-2 justify-end flex-wrap">
              <span className="font-medium">{company.title}</span>
              {company.category && (
                <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                  {company.category}
                </span>
              )}
            </div>
          </KvRow>
          <KvRow label={t('companyView.field.customerNo', 'Customer No.')}>
            {company.customerNumber}
          </KvRow>
          <KvRow label={t('companyView.field.cvr', 'CVR')}>
            {company.cvr ? company.cvr : <span className="text-gray-400">{t('companies.notEntered', 'Not entered')}</span>}
          </KvRow>
          <KvRow label={t('companyView.field.product', 'Product')}>
            <PlainValue value={company.productName} />
          </KvRow>
          <KvRow label={t('companyView.field.licenses', 'Licenses')}>
            {t('companyView.value.usedByLicenses', '{{used}} used by {{total}}', {
              used: company.licensesUsed ?? 0,
              total: company.licensesTotal ?? 0,
            })}
          </KvRow>
          <KvRow label={t('companyView.field.smss', 'SMSs')}>
            {t('companyView.value.usedByLicenses', '{{used}} used by {{total}}', {
              used: company.smsUsed ?? 0,
              total: company.smsCreditsTotal ?? 0,
            })}
          </KvRow>
          <KvRow label={t('companyView.field.sender', 'Sender')}>
            <PlainValue value={company.senderName || ext?.smsSender} />
          </KvRow>
          <KvRow label={t('companyView.field.employmentTypes', 'Employment Types')}>
            <PlainValue value={(company as unknown as { employmentTypesCount?: number }).employmentTypesCount ?? 0} />
          </KvRow>
          <KvRow label={t('companyView.field.departments', 'Departments')}>
            <PlainValue value={(company as unknown as { departmentsCount?: number }).departmentsCount ?? '—'} />
          </KvRow>
          <KvRow label={t('companyView.field.additionalHandbooks', 'Additional Handbooks')}>
            {ext?.numOwnHandbooks && ext.numOwnHandbooks > 0
              ? ext.numOwnHandbooks
              : <span className="text-gray-400">{t('companyView.value.none', 'None')}</span>}
          </KvRow>
          <KvRow label={t('companyView.field.optionalDesign', 'Optional Graphic Design')}>
            <YesNo value={(company as unknown as { optionalDesign?: boolean }).optionalDesign ?? false} />
          </KvRow>
          <KvRow label={t('companyView.field.whistleblower', 'Whistleblower')}>
            <YesNo value={company.whistleblowerAccess} />
          </KvRow>
          <KvRow label={t('companyView.field.languages', 'Languages')}>
            {langCodes.length > 0 ? (
              <span className="text-base">
                {langCodes.map((c) => (
                  <span key={c} className="mr-1">{getCountryFlag(c === 'da' ? 'dk' : c)}</span>
                ))}
              </span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </KvRow>
          <KvRow label={t('companyView.field.sop', 'SOP')}>
            <YesNo value={!!(ext?.sop && ext.sop.trim())} />
          </KvRow>
        </div>

        {/* Activity & Subscription */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <SectionLabel editHref={`${editPath}#subscription-section`}>{t('companyView.activitySubscription', 'Activity & Subscription')}</SectionLabel>
          <KvRow label={t('companyView.field.lastAccess', 'Last Access')}>
            {formatRelativeFromUnix(company.keyFigures?.lastAccess, t)}
          </KvRow>
          <KvRow label={t('companyView.field.lastUser', 'Last User')}>
            <PlainValue value={primaryContact?.name} />
          </KvRow>
          <KvRow label={t('companyView.field.editing', 'Editing')}>
            {t('companyView.value.numberN', 'Number: {{n}}', { n: company.keyFigures?.used ?? 0 })}
          </KvRow>
          <KvRow label={t('companyView.field.editingFrequency', 'Editing Frequency')}>
            <span className="text-gray-500">—</span>
          </KvRow>

          <SectionLabel editHref={`${editPath}#subscription-section`}>{t('companyView.subscription', 'Subscription')}</SectionLabel>
          <KvRow label={t('companyView.field.start', 'Start')}>
            <PlainValue value={formatDate(company.subscriptionStart)} />
          </KvRow>
          <KvRow label={t('companyView.field.end', 'End')}>
            <PlainValue value={formatDate(company.subscriptionEnd)} />
          </KvRow>
          <KvRow label={t('companyView.field.remaining', 'Remaining')}>
            {remaining != null ? (
              <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                {remaining === 0
                  ? t('companies.expired', 'Expired')
                  : t('companyView.value.nMonths', '{{n}} months', { n: remaining })}
              </span>
            ) : <span className="text-gray-400">—</span>}
          </KvRow>

          <SectionLabel editHref={`${editPath}#invoice-section`}>{t('companyView.invoice', 'Invoice')}</SectionLabel>
          <KvRow label={t('companyView.field.type', 'Type')}>
            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {t('companyView.value.annual', 'Annual')}
            </span>
          </KvRow>
          <KvRow label={t('companyView.field.next', 'Next')}>
            <PlainValue value={formatDate(company.subscriptionEnd)} />
          </KvRow>
          <KvRow label={t('companyView.field.employeeHandbook', 'Employee Handbook')}>
            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${
              company.keyFigures?.published ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
              {company.keyFigures?.published
                ? t('companyView.value.published', 'Published')
                : t('companyView.value.unpublished', 'Unpublished')}
            </span>
          </KvRow>
          <KvRow label={t('companyView.field.companyStatus', 'Company')}>
            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${
              company.status === 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
              {company.status === 1
                ? t('companyView.value.active', 'Active')
                : t('companyView.value.inactive', 'Inactive')}
            </span>
          </KvRow>
        </div>
      </section>

      {/* Quick Links + Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <SectionLabel>{t('companyView.quickLinks', 'Quick Links')}</SectionLabel>
          <div className="p-4 sm:p-5 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={handbookListUrl} target="_blank" rel="noopener noreferrer">
                <FilesIcon className="h-3.5 w-3.5 mr-1.5" />
                {t('companyView.quick.allPages', 'All Pages')}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={handbookHomeUrl} target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                {t('companyView.quick.createHandbook', 'Create Your Handbook')}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={userPanelHomeUrl} target="_blank" rel="noopener noreferrer">
                <SettingsIcon className="h-3.5 w-3.5 mr-1.5" />
                {t('companyView.quick.controlPanel', 'Control Panel')}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={employeesUrl} target="_blank" rel="noopener noreferrer">
                <UsersIcon className="h-3.5 w-3.5 mr-1.5" />
                {t('companyView.quick.employees', 'Employees')}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={addCrmUrl}>
                <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                {t('companyView.quick.addCrm', 'Add CRM Activity')}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={adminRoutes.companyInformationList.replace(':id', String(company.nid))}>
                <ListChecks className="h-3.5 w-3.5 mr-1.5" />
                {t('companyView.quick.infoList', 'Info List')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <SectionLabel>{t('companyView.actions', 'Actions')}</SectionLabel>
          <div className="p-4 sm:p-5 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={editPath}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                {t('companyView.actionEdit', 'Edit')}
              </Link>
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              {t('companyView.actionView', 'View')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setResetOpen(true)}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {t('companyView.actionReset', 'Reset')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {t('companyView.actionDeleteAll', 'Delete All')}
            </Button>
          </div>
        </div>
      </section>

      {/* CRM Activities */}
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <h2 className="text-sm font-semibold text-[#0d0e0e]">
            {t('companyDashboard.crmActivities', 'CRM Activities')}
            <span className="text-xs text-gray-500 font-normal ml-2">
              {t('companyDashboard.customerContext', 'Customer: {{name}} – {{id}}', { name: company.title, id: company.customerNumber })}
            </span>
          </h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to={adminRoutes.crmActivities}>
                {t('companyDashboard.allActivities', 'All Activities')}
              </Link>
            </Button>
            <Button size="sm" className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200" asChild>
              <Link to={addCrmUrl}>
                <Plus className="h-4 w-4 mr-1" />
                {t('companyDashboard.addActivity', 'Add Activity')}
              </Link>
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.crm.created', 'Created')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.crm.activity', 'Activity')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.crm.responsible', 'Responsible')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.crm.next', 'Next')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.crm.of', 'Of')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.crm.status', 'Status')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.crm.text', 'Text')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {company.crmActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-6">
                    {t('companyDashboard.noActivities', 'No activities yet.')}
                  </TableCell>
                </TableRow>
              ) : (
                company.crmActivities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-gray-600 text-xs whitespace-nowrap">
                      {formatDate(new Date(a.created * 1000).toISOString())}
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(a.created * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#0d0e0e]">{a.title}</TableCell>
                    <TableCell className="text-gray-700 text-xs">{a.responsibleName || '—'}</TableCell>
                    <TableCell className="text-gray-600 text-xs">
                      {a.fupDate ? formatDate(new Date(a.fupDate).toISOString()) : '—'}
                    </TableCell>
                    <TableCell className="text-gray-600 text-xs">{company.title}</TableCell>
                    <TableCell>
                      <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                        {a.statusName || t('crmActivities.status.done', 'Done')}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 text-xs max-w-[280px]">
                      <div className="line-clamp-2">{a.body}</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Contacts */}
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <h2 className="text-sm font-semibold text-[#0d0e0e]">
            {t('companyDashboard.contacts', 'Contacts')}
            <span className="text-xs text-gray-500 font-normal ml-2">
              {t('companyDashboard.companyContacts', 'Company contacts')}
            </span>
          </h2>
          <Button
            size="sm"
            className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
            disabled
            aria-disabled="true"
            title={t('companyDashboard.comingSoon', 'Coming soon')}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('companyDashboard.addContact', 'Add Contact')}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.contactColumns.name', 'Name')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.contactColumns.email', 'Email')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.contactColumns.telephone', 'Telephone')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.contactColumns.function', 'Function')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.contactColumns.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {company.contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-6">
                    {t('companyDashboard.noContacts', 'No contacts')}
                  </TableCell>
                </TableRow>
              ) : (
                company.contacts.map((c) => (
                  <TableRow key={c.uid}>
                    <TableCell className="font-medium text-[#0d0e0e]">{c.name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">{c.email}</a>
                    </TableCell>
                    <TableCell className="text-gray-700">{c.phone || '—'}</TableCell>
                    <TableCell className="text-gray-700">
                      {c.isPrimary
                        ? t('companyDashboard.primaryContact', 'Primary contact person')
                        : t('companyDashboard.business', 'Business')}
                    </TableCell>
                    <TableCell>
                      <Link to={editPath} className="text-sm text-green-700 hover:underline">
                        {t('companyDashboard.actionEdit', 'Edit')}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Documents */}
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <h2 className="text-sm font-semibold text-[#0d0e0e]">
            {t('companyDashboard.documents', 'Documents')}
          </h2>
          <Button
            size="sm"
            className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
            asChild
          >
            <Link to={`${editPath}#documents-section`}>
              <UploadIcon className="h-4 w-4 mr-1" />
              {t('companyDashboard.upload', 'Upload')}
            </Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.docColumns.description', 'Description')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.docColumns.linkedTo', 'Linked To')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.docColumns.date', 'Date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-400 py-6">
                  <FileText className="h-6 w-6 inline-block mr-2 align-text-bottom opacity-50" />
                  {t('companyDashboard.noDocuments', 'No')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Reset confirmation */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companyDashboard.resetConfirmTitle', 'Reset company information?')}</DialogTitle>
            <DialogDescription>
              {t(
                'companyDashboard.resetConfirmBody',
                'Proceeding with this action resets the information for this company. You may lose important information. Continue with caution.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              {t('companyDashboard.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={handleReset}
            >
              {t('companyDashboard.actionReset', 'Reset')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <DeleteCompanyDialog
        open={deleteOpen}
        businessName={company.title}
        pending={deleteCompany.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
