import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '../hooks';
import { authApi } from '../api';
import { authRoutes } from '../routes';
import { TermsModal } from '../components/terms-modal';
import { toast } from 'sonner';
import loginLogoUrl from '/assets/Login-Logo.svg';

/** Map raw backend/network error messages to user-friendly strings. */
function friendlySignupError(raw: string): string {
  const lower = raw.toLowerCase();

  // Email already taken
  if (lower.includes('email already') || lower.includes('duplicate') || lower.includes('already registered')) {
    return 'This email is already registered. Please log in or use a different email.';
  }
  // Validation
  if (lower.includes('valid email') || lower.includes('format')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('password') && (lower.includes('short') || lower.includes('weak') || lower.includes('least'))) {
    return 'Your password is too short. Please use at least 8 characters.';
  }
  // Network / server
  if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('failed to fetch')) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }
  if (lower.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  if (lower.includes('internal') || lower.includes('500') || lower.includes('something went wrong')) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }
  // Rate limiting
  if (lower.includes('rate') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }

  // If the message already looks user-friendly (no SQL, no stack trace), show it as-is
  if (!lower.includes('sql') && !lower.includes('er_') && !lower.includes('errno') && raw.length < 200) {
    return raw;
  }

  // Fallback for any truly unrecognizable error
  return 'Registration failed. Please try again or contact support.';
}

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cvr, setCvr] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setUserFromRegister } = useAuth();
  const navigate = useNavigate();

  // Button is only active when every required field has a value AND terms are ticked
  const canSubmit =
    name.trim() !== '' &&
    companyName.trim() !== '' &&
    cvr.trim() !== '' &&
    email.trim() !== '' &&
    password.trim() !== '' &&
    termsAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!termsAccepted) {
      toast.error('Du skal acceptere vilkår og betingelser.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await authApi.register({ name, companyName, cvr, email, password });
      toast.success('Account created successfully!');
      toast.info('Setting up your handbook — this may take a moment. Please don\'t refresh the page.', { duration: 10000 });
      setUserFromRegister(user);
      navigate('/');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Signup failed';
      const friendly = friendlySignupError(raw);
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
          {/* Name Field */}
          <div className="flex flex-col gap-[12px]">
            <Label htmlFor="name" className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0 h-auto"
            />
          </div>

          {/* Company Name Field */}
          <div className="flex flex-col gap-[12px]">
            <Label
              htmlFor="companyName"
              className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]"
            >
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0 h-auto"
            />
          </div>

          {/* CVR Field */}
          <div className="flex flex-col gap-[12px]">
            <Label htmlFor="cvr" className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]">
              CVR <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cvr"
              value={cvr}
              onChange={(e) => setCvr(e.target.value)}
              required
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0 h-auto"
            />
          </div>

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

          {/* Button and Terms Section */}
          <div className="flex flex-col gap-6 mt-6">
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-3">
              {/* Terms checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label
                  htmlFor="terms"
                  className="text-[14px] font-normal text-[#0d0e0e] cursor-pointer"
                >
                  Jeg accepterer{' '}
                  <button
                    type="button"
                    onClick={() => setTermsOpen(true)}
                    className="underline text-[#1a5948] hover:text-[#143e33] transition-colors font-medium"
                  >
                    vilkår og betingelser
                  </button>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full bg-[#1a5948] hover:bg-[#143e33] active:bg-[#0f2e26] text-white font-medium text-[18px] leading-[25px] py-3 px-8 rounded-[15px] tracking-[0.18px] h-auto disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Opretter…' : 'Prøv gratis'}
              </Button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-[18px] font-medium text-[#0d0e0e] leading-[25px] tracking-[0.18px]">
                or{' '}
                <Link
                  to={authRoutes.login}
                  className="text-[18px] font-medium text-[#0d0e0e] underline"
                >
                  Log ind
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Terms & Conditions modal */}
      <TermsModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => setTermsAccepted(true)}
      />
    </div>
  );
};
