import React, { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { SidebarCard } from '@/components/common/sidebar-card';
import { HandbookTabs } from '../components/handbook-tabs';
import { HandbookPagesTable } from '../components/handbook-pages-table';
import { HandbookEditor } from '../components/handbook-editor';
import { PublishHandbookModal } from '@/features/employees/components/publish-handbook-modal';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useHandbookSections, useHandbookPages } from '../hooks';
import { Eye, Plus, Settings } from 'lucide-react';

export const HandbookPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: sections } = useHandbookSections();
  const { data: pages } = useHandbookPages(activeSection || undefined);

  const filteredPages = pages.filter((page) => {
    if (statusFilter && page.status !== statusFilter) return false;
    if (search && !page.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageShell
      sidebar={
        <>
          <SidebarCard title="Your progress">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Pages ready</span>
                <span>0 / 0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </SidebarCard>
          <SidebarCard title="Bulk actions">
            <div className="space-y-1 text-sm">
              <button className="text-left hover:underline">Set all to ready</button>
              <button className="text-left hover:underline">Set all to not ready</button>
            </div>
          </SidebarCard>
          <SidebarCard title="Remember">
            <p className="text-sm text-muted-foreground">
              Make sure all pages are ready before publishing.
            </p>
          </SidebarCard>
        </>
      }
    >
      <PageHeader
        title="Manage Handbook"
        actions={
          <>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview Handbook
            </Button>
            <Button variant="outline">Order of themes</Button>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add theme
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Handbook settings
            </Button>
          </>
        }
      />
      <HelpBanner />
      <div className="space-y-4 mb-6">
        <Input
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            Show Your Pages
          </Button>
          <Badge
            variant={statusFilter === 'READY' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter(statusFilter === 'READY' ? null : 'READY')}
          >
            Ready
          </Badge>
          <Badge
            variant={statusFilter === 'NOT_READY' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              setStatusFilter(statusFilter === 'NOT_READY' ? null : 'NOT_READY')
            }
          >
            Not ready
          </Badge>
          <Badge
            variant={statusFilter === 'OPTED_OUT' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              setStatusFilter(statusFilter === 'OPTED_OUT' ? null : 'OPTED_OUT')
            }
          >
            Opted out
          </Badge>
        </div>
      </div>
      {sections.length > 0 && (
        <HandbookTabs
          sections={sections}
          activeSection={activeSection || sections[0]?.id || ''}
          onSectionChange={setActiveSection}
        >
          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              <div className="mt-4">
                {editingPageId ? (
                  <HandbookEditor />
                ) : (
                  <HandbookPagesTable
                    pages={filteredPages}
                    onEdit={setEditingPageId}
                    onPreview={(id) => {
                      // TODO: Implement preview
                      console.log('Preview page', id);
                    }}
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </HandbookTabs>
      )}
      {sections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No handbook sections yet.</p>
        </div>
      )}
      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setEditingPageId(null)}>
          Save progress
        </Button>
        <Button onClick={() => setPublishModalOpen(true)}>Publish handbook</Button>
      </div>
      <PublishHandbookModal
        open={publishModalOpen}
        onOpenChange={setPublishModalOpen}
        onConfirm={() => {
          // TODO: Implement publish
          console.log('Publish handbook');
          setPublishModalOpen(false);
        }}
      />
    </PageShell>
  );
};

