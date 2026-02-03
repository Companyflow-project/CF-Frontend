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
import { useEmploymentTypes } from '@/features/employment-types/hooks';
import { useAuth } from '@/context/auth-context';
import { AddEmploymentTypeDialog } from './add-employment-type-page';

export const ViewEmploymentTypesPage: React.FC = () => {
    const navigate = useNavigate();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const { user } = useAuth();
    const companyId = user?.companyId ? String(user.companyId) : undefined;

    const { data: employmentTypes, isLoading } = useEmploymentTypes(companyId);

    const handleAssignToEmployees = (typeId: number, typeName: string) => {
        navigate(`/account/employment-types/${typeId}/assign`, { state: { typeName } });
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
                <div className="mb-6 bg-[#fff9f0] rounded-lg border-l-4 border-[#f59e0b] p-4 flex items-start justify-between">
                    <p className="text-sm text-[#0d0e0e]">
                        <span className="font-bold">Help.</span> Here you can view and update all available employment types.
                    </p>
                    <Button
                        variant="link"
                        className="text-[#0d0e0e] underline whitespace-nowrap"
                    >
                        User manual
                    </Button>
                </div>
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
                            employmentTypes.map((type) => (
                                <TableRow key={type.id} className="hover:bg-gray-50">
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
                                                onClick={() => navigate(`/account/employment-types/edit/${type.id}`)}
                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (window.confirm(`Delete employment type "${type.name}"?`)) {
                                                        // TODO: Implement delete
                                                        console.log('Delete:', type.id);
                                                    }
                                                }}
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

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
                © 2025 CompanyFlow. All rights reserved.
            </div>

            {/* Add Employment Type Dialog */}
            <AddEmploymentTypeDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
            />
        </PageShell>
    );
};
