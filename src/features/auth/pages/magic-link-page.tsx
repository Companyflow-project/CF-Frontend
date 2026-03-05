import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';

export const MagicLinkPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { loginWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid magic link');
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
            err.message || 'This magic link is invalid or has expired. Please log in manually.'
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
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-[#373b3b]">Signing you in…</span>
    </div>
  );
};
