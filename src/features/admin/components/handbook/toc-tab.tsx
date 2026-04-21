import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  useAdminHandbookPage,
  useAdminHandbookBooks,
  useUpdateAdminHandbookToc,
} from '../../handbook-hooks';

interface Props {
  nid: number;
  langcode?: string;
}

const WEIGHT_OPTIONS = Array.from({ length: 31 }, (_, i) => i - 15);

export const AdminHandbookTocTab: React.FC<Props> = ({ nid, langcode }) => {
  const { t } = useTranslation('admin');
  const { data: page, isLoading } = useAdminHandbookPage(nid, langcode);
  const { data: books = [] } = useAdminHandbookBooks();
  const updateToc = useUpdateAdminHandbookToc();

  const [bid, setBid] = useState<number | ''>('');
  const [weight, setWeight] = useState<number>(0);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!page) return;
    setBid(page.bid ?? '');
    setWeight(page.weight ?? 0);
  }, [page]);

  if (isLoading || !page) return <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>;

  const handleAdd = async () => {
    try {
      await updateToc.mutateAsync({
        nid,
        payload: {
          bid: bid === '' ? null : Number(bid),
          weight,
        },
      });
      toast.success(bid === ''
        ? t('handbook.toc.removedSuccess', 'Page removed from book')
        : t('handbook.toc.addedSuccess', 'Page added to book')
      );
    } catch {
      toast.error(t('handbook.toc.updateFailed', 'Failed to update table of contents'));
    }
  };

  const noBookSelected = bid === '' || bid === null;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        {t('handbook.toc.instructions', 'Use tables of contents to add content to the book hierarchy, move it around the hierarchy, or reorganize an entire book.')}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-[#0d0e0e] mb-4">{page.title}</h2>

        <div className="border border-gray-200 rounded-lg bg-gray-50/50 p-4">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-[#0d0e0e]"
          >
            <span className={`inline-block transition-transform ${expanded ? 'rotate-90' : ''}`}>▸</span>
            {t('handbook.tabs.toc', 'Table of Contents')}
            <span className="text-xs text-gray-500 font-normal ml-1">
              ({page.bid ? t('handbook.common.inBook', 'In book') : t('handbook.common.notInBook', 'Not in book')})
            </span>
          </button>

          {expanded && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">{t('handbook.toc.book', 'Book')}</label>
                <select
                  value={bid}
                  onChange={(e) => setBid(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full sm:max-w-md border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">{t('handbook.common.nothingSelected', '– Nothing selected –')}</option>
                  {books.map(b => (
                    <option key={b.nid} value={b.nid}>{b.title}</option>
                  ))}
                </select>
                <div className="text-xs text-green-700 mt-1">{t('handbook.toc.bookHint', 'The page becomes part of the selected book.')}</div>
                {noBookSelected && (
                  <div className="text-xs text-red-600 font-medium mt-1">{t('handbook.common.noBookSelected', 'No book selected.')}</div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">{t('handbook.toc.weight', 'Weight')}</label>
                <select
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-28 border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                >
                  {WEIGHT_OPTIONS.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <div className="text-xs text-green-700 mt-1">{t('handbook.toc.weightHint', 'Pages at a given level are sorted first by weight and then by title.')}</div>
              </div>

              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleAdd}
                disabled={updateToc.isPending}
              >
                {updateToc.isPending ? t('handbook.common.saving', 'Saving…') : t('handbook.toc.addToBook', 'Add to book')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
