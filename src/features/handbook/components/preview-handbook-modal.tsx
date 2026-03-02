import React, { useMemo, useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handbookRoutes } from '../routes';
import { useAuth } from '@/context/auth-context';
import { useHandbookTree } from '../hooks';
import { handbookApi } from '../api';
import type { HandbookNode } from '@/types/models';

interface PreviewHandbookModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** When set, shows only those pages. When null/empty, shows all ready pages. */
    selectedPageIds?: number[] | null;
    /** Pass the parent's already-fetched tree to avoid a stale re-fetch inside the modal. */
    tree?: HandbookNode[];
}

export const PreviewHandbookModal: React.FC<PreviewHandbookModalProps> = ({
    isOpen,
    onClose,
    selectedPageIds = null,
    tree: treeProp,
}) => {
    const { data: treeFromHook, loading: treeLoading, error: treeError } = useHandbookTree('en');
    const tree = treeProp ?? treeFromHook;
    // When the parent provides the tree directly, we don't need to wait for the hook's fetch.
    const [bodies, setBodies] = useState<Map<number, string>>(new Map());
    const [bodiesLoading, setBodiesLoading] = useState(false);
    const [bodiesError, setBodiesError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const canEditHandbook = user?.role === 'ADMIN' || user?.role === 'company_admin';

    const selectedSet = useMemo(
        () =>
            selectedPageIds && selectedPageIds.length > 0
                ? new Set(selectedPageIds)
                : null,
        [selectedPageIds]
    );

    // Collect IDs to fetch body content for
    const pageIdsToFetch = useMemo(() => {
        if (!Array.isArray(tree)) return [];
        const ids: number[] = [];
        tree.forEach((node) => {
            if (node.type !== 'chapter') return;
            (node.pages || []).forEach((page: any) => {
                if (page.status !== 'ready') return;
                if (selectedSet && !selectedSet.has(page.id)) return;
                ids.push(page.id);
            });
        });
        return ids;
    }, [tree, selectedSet]);

    useEffect(() => {
        if (!isOpen || pageIdsToFetch.length === 0) return;
        let cancelled = false;
        setBodiesLoading(true);
        setBodiesError(null);

        Promise.all(
            pageIdsToFetch.map((id) =>
                handbookApi.getHandbookContent(id).then((html) => ({ id, html }))
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

        return () => {
            cancelled = true;
        };
    }, [isOpen, pageIdsToFetch.join(',')]);

    const loading = (!treeProp && treeLoading) || bodiesLoading;
    const error = (!treeProp ? treeError?.message : null) || bodiesError;

    const readyHandbookData = useMemo(() => {
        if (!Array.isArray(tree)) return [];

        return tree
            .filter((node) => node.type === 'chapter')
            .map((chapter) => {
                const readyPages = (chapter.pages || [])
                    .filter((page: any) => page.status === 'ready')
                    .filter((page: any) => !selectedSet || selectedSet.has(page.id))
                    .map((page: any) => ({
                        ...page,
                        body: bodies.get(page.id) ?? '',
                    }));
                return { ...chapter, pages: readyPages };
            })
            .filter((chapter) => chapter.pages.length > 0);
    }, [tree, bodies, selectedSet]);

    const handlePrint = () => {
        onClose();
        navigate(handbookRoutes.printView());
    };

    const isFiltered = !!selectedSet;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col gap-0 border-[#e5efea] rounded-[22px]">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5e7eb] flex-shrink-0 bg-white rounded-t-[22px]">
                    <DialogTitle className="text-xl font-bold text-[#0d0e0e] flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[#3d997d]" />
                        Preview Handbook
                    </DialogTitle>
                    <p className="text-sm text-[#6b7280] font-normal mt-1">
                        {isFiltered ? (
                            <>
                                Showing{' '}
                                <span className="font-semibold">
                                    {selectedPageIds!.length} selected page
                                    {selectedPageIds!.length !== 1 ? 's' : ''}
                                </span>
                                . This is a filtered preview.
                            </>
                        ) : (
                            <>
                                Showing all pages marked as{' '}
                                <span className="font-semibold">Ready</span>. This is
                                what employees will see.
                            </>
                        )}
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#f8faf9]">
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

                    {!loading && !error && readyHandbookData.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-[16px] border border-[#e5efea] shadow-sm">
                            <BookOpen className="h-12 w-12 text-[#9ca3af] mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-medium text-[#0d0e0e]">
                                No ready pages found
                            </h3>
                            <p className="text-[#6b7280] mt-1 text-sm max-w-md mx-auto">
                                {isFiltered
                                    ? 'None of the selected pages are marked as Ready.'
                                    : 'There are currently no handbook pages marked as "Ready".'}
                            </p>
                            {!isFiltered && (
                                <Button
                                    onClick={() => {
                                        onClose();
                                        navigate(handbookRoutes.pages);
                                    }}
                                    className="mt-4 bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px]"
                                >
                                    Manage Pages
                                </Button>
                            )}
                        </div>
                    )}

                    {!loading && !error && readyHandbookData.length > 0 && (
                        <div className="bg-white rounded-[16px] border border-[#e5efea] shadow-sm px-8 py-8 space-y-10">
                            {readyHandbookData.map((chapter) => (
                                <div key={chapter.id}>
                                    <h2 className="text-lg font-bold text-[#1a5948] mb-4 pb-2 border-b border-[#d4ede5]">
                                        {chapter.title}
                                    </h2>

                                    <div className="space-y-6">
                                        {chapter.pages?.map((page: any) => (
                                            <div key={page.id} className="space-y-2">
                                                <h3 className="text-base font-semibold text-[#374151]">
                                                    {page.title}
                                                </h3>
                                                {page.body ? (
                                                    <div
                                                        className="prose prose-sm max-w-none text-[#111827] leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: page.body }}
                                                    />
                                                ) : (
                                                    <p className="text-sm italic text-[#9ca3af]">
                                                        No content available.
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] flex justify-between bg-white rounded-b-[22px] flex-shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="rounded-[999px] px-6 h-10 border-[rgba(15,23,42,0.12)] text-[#0d0e0e] bg-white hover:bg-[#f8faf9]"
                    >
                        Close
                    </Button>
                    {canEditHandbook && (
                        <Button
                            type="button"
                            onClick={handlePrint}
                            disabled={loading || readyHandbookData.length === 0}
                            className="rounded-[999px] px-6 h-10 bg-[#3d997d] hover:bg-[#3d997d]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Print
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
