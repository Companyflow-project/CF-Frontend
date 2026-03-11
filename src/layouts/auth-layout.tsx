import React from 'react';
import { useTranslation } from 'react-i18next';
import signupBackgroundUrl from '/assets/Sign-Up-Asset2.png';
import signupShapeUrl from '/assets/Sign-Up-Asset1.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  heroTitle?: string;
  heroSubtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  heroTitle,
  heroSubtitle,
}) => {
  const { t } = useTranslation('auth');
  const displayTitle = heroTitle ?? t('authLayout.heroTitle');
  const displaySubtitle = heroSubtitle ?? t('authLayout.heroSubtitle');

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column — Form panel */}
      <div
        className="w-[460px] flex-shrink-0 flex flex-col bg-white relative"
        style={{ boxShadow: '4px 0 24px rgba(26,89,72,0.07)' }}
      >
        {/* Form content */}
        <div className="flex-1 flex items-start pt-10 pl-12 pr-10 pb-10">
          {children}
        </div>
      </div>

      {/* Gradient Vertical Divider */}
      <div className="relative w-px flex-shrink-0 self-stretch">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, #1a5948 25%, #1a5948 75%, transparent 100%)',
            opacity: 0.35,
          }}
        />
      </div>

      {/* Right Column — Promotional Section */}
      <div className="flex-1 relative bg-[#f8faf9] overflow-hidden min-h-screen">
        {/* Diagram background */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={signupBackgroundUrl}
            alt="Features Diagram"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Decorative wavy shape */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2 pointer-events-none z-0">
          <div className="w-[700px] h-[800px]">
            <img
              src={signupShapeUrl}
              alt="Background"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-[700px] flex flex-col items-center gap-4 text-center">
            <h1 className="text-[38px] font-bold text-[#1a5948] leading-tight">
              {displayTitle}
            </h1>
            <p className="text-[20px] font-normal text-[#374151] leading-relaxed max-w-[580px]">
              {displaySubtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
