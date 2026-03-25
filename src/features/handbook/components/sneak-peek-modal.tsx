import React, { useEffect, useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Link2 } from 'lucide-react';
import { handbookApi } from '../api';
import type { HandbookPageDetail } from '@/types/models';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { handbookRoutes } from '../routes';
import { useAppearance } from '@/context/appearance-context';
import { resolveBackendUrl, resolveHtmlUrls } from '@/lib/utils';

interface SneakPeekModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditPage: () => void;
    pageId: number;
    pageTitle: string;
    lang?: string;
    canEdit?: boolean;
    canViewNotes?: boolean;
    handbookBid?: number | null;
}

export const SneakPeekModal: React.FC<SneakPeekModalProps> = ({
    isOpen,
    onClose,
    onEditPage,
    pageId,
    pageTitle,
    lang = 'da',
    canEdit = false,
    canViewNotes = false,
    handbookBid,
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation('handbook');
    const { getColor } = useAppearance();
    const [loading, setLoading] = useState(true);
    const [pageDetail, setPageDetail] = useState<HandbookPageDetail | null>(null);
    const [bodyHtml, setBodyHtml] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && pageId) {
            let cancelled = false;
            setLoading(true);
            setError(null);

            Promise.all([
                handbookApi.getPageDetail(pageId, lang),
                handbookApi.getHandbookContent(pageId, lang).catch(() => ''),
            ])
                .then(([detail, html]) => {
                    if (cancelled) return;
                    setPageDetail(detail);
                    setBodyHtml(html);
                })
                .catch((err: any) => {
                    if (!cancelled) setError(err.message || 'Failed to load page details');
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });

            return () => { cancelled = true; };
        }
    }, [isOpen, pageId, lang]);

    const firstPicture = pageDetail?.pictures && pageDetail.pictures.length > 0
        ? pageDetail.pictures[0]
        : undefined;
    const placement = pageDetail?.imagePlacement || 'none';
    const showImage = !!(firstPicture?.url && placement !== 'none');

    const isReady = useMemo(
        () => !!pageDetail?.settings?.isReady,
        [pageDetail?.settings?.isReady],
    );

    const imageEl = showImage ? (
        <img
            src={resolveBackendUrl(firstPicture!.url)}
            alt={firstPicture!.name || 'Image'}
            className={placement === 'before' || placement === 'after'
                ? 'w-full max-h-64 object-contain rounded-md'
                : 'w-full sm:w-1/3 max-h-48 object-contain rounded-md'}
        />
    ) : null;

    const textEl = bodyHtml ? (
        <div
            className="prose prose-sm max-w-none leading-relaxed handbook-themed-content"
            style={{ color: getColor('bodyText') }}
            dangerouslySetInnerHTML={{ __html: resolveHtmlUrls(bodyHtml) }}
        />
    ) : (
        <p className="text-sm italic text-[#9ca3af]">
            {t('preview.noContent')}
        </p>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="!w-[600px] min-h-[500px] max-w-[90vw] max-h-[85vh] !overflow-hidden p-0 flex flex-col gap-0 border-[#e5efea] rounded-[22px]">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5e7eb] flex-shrink-0 bg-white rounded-t-[22px]">
                    <DialogTitle className="text-xl font-bold text-[#0d0e0e] flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[#3d997d]" />
                        {pageTitle}
                    </DialogTitle>
                    <p className="text-sm text-[#6b7280] font-normal mt-1">
                        {t('sneakPeek.desc')}
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6" style={{ backgroundColor: getColor('lightBackground') }}>
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d997d]" />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[12px]">
                            {error}
                        </div>
                    )}

                    {!loading && !error && pageDetail && (
                        <div className="rounded-[16px] border shadow-sm px-8 py-8 space-y-6 min-h-[320px] flex-1" style={{ backgroundColor: getColor('pageBackground'), borderColor: getColor('frameColor') }}>
                            {/* Page title */}
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold" style={{ color: getColor('headlines') }}>
                                    {pageTitle}
                                </h3>
                            </div>

                            {/* Image + Text with placement */}
                            {showImage && placement === 'before' && (
                                <div>
                                    {imageEl}
                                    <div className="mt-3">{textEl}</div>
                                </div>
                            )}
                            {showImage && placement === 'after' && (
                                <div>
                                    {textEl}
                                    <div className="mt-3">{imageEl}</div>
                                </div>
                            )}
                            {showImage && (placement === 'left' || placement === 'right') && (
                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                    {placement === 'left' && imageEl}
                                    <div className="flex-1">{textEl}</div>
                                    {placement === 'right' && imageEl}
                                </div>
                            )}
                            {!showImage && textEl}

                            {/* Documents */}
                            {pageDetail.documents && pageDetail.documents.length > 0 && (
                                <div className="pt-3">
                                    <h4 className="text-sm font-bold text-[#0d0e0e] mb-1.5 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-[#7c5caa]" />
                                        {t('sneakPeek.document')}
                                    </h4>
                                    <div className="space-y-1">
                                        {pageDetail.documents.map((doc, index) => (
                                            <div key={index}>
                                                {doc.url ? (
                                                    <a
                                                        href={resolveBackendUrl(doc.url)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm underline"
                                                        style={{ color: getColor('links') }}
                                                    >
                                                        {doc.name || 'Document'}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-[#0d0e0e]">{doc.name || 'Document'}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Links */}
                            {pageDetail.links && pageDetail.links.length > 0 && (
                                <div className="pt-3">
                                    <h4 className="text-sm font-bold text-[#0d0e0e] mb-1.5 flex items-center gap-1.5">
                                        <Link2 className="h-3.5 w-3.5 text-[#3d8b6e]" />
                                        {t('sneakPeek.links')}
                                    </h4>
                                    <div className="space-y-1">
                                        {pageDetail.links.map((link, index) => (
                                            <div key={index}>
                                                <a
                                                    href={link.uri || link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm underline"
                                                    style={{ color: getColor('links') }}
                                                >
                                                    {link.title || link.uri || link.url}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes — admin & senior only */}
                            {canViewNotes && pageDetail.internalNote && pageDetail.internalNote.trim() !== '' && (
                                <div className="pt-3">
                                    <h4 className="text-sm font-bold text-[#0d0e0e] mb-1.5">{t('sneakPeek.notes')}</h4>
                                    <div
                                        className="prose prose-sm max-w-none text-sm leading-relaxed bg-[#fffbeb] border border-[#fde68a] rounded-[8px] px-4 py-3"
                                        dangerouslySetInnerHTML={{ __html: pageDetail.internalNote }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] flex justify-between bg-white rounded-b-[22px] flex-shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="rounded-[999px] px-6 h-10 border-[rgba(15,23,42,0.12)] text-[#0d0e0e] bg-white hover:bg-[#f8faf9]"
                    >
                        {t('sneakPeek.close')}
                    </Button>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Button
                                type="button"
                                onClick={onEditPage}
                                className="rounded-[999px] px-6 h-10 border-[rgba(15,23,42,0.12)] text-[#0d0e0e] bg-white hover:bg-[#f8faf9]"
                                variant="outline"
                            >
                                {t('sneakPeek.editPage')}
                            </Button>
                        )}
                        {canEdit && (
                            <Button
                                type="button"
                                disabled={loading || !pageDetail}
                                onClick={() => {
                                    if (!pageDetail) return;
                                    if (isReady) {
                                        onClose();
                                        navigate(handbookRoutes.printView({ pages: [pageId] }));
                                    } else {
                                        if (handbookBid != null) navigate(handbookRoutes.publish(handbookBid));
                                    }
                                }}
                                className="rounded-[999px] px-6 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                            >
                                {isReady ? t('sneakPeek.print') : t('sneakPeek.publish')}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
