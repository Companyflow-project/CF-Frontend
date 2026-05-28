import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminCompanies } from '../hooks';
import { adminRoutes } from '../routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Search } from 'lucide-react';
import type { AdminCompanyListItem } from '../types';
import { SortableTableHead } from '../components/sortable-table-head';

const SORT_OPTIONS = [
  { value: 'title', labelKey: 'latestCompanies.sort.name', fallback: 'Name' },
  { value: 'created', labelKey: 'latestCompanies.sort.created', fallback: 'Created' },
  { value: 'customerNumber', labelKey: 'latestCompanies.sort.customerNumber', fallback: 'Customer #' },
] as const;

const CATEGORY_PILLS = [
  { value: 'All', labelKey: 'latestCompanies.category.all', fallback: 'All' },
  { value: 'Demo Requested', labelKey: 'latestCompanies.category.demoRequested', fallback: 'Demo Requested', dot: 'bg-amber-400' },
  { value: 'Free Sample', labelKey: 'latestCompanies.category.freeSample', fallback: 'Free Sample', dot: 'bg-green-500' },
] as const;

const FILTER_OPTIONS = [
  { value: '', labelKey: 'latestCompanies.filter.none', fallback: 'None' },
  { value: 'Customer', labelKey: 'latestCompanies.filter.customer', fallback: 'Customer' },
  { value: 'Terminated', labelKey: 'latestCompanies.filter.terminated', fallback: 'Terminated' },
  { value: 'Partner', labelKey: 'latestCompanies.filter.partner', fallback: 'Partner' },
  { value: 'Prospect', labelKey: 'latestCompanies.filter.prospect', fallback: 'Prospect' },
  { value: 'Lead', labelKey: 'latestCompanies.filter.lead', fallback: 'Lead' },
] as const;

const PER_PAGE_OPTIONS = [10, 25, 50] as const;

function deriveCategory(company: AdminCompanyListItem): string {
  if (company.category && company.category.trim()) return company.category;
  const product = (company.productName || '').toLowerCase();
  if (product.includes('demo')) return 'Demo requested';
  if (product.includes('free') || product.includes('sample')) return 'Free sample';
  if (product) return 'Customer';
  return '';
}

