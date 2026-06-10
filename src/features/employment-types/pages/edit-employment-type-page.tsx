import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useEmploymentType, useUpdateEmploymentType } from '@/features/employment-types/hooks';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface EditEmploymentTypeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employmentTypeId: number | null;
}

export const EditEmploymentTypeDialog: React.FC<EditEmploymentTypeDialogProps> = ({
    open,
    onOpenChange,
    employmentTypeId,
}) => {
    const { data: employmentType, isLoading } = useEmploymentType(employmentTypeId ?? undefined);
    const { t } = useTranslation('account');
    const updateMutation = useUpdateEmploymentType();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    // Populate form when employment type loads
    useEffect(() => {
        if (employmentType) {
            setFormData({
                name: employmentType.name || '',
                description: employmentType.description || '',
            });
        }
    }, [employmentType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!employmentTypeId) {
            toast.error(t('employmentTypes.toast.missingId'));
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id: employmentTypeId,
                payload: {
                    name: formData.name,
                    description: formData.description,
                },
            });

            toast.success(t('employmentTypes.toast.updated'));
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to update employment type:', error);
            toast.error(t('employmentTypes.toast.updateFailed'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[600px] w-[700px] p-0 gap-0">
                {/* Custom Header with Close Button */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold text-[#0d0e0e]">{t('employmentTypes.dialog.editTitle')}</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {isLoading ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                        {t('employmentTypes.dialog.loading')}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-6 space-y-5">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-name" className="text-sm font-medium text-[#0d0e0e]">
                                    {t('employmentTypes.dialog.name')}
                                </Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('employmentTypes.dialog.namePlaceholder')}
                                    required
                                    className="h-11"
                                />
                            </div>

                            {/* Description Field */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-description" className="text-sm font-medium text-[#0d0e0e]">
                                    {t('employmentTypes.dialog.description')}
                                </Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={t('employmentTypes.dialog.descriptionPlaceholder')}
                                    className="min-h-[120px] resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="px-6"
                            >
                                {t('employmentTypes.dialog.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending || !formData.name.trim()}
                                className="px-6"
                                style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                            >
                                {updateMutation.isPending ? t('employmentTypes.dialog.updating') : t('employmentTypes.dialog.update')}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};
