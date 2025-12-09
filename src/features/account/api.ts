import { Account } from '@/types/models';
import { axiosClient } from '@/lib/axios-client';

export const accountApi = {
  async getAccount(): Promise<Account | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/accounts/me');
    // return response.data;
    
    return null;
  },

  async updateAccount(payload: Partial<Account>): Promise<Account> {
    // TODO: Replace with real API call
    // const response = await axiosClient.put('/accounts/me', payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },
};

