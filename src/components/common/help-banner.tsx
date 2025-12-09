import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface HelpBannerProps {
  title?: string;
  description?: string;
}

export const HelpBanner: React.FC<HelpBannerProps> = ({
  title = 'Help.',
  description = 'Need assistance? Contact our support team for help.',
}) => {
  return (
    <Card className="mb-6 border-l-4 border-l-yellow-500">
      <CardContent className="pt-6">
        <p className="font-bold text-lg mb-1">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

