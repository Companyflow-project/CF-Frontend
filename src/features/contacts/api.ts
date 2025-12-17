import { Contact } from '@/types/models';

export const contactsApi = {
  async listContacts(_params?: {
    search?: string;
    sort?: string;
    page?: number;
  }): Promise<Contact[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/contacts', { params });
    // return response.data;
    
    return [];
  },

  async getContact(_id: string): Promise<Contact | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/contacts/${id}`);
    // return response.data;
    
    return null;
  },

  async createContact(_payload: Partial<Contact>): Promise<Contact> {
    // TODO: Replace with real API call
    // const response = await axiosClient.post('/contacts', payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async updateContact(
    _id: string,
    _payload: Partial<Contact>
  ): Promise<Contact> {
    // TODO: Replace with real API call
    // const response = await axiosClient.put(`/contacts/${id}`, payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async deleteContact(_id: string): Promise<void> {
    // TODO: Replace with real API call
    // await axiosClient.delete(`/contacts/${id}`);
    
    throw new Error('Not implemented yet');
  },
};

