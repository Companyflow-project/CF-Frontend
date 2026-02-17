import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    SelectRoot,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select-new';
import { handbookApi } from '../api';
import type { HandbookNode } from '@/types/models';

interface AddPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    chapters: HandbookNode[];
    defaultChapterId?: number;
    onSuccess: (newPageId: number) => void;
}

export const AddPageModal: React.FC<AddPageModalProps> = ({
    isOpen,
    onClose,
    chapters,
    defaultChapterId,
    onSuccess,
}) => {
    const [title, setTitle] = useState('');
    const [selectedChapterId, setSelectedChapterId] = useState<number | 'new'>(
        defaultChapterId || (chapters.length > 0 ? chapters[0].id : 'new')
    );
    const [newChapterName, setNewChapterName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedChapter = chapters.find(ch => ch.id === selectedChapterId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate title
        if (!title.trim()) {
            setError('Please enter a page title.');
            return;
        }

        // Validate new chapter name if creating new chapter
        if (selectedChapterId === 'new' && !newChapterName.trim()) {
            setError('Please enter a chapter name.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // API Call: POST /handbook/pages
            const response = await handbookApi.createPage({
                title: title.trim(),
                parentId: selectedChapterId === 'new' ? undefined : selectedChapterId,
                newChapterName: selectedChapterId === 'new' ? newChapterName.trim() : undefined,
            });

            // On Success: Call onSuccess with the new page ID and close modal
            onSuccess(response.id);

            // Reset form
            setTitle('');
            setNewChapterName('');
            setSelectedChapterId(defaultChapterId || (chapters.length > 0 ? chapters[0].id : 'new'));
            onClose();
        } catch (err: any) {
            console.error('Failed to create page:', err);
            setError(err.message || 'Failed to create page. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setTitle('');
            setNewChapterName('');
            setSelectedChapterId(defaultChapterId || (chapters.length > 0 ? chapters[0].id : 'new'));
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-[480px] max-w-none">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#0d0e0e]">
                        Add New Page
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    {/* Page Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="page-title" className="text-sm font-medium text-[#0d0e0e]">
                            Page Title
                        </Label>
                        <Input
                            id="page-title"
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setError(null);
                            }}
                            placeholder="e.g., Office Rules"
                            className="h-10 rounded-[8px] border-[#e5e7eb]"
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>

                    {/* Chapter Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="chapter-select" className="text-sm font-medium text-[#0d0e0e]">
                            Theme / Chapter
                        </Label>
                        <SelectRoot
                            value={selectedChapterId === 'new' ? 'new' : String(selectedChapterId)}
                            onValueChange={(value) => {
                                setSelectedChapterId(value === 'new' ? 'new' : Number(value));
                                setError(null);
                            }}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger className="h-10 rounded-[8px] border-[#e5e7eb]">
                                <SelectValue placeholder="Select a chapter" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Option to create new chapter */}
                                <SelectItem value="new">Create New Chapter</SelectItem>

                                {/* Existing chapters */}
                                {chapters.map((chapter) => (
                                    <SelectItem key={chapter.id} value={String(chapter.id)}>
                                        {chapter.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                        {selectedChapter && (
                            <p className="text-xs text-[#7b8a85]">
                                This page will be added to the {selectedChapter.title} handbook.
                            </p>
                        )}
                    </div>

                    {/* New Chapter Name (conditional) */}
                    {selectedChapterId === 'new' && (
                        <div className="space-y-2">
                            <Label htmlFor="chapter-name" className="text-sm font-medium text-[#0d0e0e]">
                                Chapter Name
                            </Label>
                            <Input
                                id="chapter-name"
                                type="text"
                                value={newChapterName}
                                onChange={(e) => {
                                    setNewChapterName(e.target.value);
                                    setError(null);
                                }}
                                placeholder="e.g., Company Policies"
                                className="h-10 rounded-[8px] border-[#e5e7eb]"
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-[#7b8a85]">
                                A new chapter will be created with this name.
                            </p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-[8px] p-3">
                            {error}
                        </div>
                    )}

                    {/* Footer: Cancel and Create & Edit */}
                    <DialogFooter className="mt-6 flex justify-between items-center">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="rounded-[8px] px-5 py-2 h-auto text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-[8px] px-5 py-2 h-auto text-sm bg-[#3d997d] hover:bg-[#3d997d]/90 text-white"
                        >
                            {isSubmitting ? 'Creating...' : 'Create & Edit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
