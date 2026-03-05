import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../hooks';
import { authRoutes } from '../routes';
import { toast } from 'sonner';
import loginLogoUrl from '/assets/Login-Logo.svg';

function friendlyLoginError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('invalid') || lower.includes('credentials') || lower.includes('password') || lower.includes('unauthorized')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('failed to fetch')) {
    return 'Unable to reach the server. Please check your internet connection.';
  }
  if (lower.includes('rate') || lower.includes('too many')) {
    return 'Too many login attempts. Please wait a minute and try again.';
  }
  if (lower.includes('internal') || lower.includes('500') || lower.includes('something went wrong')) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }
  if (!lower.includes('sql') && !lower.includes('er_') && !lower.includes('errno') && raw.length < 200) {
    return raw;
  }
  return 'Login failed. Please try again or contact support.';
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Login failed';
      const friendly = friendlyLoginError(raw);
      setError(friendly);
      toast.error(friendly);
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-[12px] w-full">
          {/* Email Field */}
          <div className="flex flex-col gap-[12px]">
            <Label htmlFor="email" className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]">
              Email <span className="text-red-500">*</span>
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

          {/* Password Field */}
          <div className="flex flex-col gap-[12px]">
            <Label
              htmlFor="password"
              className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]"
            >
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0 h-auto"
            />
          </div>

          {/* Button Section */}
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
              {submitting ? 'Logger ind…' : 'Log ind'}
            </Button>

            {/* Signup Link */}
            <div className="text-center">
              <p className="text-[18px] font-medium text-[#0d0e0e] leading-[25px] tracking-[0.18px]">
                or{' '}
                <Link
                  to={authRoutes.signup}
                  className="text-[18px] font-medium text-[#0d0e0e] underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

