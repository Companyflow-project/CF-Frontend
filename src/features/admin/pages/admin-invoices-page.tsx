import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search, Download } from 'lucide-react';
import { useInvoices } from '../hooks';
import { adminApi } from '../api';
import { adminRoutes } from '../routes';
import { SortableTableHead } from '../components/sortable-table-head';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('da-DK');
}

function monthsLabel(n: number | null): { label: string; highlighted: boolean } {
  if (n === null) return { label: '—', highlighted: false };
  if (n === 0) return { label: '< 1 month', highlighted: true };
  return { label: `${n} month${n === 1 ? '' : 's'}`, highlighted: n <= 2 };
}

export const AdminInvoicesPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const [sortBy, setSortBy] = useState<'business' | 'begin' | 'end'>('business');
  const handleHeaderSort = (column: 'business' | 'begin' | 'end') => {
    setSortBy(column);
    setPage(1);
  };

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [exporting, setExporting] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const { data, isLoading } = useInvoices({
    page,
    limit: perPage,
    sort: sortBy,
    search: debouncedSearch || undefined,
  });

  const invoices = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / perPage) : 1;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await adminApi.exportInvoicesCsv({
        sort: sortBy,
        search: debouncedSearch || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">
            <Link to={adminRoutes.dashboard} className="hover:underline">
              {t('nav.console', 'Console')}
            </Link>
            {' › '}
            <span className="text-gray-700">{t('invoices.breadcrumb', 'Invoices')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
            {t('invoices.title', 'Invoices')}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? t('invoices.exporting', 'Exporting…') : t('invoices.exportCsv', 'Export CSV')}
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('invoices.searchPlaceholder', 'Search businesses...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <SortableTableHead column="business" activeColumn={sortBy} direction="asc" onSort={handleHeaderSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.business', 'Business')}</SortableTableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.category', 'Category')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.licenses', 'Licenses')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.addPurchases', 'Add. Purchases')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.payment', 'Payment')}</TableHead>
                <SortableTableHead column="begin" activeColumn={sortBy} direction="asc" onSort={handleHeaderSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.beginner', 'Beginner')}</SortableTableHead>
                <SortableTableHead column="end" activeColumn={sortBy} direction="asc" onSort={handleHeaderSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.ends', 'Ends')}</SortableTableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.endsAbout', 'Ends About')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.invoicing', 'Invoicing')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.when', 'When')}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('invoices.columns.notes', 'Notes')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-gray-400 py-8">
                    {t('common.loading', 'Loading…')}
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-gray-400 py-8">
                    {t('invoices.empty', 'No invoices found.')}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const endsAbout = monthsLabel(inv.endsAboutMonths);
                  const when = monthsLabel(inv.whenMonths);
                  return (
                    <TableRow key={inv.nid} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <Link
                          to={adminRoutes.companyDetail.replace(':id', String(inv.nid))}
                          className="text-[#0d0e0e] hover:underline"
                        >
                          {inv.business}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {inv.category && (
                          <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                            {inv.category}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">{inv.licenses || '—'}</TableCell>
                      <TableCell className="text-gray-500">{inv.addPurchases}</TableCell>
                      <TableCell className="text-gray-700">{inv.payment}</TableCell>
                      <TableCell className="text-gray-700">{formatDate(inv.beginner)}</TableCell>
                      <TableCell className="text-gray-700">{formatDate(inv.ends)}</TableCell>
                      <TableCell className={endsAbout.highlighted ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                        {endsAbout.label}
                      </TableCell>
                      <TableCell className="text-gray-700">{formatDate(inv.invoicing)}</TableCell>
                      <TableCell className={when.highlighted ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                        {when.label}
                      </TableCell>
                      <TableCell className="text-gray-500 max-w-[180px] truncate" title={inv.notes}>
                        {inv.notes}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {t('invoices.showing', 'Showing {{from}}–{{to}} of {{total}} invoices', { from, to, total })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> {t('common.prev', 'Prev')}
            </Button>
            <span className="text-sm text-gray-700 px-2">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('common.next', 'Next')} <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 ml-3">
              <span className="text-sm text-gray-500">{t('common.show', 'Show')}</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm px-2 py-1"
              >
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-500">{t('common.perPage', 'per page')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
