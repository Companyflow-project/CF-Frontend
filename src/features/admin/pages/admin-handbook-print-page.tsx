import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueries } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminHandbookBooks, useAdminHandbookBookTree } from '../handbook-hooks';
import { adminHandbookApi } from '../handbook-api';
import { adminRoutes } from '../routes';
import type { AdminHandbookTreeNode, AdminHandbookPageDetail } from '../handbook-types';

function flatten(nodes: AdminHandbookTreeNode[]): AdminHandbookTreeNode[] {
  const out: AdminHandbookTreeNode[] = [];
  const walk = (list: AdminHandbookTreeNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

function headingTag(depth: number): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  const level = Math.min(Math.max(depth + 1, 2), 6);
  return (`h${level}`) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const AdminHandbookPrintPage: React.FC = () => {
  const { t, i18n } = useTranslation('admin');
  const langcode = i18n.language?.startsWith('en') ? 'en' : 'da';
  const [bid, setBid] = useState<number | null>(null);

  const { data: books = [] } = useAdminHandbookBooks();
  const { data: tree = [], isLoading: treeLoading } = useAdminHandbookBookTree(bid, langcode);

  const flatNodes = useMemo(() => flatten(tree), [tree]);

  const pageQueries = useQueries({
    queries: flatNodes.map((n) => ({
      queryKey: ['admin-handbook-page', n.nid, langcode],
      queryFn: () => adminHandbookApi.getPage(n.nid, langcode),
      staleTime: 60_000,
    })),
  });

  const loadedCount = pageQueries.filter((q) => q.data).length;
  const totalCount = flatNodes.length;
  // Settled = the query has either resolved or errored. We never want to lock
  // the Print button forever just because one page failed to fetch.
  const settledCount = pageQueries.filter((q) => !q.isPending).length;
  const allSettled = bid !== null && totalCount > 0 && settledCount === totalCount;

  const selectedBook = books.find((b) => b.nid === bid);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <style>{`
        @media print {
          @page { margin: 2cm; }
          .print-hidden { display: none !important; }
          .print-page { page-break-after: always; }
          .print-page:last-child { page-break-after: auto; }
          body { background: white; }
          .print-article { padding: 0; }
        }
      `}</style>

      <div className="print-hidden">
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">{t('nav.console', 'Console')}</Link>
          {' › '}
          <Link to={adminRoutes.handbook} className="hover:underline">{t('handbook.title', 'Management Handbook')}</Link>
          {' › '}
          <span className="text-gray-700">{t('handbookPrint.breadcrumb', 'Printer-Friendly version')}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e]">
            {t('handbookPrint.title', 'Printer-Friendly version')}
          </h1>
          <Button
            onClick={handlePrint}
            disabled={bid === null}
            className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
          >
            <Printer className="h-4 w-4 mr-2" />
            {t('handbookPrint.print', 'Print')}
          </Button>
        </div>
      </div>

      <div className="print-hidden border border-gray-200 rounded-xl p-4 sm:p-6">
        <label className="block text-sm font-medium text-[#0d0e0e] mb-2">
          {t('handbookPrint.chooseBook', 'Choose a handbook')}
        </label>
        <select
          value={bid ?? ''}
          onChange={(e) => setBid(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">{t('handbookPrint.nothingSelected', '– Nothing selected –')}</option>
          {books.map((b) => (
            <option key={b.nid} value={b.nid}>{b.title}</option>
          ))}
        </select>

        {bid && !allSettled && (
          <p className="text-xs text-gray-500 mt-3">
            {t('handbookPrint.loading', 'Loading pages ({{loaded}} / {{total}})…', { loaded: loadedCount, total: totalCount })}
          </p>
        )}
      </div>

      {bid !== null && selectedBook && (
        <article className="print-article bg-white border border-gray-200 rounded-xl p-6 sm:p-10 print:border-0 print:rounded-none">
          <h1 className="text-3xl font-bold text-[#0d0e0e] mb-6 print-page">
            {selectedBook.title}
          </h1>

          {treeLoading && (
            <p className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</p>
          )}

          {!treeLoading && flatNodes.length === 0 && (
            <p className="text-sm text-gray-500">{t('handbookPrint.empty', 'This handbook has no pages yet.')}</p>
          )}

          {flatNodes.map((node, idx) => {
            const q = pageQueries[idx];
            const page = q.data as AdminHandbookPageDetail | undefined;
            const Heading = headingTag(node.depth);

            return (
              <section key={node.nid} className="print-page mb-8">
                <Heading className="font-semibold text-[#0d0e0e] mb-3" style={{ fontSize: `${Math.max(1.5 - node.depth * 0.15, 1)}rem` }}>
                  {node.title}
                </Heading>
                {q.isLoading && (
                  <p className="text-xs text-gray-400">{t('handbook.common.loading', 'Loading…')}</p>
                )}
                {q.isError && (
                  <p className="text-xs text-red-500">{t('handbookPrint.pageError', 'Failed to load this page.')}</p>
                )}
                {page && page.body ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: page.body }}
                  />
                ) : page ? (
                  <p className="text-xs text-gray-400 italic">{t('handbook.preview.noContent', 'No content yet.')}</p>
                ) : null}
              </section>
            );
          })}
        </article>
      )}
    </div>
  );
};
