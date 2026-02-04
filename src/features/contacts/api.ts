import { axiosClient } from '@/lib/axios-client';
import { transformContact } from '@/lib/api-transformers';
import { Contact } from '@/types/models';

export const contactsApi = {
  async listContacts(params?: {
    companyId?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<Contact[]> {
    const queryParams: Record<string, string> = {};
    if (params?.companyId) queryParams.companyId = params.companyId;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    const response = await axiosClient.get<unknown>('/contacts', { params: queryParams });
    const contacts = Array.isArray(response.data) ? response.data : [];
    return contacts.map((contact: unknown) => transformContact(contact as Parameters<typeof transformContact>[0]));
  },

  async getContact(id: string): Promise<Contact | null> {
    try {
      const response = await axiosClient.get<unknown>(`/contacts/${id}`);
      return transformContact(response.data as Parameters<typeof transformContact>[0]);
    } catch (error) {
      return null;
    }
  },

  async createContact(_payload: Partial<Contact>): Promise<Contact> {
    // Backend is read-only, this would need to be implemented if write operations are added
    throw new Error('Create contact not supported by read-only API');
  },

  async updateContact(
    _id: string,
    _payload: Partial<Contact>
  ): Promise<Contact> {
    // Backend is read-only, this would need to be implemented if write operations are added
    throw new Error('Update contact not supported by read-only API');
  },

  async deleteContact(_id: string): Promise<void> {
    // Backend is read-only, this would need to be implemented if write operations are added
    throw new Error('Delete contact not supported by read-only API');
  },
};
