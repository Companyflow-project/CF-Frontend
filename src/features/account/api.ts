import { axiosClient } from '@/lib/axios-client';
import { Account } from '@/types/models';

export interface SubscriptionData {
  productName: string;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  subscriptionRemainingMonths: number | null;
  licensesTotal: number;
  licensesUsed: number;
  smsCreditsTotal: number;
  smsUsed: number;
  smsUsedByUsers: number;
  whistleblowerAccess: boolean;
  employmentTypesTotal: number;
  departmentsTotal: number;
  additionalManualsTotal: number;
  sopTotal: number;
}


export interface CompanyAppearance {
  pictureType: string; // 'none' | 'small' | 'photographs'
  colors: Record<string, string>;
}

// Backend Company model
interface BackendCompany {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  companyCity?: string | null;
  companyCvr?: string | null;
}

export const accountApi = {
  async getAccount(companyId?: string): Promise<Account | null> {
    try {
      // If companyId is provided, fetch that company; otherwise would need /accounts/me endpoint
      // Since /accounts/me is not in the spec, we'll need companyId from context
      if (!companyId) {
        return null;
      }
      const response = await axiosClient.get<unknown>(`/companies/${companyId}`);
      const company = response.data as BackendCompany;
      return {
        id: company.id,
        name: company.name,
        status: 'ACTIVE', // Not available in backend response
        createdAt: company.createdAt,
      };
    } catch (error) {
      return null;
    }
  },

  async updateAccount(_payload: Partial<Account>): Promise<Account> {
    // Backend is read-only, this would need to be implemented if write operations are added
    throw new Error('Update account not supported by read-only API');
  },

  async getCompanyAppearance(): Promise<CompanyAppearance> {
    const response = await axiosClient.get<{ data: CompanyAppearance; error: null }>('/company/appearance');
    return response.data.data || { pictureType: 'none', colors: {} };
  },

  async updateCompanyAppearance(payload: CompanyAppearance): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.put<{ data: { success: boolean; message: string }; error: null }>('/company/appearance', payload);
    return response.data.data;
  },

  async getSubscription(companyId: string): Promise<SubscriptionData> {
    const response = await axiosClient.get<{ data: SubscriptionData; error: null }>(
      `/companies/${companyId}/subscription`
    );
    return response.data.data;
  },
};

