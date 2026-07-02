export const authRoutes = {
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password/:token',
  confirmEmailChange: '/confirm-email-change/:token',
} as const;

