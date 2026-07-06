import { axiosClient } from '@/lib/axios-client';
import { ApiResponse } from '@/lib/api-types';
import { CompanyProfile } from '@/types/models';

export interface LicenseUsage {
    licensesInSubscription: number;
    licensesUsed: number;
    smsMessagesUsed: number;
}

export interface UpdateCompanyProfileRequest {
    businessName: string;
    cvrNumber: string;
    street: string;
    town: string;
    zipCode: string;
    mobile: string;
    logoFid?: number;
    senderName?: string;
}

export interface UpdateCompanyProfileResponse {
    success: boolean;
    message: string;
}

export interface RetentionPolicy {
    generalPersonalDataDays: number;
    trackingDays: number;
    bookkeepingYears: number;
}

export const companiesApi = {
    /**
     * Get company profile by company ID
     * GET /api/companies/profile?companyId={id}
     */
    getProfile: async (companyId: number): Promise<ApiResponse<CompanyProfile>> => {
        const response = await axiosClient.get<ApiResponse<CompanyProfile>>(
            `/companies/profile?companyId=${companyId}`
        );
        return response.data;
    },

    /**
     * Update company profile
     * PUT /api/companies/profile?companyId={id}
     */
    updateProfile: async (
        companyId: number,
        data: UpdateCompanyProfileRequest
    ): Promise<ApiResponse<UpdateCompanyProfileResponse>> => {
        const response = await axiosClient.put<ApiResponse<UpdateCompanyProfileResponse>>(
            `/companies/profile?companyId=${companyId}`,
            data
        );
        return response.data;
    },

    /**
     * Get license and SMS usage for a company.
     * GET /api/companies/:companyId/license-usage
     */
    getLicenseUsage: async (companyId: number): Promise<LicenseUsage> => {
        const response = await axiosClient.get<ApiResponse<LicenseUsage> | LicenseUsage>(
            `/companies/${companyId}/license-usage`
        );

        if ('data' in response.data) {
            return (response.data as ApiResponse<LicenseUsage>).data;
        }

        return response.data as LicenseUsage;
    },

    /** CF-23: get the company's data-retention policy. */
    getRetentionPolicy: async (): Promise<RetentionPolicy> => {
        const response = await axiosClient.get<ApiResponse<RetentionPolicy>>('/company/retention-policy');
        return response.data.data;
    },

    /** CF-23: update the company's data-retention policy. */
    updateRetentionPolicy: async (policy: RetentionPolicy): Promise<RetentionPolicy> => {
        const response = await axiosClient.put<ApiResponse<RetentionPolicy>>('/company/retention-policy', policy);
        return response.data.data;
    },
};
