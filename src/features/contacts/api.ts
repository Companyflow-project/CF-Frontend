import { Contact } from '@/types/models';
import { axiosClient } from '@/lib/axios-client';

export const contactsApi = {
  async listContacts(params?: {
    search?: string;
    sort?: string;
    page?: number;
  }): Promise<Contact[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/contacts', { params });
    // return response.data;
    
    return [];
  },

  async getContact(id: string): Promise<Contact | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/contacts/${id}`);
    // return response.data;
    
    return null;
  },

  async createContact(payload: Partial<Contact>): Promise<Contact> {
    // TODO: Replace with real API call
    // const response = await axiosClient.post('/contacts', payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async updateContact(
    id: string,
    payload: Partial<Contact>
  ): Promise<Contact> {
    // TODO: Replace with real API call
    // const response = await axiosClient.put(`/contacts/${id}`, payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async deleteContact(id: string): Promise<void> {
    // TODO: Replace with real API call
    // await axiosClient.delete(`/contacts/${id}`);
    
    throw new Error('Not implemented yet');
  },
};

