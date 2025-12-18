import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../hooks';
import { authRoutes } from '../routes';
import loginLogoUrl from '/assets/Login-Logo.svg';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
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
            <Button
              type="submit"
              className="w-full bg-[#1a5948] hover:bg-[#1a5948]/90 text-white font-medium text-[18px] leading-[25px] py-3 px-8 rounded-[15px] tracking-[0.18px] h-auto"
            >
              Log ind
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

