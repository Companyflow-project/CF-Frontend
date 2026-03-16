import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { handbookApi, type HandbookViewerPageMeta } from '../api';
import { ArrowLeft, Check, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAppearance } from '@/context/appearance-context';
import { resolveHtmlUrls } from '@/lib/utils';

interface FlatPage {
  id: number;
  title: string;
  chapterTitle: string;
  html: string;
}

export const HandbookViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('handbook');
  const { getColor } = useAppearance();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flatPages, setFlatPages] = useState<FlatPage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewerMeta, setViewerMeta] = useState<HandbookViewerPageMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [signingReceipt, setSigningReceipt] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const trackedViewNids = useRef<Set<number>>(new Set());

  // Fetch handbook tree, then pre-fetch content for all ready pages, keep only those with content
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const { chapters } = await handbookApi.getHandbookTree(i18n.language);

        // Collect all ready pages from chapters
        const candidates: { id: number; title: string; chapterTitle: string }[] = [];
        for (const chapter of chapters) {
          if (chapter.type !== 'chapter') continue;
          const chapterPages = (chapter.pages || []).filter(
            (p) => (p.status as string) === 'ready'
          );
          for (const page of chapterPages) {
            candidates.push({ id: page.id, title: page.title, chapterTitle: chapter.title });
          }
        }

        // Pre-fetch content for all pages in parallel
        const results = await Promise.all(
          candidates.map(async (page) => {
            try {
              const html = await handbookApi.getHandbookContent(page.id);
              return { ...page, html: html || '' };
            } catch {
              return { ...page, html: '' };
            }
          })
        );

        setFlatPages(results);
      } catch (err: any) {
        setError(err.message || 'Failed to load handbook');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [i18n.language]);

  const totalPages = flatPages.length;
  const currentPageData = flatPages[currentPage - 1] ?? null;

  // Fetch viewer meta (receipt/tracking) when page changes
  useEffect(() => {
    if (!currentPageData) {
      setViewerMeta(null);
      setSignedAt(null);
      return;
    }
    setMetaLoading(true);
    setSignedAt(null);
    handbookApi.getHandbookViewerPageMeta(currentPageData.id)
      .then((meta) => setViewerMeta(meta ?? null))
      .catch(() => setViewerMeta(null))
      .finally(() => setMetaLoading(false));
  }, [currentPageData?.id]);

  // Track view once per page per session
  useEffect(() => {
    if (!currentPageData) return;
    const nid = currentPageData.id;
    if (trackedViewNids.current.has(nid)) return;
    trackedViewNids.current.add(nid);
    handbookApi.trackHandbookView(nid).catch(() => {
      trackedViewNids.current.delete(nid);
    });
  }, [currentPageData?.id]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build pagination numbers with ellipsis
  const paginationItems = useMemo(() => {
    if (totalPages <= 9) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: (number | '...')[] = [];
    const current = currentPage;

    items.push(1, 2, 3);

    if (current > 5) {
      items.push('...');
    }

    const start = Math.max(4, current - 1);
    const end = Math.min(totalPages - 3, current + 1);
    for (let i = start; i <= end; i++) {
      if (!items.includes(i)) items.push(i);
    }

    if (current < totalPages - 4) {
      items.push('...');
    }

    for (let i = Math.max(totalPages - 2, 4); i <= totalPages; i++) {
      if (!items.includes(i)) items.push(i);
    }

    return items;
  }, [totalPages, currentPage]);

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

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-[#6b7475] mr-2" />
          <span className="text-[#6b7475] text-sm">{t('viewer.loading')}</span>
        </div>
      </PageShell>
    );
  }

  if (error === 'HANDBOOK_NOT_PUBLISHED') {
    return (
      <PageShell>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-6 border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-3 py-2 h-auto gap-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common:back')}
        </Button>
        <EmptyState
          title={t('viewer.notPublished')}
          description={t('viewer.notPublishedDesc')}
        />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-6 border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-3 py-2 h-auto gap-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common:back')}
        </Button>
        <div className="flex items-center justify-center py-24">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </PageShell>
    );
  }

  if (totalPages === 0) {
    return (
      <PageShell>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-6 border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-3 py-2 h-auto gap-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common:back')}
        </Button>
        <EmptyState title={t('viewer.noPages')} description={t('viewer.noPagesDesc')} />
      </PageShell>
    );
  }

  const effectiveSignedAt = signedAt ?? viewerMeta?.trackingStatus?.signedAt ?? viewerMeta?.signedAt ?? null;
  const effectiveViewedAt = viewerMeta?.trackingStatus?.viewedAt ?? viewerMeta?.viewedAt ?? null;
  const showReceiptButton = viewerMeta?.field_receipt_value === 1 && effectiveSignedAt === null;

  return (
    <PageShell>
      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/')}
        className="mb-6 border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-3 py-2 h-auto gap-2 w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Content card */}
      <div
        className="bg-white border border-[#e5e7eb] rounded-[18px] shadow-sm px-8 py-8 sm:px-12 sm:py-10 min-h-[400px]"
        style={{ backgroundColor: getColor('pageBackground') }}
      >
        {currentPageData && (
          <>
            <h2
              className="text-xl font-bold mb-1"
              style={{ color: getColor('headlines') }}
            >
              {currentPageData.chapterTitle}
            </h2>

            {!metaLoading && (effectiveViewedAt || effectiveSignedAt) && (
              <div className="text-sm text-[#6b7280] mb-4 space-y-1">
                {effectiveViewedAt && (
                  <p>{t('viewer.lastViewed', { date: formatDate(effectiveViewedAt) })}</p>
                )}
                {effectiveSignedAt && (
                  <p className="flex items-center gap-1.5 text-[#0d9488]">
                    <Check className="h-4 w-4 shrink-0" />
                    {t('viewer.signedOn', { date: formatDate(effectiveSignedAt) })}
                  </p>
                )}
              </div>
            )}

            {currentPageData.html.trim().length > 0 ? (
              <div
                className="prose max-w-none handbook-content handbook-themed-content mt-4"
                dangerouslySetInnerHTML={{ __html: resolveHtmlUrls(currentPageData.html) }}
              />
            ) : (
              <p className="text-sm text-[#9ca3af] italic mt-4">
                {t('viewer.emptyContent')}
              </p>
            )}

            {showReceiptButton && (
              <div className="mt-8 pt-4 border-t" style={{ borderColor: getColor('frameColor') }}>
                <Button
                  onClick={async () => {
                    setSigningReceipt(true);
                    try {
                      await handbookApi.signHandbookReceipt(currentPageData.id);
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
                      {t('viewer.signing')}
                    </>
                  ) : (
                    t('viewer.iHaveReadThis')
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-10 pt-6 border-t border-[#f0f0f0] flex-wrap">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="h-9 w-9 flex items-center justify-center rounded-[8px] text-sm text-[#6b7475] hover:bg-[#f3f4f6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={t('viewer.firstPage')}
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 w-9 flex items-center justify-center rounded-[8px] text-sm text-[#6b7475] hover:bg-[#f3f4f6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={t('viewer.previousPage')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {paginationItems.map((item, index) =>
              item === '...' ? (
                <span key={`ellipsis-${index}`} className="h-9 w-9 flex items-center justify-center text-sm text-[#9ca3af]">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => goToPage(item)}
                  className={`h-9 min-w-[36px] px-2 flex items-center justify-center rounded-[8px] text-sm font-medium transition-colors ${
                    currentPage === item
                      ? 'bg-[#1a5948] text-white'
                      : 'text-[#374151] hover:bg-[#f3f4f6]'
                  }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 flex items-center justify-center rounded-[8px] text-sm text-[#6b7475] hover:bg-[#f3f4f6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={t('viewer.nextPage')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 flex items-center justify-center rounded-[8px] text-sm text-[#6b7475] hover:bg-[#f3f4f6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={t('viewer.lastPage')}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};
