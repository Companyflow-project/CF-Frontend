import { axiosClient } from '@/lib/axios-client';
import { Account } from '@/types/models';

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
};

