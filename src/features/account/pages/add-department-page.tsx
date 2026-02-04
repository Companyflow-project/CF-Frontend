import React, { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { accountRoutes } from '@/features/account/routes';
import { useCreateDepartment } from '@/features/departments/hooks';
import { useAuth } from '@/context/auth-context';
import { useEmployees } from '@/lib/api-hooks';
import { HelpBanner } from '@/components/ui/help-banner';

export const AddDepartmentPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const createMutation = useCreateDepartment();

    // Fetch employees for manager dropdown
    const companyId = user?.companyId ? String(user.companyId) : undefined;
    const { data: employees } = useEmployees({ companyId });

    const [formData, setFormData] = useState({
        departmentName: '',
        description: '',
        email: '',
        telephone: '',
        manager: '',
        managerId: null as number | null,
        nameAndLogo: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.companyId) {
            toast.error('No company linked. Please log in again.');
            return;
        }

        try {
            const created = await createMutation.mutateAsync({
                name: formData.departmentName,
                description: formData.description,
                email: formData.email,
                telephone: formData.telephone,
                managerName: formData.manager,
                managerId: formData.managerId,
                companyId: user.companyId,
            });

            toast.success('Department created successfully');
            navigate(accountRoutes.editDepartment.replace(':id', String(created.id)));
        } catch (error) {
            console.error('Failed to create department:', error);
            toast.error('Failed to create department. Please try again.');
        }
    };

    return (
        <PageShell>
            {/* ... omitting unchanged parts ... */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    {/* ... header ... */}
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
                        <h1 className="text-2xl font-bold text-[#0d0e0e]">Departments - Add Department</h1>
                    </div>
                    <Button
                        variant="link"
                        onClick={() => navigate('/account/departments')}
                        className="text-[#0d0e0e] underline"
                    >
                        View all departments
                    </Button>
                </div>

                {/* Help Banner */}
                <HelpBanner className="mb-6">
                    Here you can create a new department. The department must have a name, but otherwise there are no requirements for what must be included.
                </HelpBanner>

                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleSubmit}
                        className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white px-6"
                    >
                        Add Department
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="mb-4 pb-4 border-b">
                        <p className="text-sm text-gray-600">
                            The primary contact can only be changed by Degoan.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Logo Upload - unchanged */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-48 h-48 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Click to upload photo</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Only upload: jpg, jpeg, gif, png</p>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="departmentName" className="text-sm font-medium text-[#0d0e0e]">
                                    Department name
                                </Label>
                                <Input
                                    id="departmentName"
                                    value={formData.departmentName}
                                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-sm font-medium text-[#0d0e0e]">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 min-h-[100px]"
                                />
                            </div>

                            <div>
                                <Label htmlFor="email" className="text-sm font-medium text-[#0d0e0e]">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="telephone" className="text-sm font-medium text-[#0d0e0e]">
                                    Telephone
                                </Label>
                                <Input
                                    id="telephone"
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="manager" className="text-sm font-medium text-[#0d0e0e]">
                                    Manager
                                </Label>
                                <Select
                                    id="manager"
                                    value={formData.managerId?.toString() || ''}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const selectedEmployee = employees?.find(emp => String(emp.id) === selectedId);
                                        setFormData({
                                            ...formData,
                                            managerId: selectedId ? parseInt(selectedId, 10) : null,
                                            manager: selectedEmployee?.name || ''
                                        });
                                    }}
                                    className="mt-1"
                                >
                                    <option value="">Select a manager...</option>
                                    {employees?.map(employee => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="nameAndLogo" className="text-sm font-medium text-[#0d0e0e]">
                                    Name and logo
                                </Label>
                                <Input
                                    id="nameAndLogo"
                                    value={formData.nameAndLogo}
                                    onChange={(e) => setFormData({ ...formData, nameAndLogo: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </PageShell>
    );
};
