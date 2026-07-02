import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { authApi } from '../api';

/**
 * CF-4: lands from the email verification link (/verify-email/:token). Confirms
 * the token with the backend, which activates the account and returns a session
 * token, then logs the user in and sends them to the console.
 */
export const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { setUserFromRegister } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (!token) {
      setError(t('verify.failed'));
      return;
    }

    let cancelled = false;

    authApi
      .verifyEmail(token)
      .then((user) => {
        if (!cancelled) {
          setUserFromRegister(user);
          navigate('/', { replace: true });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err instanceof Error && err.message) || t('verify.failed'));
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <a href="/login" className="text-blue-600 underline">
          {t('signup.backToLogin')}
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-[#373b3b]">{t('verify.verifying')}</span>
    </div>
  );
};
