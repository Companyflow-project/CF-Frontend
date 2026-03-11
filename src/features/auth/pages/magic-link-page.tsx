import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';

export const MagicLinkPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { loginWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (!token) {
      setError(t('magicLink.invalid'));
      return;
    }

    let cancelled = false;

    loginWithMagicLink(token)
      .then(() => {
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.message || t('magicLink.expiredOrInvalid')
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <a href="/login" className="text-blue-600 underline">
          {t('magicLink.goToLogin')}
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-[#373b3b]">{t('magicLink.signingIn')}</span>
    </div>
  );
};