function getCategoryBadgeClasses(category: string): string {
  const normalized = category.toLowerCase();
  if (normalized === 'demo requested' || normalized === 'demo') {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }
  if (normalized === 'free sample' || normalized === 'free') {
    return 'bg-green-100 text-green-700 border-green-200';
  }
  if (normalized === 'customer') {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  }
  if (normalized === 'terminated') {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  if (normalized === 'partner') {
    return 'bg-purple-100 text-purple-700 border-purple-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function formatCreatedDate(created: number): string {
  if (!created) return '—';
  try {
    return new Date(created * 1000).toLocaleDateString('da-DK');
  } catch {
    return '—';
  }
}

export const AdminLatestCompaniesPage: React.FC = () => {
  const { t } = useTranslation('admin');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<string>('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [category, setCategory] = useState<string>('All');
  const [filter, setFilter] = useState<string>('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const effectiveCategory =
    category !== 'All' ? category : filter ? filter : undefined;

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
    sort: sortDirection === 'desc' ? `-${sort}` : sort,
    category: effectiveCategory,
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

  const handleHeaderSort = (column: 'title' | 'created' | 'customerNumber') => {
    if (sort === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(column);
      setSortDirection('asc');
    }
    setPage(1);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb + Title */}
      <div>
        <nav className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <Link to={adminRoutes.dashboard} className="hover:text-gray-700 hover:underline">
            {t('latestCompanies.breadcrumb.console', 'Console')}
          </Link>
          <span className="text-gray-300">/</span>
          <Link to={adminRoutes.companies} className="hover:text-gray-700 hover:underline">
            {t('latestCompanies.breadcrumb.companies', 'Companies')}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700">
            {t('latestCompanies.breadcrumb.viewAll', 'View All')}
          </span>
        </nav>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {t('latestCompanies.title', 'Latest Companies')}
        </h1>
      </div>

      {/* Sort / Filter Bar */}
      <div className="border border-gray-200 rounded-xl bg-white p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          {/* Search (supporting quick filter by name) */}
          <div className="relative w-full lg:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('latestCompanies.searchPlaceholder', 'Search...')}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort group */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {t('latestCompanies.sort', 'Sort')}
            </span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey, opt.fallback)}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t('latestCompanies.sortAsc', 'Sort ascending')}
                title={t('latestCompanies.sortAsc', 'Sort ascending')}
                className={sortDirection === 'asc' ? 'bg-gray-900 text-white hover:bg-gray-800 hover:text-white' : ''}
                onClick={() => { setSortDirection('asc'); setPage(1); }}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t('latestCompanies.sortDesc', 'Sort descending')}
                title={t('latestCompanies.sortDesc', 'Sort descending')}
                className={sortDirection === 'desc' ? 'bg-gray-900 text-white hover:bg-gray-800 hover:text-white' : ''}
                onClick={() => { setSortDirection('desc'); setPage(1); }}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right side: pills + filter */}
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            {CATEGORY_PILLS.map((pill) => {
              const selected = category === pill.value;
              const dot = 'dot' in pill ? pill.dot : null;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => { setCategory(pill.value); setPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                    selected
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {dot && <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />}
                  {t(pill.labelKey, pill.fallback)}
                </button>
              );
            })}

            <div className="flex items-center gap-2 ml-0 sm:ml-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">
                {t('latestCompanies.filter', 'Filter')}
              </span>
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {t(opt.labelKey, opt.fallback)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="text-center py-20">
            <p className="text-red-600 font-medium">
              {t('latestCompanies.loadError', 'Failed to load companies.')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t('latestCompanies.tryAgainLater', 'Please try again later.')}
            </p>
          </div>
        )}

        {!isLoading && !isError && companies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">
              {t('latestCompanies.noneFound', 'No companies found.')}
            </p>
          </div>
        )}

        {!isLoading && !isError && companies.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <SortableTableHead column="title" activeColumn={sort as 'title' | 'created' | 'customerNumber'} direction={sortDirection} onSort={handleHeaderSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('latestCompanies.col.business', 'Business')}
                  </SortableTableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('latestCompanies.col.name', 'Name')}
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('latestCompanies.col.category', 'Category')}
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('latestCompanies.col.telephone', 'Telephone')}
                  </TableHead>
                  <SortableTableHead column="created" activeColumn={sort as 'title' | 'created' | 'customerNumber'} direction={sortDirection} onSort={handleHeaderSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('latestCompanies.col.created', 'Created')}
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => {
                  const cat = deriveCategory(company);
                  const detailTo = adminRoutes.companyDetail.replace(':id', String(company.nid));
                  return (
                    <TableRow key={company.nid} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <Link
                          to={detailTo}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {company.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {company.senderName && company.senderName.trim() ? company.senderName : '—'}
                      </TableCell>
                      <TableCell>
                        {cat ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadgeClasses(cat)}`}
                          >
                            {cat}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {company.phone && company.phone.trim() ? company.phone : '—'}
                      </TableCell>
                      <TableCell className="text-gray-700 whitespace-nowrap">
                        {formatCreatedDate(company.created)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !isError && total > 0 && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-gray-500 text-center lg:text-left">
            {t('latestCompanies.showing', 'Showing')} {showingFrom}–{showingTo}{' '}
            {t('latestCompanies.of', 'of')} {total}{' '}
            {t('latestCompanies.activities', 'activities')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={t('latestCompanies.previous', 'Previous')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((pg, idx) =>
              pg === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
              ) : (
                <Button
                  key={pg}
                  variant={pg === page ? 'default' : 'outline'}
                  size="sm"
                  className={pg === page ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label={t('latestCompanies.next', 'Next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500">
              {t('latestCompanies.show', 'Show')}
            </span>
            <select
              value={limit}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setLimit(val);
                  setPage(1);
                }
              }}
              className="h-9 rounded-xl border border-gray-200 bg-white px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PER_PAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span className="text-xs sm:text-sm text-gray-500">
              {t('latestCompanies.perPage', 'per page')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLatestCompaniesPage;
