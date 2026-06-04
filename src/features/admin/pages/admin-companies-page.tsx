import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminCompanies, useResetCompany, useDeleteCompany } from '../hooks';
import { DeleteCompanyDialog } from '../components/delete-company-dialog';
import { adminRoutes } from '../routes';
import { enterCompanyConsole } from '../impersonation';
import { handbookRoutes } from '@/features/handbook/routes';
import { employeesRoutes } from '@/features/employees/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, ArrowUp, ArrowDown, ArrowRight, Plus } from 'lucide-react';
import type { AdminCompanyListItem } from '../types';

// DB stores categories as Danish taxonomy term names (vid='customer_category').
// Quick-filter chips use the actual Danish names so the backend filter matches.
const QUICK_FILTERS = [
  { value: 'All', labelKey: 'companies.category.all', fallback: 'All', dot: null },
  { value: 'Anmodet om demo', labelKey: 'companies.category.demoRequested', fallback: 'Demo Requested', dot: 'bg-orange-400' },
  { value: 'Gratis prøve', labelKey: 'companies.category.freeSample', fallback: 'Free Sample', dot: 'bg-green-500' },
] as const;

const SORT_OPTIONS = [
  { value: 'title', labelKey: 'companies.sort.name', fallback: 'Name' },
  { value: 'created', labelKey: 'companies.sort.created', fallback: 'Created' },
  { value: 'customerNumber', labelKey: 'companies.sort.customerNumber', fallback: 'Customer #' },
] as const;

function getCategoryBadgeClasses(category: string): string {
  const normalized = category.toLowerCase();
  if (normalized === 'demo requested' || normalized === 'anmodet om demo') return 'bg-orange-100 text-orange-700';
  if (normalized === 'free sample' || normalized === 'gratis prøve') return 'bg-green-100 text-green-700';
  if (normalized === 'not a customer' || normalized === 'ikke kunde') return 'bg-red-100 text-red-700';
  if (normalized === 'customer' || normalized === 'kunde') return 'bg-green-100 text-green-700';
  if (normalized === 'partner') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-700';
}

// Categories are stored in Drupal as Danish taxonomy term names (vid=customer_category).
// Labels are localised via the canonical `taxonomy.term.customer_category.<DanishName>` keys
// shared with other admin screens — keep this here so any newly-added term shows up without
// touching code, only the locale JSON.
function getCategoryLabel(category: string, t: (k: string, opts: { defaultValue: string }) => string): string {
  if (!category) return t('companies.uncategorized', { defaultValue: 'Uncategorized' });
  return t(`taxonomy.term.customer_category.${category}`, { defaultValue: category });
}

// All Danish term names in the customer_category vocabulary, in the order Helle wants them.
const CATEGORY_FILTER_OPTIONS = [
  'Potentiel kunde',
  'Anmodet om demo',
  'Demo aftalt',
  'Ønsker kontakt',
  'Accepteret',
  'Tilbud afsendt',
  'Tilbud afvist',
  'Dialog',
  'Aftalt møde',
  'Gratis prøve',
  'Kunde',
  'Partner',
  'Ikke kunde',
  'Opsagt',
  'Intern test',
] as const;

function getCountryFlag(countryCode: string): string {
  if (!countryCode) return '';
  const code = countryCode.toUpperCase();
  const offset = 127397;
  return [...code].map((c) => String.fromCodePoint(c.charCodeAt(0) + offset)).join('');
}

function formatTimeRemaining(
  subscriptionEnd: string | null,
  t: (key: string, fallback: string) => string
): { label: string; variant: 'green' | 'yellow' | 'red' | 'gray' } | null {
  if (!subscriptionEnd) return null;

  const now = new Date();
  const end = new Date(subscriptionEnd);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return { label: t('companies.expired', 'Expired'), variant: 'red' };

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return { label: `${diffDays} ${diffDays !== 1 ? t('companies.daysLeft', 'days left') : t('companies.dayLeft', 'day left')}`, variant: 'red' };
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return { label: `${weeks} ${weeks !== 1 ? t('companies.weeksLeft', 'weeks left') : t('companies.weekLeft', 'week left')}`, variant: 'yellow' };
  }
  const months = Math.floor(diffDays / 30);
  return { label: `${months} ${months !== 1 ? t('companies.monthsLeft', 'months left') : t('companies.monthLeft', 'month left')}`, variant: 'green' };
}

