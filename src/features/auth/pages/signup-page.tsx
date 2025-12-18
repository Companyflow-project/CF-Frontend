import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '../hooks';
import { authApi } from '../api';
import { authRoutes } from '../routes';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      alert('Du skal acceptere vilkårene');
      return;
    }
    try {
      await authApi.register({ name, companyName, cvr, email, password });
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Signup failed:', error);
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
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-[#1a5948] hover:bg-[#1a5948]/90 text-white font-medium text-[18px] leading-[25px] py-3 px-8 rounded-[15px] tracking-[0.18px] h-auto"
              >
                Prov gratis
              </Button>
              <div className="flex items-center justify-center gap-2">
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
                  Vilkår og betingelser
                </Label>
              </div>
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
    </div>
  );
};
