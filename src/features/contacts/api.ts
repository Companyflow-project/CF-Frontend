import { Contact } from '@/types/models';
import { contactsMock } from './mock-data';

export const contactsApi = {
  async listContacts(_params?: {
    search?: string;
    sort?: string;
    page?: number;
  }): Promise<Contact[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/contacts', { params });
    // return response.data;

    // basic mock data with simple client-side filtering to mimic backend behaviour
    const params = _params ?? {};
    let data = [...contactsMock];

    if (params.search) {
      const query = params.search.toLowerCase();
      data = data.filter((contact) => {
        const name = contact.name.toLowerCase();
        const email = contact.email.toLowerCase();
        const telephone = (contact.telephone ?? '').toLowerCase();
        return (
          name.includes(query) ||
          email.includes(query) ||
          telephone.includes(query)
        );
      });
    }

    if (params.sort === 'name') {
      data.sort((a, b) => a.name.localeCompare(b.name));
    }

    return data;
  },

  async getContact(_id: string): Promise<Contact | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/contacts/${id}`);
    // return response.data;

    const contact = contactsMock.find((c) => c.id === _id);
    return contact ?? null;
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
