import { HandbookSection, HandbookPage } from '@/types/models';
import { handbookMockSections, handbookMockPages } from './mock-data';

export const handbookApi = {
  async listSections(): Promise<HandbookSection[]> {
    // TODO: replace with real api call
    // const response = await axiosClient.get('/handbook/sections');
    // return response.data;

    // mock data for now so the manage-handbook page matches the figma design
    return handbookMockSections;
  },

  async getSection(_id: string): Promise<HandbookSection | null> {
    // TODO: replace with real api call
    // const response = await axiosClient.get(`/handbook/sections/${id}`);
    // return response.data;

    const section = handbookMockSections.find((s) => s.id === _id);
    return section ?? null;
  },

  async createSection(_payload: Partial<HandbookSection>): Promise<HandbookSection> {
    // TODO: replace with real api call
    // const response = await axiosClient.post('/handbook/sections', payload);
    // return response.data;

    throw new Error('Not implemented yet');
  },

  async updateSection(
    _id: string,
    _payload: Partial<HandbookSection>
  ): Promise<HandbookSection> {
    // TODO: replace with real api call
    // const response = await axiosClient.put(`/handbook/sections/${id}`, payload);
    // return response.data;

    throw new Error('Not implemented yet');
  },

  async listPages(_sectionId?: string): Promise<HandbookPage[]> {
    // TODO: replace with real api call
    // const response = await axiosClient.get('/handbook/pages', { params: { sectionId } });
    // return response.data;

    // mock data for now – filter by section when provided
    if (_sectionId) {
      return handbookMockPages.filter((page) => page.sectionId === _sectionId);
    }
    return handbookMockPages;
  },

  async getPage(_id: string): Promise<HandbookPage | null> {
    // TODO: replace with real api call
    // const response = await axiosClient.get(`/handbook/pages/${id}`);
    // return response.data;

    const page = handbookMockPages.find((p) => p.id === _id);
    return page ?? null;
  },

  async createPage(_payload: Partial<HandbookPage>): Promise<HandbookPage> {
    // TODO: replace with real api call
    // const response = await axiosClient.post('/handbook/pages', payload);
    // return response.data;

    throw new Error('Not implemented yet');
  },

  async updatePage(
    _id: string,
    _payload: Partial<HandbookPage>
  ): Promise<HandbookPage> {
    // TODO: replace with real api call
    // const response = await axiosClient.put(`/handbook/pages/${id}`, payload);
    // return response.data;

    throw new Error('Not implemented yet');
  },

  async publishHandbook(): Promise<void> {
    // TODO: replace with real api call
    // await axiosClient.post('/handbook/publish');

    throw new Error('Not implemented yet');
  },
};

