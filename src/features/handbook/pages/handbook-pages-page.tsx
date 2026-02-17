import React, { useState, useMemo, useEffect } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HandbookPageEditor } from '../components/handbook-page-editor';
import { AddPageModal } from '../components/add-page-modal';
import { SneakPeekModal } from '../components/sneak-peek-modal';
import { handbookApi } from '../api';
import { handbookRoutes } from '../routes';
import type { HandbookNode } from '@/types/models';
import { useAuth } from '@/context/auth-context';

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
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);

    const canEditHandbook = user?.role === 'ADMIN' || user?.role === 'company_admin';

    // Sneak Peek modal state
    const [sneakPeekOpen, setSneakPeekOpen] = useState(false);
    const [sneakPeekPage, setSneakPeekPage] = useState<{ id: number; title: string } | null>(null);

    useEffect(() => {
        const fetchHandbookTree = async () => {
            try {
                setLoading(true);
                setError(null);
                const tree = await handbookApi.getHandbookTree();

                // Deduplicate the entire tree by node ID to prevent duplicate key warnings
                const uniqueTree = Array.from(
                    new Map(tree.map(node => [node.id, node])).values()
                );

                setHandbookTree(uniqueTree);

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
                if (uniqueTree.length > 0 && uniqueTree[0].type === 'chapter') {
                    setActiveChapterId(uniqueTree[0].id);
                }
            } catch (err: any) {
                console.error('Failed to fetch handbook tree:', err);
                setError(err.message || 'Failed to load handbook data');
            } finally {
                setLoading(false);
            }
        };

        fetchHandbookTree();
    }, []);

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
        return pages.filter((page) => {
            const status = page.status as string;
            if (statusFilter && status !== statusFilter) return false;
            if (search && !page.title.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [pages, search, statusFilter]);

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

            alert(response.message || 'Progress saved successfully!');
        } catch (err: any) {
            console.error('Failed to save progress:', err);
            alert(err.message || 'Failed to save progress. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishHandbook = async () => {
        try {
            setIsPublishing(true);
            const response = await handbookApi.publishHandbook();

            const updatedStructure = response.data;

            const uniqueTree = Array.from(
                new Map(updatedStructure.map(node => [node.id, node])).values()
            );

            setHandbookTree(uniqueTree);

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

            if (uniqueTree.length > 0 && uniqueTree[0].type === 'chapter') {
                setActiveChapterId(uniqueTree[0].id);
            }

            alert(response.message || 'Handbook is now live for employees');
        } catch (err: any) {
            console.error('Failed to publish handbook:', err);
            alert(err.message || 'Failed to publish handbook. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    const refreshHandbookTree = async () => {
        try {
            setLoading(true);
            setError(null);
            const tree = await handbookApi.getHandbookTree();

            const uniqueTree = Array.from(
                new Map(tree.map(node => [node.id, node])).values()
            );

            setHandbookTree(uniqueTree);

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

            if (uniqueTree.length > 0 && uniqueTree[0].type === 'chapter') {
                setActiveChapterId(uniqueTree[0].id);
            }
        } catch (err: any) {
            console.error('Failed to refresh handbook tree:', err);
            setError(err.message || 'Failed to refresh handbook data');
        } finally {
            setLoading(false);
        }
    };

    const openSneakPeek = (pageId: number, title: string) => {
        setSneakPeekPage({ id: pageId, title });
        setSneakPeekOpen(true);
    };

    const handleBulkAction = async (action: 'mark_ready' | 'mark_not_ready' | 'opt_out' | 'include') => {
        if (!canEditHandbook) {
            alert("You don't have permission to perform bulk actions.");
            return;
        }

        const pageIds = Array.from(selectedPages);
        if (pageIds.length === 0) {
            alert('Select at least one page first.');
            return;
        }

        try {
            setIsBulkUpdating(true);
            const response = await handbookApi.bulkAction({ pageIds, action });
            alert(`Updated ${response.updatedCount} pages`);
            await refreshHandbookTree();
        } catch (err: any) {
            console.error('Failed to perform bulk action:', err);
            alert(err.message || 'Failed to update pages. Please try again.');
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleAddPage = () => {
        if (!canEditHandbook) {
            alert("You don't have permission to create handbook pages.");
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
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[8px] px-4 py-2 h-auto text-sm">
                        Preview Handbook
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-2 h-auto text-sm bg-white"
                    >
                        Order of themes
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-2 h-auto text-sm bg-white"
                    >
                        Add theme
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-2 h-auto text-sm bg-white"
                    >
                        Handbook settings
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
                    {!loading && !error && (
                        <div className="w-full overflow-x-auto overflow-y-hidden">
                            <div className="flex items-end gap-0 w-max border-b border-gray-200">
                                {chapters.map((chapter) => (
                                    <button
                                        key={chapter.id}
                                        onClick={() => setActiveChapterId(chapter.id)}
                                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${activeChapterId === chapter.id
                                            ? 'text-[#0d0e0e] border border-gray-200 border-b-white bg-white rounded-t-[4px] -mb-[1px]'
                                            : 'text-gray-500 hover:text-gray-700 border border-transparent'
                                            }`}
                                    >
                                        {chapter.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pages List */}
                    {loading && (
                        <div className="text-center py-12 text-gray-400">Loading handbook...</div>
                    )}

                    {error && (
                        <div className="text-center py-12 text-red-500">{error}</div>
                    )}

                    {!loading && !error && (
                        <div className="space-y-3 pt-2">
                            {filteredPages.map((page) => {
                                const isExpanded = expandedPageId === page.id;
                                const status = (page.status as string) || 'not_ready';
                                const hasNote = (page as any).hasNote === true;

                                return (
                                    <div
                                        key={page.id}
                                        className="bg-white rounded-[8px] border border-[#e5e7eb] overflow-hidden"
                                    >
                                        {/* Page Row Header */}
                                        <div className="flex items-center gap-4 p-4">
                                            {/* Checkbox */}
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

                                            {/* Title and Badges */}
                                            <div className="flex-1 flex items-center gap-3">
                                                <span className="font-medium text-[#0d0e0e]">{page.title}</span>
                                                {page.badge && (
                                                    <Badge className="bg-[#d4f4e6] text-[#1a5948] border-0 rounded-[6px] px-2.5 py-0.5 text-xs">
                                                        {page.badge === 'custom' ? 'Custom' : 'Premade'}
                                                    </Badge>
                                                )}
                                                {hasNote && (
                                                    <Badge className="bg-[#fff7d6] text-[#7a5a00] border border-[#d4b86a] rounded-[6px] px-2.5 py-0.5 text-xs">
                                                        Note
                                                    </Badge>
                                                )}
                                                {isExpanded && (
                                                    <span className="text-xs text-gray-400 italic">No text - Editing draft...</span>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex-shrink-0">
                                                {getStatusBadge(status)}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setExpandedPageId(isExpanded ? null : page.id)}
                                                    className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-4 py-1.5 h-auto text-sm"
                                                >
                                                    Edit
                                                </Button>
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
                                        {isExpanded && (
                                            <div className="border-t border-[#e5e7eb] p-6 bg-[#f9fafb]">
                                                <HandbookPageEditor
                                                    pageId={page.id}
                                                    onSave={() => setExpandedPageId(null)}
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

                            {/* Add Page Button */}
                            <div className="flex justify-end pt-2">
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
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSaveProgress}
                                        disabled={!canEditHandbook || isSaving || isPublishing}
                                        className="flex-1 border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] h-9"
                                    >
                                        {isSaving ? 'Saving...' : 'Save progress'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handlePublishHandbook}
                                        disabled={!canEditHandbook || isSaving || isPublishing}
                                        className="flex-1 bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[8px] h-9"
                                    >
                                        {isPublishing ? 'Publishing...' : 'Publish handbook'}
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
                />
            )}

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
        </PageShell>
    );
};