function getTimeRemainingPillClasses(variant: 'green' | 'yellow' | 'red' | 'gray'): string {
  switch (variant) {
    case 'green': return 'bg-sky-50 text-sky-700';
    case 'yellow': return 'bg-sky-50 text-sky-700';
    case 'red': return 'bg-red-50 text-red-700';
    case 'gray': return 'bg-gray-50 text-gray-600';
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const AdminCompaniesPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [category, setCategory] = useState('All');
  const [resetTarget, setResetTarget] = useState<AdminCompanyListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCompanyListItem | null>(null);
  const [viewingAsNid, setViewingAsNid] = useState<number | null>(null);
  const resetCompany = useResetCompany();
  const deleteCompany = useDeleteCompany();

  const handleViewAs = useCallback(async (company: AdminCompanyListItem, targetPath: string) => {
    if (viewingAsNid != null) return;
    setViewingAsNid(company.nid);
    try {
      await enterCompanyConsole({
        companyId: company.nid,
        companyName: company.title,
        targetPath,
        returnTo: adminRoutes.companyDetail.replace(':id', String(company.nid)),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('companies.viewAsError', 'Could not open this company’s console.');
      toast.error(msg);
      setViewingAsNid(null);
    }
  }, [viewingAsNid, t]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
    sort: sortDirection === 'desc' ? `-${sort}` : sort,
    category: category !== 'All' ? category : undefined,
  };

  const { data, isLoading, isError } = useAdminCompanies(params);

  const companies: AdminCompanyListItem[] = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-500">
            <Link to={adminRoutes.dashboard} className="hover:underline">
              {t('nav.console', 'Console')}
            </Link>
            {' › '}
            <span className="text-gray-700">{t('companies.title', 'Companies')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{t('companies.title', 'Companies')}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
          >
            <Link to={adminRoutes.sources}>{t('companies.sources', 'Sources')}</Link>
          </Button>
          <Button
            size="sm"
            className="bg-gray-900 text-white hover:bg-gray-800 inline-flex items-center gap-1"
            onClick={() => navigate(adminRoutes.createCompany)}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('companies.createNew', 'Create New Business')}
          </Button>
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <Card className="px-4 py-3 mb-4">
        <div className="flex flex-wrap items-center gap-3 lg:gap-4">
          {/* Search */}
          <div className="flex items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('companies.searchPlaceholder', 'Search companies...')}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('companies.sort.label', 'Sort')}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.fallback)}</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 ${sortDirection === 'desc' ? 'text-green-600 border-green-300 bg-green-50' : 'text-gray-500'}`}
              onClick={() => setSortDirection('desc')}
              title={t('companies.sortDesc', 'Sort descending')}
              aria-label={t('companies.sortDesc', 'Sort descending')}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 ${sortDirection === 'asc' ? 'text-green-600 border-green-300 bg-green-50' : 'text-gray-500'}`}
              onClick={() => setSortDirection('asc')}
              title={t('companies.sortAsc', 'Sort ascending')}
              aria-label={t('companies.sortAsc', 'Sort ascending')}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {QUICK_FILTERS.map((q) => {
              const active = category === q.value;
              return (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => { setCategory(q.value); setPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-full border text-sm transition-colors ${
                    active
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {q.dot && <span className={`h-2 w-2 rounded-full ${q.dot}`} />}
                  <span>{t(q.labelKey, q.fallback)}</span>
                </button>
              );
            })}
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('companies.filter', 'Filter')}</span>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="All">{t('companies.filter.none', 'None')}</option>
              {CATEGORY_FILTER_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {t(`taxonomy.term.customer_category.${name}`, { defaultValue: name })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center py-20">
          <p className="text-red-600 font-medium">{t('companies.loadError', 'Failed to load companies.')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('companies.tryAgainLater', 'Please try again later.')}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && companies.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500">{t('companies.noneFound', 'No companies found.')}</p>
        </div>
      )}

      {/* Company List */}
      {!isLoading && !isError && companies.length > 0 && (
        <Card className="overflow-hidden">
          {/* Column headers */}
          <div className="hidden xl:grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,200px)] gap-0 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div>{t('companies.col.business', 'Business')}</div>
            <div>{t('companies.col.subscription', 'Subscription')}</div>
            <div>{t('companies.col.quickLinks', 'Quick Links')}</div>
            <div>{t('companies.col.actions', 'Actions')}</div>
          </div>

          {companies.map((company, idx) => {
            const timeRemaining = formatTimeRemaining(company.subscriptionEnd, t);
            const detailUrl = adminRoutes.companyDetail.replace(':id', String(company.nid));
            const editUrl = adminRoutes.companyEdit.replace(':id', String(company.nid));
            const smsLabel = company.smsCreditsTotal > 0
              ? `${company.smsUsed} / ${company.smsCreditsTotal}`
              : `${company.smsUsed} / ${t('companies.unlimited', 'unlimited')}`;
            const isLast = idx === companies.length - 1;

            return (
              <div
                key={company.nid}
                className={`grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,200px)] gap-0 ${isLast ? '' : 'border-b border-gray-100'}`}
              >
                {/* Business cell */}
                <div className="p-5">
                  <div className="mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryBadgeClasses(company.category)}`}>
                      {getCategoryLabel(company.category, t)}
                    </span>
                  </div>
                  <Link
                    to={detailUrl}
                    className="text-base font-semibold text-gray-900 hover:underline"
                  >
                    {company.title}
                  </Link>
                  <dl className="mt-2 space-y-1 text-sm text-gray-600">
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.customerNumber', 'Customer no.')}: </dt>
                      <dd className="inline text-gray-700">{company.customerNumber}</dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.cvr', 'CVR')}: </dt>
                      <dd className="inline text-gray-700">{company.cvr || t('companies.notEntered', 'Not entered')}</dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.product', 'Product')}: </dt>
                      <dd className="inline text-gray-700">
                        {company.productName || '-'}
                        {' · '}
                        <span className="text-gray-500">{t('companies.field.licenses', 'Licenses')}: </span>
                        <span>{company.licensesUsed} / {company.licensesTotal}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.smss', 'SMSs')}: </dt>
                      <dd className="inline text-gray-700">{smsLabel}</dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.sender', 'Sender')}: </dt>
                      <dd className="inline text-gray-700">{company.senderName || '-'}</dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.whistleblower', 'Whistleblower')}: </dt>
                      <dd className="inline text-gray-700">
                        {company.whistleblowerAccess
                          ? t('companies.whistleblower.active', 'Active')
                          : t('companies.whistleblower.no', 'No')}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.employmentTypes', 'Employment types')}: </dt>
                      <dd className="inline text-gray-700">{company.employmentTypesCount}</dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.extraHandbooks', 'Extra handbooks')}: </dt>
                      <dd className="inline text-gray-700">
                        {company.ownHandbooksCount > 0
                          ? company.ownHandbooksCount
                          : t('companies.none', 'None')}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.optionalDesign', 'Optional design')}: </dt>
                      <dd className="inline text-gray-700">
                        {company.optionalDesign
                          ? t('companies.yes', 'Yes')
                          : t('companies.no', 'No')}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-gray-500">{t('companies.field.sop', 'SOP')}: </dt>
                      <dd className="inline text-gray-700">
                        {company.hasSop
                          ? t('companies.yes', 'Yes')
                          : t('companies.no', 'No')}
                      </dd>
                    </div>
                    {company.languageCodes.length > 0 && (
                      <div>
                        <dt className="inline text-gray-500">{t('companies.field.languages', 'Languages')}: </dt>
                        <dd className="inline">
                          {company.languageCodes.map((code) => (
                            <span key={code} className="mr-1 text-base leading-none align-middle">
                              {getCountryFlag(code === 'da' ? 'dk' : code)}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {company.countryCode && (
                    <div className="mt-3 text-xl leading-none">{getCountryFlag(company.countryCode)}</div>
                  )}
                  {(company.latestActivityTitle || company.latestActivityFup) && (
                    <div className="mt-3 rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
                      {company.latestActivityTitle && (
                        <div>
                          <span className="font-semibold">{t('companies.field.activity', 'Activity')}: </span>
                          {company.latestActivityTitle}
                        </div>
                      )}
                      {company.latestActivityFup && (
                        <div className="mt-0.5">
                          <span className="font-semibold">{t('companies.field.fup', 'FUP')}: </span>
                          {formatDate(company.latestActivityFup)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subscription cell */}
                <div className="px-5 py-5 border-t xl:border-t-0 xl:border-l border-gray-100">
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-500">{t('companies.start', 'Start')}: </span>
                      <span className="text-gray-700">{formatDate(company.subscriptionStart)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('companies.end', 'End')}: </span>
                      <span className="text-gray-700">{formatDate(company.subscriptionEnd)}</span>
                    </div>
                    {timeRemaining && (
                      <div className="pt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTimeRemainingPillClasses(timeRemaining.variant)}`}>
                          {timeRemaining.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Links cell */}
                <div className="px-5 py-5 border-t xl:border-t-0 xl:border-l border-gray-100">
                  <div className="space-y-1.5">
                    {[
                      { label: t('companies.links.allPages', 'All pages'), path: handbookRoutes.pages },
                      { label: t('companies.links.createHandbook', 'Create your handbook'), path: handbookRoutes.manage },
                      { label: t('companies.links.controlPanel', 'Control panel'), path: '/' },
                      { label: t('companies.links.employees', 'Employees'), path: employeesRoutes.list },
                    ].map((link) => (
                      <button
                        key={link.label}
                        type="button"
                        disabled={viewingAsNid != null}
                        onClick={() => handleViewAs(company, link.path)}
                        className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800 hover:underline disabled:opacity-50 disabled:cursor-default"
                      >
                        {link.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ))}
                    <Link
                      to={`${adminRoutes.crmCreate}?companyId=${company.nid}`}
                      className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800 hover:underline"
                    >
                      {t('companies.links.addCrm', 'Add CRM activity')}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Actions cell */}
                <div className="px-5 py-5 border-t xl:border-t-0 xl:border-l border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(editUrl)}
                    >
                      {t('companies.edit', 'Edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(detailUrl)}
                    >
                      {t('companies.view', 'View')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (!company.allowReset) {
                          toast.info(t('companies.resetNotEnabled', 'Reset is not enabled for this company. Enable it in Administrative Settings.'));
                          navigate(`${editUrl}#admin-allow-reset`);
                          return;
                        }
                        setResetTarget(company);
                      }}
                    >
                      {t('companies.reset', 'Reset')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteTarget(company)}
                    >
                      {t('companies.deleteAll', 'Delete everything')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && !isError && total > 0 && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6">
          <p className="text-sm text-gray-500 text-center lg:text-left">
            {t('companies.showing', 'Showing')} <span className="font-medium text-gray-700">{showingFrom}–{showingTo}</span> {t('companies.of', 'of')} <span className="font-medium text-gray-700">{total}</span> {t('companies.companiesLower', 'companies')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-gray-600 hover:text-gray-900"
            >
              ← {t('companies.previous', 'Prev')}
            </Button>

            {getPageNumbers().map((pg, idx) =>
              pg === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
              ) : (
                <Button
                  key={pg}
                  variant={pg === page ? 'default' : 'ghost'}
                  size="sm"
                  className={pg === page
                    ? 'bg-gray-900 text-white hover:bg-gray-800 h-8 w-8 p-0 rounded-md'
                    : 'text-gray-600 hover:text-gray-900 h-8 w-8 p-0 rounded-md'}
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </Button>
              )
            )}

            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-gray-600 hover:text-gray-900"
            >
              {t('companies.next', 'Next')} →
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('companies.show', 'Show')}</span>
            <Input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 100) {
                  setLimit(val);
                  setPage(1);
                }
              }}
              className="w-16 h-9 text-center"
            />
            <span className="text-sm text-gray-500">{t('companies.perPage', 'per page')}</span>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <DeleteCompanyDialog
        open={deleteTarget !== null}
        businessName={deleteTarget?.title ?? ''}
        pending={deleteCompany.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteCompany.mutate(deleteTarget.nid, {
            onSuccess: () => {
              toast.success(t('companies.delete.success', 'Business has been deleted.'));
              setDeleteTarget(null);
            },
            onError: (err: unknown) => {
              const msg = err instanceof Error ? err.message : t('companies.delete.error', 'Failed to delete business.');
              toast.error(msg);
            },
          });
        }}
      />

      {/* Reset confirmation */}
      <Dialog open={resetTarget !== null} onOpenChange={(open) => { if (!open) setResetTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('companies.resetConfirmTitle', 'Reset {{name}}?', { name: resetTarget?.title ?? '' })}
            </DialogTitle>
            <DialogDescription>
              {t(
                'companies.resetConfirmBody',
                'This will reset all company data except the company name, customer category, and company email. This action cannot be undone.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              {t('companies.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              disabled={resetCompany.isPending}
              onClick={() => {
                if (!resetTarget) return;
                resetCompany.mutate(resetTarget.nid, {
                  onSuccess: () => {
                    toast.success(t('companies.resetSuccess', 'Company has been reset.'));
                    setResetTarget(null);
                  },
                  onError: (err: unknown) => {
                    const msg = err instanceof Error ? err.message : t('companies.resetError', 'Failed to reset company.');
                    toast.error(msg);
                  },
                });
              }}
            >
              {resetCompany.isPending
                ? t('companies.resetting', 'Resetting…')
                : t('companies.reset', 'Reset')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
