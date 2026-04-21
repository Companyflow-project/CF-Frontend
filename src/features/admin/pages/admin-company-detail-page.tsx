import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminCompany } from '../hooks';
import { adminRoutes } from '../routes';
import type { AdminCompanyDetail } from '../types';

type Mode = 'view' | 'wise';

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${weekday}, ${day}/${month}/${year} – ${hh}:${mm}`;
  } catch {
    return '—';
  }
}

const yesNo = (v: boolean | undefined, t: (k: string, f: string) => string) =>
  v ? t('companyView.yes', 'Yes') : t('companyView.no', 'No');

const onOff = (v: boolean | undefined, t: (k: string, f: string) => string) =>
  v ? t('companyView.on', 'On') : t('companyView.off', 'Off');

interface CategoryOption {
  key: string;
  label: string;
  classes: string;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'lead', label: 'Lead', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { key: 'potential', label: 'Potential', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { key: 'inquiry_from_us', label: 'Inquiry from us', classes: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { key: 'accepted', label: 'Accepted', classes: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'dialogue', label: 'Dialogue', classes: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'meeting_scheduled', label: 'Meeting scheduled', classes: 'bg-gray-100 text-gray-800 border-gray-200' },
  { key: 'free_sample', label: 'Free sample', classes: 'bg-green-200 text-green-900 border-green-300' },
  { key: 'demo_requested', label: 'Demo requested', classes: 'bg-pink-200 text-pink-900 border-pink-300' },
  { key: 'demo_agreed', label: 'Demo agreed', classes: 'bg-pink-100 text-pink-800 border-pink-200' },
  { key: 'want_contact', label: 'Want contact', classes: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'offer_sent', label: 'Offer sent', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { key: 'offer_rejected', label: 'Offer rejected', classes: 'bg-gray-100 text-gray-800 border-gray-200' },
  { key: 'external_testing', label: 'External testing', classes: 'bg-gray-100 text-gray-800 border-gray-200' },
  { key: 'customer', label: 'Customer', classes: 'bg-green-500 text-white border-green-600' },
  { key: 'not_a_customer', label: 'Not a customer', classes: 'bg-red-300 text-red-900 border-red-400' },
  { key: 'terminated', label: 'Terminated', classes: 'bg-pink-100 text-pink-800 border-pink-200' },
  { key: 'former_customer', label: 'Former customer', classes: 'bg-pink-200 text-pink-900 border-pink-300' },
  { key: 'partner', label: 'Partner', classes: 'bg-green-100 text-green-800 border-green-200' },
  { key: 'internal_testing', label: 'Internal testing', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
  { key: 'internal_demo', label: 'Internal demo', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
];

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, value, highlight }) => (
  <div className="py-3 border-b border-gray-100 last:border-0">
    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
      {label}
    </div>
    <div
      className={`mt-1 text-sm ${
        highlight ? 'text-green-700 font-medium' : 'text-gray-900'
      }`}
    >
      {value ?? '—'}
    </div>
  </div>
);

interface TabLinkProps {
  children: React.ReactNode;
  to?: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}

const TabLink: React.FC<TabLinkProps> = ({
  children,
  to,
  active,
  onClick,
  disabled,
  tone = 'default',
}) => {
  const base =
    'px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap';
  if (active) {
    return (
      <span className={`${base} bg-[#0d0e0e] text-white font-medium`}>
        {children}
      </span>
    );
  }
  const color =
    tone === 'danger'
      ? 'text-red-600 hover:bg-red-50'
      : 'text-gray-700 hover:bg-gray-100';
  if (disabled) {
    return (
      <span
        className={`${base} ${
          tone === 'danger' ? 'text-red-400' : 'text-gray-400'
        } cursor-not-allowed`}
      >
        {children}
      </span>
    );
  }
  if (to) {
    return (
      <Link to={to} className={`${base} ${color}`}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${base} ${color}`}>
      {children}
    </button>
  );
};

const FreeSampleCompactCard: React.FC<{
  title: string;
  subtitle: string;
  onChange: () => void;
  onClose?: () => void;
  t: (k: string, f: string) => string;
}> = ({ title, subtitle, onChange, onClose, t }) => (
  <div className="bg-green-500 text-white rounded-xl p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-sm font-semibold leading-tight">{title}</div>
        <div className="text-xs text-green-50 mt-0.5">{subtitle}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onChange}
          className="bg-green-600 hover:bg-green-700 text-white border-green-700 h-7 px-3 text-xs"
        >
          {t('companyView.change', 'Change')}
        </Button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('companyView.close', 'Close')}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-green-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  </div>
);

const FreeSampleExpandedCard: React.FC<{
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
            className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${
              cat.classes
            } ${
              isSelected ? 'ring-2 ring-offset-1 ring-green-700' : ''
            }`}
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
  const { data: company, isLoading, isError } = useAdminCompany(id) as {
    data: AdminCompanyDetail | undefined;
    isLoading: boolean;
    isError: boolean;
  };

  const [mode, setMode] = useState<Mode>('view');
  const [selectedCategory, setSelectedCategory] = useState<string>('free_sample');

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="text-red-600 text-sm">
          {t('companyView.loadError', 'Failed to load company.')}
        </div>
      </div>
    );
  }

  const editPath = adminRoutes.companyEdit.replace(':id', id ?? '');
  const primaryContact =
    company.contacts?.find((c) => c.isPrimary) ?? company.contacts?.[0];

  const modeTabLabel =
    mode === 'wise'
      ? t('companyView.tabs.wise', 'Wise')
      : t('companyView.tabs.view', 'View');

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-500">
        <Link to={adminRoutes.dashboard} className="hover:text-gray-700">
          {t('companyView.breadcrumb.console', 'Console')}
        </Link>
        <span className="text-gray-300">›</span>
        <Link to={adminRoutes.companies} className="hover:text-gray-700">
          {t('companyView.breadcrumb.companies', 'Companies')}
        </Link>
        <span className="text-gray-300">›</span>
        <span className="text-gray-700 font-medium truncate">
          {company.title}
        </span>
      </nav>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
        {company.title}
      </h1>

      {/* Tabs */}
      <div className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          <TabLink active>{modeTabLabel}</TabLink>
          <TabLink to={editPath}>
            {t('companyView.tabs.edit', 'Edit')}
          </TabLink>
          <TabLink disabled>
            {t('companyView.tabs.toc', 'Table of Contents')}
          </TabLink>
          <TabLink disabled tone="danger">
            {t('companyView.tabs.delete', 'Delete')}
          </TabLink>
          <TabLink disabled tone="danger">
            {t('companyView.tabs.deleteAll', 'Delete All')}
          </TabLink>
          <TabLink disabled>
            {t('companyView.tabs.versions', 'Versions')}
          </TabLink>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Field list card */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <div className="divide-y divide-gray-100">
              <FieldRow
                label={t('companyView.primaryContactPerson', 'Primary Contact Person')}
                value={primaryContact?.name}
              />
              <FieldRow
                label={t('companyView.companyEmail', 'Company Email')}
                value={primaryContact?.email ?? company.email}
              />
              <FieldRow
                label={t('companyView.licenses', 'Licenses')}
                value={company.licensesTotal}
              />
              <FieldRow
                label={t('companyView.networking', 'Networking')}
                value={t('companyView.nothing', 'Nothing')}
              />
              <FieldRow
                label={t('companyView.subscriptionEnd', 'Subscription, End')}
                value={formatDateTime(company.subscriptionEnd)}
              />
              <FieldRow
                label={t('companyView.hideQuestionsInProgress', 'Hide Questions in Progress')}
                value={yesNo(false, t)}
              />
              <FieldRow
                label={t('companyView.freeCourseCompleted', 'Free Course Completed')}
                value={yesNo(company.extended?.freeDone, t)}
              />
              <FieldRow
                label={t('companyView.showRelativesInTheInfoList', 'Show Relatives in the Info List')}
                value={yesNo(false, t)}
              />
              <FieldRow
                label={t('companyView.haveSeasonalEmployees', 'Have Seasonal Employees')}
                value={yesNo(false, t)}
              />
              <FieldRow
                label={t('companyView.nextBilling', 'Next Billing')}
                value={formatDateTime(company.subscriptionEnd)}
              />
              <FieldRow
                label={t('companyView.giveAccessToCourses', 'Give Access to Courses')}
                value={onOff(false, t)}
              />
              <FieldRow
                label={t('companyView.turnOffAnonymous', 'Turn off anonymous')}
                value={t('companyView.from', 'From')}
              />
              <FieldRow
                label={t('companyView.hideLinks', 'Hide Links')}
                value={t('companyView.from', 'From')}
              />
              <FieldRow
                label={t('companyView.alwaysShowImageTab', 'Always Show Image Tab')}
                value={t('companyView.to', 'To')}
                highlight={!!company.extended?.alwaysShowImageTab}
              />
              <FieldRow
                label={t('companyView.showDocumentsInTheInfoList', 'Show Documents in the Info List')}
                value={t('companyView.to', 'To')}
                highlight
              />
            </div>

            <div className="divide-y divide-gray-100">
              <FieldRow
                label={t('companyView.companyPhone', 'Company Phone')}
                value={company.phone}
              />
              <FieldRow
                label={t('companyView.product', 'Product')}
                value={company.productName}
              />
              <FieldRow
                label={t('companyView.additionalManuals', 'Additional Manuals')}
                value={company.extended?.numOwnHandbooks ?? 0}
              />
              <FieldRow
                label={t('companyView.subscriptionStart', 'Subscription, Start')}
                value={formatDateTime(company.subscriptionStart)}
              />
              <FieldRow
                label={t('companyView.senderNameOnSmsMessages', 'Sender Name on SMS Messages')}
                value={company.senderName}
              />
              <FieldRow
                label={t('companyView.turnOffTracking', 'Turn off tracking')}
                value={yesNo(false, t)}
              />
              <FieldRow
                label={t('companyView.showEmployeesInTheInfoList', 'Show Employees in the Info List')}
                value={yesNo(true, t)}
                highlight
              />
              <FieldRow
                label={t('companyView.collapseListsInTheInfoList', 'Collapse Lists in the Info List')}
                value={yesNo(false, t)}
              />
              <FieldRow
                label={t('companyView.paymentMethod', 'Payment Method')}
                value={t('companyView.annual', 'Annual')}
              />
              <FieldRow
                label={t('companyView.hideInToDoList', 'Hide in To-Do List')}
                value={t('companyView.wise', 'Wise')}
              />
              <FieldRow
                label={t('companyView.numberOfSmsMessages', 'Number of SMS Messages')}
                value={t('companyView.smsCount', '{{count}} SMS', { count: company.smsCreditsTotal ?? 0 })}
              />
              <FieldRow
                label={t('companyView.optionalDesign', 'Optional Design')}
                value={t('companyView.from', 'From')}
              />
              <FieldRow
                label={t('companyView.hideDocuments', 'Hide Documents')}
                value={t('companyView.from', 'From')}
              />
              <FieldRow
                label={t('companyView.showLinksInTheInfoList', 'Show Links in the Info List')}
                value={t('companyView.to', 'To')}
                highlight
              />
            </div>
          </div>
        </div>

        {/* Sidebar card */}
        <div>
          {mode === 'view' ? (
            <FreeSampleCompactCard
              title={t('companyView.freeSample', 'Free sample')}
              subtitle={t(
                'companyView.freeSampleSubtitle',
                'From the outside – free sample',
              )}
              onChange={() => setMode('wise')}
              t={t}
            />
          ) : (
            <FreeSampleExpandedCard
              title={t('companyView.freeSample', 'Free sample')}
              subtitle={t(
                'companyView.freeSampleSubtitle',
                'From the outside – free sample',
              )}
              selectedKey={selectedCategory}
              onSelect={(k) => setSelectedCategory(k)}
              onClose={() => setMode('view')}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCompanyDetailPage;
