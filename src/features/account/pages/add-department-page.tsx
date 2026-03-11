import React, { useState, useRef } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { useCreateDepartment } from '@/features/departments/hooks';
import { useAuth } from '@/context/auth-context';
import { useEmployees } from '@/lib/api-hooks';
import { HelpBanner } from '@/components/ui/help-banner';
import { axiosClient } from '@/lib/axios-client';

export const AddDepartmentPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const createMutation = useCreateDepartment();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFid, setLogoFid] = useState<number | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const { t } = useTranslation('account');
    const { t: tCommon } = useTranslation('common');

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png'];
        if (!allowed.includes(file.type)) {
            toast.error(t('addDepartment.logo.invalidFormat'));
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
            toast.success(t('addDepartment.logo.uploaded'));
        } catch {
            toast.error(t('addDepartment.logo.uploadFailed'));
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

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
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.companyId) {
            toast.error(t('addDepartment.error.noCompany'));
            return;
        }

        try {
            await createMutation.mutateAsync({
                name: formData.departmentName,
                description: formData.description,
                email: formData.email,
                telephone: formData.telephone,
                managerName: formData.manager,
                managerId: formData.managerId,
                companyId: user.companyId,
                ...(logoFid ? { logoFid } : {}),
            });

            toast.success(t('addDepartment.success'));
            navigate('/account/departments');
        } catch (error) {
            console.error('Failed to create department:', error);
            toast.error(t('addDepartment.error.create'));
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
                            {tCommon('back')}
                        </Button>
                        <h1 className="text-2xl font-bold text-[#0d0e0e]">{t('addDepartment.title')}</h1>
                    </div>
                    <Button
                        variant="link"
                        onClick={() => navigate('/account/departments')}
                        className="text-[#0d0e0e] underline"
                    >
                        {t('addDepartment.viewAll')}
                    </Button>
                </div>

                {/* Help Banner */}
                <HelpBanner className="mb-6">
                    {t('addDepartment.helpBanner')}
                </HelpBanner>

                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleSubmit}
                        className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white px-6"
                    >
                        {t('addDepartment.submit')}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="mb-4 pb-4 border-b">
                        <p className="text-sm text-gray-600">
                            {t('companyProfile.primaryContactNote')}
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
                                    <span className="text-sm text-gray-500">{t('addDepartment.logo.uploading')}</span>
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
                                        <span className="text-sm text-gray-600">{t('addDepartment.logo.upload')}</span>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{t('addDepartment.logo.formats')}</p>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="departmentName" className="text-sm font-medium text-[#0d0e0e]">
                                    {t('addDepartment.field.name')}
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
                                    {t('addDepartment.field.description')}
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
                                    {t('addDepartment.field.email')}
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
                                    {t('addDepartment.field.telephone')}
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
                                    {t('addDepartment.field.manager')}
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
                                    <option value="">{t('addDepartment.field.selectManager')}</option>
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
