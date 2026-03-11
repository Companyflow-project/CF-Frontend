import React, { useState, useEffect, useRef } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useCompanyProfile, useUpdateCompanyProfile } from '@/features/companies/hooks';
import { toast } from 'sonner';
import { HelpBanner } from '@/components/ui/help-banner';
import { axiosClient } from '@/lib/axios-client';
export const EditCompanyProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const companyId = user?.companyId ? Number(user.companyId) : undefined;

    const { data: profile, isLoading, error } = useCompanyProfile(
        !authLoading ? companyId : undefined
    );
    const updateMutation = useUpdateCompanyProfile();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoFid, setLogoFid] = useState<number | null>(null);
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
            setFormData((prev) => ({ ...prev, logoUrl: res.data.uri }));
            toast.success('Logo uploaded');
        } catch {
            toast.error('Failed to upload logo');
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const [formData, setFormData] = useState({
        businessName: '',
        cvrNumber: '',
        street: '',
        town: '',
        zipCode: '',
        mobile: '',
        logoUrl: null as string | null,
        senderName: '',
    });

    // Populate form when profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                businessName: profile.businessName || '',
                cvrNumber: profile.cvrNumber || '',
                street: profile.street || '',
                town: profile.town || '',
                zipCode: profile.zipCode || '',
                mobile: profile.mobile || '',
                logoUrl: profile.logoUrl,
                senderName: profile.senderName ? profile.senderName : (profile.businessName || ''),
            });
        }
    }, [profile]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyId) {
            toast.error('Company ID not found');
            return;
        }

        // Validate required fields
        if (!formData.businessName.trim()) {
            toast.error('Business name is required');
            return;
        }
        if (!formData.cvrNumber.trim()) {
            toast.error('CVR number is required');
            return;
        }
        if (!formData.street.trim()) {
            toast.error('Street/road number is required');
            return;
        }
        if (!formData.town.trim()) {
            toast.error('Town is required');
            return;
        }
        if (!formData.zipCode.trim()) {
            toast.error('Zip code is required');
            return;
        }
        if (!formData.mobile.trim()) {
            toast.error('Mobile is required');
            return;
        }

        try {
            await updateMutation.mutateAsync({
                companyId,
                data: {
                    businessName: formData.businessName.trim(),
                    cvrNumber: formData.cvrNumber.trim(),
                    street: formData.street.trim(),
                    town: formData.town.trim(),
                    zipCode: formData.zipCode.trim(),
                    mobile: formData.mobile.trim(),
                    senderName: formData.senderName.trim(),
                    ...(logoFid !== null ? { logoFid } : {}),
                },
            });
            toast.success('Company profile updated successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update company profile';
            toast.error(errorMessage);
        }
    };

    const renderField = (label: string, id: keyof typeof formData, value: string, disabled = false, note?: string) => (
        <div key={id} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
            <Label htmlFor={id} className="text-[15px] font-bold text-[#0d0e0e]">
                {label}
            </Label>
            <div className="w-full">
                <Input
                    id={id}
                    value={value}
                    onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
                    className={`h-[42px] bg-white border-[#e5e7eb] rounded-[6px] text-[#0d0e0e] ${disabled ? 'bg-[#f3f4f6] text-gray-500' : ''}`}
                    disabled={disabled || isLoading}
                />
                {note && <p className="text-xs text-gray-500 mt-1.5 italic">{note}</p>}
            </div>
        </div>
    );

    // Construct full logo URL if needed
    const getLogoUrl = () => {
        if (!formData.logoUrl) return null;
        // If it's already a full URL, return as-is
        if (formData.logoUrl.startsWith('http')) return formData.logoUrl;
        // Static files are served at the server root, not under /api
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
        return `${baseUrl}${formData.logoUrl}`;
    };

    // Still waiting for auth session to resolve — show nothing yet
    if (authLoading) {
        return (
            <PageShell>
                <div className="max-w-[1200px] mx-auto pb-20">
                    <div className="text-center py-20 text-gray-500">Loading…</div>
                </div>
            </PageShell>
        );
    }

    // Auth resolved but user has no company linked
    if (!companyId) {
        return (
            <PageShell>
                <div className="max-w-[1200px] mx-auto pb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/account')}
                            className="h-[38px] px-4 bg-white hover:bg-gray-50 border-[#e5e7eb] text-[#0d0e0e] text-sm font-medium rounded-[8px] gap-2 shadow-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-[28px] font-bold text-[#0d0e0e]">Company Profile</h1>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <p className="text-yellow-800 font-medium text-lg mb-2">No Company Linked</p>
                        <p className="text-yellow-600 mb-4">Your user account (ID: {user?.id}) is not linked to any company.</p>
                        <p className="text-sm text-yellow-600">Please contact support or run the database setup script to link your user to a company.</p>
                    </div>
                </div>
            </PageShell>
        );
    }

    if (error) {
        return (
            <PageShell>
                <div className="max-w-[1200px] mx-auto pb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/account')}
                            className="h-[38px] px-4 bg-white hover:bg-gray-50 border-[#e5e7eb] text-[#0d0e0e] text-sm font-medium rounded-[8px] gap-2 shadow-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-[28px] font-bold text-[#0d0e0e]">Company Profile</h1>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-600">Failed to load company profile. Please try again later.</p>
                        <p className="text-sm text-red-400 mt-1">{error.message}</p>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="max-w-[1200px] mx-auto pb-20">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/account')}
                        className="h-[38px] px-4 bg-white hover:bg-gray-50 border-[#e5e7eb] text-[#0d0e0e] text-sm font-medium rounded-[8px] gap-2 shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-[28px] font-bold text-[#0d0e0e]">Company Profile</h1>
                </div>

                {/* Help Banner */}
                <HelpBanner className="mb-8">
                    Here you can enter and edit your company's master data. This is the data that is used in the handbook. This is the same data we use when we need to contact your company. This data is also used on the invoices we send.
                </HelpBanner>

                {/* Save Button */}
                <div className="flex justify-end mb-8">
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || updateMutation.isPending}
                        className="bg-[#2f946f] hover:bg-[#257a5b] text-white h-[44px] px-8 rounded-[8px] text-[15px] font-medium shadow-sm transition-colors disabled:opacity-50"
                    >
                        {updateMutation.isPending ? 'Saving...' : 'Save information'}
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Company Information Section */}
                    <section>
                        <h2 className="text-[20px] font-bold text-[#0d0e0e] mb-4">Company information</h2>
                        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-8 shadow-sm">
                            <p className="text-[15px] text-[#0d0e0e] mb-8">
                                The primary contact can only be changed by Degoan.
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">
                                {/* Logo Upload */}
                                <div className="flex flex-col items-center">
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.gif,.png"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                    />
                                    <div
                                        className="w-[240px] h-[240px] rounded-full bg-[#f3f4f6] border border-[#e5e7eb] flex flex-col items-center justify-center cursor-pointer hover:border-[#d1d5db] transition-colors mb-3 group relative overflow-hidden"
                                        onClick={() => logoInputRef.current?.click()}
                                    >
                                        {uploadingLogo ? (
                                            <span className="text-[15px] text-gray-500 font-medium">Uploading...</span>
                                        ) : getLogoUrl() ? (
                                            <>
                                                <img
                                                    src={getLogoUrl()!}
                                                    alt="Company logo"
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                                    <Upload className="h-6 w-6 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 relative z-10">
                                                <Upload className="h-6 w-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                <span className="text-[15px] text-gray-500 font-medium">Click to upload company logo</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[13px] text-gray-400 italic">Only upload: jpg, jpeg, gif, png</p>
                                    {getLogoUrl() && (
                                        <button
                                            type="button"
                                            className="mt-2 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
                                            onClick={() => {
                                                setFormData((prev) => ({ ...prev, logoUrl: null }));
                                                setLogoFid(-1);
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Remove logo
                                        </button>
                                    )}
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-6 max-w-[700px]">
                                    {isLoading ? (
                                        <div className="text-center py-8 text-gray-500">Loading company profile...</div>
                                    ) : (
                                        <>
                                            {renderField('Business', 'businessName', formData.businessName)}
                                            {renderField('CVR Number', 'cvrNumber', formData.cvrNumber)}
                                            {renderField('Street/road number', 'street', formData.street)}
                                            {renderField('Town', 'town', formData.town)}
                                            {renderField('Zip Code', 'zipCode', formData.zipCode)}
                                            {renderField('Mobile', 'mobile', formData.mobile)}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SMS Information Section */}
                    <section>
                        <h2 className="text-[20px] font-bold text-[#0d0e0e] mb-4">SMS information</h2>
                        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-8 shadow-sm">
                            <div className="max-w-[700px] lg:ml-[348px]">
                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
                                    <Label htmlFor="senderName" className="text-[15px] font-bold text-[#0d0e0e]">Sender name</Label>
                                    <div className="w-full">
                                        <Input
                                            id="senderName"
                                            value={formData.senderName}
                                            onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                                            maxLength={11}
                                            className="h-[42px] bg-white border-[#e5e7eb] rounded-[6px] text-[#0d0e0e]"
                                            disabled={isLoading}
                                        />
                                        <p className="text-xs text-gray-500 mt-1.5 italic">Default is your business name. Max 11 characters.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </PageShell>
    );
};
