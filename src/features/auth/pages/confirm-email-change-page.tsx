import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api';

/**
 * CF-24: lands from the "confirm your new email" link (/confirm-email-change/:token).
 * Applies the pending email change, then asks the user to log in with the new email.
 */
export const ConfirmEmailChangePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation('account');
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  useEffect(() => {
    if (!token) {
      setStatus('failed');
      return;
    }
    let cancelled = false;
    authApi
      .confirmEmailChange(token)
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      {status === 'verifying' && <p className="text-[#373b3b]">{t('emailChange.verifying')}</p>}
      {status === 'success' && (
        <>
          <p className="text-[#1a5948] font-medium">{t('emailChange.success')}</p>
          <a href="/login" className="text-[#1a5948] underline">{t('emailChange.goToLogin')}</a>
        </>
      )}
      {status === 'failed' && (
        <>
          <p className="text-red-600">{t('emailChange.failed')}</p>
          <a href="/login" className="text-[#1a5948] underline">{t('emailChange.goToLogin')}</a>
        </>
      )}
    </div>
  );
};
