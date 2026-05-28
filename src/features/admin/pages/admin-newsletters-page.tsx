import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';
import { adminRoutes } from '../routes';
import { useAdminNewsletters } from '../newsletter-hooks';
import { SortableTableHead, toggleSort, type SortDirection } from '../components/sortable-table-head';

function formatDateTime(unix: number | null): string {
  if (!unix) return '–';
  const d = new Date(unix * 1000);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} – ${hh}:${min}`;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export const AdminNewslettersPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<'title' | 'subject' | 'recipients' | 'sentAt' | 'published'>('sentAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data, isLoading, isError } = useAdminNewsletters({
    page,
    pageSize,
    search: search || undefined,
  });

  const items = data?.items ?? [];
  const sortedItems = useMemo(() => {
    const cloned = [...items];
    cloned.sort((a, b) => {
      const aValue =
        sortColumn === 'title'
          ? a.title ?? ''
          : sortColumn === 'subject'
          ? a.subject ?? ''
          : sortColumn === 'recipients'
          ? a.recipientCount ?? 0
          : sortColumn === 'sentAt'
          ? a.sentAt ?? 0
          : a.published ? 1 : 0;
      const bValue =
        sortColumn === 'title'
          ? b.title ?? ''
          : sortColumn === 'subject'
          ? b.subject ?? ''
          : sortColumn === 'recipients'
          ? b.recipientCount ?? 0
          : sortColumn === 'sentAt'
          ? b.sentAt ?? 0
          : b.published ? 1 : 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const compare = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? compare : -compare;
    });
    return cloned;
  }, [items, sortColumn, sortDirection]);

  const handleSort = (column: 'title' | 'subject' | 'recipients' | 'sentAt' | 'published') => {
    const next = toggleSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const total = data?.total ?? 0;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Breadcrumb + header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">
            <Link to={adminRoutes.dashboard} className="hover:underline">
              {t('nav.console', 'Console')}
            </Link>
            {' › '}
            <span className="text-gray-700">
              {t('newsletters.title', 'Newsletters')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
            {t('newsletters.title', 'Newsletters')}
          </h1>
        </div>
        <Button
          asChild
          className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 rounded-lg self-start sm:self-auto"
        >
          <Link to={adminRoutes.newsletterCreate}>
            <Plus className="h-4 w-4 mr-1" />
            {t('newsletters.create', 'Create Newsletter')}
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch(searchInput.trim());
                setPage(1);
              }
            }}
            placeholder={t('newsletters.searchPlaceholder', 'Search newsletters…')}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          {t('newsletters.searchBtn', 'Search')}
        </Button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <SortableTableHead column="title" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('newsletters.columns.title', 'Title')}</SortableTableHead>
                <SortableTableHead column="subject" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('newsletters.columns.subject', 'Subject')}</SortableTableHead>
                <SortableTableHead column="recipients" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">{t('newsletters.columns.recipients', 'Recipients')}</SortableTableHead>
                <SortableTableHead column="sentAt" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('newsletters.columns.sentAt', 'Was Sent')}</SortableTableHead>
                <SortableTableHead column="published" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('newsletters.columns.published', 'Published')}</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-10">
                    {t('common.loading', 'Loading…')}
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-red-500 py-10">
                    {t('newsletters.loadError', 'Failed to load newsletters.')}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-10">
                    {t('newsletters.empty', 'No newsletters yet.')}
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((n) => (
                  <TableRow key={n.nid} className="hover:bg-gray-50">
                    <TableCell className="font-semibold">
                      <Link
                        to={adminRoutes.newsletterEdit.replace(':nid', String(n.nid))}
                        className="text-[#0d0e0e] hover:underline"
                      >
                        {n.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-700">{n.subject}</TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      {n.recipientCount}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatDateTime(n.sentAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          n.published
                            ? 'inline-block text-xs font-medium px-2.5 py-0.5 rounded border bg-green-50 text-green-700 border-green-200'
                            : 'inline-block text-xs font-medium px-2.5 py-0.5 rounded border bg-red-50 text-red-600 border-red-200'
                        }
                      >
                        {n.published
                          ? t('common.yes', 'Yes')
                          : t('common.no', 'No')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
          <div>
            {total === 0
              ? t('newsletters.showingNone', 'Showing 0 newsletters')
              : t('newsletters.showing', 'Showing {{from}}–{{to}} of {{total}} newsletters', {
                  from,
                  to,
                  total,
                })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← {t('common.prev', 'Prev')}
            </Button>
            <span className="text-xs text-gray-500">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('common.next', 'Next')} →
            </Button>
            <span className="ml-2 text-xs text-gray-500">
              {t('newsletters.perPage', 'Show')}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
