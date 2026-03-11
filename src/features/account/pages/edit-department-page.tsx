import React, { useState, useEffect, useRef } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { useDepartment, useUpdateDepartment, useDeleteDepartment } from '@/features/departments/hooks';
import type { Department } from '@/features/departments/api';
import { useAuth } from '@/context/auth-context';
import { useEmployees } from '@/lib/api-hooks';
import { HelpBanner } from '@/components/ui/help-banner';
import { axiosClient } from '@/lib/axios-client';

export const EditDepartmentPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation() as { state?: { department?: Department } };

    const departmentFromState = location.state?.department;

    // Only fetch from API if we don't already have the department from navigation state
    const shouldFetch = !departmentFromState && id && id !== 'undefined';
    const { data: departmentFromApi, isLoading } = useDepartment(shouldFetch ? id : undefined);
    const department = (departmentFromState || departmentFromApi) ?? null;
    const updateMutation = useUpdateDepartment();
    const deleteMutation = useDeleteDepartment();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoFid, setLogoFid] = useState<number | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png'];
        if (!allowed.includes(file.type)) {
            toast.error('Only jpg, jpeg, gif, png files are allowed');
            return;
        }
        setUploadingLogo(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await axiosClient.post<{ success: boolean; fid: number; uri: string }>('/files', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setLogoFid(res.data.fid);
            const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
            setLogoPreview(`${baseUrl}${res.data.uri}`);
            toast.success('Photo uploaded');
        } catch {
            toast.error('Failed to upload photo');
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    // Fetch employees for manager dropdown
    const { user } = useAuth();
    const companyId = user?.companyId ? String(user.companyId) : undefined;
    const { data: employees } = useEmployees({ companyId });

    const emptyForm = {
        departmentName: '',
        description: '',
        email: '',
        telephone: '',
        manager: '',
        managerId: null as number | null,
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        if (department) {
            setFormData({
                departmentName: department.name ?? '',
                description: department.description ?? '',
                email: department.email ?? '',
                telephone: department.telephone ?? '',
                manager: department.managerName ?? '',
                managerId: department.managerId ?? null,
            });
            if (department.logoUrl && !logoPreview) {
                const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
                const url = department.logoUrl.startsWith('http') ? department.logoUrl : `${baseUrl}${department.logoUrl}`;
                setLogoPreview(url);
            }
        }
    }, [department]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!id) {
            toast.error('Department ID is missing');
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id,
                payload: {
                    name: formData.departmentName,
                    description: formData.description,
                    email: formData.email,
                    telephone: formData.telephone,
                    managerName: formData.manager,
                    managerId: formData.managerId,
                    ...(logoFid ? { logoFid } : {}),
                },
            });

            toast.success('Department updated successfully');
            navigate('/account/departments');
        } catch (error) {
            console.error('Failed to update department:', error);
            toast.error('Failed to update department. Please try again.');
        }
    };

    if (!id && !department) {
        return (
            <PageShell>
                <div className="p-8 text-center">
                    <p className="text-red-500 mb-4">Invalid department.</p>
                    <Button variant="outline" onClick={() => navigate('/account/departments')}>
                        Back to departments
                    </Button>
                </div>
            </PageShell>
        );
    }

    if (isLoading && !department) {
        return <PageShell><div className="p-8 text-center bg-[#fff9f0]">Loading department...</div></PageShell>;
    }

    if (!department) {
        return <PageShell><div className="p-8 text-center text-red-500">Department not found</div></PageShell>;
    }

    const handleDelete = async () => {
        if (!id) return;

        if (window.confirm('Are you sure you want to remove this department?')) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('Department deleted successfully');
                navigate('/account/departments');
            } catch (error) {
                console.error('Failed to delete department:', error);
                toast.error('Failed to delete department. Please try again.');
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
                <HelpBanner className="mb-6">
                    Here you can edit an existing department. Update the department name, description, contact information, and assign a manager as needed.
                </HelpBanner>

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
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.gif,.png"
                                className="hidden"
                                onChange={handleLogoUpload}
                            />
                            <div
                                className="w-48 h-48 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors group relative overflow-hidden"
                                onClick={() => logoInputRef.current?.click()}
                            >
                                {uploadingLogo ? (
                                    <span className="text-sm text-gray-500">Uploading...</span>
                                ) : logoPreview ? (
                                    <>
                                        <img src={logoPreview} alt="Department logo" className="w-full h-full object-cover rounded-full" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                            <Upload className="h-6 w-6 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">Click to upload photo</span>
                                    </>
                                )}
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
                                    type="tel"
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
                        </div>
                    </div>
                </div>
            </form>
        </PageShell>
    );
};
