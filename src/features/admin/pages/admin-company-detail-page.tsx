import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Plus, FileText, Upload } from 'lucide-react';
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
import { DeleteCompanyDialog } from '../components/delete-company-dialog';
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

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${day}, ${dd}/${mm}/${yyyy} – ${hh}:${mi}`;
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
  if (lower.includes('demo')) return 'bg-orange-100 text-orange-700';
  if (lower.includes('free')) return 'bg-green-100 text-green-700';
  if (lower === 'customer' || lower === 'kunde') return 'bg-green-500 text-white';
  if (lower.includes('terminated') || lower.includes('not a customer') || lower.includes('ikke kunde')) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

interface FieldCellProps {
  label: string;
  children: React.ReactNode;
}

const FieldCell: React.FC<FieldCellProps> = ({ label, children }) => (
  <div className="px-5 py-4">
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
    <div className="text-sm text-gray-900">{children}</div>
  </div>
);

interface BoolValueProps {
  value: boolean | null | undefined;
  trueLabel?: string;
  falseLabel?: string;
}

const BoolValue: React.FC<BoolValueProps> = ({ value, trueLabel = 'Yes', falseLabel = 'No' }) => {
  if (value == null) return <span className="text-gray-400">—</span>;
  return value ? (
    <span className="font-semibold text-green-600">{trueLabel}</span>
  ) : (
    <span className="text-gray-400">{falseLabel}</span>
  );
};

const PlainValue: React.FC<{ value: React.ReactNode }> = ({ value }) =>
  value === '' || value == null ? <span className="text-gray-400">—</span> : <>{value}</>;

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
        <div className="text-base font-semibold leading-tight">{title}</div>
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
  const deleteCompany = useDeleteCompany();
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

  const tabBaseClasses = 'inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors';
  const tabActiveClasses = 'bg-gray-900 text-white';
  const tabIdleClasses = 'text-gray-500 hover:text-gray-900 hover:bg-gray-50';
  const tabDangerClasses = 'text-red-600 hover:bg-red-50';

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <Link to={adminRoutes.dashboard} className="hover:text-gray-700">{t('companyView.breadcrumb.console', 'Console')}</Link>
        <span className="text-gray-300">›</span>
        <Link to={adminRoutes.companies} className="hover:text-gray-700">{t('companyView.breadcrumb.companies', 'Companies')}</Link>
        <span className="text-gray-300">›</span>
        <span className="text-gray-700 font-medium truncate">{company.title}</span>
      </nav>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{company.title}</h1>

      {/* Tab / action bar */}
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className={`${tabBaseClasses} ${tabActiveClasses}`}>{t('companyView.tabs.view', 'View')}</span>
          <Link to={editPath} className={`${tabBaseClasses} ${tabIdleClasses}`}>
            {t('companyView.tabs.edit', 'Edit')}
          </Link>
          <Link to={adminRoutes.handbookTableOfContents} className={`${tabBaseClasses} ${tabIdleClasses}`}>
            {t('companyView.tabs.toc', 'Table of Contents')}
          </Link>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className={`${tabBaseClasses} ${tabDangerClasses}`}
          >
            {t('companyView.tabs.delete', 'Delete')}
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className={`${tabBaseClasses} ${tabDangerClasses}`}
          >
            {t('companyView.tabs.deleteAll', 'Delete All')}
          </button>
          <span
            aria-disabled="true"
            title={t('companyView.comingSoon', 'Coming soon')}
            className={`${tabBaseClasses} text-gray-400 cursor-not-allowed`}
          >
            {t('companyView.tabs.versions', 'Versions')}
          </span>
        </div>
      </div>

      {/* Main view: 2-col field card + floating category card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Field card */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y divide-gray-100 sm:[&>*:nth-child(odd)]:border-r sm:[&>*:nth-child(odd)]:border-gray-100">
            <FieldCell label={t('companyView.field.primaryContact', 'Primary contact person')}>
              <PlainValue value={primaryContact?.name} />
            </FieldCell>
            <FieldCell label={t('companyView.field.companyPhone', 'Company phone')}>
              <PlainValue value={company.phone} />
            </FieldCell>

            <FieldCell label={t('companyView.field.companyEmail', 'Company email')}>
              <PlainValue value={primaryContact?.email || company.email} />
            </FieldCell>
            <FieldCell label={t('companyView.field.product', 'Product')}>
              <PlainValue value={company.productName} />
            </FieldCell>

            <FieldCell label={t('companyView.field.licenses', 'Licenses')}>
              <PlainValue value={company.licensesTotal} />
            </FieldCell>
            <FieldCell label={t('companyView.field.additionalManuals', 'Additional manuals')}>
              <PlainValue value={company.extended?.numOwnHandbooks ?? 0} />
            </FieldCell>

            <FieldCell label={t('companyView.field.networking', 'Networking')}>
              <span className="text-gray-400">{t('companyView.value.nothing', 'Nothing')}</span>
            </FieldCell>
            <FieldCell label={t('companyView.field.subscriptionStart', 'Subscription, start')}>
              <PlainValue value={formatDateTime(company.subscriptionStart)} />
            </FieldCell>

            <FieldCell label={t('companyView.field.subscriptionEnd', 'Subscription, end')}>
              <PlainValue value={formatDateTime(company.subscriptionEnd)} />
            </FieldCell>
            <FieldCell label={t('companyView.field.smsSender', 'Sender name on SMS messages')}>
              <PlainValue value={company.senderName || company.extended?.smsSender} />
            </FieldCell>

            <FieldCell label={t('companyView.field.hideQuestions', 'Hide questions in progress')}>
              <BoolValue value={false} />
            </FieldCell>
            <FieldCell label={t('companyView.field.turnOffTracking', 'Turn off tracking')}>
              <BoolValue value={false} />
            </FieldCell>

            <FieldCell label={t('companyView.field.freeCourseCompleted', 'Free course completed')}>
              <BoolValue value={company.extended?.freeDone} />
            </FieldCell>
            <FieldCell label={t('companyView.field.showEmployees', 'Show employees in the info list')}>
              <BoolValue value={company.extended?.phonebookShowEmployees} />
            </FieldCell>

            <FieldCell label={t('companyView.field.showRelatives', 'Show relatives in the info list')}>
              <BoolValue value={company.extended?.phonebookShowRelations} />
            </FieldCell>
            <FieldCell label={t('companyView.field.collapseLists', 'Collapse lists in the info list')}>
              <BoolValue value={company.extended?.phonebookCollapseEmpl} />
            </FieldCell>

            <FieldCell label={t('companyView.field.seasonalEmployees', 'Have seasonal employees')}>
              <BoolValue value={false} />
            </FieldCell>
            <FieldCell label={t('companyView.field.paymentMethod', 'Payment method')}>
              <PlainValue value={t('companyView.value.annual', 'Annual')} />
            </FieldCell>

            <FieldCell label={t('companyView.field.nextBilling', 'Next billing')}>
              <PlainValue value={formatDateTime(company.subscriptionEnd)} />
            </FieldCell>
            <FieldCell label={t('companyView.field.hideInTodo', 'Hide in to-do list')}>
              <span className="text-gray-400">—</span>
            </FieldCell>

            <FieldCell label={t('companyView.field.giveAccessToCourses', 'Give access to courses')}>
              <BoolValue value={false} trueLabel={t('companyView.value.on', 'On')} falseLabel={t('companyView.value.off', 'Off')} />
            </FieldCell>
            <FieldCell label={t('companyView.field.numberOfSms', 'Number of SMS messages')}>
              <PlainValue value={company.smsCreditsTotal != null ? `${company.smsCreditsTotal} SMS` : null} />
            </FieldCell>

            <FieldCell label={t('companyView.field.turnOffAnonymous', 'Turn off anonymous')}>
              <BoolValue
                value={company.extended?.whistleblowerDisableAnon}
                trueLabel={t('companyView.value.to', 'To')}
                falseLabel={t('companyView.value.from', 'From')}
              />
            </FieldCell>
            <FieldCell label={t('companyView.field.optionalDesign', 'Optional design')}>
              <BoolValue
                value={company.extended?.customTerms}
                trueLabel={t('companyView.value.to', 'To')}
                falseLabel={t('companyView.value.from', 'From')}
              />
            </FieldCell>

            <FieldCell label={t('companyView.field.hideLinks', 'Hide links')}>
              <BoolValue
                value={false}
                trueLabel={t('companyView.value.to', 'To')}
                falseLabel={t('companyView.value.from', 'From')}
              />
            </FieldCell>
            <FieldCell label={t('companyView.field.hideDocuments', 'Hide documents')}>
              <BoolValue
                value={false}
                trueLabel={t('companyView.value.to', 'To')}
                falseLabel={t('companyView.value.from', 'From')}
              />
            </FieldCell>

            <FieldCell label={t('companyView.field.alwaysShowImageTab', 'Always show image tab')}>
              <BoolValue
                value={company.extended?.alwaysShowImageTab}
                trueLabel={t('companyView.value.to', 'To')}
                falseLabel={t('companyView.value.from', 'From')}
              />
            </FieldCell>
            <FieldCell label={t('companyView.field.showLinks', 'Show links in the info list')}>
              <BoolValue
                value={company.extended?.phonebookShowLinks}
                trueLabel={t('companyView.value.to', 'To')}
                falseLabel={t('companyView.value.from', 'From')}
              />
            </FieldCell>

            <FieldCell label={t('companyView.field.showDocuments', 'Show documents in the info list')}>
              <BoolValue
                value={company.extended?.phonebookShowDocuments}
                trueLabel={t('companyView.value.to', 'To')}
                falseLabel={t('companyView.value.from', 'From')}
              />
            </FieldCell>
            <FieldCell label="">{/* spacer for the trailing odd cell */}<span className="invisible">—</span></FieldCell>
          </div>
        </div>

        {/* Floating category card */}
        <div className="lg:sticky lg:top-4">
          {wiseOpen ? (
            <WisePicker
              title={company.category || t('companyView.freeSample', 'Free sample')}
              subtitle={categoryBadge(company.category) ? t('companyView.freeSampleSubtitle', 'From the outside – free sample') : ''}
              selectedKey={selectedCategory}
              onSelect={(k) => setSelectedCategory(k)}
              onClose={() => setWiseOpen(false)}
              t={t}
            />
          ) : (
            <div className="bg-green-500 text-white rounded-xl shadow-sm p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold leading-tight truncate">
                  {company.category || t('companyView.freeSample', 'Free sample')}
                </div>
                <div className="text-xs text-green-50 mt-0.5">
                  {t('companyView.freeSampleSubtitle', 'From the outside – free sample')}
                </div>
              </div>
              <Button
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700 border-0 h-7 px-3 text-xs"
                onClick={() => setWiseOpen(true)}
              >
                {t('companyView.change', 'Change')}
              </Button>
              <button
                type="button"
                aria-label={t('companyView.close', 'Close')}
                onClick={() => setWiseOpen(false)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
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
