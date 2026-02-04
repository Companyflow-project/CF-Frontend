import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { SidebarCard } from '@/components/common/sidebar-card';
import { HandbookEditor } from '../components/handbook-editor';
import { handbookRoutes } from '../routes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const EditThemePage: React.FC = () => {
  const { id: _id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <PageShell
      sidebar={
        <>
          <SidebarCard title="Progress">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status</span>
                <span>Not ready</span>
              </div>
            </div>
          </SidebarCard>
          <SidebarCard title="History">
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium">Last changed</p>
                <p className="text-muted-foreground">-</p>
              </div>
              <div>
                <p className="font-medium">Changed by</p>
                <p className="text-muted-foreground">-</p>
              </div>
            </div>
          </SidebarCard>
        </>
      }
    >
      <PageHeader
        title="Edit Theme"
        actions={
          <Button variant="outline" onClick={() => navigate(handbookRoutes.list)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      <HelpBanner />
      <HandbookEditor />
    </PageShell>
  );
};

