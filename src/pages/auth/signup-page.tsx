import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/features/auth/hooks';
import { authApi } from '@/features/auth/api';
import { toast } from 'sonner';
import loginLogoUrl from '/assets/Login-Logo.svg';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cvr, setCvr] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error(t('signup.termsRequired'));
      return;
    }
    try {
      const { verificationRequired } = await authApi.register({ name, companyName, cvr, email, password, termsAccepted });
      // CF-4: account starts inactive; the user must verify their email first.
      if (verificationRequired) {
        toast.success(t('signup.accountCreated'));
        navigate('/login');
        return;
      }
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Signup failed:', error);
      const raw = error instanceof Error ? error.message : t('errors.signupFailedRaw');
      const lower = raw.toLowerCase();
      if (lower.includes('email already') || lower.includes('duplicate') || lower.includes('already registered')) {
        toast.error(t('errors.emailAlreadyRegistered'));
      } else if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('failed to fetch')) {
        toast.error(t('errors.networkError'));
      } else if (!lower.includes('sql') && !lower.includes('er_') && raw.length < 200) {
        toast.error(raw);
      } else {
        toast.error(t('errors.registrationFailed'));
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-[300px] flex flex-col gap-8">
        {/* Logo */}
        <div className="h-[100px] flex items-center justify-center">
          <img
            src={loginLogoUrl}
            alt="CompanyFlow"
            className="h-auto w-[188px]"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
          {/* Name Field */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="name" className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]">
              {t('signup.nameLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0"
            />
          </div>

          {/* Company Name Field */}
          <div className="flex flex-col gap-3">
            <Label
              htmlFor="companyName"
              className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]"
            >
              {t('signup.companyNameLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0"
            />
          </div>

          {/* CVR Field */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="cvr" className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]">
              {t('signup.cvrLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cvr"
              value={cvr}
              onChange={(e) => setCvr(e.target.value)}
              required
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0"
            />
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="email" className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]">
              {t('signup.emailLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-3">
            <Label
              htmlFor="password"
              className="text-[16px] font-normal text-[#0d0e0e] leading-[21px]"
            >
              {t('signup.passwordLabel')} <span className="text-red-500">*</span>
            </Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#f2f2f2] rounded-[7px] p-3 text-[16px] text-[#373b3b] border-0 focus-visible:ring-0"
            />
          </div>

          {/* Button and Terms Section */}
          <div className="flex flex-col gap-6 mt-6">
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-[#1a5948] hover:bg-[#1a5948]/90 text-white font-medium text-[18px] leading-[25px] py-3 px-8 rounded-[15px] tracking-[0.18px]"
              >
                {t('signup.submit')}
              </Button>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label
                  htmlFor="terms"
                  className="text-[14px] font-normal text-[#0d0e0e] cursor-pointer underline"
                >
                  {t('signup.termsLink')}
                </Label>
              </div>
            </div>

            {/* Or Separator */}
            <div className="text-center">
              <p className="text-[18px] font-medium text-[#0d0e0e] leading-[25px] tracking-[0.18px]">
                {t('signup.or')}
              </p>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-[16px] font-medium text-[#0d0e0e] underline"
              >
                {t('signup.logIn')}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
