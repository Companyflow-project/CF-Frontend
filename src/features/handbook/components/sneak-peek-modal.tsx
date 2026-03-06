import React, { useEffect, useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { handbookApi, DEFAULT_HANDBOOK_PRINT_BID } from '../api';
import type { HandbookPageDetail } from '@/types/models';
import { useNavigate } from 'react-router-dom';
import { handbookRoutes } from '../routes';
import { useAppearance } from '@/context/appearance-context';

interface SneakPeekModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditPage: () => void;
    pageId: number;
    pageTitle: string;
    lang?: string;
    canEdit?: boolean;
}

export const SneakPeekModal: React.FC<SneakPeekModalProps> = ({
    isOpen,
    onClose,
    onEditPage,
    pageId,
    pageTitle,
    lang = 'da',
    canEdit = false,
}) => {
    const navigate = useNavigate();
    const { getColor } = useAppearance();
    const [loading, setLoading] = useState(true);
    const [pageDetail, setPageDetail] = useState<HandbookPageDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && pageId) {
            fetchPageDetail();
        }
    }, [isOpen, pageId, lang]);

    const fetchPageDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const detail = await handbookApi.getPageDetail(pageId, lang);
            setPageDetail(detail);
        } catch (err: any) {
            console.error('Failed to fetch page detail:', err);
            setError(err.message || 'Failed to load page details');
        } finally {
            setLoading(false);
        }
    };

    // Get content text based on source mode
    const getContentText = () => {
        if (!pageDetail) return null;

        // Use custom content if available
        if (pageDetail.sourceMode === 'own' && pageDetail.versions?.custom) {
            return pageDetail.versions.custom;
        }

        // Fall back to premade version or main content
        return pageDetail.versions?.premade || pageDetail.content || null;
    };

    // Strip HTML tags for plain text display
    const stripHtml = (html: string | null) => {
        if (!html) return '';
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const contentText = getContentText();
    const plainText = stripHtml(contentText);

    const firstPicture = pageDetail?.pictures && pageDetail.pictures.length > 0
        ? pageDetail.pictures[0]
        : undefined;
    const placement = pageDetail?.imagePlacement || 'none';

    // Determine whether this page is currently marked as Ready
    const isReady = useMemo(
        () => !!pageDetail?.settings?.isReady,
        [pageDetail?.settings?.isReady],
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[680px] h-[600px] max-w-[90vw] max-h-[85vh] p-0 flex flex-col gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5e7eb] flex-shrink-0">
                    <DialogTitle className="text-xl font-bold text-[#0d0e0e]">
                        {pageTitle}
                    </DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="py-8 text-center text-gray-400">
                        Loading...
                    </div>
                )}

                {error && (
                    <div className="py-8 text-center text-red-500">
                        {error}
                    </div>
                )}

                {!loading && !error && pageDetail && (
                    <>
                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                            {/* Optional Image + Content Layout */}
                            {firstPicture && firstPicture.url && placement !== 'none' ? (
                                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start">
                                    {placement === 'left' && (
                                        <img
                                            src={firstPicture.url}
                                            alt={firstPicture.name || 'Image'}
                                            className="w-full sm:w-1/3 max-h-48 object-contain rounded-md"
                                        />
                                    )}
                                    {plainText && (
                                        <div className="flex-1">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: getColor('bodyText') }}>
                                                {plainText}
                                            </p>
                                        </div>
                                    )}
                                    {placement === 'right' && (
                                        <img
                                            src={firstPicture.url}
                                            alt={firstPicture.name || 'Image'}
                                            className="w-full sm:w-1/3 max-h-48 object-contain rounded-md"
                                        />
                                    )}
                                </div>
                            ) : (
                                plainText && (
                                    <div className="mb-6">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: getColor('bodyText') }}>
                                            {plainText}
                                        </p>
                                    </div>
                                )
                            )}

                            {/* Documents Section */}
                            {pageDetail.documents && pageDetail.documents.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-base font-bold text-[#0d0e0e] mb-3">Document</h3>
                                    <div className="space-y-2">
                                        {pageDetail.documents.map((doc, index) => (
                                            <div key={index}>
                                                {doc.url ? (
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline text-sm inline-block" style={{ color: getColor('links') }}
                                                    >
                                                        {doc.name || 'Document'}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-[#0d0e0e]">
                                                        {doc.name || 'Document'}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Links Section */}
                            {pageDetail.links && pageDetail.links.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-base font-bold text-[#0d0e0e] mb-3">Links</h3>
                                    <div className="space-y-2">
                                        {pageDetail.links.map((link, index) => (
                                            <div key={index}>
                                                {link.uri || link.url ? (
                                                    <a
                                                        href={link.uri || link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline text-sm inline-block" style={{ color: getColor('links') }}
                                                    >
                                                        {link.title || link.uri || link.url}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-[#0d0e0e]">
                                                        {link.title || 'Link'}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Note Section - Always visible at bottom */}
                        {pageDetail.internalNote && (
                            <div className="border-t-2 border-[#f59e0b] bg-white px-6 py-4 flex-shrink-0">
                                <h3 className="text-base font-bold text-[#f59e0b] mb-2">Note</h3>
                                <p className="text-sm text-[#0d0e0e] leading-relaxed">
                                    {pageDetail.internalNote}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Footer with buttons */}
                <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] flex justify-between items-center bg-white flex-shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-[8px] px-5 py-2 h-auto text-sm"
                    >
                        Close
                    </Button>
                    <div className="flex items-center gap-2">
                        <div
                            title={!canEdit ? 'Only admins can edit handbook pages' : undefined}
                            className={!canEdit ? 'cursor-not-allowed' : undefined}
                        >
                            <Button
                                type="button"
                                onClick={canEdit ? onEditPage : undefined}
                                disabled={!canEdit}
                                className="rounded-[8px] px-5 py-2 h-auto text-sm bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#111827] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Edit page
                            </Button>
                        </div>
                        {canEdit && (
                            <Button
                                type="button"
                                disabled={loading || !pageDetail}
                                onClick={() => {
                                    if (!pageDetail) return;
                                    if (isReady) {
                                        // Handbook is ready — go straight to print view
                                        navigate(handbookRoutes.printView());
                                    } else {
                                        // Page is not ready — open publish flow for main handbook
                                        navigate(handbookRoutes.publish(DEFAULT_HANDBOOK_PRINT_BID));
                                    }
                                }}
                                className="rounded-[8px] px-5 py-2 h-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: getColor('confirmationButton'), color: getColor('buttonText') }}
                            >
                                {isReady ? 'Print' : 'Publish'}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
