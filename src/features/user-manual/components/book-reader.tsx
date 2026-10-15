import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, ChevronRight, ChevronDown, Search, AlertCircle, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ManualNavItem, ManualSection } from '../api';

export interface BookReaderProps {
    /** Shown above the menu (and in the full-screen top bar). */
    title: string;
    /** Route the pages live under, e.g. "/user-manual" → "/user-manual/<key or nid>". */
    routeBase: string;
    loadTree: (lang: string) => Promise<ManualNavItem[]>;
    loadSection: (nid: number, lang: string) => Promise<ManualSection>;
    /** Inside the app layout (below the top menu) instead of a full-screen page of its own. */
    embedded?: boolean;
}

// ─── Sidebar nav item (recursive) ───────────────────────────────────────────

const NavItem: React.FC<{
    item: ManualNavItem;
    activeNid: number | null;
    onSelect: (item: ManualNavItem) => void;
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
                    onSelect(item);
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

function findParent(items: ManualNavItem[], nid: number): ManualNavItem | null {
    for (const item of items) {
        if (item.children?.some((c) => c.nid === nid)) return item;
        const found = item.children ? findParent(item.children, nid) : null;
        if (found) return found;
    }
    return null;
}

// ─── Reader ──────────────────────────────────────────────────────────────────

/**
 * A book (chapters and pages) with a menu on the left and the selected page on the right.
 * Used for the user manual and the management handbook.
 */
export const BookReader: React.FC<BookReaderProps> = ({ title, routeBase, loadTree, loadSection, embedded = false }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('common');
    // The books are written in Danish and English.
    const lang = i18n.language?.startsWith('en') ? 'en' : 'da';
    // A page is addressed by its topic key (/user-manual/employees) or by its node id.
    const { nid: pageParam } = useParams<{ nid?: string }>();
    /** URL of a page: by its topic key when it has one. */
    const linkFor = (item: ManualNavItem) => `${routeBase}/${item.key ?? item.nid}`;

    const [tree, setTree] = useState<ManualNavItem[]>([]);
    const [treeLoading, setTreeLoading] = useState(true);
    const [treeError, setTreeError] = useState<string | null>(null);

    const [section, setSection] = useState<ManualSection | null>(null);
    const [sectionLoading, setSectionLoading] = useState(false);
    const [sectionError, setSectionError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    // Phones: the menu folds away behind a button once a page is open.
    const [menuOpen, setMenuOpen] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);

    const flat = flattenTree(tree);
    const activeNid = !pageParam
        ? null
        : /^\d+$/.test(pageParam)
            ? Number(pageParam)
            : flat.find((item) => item.key === pageParam)?.nid ?? null;

    // ── Load tree (again when the language changes) ─────────────────────────
    useEffect(() => {
        setTreeLoading(true);
        loadTree(lang)
            .then((data) => {
                setTree(data);
                setTreeError(null);
            })
            .catch((err) => setTreeError(err.message || t('userManualPage.loadError')))
            .finally(() => setTreeLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang]);

    // ── Open the first page when no page (or an unknown topic) is in the URL ─
    useEffect(() => {
        if (treeLoading || treeError || activeNid != null || flat.length === 0) return;
        navigate(linkFor(flat[0]), { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [treeLoading, treeError, activeNid, tree]);

    // ── Load section when the page or language changes ──────────────────────
    useEffect(() => {
        if (activeNid == null) return;
        setSectionLoading(true);
        setSectionError(null);
        setSection(null);
        loadSection(activeNid, lang)
            .then((data) => {
                setSection(data);
                // Scroll content area to top
                if (embedded) window.scrollTo({ top: 0 });
                else if (contentRef.current) contentRef.current.scrollTop = 0;
            })
            .catch((err) => setSectionError(err.message || t('userManualPage.loadError')))
            .finally(() => setSectionLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeNid, lang]);

    const handleSelect = useCallback(
        (item: ManualNavItem) => {
            setMenuOpen(false);
            navigate(linkFor(item));
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [navigate, routeBase],
    );

    // Links between pages stay inside the app; links to other websites open in a new tab.
    const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const href = (e.target as HTMLElement).closest('a')?.getAttribute('href');
        if (href?.startsWith(`${routeBase}/`)) {
            e.preventDefault();
            navigate(href);
        } else if (href && /^https?:\/\//i.test(href)) {
            e.preventDefault();
            window.open(href, '_blank', 'noopener');
        }
    };

    // ── Prev / Next ─────────────────────────────────────────────────────────
    const currentIndex = flat.findIndex((item) => item.nid === activeNid);
    const prevItem = currentIndex > 0 ? flat[currentIndex - 1] : null;
    const nextItem = currentIndex >= 0 && currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;
    const parentItem = activeNid != null ? findParent(tree, activeNid) : null;
    const activeItem = flat.find((item) => item.nid === activeNid) ?? null;
    // A chapter without text of its own lists its pages instead.
    const showChildList = !!section && !section.body.trim() && !!activeItem?.children?.length;

    const sidebar = (
        <>
            {/* Search */}
            <div className="px-4 py-3 border-b border-[#f0f5f3]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                    <Input
                        placeholder={t('userManualPage.search')}
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
                    <p className="text-xs text-[#9ca3af] mt-3 px-2">{t('userManualPage.empty')}</p>
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
        </>
    );

    const content = (
        <>
            {/* Loading skeleton */}
            {sectionLoading && <ContentSkeleton />}

            {/* Error */}
            {!sectionLoading && sectionError && (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="h-12 w-12 rounded-[14px] bg-red-50 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <p className="text-sm font-medium text-[#0d0e0e]">{t('userManualPage.sectionError')}</p>
                    <p className="text-xs text-[#9ca3af]">{sectionError}</p>
                </div>
            )}

            {/* Empty / no selection */}
            {!sectionLoading && !sectionError && !section && !pageParam && !treeLoading && (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="h-14 w-14 rounded-[16px] bg-[#d4f4e6] flex items-center justify-center">
                        <BookOpen className="h-7 w-7 text-[#1a5948]" />
                    </div>
                    <p className="text-base font-semibold text-[#0d0e0e]">{t('userManualPage.selectTitle')}</p>
                    <p className="text-sm text-[#9ca3af]">{t('userManualPage.selectHint')}</p>
                </div>
            )}

            {/* Section content */}
            {!sectionLoading && !sectionError && section && (
                <>
                    {/* Chapter the page belongs to */}
                    {parentItem && (
                        <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wider mb-3">
                            {parentItem.title}
                        </p>
                    )}

                    <h1 className="text-3xl font-bold text-[#0b0c0c] leading-tight mb-6">
                        {section.title}
                    </h1>

                    <div
                        onClick={handleContentClick}
                        className="prose prose-sm max-w-none
                            prose-headings:font-bold prose-headings:text-[#0d0e0e]
                            prose-h2:text-xl prose-h3:text-lg
                            prose-p:text-[#374151] prose-p:leading-relaxed
                            prose-lead:text-base prose-lead:text-[#374151]
                            prose-a:text-[#3d997d] prose-a:no-underline hover:prose-a:underline
                            prose-li:text-[#374151]
                            prose-strong:text-[#0d0e0e]
                            prose-code:bg-[#f0f5f3] prose-code:text-[#1a5948] prose-code:rounded prose-code:px-1
                            prose-pre:bg-[#f0f5f3] prose-pre:border prose-pre:border-[#e5efea] prose-pre:rounded-[10px]
                            prose-blockquote:border-l-[#3d997d] prose-blockquote:text-[#6b7280]
                            prose-hr:border-[#e5efea]
                            prose-img:my-0 prose-img:rounded-[12px] prose-img:border prose-img:border-[#e5efea] prose-img:shadow-sm prose-img:cursor-zoom-in
                            prose-figcaption:text-xs prose-figcaption:text-[#6b7280]
                            prose-dt:text-[#0d0e0e] prose-dd:text-[#374151]
                            [&_.ui]:inline-block [&_.ui]:rounded-md [&_.ui]:border [&_.ui]:border-[#d6e8e1] [&_.ui]:bg-[#f0f7f5]
                            [&_.ui]:px-1.5 [&_.ui]:text-[0.92em] [&_.ui]:font-medium [&_.ui]:leading-snug [&_.ui]:text-[#1a5948]
                        "
                        dangerouslySetInnerHTML={{ __html: section.body }}
                    />

                    {showChildList && (
                        <ul className="space-y-1">
                            {activeItem!.children!.map((child) => (
                                <li key={child.nid}>
                                    <button
                                        onClick={() => handleSelect(child)}
                                        className="w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-[10px] border border-[#e5efea] text-sm text-[#0d0e0e] hover:bg-[#f6fbf9] hover:text-[#1a5948] transition-colors"
                                    >
                                        <span>{child.title}</span>
                                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#9ca3af]" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Prev / Next navigation */}
                    {(prevItem || nextItem) && (
                        <div className="mt-12 pt-6 border-t border-[#e5efea] flex items-center justify-between gap-4">
                            {prevItem ? (
                                <button
                                    onClick={() => handleSelect(prevItem)}
                                    className="flex items-center gap-2 text-sm text-[#3d997d] hover:text-[#1a5948] font-medium transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4 rotate-180" />
                                    <span className="truncate max-w-[220px]">{prevItem.title}</span>
                                </button>
                            ) : <span />}
                            {nextItem && (
                                <button
                                    onClick={() => handleSelect(nextItem)}
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
        </>
    );

    if (embedded) {
        return (
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
                <h1 className="text-2xl font-bold text-[#0d0e0e] mb-5 flex items-center gap-3">
                    <span className="h-9 w-9 rounded-[10px] bg-[#d4f4e6] flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-[#1a5948]" />
                    </span>
                    {title}
                </h1>
                <button
                    onClick={() => setMenuOpen((open) => !open)}
                    className="md:hidden mb-4 w-full flex items-center justify-between px-4 py-3 rounded-[12px] border border-[#e5efea] bg-white text-sm font-medium text-[#0d0e0e]"
                    aria-expanded={menuOpen}
                >
                    <span className="flex items-center gap-2 min-w-0">
                        <List className="h-4 w-4 flex-shrink-0 text-[#3d997d]" />
                        <span className="truncate">{activeItem?.title ?? t('userManualPage.contents')}</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 flex-shrink-0 text-[#9ca3af] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <aside className={`${menuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-72 md:flex-shrink-0 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] bg-white border border-[#e5efea] rounded-[14px] flex-col overflow-hidden`}>
                        {sidebar}
                    </aside>
                    <main ref={contentRef} className="flex-1 min-w-0 w-full bg-white border border-[#e5efea] rounded-[14px] px-6 sm:px-10 py-8">
                        {content}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f7faf9] min-h-screen flex flex-col">
            {/* Top bar */}
            <div className="bg-white border-b border-[#e5efea] px-6 py-4 flex items-center gap-3 flex-shrink-0">
                <div className="h-8 w-8 rounded-[9px] bg-[#d4f4e6] flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-[#1a5948]" />
                </div>
                <h1 className="text-lg font-bold text-[#0d0e0e]">{title}</h1>
                <Link
                    to="/"
                    className="ml-auto flex items-center gap-1.5 text-sm text-[#3d997d] hover:text-[#1a5948] font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('userManualPage.backToApp')}
                </Link>
            </div>

            <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
                {/* ── Sidebar ─────────────────────────────────────────── */}
                <aside className="w-72 flex-shrink-0 bg-white border-r border-[#e5efea] flex flex-col overflow-hidden">
                    {sidebar}
                </aside>

                {/* ── Content ─────────────────────────────────────────── */}
                <main ref={contentRef} className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-8 py-10">
                        {content}
                    </div>
                </main>
            </div>
        </div>
    );
};
