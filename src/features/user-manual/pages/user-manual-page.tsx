import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ChevronRight, ChevronDown, Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { userManualApi, ManualNavItem, ManualSection } from '../api';
import { userManualRoutes } from '../routes';

// ─── Sidebar nav item (recursive) ───────────────────────────────────────────

const NavItem: React.FC<{
    item: ManualNavItem;
    activeNid: number | null;
    onSelect: (nid: number) => void;
    searchQuery: string;
}> = ({ item, activeNid, onSelect, searchQuery }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.nid === activeNid;
    const [open, setOpen] = useState(true); // default expanded

    // Auto-expand if a child is active
    useEffect(() => {
        if (hasChildren && item.children!.some((c) => c.nid === activeNid)) {
            setOpen(true);
        }
    }, [activeNid, hasChildren, item.children]);

    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const childrenMatchSearch =
        hasChildren &&
        item.children!.some(
            (c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()),
        );

    if (searchQuery && !matchesSearch && !childrenMatchSearch) return null;

    const indent = item.depth * 14; // 14px per level

    return (
        <li>
            <div
                style={{ paddingLeft: `${indent + 12}px` }}
                className={`group flex items-center justify-between pr-3 py-2 rounded-[10px] cursor-pointer select-none transition-all text-sm ${isActive
                    ? 'bg-[#d4f4e6] text-[#1a5948] font-semibold'
                    : 'text-[#374151] hover:bg-[#f6fbf9] hover:text-[#1a5948]'
                    }`}
                onClick={() => {
                    onSelect(item.nid);
                    if (hasChildren) setOpen((p) => !p);
                }}
            >
                <span className="flex-1 truncate leading-snug">{item.title}</span>
                {hasChildren && (
                    <span className="flex-shrink-0 ml-1 text-[#9ca3af]">
                        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </span>
                )}
            </div>
            {hasChildren && open && (
                <ul className="mt-0.5 space-y-0.5">
                    {item.children!.map((child) => (
                        <NavItem
                            key={child.nid}
                            item={child}
                            activeNid={activeNid}
                            onSelect={onSelect}
                            searchQuery={searchQuery}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

// ─── Content skeleton ────────────────────────────────────────────────────────

const ContentSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-4 pt-2">
        <div className="h-8 w-2/3 rounded-[8px] bg-[#e5efea]" />
        <div className="h-3 w-full rounded bg-[#f0f5f3]" />
        <div className="h-3 w-5/6 rounded bg-[#f0f5f3]" />
        <div className="h-3 w-full rounded bg-[#f0f5f3]" />
        <div className="h-3 w-4/6 rounded bg-[#f0f5f3]" />
        <div className="mt-6 h-5 w-1/3 rounded bg-[#e5efea]" />
        <div className="h-3 w-full rounded bg-[#f0f5f3]" />
        <div className="h-3 w-5/6 rounded bg-[#f0f5f3]" />
        <div className="h-3 w-full rounded bg-[#f0f5f3]" />
        <div className="mt-6 h-5 w-1/2 rounded bg-[#e5efea]" />
        <div className="h-3 w-full rounded bg-[#f0f5f3]" />
        <div className="h-3 w-3/4 rounded bg-[#f0f5f3]" />
    </div>
);

// ─── Sidebar skeleton ────────────────────────────────────────────────────────

const SidebarSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-2 mt-4">
        {[80, 60, 90, 50, 70, 55, 65, 75].map((w, i) => (
            <div
                key={i}
                className="h-4 rounded bg-[#e5efea]"
                style={{ width: `${w}%`, marginLeft: i % 3 === 0 ? 0 : '14px' }}
            />
        ))}
    </div>
);

// ─── Flatten tree helper (for prev/next navigation) ──────────────────────────

function flattenTree(items: ManualNavItem[]): ManualNavItem[] {
    return items.flatMap((item) => [item, ...(item.children ? flattenTree(item.children) : [])]);
}

// ─── Main page ───────────────────────────────────────────────────────────────

export const UserManualPage: React.FC = () => {
    const navigate = useNavigate();
    const { nid: nidParam } = useParams<{ nid?: string }>();

    const [tree, setTree] = useState<ManualNavItem[]>([]);
    const [treeLoading, setTreeLoading] = useState(true);
    const [treeError, setTreeError] = useState<string | null>(null);

    const [section, setSection] = useState<ManualSection | null>(null);
    const [sectionLoading, setSectionLoading] = useState(false);
    const [sectionError, setSectionError] = useState<string | null>(null);

    const [activeNid, setActiveNid] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const contentRef = useRef<HTMLDivElement>(null);

    // ── Load tree once ──────────────────────────────────────────────────────
    useEffect(() => {
        setTreeLoading(true);
        userManualApi
            .getTree()
            .then((data) => {
                setTree(data);
                setTreeError(null);
                // If no NID in URL, auto-select first item
                if (!nidParam) {
                    const flat = flattenTree(data);
                    if (flat.length > 0) {
                        navigate(userManualRoutes.section(flat[0].nid), { replace: true });
                    }
                }
            })
            .catch((err) => setTreeError(err.message || 'Failed to load manual'))
            .finally(() => setTreeLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Load section when NID param changes ─────────────────────────────────
    useEffect(() => {
        if (!nidParam) return;
        const nid = Number(nidParam);
        setActiveNid(nid);
        setSectionLoading(true);
        setSectionError(null);
        setSection(null);
        userManualApi
            .getSection(nid)
            .then((data) => {
                setSection(data);
                // Scroll content area to top
                if (contentRef.current) contentRef.current.scrollTop = 0;
            })
            .catch((err) => setSectionError(err.message || 'Failed to load section'))
            .finally(() => setSectionLoading(false));
    }, [nidParam]);

    const handleSelect = useCallback(
        (nid: number) => {
            navigate(userManualRoutes.section(nid));
        },
        [navigate],
    );

    // ── Prev / Next ─────────────────────────────────────────────────────────
    const flat = flattenTree(tree);
    const currentIndex = flat.findIndex((item) => item.nid === activeNid);
    const prevItem = currentIndex > 0 ? flat[currentIndex - 1] : null;
    const nextItem = currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;

    return (
        <div className="bg-[#f7faf9] min-h-screen flex flex-col">
            {/* Top bar */}
            <div className="bg-white border-b border-[#e5efea] px-6 py-4 flex items-center gap-3 flex-shrink-0">
                <div className="h-8 w-8 rounded-[9px] bg-[#d4f4e6] flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-[#1a5948]" />
                </div>
                <h1 className="text-lg font-bold text-[#0d0e0e]">User Manual</h1>
            </div>

            <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
                {/* ── Sidebar ─────────────────────────────────────────── */}
                <aside className="w-72 flex-shrink-0 bg-white border-r border-[#e5efea] flex flex-col overflow-hidden">
                    {/* Search */}
                    <div className="px-4 py-3 border-b border-[#f0f5f3]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                            <Input
                                placeholder="Search…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 rounded-[8px] border-[#e5e7eb] text-sm bg-[#f9fafb] placeholder:text-[#9ca3af]"
                            />
                        </div>
                    </div>

                    {/* Nav tree */}
                    <nav className="flex-1 overflow-y-auto px-3 py-3">
                        {treeLoading && <SidebarSkeleton />}
                        {treeError && (
                            <p className="text-xs text-red-500 mt-3 px-2">{treeError}</p>
                        )}
                        {!treeLoading && !treeError && tree.length === 0 && (
                            <p className="text-xs text-[#9ca3af] mt-3 px-2">No content available.</p>
                        )}
                        {!treeLoading && !treeError && tree.length > 0 && (
                            <ul className="space-y-0.5">
                                {tree.map((item) => (
                                    <NavItem
                                        key={item.nid}
                                        item={item}
                                        activeNid={activeNid}
                                        onSelect={handleSelect}
                                        searchQuery={search}
                                    />
                                ))}
                            </ul>
                        )}
                    </nav>
                </aside>

                {/* ── Content ─────────────────────────────────────────── */}
                <main ref={contentRef} className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-8 py-10">
                        {/* Loading skeleton */}
                        {sectionLoading && <ContentSkeleton />}

                        {/* Error */}
                        {!sectionLoading && sectionError && (
                            <div className="flex flex-col items-center justify-center py-24 gap-3">
                                <div className="h-12 w-12 rounded-[14px] bg-red-50 flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-red-400" />
                                </div>
                                <p className="text-sm font-medium text-[#0d0e0e]">Could not load section</p>
                                <p className="text-xs text-[#9ca3af]">{sectionError}</p>
                            </div>
                        )}

                        {/* Empty / no selection */}
                        {!sectionLoading && !sectionError && !section && !nidParam && !treeLoading && (
                            <div className="flex flex-col items-center justify-center py-24 gap-3">
                                <div className="h-14 w-14 rounded-[16px] bg-[#d4f4e6] flex items-center justify-center">
                                    <BookOpen className="h-7 w-7 text-[#1a5948]" />
                                </div>
                                <p className="text-base font-semibold text-[#0d0e0e]">Select a section</p>
                                <p className="text-sm text-[#9ca3af]">Choose a topic from the sidebar to get started.</p>
                            </div>
                        )}

                        {/* Section content */}
                        {!sectionLoading && !sectionError && section && (
                            <>
                                {/* Breadcrumb-style depth indicator */}
                                {activeNid && (
                                    <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wider mb-3">
                                        Section #{section.nid}
                                    </p>
                                )}

                                <h1 className="text-3xl font-bold text-[#0b0c0c] leading-tight mb-6">
                                    {section.title}
                                </h1>

                                <div
                                    className="prose prose-sm max-w-none
                                        prose-headings:font-bold prose-headings:text-[#0d0e0e]
                                        prose-h2:text-xl prose-h3:text-lg
                                        prose-p:text-[#374151] prose-p:leading-relaxed
                                        prose-a:text-[#3d997d] prose-a:no-underline hover:prose-a:underline
                                        prose-li:text-[#374151]
                                        prose-strong:text-[#0d0e0e]
                                        prose-code:bg-[#f0f5f3] prose-code:text-[#1a5948] prose-code:rounded prose-code:px-1
                                        prose-pre:bg-[#f0f5f3] prose-pre:border prose-pre:border-[#e5efea] prose-pre:rounded-[10px]
                                        prose-blockquote:border-l-[#3d997d] prose-blockquote:text-[#6b7280]
                                        prose-hr:border-[#e5efea]
                                    "
                                    dangerouslySetInnerHTML={{ __html: section.body }}
                                />

                                {/* Prev / Next navigation */}
                                {(prevItem || nextItem) && (
                                    <div className="mt-12 pt-6 border-t border-[#e5efea] flex items-center justify-between gap-4">
                                        {prevItem ? (
                                            <button
                                                onClick={() => handleSelect(prevItem.nid)}
                                                className="flex items-center gap-2 text-sm text-[#3d997d] hover:text-[#1a5948] font-medium transition-colors"
                                            >
                                                <ChevronRight className="h-4 w-4 rotate-180" />
                                                <span className="truncate max-w-[220px]">{prevItem.title}</span>
                                            </button>
                                        ) : <span />}
                                        {nextItem && (
                                            <button
                                                onClick={() => handleSelect(nextItem.nid)}
                                                className="flex items-center gap-2 text-sm text-[#3d997d] hover:text-[#1a5948] font-medium transition-colors ml-auto"
                                            >
                                                <span className="truncate max-w-[220px]">{nextItem.title}</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
