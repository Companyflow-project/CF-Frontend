import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { useHandbookTree } from '../hooks';
import { handbookApi } from '../api';
import { useAppearance } from '@/context/appearance-context';
import { resolveHtmlUrls, resolveBackendUrl } from '@/lib/utils';
import { useHandbookLang } from '../components/language-toggle';
import { useTranslation } from 'react-i18next';

export const HandbookPrintPage: React.FC = () => {
  const { t } = useTranslation('handbook');
  const { getColor } = useAppearance();
  const [searchParams] = useSearchParams();
  const [storedLang] = useHandbookLang();
  const lang = searchParams.get('lang') || storedLang;
  const { data: tree, loading: treeLoading, error: treeError } = useHandbookTree(lang);
  const [bodies, setBodies] = useState<Map<number, string>>(new Map());
  const [pageImages, setPageImages] = useState<Map<number, { url: string; name: string; placement: string }>>(new Map());
  const [bodiesLoading, setBodiesLoading] = useState(false);
  const [bodiesError, setBodiesError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const readyPageIds = useMemo(() => {
    if (!Array.isArray(tree)) return [];
    const ids: number[] = [];
    tree.forEach((node) => {
      if (node.type !== 'chapter') return;
      (node.pages || []).forEach((page: any) => {
        if (page.status === 'ready') ids.push(page.id);
      });
    });
    return ids;
  }, [tree]);

  useEffect(() => {
    if (readyPageIds.length === 0) return;
    let cancelled = false;
    setBodiesLoading(true);
    setBodiesError(null);
    Promise.all(
      readyPageIds.map(async (id) => {
        const [html, detail] = await Promise.all([
          handbookApi.getHandbookContent(id, lang).catch(() => ''),
          handbookApi.getPageDetail(id, lang).catch(() => null),
        ]);
        const pic = detail?.pictures?.[0];
        return {
          id,
          html,
          imageUrl: pic?.url || null,
          imageName: pic?.name || 'Image',
          imagePlacement: detail?.imagePlacement || null,
        };
      })
    )
      .then((results) => {
        if (cancelled) return;
        const bodyMap = new Map<number, string>();
        const imgMap = new Map<number, { url: string; name: string; placement: string }>();
        results.forEach(({ id, html, imageUrl, imageName, imagePlacement }) => {
          bodyMap.set(id, html);
          if (imageUrl && imagePlacement && imagePlacement !== 'none') {
            imgMap.set(id, { url: imageUrl, name: imageName, placement: imagePlacement });
          }
        });
        setBodies(bodyMap);
        setPageImages(imgMap);
      })
      .catch((err: any) => {
        if (!cancelled)
          setBodiesError(err?.message || 'Failed to load page content.');
      })
      .finally(() => {
        if (!cancelled) setBodiesLoading(false);
      });
    return () => { cancelled = true; };
  }, [readyPageIds.join(','), lang]);

  const readyHandbookData = useMemo(() => {
    if (!Array.isArray(tree)) return [];
    return tree
      .filter((node) => node.type === 'chapter')
      .map((chapter) => {
        const readyPages = (chapter.pages || [])
          .filter((page: any) => page.status === 'ready')
          .map((page: any) => ({
            ...page,
            body: bodies.get(page.id) ?? '',
          }));
        return { ...chapter, pages: readyPages };
      })
      .filter((chapter: any) => chapter.pages.length > 0);
  }, [tree, bodies]);

  const loading = treeLoading || bodiesLoading;
  const error = treeError?.message || bodiesError;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12 text-[#6b7280]">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          {t('print.loading')}
        </div>
      </PageShell>
    );
  }

  if (error) {
    const isNotPublished = error === 'HANDBOOK_NOT_PUBLISHED';
    return (
      <PageShell>
        <div className="py-12 text-center">
          <p className={isNotPublished ? 'text-[#6b7475] mb-4' : 'text-red-600 mb-4'}>
            {isNotPublished ? t('toc.notPublishedDesc') : error}
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common:back')}
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common:back')}
            </Button>
          </div>
          <Button
            onClick={handlePrint}
            className="gap-2"
            style={{ backgroundColor: getColor('confirmationButton'), color: getColor('buttonText') }}
          >
            <Printer className="h-4 w-4" />
            {t('print.printHandbook')}
          </Button>
        </div>

        <div ref={printRef} className="handbook-print-content">
          {readyHandbookData.length === 0 ? (
            <p className="text-[#6b7280] py-8">{t('print.noPages')}</p>
          ) : (
            readyHandbookData.map((chapter) => (
              <React.Fragment key={chapter.id}>
                <h2 className="text-xl font-bold mt-8 mb-3 first:mt-0 print:text-lg" style={{ color: getColor('headlines') }}>
                  {chapter.title}
                </h2>
                {chapter.pages?.map((page: any) => {
                  const img = pageImages.get(page.id);
                  const bodyHtml = resolveHtmlUrls(page.body || '');
                  const bodyEl = (
                    <div
                      className="prose prose-sm max-w-none handbook-print-body handbook-themed-content"
                      style={{ color: getColor('bodyText') }}
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  );
                  const imgEl = img ? (
                    <img
                      src={resolveBackendUrl(img.url)}
                      alt={img.name}
                      className="rounded-md object-contain"
                    />
                  ) : null;

                  return (
                    <section
                      key={page.id}
                      className="mb-8 break-inside-avoid"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      <h3 className="text-lg font-semibold mb-2 print:text-base" style={{ color: getColor('headlines') }}>
                        {page.title}
                      </h3>
                      {!img ? bodyEl : img.placement === 'before' ? (
                        <>
                          <div className="flex justify-center mb-4">
                            {React.cloneElement(imgEl!, { className: 'max-h-72 object-contain rounded-md' })}
                          </div>
                          {bodyEl}
                        </>
                      ) : img.placement === 'after' ? (
                        <>
                          {bodyEl}
                          <div className="flex justify-center mt-4">
                            {React.cloneElement(imgEl!, { className: 'max-h-72 object-contain rounded-md' })}
                          </div>
                        </>
                      ) : img.placement === 'left' ? (
                        <div className="flex gap-4 items-start">
                          {React.cloneElement(imgEl!, { className: 'w-1/3 max-h-64 object-contain rounded-md shrink-0' })}
                          <div className="flex-1">{bodyEl}</div>
                        </div>
                      ) : img.placement === 'right' ? (
                        <div className="flex gap-4 items-start">
                          <div className="flex-1">{bodyEl}</div>
                          {React.cloneElement(imgEl!, { className: 'w-1/3 max-h-64 object-contain rounded-md shrink-0' })}
                        </div>
                      ) : bodyEl}
                    </section>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .handbook-print-content { padding: 0; }
          .handbook-print-body img { max-width: 100%; }
        }
      `}</style>
    </PageShell>
  );
};
