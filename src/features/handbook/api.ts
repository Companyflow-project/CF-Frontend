import {
  HandbookSection,
  HandbookPage,
} from '@/types/models';
import { axiosClient } from '@/lib/axios-client';

export const handbookApi = {
  async listSections(): Promise<HandbookSection[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/handbook/sections');
    // return response.data;
    
    return [];
  },

  async getSection(id: string): Promise<HandbookSection | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/handbook/sections/${id}`);
    // return response.data;
    
    return null;
  },

  async createSection(payload: Partial<HandbookSection>): Promise<HandbookSection> {
    // TODO: Replace with real API call
    // const response = await axiosClient.post('/handbook/sections', payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async updateSection(
    id: string,
    payload: Partial<HandbookSection>
  ): Promise<HandbookSection> {
    // TODO: Replace with real API call
    // const response = await axiosClient.put(`/handbook/sections/${id}`, payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async listPages(sectionId?: string): Promise<HandbookPage[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/handbook/pages', { params: { sectionId } });
    // return response.data;
    
    return [];
  },

  async getPage(id: string): Promise<HandbookPage | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/handbook/pages/${id}`);
    // return response.data;
    
    return null;
  },

  async createPage(payload: Partial<HandbookPage>): Promise<HandbookPage> {
    // TODO: Replace with real API call
    // const response = await axiosClient.post('/handbook/pages', payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async updatePage(
    id: string,
    payload: Partial<HandbookPage>
  ): Promise<HandbookPage> {
    // TODO: Replace with real API call
    // const response = await axiosClient.put(`/handbook/pages/${id}`, payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async publishHandbook(): Promise<void> {
    // TODO: Replace with real API call
    // await axiosClient.post('/handbook/publish');
    
    throw new Error('Not implemented yet');
  },
};

