import { HandbookSection, HandbookPage } from '@/types/models';

// simple mock account id so we can quickly swap to a real backend later
export const handbookMockAccountId = 'mock-account-1';

// mock sections roughly matching the figma tabs
export const handbookMockSections: HandbookSection[] = [
  {
    id: 'section-introduction',
    title: 'Introduction',
    slug: 'introduction',
    order: 1,
    accountId: handbookMockAccountId,
  },
  {
    id: 'section-the-company',
    title: 'The Company',
    slug: 'the-company',
    order: 2,
    accountId: handbookMockAccountId,
  },
  {
    id: 'section-meeting-with-others',
    title: 'The meeting with others',
    slug: 'the-meeting-with-others',
    order: 3,
    accountId: handbookMockAccountId,
  },
  {
    id: 'section-personal-appearance',
    title: 'Personal appearance',
    slug: 'personal-appearance',
    order: 4,
    accountId: handbookMockAccountId,
  },
  {
    id: 'section-well-being',
    title: 'Well-being',
    slug: 'well-being',
    order: 5,
    accountId: handbookMockAccountId,
  },
];

// mock pages for each section – easy to replace with api responses later
export const handbookMockPages: HandbookPage[] = [
  // introduction section – matches \"the personnel handbook\" examples
  {
    id: 'page-personnel-handbook',
    sectionId: 'section-introduction',
    title: 'The personnel handbook',
    status: 'READY',
    updatedAt: '2025-10-19T12:34:00Z',
  },
  {
    id: 'page-fine-print',
    sectionId: 'section-introduction',
    title: 'The fine print',
    status: 'READY',
    updatedAt: '2025-10-18T09:10:00Z',
  },
  {
    id: 'page-your-data',
    sectionId: 'section-introduction',
    title: 'Your data',
    status: 'NOT_READY',
    updatedAt: '2025-10-17T14:22:00Z',
  },

  // the company section – matches \"about us\" / \"our story\" etc in figma
  {
    id: 'page-about-us',
    sectionId: 'section-the-company',
    title: 'About us',
    status: 'NOT_READY',
    updatedAt: '2025-10-19T08:00:00Z',
  },
  {
    id: 'page-our-story',
    sectionId: 'section-the-company',
    title: 'Our story',
    status: 'OPTED_OUT',
    updatedAt: '2025-10-16T10:00:00Z',
  },
  {
    id: 'page-mission-vision-values',
    sectionId: 'section-the-company',
    title: 'Mission, vision and values',
    status: 'OPTED_OUT',
    updatedAt: '2025-10-15T16:45:00Z',
  },
  {
    id: 'page-new-to-company',
    sectionId: 'section-the-company',
    title: 'New to the company',
    status: 'NOT_READY',
    updatedAt: '2025-10-14T11:30:00Z',
  },

  // other sections – a couple of examples so filters and counts look real
  {
    id: 'page-meetings-etiquette',
    sectionId: 'section-meeting-with-others',
    title: 'Meeting etiquette',
    status: 'READY',
    updatedAt: '2025-10-10T09:00:00Z',
  },
  {
    id: 'page-dress-code',
    sectionId: 'section-personal-appearance',
    title: 'Dress code',
    status: 'READY',
    updatedAt: '2025-10-12T13:15:00Z',
  },
  {
    id: 'page-well-being-overview',
    sectionId: 'section-well-being',
    title: 'Well-being overview',
    status: 'NOT_READY',
    updatedAt: '2025-10-11T15:45:00Z',
  },
];


