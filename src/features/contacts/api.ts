import { axiosClient } from '@/lib/axios-client';
import { Contact } from '@/types/models';

/**
 * Area of responsibility for use in contact/employee UIs.
 * Backed by GET /api/responsibilities which returns { id, name } items.
 */
export interface ContactAreaItem {
  tid: number;
  name: string;
}

/** Backend contact item (my company's contacts – no companyId in request). */
export interface ContactListItem {
  nid: number;
  title: string;
  role: string | null;
  phone: string | null;
  /** Optional email, now returned by /contacts. */
  email?: string | null;
  isCurrentUser?: boolean;
}

/** Potential contact (employee not yet a contact) for "Add contact" / "Choose employee". */
export interface PotentialContactItem {
  uid: number;
  name: string;
}

interface ContactsListResponse {
  data: ContactListItem[];
  meta: { page: number; limit: number; total: number };
  error: null;
}

interface ContactsPotentialResponse {
  data: PotentialContactItem[];
  meta: { total: number };
  error: null;
}

/** GET /api/contacts/:id – success when data present and error === null; else { data: null, error: { code, message } }. */
interface ContactDetailResponse {
  data: {
    nid?: number;
    id?: string;
    title?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    telephone?: string | null;
    role?: string | null;
    functionTitle?: string | null;
    selectedTids?: number[];
  } | null;
  meta?: null;
  error: { code: string; message: string } | null;
}

function mapContactListItem(item: ContactListItem): Contact {
  const isCurrentUser = item.nid === 0 || item.isCurrentUser === true;
  return {
    id: String(item.nid),
    accountId: '',
    name: item.title,
    email: item.email ?? '',
    telephone: item.phone ?? undefined,
    functionTitle: item.role ?? undefined,
    isCurrentUser,
    status: 'ACTIVE',
  };
}

function mapContactDetail(raw: ContactDetailResponse['data']): Contact {
  if (!raw || (raw.nid == null && raw.id == null)) throw new Error('Contact not found');
  const id = raw.nid != null ? String(raw.nid) : String(raw.id);
  return {
    id,
    accountId: '',
    name: raw.title ?? raw.name ?? '',
    email: raw.email ?? '',
    telephone: raw.phone ?? raw.telephone ?? undefined,
    functionTitle: raw.role ?? raw.functionTitle ?? undefined,
    status: 'ACTIVE',
  };
}

