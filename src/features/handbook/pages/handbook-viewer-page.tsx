import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { useHandbookPages } from '@/lib/api-hooks';
import type { HandbookPage } from '@/lib/api-types';
import { handbookApi, type HandbookViewerPageMeta } from '../api';
import { Check, Loader2 } from 'lucide-react';
import { useAppearance } from '@/context/appearance-context';

interface HandbookPageWithChildren extends HandbookPage {
  children: HandbookPageWithChildren[];
}

function findPageByNid(nodes: HandbookPageWithChildren[], nid: number): HandbookPageWithChildren | null {
  for (const node of nodes) {
    if (node.nid === nid) return node;
    if (node.children?.length) {
      const found = findPageByNid(node.children, nid);
      if (found) return found;
    }
  }
  return null;
}

export const HandbookViewerPage: React.FC = () => {
  const { handbookId } = useParams<{ handbookId: string }>();
  const { getColor } = useAppearance();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [contentHtml, setContentHtml] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<Error | null>(null);
  const [viewerMeta, setViewerMeta] = useState<HandbookViewerPageMeta | null>(null);
  const [signingReceipt, setSigningReceipt] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const trackedViewNids = useRef<Set<number>>(new Set());
  const limit = 50;
  const langcode = 'da';

  const { data: pages, loading: pagesLoading, error: pagesError } = useHandbookPages(
    handbookId ? { handbookId, page: 1, limit, langcode } : null
  );

  const fetchContent = useCallback(async (nid: number) => {
    setContentLoading(true);
    setContentError(null);
    setViewerMeta(null);
    setSignedAt(null);
    try {
      const [html, meta] = await Promise.all([
        handbookApi.getHandbookContent(nid),
        handbookApi.getHandbookViewerPageMeta(nid).catch(() => null),
      ]);
      setContentHtml(html);
      setViewerMeta(meta ?? null);
    } catch (err) {
      setContentError(err instanceof Error ? err : new Error('Failed to load page content'));
      setContentHtml(null);
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPageId) {
      setContentHtml(null);
      setContentError(null);
      setViewerMeta(null);
      setSignedAt(null);
      return;
    }
    const nid = Number(selectedPageId);
    if (!Number.isFinite(nid)) return;
    fetchContent(nid);
  }, [selectedPageId, fetchContent]);

  // Track view once per page per session (avoids excessive DB writes on quick toggles)
  useEffect(() => {
    if (!selectedPageId || contentLoading) return;
    const nid = Number(selectedPageId);
    if (!Number.isFinite(nid) || trackedViewNids.current.has(nid)) return;
    trackedViewNids.current.add(nid);
    handbookApi.trackHandbookView(nid).catch(() => {
      trackedViewNids.current.delete(nid);
    });
  }, [selectedPageId, contentLoading]);

  // Build tree structure from pages (handle missing parentId/weight gracefully)
  const buildTree = (pagesList: HandbookPage[]): HandbookPageWithChildren[] => {
    if (pagesList.some((p) => (p as HandbookPage & { parentId?: number }).parentId !== undefined)) {
      const pageMap = new Map<number, HandbookPageWithChildren>();
      const roots: HandbookPageWithChildren[] = [];
      pagesList.forEach((page) => {
        pageMap.set(page.nid, { ...page, children: [] });
      });
      pagesList.forEach((page) => {
        const pageWithChildren = pageMap.get(page.nid)!;
        const parentId = (page as HandbookPage & { parentId?: number }).parentId ?? null;
        if (parentId === null || !pageMap.has(parentId)) {
          roots.push(pageWithChildren);
        } else {
          pageMap.get(parentId)!.children.push(pageWithChildren);
        }
      });
      const sortPages = (nodes: HandbookPageWithChildren[]): HandbookPageWithChildren[] =>
        nodes
          .sort((a, b) => {
            const wa = (a as HandbookPage & { weight?: number }).weight ?? 0;
            const wb = (b as HandbookPage & { weight?: number }).weight ?? 0;
            if (wa !== wb) return wa - wb;
            return a.title.localeCompare(b.title);
          })
          .map((node) => ({ ...node, children: sortPages(node.children) }));
      return sortPages(roots);
    }
    return pagesList.map((page) => ({ ...page, children: [] }));
  };

  const pagesArray = Array.isArray(pages) ? pages : [];
  const treePages = pagesArray.length > 0 ? buildTree(pagesArray) : [];

  if (!handbookId) {
    return (
      <PageShell>
        <PageHeader title="Handbook Viewer" />
        <div className="text-red-500">Handbook ID is required</div>
      </PageShell>
    );
  }

  if (pagesLoading) {
    return (
      <PageShell>
        <PageHeader title="Handbook Viewer" />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading handbook pages...</div>
        </div>
      </PageShell>
    );
  }

  if (pagesError) {
    return (
      <PageShell>
        <PageHeader title="Handbook Viewer" />
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error: {pagesError.message}</div>
        </div>
      </PageShell>
    );
  }

  const renderTree = (nodes: HandbookPageWithChildren[], depth = 0): React.ReactNode => {
    if (!nodes || nodes.length === 0) {
      return (
        <div className="text-sm text-gray-500 py-4">No pages found</div>
      );
    }

    return nodes.map((node) => (
      <div key={node.nid} className="mb-1">
        <button
          onClick={() => setSelectedPageId(String(node.nid))}
          className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors ${selectedPageId === String(node.nid)
            ? 'bg-gray-200 font-semibold border-l-2 border-blue-500'
            : 'border-l-2 border-transparent'
            }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        >
          <div className="font-medium text-sm">{node.title}</div>
          {node.status !== undefined && (
            <div className="text-xs text-gray-500 mt-1">
              Status: {node.status === 1 ? 'Active' : 'Inactive'}
            </div>
          )}
        </button>
        {node.children.length > 0 && (
          <div className="ml-2">
            {renderTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <PageShell>
      <PageHeader title="Handbook Viewer" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Tree */}
        <div className="lg:col-span-1 border-r pr-4">
          <h2 className="font-semibold mb-4">
            Pages {pagesArray.length > 0 && `(${pagesArray.length})`}
          </h2>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {pagesArray.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No pages found
              </div>
            ) : (
              renderTree(treePages)
            )}
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-2">
          {!selectedPageId ? (
            <div className="text-center py-12 text-gray-500">
              Select a page from the sidebar to view its content
            </div>
          ) : contentLoading ? (
            <div className="text-center py-12 text-gray-500">Loading page content...</div>
          ) : contentError ? (
            <div className="text-center py-12 text-red-500">Error: {contentError.message}</div>
          ) : (
            <>
              {selectedPageId && (() => {
                const nid = Number(selectedPageId);
                const selectedPage = findPageByNid(treePages, nid);
                const effectiveSignedAt =
                  signedAt ?? viewerMeta?.trackingStatus?.signedAt ?? viewerMeta?.signedAt ?? null;
                const effectiveViewedAt =
                  viewerMeta?.trackingStatus?.viewedAt ?? viewerMeta?.viewedAt ?? null;
                const showReceiptButton =
                  viewerMeta?.field_receipt_value === 1 && effectiveSignedAt === null;

                const formatDate = (value: string | number) => {
                  try {
                    const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
                    if (Number.isNaN(date.getTime())) return String(value);
                    return date.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                  } catch {
                    return String(value);
                  }
                };

                return (
                  <div className="prose max-w-none" style={{ backgroundColor: getColor('pageBackground') }}>
                    {selectedPage && (
                      <h1 className="text-2xl font-bold mb-4" style={{ color: getColor('headlines') }}>{selectedPage.title}</h1>
                    )}
                    {(effectiveViewedAt || effectiveSignedAt) && (
                      <div className="text-sm text-[#6b7280] mb-4 space-y-1">
                        {effectiveViewedAt && (
                          <p>You last viewed this page on {formatDate(effectiveViewedAt)}</p>
                        )}
                        {effectiveSignedAt && (
                          <p className="flex items-center gap-1.5 text-[#0d9488]">
                            <Check className="h-4 w-4 shrink-0" />
                            Signed on {formatDate(effectiveSignedAt)}
                          </p>
                        )}
                      </div>
                    )}
                    {contentHtml === '' || contentHtml === null ? (
                      <EmptyState />
                    ) : (
                      <div
                        className="border-t pt-4 handbook-content handbook-themed-content"
                        style={{ borderColor: getColor('frameColor') }}
                        dangerouslySetInnerHTML={{ __html: contentHtml }}
                      />
                    )}
                    {showReceiptButton && (
                      <div className="mt-6 pt-4 border-t" style={{ borderColor: getColor('frameColor') }}>
                        <Button
                          onClick={async () => {
                            setSigningReceipt(true);
                            try {
                              await handbookApi.signHandbookReceipt(nid);
                              setSignedAt(new Date().toISOString());
                            } finally {
                              setSigningReceipt(false);
                            }
                          }}
                          disabled={signingReceipt}
                          className="rounded-[8px] px-4 py-2"
                          style={{ backgroundColor: getColor('confirmationButton'), color: getColor('buttonText') }}
                        >
                          {signingReceipt ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                              Signing…
                            </>
                          ) : (
                            'I have read this'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
};

