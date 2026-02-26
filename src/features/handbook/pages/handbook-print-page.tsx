import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { handbookApi, DEFAULT_HANDBOOK_PRINT_BID, type HandbookPrintPageItem } from '../api';


export const HandbookPrintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bid = Math.floor(Number(searchParams.get('bid')) || DEFAULT_HANDBOOK_PRINT_BID);
  const lang = searchParams.get('lang') || 'en';
  const [pages, setPages] = useState<HandbookPrintPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    handbookApi
      .getHandbookPrint(bid, lang)
      .then((data) => {
        if (!cancelled) setPages(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load handbook for print');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [bid, lang]);

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
        {/* Toolbar: hidden when printing */}
        <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Handbook
          </Button>
        </div>

        {/* Content for print */}
        <div ref={printRef} className="handbook-print-content">
          {pages.length === 0 ? (
            <p className="text-[#6b7280] py-8">No pages to print.</p>
          ) : (
            pages.map((page, index) => (
              <section
                key={index}
                className="mb-8 break-inside-avoid"
                style={{ pageBreakInside: 'avoid' }}
              >
                <h2 className="text-xl font-semibold text-[#0d0e0e] mb-3 print:text-lg">
                  {page.title}
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[#374151] handbook-print-body"
                  dangerouslySetInnerHTML={{ __html: page.body || '' }}
                />
              </section>
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
