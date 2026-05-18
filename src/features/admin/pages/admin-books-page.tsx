import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { adminRoutes } from '../routes';
import { useAdminHandbookBooks } from '../handbook-hooks';

export const AdminBooksPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data: books = [], isLoading, isError } = useAdminHandbookBooks();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <div className="text-sm text-gray-500">
          <span className="text-gray-700">{t('books.indexTitle', 'Books')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
          {t('books.indexTitle', 'Books')}
        </h1>
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
                <TableHead>{t('books.colBook', 'Book')}</TableHead>
                <TableHead className="w-[220px] text-right">{t('books.colActions', 'Actions')}</TableHead>
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
              {!isLoading && !isError && books.map((book) => (
                <TableRow key={book.nid}>
                  <TableCell>
                    <Link
                      to={adminRoutes.handbookTableOfContents}
                      state={{ bid: book.nid }}
                      className="text-blue-600 hover:underline"
                    >
                      {book.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={adminRoutes.bookEditOrder.replace(':bid', String(book.nid))}>
                        {t('books.editOrderAndTitles', 'Edit order and titles')}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
