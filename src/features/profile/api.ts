import { axiosClient } from '@/lib/axios-client';
import { transformEmployee, BackendEmployeeLike } from '@/lib/api-transformers';
import { Employee } from '@/types/models';
import type { ApiResponse } from '@/lib/api-types';

export interface SelfProfilePayload {
  mobileNumber?: string;
  alternateNumber?: string;
  emergencyContactName?: string;
  emergencyContactMobile?: string;
  isEmergencyPublic?: boolean;
}

export interface ActivityItem {
  type: 'viewed' | 'signed';
  nid: number;
  title: string | null;
  at: string;
}

/** CF-24 / CF-25: the authenticated user's own profile + activity ("me" endpoints). */
export const profileApi = {
  async getMyProfile(): Promise<Employee | null> {
    try {
      const response = await axiosClient.get<ApiResponse<BackendEmployeeLike> | BackendEmployeeLike>('/employees/me');
      const data =
        response.data && typeof response.data === 'object' && 'data' in response.data
          ? (response.data as ApiResponse<BackendEmployeeLike>).data
          : (response.data as BackendEmployeeLike);
      return data ? transformEmployee(data) : null;
    } catch {
      return null;
    }
  },

  async updateMyProfile(payload: SelfProfilePayload): Promise<void> {
    await axiosClient.patch('/employees/me', payload);
  },

  async getMyActivity(): Promise<ActivityItem[]> {
    const response = await axiosClient.get<ApiResponse<ActivityItem[]> | ActivityItem[]>('/employees/me/activity');
    if (Array.isArray(response.data)) return response.data;
    return (response.data as ApiResponse<ActivityItem[]>).data ?? [];
  },
};
