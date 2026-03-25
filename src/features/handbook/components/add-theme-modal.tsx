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
import { useTranslation } from 'react-i18next';
import { handbookApi } from '../api';

interface AddThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
    /**
     * Called with the newly created page id (first page in the new chapter).
     * We keep this consistent with AddPageModal so the caller can navigate to edit.
     */
    onSuccess: (newPageId: number) => void;
}

export const AddThemeModal: React.FC<AddThemeModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation('handbook');
    const [chapterName, setChapterName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setChapterName('');
        setError(null);
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetState();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chapterName.trim()) {
            setError(t('addTheme.errorNoName'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Backend currently creates a chapter via createPage with newChapterName.
            // We use the same value for the first page title; it can be edited later.
            const name = chapterName.trim();
            const response = await handbookApi.createPage({
                title: name,
                newChapterName: name,
            });

            onSuccess(response.id);
            resetState();
            onClose();
        } catch (err: any) {
            console.error('Failed to create theme:', err);
            setError(err.message || t('addTheme.errorFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-[420px] max-w-none">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#0d0e0e]">
                        {t('addTheme.title')}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="theme-name" className="text-sm font-medium text-[#0d0e0e]">
                            {t('addTheme.nameLabel')}
                        </Label>
                        <Input
                            id="theme-name"
                            type="text"
                            value={chapterName}
                            onChange={(e) => {
                                setChapterName(e.target.value);
                                setError(null);
                            }}
                            placeholder={t('addTheme.namePlaceholder')}
                            className="h-10 rounded-[8px] border-[#e5e7eb]"
                            disabled={isSubmitting}
                            autoFocus
                        />
                        <p className="text-xs text-[#7b8a85]">
                            {t('addTheme.description')}
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-[8px] p-3">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="mt-6 flex justify-between items-center">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="rounded-[8px] px-5 py-2 h-auto text-sm"
                        >
                            {t('common:cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-[8px] px-5 py-2 h-auto text-sm"
                            style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                        >
                            {isSubmitting ? t('addTheme.creating') : t('addTheme.create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

