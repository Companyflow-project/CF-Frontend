import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useCreateEmploymentType } from '@/features/employment-types/hooks';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

interface AddEmploymentTypeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const AddEmploymentTypeDialog: React.FC<AddEmploymentTypeDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const { user } = useAuth();
    const createMutation = useCreateEmploymentType();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.companyId) {
            toast.error('No company linked. Please log in again.');
            return;
        }

        try {
            await createMutation.mutateAsync({
                name: formData.name,
                description: formData.description,
                companyId: String(user.companyId),
            });

            toast.success('Employment type added successfully');

            // Clear form and close dialog
            setFormData({ name: '', description: '' });
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to create employment type:', error);
            toast.error('Failed to create employment type. Please try again.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[600px] w-[700px] p-0 gap-0">
                {/* Custom Header with Close Button */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold text-[#0d0e0e]">Add Employment Type</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-6 space-y-5">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-[#0d0e0e]">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Operations"
                                required
                                className="h-11"
                            />
                        </div>

                        {/* Description Field */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-[#0d0e0e]">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="In charge of managing daily operations"
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
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || !formData.name.trim()}
                            className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white px-6"
                        >
                            {createMutation.isPending ? 'Adding...' : 'Add employment type'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
