import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical } from 'lucide-react';
import { adminRoutes } from '../routes';
import {
  useAdminHandbookBooks,
  useAdminHandbookBookTree,
  useBulkReorderAdminHandbookBook,
} from '../handbook-hooks';
import type { AdminHandbookTreeNode } from '../handbook-types';

interface FlatRow {
  nid: number;
  pid: number; // 0 = top-level (parent is the book root)
  depth: number;
  title: string;
}

function flatten(nodes: AdminHandbookTreeNode[], parentPid: number = 0): FlatRow[] {
  const out: FlatRow[] = [];
  for (const n of nodes) {
    out.push({
      nid: n.nid,
      pid: parentPid,
      depth: n.depth,
      title: n.title,
    });
    if (n.children.length > 0) {
      out.push(...flatten(n.children, n.nid));
    }
  }
  return out;
}

export const AdminBookEditOrderPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { bid: bidParam } = useParams<{ bid: string }>();
  const bid = bidParam ? Number(bidParam) : null;

  const { data: books = [] } = useAdminHandbookBooks();
  const book = books.find((b) => b.nid === bid);

  const { data: tree = [], isLoading, isError } = useAdminHandbookBookTree(bid);
  const reorder = useBulkReorderAdminHandbookBook();

  const [rows, setRows] = useState<FlatRow[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && tree.length >= 0) {
      setRows(flatten(tree));
    }
  }, [tree, isLoading]);

  const handleTitleChange = (nid: number, value: string) => {
    setRows((prev) => prev.map((r) => (r.nid === nid ? { ...r, title: value } : r)));
  };

  const handleDragStart = (idx: number) => () => {
    setDragIndex(idx);
  };
  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setOverIndex(idx);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };
  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex == null || dragIndex === idx) {
      handleDragEnd();
      return;
    }
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    handleDragEnd();
  };

  const itemsToSave = useMemo(() => {
    // Assign sequential weights within each pid group based on current order.
    const weightByPid = new Map<number, number>();
    return rows.map((r) => {
      const w = weightByPid.get(r.pid) ?? 0;
      weightByPid.set(r.pid, w + 1);
      return {
        nid: r.nid,
        pid: r.pid === 0 ? null : r.pid,
        weight: w,
        title: r.title.trim(),
      };
    });
  }, [rows]);

  const handleSave = async () => {
    if (!bid) return;
    setSavedAt(null);
    try {
      await reorder.mutateAsync({ bid, items: itemsToSave });
      setSavedAt(Date.now());
    } catch {
      // error surfaced via reorder.isError
    }
  };

  if (!bid) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="text-sm text-red-600">{t('books.unknownBook', 'Unknown book')}</div>
      </div>
    );
  }

  const bookTitle = book?.title ?? t('books.unknownBook', 'Unknown book');

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">{t('nav.console', 'Console')}</Link>
          {' › '}
          <Link to={adminRoutes.books} className="hover:underline">{t('books.indexTitle', 'Books')}</Link>
          {' › '}
          <span className="text-gray-700">{t('books.editOrderBreadcrumb', 'Edit Order and Titles')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">{bookTitle}</h1>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_120px] items-center px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <div>{t('books.colTitle', 'Title')}</div>
          <div className="text-right">{t('books.colActions', 'Actions')}</div>
        </div>

        {isLoading && (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">{t('books.loadingTree', 'Loading…')}</div>
        )}
        {isError && !isLoading && (
          <div className="px-4 py-6 text-sm text-red-600 text-center">{t('books.loadError', 'Failed to load books.')}</div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">{t('books.emptyBook', 'This book has no pages yet.')}</div>
        )}

        {!isLoading && rows.map((row, idx) => {
          const indentPx = Math.max(0, (row.depth - 1)) * 24;
          const isDragging = dragIndex === idx;
          const isOver = overIndex === idx && dragIndex !== idx;
          return (
            <div
              key={row.nid}
              draggable
              onDragStart={handleDragStart(idx)}
              onDragOver={handleDragOver(idx)}
              onDrop={handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={[
                'grid grid-cols-[1fr_120px] items-center px-4 py-2 border-b border-gray-100',
                isDragging ? 'opacity-50' : '',
                isOver ? 'bg-blue-50' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-2" style={{ paddingLeft: indentPx }}>
                <button
                  type="button"
                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0"
                  aria-label={t('books.dragHandle', 'Drag handle')}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <Input
                  value={row.title}
                  onChange={(e) => handleTitleChange(row.nid, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={adminRoutes.handbookPageTab
                      .replace(':nid', String(row.nid))
                      .replace(':tab', 'edit')}
                  >
                    {t('books.view', 'View')}
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3">
        {reorder.isError && (
          <span className="text-sm text-red-600">{t('books.saveFailed', 'Failed to save pages.')}</span>
        )}
        {savedAt && !reorder.isError && !reorder.isPending && (
          <span className="text-sm text-emerald-600">{t('books.saveSuccess', 'Pages saved.')}</span>
        )}
        <Button
          onClick={handleSave}
          disabled={reorder.isPending || isLoading || rows.length === 0}
          className="bg-[#0d0e0e] text-white hover:bg-black"
        >
          {reorder.isPending ? t('books.saving', 'Saving…') : t('books.savePages', 'Save pages')}
        </Button>
      </div>
    </div>
  );
};
