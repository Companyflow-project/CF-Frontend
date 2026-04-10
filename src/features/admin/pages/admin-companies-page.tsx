import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminCompanies } from '../hooks';
import { adminRoutes } from '../routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, ArrowRight } from 'lucide-react';
import type { AdminCompanyListItem } from '../types';

const CATEGORIES = ['All', 'Demo Requested', 'Free Sample'] as const;

const SORT_OPTIONS = [
  { value: 'title', label: 'Name' },
  { value: 'created', label: 'Created' },
  { value: 'customerNumber', label: 'Customer #' },
] as const;

function getCategoryBadgeClasses(category: string): string {
  const normalized = category.toLowerCase();
  if (normalized === 'demo requested') return 'bg-red-100 text-red-700 border-red-200';
  if (normalized === 'free sample') return 'bg-green-100 text-green-700 border-green-200';
  if (normalized === 'not a customer') return 'bg-red-100 text-red-700 border-red-200';
  if (normalized === 'customer') return 'bg-green-100 text-green-700 border-green-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function getCountryFlag(countryCode: string): string {
  if (!countryCode) return '';
  const code = countryCode.toUpperCase();
  const offset = 127397;
  const flag = [...code].map((c) => String.fromCodePoint(c.charCodeAt(0) + offset)).join('');
  return flag;
}

function formatTimeRemaining(subscriptionEnd: string | null): { label: string; variant: 'green' | 'yellow' | 'red' | 'gray' } {
  if (!subscriptionEnd) return { label: 'No end date', variant: 'gray' };

  const now = new Date();
  const end = new Date(subscriptionEnd);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return { label: 'Expired', variant: 'red' };

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return { label: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`, variant: 'red' };
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return { label: `${weeks} week${weeks !== 1 ? 's' : ''} left`, variant: 'yellow' };
  }
  const months = Math.floor(diffDays / 30);
  return { label: `${months} month${months !== 1 ? 's' : ''} left`, variant: 'green' };
}

function getTimeRemainingBadgeClasses(variant: 'green' | 'yellow' | 'red' | 'gray'): string {
  switch (variant) {
    case 'green': return 'bg-green-100 text-green-700 border-green-200';
    case 'yellow': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'red': return 'bg-red-100 text-red-700 border-red-200';
    case 'gray': return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const AdminCompaniesPage: React.FC = () => {
  const { t: _t } = useTranslation('admin');
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [category, setCategory] = useState('All');
  const [source, setSource] = useState('');

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

  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
    sort: sortDirection === 'desc' ? `-${sort}` : sort,
    category: category !== 'All' ? category : undefined,
    source: source || undefined,
  };

  const { data, isLoading, isError } = useAdminCompanies(params);

  const companies: AdminCompanyListItem[] = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  const handleSortDirectionToggle = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

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
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/sources">Sources</Link>
          </Button>
          <Button
            size="sm"
            className="bg-gray-900 text-white hover:bg-gray-800"
            onClick={() => navigate(adminRoutes.createCompany)}
          >
            + Create New Business
          </Button>
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSortDirectionToggle}
            title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Category filter chips */}
        <div className="flex items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter</span>
          <select
            value={source}
            onChange={(e) => { setSource(e.target.value); setPage(1); }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="partner">Partner</option>
            <option value="direct">Direct</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center py-20">
          <p className="text-red-600 font-medium">Failed to load companies.</p>
          <p className="text-sm text-gray-500 mt-1">Please try again later.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && companies.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500">No companies found.</p>
        </div>
      )}

      {/* Company Cards */}
      {!isLoading && !isError && companies.length > 0 && (
        <div className="space-y-4">
          {companies.map((company) => {
            const timeRemaining = formatTimeRemaining(company.subscriptionEnd);

            return (
              <Card key={company.nid} className="p-0 overflow-hidden">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_auto_auto] gap-0">
                  {/* Company Info Column */}
                  <div className="p-5 border-b xl:border-b-0 xl:border-r border-gray-100">
                    <div className="flex items-start gap-3 mb-3">
                      <Badge className={getCategoryBadgeClasses(company.category)}>
                        {company.category || 'Uncategorized'}
                      </Badge>
                      <span className="text-lg font-semibold text-gray-900">
                        {getCountryFlag(company.countryCode)}{' '}
                        <Link
                          to={adminRoutes.companyDetail.replace(':id', String(company.nid))}
                          className="hover:underline"
                        >
                          {company.title}
                        </Link>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Customer #</span>
                        <p className="text-gray-700 font-medium">{company.customerNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">CVR</span>
                        <p className="text-gray-700 font-medium">{company.cvr || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Product</span>
                        <p className="text-gray-700 font-medium">{company.productName || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Licenses</span>
                        <p className="text-gray-700 font-medium">
                          {company.licensesUsed}/{company.licensesTotal}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">SMS</span>
                        <p className="text-gray-700 font-medium">
                          {company.smsUsed}/{company.smsCreditsTotal}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Sender</span>
                        <p className="text-gray-700 font-medium">{company.senderName || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Whistleblower</span>
                        <p className="text-gray-700 font-medium">
                          {company.whistleblowerAccess ? (
                            <span className="text-green-600">Active</span>
                          ) : (
                            <span className="text-gray-400">Inactive</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Column */}
                  <div className="p-5 border-b xl:border-b-0 xl:border-r border-gray-100 min-w-[200px]">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscription</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Start</span>
                        <p className="text-gray-700 font-medium">{formatDate(company.subscriptionStart)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">End</span>
                        <p className="text-gray-700 font-medium">{formatDate(company.subscriptionEnd)}</p>
                      </div>
                      <Badge className={getTimeRemainingBadgeClasses(timeRemaining.variant)}>
                        {timeRemaining.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Links Column */}
                  <div className="p-5 border-b xl:border-b-0 xl:border-r border-gray-100 min-w-[200px]">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Links</p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'All pages', to: `/admin/companies/${company.nid}/pages` },
                        { label: 'Create handbook', to: `/admin/companies/${company.nid}/handbooks/create` },
                        { label: 'Control panel', to: `/admin/companies/${company.nid}/control` },
                        { label: 'Employees', to: `/admin/companies/${company.nid}/employees` },
                        { label: 'Add CRM activity', to: `/admin/companies/${company.nid}/crm/add` },
                      ].map((link) => (
                        <Link
                          key={link.label}
                          to={link.to}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {link.label}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="p-5 min-w-[160px]">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions</p>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => navigate(adminRoutes.companyDetail.replace(':id', String(company.nid)))}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => navigate(`/admin/companies/${company.nid}/wise`)}
                      >
                        Wise
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => navigate(`/admin/companies/${company.nid}/reset`)}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => navigate(`/admin/companies/${company.nid}/delete`)}
                      >
                        Delete everything
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <p className="text-sm text-gray-500">
            Showing {showingFrom}-{showingTo} of {total} companies
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>

            {getPageNumbers().map((pg, idx) =>
              pg === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
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
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>

          <div className="flex items-center gap-2">
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
              className="w-16 text-center"
            />
            <span className="text-sm text-gray-500">per page</span>
          </div>
        </div>
      )}
    </div>
  );
};
