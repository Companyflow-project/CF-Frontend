import React from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const AccountPage: React.FC = () => {
  return (
    <PageShell>
      <PageHeader
        title="Account"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white rounded-[999px] px-5 py-[11px] h-auto text-sm shadow-[0_10px_20px_rgba(13,94,67,0.3)]">
              Manage billing
            </Button>
            <Button
              variant="outline"
              className="border-[rgba(15,23,42,0.12)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-sm bg-white"
            >
              Export invoices
            </Button>
          </div>
        }
      />
      <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-[#0d0e0e]">
            <span className="font-bold">Reminder.</span> Keep your account details, plan
            preferences, and security settings up to date. Use the cards below to update profile
            information, manage billing, and control security.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-4 py-2 h-auto whitespace-nowrap"
          >
            Settings guide
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            title: 'Profile',
            description: 'Manage personal information, email, and notification settings.',
          },
          {
            title: 'Billing',
            description: 'Review invoices, update payment method, and download receipts.',
          },
          {
            title: 'Security',
            description: 'Update password, configure MFA, and manage sessions.',
          },
        ].map((card) => (
          <Card
            key={card.title}
            className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_12px_30px_rgba(15,23,42,0.08)] flex flex-col"
          >
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0d0e0e]">{card.title}</CardTitle>
              <CardDescription className="text-sm text-[#4b5652]">{card.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                variant="outline"
                className="w-full rounded-[999px] text-sm flex items-center justify-center gap-2"
              >
                Open
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
};
