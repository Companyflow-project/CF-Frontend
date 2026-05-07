import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { adminRoutes } from '../routes';
import { useAdminHandbookBooks, useAdminHandbookBookTree } from '../handbook-hooks';
import type { AdminHandbookTreeNode } from '../handbook-types';
import { HandbookHelpSection } from '../components/handbook/help-section';

const MANAGEMENT_HANDBOOK_BID = 206;

function flatten(nodes: AdminHandbookTreeNode[], parentChain: string[] = []): Array<{ node: AdminHandbookTreeNode; path: string[] }> {
  const out: Array<{ node: AdminHandbookTreeNode; path: string[] }> = [];
  for (const n of nodes) {
    const path = [...parentChain, n.title];
    out.push({ node: n, path });
    if (n.children.length > 0) {
      out.push(...flatten(n.children, path));
    }
  }
  return out;
}

function TreeRender({ nodes }: { nodes: AdminHandbookTreeNode[] }) {
  return (
    <ul className="text-sm">
      {nodes.map(n => (
        <li key={n.nid} className="py-0.5">
          <span className="text-gray-500 mr-1">·</span>
          <Link
            to={adminRoutes.handbookPage.replace(':nid', String(n.nid))}
            className="text-blue-600 hover:underline"
          >
            {n.title}
          </Link>
          {n.children.length > 0 && (
            <div className="pl-5 border-l border-gray-100 ml-1 mt-0.5">
              <TreeRender nodes={n.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export const AdminHandbookBrowsePage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data: books = [], isLoading: booksLoading } = useAdminHandbookBooks();
  const [selectedBid, setSelectedBid] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const managementHandbookBook = books.find((b) => b.nid === MANAGEMENT_HANDBOOK_BID);
  const defaultBid = managementHandbookBook?.nid ?? books[0]?.nid ?? null;
  const bid = selectedBid ?? defaultBid;
  const { data: tree = [], isLoading: treeLoading } = useAdminHandbookBookTree(bid);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const term = search.toLowerCase();
    return flatten(tree).filter(({ node, path }) =>
      node.title.toLowerCase().includes(term) || path.some(p => p.toLowerCase().includes(term))
    );
  }, [tree, search]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">
            <Link to={adminRoutes.dashboard} className="hover:underline">{t('nav.console', 'Console')}</Link>
            {' › '}
            <Link to={adminRoutes.handbook} className="hover:underline">{t('handbook.title', 'Management Handbook')}</Link>
            {' › '}
            <span className="text-gray-700">{t('handbook.tabs.toc', 'Table of Contents')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">{t('handbook.title', 'Management Handbook')}</h1>
        </div>
        <Button variant="outline" size="sm" asChild className="self-start sm:self-auto">
          <Link to={adminRoutes.handbookPrint}>
            <Printer className="h-4 w-4 mr-1.5" />
            {t('handbook.print', 'Printer-Friendly version')}
          </Link>
        </Button>
      </div>

      <HandbookHelpSection />

      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">{t('handbook.browse.book', 'Book')}</label>
          <select
            value={bid ?? ''}
            onChange={(e) => setSelectedBid(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            disabled={booksLoading || books.length === 0}
          >
            {books.length === 0 && <option value="">{t('handbook.browse.noBooks', 'No books')}</option>}
            {books.map(b => (
              <option key={b.nid} value={b.nid}>{b.title}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">{t('handbook.common.search', 'Search')}</label>
          <div className="flex gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('handbook.browse.searchPlaceholder', 'Search the handbook…')} />
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setSearch(search)}>
              {t('handbook.common.search', 'Search')}
            </Button>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white p-4 sm:p-6">
        {treeLoading && <div className="text-sm text-gray-500">{t('handbook.browse.loading', 'Loading tree…')}</div>}
        {!treeLoading && tree.length === 0 && (
          <div className="text-sm text-gray-500">{t('handbook.browse.empty', 'This book has no pages yet.')}</div>
        )}

        {!treeLoading && filtered && (
          <ul className="text-sm space-y-1">
            {filtered.length === 0 && <li className="text-gray-500">{t('handbook.browse.noMatches', 'No matches.')}</li>}
            {filtered.map(({ node, path }) => (
              <li key={node.nid}>
                <Link
                  to={adminRoutes.handbookPage.replace(':nid', String(node.nid))}
                  className="text-blue-600 hover:underline"
                >
                  {node.title}
                </Link>
                <span className="text-xs text-gray-400 ml-2">
                  {path.slice(0, -1).join(' › ')}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!treeLoading && !filtered && tree.length > 0 && <TreeRender nodes={tree} />}
      </div>
    </div>
  );
};
