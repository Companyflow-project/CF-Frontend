import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSourceFilters, useSourceCompanies } from '../hooks';
import { adminRoutes } from '../routes';
import { SortableTableHead, toggleSort, type SortDirection } from '../components/sortable-table-head';

const PAGE_SIZE = 15;

function formatDate(unix: number | null): string {
  if (!unix) return '-';
  return new Date(unix * 1000).toLocaleDateString('da-DK');
}

function FilterBadge({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active?: boolean;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm transition-colors ${
        active
          ? 'bg-[#0d0e0e] text-white border-[#0d0e0e]'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
      <span>{label}</span>
      <span className={active ? 'opacity-80' : 'text-gray-500'}>{count}</span>
    </button>
  );
}

const SOURCE_COLORS: Record<string, string> = {
  None: '#9ca3af',
  Marksman: '#10b981',
  'Mass 23:7': '#3b82f6',
  Kim: '#a855f7',
  'Mass 24:11': '#22c55e',
  'Demo via degoan.dk': '#3b82f6',
  'Free version': '#f59e0b',
  'Came myself': '#10b981',
  'Callback requested': '#3b82f6',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Not a customer': '#ef4444',
  Partners: '#a855f7',
  'Free sample': '#10b981',
  Customer: '#10b981',
  Terminated: '#ef4444',
  'Internal demo': '#9ca3af',
  Dialogue: '#f59e0b',
  'Demo requested': '#f59e0b',
  'Internal test': '#9ca3af',
};

export const AdminSourcesPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const [source, setSource] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [sortColumn, setSortColumn] = useState<'business' | 'source' | 'category' | 'created' | 'followUpDate'>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filtersQuery = useSourceFilters();
  const listQuery = useSourceCompanies({ page, limit: PAGE_SIZE, source, category });

  const companies = listQuery.data?.data ?? [];
  const sortedCompanies = useMemo(() => {
    const cloned = [...companies];
    cloned.sort((a, b) => {
      const aValue =
        sortColumn === 'business'
          ? a.title ?? ''
          : sortColumn === 'source'
          ? a.source ?? ''
          : sortColumn === 'category'
          ? a.category ?? ''
          : sortColumn === 'created'
          ? a.created ?? 0
          : a.mupDate ? new Date(a.mupDate).getTime() : 0;
      const bValue =
        sortColumn === 'business'
          ? b.title ?? ''
          : sortColumn === 'source'
          ? b.source ?? ''
          : sortColumn === 'category'
          ? b.category ?? ''
          : sortColumn === 'created'
          ? b.created ?? 0
          : b.mupDate ? new Date(b.mupDate).getTime() : 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const compare = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? compare : -compare;
    });
    return cloned;
  }, [companies, sortColumn, sortDirection]);

  const handleSort = (column: 'business' | 'source' | 'category' | 'created' | 'followUpDate') => {
    const next = toggleSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const meta = listQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : 1;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">
            <Link to={adminRoutes.dashboard} className="hover:underline">Console</Link>
            {' › '}
            <Link to={adminRoutes.companies} className="hover:underline">Companies</Link>
            {' › '}
            <span className="text-gray-700">Sources</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
            {t('companies.sources', 'Sources')}
          </h1>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg" asChild>
          <Link to={adminRoutes.companies}>All Companies</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
        {/* Source filter */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">SOURCE</div>
          <div className="flex flex-wrap gap-2">
            <FilterBadge
              label="All"
              count={filtersQuery.data?.sources.reduce((s, x) => s + x.count, 0) ?? 0}
              active={!source}
              onClick={() => { setSource(undefined); setPage(1); }}
            />
            {(filtersQuery.data?.sources ?? []).map((s) => (
              <FilterBadge
                key={s.label}
                label={s.label}
                count={s.count}
                active={source === s.label}
                color={SOURCE_COLORS[s.label] ?? '#9ca3af'}
                onClick={() => { setSource(s.label === source ? undefined : s.label); setPage(1); }}
              />
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="pt-4 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">CATEGORY</div>
          <div className="flex flex-wrap gap-2">
            <FilterBadge
              label="All"
              count={filtersQuery.data?.categories.reduce((s, x) => s + x.count, 0) ?? 0}
              active={!category}
              onClick={() => { setCategory(undefined); setPage(1); }}
            />
            {(filtersQuery.data?.categories ?? []).map((c) => (
              <FilterBadge
                key={c.label}
                label={c.label}
                count={c.count}
                active={category === c.label}
                color={CATEGORY_COLORS[c.label] ?? '#9ca3af'}
                onClick={() => { setCategory(c.label === category ? undefined : c.label); setPage(1); }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <SortableTableHead column="business" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business</SortableTableHead>
                <SortableTableHead column="source" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</SortableTableHead>
                <SortableTableHead column="category" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</SortableTableHead>
                <SortableTableHead column="created" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</SortableTableHead>
                <SortableTableHead column="followUpDate" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Follow-up Date</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">Loading…</TableCell>
                </TableRow>
              ) : listQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-red-600 py-8">
                    Failed to load companies: {(listQuery.error as Error)?.message ?? 'Unknown error'}
                  </TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">No companies found.</TableCell>
                </TableRow>
              ) : (
                sortedCompanies.map((c) => (
                  <TableRow key={c.nid} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <Link
                        to={adminRoutes.companyDetail.replace(':id', String(c.nid))}
                        className="text-[#0d0e0e] hover:underline"
                      >
                        {c.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-600">{c.source}</TableCell>
                    <TableCell>
                      {c.category ? (
                        <span
                          className="inline-block text-xs font-medium px-2.5 py-0.5 rounded border"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[c.category] ?? '#9ca3af'}15`,
                            color: CATEGORY_COLORS[c.category] ?? '#6b7280',
                            borderColor: `${CATEGORY_COLORS[c.category] ?? '#9ca3af'}33`,
                          }}
                        >
                          {c.category}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-gray-600">{formatDate(c.created)}</TableCell>
                    <TableCell className="text-gray-600">{c.mupDate ? new Date(c.mupDate).toLocaleDateString('da-DK') : '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {from}–{to} of {total} companies
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-sm text-gray-700 px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
