import { Employee } from '@/types/models';

// simple mock employees so the manage employees page matches the figma designs.
// these are easy to swap out once the real backend is wired up.
export const employeesMock: Employee[] = [
  {
    id: 'employee-aimee-lee',
    accountId: 'mock-account-1',
    name: 'Aimee Lee',
    email: 'alee@sample.com',
    telephone: '+45 42 68 13 57',
    employmentType: 'Full-time',
    employmentTitle: 'Primary Contact Person',
    recentVisitAt: '3 mins ago',
    messagesCount: 0,
    isPublic: true,
    status: 'ACTIVE',
    createdAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'employee-bob-hendersen',
    accountId: 'mock-account-1',
    name: 'Bob Hendersen',
    email: 'bhendersen@sample.com',
    telephone: '+45 72 94 05 36',
    employmentType: 'Full-time',
    employmentTitle: 'Chief-of-Staff',
    recentVisitAt: 'Never',
    messagesCount: 0,
    isPublic: true,
    status: 'ACTIVE',
    createdAt: '2025-01-02T09:30:00Z',
  },
  {
    id: 'employee-jake-norton',
    accountId: 'mock-account-1',
    name: 'Jake Norton',
    email: 'jnorton@sample.com',
    // telephone intentionally omitted to show the "Not available" style
    employmentType: 'Full-time',
    employmentTitle: 'Senior Developer',
    recentVisitAt: '10 sec ago',
    messagesCount: 0,
    isPublic: false,
    status: 'ACTIVE',
    createdAt: '2025-01-03T08:15:00Z',
  },
  {
    id: 'employee-james-jones',
    accountId: 'mock-account-1',
    name: 'James Jones',
    email: 'jjones@sample.com',
    // telephone intentionally omitted to show the "Not available" style
    employmentType: 'Part-time',
    employmentTitle: 'Business Administrator',
    recentVisitAt: 'Never',
    messagesCount: 0,
    isPublic: false,
    status: 'INACTIVE',
    createdAt: '2025-01-04T11:45:00Z',
  },
];


