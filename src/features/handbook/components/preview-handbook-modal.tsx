import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useHandbookTree } from '../hooks';
import { SneakPeekModal } from './sneak-peek-modal';
import { BookOpen, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handbookRoutes } from '../routes';
import { useAuth } from '@/context/auth-context';

interface PreviewHandbookModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PreviewHandbookModal: React.FC<PreviewHandbookModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { data: tree, loading, error } = useHandbookTree();
    const [selectedPage, setSelectedPage] = useState<{ id: number; title: string } | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const canEditHandbook = user?.role === 'ADMIN' || user?.role === 'company_admin';

    // Filter tree to only include chapters that have at least one 'ready' page,
    // and only include 'ready' pages within those chapters.
    const readyHandbookData = useMemo(() => {
        if (!tree) return [];

        return tree
            .filter((node) => node.type === 'chapter')
            .map((chapter) => {
                const readyPages = (chapter.pages || []).filter(
                    (page) => page.status === 'ready'
                );
                return {
                    ...chapter,
                    pages: readyPages,
                };
            })
            .filter((chapter) => chapter.pages && chapter.pages.length > 0);
    }, [tree]);

    const handleEditPage = () => {
        if (selectedPage) {
            setSelectedPage(null);
            onClose();
            navigate(handbookRoutes.editPage(selectedPage.id));
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col gap-0 border-[#e5efea] rounded-[22px]">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5e7eb] flex-shrink-0 bg-white rounded-t-[22px]">
                        <DialogTitle className="text-xl font-bold text-[#0d0e0e] flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-[#3d997d]" />
                            Preview Handbook
                        </DialogTitle>
                        <p className="text-sm text-[#6b7280] font-normal mt-1">
                            Showing all pages that are marked as "Ready". This represents what employees will see.
                        </p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#f8faf9]">
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d997d]"></div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[12px] flex items-center gap-3">
                                <span className="block sm:inline">{error.message || 'Failed to load handbook pages.'}</span>
                            </div>
                        )}

                        {!loading && !error && readyHandbookData.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-[16px] border border-[#e5efea] shadow-sm">
                                <BookOpen className="h-12 w-12 text-[#9ca3af] mx-auto mb-3 opacity-50" />
                                <h3 className="text-lg font-medium text-[#0d0e0e]">No ready pages found</h3>
                                <p className="text-[#6b7280] mt-1 text-sm max-w-md mx-auto">
                                    There are currently no handbook pages marked as "Ready". Pages must be marked as ready before they can be previewed or published.
                                </p>
                                <Button
                                    onClick={() => {
                                        onClose();
                                        navigate(handbookRoutes.pages);
                                    }}
                                    className="mt-4 bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px]"
                                >
                                    Manage Pages
                                </Button>
                            </div>
                        )}

                        {!loading && !error && readyHandbookData.length > 0 && (
                            <div className="space-y-6">
                                {readyHandbookData.map((chapter) => (
                                    <div key={chapter.id} className="bg-white border border-[#e5efea] rounded-[16px] overflow-hidden shadow-sm">
                                        <div className="bg-[#f0f7f5] px-5 py-3 border-b border-[#e5efea]">
                                            <h3 className="font-bold text-[#0d0e0e] text-base">{chapter.title}</h3>
                                        </div>
                                        <div className="divide-y divide-[#f1f5f9]">
                                            {chapter.pages?.map((page) => (
                                                <div
                                                    key={page.id}
                                                    className="flex items-center justify-between px-5 py-3 hover:bg-[#f8faf9] transition-colors cursor-pointer group"
                                                    onClick={() => setSelectedPage({ id: page.id, title: page.title })}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-4 w-4 text-[#9ca3af] group-hover:text-[#3d997d]" />
                                                        <span className="text-sm font-medium text-[#374151] group-hover:text-[#0d0e0e]">
                                                            {page.title}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[#6b7280] bg-[#f8faf9] border border-[#e5e7eb] hover:border-[#3d997d] hover:text-[#3d997d] hover:bg-white rounded-[999px] h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-all font-medium"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPage({ id: page.id, title: page.title });
                                                        }}
                                                    >
                                                        Preview page
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end bg-white rounded-b-[22px] flex-shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="rounded-[999px] px-6 h-10 border-[rgba(15,23,42,0.12)] text-[#0d0e0e] bg-white hover:bg-[#f8faf9]"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sneak Peek Modal for Individual Pages */}
            <SneakPeekModal
                isOpen={selectedPage !== null}
                onClose={() => setSelectedPage(null)}
                onEditPage={handleEditPage}
                pageId={selectedPage?.id || 0}
                pageTitle={selectedPage?.title || ''}
                canEdit={canEditHandbook}
            />
        </>
    );
};
