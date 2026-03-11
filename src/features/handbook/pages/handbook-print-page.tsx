import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { useHandbookTree } from '../hooks';
import { handbookApi } from '../api';
import { useAppearance } from '@/context/appearance-context';
import { LanguageToggle, useHandbookLang } from '../components/language-toggle';

export const HandbookPrintPage: React.FC = () => {
  const { getColor } = useAppearance();
  const [searchParams, setSearchParams] = useSearchParams();
  const [storedLang, setStoredLang] = useHandbookLang();
  const lang = searchParams.get('lang') || storedLang;

  const handleLangChange = (next: 'da' | 'en') => {
    setStoredLang(next);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('lang', next);
      return p;
    });
  };
  const { data: tree, loading: treeLoading, error: treeError } = useHandbookTree(lang);
  const [bodies, setBodies] = useState<Map<number, string>>(new Map());
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
      readyPageIds.map((id) =>
        handbookApi.getHandbookContent(id, lang).then((html) => ({ id, html }))
      )
    )
      .then((results) => {
        if (cancelled) return;
        const map = new Map<number, string>();
        results.forEach(({ id, html }) => map.set(id, html));
        setBodies(map);
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
          Loading handbook…
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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
              Back
            </Button>
            <LanguageToggle value={lang as 'da' | 'en'} onChange={handleLangChange} disabled={loading} />
          </div>
          <Button
            onClick={handlePrint}
            className="gap-2"
            style={{ backgroundColor: getColor('confirmationButton'), color: getColor('buttonText') }}
          >
            <Printer className="h-4 w-4" />
            Print Handbook
          </Button>
        </div>

        <div ref={printRef} className="handbook-print-content">
          {readyHandbookData.length === 0 ? (
            <p className="text-[#6b7280] py-8">No pages to print.</p>
          ) : (
            readyHandbookData.map((chapter) => (
              <React.Fragment key={chapter.id}>
                <h2 className="text-xl font-bold mt-8 mb-3 first:mt-0 print:text-lg" style={{ color: getColor('headlines') }}>
                  {chapter.title}
                </h2>
                {chapter.pages?.map((page: any) => (
                  <section
                    key={page.id}
                    className="mb-8 break-inside-avoid"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    <h3 className="text-lg font-semibold mb-2 print:text-base" style={{ color: getColor('headlines') }}>
                      {page.title}
                    </h3>
                    <div
                      className="prose prose-sm max-w-none handbook-print-body handbook-themed-content"
                      style={{ color: getColor('bodyText') }}
                      dangerouslySetInnerHTML={{ __html: page.body || '' }}
                    />
                  </section>
                ))}
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
