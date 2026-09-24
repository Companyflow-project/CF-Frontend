import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { handbookApi, type PageRevisionSummary, type PageRevisionContent } from '../api';
import { diffWords, htmlToText } from '@/lib/text-diff';

interface PageHistoryPanelProps {
  nid: number;
  lang: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a version is restored so the editor can reload. */
  onRestored: () => void;
}

/**
 * "History" for a handbook page: every saved version, what changed between a
 * chosen version and the current text (removed words struck through, added
 * words highlighted), the full old text on demand, and restore.
 *
 * This lives in a dialog on the editor, never inside the handbook itself, so
 * change markers can't leak into the reading view or the printed handbook.
 */
export const PageHistoryPanel: React.FC<PageHistoryPanelProps> = ({ nid, lang, open, onOpenChange, onRestored }) => {
  const { t, i18n } = useTranslation('handbook');
  const [items, setItems] = useState<PageRevisionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedVid, setSelectedVid] = useState<number | null>(null);
  const [selected, setSelected] = useState<PageRevisionContent | null>(null);
  const [current, setCurrent] = useState<PageRevisionContent | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const locale = i18n.language === 'da' ? 'da-DK' : 'en-GB';
  const fmt = (unix: number) =>
    new Date(unix * 1000).toLocaleString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true); setError(false); setSelectedVid(null); setSelected(null); setShowFull(false);
    (async () => {
      try {
        const list = await handbookApi.getPageHistory(nid, lang);
        if (cancelled) return;
        setItems(list);
        const cur = list.find((r) => r.isCurrent);
        setCurrent(cur ? await handbookApi.getPageRevision(nid, cur.vid, lang) : null);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, nid, lang]);

  useEffect(() => {
    if (selectedVid == null) { setSelected(null); return; }
    let cancelled = false;
    setShowFull(false);
    handbookApi.getPageRevision(nid, selectedVid, lang)
      .then((r) => { if (!cancelled) setSelected(r); })
      .catch(() => { if (!cancelled) toast.error(t('history.loadError')); });
    return () => { cancelled = true; };
  }, [selectedVid, nid, lang, t]);

  const segments = useMemo(() => {
    if (!selected || !current) return [];
    return diffWords(htmlToText(selected.body), htmlToText(current.body));
  }, [selected, current]);
  const hasChanges = segments.some((s) => s.type !== 'same');

  const handleRestore = async () => {
    if (!selected) return;
    if (!window.confirm(t('history.restoreConfirm'))) return;
    setRestoring(true);
    try {
      await handbookApi.restorePageRevision(nid, selected.vid, lang);
      toast.success(t('history.restored'));
      onRestored();
    } catch {
      toast.error(t('history.restoreError'));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px] max-h-[88vh] p-0 flex flex-col gap-0 overflow-hidden rounded-[16px]">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#e5efea]">
          <DialogTitle className="text-lg font-bold text-[#0d0e0e]">{t('history.title')}</DialogTitle>
          <p className="text-xs text-[#6b7280]">{t('history.subtitle')}</p>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Version list */}
          <aside className="w-[290px] shrink-0 border-r border-[#e5efea] overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-[#6b7280] flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t('history.loading')}</p>
            ) : error ? (
              <p className="p-4 text-sm text-red-600">{t('history.loadError')}</p>
            ) : items.length <= 1 ? (
              <p className="p-4 text-sm text-[#6b7280]">{t('history.empty')}</p>
            ) : (
              <ul>
                {items.map((r) => (
                  <li key={r.vid}>
                    <button
                      type="button"
                      disabled={r.isCurrent}
                      onClick={() => setSelectedVid(r.vid)}
                      className={`w-full text-left px-4 py-3 border-b border-[#f0f4f2] transition-colors ${
                        r.isCurrent ? 'bg-[#f6fbf9] cursor-default' : selectedVid === r.vid ? 'bg-[#e6f4ee]' : 'hover:bg-[#f9fafb]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[#0d0e0e]">{fmt(r.changed)}</span>
                        {r.isCurrent && (
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1a5948] bg-[#d4f4e6] rounded-full px-2 py-0.5">{t('history.current')}</span>
                        )}
                      </div>
                      {r.authorName && <div className="text-xs text-[#6b7280] mt-0.5">{t('history.by', { name: r.authorName })}</div>}
                      {r.logMessage && <div className="text-xs text-[#6b7280] italic mt-0.5">{r.logMessage}</div>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Detail */}
          <section className="flex-1 min-w-0 overflow-y-auto p-6">
            {!selected ? (
              <p className="text-sm text-[#6b7280]">{t('history.pickOne')}</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0d0e0e]">{t('history.changesSince')}</h3>
                    <p className="text-xs text-[#6b7280] flex items-center gap-3 mt-1">
                      <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#fde3e1] border border-[#f3a39d] align-middle mr-1" />{t('history.removed')}</span>
                      <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#e4f3ec] border border-[#9fd9be] align-middle mr-1" />{t('history.added')}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowFull((v) => !v)} className="rounded-[8px]">
                      {showFull ? t('history.hideFull') : t('history.showFull')}
                    </Button>
                    <Button
                      size="sm"
                      disabled={restoring || !selected.hasBody}
                      onClick={handleRestore}
                      className="rounded-[8px] bg-[#1a5948] hover:bg-[#143e33] text-white gap-1.5"
                      title={!selected.hasBody ? t('history.noBody') : undefined}
                    >
                      {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      {t('history.restore')}
                    </Button>
                  </div>
                </div>

                {!selected.hasBody ? (
                  <p className="text-sm text-[#6b7280]">{t('history.noBody')}</p>
                ) : !hasChanges ? (
                  <p className="text-sm text-[#6b7280]">{t('history.noChanges')}</p>
                ) : (
                  <div className="text-[15px] leading-relaxed text-[#0d0e0e] whitespace-pre-wrap rounded-[10px] border border-[#e5efea] p-4 bg-white">
                    {segments.map((s, i) =>
                      s.type === 'same' ? (
                        <span key={i}>{s.text}</span>
                      ) : s.type === 'del' ? (
                        <del key={i} className="bg-[#fde3e1] text-[#8f1d15] decoration-[#8f1d15]/60 rounded-[3px] px-0.5">{s.text}</del>
                      ) : (
                        <ins key={i} className="bg-[#e4f3ec] text-[#14563f] no-underline rounded-[3px] px-0.5">{s.text}</ins>
                      ),
                    )}
                  </div>
                )}

                {showFull && selected.hasBody && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-2">{t('history.fullTextOf', { date: fmt(selected.changed) })}</h4>
                    <div
                      className="prose prose-sm max-w-none rounded-[10px] border border-[#e5efea] p-4 bg-[#fafcfb]"
                      dangerouslySetInnerHTML={{ __html: selected.body }}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
