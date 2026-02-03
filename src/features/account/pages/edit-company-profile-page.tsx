import React, { useState, useEffect } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useCompanyProfile, useUpdateCompanyProfile } from '@/features/companies/hooks';
import { toast } from 'sonner';

export const EditCompanyProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const companyId = user?.companyId ? Number(user.companyId) : undefined;

    const { data: profile, isLoading, error } = useCompanyProfile(companyId);
    const updateMutation = useUpdateCompanyProfile();

    const [formData, setFormData] = useState({
        businessName: '',
        cvrNumber: '',
        street: '',
        town: '',
        zipCode: '',
        mobile: '',
        logoUrl: null as string | null,
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
        // Otherwise, prepend the API base URL
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        return `${baseUrl}${formData.logoUrl}`;
    };

    // Show error if user has no company linked
    if (!companyId && !isLoading) {
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
                <div className="mb-8 bg-[#fff9f0] rounded-[12px] border border-[#fef3c7] shadow-sm p-5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#f59e0b]" />
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-[15px] leading-[24px] text-[#0d0e0e] max-w-[800px]">
                            <span className="font-bold">Help.</span> Here you can enter and edit your company's master data. This is the data that is used in the handbook. This is the same data we use when we need to contact your company. This data is also used on the invoices we send.
                        </p>
                        <Button
                            variant="outline"
                            className="bg-white border-[#e5e7eb] text-[#0d0e0e] hover:bg-gray-50 h-[36px] px-4 text-sm font-medium rounded-[8px] shadow-sm whitespace-nowrap"
                        >
                            User manual
                        </Button>
                    </div>
                </div>

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
                                    <div className="w-[240px] h-[240px] rounded-full bg-[#f3f4f6] border border-[#e5e7eb] flex flex-col items-center justify-center cursor-pointer hover:border-[#d1d5db] transition-colors mb-3 group relative overflow-hidden">
                                        {getLogoUrl() ? (
                                            <img
                                                src={getLogoUrl()!}
                                                alt="Company logo"
                                                className="w-full h-full object-cover rounded-full"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 relative z-10">
                                                <Upload className="h-6 w-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                <span className="text-[15px] text-gray-500 font-medium">Click to upload company logo</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[13px] text-gray-400 italic">Only upload: jpg, jpeg, gif, png</p>
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
                            <div className="max-w-[700px] lg:ml-[348px]"> {/* Align with input column above */}
                                {/* Placeholders for now since API doesn't have these fields yet */}
                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
                                    <Label className="text-[15px] font-bold text-[#0d0e0e]">Sender name</Label>
                                    <Input
                                        value="MySigrid"
                                        className="h-[42px] bg-white border-[#e5e7eb] rounded-[6px] text-[#0d0e0e]"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </PageShell>
    );
};
