import { matchPath } from 'react-router-dom';
import { userManualRoutes } from './routes';

/**
 * Which user manual guide belongs to which page. The keys are the guides' topic keys in the
 * manual book (loaded by CF-Backend scripts/load-user-manual.ts), so a "Brugermanual" button
 * can open the guide for the page it sits on.
 */
const PAGE_TOPICS: Array<[pattern: string, topic: string]> = [
  ['/account/company-profile/edit', 'company-profile'],
  ['/account/appearance', 'appearance'],
  ['/account/subscription', 'subscription'],
  ['/account/departments', 'departments'],
  ['/account/departments/add', 'department-add'],
  ['/account/departments/edit/:id', 'department-edit'],
  ['/account/employment-types', 'employment-types'],
  ['/account/employment-types/:id/assign', 'assign-employment-type'],
  ['/employees', 'employees'],
  ['/employees/add', 'employee-add'],
  ['/employees/:id/edit', 'employee-edit'],
  ['/employees/statistics', 'employee-statistics'],
  ['/employees/assign-employment-type', 'assign-employment-type'],
  ['/handbook/pages', 'handbook-pages'],
  ['/handbook/pages/:id/edit', 'handbook-page-edit'],
  ['/handbook/add-theme', 'handbook-themes'],
  ['/handbook/edit-theme/:id', 'handbook-themes'],
  ['/handbook/publish/:id?', 'handbook-publish'],
  ['/contacts', 'contacts'],
  ['/contacts/information-list', 'contacts-info-list'],
];

/** The guide for a page, or undefined when the manual has none (it then opens at the start). */
export function manualTopicFor(pathname: string): string | undefined {
  return PAGE_TOPICS.find(([pattern]) => matchPath({ path: pattern, end: true }, pathname))?.[1];
}

/** Opens the user manual in a new tab, at the given guide if there is one. */
export function openUserManual(topic?: string): void {
  window.open(topic ? userManualRoutes.section(topic) : userManualRoutes.root, '_blank', 'noopener');
}
