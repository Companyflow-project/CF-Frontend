import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, ArrowLeft, Upload, Plus, FileText, Wrench, Trash2, RotateCcw, Pencil } from 'lucide-react';
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
import { useAdminCompany } from '../hooks';
import { adminRoutes } from '../routes';
import type { AdminCompanyDetail } from '../types';

interface CategoryOption {
  key: string;
  label: string;
  classes: string;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'potential_customer', label: 'Potential customer', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { key: 'accepted', label: 'Accepted', classes: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'dialogue', label: 'Dialogue', classes: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'meeting_scheduled', label: 'Meeting scheduled', classes: 'bg-gray-100 text-gray-800 border-gray-200' },
  { key: 'free_sample', label: 'Free sample', classes: 'bg-green-200 text-green-900 border-green-300' },
  { key: 'demo_requested', label: 'Demo requested', classes: 'bg-pink-200 text-pink-900 border-pink-300' },
  { key: 'demo_agreed', label: 'Demo agreed', classes: 'bg-pink-100 text-pink-800 border-pink-200' },
  { key: 'want_contact', label: 'Want contact', classes: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'offer_sent', label: 'Offer sent', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { key: 'offer_rejected', label: 'Offer rejected', classes: 'bg-gray-100 text-gray-800 border-gray-200' },
  { key: 'customer', label: 'Customer', classes: 'bg-green-500 text-white border-green-600' },
  { key: 'not_a_customer', label: 'Not a customer', classes: 'bg-red-300 text-red-900 border-red-400' },
  { key: 'terminated', label: 'Terminated', classes: 'bg-pink-100 text-pink-800 border-pink-200' },
  { key: 'partner', label: 'Partner', classes: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'internal_testing', label: 'Internal testing', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

function formatRelativeFromUnix(unix: number | null | undefined, t: (k: string, fb: string, opts?: Record<string, unknown>) => string): string {
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

function categoryBadge(category: string): string {
  const lower = (category || '').toLowerCase();
  if (lower.includes('demo')) return 'bg-pink-100 text-pink-800 border-pink-200';
  if (lower.includes('free')) return 'bg-green-100 text-green-800 border-green-200';
  if (lower === 'customer') return 'bg-green-500 text-white border-green-600';
  if (lower.includes('terminated') || lower.includes('not a customer')) return 'bg-red-200 text-red-900 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

function remainingBadge(months: number | null): string {
  if (months == null) return 'bg-gray-100 text-gray-700 border-gray-200';
  if (months > 6) return 'bg-green-100 text-green-700 border-green-200';
  if (months > 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
}

function getCountryFlag(countryCode: string): string {
  if (!countryCode) return '';
  const code = countryCode.toUpperCase();
  const flag = [...code].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
  return flag;
}

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
  to?: string;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, value, to }) => {
  const content = (
    <>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-[#0d0e0e] font-medium text-right">{value ?? '—'}</span>
    </>
  );
  if (to) {
    return (
      <Link
        to={to}
        className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors cursor-pointer"
      >
        {content}
      </Link>
    );
  }
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
      {content}
    </div>
  );
};

const WisePicker: React.FC<{
  title: string;
  subtitle: string;
  selectedKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
  t: (k: string, f: string) => string;
}> = ({ title, subtitle, selectedKey, onSelect, onClose, t }) => (
  <div className="bg-green-500 text-white rounded-xl shadow-sm overflow-hidden">
    <div className="flex items-start justify-between gap-2 p-4 pb-3">
      <div>
        <div className="text-sm font-semibold leading-tight">{title}</div>
        <div className="text-xs text-green-50 mt-0.5">{subtitle}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('companyView.close', 'Close')}
        className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-green-600 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
    <div className="bg-green-500 px-3 pb-3 space-y-1.5">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedKey === cat.key;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelect(cat.key)}
            className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${cat.classes} ${isSelected ? 'ring-2 ring-offset-1 ring-green-700' : ''}`}
          >
            {t(`companyView.categories.${cat.key}`, cat.label)}
          </button>
        );
      })}
    </div>
  </div>
);

export const AdminCompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { data: company, isLoading, isError } = useAdminCompany(id) as {
    data: AdminCompanyDetail | undefined;
    isLoading: boolean;
    isError: boolean;
  };
  const [wiseOpen, setWiseOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('free_sample');
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
  const editAnchor = (anchor: string) => `${editPath}#${anchor}`;

  const handleReset = () => {
    setResetOpen(false);
    toast.info(t('companyDashboard.resetPending', 'Reset is not yet available — backend endpoint pending.'));
  };

  const handleDelete = () => {
    setDeleteOpen(false);
    toast.info(t('companyDashboard.deletePending', 'Delete is not yet available — backend endpoint pending.'));
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-500">
        <Link to={adminRoutes.dashboard} className="hover:text-gray-700">{t('companyView.breadcrumb.console', 'Console')}</Link>
        <span className="text-gray-300">›</span>
        <Link to={adminRoutes.companies} className="hover:text-gray-700">{t('companyView.breadcrumb.companies', 'Companies')}</Link>
        <span className="text-gray-300">›</span>
        <span className="text-gray-700 font-medium truncate">{company.title}</span>
      </nav>

      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{company.title}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link to={adminRoutes.companies}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('companyDashboard.allCompanies', 'All Companies')}
          </Link>
        </Button>
      </div>

      {/* Main 2-column panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Business Details */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t('companyDashboard.businessDetails', 'Business details')}
          </h2>
          <div className="space-y-0">
            <FieldRow
              to={editAnchor('about-title')}
              label={t('companyDashboard.businessName', 'Business Name')}
              value={(
                <span className="inline-flex items-center gap-2">
                  {getCountryFlag(company.countryCode)}
                  <span>{company.title}</span>
                  {company.category && (
                    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${categoryBadge(company.category)}`}>
                      {company.category}
                    </span>
                  )}
                </span>
              )}
            />
            <FieldRow
              to={editAnchor('about-customer')}
              label={t('companyDashboard.customerNo', 'Customer No.')}
              value={company.customerNumber}
            />
            <FieldRow
              to={editAnchor('about-cvr')}
              label={t('companyDashboard.cvr', 'CVR')}
              value={company.cvr || t('companyDashboard.notEntered', 'Not entered')}
            />
            <FieldRow
              to={editAnchor('sub-product')}
              label={t('companyDashboard.product', 'Product')}
              value={company.productName || '—'}
            />
            <FieldRow
              to={editAnchor('sub-licenses')}
              label={t('companyDashboard.licenses', 'Licenses')}
              value={t('companyDashboard.licensesUsage', '{{used}} used by {{total}}', { used: company.licensesUsed, total: company.licensesTotal })}
            />
            <FieldRow
              to={editAnchor('sub-sms')}
              label={t('companyDashboard.sms', 'SMSs')}
              value={t('companyDashboard.smsUsage', '{{used}} used by {{total}}', { used: company.smsUsed, total: company.smsCreditsTotal })}
            />
            <FieldRow
              to={editAnchor('sub-sending')}
              label={t('companyDashboard.sender', 'Sender')}
              value={company.senderName || '—'}
            />
            <FieldRow
              to={editAnchor('section-employment-types')}
              label={t('companyDashboard.employmentTypes', 'Employment Types')}
              value="—"
            />
            <FieldRow
              to={editAnchor('section-departments')}
              label={t('companyDashboard.departments', 'Departments')}
              value="—"
            />
            <FieldRow
              to={editAnchor('sub-manuals')}
              label={t('companyDashboard.additionalHandbooks', 'Additional Handbooks')}
              value={company.extended?.numOwnHandbooks || t('companyDashboard.none', 'None')}
            />
            <FieldRow
              to={editAnchor('section-design')}
              label={t('companyDashboard.optionalDesign', 'Optional Graphic Design')}
              value={company.extended?.customTerms ? t('companyView.yes', 'Yes') : t('companyView.no', 'No')}
            />
            <FieldRow
              to={editAnchor('wb-type')}
              label={t('companyDashboard.whistleblower', 'Whistleblower')}
              value={company.whistleblowerAccess ? t('companyView.yes', 'Yes') : t('companyView.no', 'No')}
            />
            <FieldRow
              to={editAnchor('section-languages')}
              label={t('companyDashboard.languages', 'Languages')}
              value={<span>🇩🇰 🇬🇧</span>}
            />
            <FieldRow
              to={editAnchor('sub-sop')}
              label={t('companyDashboard.sop', 'SOP')}
              value={company.extended?.sop || '—'}
            />
          </div>

          {/* Quick Links */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('companyDashboard.quickLinks', 'Quick Links')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-gray-400 bg-gray-50 cursor-not-allowed hover:bg-gray-50"
                disabled
                aria-disabled="true"
                title={t('companyDashboard.comingSoon', 'Coming soon')}
              >
                {t('companyDashboard.links.allPages', 'All Pages')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-gray-400 bg-gray-50 cursor-not-allowed hover:bg-gray-50"
                disabled
                aria-disabled="true"
                title={t('companyDashboard.comingSoon', 'Coming soon')}
              >
                {t('companyDashboard.links.createHandbook', 'Create Your Handbook')}
              </Button>
              <Button variant="outline" size="sm" className="justify-start" asChild>
                <Link to={adminRoutes.dashboard}>{t('companyDashboard.links.controlPanel', 'Control Panel')}</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-gray-400 bg-gray-50 cursor-not-allowed hover:bg-gray-50"
                disabled
                aria-disabled="true"
                title={t('companyDashboard.comingSoon', 'Coming soon')}
              >
                {t('companyDashboard.links.employees', 'Employees')}
              </Button>
              <Button variant="outline" size="sm" className="justify-start col-span-2" asChild>
                <Link to={`${adminRoutes.crmCreate}?companyId=${id}`}>{t('companyDashboard.links.addCrm', 'Add CRM Activity')}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Activity & Subscription */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t('companyDashboard.activityAndSubscription', 'Activity & Subscription')}
          </h2>
          <div className="space-y-0">
            <FieldRow
              label={t('companyDashboard.lastAccess', 'Last Access')}
              value={formatRelativeFromUnix(company.keyFigures?.lastAccess, t)}
            />
            <FieldRow
              label={t('companyDashboard.lastUser', 'Last User')}
              value={primaryContact?.name || company.title}
            />
            <FieldRow
              label={t('companyDashboard.editing', 'Editing')}
              value={t('companyDashboard.editingNumber', 'Number: {{count}}', { count: company.handbooks?.length ?? 0 })}
            />
            <FieldRow
              label={t('companyDashboard.editingFrequency', 'Editing Frequency')}
              value={formatRelativeFromUnix(company.keyFigures?.lastEdited, t)}
            />
          </div>

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-4 border-t border-gray-100">
            {t('companyDashboard.subscription', 'Subscription')}
          </h3>
          <div className="space-y-0">
            <FieldRow label={t('companyDashboard.start', 'Start')} value={formatDate(company.subscriptionStart)} />
            <FieldRow label={t('companyDashboard.end', 'End')} value={formatDate(company.subscriptionEnd)} />
            <FieldRow
              label={t('companyDashboard.remaining', 'Remaining')}
              value={(
                <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${remainingBadge(company.subscriptionRemainingMonths)}`}>
                  {company.subscriptionRemainingMonths != null
                    ? t('companyDashboard.nMonths', '{{count}} months', { count: company.subscriptionRemainingMonths })
                    : '—'}
                </span>
              )}
            />
          </div>

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-4 border-t border-gray-100">
            {t('companyDashboard.invoice', 'Invoice')}
          </h3>
          <div className="space-y-0">
            <FieldRow label={t('companyDashboard.type', 'Type')} value={t('companyDashboard.annual', 'Annual')} />
            <FieldRow label={t('companyDashboard.next', 'Next')} value={formatDate(company.subscriptionEnd)} />
            <FieldRow
              label={t('companyDashboard.employeeHandbook', 'Employee Handbook')}
              value={(
                <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                  {t('companyDashboard.published', 'Published')}
                </span>
              )}
            />
            <FieldRow
              label={t('companyDashboard.company', 'Company')}
              value={(
                <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${company.status === 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {company.status === 1 ? t('companyDashboard.active', 'Active') : t('companyDashboard.inactive', 'Inactive')}
                </span>
              )}
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('companyDashboard.actions', 'Actions')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(editPath)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {t('companyDashboard.actionEdit', 'Edit')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWiseOpen((v) => !v)}>
                <Wrench className="h-3.5 w-3.5 mr-1" />
                {t('companyDashboard.actionWise', 'Wise')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                {t('companyDashboard.actionReset', 'Reset')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {t('companyDashboard.actionDeleteAll', 'Delete All')}
              </Button>
            </div>

            {wiseOpen && (
              <div className="mt-4">
                <WisePicker
                  title={t('companyView.freeSample', 'Free sample')}
                  subtitle={t('companyView.freeSampleSubtitle', 'From the outside – free sample')}
                  selectedKey={selectedCategory}
                  onSelect={(k) => setSelectedCategory(k)}
                  onClose={() => setWiseOpen(false)}
                  t={t}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Contacts */}
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <h2 className="text-sm font-semibold text-[#0d0e0e]">
            {t('companyDashboard.contacts', 'Contacts')}
            {primaryContact && (
              <span className="text-xs text-gray-500 font-normal ml-2">
                {t('companyDashboard.companyContacts', 'Company contacts')}
              </span>
            )}
          </h2>
          <Button
            size="sm"
            variant="outline"
            disabled
            aria-disabled="true"
            className="text-gray-400 bg-gray-50 cursor-not-allowed hover:bg-gray-50"
            title={t('companyDashboard.comingSoon', 'Coming soon')}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('companyDashboard.addContact', '+ Add Contact')}
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
                    <TableCell className="text-blue-600">{c.email}</TableCell>
                    <TableCell className="text-gray-700">{c.phone || '—'}</TableCell>
                    <TableCell className="text-gray-700">
                      {c.isPrimary ? t('companyDashboard.primaryContact', 'Primary contact person') : t('companyDashboard.business', 'Business')}
                    </TableCell>
                    <TableCell>
                      <span
                        aria-disabled="true"
                        className="text-sm text-gray-400 cursor-not-allowed select-none"
                        title={t('companyDashboard.comingSoon', 'Coming soon')}
                      >
                        {t('companyDashboard.actionEdit', 'Edit')}
                      </span>
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
            variant="outline"
            disabled
            aria-disabled="true"
            className="text-gray-400 bg-gray-50 cursor-not-allowed hover:bg-gray-50"
            title={t('companyDashboard.comingSoon', 'Coming soon')}
          >
            <Upload className="h-4 w-4 mr-1" />
            {t('companyDashboard.upload', '↑ Upload')}
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

      {/* Key Figures */}
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <h2 className="text-sm font-semibold text-[#0d0e0e]">
            {t('companyDashboard.keyFigures', 'Key Figures')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.business', 'Business')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.licenses', 'Licenses')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.used', 'Used')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.exploitation', 'Exploitation')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.access', 'Access')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.editingContent', 'Editing Content')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('companyDashboard.kf.published', 'Published')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-[#0d0e0e]">{company.title}</TableCell>
                <TableCell>{company.keyFigures?.licenses ?? 0}</TableCell>
                <TableCell>{company.keyFigures?.used ?? 0}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-gray-100 rounded">
                      <div
                        className={`h-full rounded ${
                          (company.keyFigures?.exploitationPct ?? 0) > 100 ? 'bg-red-500' :
                          (company.keyFigures?.exploitationPct ?? 0) < 25 ? 'bg-red-400' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(company.keyFigures?.exploitationPct ?? 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs">{company.keyFigures?.exploitationPct ?? 0}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 text-xs">{formatRelativeFromUnix(company.keyFigures?.lastAccess, t)}</TableCell>
                <TableCell className="text-gray-600 text-xs">{formatRelativeFromUnix(company.keyFigures?.lastEdited, t)}</TableCell>
                <TableCell>
                  <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${company.keyFigures?.published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {company.keyFigures?.published ? t('companyView.yes', 'Yes') : t('companyView.no', 'No')}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
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
              <Link to={adminRoutes.crmActivities}>{t('companyDashboard.allActivities', 'All Activities')}</Link>
            </Button>
            <Button size="sm" className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90" asChild>
              <Link to={`${adminRoutes.crmCreate}?companyId=${id}`}>
                <Plus className="h-4 w-4 mr-1" />
                {t('companyDashboard.addActivity', '+ Add Activity')}
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
                    <TableCell className="text-gray-600 text-xs">{a.fupDate ? formatDate(new Date(a.fupDate).toISOString()) : '—'}</TableCell>
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

      {/* Delete All confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companyDashboard.deleteConfirmTitle', 'Delete this company?')}</DialogTitle>
            <DialogDescription>
              {t(
                'companyDashboard.deleteConfirmBody',
                'This action is irreversible. Proceed with caution and make sure you no longer need the data before deleting it.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t('companyDashboard.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              {t('companyDashboard.actionDelete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
