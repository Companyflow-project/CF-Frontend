import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, BookOpen, Search, ChevronDown, ChevronRight, FileText, CheckCircle2, Clock, XCircle, GripVertical } from 'lucide-react';
import { handbookApi } from '../api';
import { handbookRoutes } from '../routes';
import { SneakPeekModal } from '../components/sneak-peek-modal';
import { useAuth } from '@/context/auth-context';
import { useViewAsEmployee } from '@/context/view-as-employee-context';
import { isAdminRole, canViewAllPagesRole } from '@/lib/utils';
import { toast } from 'sonner';
import type { HandbookNode } from '@/types/models';
import { useTranslation } from 'react-i18next';
import { useHandbookLang } from '../components/language-toggle';

export const HandbookTableOfContentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { viewAsEmployee } = useViewAsEmployee();
    const canEditHandbook = !viewAsEmployee && isAdminRole(user?.role);
    const canViewAllPages = !viewAsEmployee && canViewAllPagesRole(user?.role);

    const { t } = useTranslation('handbook');
    const [lang] = useHandbookLang();
    const [tree, setTree] = useState<HandbookNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [collapsedChapters, setCollapsedChapters] = useState<Set<number>>(new Set());

    // Sneak Peek modal state
    const [sneakPeekOpen, setSneakPeekOpen] = useState(false);
    const [sneakPeekPage, setSneakPeekPage] = useState<{ id: number; title: string } | null>(null);
    const [draggingChapterId, setDraggingChapterId] = useState<number | null>(null);
    const [handbookBid, setHandbookBid] = useState<number | null>(null);

    const openSneakPeek = (pageId: number, title: string) => {
        setSneakPeekPage({ id: pageId, title });
        setSneakPeekOpen(true);
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                setError(null);
                const { bid, chapters: data } = await handbookApi.getHandbookTree(lang);
                // Deduplicate
                const unique = Array.from(new Map(data.map((n) => [n.id, n])).values());
                setTree(unique);
                setHandbookBid(bid);
            } catch (err: any) {
                setError(err.message || 'Failed to load table of contents');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [lang]);

    const chapters = useMemo(
        () => tree.filter((n) => n.type === 'chapter'),
        [tree],
    );

    const applyChapterOrder = async (orderedChapters: HandbookNode[]) => {
        const others = tree.filter((n) => n.type !== 'chapter');
        setTree([...orderedChapters, ...others]);

        if (!handbookBid) {
            toast.error(t('toc.notLoaded'));
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
            toast.error(err.message || t('toc.reorderFailed'));
            try {
                const { chapters: data } = await handbookApi.getHandbookTree();
                const unique = Array.from(new Map(data.map((n) => [n.id, n])).values());
                setTree(unique);
            } catch (refetchErr) {
                console.error('Failed to refetch handbook tree after reorder error:', refetchErr);
            }
        }
    };

    const moveChapter = (chapterId: number, direction: 'up' | 'down') => {
        const current = chapters;
        const index = current.findIndex((ch) => ch.id === chapterId);
        if (index === -1) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= current.length) return;

        const reordered = [...current];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);

        void applyChapterOrder(reordered);
    };

    const visibleChapters = useMemo(() => {
        if (canViewAllPages) return chapters;
        // Non-admin/non-senior: only show chapters that have at least one ready page
        return chapters
            .map((ch) => ({
                ...ch,
                pages: (ch.pages || []).filter((p) => (p.status as string) === 'ready'),
            }))
            .filter((ch) => (ch.pages?.length ?? 0) > 0);
    }, [chapters, canViewAllPages]);

    const filteredChapters = useMemo(() => {
        if (!search.trim()) return visibleChapters;
        const q = search.toLowerCase();
        return visibleChapters
            .map((ch) => ({
                ...ch,
                pages: (ch.pages || []).filter((p) => p.title.toLowerCase().includes(q)),
            }))
            .filter((ch) => ch.title.toLowerCase().includes(q) || (ch.pages?.length ?? 0) > 0);
    }, [visibleChapters, search]);

    const toggleChapter = (id: number) => {
        setCollapsedChapters((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const totalPages = useMemo(
        () => chapters.reduce((acc, ch) => acc + (ch.pages?.length ?? 0), 0),
        [chapters],
    );

    const readyPages = useMemo(
        () =>
            chapters.reduce(
                (acc, ch) =>
                    acc + (ch.pages?.filter((p) => (p.status as string) === 'ready').length ?? 0),
                0,
            ),
        [chapters],
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ready':
                return <CheckCircle2 className="h-3.5 w-3.5 text-[#3d997d]" />;
            case 'not_ready':
                return <Clock className="h-3.5 w-3.5 text-[#d97706]" />;
            case 'opted_out':
                return <XCircle className="h-3.5 w-3.5 text-[#dc2626]" />;
            default:
                return <Clock className="h-3.5 w-3.5 text-[#9ca3af]" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ready': return t('status.ready');
            case 'not_ready': return t('status.notReady');
            case 'opted_out': return t('status.optedOut');
            default: return status;
        }
    };

    // Global page index counter across all chapters for numbering
    let globalPageIndex = 0;

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
                        {t('common:back')}
                    </Button>
                    <h1 className="text-2xl font-bold text-[#0d0e0e]">{t('toc.title')}</h1>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(handbookRoutes.pages)}
                    className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-2 h-auto text-sm bg-white"
                >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t('toc.viewAllPages')}
                </Button>
            </div>

            {/* Stats bar */}
            {!loading && !error && chapters.length > 0 && (
                <div className="mb-6 grid grid-cols-3 gap-4">
                    <div className="bg-white border border-[#e5efea] rounded-[14px] px-5 py-4 flex items-center gap-4 shadow-[0_2px_8px_rgba(14,51,38,0.05)]">
                        <div className="h-10 w-10 rounded-[10px] bg-[#d4f4e6] flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-[#1a5948]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0d0e0e]">{chapters.length}</p>
                            <p className="text-xs text-[#6b7475] mt-0.5">{t('toc.chapters')}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-[#e5efea] rounded-[14px] px-5 py-4 flex items-center gap-4 shadow-[0_2px_8px_rgba(14,51,38,0.05)]">
                        <div className="h-10 w-10 rounded-[10px] bg-[#dbeafe] flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-[#1e40af]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0d0e0e]">{totalPages}</p>
                            <p className="text-xs text-[#6b7475] mt-0.5">{t('toc.totalPages')}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-[#e5efea] rounded-[14px] px-5 py-4 flex items-center gap-4 shadow-[0_2px_8px_rgba(14,51,38,0.05)]">
                        <div className="h-10 w-10 rounded-[10px] bg-[#d4f4e6] flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-[#3d997d]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#0d0e0e]">{readyPages}</p>
                            <p className="text-xs text-[#6b7475] mt-0.5">{t('toc.ready')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            {!loading && !error && chapters.length > 0 && (
                <div className="mb-5">
                    <div className="relative w-[320px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={t('toc.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10 rounded-[8px] border-[#e5e7eb] bg-white text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-[14px] border border-[#e5efea] overflow-hidden">
                            <div className="px-6 py-4 flex items-center gap-4">
                                <div className="h-8 w-8 rounded-[8px] bg-[#e5efea]" />
                                <div className="h-4 w-48 rounded bg-[#e5efea]" />
                            </div>
                            <div className="px-6 pb-4 space-y-3">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="flex items-center gap-4 py-2 border-t border-[#f3f4f6]">
                                        <div className="h-3 w-6 rounded bg-[#f3f4f6]" />
                                        <div className="h-3 w-56 rounded bg-[#e5efea]" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Not published state */}
            {error === 'HANDBOOK_NOT_PUBLISHED' && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="h-16 w-16 rounded-[18px] bg-[#d4f4e6] flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-[#1a5948]" />
                    </div>
                    <p className="text-lg font-semibold text-[#0d0e0e]">{t('toc.notPublished')}</p>
                    <p className="text-sm text-[#6b7475] max-w-sm text-center">
                        {t('toc.notPublishedDesc')}
                    </p>
                </div>
            )}

            {/* Error */}
            {error && error !== 'HANDBOOK_NOT_PUBLISHED' && (
                <div className="text-center py-16 text-red-500">{error}</div>
            )}

            {/* Empty state */}
            {!loading && !error && chapters.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="h-16 w-16 rounded-[18px] bg-[#d4f4e6] flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-[#1a5948]" />
                    </div>
                    <p className="text-lg font-semibold text-[#0d0e0e]">{t('toc.noChapters')}</p>
                    <p className="text-sm text-[#6b7475] max-w-sm text-center">
                        {t('toc.noChaptersDesc')}
                    </p>
                    <Button
                        onClick={() => navigate(handbookRoutes.pages)}
                        className="rounded-[999px] px-6 py-2 h-auto text-sm mt-2"
                        style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                    >
                        {t('toc.goToPages')}
                    </Button>
                </div>
            )}

            {/* No search results */}
            {!loading && !error && chapters.length > 0 && filteredChapters.length === 0 && (
                <div className="text-center py-16 text-[#9ca3af] text-sm">
                    {t('toc.noSearchResults')} "<span className="font-medium text-[#0d0e0e]">{search}</span>".
                </div>
            )}

            {/* TOC List */}
            {!loading && !error && filteredChapters.length > 0 && (
                <div className="space-y-4">
                    {filteredChapters.map((chapter, chapterIndex) => {
                        const isCollapsed = collapsedChapters.has(chapter.id);
                        const chapterPages = chapter.pages || [];
                        const chapterNumber = chapterIndex + 1;

                        return (
                            <div
                                key={chapter.id}
                                className="bg-white border border-[#e5efea] rounded-[16px] shadow-[0_2px_10px_rgba(14,51,38,0.06)] overflow-hidden"
                            >
                                {/* Chapter header */}
                                <button
                                    type="button"
                                    onClick={() => toggleChapter(chapter.id)}
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#f6fbf9] transition-colors text-left group"
                                    onDragOver={(e) => {
                                        if (!canEditHandbook || draggingChapterId == null) return;
                                        e.preventDefault();
                                    }}
                                    onDrop={(e) => {
                                        if (!canEditHandbook || draggingChapterId == null) return;
                                        e.preventDefault();
                                        if (draggingChapterId === chapter.id) return;
                                        moveChapter(draggingChapterId, 'down');
                                        setDraggingChapterId(null);
                                    }}
                                >
                                    {/* Chapter number bubble */}
                                    <div className="flex-shrink-0 h-9 w-9 rounded-[10px] bg-[#1a5948] text-white flex items-center justify-center text-sm font-bold shadow-[0_4px_10px_rgba(26,89,72,0.3)]">
                                        {chapterNumber}
                                    </div>

                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <p className="text-base font-bold text-[#0d0e0e] truncate">
                                            {chapter.title}
                                        </p>
                                        <p className="text-xs text-[#6b7475] mt-0.5">
                                            {t('toc.pageCount', { count: chapterPages.length })}
                                        </p>
                                        {canEditHandbook && (
                                            <div
                                                className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[#9ca3af]"
                                                draggable
                                                onClick={(e) => e.stopPropagation()}
                                                onDragStart={(e) => {
                                                    e.stopPropagation();
                                                    setDraggingChapterId(chapter.id);
                                                }}
                                                onDragEnd={() => setDraggingChapterId(null)}
                                            >
                                                <GripVertical className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress pills */}
                                    <div className="hidden sm:flex items-center gap-2 mr-2">
                                        {(() => {
                                            const ready = chapterPages.filter((p) => (p.status as string) === 'ready').length;
                                            const notReady = chapterPages.filter((p) => (p.status as string) === 'not_ready').length;
                                            const optedOut = chapterPages.filter((p) => (p.status as string) === 'opted_out').length;
                                            return (
                                                <>
                                                    {ready > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1a5948] bg-[#d4f4e6] rounded-full px-2.5 py-0.5">
                                                            <CheckCircle2 className="h-3 w-3" /> {ready}
                                                        </span>
                                                    )}
                                                    {notReady > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#92400e] bg-[#fef3c7] rounded-full px-2.5 py-0.5">
                                                            <Clock className="h-3 w-3" /> {notReady}
                                                        </span>
                                                    )}
                                                    {optedOut > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#991b1b] bg-[#fee2e2] rounded-full px-2.5 py-0.5">
                                                            <XCircle className="h-3 w-3" /> {optedOut}
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div className="flex-shrink-0 text-[#9ca3af] group-hover:text-[#1a5948] transition-colors">
                                        {isCollapsed ? (
                                            <ChevronRight className="h-5 w-5" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5" />
                                        )}
                                    </div>
                                </button>

                                {/* Drag footer removed; drag handle is now inline with the title */}

                                {/* Pages list */}
                                {!isCollapsed && (
                                    <div className="border-t border-[#f0f5f3]">
                                        {chapterPages.length === 0 ? (
                                            <div className="px-6 py-5 text-sm text-[#9ca3af] italic">
                                                {t('toc.noPagesInChapter')}
                                            </div>
                                        ) : (
                                            chapterPages.map((page, pageIndex) => {
                                                globalPageIndex += 1;
                                                const isLast = pageIndex === chapterPages.length - 1;
                                                const status = page.status as string;

                                                return (
                                                    <div
                                                        key={page.id}
                                                        className={`flex items-center gap-4 px-6 py-3.5 hover:bg-[#f6fbf9] transition-colors ${!isLast ? 'border-b border-[#f0f5f3]' : ''}`}
                                                    >
                                                        {/* Page number */}
                                                        <div className="flex-shrink-0 w-8 text-right">
                                                            <span className="text-xs font-mono font-semibold text-[#c4cec9]">
                                                                {String(globalPageIndex).padStart(2, '0')}
                                                            </span>
                                                        </div>

                                                        {/* Dot leader visual */}
                                                        <div className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-[#d4f4e6]" />

                                                        {/* Title */}
                                                        <button
                                                            type="button"
                                                            onClick={() => openSneakPeek(page.id, page.title)}
                                                            className="flex-1 text-left text-sm font-medium text-[#0d0e0e] hover:text-[#3d997d] transition-colors truncate"
                                                        >
                                                            {page.title}
                                                        </button>

                                                        {/* Content indicators */}
                                                        {(() => {
                                                            const tags: string[] = [];
                                                            if (page.badge === 'custom') tags.push(t('tag.customPage'));
                                                            if (page.hasText) tags.push(t('tag.addedText'));
                                                            if (!page.hasText) tags.push(t('tag.noText'));
                                                            if (page.hasReceipt) tags.push(t('tag.receipt'));
                                                            if (page.hasNote) tags.push(t('tag.notes'));
                                                            if (page.hasDocuments) tags.push(t('tag.documents'));
                                                            if (page.hasLinks) tags.push(t('tag.links'));
                                                            if (page.hasImage) tags.push(t('tag.image'));
                                                            return (
                                                                <span className="flex-shrink-0 text-[11px] text-[#6b7475] italic truncate max-w-[260px]">
                                                                    ({tags.join(', ')})
                                                                </span>
                                                            );
                                                        })()}

                                                        {/* Badge (custom/premade) */}
                                                        {page.badge && !(page.badge === 'premade' && !page.hasText) && (
                                                            <span className="flex-shrink-0 text-[11px] font-medium text-[#1a5948] bg-[#f0faf6] border border-[#cde9dc] rounded-full px-2 py-0.5">
                                                                {page.badge === 'custom' ? t('badge.custom') : t('badge.premade')}
                                                            </span>
                                                        )}

                                                        {/* Status */}
                                                        <div className="flex-shrink-0 flex items-center gap-1.5">
                                                            {getStatusIcon(status)}
                                                            <span className="text-[11px] text-[#6b7475] hidden sm:inline">
                                                                {getStatusLabel(status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Sneak Peek Modal */}
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
                    canEdit={canEditHandbook}
                    canViewNotes={canViewAllPages}
                    handbookBid={handbookBid}
                />
            )}
        </PageShell>
    );
};
