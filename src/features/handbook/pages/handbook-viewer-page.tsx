import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { useHandbookPages, usePageContent } from '@/lib/api-hooks';
import type { HandbookPage } from '@/lib/api-types';

interface HandbookPageWithChildren extends HandbookPage {
  children: HandbookPageWithChildren[];
}

export const HandbookViewerPage: React.FC = () => {
  const { handbookId } = useParams<{ handbookId: string }>();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const limit = 50;
  const langcode = 'da';

  const { data: pages, loading: pagesLoading, error: pagesError } = useHandbookPages(
    handbookId ? { handbookId, page: 1, limit, langcode } : null
  );

  const { data: pageContent, loading: contentLoading, error: contentError } = usePageContent(
    selectedPageId ? { pageId: selectedPageId, langcode } : null
  );

  // Debug logging
  React.useEffect(() => {
    console.log('Selected Page ID:', selectedPageId);
    console.log('Page Content:', pageContent);
    console.log('Content Loading:', contentLoading);
    console.log('Content Error:', contentError);
  }, [selectedPageId, pageContent, contentLoading, contentError]);

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

  // Build tree structure from pages (handle missing parentId/weight gracefully)
  const buildTree = (pages: HandbookPage[]): HandbookPageWithChildren[] => {
    // If we have parentId and weight, build a proper tree
    if (pages.some((p) => p.parentId !== undefined)) {
      const pageMap = new Map<number, HandbookPageWithChildren>();
      const roots: HandbookPageWithChildren[] = [];

      // Create map of all pages
      pages.forEach((page) => {
        pageMap.set(page.nid, { ...page, children: [] });
      });

      // Build tree
      pages.forEach((page) => {
        const pageWithChildren = pageMap.get(page.nid)!;
        const parentId = page.parentId ?? null;
        if (parentId === null || !pageMap.has(parentId)) {
          roots.push(pageWithChildren);
        } else {
          const parent = pageMap.get(parentId)!;
          parent.children.push(pageWithChildren);
        }
      });

      // Sort by weight if available, otherwise by title
      const sortPages = (nodes: HandbookPageWithChildren[]): HandbookPageWithChildren[] => {
        return nodes
          .sort((a, b) => {
            if (a.weight !== undefined && b.weight !== undefined) {
              return a.weight - b.weight;
            }
            return a.title.localeCompare(b.title);
          })
          .map((node) => ({
            ...node,
            children: sortPages(node.children),
          }));
      };

      return sortPages(roots);
    }

    // Otherwise, just return a flat list as roots
    return pages.map((page) => ({ ...page, children: [] }));
  };

  // Build tree from pages - handle null/undefined
  const pagesArray = Array.isArray(pages) ? pages : [];
  const treePages = pagesArray.length > 0 ? buildTree(pagesArray) : [];

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
          ) : !pageContent ? (
            <EmptyState />
          ) : (
            <div className="prose max-w-none">
              <h1 className="text-2xl font-bold mb-4">{pageContent.title}</h1>
              <div className="text-sm text-gray-500 mb-4">
                Last updated: {new Date(pageContent.changed * 1000).toLocaleDateString()}
              </div>
              {/* Render page content - structure depends on backend response */}
              <div className="border-t pt-4">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(pageContent, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

