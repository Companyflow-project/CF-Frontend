import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Search, ArrowLeft, GripVertical, AlertTriangle, Loader2 } from 'lucide-react';
import { LanguageToggle, useHandbookLang } from '../components/language-toggle';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HandbookPageEditor } from '../components/handbook-page-editor';
import { AddPageModal } from '../components/add-page-modal';
import { SneakPeekModal } from '../components/sneak-peek-modal';
import { PreviewHandbookModal } from '../components/preview-handbook-modal';
import { handbookApi } from '../api';
import { handbookRoutes } from '../routes';
import type { HandbookNode } from '@/types/models';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

export const HandbookPagesPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [expandedPageId, setExpandedPageId] = useState<number | null>(null);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [handbookTree, setHandbookTree] = useState<HandbookNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [provisioning, setProvisioning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
    const [lang, setLang] = useHandbookLang();
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const canEditHandbook = user?.role === 'ADMIN' || user?.role === 'company_admin';

    // The actual bid comes from the API — it differs per company and must NOT be hardcoded to 21.
    const [handbookBid, setHandbookBid] = useState<number | null>(null);

    useEffect(() => {
        const open = searchParams.get('open');
        if (open === 'add') {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('open');
                return next;
            }, { replace: true });
            setIsAddPageModalOpen(true);
        }
    }, [searchParams, setSearchParams]);

    // Sneak Peek modal state
    const [sneakPeekOpen, setSneakPeekOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [sneakPeekPage, setSneakPeekPage] = useState<{ id: number; title: string } | null>(null);

    // Delete confirmation modal
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{ ids: number[]; names: string[] } | null>(null);

    // Focused (highlighted) page for Preview Handbook
    const [focusedPageId, setFocusedPageId] = useState<number | null>(null);
    const [draggingPageId, setDraggingPageId] = useState<number | null>(null);
    const [draggingChapterId, setDraggingChapterId] = useState<number | null>(null);
    const [dragOverPageId, setDragOverPageId] = useState<number | null>(null);
    const [dragDropPosition, setDragDropPosition] = useState<'top' | 'bottom' | null>(null);
    const [dragOverChapterId, setDragOverChapterId] = useState<number | null>(null);
    const [dragChapterDropPosition, setDragChapterDropPosition] = useState<'left' | 'right' | null>(null);

    const fetchHandbookTree = useCallback(async (isPolling = false) => {
        try {
            if (!isPolling) {
                setLoading(true);
                setError(null);
            }
            const { bid, chapters: tree } = await handbookApi.getHandbookTree(lang);

            // Deduplicate the entire tree by node ID to prevent duplicate key warnings
            const uniqueTree = Array.from(
                new Map(tree.map(node => [node.id, node])).values()
            );

            setHandbookTree(uniqueTree);
            setHandbookBid(bid);

            if (uniqueTree.length > 0) {
                setProvisioning(false);
                if (pollRef.current) {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }

                // Preselect all pages with status === 'ready'
                const readyPageIds = new Set<number>();
                uniqueTree.forEach(node => {
                    if (node.type === 'chapter' && node.pages) {
                        node.pages.forEach(page => {
                            if (page.status === 'ready') {
                                readyPageIds.add(page.id);
                            }
                        });
                    }
                });
                setSelectedPages(readyPageIds);
                if (uniqueTree[0].type === 'chapter') {
                    setActiveChapterId(uniqueTree[0].id);
                }
            } else if (!isPolling) {
                // Empty tree — handbook still provisioning
                setProvisioning(true);
            }
        } catch (err: any) {
            console.error('Failed to fetch handbook tree:', err);
            if (!isPolling) {
                // Check if this is a "not found" style error during provisioning
                const msg = err.message || '';
                if (msg.includes('not published') || msg.includes('not found') || msg.includes('not linked')) {
                    setProvisioning(true);
                    setError(null);
                } else {
                    setError(msg || 'Failed to load handbook data');
                }
            }
        } finally {
            if (!isPolling) setLoading(false);
        }
    }, [lang]);

    useEffect(() => {
        fetchHandbookTree();
        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [fetchHandbookTree]);

    // Poll while provisioning
    useEffect(() => {
        if (provisioning && !pollRef.current) {
            pollRef.current = setInterval(() => fetchHandbookTree(true), 5000);
        }
        if (!provisioning && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [provisioning, fetchHandbookTree]);

    const chapters = useMemo(() => {
        const chapterNodes = handbookTree.filter((node) => node.type === 'chapter');
        // Deduplicate by ID in case backend returns duplicates
        const uniqueChapters = Array.from(
            new Map(chapterNodes.map(ch => [ch.id, ch])).values()
        );
        return uniqueChapters;
    }, [handbookTree]);

    const pages = useMemo(() => {
        const activeChapter = chapters.find((ch) => ch.id === activeChapterId);
        return activeChapter?.pages || [];
    }, [chapters, activeChapterId]);

    const filteredPages = useMemo(() => {
        const currentUserId = user?.id;
        const isAdmin = canEditHandbook;

        return pages.filter((page: any) => {
            const status = page.status as string;

            // For non-admins: only show non-ready pages to their owners
            if (!isAdmin) {
                const isReady = status === 'ready';
                const owners: unknown = page.owners;
                const ownerIds: string[] = Array.isArray(owners)
                    ? owners.map((id: unknown) => String(id))
                    : [];
                const isOwner = !!currentUserId && ownerIds.includes(String(currentUserId));

                if (!isReady && !isOwner) {
                    return false;
                }
            }

            if (statusFilter && status !== statusFilter) return false;
            if (search && !page.title.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [pages, search, statusFilter, user?.id, canEditHandbook]);

    // Pages in the current chapter view that are checked — used for delete/preview actions.
    // Non-deletable pages are excluded even if visually checked.
    const checkedInView = useMemo(
        () => filteredPages.filter((p: any) => selectedPages.has(p.id) && p.isDeletable !== false),
        [filteredPages, selectedPages]
    );
    const checkedInViewIds = useMemo(
        () => checkedInView.map((p: any) => p.id),
        [checkedInView]
    );

    const progressStats = useMemo(() => {
        const selected = selectedPages.size;
        const ready = pages.filter((p) => (p.status as string) === 'ready').length;
        const notReady = pages.filter((p) => (p.status as string) === 'not_ready').length;
        const optedOut = pages.filter((p) => (p.status as string) === 'opted_out').length;
        return { selected, ready, notReady, optedOut };
    }, [pages, selectedPages]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ready':
                return (
                    <Badge className="bg-[#d4f4e6] text-[#1a5948] border-0 rounded-[6px] px-3 py-1 text-xs font-medium">
                        Ready
                    </Badge>
                );
            case 'not_ready':
                return (
                    <Badge className="bg-[#fef3d6] text-[#8b6914] border-0 rounded-[6px] px-3 py-1 text-xs font-medium">
                        Not ready
                    </Badge>
                );
            case 'opted_out':
                return (
                    <Badge className="bg-[#ffe5e7] text-[#a02530] border-0 rounded-[6px] px-3 py-1 text-xs font-medium">
                        Opted out
                    </Badge>
                );
            default:
                return null;
        }
    };

    const handleSaveProgress = async () => {
        try {
            setIsSaving(true);

            // Build payload with all pages from all chapters
            const allPages = handbookTree
                .filter(node => node.type === 'chapter')
                .flatMap(chapter => chapter.pages || []);

            const payload = {
                pages: allPages.map(page => ({
                    id: page.id,
                    ready: page.status === 'ready',
                    selected: selectedPages.has(page.id),
                })),
            };

            const response = await handbookApi.saveProgress(payload);

            toast.success(response.message || 'Progress saved successfully!');
        } catch (err: any) {
            console.error('Failed to save progress:', err);
            toast.error(err.message || 'Failed to save progress. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishHandbook = () => {
        const bid = handbookBid;
        if (!bid) {
            toast.error('Handbook ID not found. Please try again.');
            return;
        }

        // Check if any pages are marked as ready
        const allReadyIds = pages
            .filter((p: any) => p.status === 'ready')
            .map((p: any) => p.id);

        if (allReadyIds.length === 0) {
            toast.error('No pages are marked as Ready. Please mark at least one page as Ready before publishing.');
            return;
        }

        // Collect IDs of pages that are both selected AND ready
        const readySelectedIds = pages
            .filter((p: any) => selectedPages.has(p.id) && p.status === 'ready')
            .map((p: any) => p.id);
        const url = readySelectedIds.length > 0
            ? `${handbookRoutes.publish(bid)}?pages=${readySelectedIds.join(',')}`
            : handbookRoutes.publish(bid);
        navigate(url);
    };

    const refreshHandbookTree = async () => {
        try {
            setLoading(true);
            setError(null);
            const { bid, chapters: tree } = await handbookApi.getHandbookTree(lang);

            const uniqueTree = Array.from(
                new Map(tree.map(node => [node.id, node])).values()
            );

            setHandbookTree(uniqueTree);
            setHandbookBid(bid);

            const readyPageIds = new Set<number>();
            uniqueTree.forEach(node => {
                if (node.type === 'chapter' && node.pages) {
                    node.pages.forEach(page => {
                        if (page.status === 'ready') {
                            readyPageIds.add(page.id);
                        }
                    });
                }
            });
            setSelectedPages(readyPageIds);

            // Only set active chapter if none is selected or current one no longer exists
            const chapterIds = new Set(uniqueTree.filter(n => n.type === 'chapter').map(n => n.id));
            if (!activeChapterId || !chapterIds.has(activeChapterId)) {
                if (uniqueTree.length > 0 && uniqueTree[0].type === 'chapter') {
                    setActiveChapterId(uniqueTree[0].id);
                }
            }
        } catch (err: any) {
            console.error('Failed to refresh handbook tree:', err);
            setError(err.message || 'Failed to refresh handbook data');
        } finally {
            setLoading(false);
        }
    };

    const applyPageOrder = async (chapterId: number, orderedPages: HandbookNode[]) => {
        // Optimistic local update
        setHandbookTree((prev) =>
            prev.map((node) =>
                node.type === 'chapter' && node.id === chapterId
                    ? { ...node, pages: orderedPages }
                    : node,
            ),
        );

        const updates = orderedPages.map((p, index) => ({
            nid: p.id,
            pid: chapterId,
            weight: index,
        }));

        try {
            if (!handbookBid) {
                throw new Error('Handbook id is not loaded yet.');
            }
            await handbookApi.reorderHandbook(handbookBid, updates);
        } catch (err: any) {
            console.error('Failed to reorder pages:', err);
            toast.error(err.message || 'Failed to reorder pages. Changes were reverted.');
            await refreshHandbookTree();
        }
    };

    const movePageTo = (sourceId: number, targetId: number, dropPosition: 'top' | 'bottom' = 'bottom') => {
        if (activeChapterId == null) return;
        const chapter = handbookTree.find(
            (node) => node.type === 'chapter' && node.id === activeChapterId,
        );
        if (!chapter || !chapter.pages || chapter.pages.length === 0) return;

        const pages = [...chapter.pages];
        const fromIndex = pages.findIndex((p) => p.id === sourceId);
        if (fromIndex === -1) return;

        const originalToIndex = pages.findIndex((p) => p.id === targetId);
        if (originalToIndex === -1 || fromIndex === originalToIndex) return;

        const [moved] = pages.splice(fromIndex, 1);

        let toIndex = pages.findIndex((p) => p.id === targetId);

        if (dropPosition === 'bottom') {
            toIndex += 1;
        }

        pages.splice(toIndex, 0, moved);

        void applyPageOrder(chapter.id, pages);
    };

    const applyChapterOrder = async (orderedChapters: HandbookNode[]) => {
        // Optimistic local update
        setHandbookTree((prev) => {
            const nonChapters = prev.filter((p) => p.type !== 'chapter');
            return [...orderedChapters, ...nonChapters];
        });

        if (!handbookBid) {
            toast.error('Handbook not fully loaded yet. Please wait and try again.');
            await refreshHandbookTree();
            return;
        }

        const updates = orderedChapters.map((ch, index) => ({
            nid: ch.id,
            pid: handbookBid,
            weight: index,
        }));

        try {
            await handbookApi.reorderHandbook(handbookBid, updates);
        } catch (err: any) {
            console.error('Failed to reorder themes:', err);
            toast.error(err.message || 'Failed to reorder themes. Changes were reverted.');
            await refreshHandbookTree();
        }
    };

    const moveChapterTo = (sourceId: number, targetId: number, dropPosition: 'left' | 'right' = 'right') => {
        const chapterNodes = handbookTree.filter((node) => node.type === 'chapter');
        const chapters = [...chapterNodes];
        const fromIndex = chapters.findIndex((c) => c.id === sourceId);
        if (fromIndex === -1) return;

        const originalToIndex = chapters.findIndex((c) => c.id === targetId);
        if (originalToIndex === -1 || fromIndex === originalToIndex) return;

        const [moved] = chapters.splice(fromIndex, 1);

        let toIndex = chapters.findIndex((c) => c.id === targetId);

        if (dropPosition === 'right') {
            toIndex += 1;
        }

        chapters.splice(toIndex, 0, moved);

        void applyChapterOrder(chapters);
    };

    const openSneakPeek = (pageId: number, title: string) => {
        setSneakPeekPage({ id: pageId, title });
        setSneakPeekOpen(true);
    };

    const handleBulkAction = async (action: 'mark_ready' | 'mark_not_ready' | 'opt_out' | 'include') => {
        if (!canEditHandbook) {
            toast.error("You don't have permission to perform bulk actions.");
            return;
        }

        // Only apply to pages in the current chapter
        const currentChapterPageIds = new Set(pages.map((p: any) => p.id));
        const pageIds = Array.from(selectedPages).filter(id => currentChapterPageIds.has(id));
        if (pageIds.length === 0) {
            toast.error('Select at least one page in this chapter first.');
            return;
        }

        try {
            setIsBulkUpdating(true);
            const response = await handbookApi.bulkAction({ pageIds, action });
            toast.success(`Updated ${response.updatedCount} pages`);
            await refreshHandbookTree();
        } catch (err: any) {
            console.error('Failed to perform bulk action:', err);
            toast.error(err.message || 'Failed to update pages. Please try again.');
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleAddPage = () => {
        if (!canEditHandbook) {
            toast.error("You don't have permission to create handbook pages.");
            return;
        }
        setIsAddPageModalOpen(true);
    };

    return (
        <PageShell>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(handbookRoutes.manage)}
                        className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-3 py-2 h-auto gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold text-[#0d0e0e]">View All Pages</h1>
                    <LanguageToggle value={lang} onChange={setLang} disabled={loading} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={() => setPreviewModalOpen(true)}
                        className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[8px] px-4 py-2 h-auto text-sm"
                    >
                        Preview handbook
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-2 h-auto text-sm bg-white"
                        onClick={() => {
                            if (!canEditHandbook) {
                                toast.error("You don't have permission to create handbook themes.");
                                return;
                            }
                            navigate(handbookRoutes.addTheme);
                        }}
                    >
                        Add theme
                    </Button>
                </div>
            </div>

            {/* Help Banner */}
            <div className="mb-6 bg-[#fffbf0] rounded-[8px] border-l-4 border-[#f59e0b] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-[#0d0e0e]">
                        <span className="font-bold">Help.</span> Select the pages to include, write or edit their
                        content, and mark a page <span className="italic">Ready</span> when it matches exactly what
                        you want. Only pages that are <span className="font-bold">selected</span> and{' '}
                        <span className="font-bold">Ready</span> will be published. You can also create your own
                        pages and themes.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-2 h-auto text-sm whitespace-nowrap"
                    >
                        Read full guide
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                {/* Left Column - Main Content */}
                <div className="space-y-4 min-w-0 overflow-hidden">
                    {/* Search and Status Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search pages"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 rounded-[8px] border-[#e5e7eb]"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStatusFilter(null)}
                            className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 h-10"
                        >
                            Show Your Pages
                        </Button>
                        <div className="flex items-center gap-4 ml-auto">
                            {[
                                { label: 'Ready', color: '#10b981', value: 'ready' },
                                { label: 'Not ready', color: '#f59e0b', value: 'not_ready' },
                                { label: 'Opted out', color: '#ef4444', value: 'opted_out' },
                            ].map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => setStatusFilter(statusFilter === status.value ? null : status.value)}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: status.color }}
                                    />
                                    <span className={statusFilter === status.value ? 'font-semibold' : ''}>
                                        {status.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chapter Tabs */}
                    {!loading && !error && !provisioning && (
                        <div className="w-full overflow-x-auto overflow-y-hidden">
                            <div className="flex items-end gap-0 w-max border-b border-gray-200">
                                {chapters.map((chapter) => (
                                    <button
                                        key={chapter.id}
                                        onClick={() => setActiveChapterId(chapter.id)}
                                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 flex items-center gap-2 relative border-t border-l border-r border-b ${activeChapterId === chapter.id
                                            ? 'text-[#0d0e0e] border-t-gray-200 border-l-gray-200 border-r-gray-200 border-b-white bg-white rounded-t-[4px] -mb-[1px]'
                                            : 'text-gray-500 hover:text-gray-700 border-transparent border-b-gray-200'
                                            } ${draggingChapterId === chapter.id ? 'opacity-40 grayscale-[0.2]' : ''} ${dragOverChapterId === chapter.id ? 'bg-[#f0faf6]' : ''}`}
                                        draggable={canEditHandbook}
                                        onDragStart={(e) => {
                                            if (!canEditHandbook) return;
                                            e.stopPropagation();
                                            if (e.dataTransfer) {
                                                e.dataTransfer.effectAllowed = 'move';
                                            }
                                            setTimeout(() => setDraggingChapterId(chapter.id), 0);
                                        }}
                                        onDragEnd={() => {
                                            setDraggingChapterId(null);
                                            setDragOverChapterId(null);
                                            setDragChapterDropPosition(null);
                                        }}
                                        onDragOver={(e) => {
                                            if (!canEditHandbook || draggingChapterId == null || draggingChapterId === chapter.id) {
                                                e.preventDefault();
                                                return;
                                            }
                                            e.preventDefault();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const offset = e.clientX - rect.left;
                                            const position = offset > rect.width / 2 ? 'right' : 'left';

                                            if (dragOverChapterId !== chapter.id || dragChapterDropPosition !== position) {
                                                setDragOverChapterId(chapter.id);
                                                setDragChapterDropPosition(position);
                                            }
                                        }}
                                        onDragLeave={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                setDragOverChapterId(null);
                                                setDragChapterDropPosition(null);
                                            }
                                        }}
                                        onDrop={(e) => {
                                            if (!canEditHandbook || draggingChapterId == null) return;
                                            e.preventDefault();
                                            if (draggingChapterId !== chapter.id && dragChapterDropPosition) {
                                                moveChapterTo(draggingChapterId, chapter.id, dragChapterDropPosition);
                                            }
                                            setDraggingChapterId(null);
                                            setDragOverChapterId(null);
                                            setDragChapterDropPosition(null);
                                        }}
                                    >
                                        {/* Drop Indicators */}
                                        {dragOverChapterId === chapter.id && dragChapterDropPosition === 'left' && (
                                            <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-[#3d997d] z-10" />
                                        )}
                                        {dragOverChapterId === chapter.id && dragChapterDropPosition === 'right' && (
                                            <div className="absolute top-0 bottom-0 right-0 w-[4px] bg-[#3d997d] z-10" />
                                        )}

                                        {canEditHandbook && (
                                            <GripVertical className="h-4 w-4 text-[#9ca3af] cursor-grab active:cursor-grabbing hover:text-[#3d997d]" />
                                        )}
                                        <span>{chapter.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pages List */}
                    {loading && (
                        <div className="text-center py-12 text-gray-400">Loading handbook...</div>
                    )}

                    {provisioning && !error && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <Loader2 className="h-8 w-8 text-[#d97706] animate-spin" />
                            <div className="text-center">
                                <p className="text-base font-semibold text-[#92400e]">Setting up your handbook...</p>
                                <p className="text-sm text-[#a16207] mt-1">
                                    We're preparing your handbook template. This usually takes a minute or two.
                                </p>
                                <p className="text-sm text-[#a16207] mt-0.5">
                                    The page will refresh automatically when it's ready.
                                </p>
                            </div>
                        </div>
                    )}

                    {error && !provisioning && (
                        <div className="text-center py-12 text-red-500">{error}</div>
                    )}

                    {!loading && !error && !provisioning && (
                        <div className="space-y-3 pt-2">
                            {filteredPages.map((page) => {
                                const isExpanded = expandedPageId === page.id;
                                const status = (page.status as string) || 'not_ready';
                                return (
                                    <div
                                        key={page.id}
                                        className={`page-row-container bg-white rounded-[8px] border border-[#e5e7eb] overflow-hidden relative transition-all duration-200 ${draggingPageId === page.id ? 'opacity-40 shadow-sm bg-gray-50 scale-[0.99] grayscale-[0.2]' : ''} ${dragOverPageId === page.id ? 'bg-[#f0faf6]' : ''}`}
                                        onDragOver={(e) => {
                                            if (!canEditHandbook || !draggingPageId || search || statusFilter || draggingPageId === page.id) {
                                                e.preventDefault();
                                                return;
                                            }
                                            e.preventDefault();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const offset = e.clientY - rect.top;
                                            const position = offset > rect.height / 2 ? 'bottom' : 'top';

                                            if (dragOverPageId !== page.id || dragDropPosition !== position) {
                                                setDragOverPageId(page.id);
                                                setDragDropPosition(position);
                                            }
                                        }}
                                        onDragLeave={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                setDragOverPageId(null);
                                                setDragDropPosition(null);
                                            }
                                        }}
                                        onDrop={(e) => {
                                            if (!canEditHandbook || !draggingPageId || search || statusFilter) {
                                                return;
                                            }
                                            e.preventDefault();
                                            if (draggingPageId !== page.id && dragDropPosition) {
                                                movePageTo(draggingPageId, page.id, dragDropPosition);
                                            }
                                            setDraggingPageId(null);
                                            setDragOverPageId(null);
                                            setDragDropPosition(null);
                                        }}
                                    >
                                        {/* Drop Indicators */}
                                        {dragOverPageId === page.id && dragDropPosition === 'top' && (
                                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#3d997d] z-10 rounded-t-[8px]" />
                                        )}
                                        {dragOverPageId === page.id && dragDropPosition === 'bottom' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3d997d] z-10 rounded-b-[8px]" />
                                        )}

                                        {/* Page Row Header */}
                                        <div
                                            className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${focusedPageId === page.id ? 'bg-[#f0faf6] border-l-4 border-[#3d997d]' : 'border-l-4 border-transparent hover:bg-[#fafafa]'}`}
                                            onClick={() => setFocusedPageId(prev => prev === page.id ? null : page.id)}
                                        >
                                            {/* Checkbox — muted and non-interactive for non-deletable pages */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newSelected = new Set(selectedPages);
                                                    if (newSelected.has(page.id)) {
                                                        newSelected.delete(page.id);
                                                    } else {
                                                        newSelected.add(page.id);
                                                    }
                                                    setSelectedPages(newSelected);
                                                }}
                                                title={page.isDeletable === false ? 'This page cannot be deleted' : undefined}
                                                className="flex-shrink-0 cursor-pointer"
                                            >
                                                <div
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedPages.has(page.id)
                                                            ? 'bg-[#3d997d] border-[#3d997d]'
                                                            : 'border-[#d1d5db] bg-white'
                                                        }`}
                                                >
                                                    {selectedPages.has(page.id) && (
                                                        <svg
                                                            className="w-3 h-3 text-white"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Drag handle */}
                                            {canEditHandbook && !search && !statusFilter && (
                                                <div
                                                    className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[#9ca3af] hover:text-[#3d997d] hover:bg-[#ebf5f1] p-1.5 -ml-1.5 rounded-md transition-all"
                                                    draggable
                                                    onClick={(e) => e.stopPropagation()}
                                                    onDragStart={(e) => {
                                                        e.stopPropagation();
                                                        const rowElement = (e.currentTarget as HTMLElement).closest('.page-row-container');
                                                        if (rowElement && e.dataTransfer) {
                                                            e.dataTransfer.setDragImage(rowElement, 50, 20);
                                                            e.dataTransfer.effectAllowed = 'move';
                                                        }
                                                        setTimeout(() => setDraggingPageId(page.id), 0);
                                                    }}
                                                    onDragEnd={() => {
                                                        setDraggingPageId(null);
                                                        setDragOverPageId(null);
                                                        setDragDropPosition(null);
                                                    }}
                                                >
                                                    <GripVertical className="h-4 w-4" />
                                                </div>
                                            )}

                                            {/* Title and Badges */}
                                            <div className="flex-1 flex items-center gap-3 min-w-0">
                                                <span className="font-medium text-[#0d0e0e] truncate">{page.title}</span>
                                                {page.badge && (
                                                    <Badge className="bg-[#d4f4e6] text-[#1a5948] border-0 rounded-[6px] px-2.5 py-0.5 text-xs flex-shrink-0">
                                                        {page.badge === 'custom' ? 'Custom' : 'Premade'}
                                                    </Badge>
                                                )}
                                                {/* Recent activity summary */}
                                                {(() => {
                                                    const activities: string[] = [];
                                                    if (page.hasCustomBody) activities.push('Edited text');
                                                    if (page.hasNote) activities.push('Note added');
                                                    if (page.hasDocuments) activities.push('Documents attached');
                                                    if (page.hasLinks) activities.push('Links added');
                                                    if (page.hasImage) activities.push('Image added');
                                                    return activities.length > 0 ? (
                                                        <span className="text-xs italic text-gray-400 flex-shrink-0 whitespace-nowrap">
                                                            ({activities.join(', ')})
                                                        </span>
                                                    ) : null;
                                                })()}
                                                {isExpanded && (
                                                    <span className="text-xs text-gray-400 italic flex-shrink-0">No text - Editing draft...</span>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex-shrink-0">
                                                {getStatusBadge(status)}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <div
                                                    title={!canEditHandbook ? 'Only admins can edit handbook pages' : undefined}
                                                    className={!canEditHandbook ? 'cursor-not-allowed' : undefined}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => canEditHandbook && setExpandedPageId(isExpanded ? null : page.id)}
                                                        disabled={!canEditHandbook}
                                                        className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-1.5 h-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Edit
                                                    </Button>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openSneakPeek(page.id, page.title)}
                                                    className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-1.5 h-auto text-sm"
                                                >
                                                    Sneak peek
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Expanded Editor Section */}
                                        {isExpanded && canEditHandbook && (
                                            <div className="border-t border-[#e5e7eb] p-6 bg-[#f9fafb]">
                                                <HandbookPageEditor
                                                    pageId={page.id}
                                                    lang={lang}
                                                    onSave={async () => {
                                                        await refreshHandbookTree();
                                                        setExpandedPageId(null);
                                                    }}
                                                    onCancel={() => setExpandedPageId(null)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Empty State */}
                            {filteredPages.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    No pages found in this chapter.
                                </div>
                            )}

                            {/* Add / Delete Page Actions */}
                            <div className="flex justify-end pt-2 gap-2">
                                {canEditHandbook && (
                                    <Button
                                        variant="outline"
                                        disabled={checkedInViewIds.length === 0 && (!focusedPageId || filteredPages.find((p: any) => p.id === focusedPageId)?.isDeletable === false)}
                                        onClick={() => {
                                            const focusedIsDeletable = focusedPageId && filteredPages.find((p: any) => p.id === focusedPageId)?.isDeletable !== false;
                                            const idsToDelete =
                                                checkedInViewIds.length > 0
                                                    ? checkedInViewIds
                                                    : focusedIsDeletable
                                                        ? [focusedPageId!]
                                                        : [];

                                            if (idsToDelete.length === 0) return;

                                            const titleById = new Map<number, string>();
                                            handbookTree.forEach((chapter) => {
                                                if (chapter.type !== 'chapter') return;
                                                (chapter.pages || []).forEach((page: any) => {
                                                    titleById.set(page.id, page.title);
                                                });
                                            });

                                            const names = idsToDelete.map(
                                                (id) => titleById.get(id) || `Page ${id}`
                                            );
                                            setPendingDelete({ ids: idsToDelete, names });
                                            setDeleteConfirmOpen(true);
                                        }}
                                        className="border-[#fca5a5] text-[#b91c1c] rounded-[8px] px-4 py-2 h-auto text-sm bg-[#fef2f2] hover:bg-[#fee2e2] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Delete page{checkedInViewIds.length > 1 ? ` (${checkedInViewIds.length})` : ''}
                                    </Button>
                                )}
                                <Button
                                    className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[8px] px-6 py-2 h-auto text-sm"
                                    onClick={handleAddPage}
                                    disabled={!canEditHandbook}
                                >
                                    Add Page
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                    {/* Your Progress */}
                    <Card className="bg-white border border-[#e5e7eb] rounded-[8px]">
                        <CardContent className="pt-6">
                            <h3 className="text-base font-bold text-[#0d0e0e] mb-4">Your progress</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Pages selected</span>
                                    <span className="font-bold text-[#0d0e0e]">{progressStats.selected}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Ready</span>
                                    <span className="font-bold text-[#0d0e0e]">{progressStats.ready}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Not ready</span>
                                    <span className="font-bold text-[#0d0e0e]">{progressStats.notReady}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Opted out</span>
                                    <span className="font-bold text-[#0d0e0e]">{progressStats.optedOut}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bulk Actions */}
                    <Card className="bg-white border border-[#e5e7eb] rounded-[8px]">
                        <CardContent className="pt-6">
                            <h3 className="text-base font-bold text-[#0d0e0e] mb-4">Bulk actions</h3>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] text-sm justify-start h-9"
                                    onClick={() => handleBulkAction('mark_ready')}
                                    disabled={!canEditHandbook || isBulkUpdating}
                                >
                                    Mark as Ready
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] text-sm justify-start h-9"
                                    onClick={() => handleBulkAction('mark_not_ready')}
                                    disabled={!canEditHandbook || isBulkUpdating}
                                >
                                    Mark as Not ready
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] text-sm justify-start h-9"
                                    onClick={() => handleBulkAction('opt_out')}
                                    disabled={!canEditHandbook || isBulkUpdating}
                                >
                                    Opt out
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] text-sm justify-start h-9"
                                    onClick={() => handleBulkAction('include')}
                                    disabled={!canEditHandbook || isBulkUpdating}
                                >
                                    Include
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Remember */}
                    <Card className="bg-white border border-[#e5e7eb] rounded-[8px]">
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <p className="text-sm font-bold text-[#0d0e0e] mb-2">Remember:</p>
                                <p className="text-sm text-gray-600">
                                    Only pages that are <strong>selected</strong> and marked <strong>Ready</strong>{' '}
                                    will be visible to employees after you publish. You can always edit later.
                                </p>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm font-medium text-[#0d0e0e] mb-3">Ready to share changes?</p>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handlePublishHandbook}
                                        disabled={!canEditHandbook || isSaving || isBulkUpdating}
                                        className="w-full bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[8px] h-9"
                                    >
                                        Publish handbook
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSaveProgress}
                                        disabled={!canEditHandbook || isSaving || isBulkUpdating}
                                        className="w-full border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] h-9"
                                    >
                                        {isSaving ? 'Saving...' : 'Save progress'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Tip Banner */}
            <div className="mt-6 bg-[#fffbf0] border-l-4 border-[#f59e0b] rounded-[8px] p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="font-bold text-sm mb-1">Tip.</p>
                        <p className="text-sm text-[#0d0e0e]">
                            Want to target pages to specific job types or departments? Create them first under{' '}
                            <span className="font-semibold italic">Settings</span>, then return here to assign
                            visibility.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-2 h-auto text-sm whitespace-nowrap"
                    >
                        Open Settings
                    </Button>
                </div>
            </div>

            {/* Sneak Peek Modal for single pages (from list) */}
            {sneakPeekPage && (
                <SneakPeekModal
                    isOpen={sneakPeekOpen}
                    onClose={() => setSneakPeekOpen(false)}
                    onEditPage={() => {
                        setSneakPeekOpen(false);
                        navigate(handbookRoutes.editPage(sneakPeekPage.id));
                    }}
                    pageId={sneakPeekPage.id}
                    pageTitle={sneakPeekPage.title}
                    lang={lang}
                    canEdit={canEditHandbook}
                />
            )}

            {/* Preview Handbook Modal – shows all ready pages across chapters */}
            <PreviewHandbookModal
                isOpen={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                tree={handbookTree}
                selectedPageIds={checkedInViewIds.length > 0 ? checkedInViewIds : null}
            />

            {/* Add Page Modal */}
            <AddPageModal
                isOpen={isAddPageModalOpen}
                onClose={() => setIsAddPageModalOpen(false)}
                chapters={chapters}
                defaultChapterId={activeChapterId || undefined}
                onSuccess={(newPageId: number) => {
                    // Navigate to the edit page for the newly created page
                    navigate(handbookRoutes.editPage(newPageId));
                }}
            />

            {/* Delete confirmation modal */}
            <Dialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => {
                    if (!open) setPendingDelete(null);
                    setDeleteConfirmOpen(open);
                }}
            >
                <DialogContent className="max-w-md border-[#e5efea] rounded-[16px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#0d0e0e]">
                            <AlertTriangle className="h-5 w-5 text-[#b91c1c]" />
                            Delete handbook pages?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {pendingDelete && (
                            <>
                                <p className="text-sm text-[#374151] mb-3">
                                    You are about to delete {pendingDelete.ids.length} page
                                    {pendingDelete.ids.length !== 1 ? 's' : ''}. This cannot be
                                    undone.
                                </p>
                                <ul className="list-disc list-inside text-sm text-[#374151] space-y-1">
                                    {pendingDelete.names.map((name) => (
                                        <li key={name}>{name}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmOpen(false)}
                            className="rounded-[8px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="rounded-[8px] bg-[#b91c1c] hover:bg-[#991b1b] text-white"
                            disabled={!pendingDelete}
                            onClick={async () => {
                                if (!pendingDelete) return;
                                setDeleteConfirmOpen(false);
                                try {
                                    for (const id of pendingDelete.ids) {
                                        await handbookApi.deletePage(id);
                                    }
                                    toast.success(
                                        pendingDelete.ids.length === 1
                                            ? 'Page deleted'
                                            : `${pendingDelete.ids.length} pages deleted`
                                    );
                                    setFocusedPageId((current) =>
                                        current && pendingDelete.ids.includes(current)
                                            ? null
                                            : current
                                    );
                                    setSelectedPages((prev) => {
                                        const next = new Set(prev);
                                        pendingDelete.ids.forEach((id) => next.delete(id));
                                        return next;
                                    });
                                    await refreshHandbookTree();
                                } catch (err: any) {
                                    const apiError = err?.response?.data?.error;
                                    const message =
                                        typeof apiError?.message === 'string' &&
                                            apiError.message.trim()
                                            ? apiError.message.trim()
                                            : err?.message ||
                                            'Failed to delete page(s). Please try again.';
                                    toast.error(message);
                                }
                                setPendingDelete(null);
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageShell>
    );
};