export const contactsApi = {
  /**
   * My company's contacts. No companyId – backend uses auth token.
   * GET /api/contacts
   */
  async listContacts(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Contact[]; meta: { page: number; limit: number; total: number } }> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 100;

    const response = await axiosClient.get<ContactsListResponse>('/contacts', {
      params: { page, limit },
    });
    const raw = response.data?.data ?? [];
    const meta = response.data?.meta ?? { page: 1, limit: 50, total: 0 };
    return {
      data: (Array.isArray(raw) ? raw : []).map((item: ContactListItem) => mapContactListItem(item)),
      meta,
    };
  },

  /**
   * Employees that can be added as contacts (for "Add contact" / "Choose employee").
   * GET /api/contacts/potential
   */
  async listPotentialContacts(): Promise<{
    data: PotentialContactItem[];
    meta: { total: number };
  }> {
    const response = await axiosClient.get<ContactsPotentialResponse>('/contacts/potential');
    const data = response.data?.data ?? [];
    const meta = response.data?.meta ?? { total: 0 };
    return { data: Array.isArray(data) ? data : [], meta };
  },

  /**
   * GET /api/contacts/:id
   * Success: status 200 and error === null → returns contact and optional selectedTids.
   * Failure: 404 or error !== null → throws (caller shows "Contact not found").
   */
  async getContact(id: string): Promise<{ contact: Contact; selectedTids?: number[] }> {
    const response = await axiosClient.get<ContactDetailResponse>(`/contacts/${id}`);
    const body = response.data;
    if (body?.error != null || body?.data == null) {
      const msg = body?.error?.message ?? 'Contact not found';
      throw new Error(msg);
    }
    const contact = mapContactDetail(body.data);
    const selectedTids = Array.isArray(body.data.selectedTids) ? body.data.selectedTids : undefined;
    return { contact, selectedTids };
  },

  /**
   * Areas of responsibility for the checklist.
   * Source of truth is GET /api/responsibilities which returns items as
   * { id: number; name: string }.
   * We adapt that shape to the existing ContactAreaItem (tid/name).
   */
  async getContactAreas(): Promise<ContactAreaItem[]> {
    type Responsibility = { id: number; name: string };

    const response = await axiosClient.get<Responsibility[] | { data: Responsibility[] }>(
      '/responsibilities',
    );

    const raw: Responsibility[] = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response.data as { data?: Responsibility[] }).data)
        ? (response.data as { data: Responsibility[] }).data
        : [];

    return raw.map((item) => ({
      tid: Number(item.id),
      name: item.name,
    }));
  },

  /**
   * Create / promote contact.
   * POST /api/contacts
   * Body: name (required), uid? (internal), phone?, email?, selectedTids (required, can be []), customArea? (Other).
   * Returns 201 { data: { nid: number } }. 403 = company context required; 400 = validation.
   */
  async createContact(payload: {
    name: string;
    uid?: number;
    phone?: string;
    email?: string;
    selectedTids: number[];
    customArea?: string;
  }): Promise<{ nid: number }> {
    const response = await axiosClient.post<{ data: { nid: number } }>('/contacts', {
      name: payload.name,
      ...(payload.uid != null && { uid: payload.uid }),
      ...(payload.phone != null && payload.phone !== '' && { phone: payload.phone }),
      ...(payload.email != null && payload.email !== '' && { email: payload.email }),
      selectedTids: payload.selectedTids ?? [],
      ...(payload.customArea != null && payload.customArea.trim() !== '' && { customArea: payload.customArea.trim() }),
    });
    const data = response.data?.data;
    if (data?.nid == null) throw new Error('Invalid create contact response');
    return { nid: data.nid };
  },

  /**
   * Update contact. Tenant-aware (company must match).
   * PATCH /api/contacts/:id
   * Body: name?, phone?, email?, role?, selectedTids? (if backend supports).
   */
  async updateContact(
    id: string,
    payload: {
      name?: string;
      phone?: string;
      email?: string;
      role?: string;
      selectedTids?: number[];
    },
  ): Promise<void> {
    const body: Record<string, string | number[]> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.phone !== undefined) body.phone = payload.phone;
    if (payload.email !== undefined) body.email = payload.email;
    if (payload.role !== undefined) body.role = payload.role;
    if (payload.selectedTids !== undefined) body.selectedTids = payload.selectedTids;
    await axiosClient.patch(`/contacts/${id}`, body);
  },

  /**
   * Delete contact. Tenant-aware (company must match).
   * DELETE /api/contacts/:id
   */
  async deleteContact(id: string): Promise<void> {
    await axiosClient.delete(`/contacts/${id}`);
  },

  /**
   * Update visibility for multiple contacts.
   * PATCH /api/contacts/visibility
   * Body: { nids: number[], status: 0 | 1 } — 1 = public, 0 = private.
   * Returns { data: { updated: number } }.
   */
  async updateContactsVisibility(payload: {
    nids: number[];
    status: 0 | 1;
  }): Promise<{ updated: number }> {
    const response = await axiosClient.patch<{ data: { updated: number } }>(
      '/contacts/visibility',
      payload,
    );
    const updated = response.data?.data?.updated ?? 0;
    return { updated };
  },

  /**
   * Export contacts as CSV.
   * GET /api/contacts/export — returns CSV blob.
   */
  async exportContacts(): Promise<Blob> {
    const response = await axiosClient.get('/contacts/export', {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  /**
   * Import contacts from CSV file.
   * POST /api/contacts/import — multipart body with "file".
   * Returns { data: { imported: number, failed?: number, errors?: Array<{ row: number; message: string }> } }.
   */
  async importContacts(file: File): Promise<{ imported: number; failed?: number; errors?: Array<{ row: number; message: string }> }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post<{
      data: { imported: number; failed?: number; errors?: Array<{ row: number; message: string }> };
    }>('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = response.data?.data ?? { imported: 0 };
    return {
      imported: data.imported,
      failed: data.failed,
      errors: data.errors,
    };
  },
};
