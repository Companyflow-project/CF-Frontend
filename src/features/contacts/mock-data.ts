import { Contact } from '@/types/models';

// Mock contacts to mirror the Manage Contacts design so the page feels alive.
// Swap these with real data once the API is connected.
export const contactsMock: Contact[] = [
  {
    id: 'contact-aimee-lee',
    accountId: 'mock-account-1',
    name: 'Aimee Lee',
    email: 'alee@sample.com',
    telephone: '+45 42 68 13 57',
    functionTitle: 'Administration',
    isPublic: true,
    isEmployeeContact: true,
    isExternalContact: false,
    status: 'ACTIVE',
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'contact-bob-hendersen',
    accountId: 'mock-account-1',
    name: 'Bob Hendersen',
    email: 'bhendersen@sample.com',
    telephone: '+45 72 94 05 36',
    functionTitle: 'Support on the handbook · Work environment',
    isPublic: true,
    isEmployeeContact: true,
    isExternalContact: false,
    status: 'ACTIVE',
    createdAt: '2025-01-02T11:15:00Z',
  },
  {
    id: 'contact-jake-norton',
    accountId: 'mock-account-1',
    name: 'Jake Norton',
    email: 'jnorton@sample.com',
    functionTitle: 'IT',
    isPublic: false,
    isEmployeeContact: true,
    isExternalContact: false,
    status: 'INACTIVE',
    createdAt: '2025-01-03T09:30:00Z',
  },
  {
    id: 'contact-james-jones',
    accountId: 'mock-account-1',
    name: 'James Jones',
    email: 'jjones@sample.com',
    // telephone intentionally left out
    functionTitle: 'None assigned',
    isPublic: false,
    isEmployeeContact: false,
    isExternalContact: true,
    status: 'ACTIVE',
    createdAt: '2025-01-04T14:45:00Z',
  },
];
