import React from 'react';
import signupBackgroundUrl from '/assets/Sign-Up-Asset2.png';
import signupShapeUrl from '/assets/Sign-Up-Asset1.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  heroTitle?: string;
  heroSubtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  heroTitle = 'Tillid fra virksomheder over hele Danmark',
  heroSubtitle = 'Virksomheder over hele landet bruger allerede vores digitale medarbejderhåndbog til at gøre onboarding og HR-processer lettere og mere effektive.',
}) => {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column - Form Section (446px width) */}
      <div className="w-[446px] flex items-start pt-[29px] pl-[73px] bg-white">
        {children}
      </div>

      {/* Right Column - Promotional Section */}
      <div className="flex-1 relative bg-white overflow-hidden min-h-screen">
        {/* Diagram/Asset 2 - Covers the whole right side as background */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={signupBackgroundUrl}
            alt="Features Diagram"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Wavy Background Shapes - Design 1 (Smaller, positioned to the right) */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2 pointer-events-none z-0">
          <div className="w-[700px] h-[800px]">
            <img
              src={signupShapeUrl}
              alt="Background"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Content Area - Text overlay */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8">
          {/* Text Section */}
          <div className="w-full max-w-[967px] flex flex-col items-center gap-2.5 text-center">
            <h1 className="text-[40px] font-bold text-[#1a5948] capitalize leading-normal">
              {heroTitle}
            </h1>
            <p className="text-[24px] font-normal text-[#0d0e0e] leading-normal max-w-[835px]">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
