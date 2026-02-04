import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, Pencil, Trash2 } from 'lucide-react';
import { useEmploymentTypes, useDeleteEmploymentType } from '@/features/employment-types/hooks';
import { useAuth } from '@/context/auth-context';
import { AddEmploymentTypeDialog } from './add-employment-type-page';
import { EditEmploymentTypeDialog } from './edit-employment-type-page';
import { HelpBanner } from '@/components/ui/help-banner';
import { toast } from 'sonner';

export const ViewEmploymentTypesPage: React.FC = () => {
    const navigate = useNavigate();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const { user } = useAuth();
    const companyId = user?.companyId ? String(user.companyId) : undefined;

    const { data: employmentTypes, isLoading } = useEmploymentTypes(companyId);
    const deleteMutation = useDeleteEmploymentType();

    const handleAssignToEmployees = (typeId: number, typeName: string) => {
        navigate(`/account/employment-types/${typeId}/assign`, { state: { typeName } });
    };

    const handleEdit = (typeId: number) => {
        setSelectedTypeId(typeId);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (typeId: number, typeName: string) => {
        if (window.confirm(`Are you sure you want to delete the employment type "${typeName}"? This action cannot be undone.`)) {
            try {
                await deleteMutation.mutateAsync(typeId);
                toast.success('Employment type deleted successfully');
            } catch (error) {
                console.error('Failed to delete employment type:', error);
                toast.error('Failed to delete employment type. Please try again.');
            }
        }
    };

    return (
        <PageShell>
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/account')}
                            className="h-9 px-3"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-[#0d0e0e]">Employment Types</h1>
                    </div>
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white"
                    >
                        Add employment type
                    </Button>
                </div>

                {/* Help Banner */}
                <HelpBanner className="mb-6">
                    Here you can view and manage all available employment types. Employment types help you categorize your employees and assign them to different groups.
                </HelpBanner>
            </div>

            {/* Employment Types Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-[#0d0e0e]">Name</TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e]">Description</TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e] w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                    Loading employment types...
                                </TableCell>
                            </TableRow>
                        ) : !employmentTypes || employmentTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                    No employment types found. Create your first one!
                                </TableCell>
                            </TableRow>
                        ) : (
                            employmentTypes.map((type, index) => (
                                <TableRow key={`${type.id}-${index}`} className="hover:bg-gray-50">
                                    <TableCell className="font-medium text-[#0d0e0e]">{type.name}</TableCell>
                                    <TableCell className="text-gray-700">{type.description || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAssignToEmployees(type.id, type.name)}
                                                className="h-8 w-8 p-0 text-[#2f946f] hover:text-[#2f946f]/80 hover:bg-[#2f946f]/10"
                                                title="Click to assign employment type to employees"
                                            >
                                                <Users className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(type.id)}
                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(type.id, type.name)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add Employment Type Dialog */}
            <AddEmploymentTypeDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
            />

            {/* Edit Employment Type Dialog */}
            <EditEmploymentTypeDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                employmentTypeId={selectedTypeId}
            />
        </PageShell>
    );
};
