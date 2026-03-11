import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '../api';
import { authRoutes } from '../routes';
import loginLogoUrl from '/assets/Login-Logo.svg';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.somethingWentWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="w-full max-w-[300px] flex flex-col gap-8 mt-20">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <img
            src={loginLogoUrl}
            alt="CompanyFlow"
            className="h-auto w-[188px]"
          />
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-[20px] font-semibold text-[#0d0e0e] leading-[28px]">
              {t('forgotPassword.checkEmail')}
            </h2>
            <p className="text-[15px] text-[#6b7280] leading-[22px]">
              {t('forgotPassword.sentMessage', { email })}
            </p>
            <div className="mt-4 text-center">
              <Link
                to={authRoutes.login}
                className="text-[16px] font-medium text-[#1a5948] underline"
              >
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h2 className="text-[20px] font-semibold text-[#0d0e0e] leading-[28px]">
                {t('forgotPassword.title')}
              </h2>
              <p className="text-[14px] text-[#6b7280] leading-[20px]">
                {t('forgotPassword.description')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-[12px] w-full">
              <div className="flex flex-col gap-[12px]">
                <Label htmlFor="email" className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]">
                  {t('forgotPassword.emailLabel')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0 h-auto"
                />
              </div>

              <div className="flex flex-col gap-6 mt-6">
                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1a5948] hover:bg-[#143e33] active:bg-[#0f2e26] text-white font-medium text-[18px] leading-[25px] py-3 px-8 rounded-[15px] tracking-[0.18px] h-auto disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
                </Button>

                <div className="text-center">
                  <Link
                    to={authRoutes.login}
                    className="text-[18px] font-medium text-[#0d0e0e] underline"
                  >
                    {t('forgotPassword.backToLogin')}
                  </Link>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
