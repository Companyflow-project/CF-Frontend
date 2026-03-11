import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '../api';
import { authRoutes } from '../routes';
import { toast } from 'sonner';
import loginLogoUrl from '/assets/Login-Logo.svg';

export const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(true);
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      return;
    }

    authApi.validateResetToken(token)
      .then((userEmail) => {
        if (userEmail) {
          setEmail(userEmail);
        } else {
          setTokenValid(false);
        }
      })
      .catch(() => {
        setTokenValid(false);
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

  if (validating) {
    return (
      <div className="w-full flex flex-col">
        <div className="w-full max-w-[300px] flex flex-col gap-8 mt-20">
          <div className="flex items-center justify-center">
            <img src={loginLogoUrl} alt="CompanyFlow" className="h-auto w-[188px]" />
          </div>
          <p className="text-[15px] text-[#6b7280]">{t('resetPassword.validating')}</p>
        </div>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="w-full flex flex-col">
        <div className="w-full max-w-[300px] flex flex-col gap-8 mt-20">
          <div className="flex items-center justify-center">
            <img src={loginLogoUrl} alt="CompanyFlow" className="h-auto w-[188px]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-[20px] font-semibold text-[#0d0e0e] leading-[28px]">
              {t('resetPassword.invalidTitle')}
            </h2>
            <p className="text-[14px] text-[#6b7280] leading-[20px]">
              {t('resetPassword.invalidDescription')}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to={authRoutes.forgotPassword}
              className="w-full inline-flex items-center justify-center bg-[#1a5948] hover:bg-[#143e33] text-white font-medium text-[18px] leading-[25px] py-3 px-8 rounded-[15px] tracking-[0.18px] transition-colors"
            >
              {t('resetPassword.requestNewLink')}
            </Link>
            <div className="text-center">
              <Link to={authRoutes.login} className="text-[16px] font-medium text-[#0d0e0e] underline">
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(t('resetPassword.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.passwordsDoNotMatch'));
      return;
    }

    setSubmitting(true);
    try {
      const message = await authApi.resetPassword(token, newPassword);
      toast.success(message);
      navigate(authRoutes.login, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('errors.somethingWentWrong');
      setError(msg);
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

        <div className="flex flex-col gap-2">
          <h2 className="text-[20px] font-semibold text-[#0d0e0e] leading-[28px]">
            {t('resetPassword.title')}
          </h2>
          <p className="text-[14px] text-[#6b7280] leading-[20px]">
            {email
              ? t('resetPassword.descriptionWithEmail', { email })
              : t('resetPassword.descriptionWithoutEmail')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[12px] w-full">
          <div className="flex flex-col gap-[12px]">
            <Label htmlFor="newPassword" className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]">
              {t('resetPassword.newPasswordLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0 h-auto"
            />
          </div>

          <div className="flex flex-col gap-[12px]">
            <Label htmlFor="confirmPassword" className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]">
              {t('resetPassword.confirmPasswordLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
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
              {submitting ? t('resetPassword.submitting') : t('resetPassword.submit')}
            </Button>

            <div className="text-center">
              <Link
                to={authRoutes.login}
                className="text-[18px] font-medium text-[#0d0e0e] underline"
              >
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
