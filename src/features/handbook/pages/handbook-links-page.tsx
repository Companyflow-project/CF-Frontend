import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, ExternalLink, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { handbookApi } from '../api';
import { handbookRoutes } from '../routes';
import { useAuth } from '@/context/auth-context';
import { useViewAsEmployee } from '@/context/view-as-employee-context';
import { isAdminRole } from '@/lib/utils';
import type { HandbookResourceLink } from '@/types/models';

export const HandbookLinksPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('handbook');
    const { user } = useAuth();
    const { viewAsEmployee } = useViewAsEmployee();
    const isAdmin = !viewAsEmployee && isAdminRole(user?.role);
    const lang = i18n.language || 'da';
    const [links, setLinks] = useState<HandbookResourceLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchLinks = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await handbookApi.getResourceLinks(lang);
                setLinks(data);
            } catch (err: any) {
                console.error('Failed to fetch links:', err);
                setError(err.message || 'Failed to load links');
            } finally {
                setLoading(false);
            }
        };

        fetchLinks();
    }, [lang]);

    const filteredLinks = links.filter((link) => {
        const searchLower = search.toLowerCase();
        return (
            link.pageTitle?.toLowerCase().includes(searchLower) ||
            link.bookTitle?.toLowerCase().includes(searchLower) ||
            link.label?.toLowerCase().includes(searchLower) ||
            link.url?.toLowerCase().includes(searchLower)
        );
    });

    // Group by book title
    const groupedLinks = filteredLinks.reduce((acc, link) => {
        const book = link.bookTitle || 'Uncategorized';
        if (!acc[book]) {
            acc[book] = [];
        }
        acc[book].push(link);
        return acc;
    }, {} as Record<string, HandbookResourceLink[]>);

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
                    <h1 className="text-2xl font-bold text-[#0d0e0e]">{t('resources.links')}</h1>
                </div>
            </div>

            {/* Help Banner */}
            <div className="mb-6 bg-[#fffbf0] rounded-[8px] border-l-4 border-[#f59e0b] px-5 py-4">
                <p className="text-sm text-[#0d0e0e]">
                    {t('resources.helpDesc')} <span className="italic">{t('resources.helpReady')}</span>. {t('resources.helpOnlyPages')} <span className="font-bold">{t('resources.helpSelected')}</span> {t('resources.helpWillBePublished')}
                </p>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative w-[320px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={t('resources.searchLinks')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-[8px] border-[#e5e7eb]"
                    />
                </div>
            </div>

            {/* Content */}
            {loading && (
                <div className="text-center py-12 text-gray-400">{t('resources.loadingLinks')}</div>
            )}

            {error && (
                <div className="text-center py-12 text-red-500">{error}</div>
            )}

            {!loading && !error && (
                <div className="space-y-6">
                    {Object.keys(groupedLinks).length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            {t('resources.noLinks')}
                        </div>
                    ) : (
                        Object.entries(groupedLinks).map(([bookTitle, bookLinks]) => (
                            <div key={bookTitle} className="bg-white rounded-[12px] border border-[#e5e7eb] overflow-hidden">
                                {/* Book Header */}
                                <div className="bg-[#f9fafb] px-6 py-3 border-b border-[#e5e7eb]">
                                    <h2 className="text-base font-bold text-[#0d0e0e]">{bookTitle}</h2>
                                </div>

                                {/* Links Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#e5e7eb] bg-[#fafafa]">
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b7475] uppercase tracking-wide">
                                                    {t('resources.page')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b7475] uppercase tracking-wide">
                                                    {t('resources.book')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b7475] uppercase tracking-wide">
                                                    {t('resources.url')}
                                                </th>
                                                {isAdmin && (
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#6b7475] uppercase tracking-wide">
                                                        {t('resources.actions')}
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookLinks.map((link, index) => (
                                                <tr
                                                    key={`${link.pageId}-${index}`}
                                                    className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#f9fafb] transition-colors"
                                                >
                                                    <td className="px-6 py-4 text-sm text-[#0d0e0e]">
                                                        {link.pageTitle}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[#6b7475]">
                                                        {link.bookTitle || '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {link.url ? (
                                                            <a
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[#3d997d] hover:underline inline-flex items-center gap-1"
                                                            >
                                                                {link.label || link.url}
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-6 py-4 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => navigate(handbookRoutes.editPage(link.pageId))}
                                                                className="text-[#3d997d] hover:bg-[#f4fbf8] rounded-[6px] px-3 py-1.5 h-auto"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </PageShell>
    );
};
