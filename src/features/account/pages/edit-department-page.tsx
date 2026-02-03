import React, { useState, useEffect } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { useDepartment } from '@/features/departments/hooks';

export const EditDepartmentPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const { data: department, isLoading } = useDepartment(id);

    const [formData, setFormData] = useState({
        departmentName: '',
        description: '',
        email: '',
        telephone: '',
        manager: '',
        nameAndLogo: '',
    });

    useEffect(() => {
        if (department) {
            setFormData({
                departmentName: department.name || '',
                description: department.description || '',
                email: department.email || '',
                telephone: department.telephone || '',
                manager: department.managerName || '',
                nameAndLogo: '', // Placeholder
            });
        }
    }, [department]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission - Backend is currently read-only for departments
        console.log('Update not supported yet:', formData);
    };

    if (isLoading) {
        return <PageShell><div className="p-8 text-center bg-[#fff9f0]">Loading department...</div></PageShell>;
    }

    if (!department) {
        return <PageShell><div className="p-8 text-center text-red-500">Department not found</div></PageShell>;
    }

    const handleDelete = () => {
        // Handle department deletion
        if (window.confirm('Are you sure you want to remove this department?')) {
            console.log('Delete not supported yet:', id);
            // navigate('/account/departments'); 
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
                            onClick={() => navigate('/account/departments')}
                            className="h-9 px-3"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-[#0d0e0e]">Departments - Update Departments</h1>
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
                <div className="mb-6 bg-[#fff9f0] rounded-lg border-l-4 border-[#f59e0b] p-4 flex items-start justify-between">
                    <p className="text-sm text-[#0d0e0e]">
                        <span className="font-bold">Help.</span> Here you can create or edit a single department. The department must have a name, but otherwise there are no requirements for what must be included.
                    </p>
                    <Button
                        variant="link"
                        className="text-[#0d0e0e] underline whitespace-nowrap"
                    >
                        User manual
                    </Button>
                </div>

                <div className="flex justify-end gap-3 mb-4">
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        className="border-red-500 text-red-500 hover:bg-red-50 px-6"
                    >
                        Remove department
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white px-6"
                    >
                        Update department
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
                        {/* Logo Upload */}
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
                                    value={formData.manager}
                                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                    className="mt-1"
                                >
                                    <option value="">None</option>
                                    <option value="manager1">Manager 1</option>
                                    <option value="manager2">Manager 2</option>
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

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
                © 2025 CompanyFlow. All rights reserved.
            </div>
        </PageShell>
    );
};
