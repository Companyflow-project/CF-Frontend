import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { adminRoutes } from '../routes';
import { useAdminHandbookBooks, useDeleteAdminHandbookBook } from '../handbook-hooks';
import { SortableTableHead, toggleSort, type SortDirection } from '../components/sortable-table-head';
import { DeleteBookDialog } from '../components/delete-book-dialog';

const DEFAULT_PAGE_SIZE = 25;

export const AdminBooksPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data: books = [], isLoading, isError } = useAdminHandbookBooks();
  const deleteMutation = useDeleteAdminHandbookBook();
  const [deleteTarget, setDeleteTarget] = useState<{ bid: number; title: string } | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const { bid, title } = deleteTarget;
    deleteMutation.mutate(bid, {
      onSuccess: () => {
        toast.success(t('books.delete.success', { defaultValue: 'Deleted "{{title}}"', title }));
        setDeleteTarget(null);
      },
      onError: (e: unknown) => {
        const msg = (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message;
        toast.error(msg ?? t('books.delete.failed', 'Could not delete book'));
      },
    });
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortColumn, setSortColumn] = useState<'book'>('book');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedBooks = useMemo(() => {
    const cloned = [...books];
    cloned.sort((a, b) => {
      const compare = (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? compare : -compare;
    });
    return cloned;
  }, [books, sortDirection]);

  const total = sortedBooks.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * limit;
  const pageBooks = useMemo(
    () => sortedBooks.slice(startIdx, startIdx + limit),
    [sortedBooks, startIdx, limit],
  );
  const handleSort = (column: 'book') => {
    const next = toggleSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const showingFrom = total === 0 ? 0 : startIdx + 1;
  const showingTo = Math.min(startIdx + limit, total);

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.accountDashboard} className="hover:underline">
            {t('books.breadcrumb.account', 'Account')}
          </Link>
          <span className="mx-1">›</span>
          <Link to={adminRoutes.accountDashboard} className="hover:underline">
            {t('books.breadcrumb.superadminDashboard', 'Superadmin Dashboard')}
          </Link>
          <span className="mx-1">›</span>
          <span className="text-gray-700">{t('books.manageTitle', 'Manage Books')}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e]">
            {t('books.manageTitle', 'Manage Books')}
          </h1>
          <Button
            asChild
            className="bg-[#1a8a5a] hover:bg-[#16774e] text-white rounded-lg self-start sm:self-auto"
          >
            <Link to={adminRoutes.booksCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('books.createBook', 'Create Book')}
            </Link>
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2 max-w-3xl">
          {t(
            'books.indexDescription',
            'The Book module allows you to collect related pages into a book. Links to surrounding pages are automatically displayed, making it easy to create and navigate structured content.',
          )}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#0d0e0e] mb-3">
          {t('books.sectionHeading', 'Books')}
        </h2>

        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="book" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort}>{t('books.colBook', 'Book')}</SortableTableHead>
                <TableHead className="w-[280px] text-right">{t('books.colActions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-sm text-gray-500 py-6 text-center">
                    {t('books.loading', 'Loading books…')}
                  </TableCell>
                </TableRow>
              )}
              {isError && !isLoading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-sm text-red-600 py-6 text-center">
                    {t('books.loadError', 'Failed to load books.')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && books.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-sm text-gray-500 py-6 text-center">
                    {t('books.empty', 'No books found.')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && pageBooks.map((book) => (
                <TableRow key={book.nid}>
                  <TableCell>
                    <Link
                      to={adminRoutes.bookEditOrder.replace(':bid', String(book.nid))}
                      className="text-blue-600 hover:underline"
                    >
                      {book.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={adminRoutes.bookEditOrder.replace(':bid', String(book.nid))}>
                          {t('books.editOrderAndTitles', 'Edit order and titles')}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteTarget({ bid: book.nid, title: book.title ?? '' })}
                      >
                        {t('books.delete.action', 'Delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!isLoading && !isError && total > 0 && (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-4">
            <p className="text-sm text-gray-500 text-center lg:text-left">
              {t('common.showing', 'Showing')}{' '}
              <span className="font-medium text-gray-700">{showingFrom}–{showingTo}</span>{' '}
              {t('common.of', 'of')}{' '}
              <span className="font-medium text-gray-700">{total}</span>{' '}
              {t('books.booksLower', 'books')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-gray-600 hover:text-gray-900"
              >
                ← {t('common.previous', 'Prev')}
              </Button>

              {getPageNumbers().map((pg, idx) =>
                pg === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                ) : (
                  <Button
                    key={pg}
                    variant={pg === currentPage ? 'default' : 'ghost'}
                    size="sm"
                    className={pg === currentPage
                      ? 'bg-gray-900 text-white hover:bg-gray-800 h-8 w-8 p-0 rounded-md'
                      : 'text-gray-600 hover:text-gray-900 h-8 w-8 p-0 rounded-md'}
                    onClick={() => setPage(pg)}
                  >
                    {pg}
                  </Button>
                ),
              )}

              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-gray-600 hover:text-gray-900"
              >
                {t('common.next', 'Next')} →
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('common.show', 'Show')}</span>
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
              <span className="text-sm text-gray-500">{t('common.perPage', 'per page')}</span>
            </div>
          </div>
        )}
      </div>

      <DeleteBookDialog
        open={deleteTarget !== null}
        bookTitle={deleteTarget?.title ?? ''}
        pending={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => { if (!deleteMutation.isPending) setDeleteTarget(null); }}
      />
    </div>
  );
};
