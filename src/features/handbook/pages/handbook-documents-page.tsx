import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, FileText, Edit } from 'lucide-react';
import { handbookApi } from '../api';
import { handbookRoutes } from '../routes';
import type { HandbookResourceDocument } from '@/types/models';

export const HandbookDocumentsPage: React.FC = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<HandbookResourceDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await handbookApi.getResourceDocuments();
                setDocuments(data);
            } catch (err: any) {
                console.error('Failed to fetch documents:', err);
                setError(err.message || 'Failed to load documents');
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const filteredDocuments = documents.filter((doc) => {
        const searchLower = search.toLowerCase();
        return (
            doc.pageTitle?.toLowerCase().includes(searchLower) ||
            doc.bookTitle?.toLowerCase().includes(searchLower) ||
            doc.filename?.toLowerCase().includes(searchLower) ||
            doc.description?.toLowerCase().includes(searchLower)
        );
    });

    // Group by book title
    const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
        const book = doc.bookTitle || 'Uncategorized';
        if (!acc[book]) {
            acc[book] = [];
        }
        acc[book].push(doc);
        return acc;
    }, {} as Record<string, HandbookResourceDocument[]>);

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
                    <h1 className="text-2xl font-bold text-[#0d0e0e]">Documents</h1>
                </div>
            </div>

            {/* Help Banner */}
            <div className="mb-6 bg-[#fffbf0] rounded-[8px] border-l-4 border-[#f59e0b] px-5 py-4">
                <p className="text-sm text-[#0d0e0e]">
                    <span className="font-bold">Help.</span> Select the pages to include, write or edit their
                    content, and mark a page <span className="italic">Ready</span> when it matches exactly what
                    you want. Only pages that are <span className="font-bold">selected</span> and{' '}
                    <span className="font-bold">Ready</span> will be published. You can also create your own
                    pages and themes.
                </p>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative w-[320px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search documents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-[8px] border-[#e5e7eb]"
                    />
                </div>
            </div>

            {/* Content */}
            {loading && (
                <div className="text-center py-12 text-gray-400">Loading documents...</div>
            )}

            {error && (
                <div className="text-center py-12 text-red-500">{error}</div>
            )}

            {!loading && !error && (
                <div className="space-y-6">
                    {Object.keys(groupedDocuments).length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            No documents found.
                        </div>
                    ) : (
                        Object.entries(groupedDocuments).map(([bookTitle, bookDocuments]) => (
                            <div key={bookTitle} className="bg-white rounded-[12px] border border-[#e5e7eb] overflow-hidden">
                                {/* Book Header */}
                                <div className="bg-[#f9fafb] px-6 py-3 border-b border-[#e5e7eb]">
                                    <h2 className="text-base font-bold text-[#0d0e0e]">{bookTitle}</h2>
                                </div>

                                {/* Documents Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#e5e7eb] bg-[#fafafa]">
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b7475] uppercase tracking-wide">
                                                    Page
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b7475] uppercase tracking-wide">
                                                    Book
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b7475] uppercase tracking-wide">
                                                    Document
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-[#6b7475] uppercase tracking-wide">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookDocuments.map((doc, index) => (
                                                <tr
                                                    key={`${doc.pageId}-${index}`}
                                                    className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#f9fafb] transition-colors"
                                                >
                                                    <td className="px-6 py-4 text-sm text-[#0d0e0e]">
                                                        {doc.pageTitle}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[#6b7475]">
                                                        {doc.bookTitle || '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {doc.filename ? (
                                                            <div className="space-y-1">
                                                                {doc.fileUrl ? (
                                                                    <a
                                                                        href={doc.fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[#3d997d] hover:underline inline-flex items-center gap-2 text-sm font-medium"
                                                                    >
                                                                        <FileText className="h-4 w-4" />
                                                                        {doc.filename}
                                                                    </a>
                                                                ) : (
                                                                    <div className="inline-flex items-center gap-2 text-sm text-[#0d0e0e]">
                                                                        <FileText className="h-4 w-4 text-gray-400" />
                                                                        {doc.filename}
                                                                    </div>
                                                                )}
                                                                {doc.description && (
                                                                    <p className="text-xs text-[#6b7475] line-clamp-1">
                                                                        {doc.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(handbookRoutes.editPage(doc.pageId))}
                                                            className="text-[#3d997d] hover:bg-[#f4fbf8] rounded-[6px] px-3 py-1.5 h-auto"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </td>
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
