import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Copy, Download, Loader2, Printer } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PageQrDialogProps {
    open: boolean;
    onClose: () => void;
    pageId: number;
    pageTitle: string;
    /** The handbook the page is in. The viewer opens the employee's own handbook either way. */
    handbookBid?: number | null;
    /** False while employees can't see the page (not ready or not published): the code then opens page 1. */
    visibleToEmployees?: boolean;
}

/** Address that opens one page in the employee handbook viewer (after logging in, if needed). */
export function handbookPageLink(pageId: number, handbookBid?: number | null): string {
    return `${window.location.origin}/handbooks/${handbookBid ?? 0}/viewer?page=${pageId}`;
}

const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** QR code for a handbook page, to print and put up where the page is needed (e.g. on a machine). */
export const PageQrDialog: React.FC<PageQrDialogProps> = ({
    open,
    onClose,
    pageId,
    pageTitle,
    handbookBid,
    visibleToEmployees = true,
}) => {
    const { t, i18n } = useTranslation('handbook');
    const link = handbookPageLink(pageId, handbookBid);
    const [image, setImage] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setImage(null);
        // Black on white with a quiet zone: what phone cameras read most reliably, also when printed small.
        QRCode.toDataURL(link, { width: 600, margin: 2, errorCorrectionLevel: 'M' })
            .then((url) => { if (!cancelled) setImage(url); })
            .catch(() => {
                if (cancelled) return;
                toast.error(t('qr.failed'));
                onClose();
            });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, link]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(link);
            toast.success(t('qr.copied'));
        } catch {
            toast.error(t('qr.copyFailed'));
        }
    };

    const download = () => {
        if (!image) return;
        const a = document.createElement('a');
        a.href = image;
        a.download = `QR - ${pageTitle.replace(/[\\/:*?"<>|]+/g, '').trim() || pageId}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const print = () => {
        if (!image) return;
        const w = window.open('', '_blank', 'width=720,height=820');
        if (!w) {
            toast.error(t('qr.printBlocked'));
            return;
        }
        w.document.write(`<!doctype html><html lang="${escapeHtml(i18n.language)}"><head><meta charset="utf-8">
<title>${escapeHtml(t('qr.title'))} – ${escapeHtml(pageTitle)}</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #0d0e0e; text-align: center; margin: 0; padding: 48px 24px; }
  h1 { font-size: 26px; margin: 0 0 28px; }
  img { width: 9cm; height: 9cm; }
  p { font-size: 15px; color: #374151; margin: 20px 0 0; }
</style></head>
<body><h1>${escapeHtml(pageTitle)}</h1><img src="${image}" alt=""><p>${escapeHtml(t('qr.printHint'))}</p></body></html>`);
        w.document.close();
        const img = w.document.querySelector('img');
        const go = () => { w.focus(); w.print(); };
        if (!img || img.complete) go();
        else img.addEventListener('load', go, { once: true });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="w-[min(440px,92vw)]">
                <DialogHeader>
                    <DialogTitle>{t('qr.title')}</DialogTitle>
                    <DialogDescription className="break-words">{pageTitle}</DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex justify-center">
                    {image ? (
                        <img
                            src={image}
                            alt={t('qr.iconLabel', { title: pageTitle })}
                            className="h-56 w-56 rounded-[8px] border border-[#e5efea]"
                        />
                    ) : (
                        <div className="h-56 w-56 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-[#7b8a85]" />
                        </div>
                    )}
                </div>

                <p className="mt-4 text-sm text-[#374151]">{t('qr.description')}</p>
                <p className="mt-2 text-xs text-[#6b7475]">{t('qr.audienceNote')}</p>
                {!visibleToEmployees && (
                    <p className="mt-3 text-sm text-[#92400e] bg-[#fef3c7] rounded-[8px] px-3 py-2">
                        {t('qr.notVisible')}
                    </p>
                )}

                <div className="mt-4">
                    <div className="text-xs font-medium text-[#0d0e0e] mb-1">{t('qr.link')}</div>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={link}
                            aria-label={t('qr.link')}
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 min-w-0 h-9 rounded-[8px] border border-[#e5e7eb] bg-[#f9fafb] px-3 text-xs text-[#374151]"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={copyLink}>
                            <Copy className="h-4 w-4 mr-1.5" />
                            {t('qr.copy')}
                        </Button>
                    </div>
                </div>

                <DialogFooter className="mt-6 gap-2 sm:space-x-0">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t('qr.close')}
                    </Button>
                    <Button type="button" variant="outline" onClick={download} disabled={!image}>
                        <Download className="h-4 w-4 mr-1.5" />
                        {t('qr.download')}
                    </Button>
                    <Button
                        type="button"
                        onClick={print}
                        disabled={!image}
                        style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                    >
                        <Printer className="h-4 w-4 mr-1.5" />
                        {t('qr.print')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
