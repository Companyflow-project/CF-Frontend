import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string to relative time (e.g., "2 mins ago", "last month", "2 years ago")
 * @param dateString - Date string in format "YYYY-MM-DD HH:mm" or ISO format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString || dateString === 'Never') {
    return 'Never';
  }

  try {
    // Parse the date string (handles both "YYYY-MM-DD HH:mm" and ISO formats)
    const date = new Date(dateString.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Future dates
    if (diffMs < 0) {
      return 'Just now';
    }

    // Less than a minute
    if (diffSeconds < 60) {
      return 'Just now';
    }

    // Less than an hour
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 min ago' : `${diffMinutes} mins ago`;
    }

    // Less than a day
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }

    // Less than a week
    if (diffDays < 7) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    }

    // Less than a month
    if (diffWeeks < 4) {
      return diffWeeks === 1 ? 'Last week' : `${diffWeeks} weeks ago`;
    }

    // Less than a year
    if (diffMonths < 12) {
      return diffMonths === 1 ? 'Last month' : `${diffMonths} months ago`;
    }

    // Years
    return diffYears === 1 ? 'Last year' : `${diffYears} years ago`;
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
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
