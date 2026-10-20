export const authRoutes = {
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password/:token',
  confirmEmailChange: '/confirm-email-change/:token',
} as const;


/**
 * Where to go after logging in: the page that sent the user to the login (a bookmark or a link
 * opened while logged out — see RequireAuth), otherwise the front page.
 */
export function pathAfterLogin(state: unknown): string {
  const from = (state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
  const path = from?.pathname;
  if (!path || !path.startsWith('/') || path.startsWith('//') || path === authRoutes.login) return '/';
  return `${path}${from?.search ?? ''}${from?.hash ?? ''}`;
}
