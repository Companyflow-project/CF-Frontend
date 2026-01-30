import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface HelpBannerProps {
  title?: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
}

export const HelpBanner: React.FC<HelpBannerProps> = ({
  title = 'Help.',
  description = 'Need assistance? Contact our support team for help.',
  linkText,
  linkHref,
}) => {
  return (
    <Card className="mb-6 border-l-4 border-l-orange-500 bg-orange-50/50">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-bold text-base mb-2">{title}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
          </div>
          {linkText && linkHref && (
            <a
              href={linkHref}
              className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap ml-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              {linkText}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

