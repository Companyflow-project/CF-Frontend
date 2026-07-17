import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import i18n from "@/i18n"

/** Roles that have full admin/edit access (account owner, company admin, platform admin). */
const ADMIN_ROLES = new Set(['administrator', 'account_owner', 'company_admin']);

/** Check if a role has admin-level access (can edit handbook, manage employees, etc.). */
export function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.has(role);
}

/** Check if a role is an admin row in the employee table (protected from bulk actions/deletion). */
export function isAdminEmployeeRole(role?: string): boolean {
  return role === 'company_admin' || role === 'account_owner' || role === 'ADMIN';
}

/** Check if a role can view all handbook pages including unpublished. */
export function canViewAllPagesRole(role?: string): boolean {
  return isAdminRole(role) || role === 'senior_employee';
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;
const SECONDS_PER_WEEK = 7 * SECONDS_PER_DAY;
const SECONDS_PER_MONTH = 30 * SECONDS_PER_DAY;
const SECONDS_PER_YEAR = 365 * SECONDS_PER_DAY;

/**
 * Formats a date string as relative time in the active UI language
 * (e.g. "2 hours ago" / "for 2 timer siden", "yesterday" / "i går").
 * @param dateString - Date string in format "YYYY-MM-DD HH:mm" or ISO format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString || dateString === 'Never') {
    return i18n.t('employees:table.never');
  }

  try {
    // Parse the date string (handles both "YYYY-MM-DD HH:mm" and ISO formats)
    const date = new Date(dateString.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    // numeric: 'auto' yields "yesterday"/"i går" and "last week"/"sidste uge"
    // instead of "1 day ago"/"1 week ago".
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    // Future timestamps fall through here too and read as "now", matching prior behaviour.
    if (seconds < SECONDS_PER_MINUTE) return rtf.format(0, 'second');
    if (seconds < SECONDS_PER_HOUR) return rtf.format(-Math.floor(seconds / SECONDS_PER_MINUTE), 'minute');
    if (seconds < SECONDS_PER_DAY) return rtf.format(-Math.floor(seconds / SECONDS_PER_HOUR), 'hour');
    if (seconds < SECONDS_PER_WEEK) return rtf.format(-Math.floor(seconds / SECONDS_PER_DAY), 'day');
    if (seconds < SECONDS_PER_MONTH) return rtf.format(-Math.floor(seconds / SECONDS_PER_WEEK), 'week');
    if (seconds < SECONDS_PER_YEAR) return rtf.format(-Math.floor(seconds / SECONDS_PER_MONTH), 'month');
    return rtf.format(-Math.floor(seconds / SECONDS_PER_YEAR), 'year');
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
}

/**
 * Resolve a backend file path (e.g. /sites/default/files/...) into a full URL
 * by prepending the API origin. Already-absolute URLs are returned as-is.
 */
const _API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
export function resolveBackendUrl(uri: string | null | undefined): string {
  if (!uri) return '';
  if (uri.startsWith('http') || uri.startsWith('blob:') || uri.startsWith('data:')) return uri;
  const base = _API_ORIGIN.replace(/\/api\/?$/, '');
  return `${base}${uri}`;
}

/**
 * Rewrite relative src/href attributes inside an HTML string so images and
 * links served from the backend (e.g. /sites/default/files/...) load correctly.
 */
export function resolveHtmlUrls(html: string): string {
  if (!html) return html;
  const base = _API_ORIGIN.replace(/\/api\/?$/, '');
  if (!base) return html;
  // Match src="/ or href="/ (but not src="http or href="http)
  return html.replace(/(src|href)=(["'])\/((?!\/)[^"']*)\2/gi, `$1=$2${base}/$3$2`);
}

/**
 * Formats a phone number in Danish style: +45 XX XX XX XX
 * Handles numbers with or without +45 / 0045 prefix.
 * Non-Danish numbers (wrong digit count) are returned as-is.
 */
export function formatDanishPhone(raw: string | null | undefined): string {
  if (!raw) return '';

  // Strip everything except digits and leading +
  const stripped = raw.trim();
  if (!stripped) return '';

  // Normalise: remove +45 or 0045 prefix to get the local digits
  let digits = stripped.replace(/\D/g, '');
  if (digits.startsWith('45') && digits.length === 10) {
    digits = digits.slice(2); // remove country code
  }

  // Danish local numbers are exactly 8 digits
  if (digits.length !== 8) return stripped;

  // Format as XX XX XX XX
  const formatted = `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`;
  return `+45 ${formatted}`;
}
