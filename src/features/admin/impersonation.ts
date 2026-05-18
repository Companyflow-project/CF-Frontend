import { adminApi } from './api';

/**
 * "View as company" — lets a platform admin enter the regular user console as a
 * company's account owner. Implemented as a token swap: the admin's JWT is
 * stashed in localStorage, replaced with a short-lived impersonation JWT, and
 * the page is reloaded so the auth context re-bootstraps as the company user.
 * A banner (see ImpersonationBanner) is shown while the stash is present and
 * restores the admin session on exit.
 */

const TOKEN_KEY = 'token';
const STASH_KEY = 'cf_impersonator';

export interface ImpersonationStash {
  /** The platform admin's original JWT, restored on exit. */
  adminToken: string;
  /** Display name of the company being viewed. */
  companyName: string;
  /** Where to send the admin back to when they exit (e.g. the company detail page). */
  returnTo: string;
}

export function getImpersonation(): ImpersonationStash | null {
  try {
    const raw = localStorage.getItem(STASH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ImpersonationStash>;
    if (!parsed.adminToken || !parsed.companyName) return null;
    return { adminToken: parsed.adminToken, companyName: parsed.companyName, returnTo: parsed.returnTo || '/admin/companies' };
  } catch {
    return null;
  }
}

export function isImpersonating(): boolean {
  return getImpersonation() !== null;
}

/** Drop the stash without restoring anything (used on real logout). */
export function clearImpersonation(): void {
  try { localStorage.removeItem(STASH_KEY); } catch { /* ignore */ }
}

/**
 * Enter the user console as the given company's account owner. Performs a full
 * page navigation to {@link targetPath} so the app re-bootstraps with the new token.
 */
export async function enterCompanyConsole(opts: {
  companyId: string | number;
  companyName: string;
  targetPath: string;
  returnTo: string;
}): Promise<void> {
  const adminToken = localStorage.getItem(TOKEN_KEY);
  if (!adminToken) throw new Error('Not authenticated.');

  const { token } = await adminApi.impersonateCompany(opts.companyId);

  const stash: ImpersonationStash = {
    adminToken,
    companyName: opts.companyName,
    returnTo: opts.returnTo,
  };
  localStorage.setItem(STASH_KEY, JSON.stringify(stash));
  localStorage.setItem(TOKEN_KEY, token);

  window.location.assign(opts.targetPath);
}

/**
 * Enter the user console as a specific user (regardless of which company they
 * belong to). Used by the admin "Change user view" picker — admins can pick any
 * active user and land in the console exactly as that user would see it.
 */
export async function enterUserConsole(opts: {
  userId: number;
  displayName: string;
  targetPath?: string;
  returnTo?: string;
}): Promise<void> {
  const adminToken = localStorage.getItem(TOKEN_KEY);
  if (!adminToken) throw new Error('Not authenticated.');

  const { token } = await adminApi.impersonate(opts.userId);

  const stash: ImpersonationStash = {
    adminToken,
    // The banner reads this — re-using the same field keeps existing UI working
    // for both company- and user-mode impersonation.
    companyName: opts.displayName,
    returnTo: opts.returnTo ?? '/admin',
  };
  localStorage.setItem(STASH_KEY, JSON.stringify(stash));
  localStorage.setItem(TOKEN_KEY, token);

  window.location.assign(opts.targetPath ?? '/');
}

/** Restore the admin session and return to where impersonation started. */
export function exitImpersonation(): void {
  const stash = getImpersonation();
  if (!stash) return;
  localStorage.setItem(TOKEN_KEY, stash.adminToken);
  clearImpersonation();
  window.location.assign(stash.returnTo);
}
