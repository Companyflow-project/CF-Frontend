import { axiosClient } from '@/lib/axios-client';
import { ApiResponse } from '@/lib/api-types';
import { CompanyProfile } from '@/types/models';

export interface UpdateCompanyProfileRequest {
    businessName: string;
    cvrNumber: string;
    street: string;
    town: string;
    zipCode: string;
    mobile: string;
}

export interface UpdateCompanyProfileResponse {
    success: boolean;
    message: string;
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
};
