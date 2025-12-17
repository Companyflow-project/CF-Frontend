import React, { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HandbookTabs } from '../components/handbook-tabs';
import { HandbookPagesTable } from '../components/handbook-pages-table';
import { HandbookEditor } from '../components/handbook-editor';
import { PublishHandbookModal } from '@/features/employees/components/publish-handbook-modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useHandbookSections, useHandbookPages } from '../hooks';
import { Eye, Plus, Settings, Search } from 'lucide-react';

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

  // Calculate progress stats
  const progressStats = useMemo(() => {
    // Pages selected = all pages that are not opted out (assuming they can be selected)
    const selected = pages.filter((p) => p.status !== 'OPTED_OUT').length;
    const ready = pages.filter((p) => p.status === 'READY').length;
    const notReady = pages.filter((p) => p.status === 'NOT_READY').length;
    const optedOut = pages.filter((p) => p.status === 'OPTED_OUT').length;
    return { selected, ready, notReady, optedOut };
  }, [pages]);

  return (
    <PageShell
      sidebar={
        <div className="space-y-4 w-full max-w-full">
          {/* Your progress card */}
          <Card className="bg-white w-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Your progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Pages selected</span>
                <span className="text-sm font-medium text-[#0d0e0e]">{progressStats.selected}</span>
              </div>
              <div className="border-t border-dashed border-[#adcfc5]"></div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Ready</span>
                <span className="text-sm font-medium text-[#0d0e0e]">{progressStats.ready}</span>
              </div>
              <div className="border-t border-dashed border-[#adcfc5]"></div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Not ready</span>
                <span className="text-sm font-medium text-[#0d0e0e]">{progressStats.notReady}</span>
              </div>
              <div className="border-t border-dashed border-[#adcfc5]"></div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Opted out</span>
                <span className="text-sm font-medium text-[#0d0e0e]">{progressStats.optedOut}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bulk actions card */}
          <Card className="bg-white w-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Bulk actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5] text-sm whitespace-normal break-words"
                >
                  Mark as Ready
                </Button>
                <Button
                  variant="outline"
                  className="border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5] text-sm whitespace-normal break-words"
                >
                  Opt out
                </Button>
                <Button
                  variant="outline"
                  className="border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5] text-sm whitespace-normal break-words"
                >
                  Mark as Not Ready
                </Button>
                <Button
                  variant="outline"
                  className="border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5] text-sm whitespace-normal break-words"
                >
                  Include
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Remember and action card */}
          <Card className="bg-white w-full">
            <CardContent className="pt-6 space-y-4 min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0d0e0e] mb-2">Remember:</p>
                <p className="text-sm text-[#0d0e0e] break-words">
                  Only pages that are <strong>selected</strong> and marked <strong>Ready</strong> will be visible to employees after you publish. You can always edit later.
                </p>
              </div>
              <div className="border-t border-[#adcfc5] pt-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                  <div className="flex flex-col text-[#0d0e0e] text-base font-medium leading-normal flex-shrink-0">
                    <p className="mb-0">Ready to</p>
                    <p className="mb-0">share</p>
                    <p className="mb-0">changes?</p>
                  </div>
                  <div className="flex flex-row gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPageId(null)}
                      className="bg-white border border-[rgba(88,172,146,0.5)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[15px] py-[11px] h-auto"
                    >
                      <div className="flex flex-col items-center justify-center text-[13.3px] text-center leading-normal">
                        <p className="mb-0">Save</p>
                        <p className="mb-0">Progress</p>
                      </div>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPublishModalOpen(true)}
                      className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[10px] px-[15px] py-[11px] h-auto"
                    >
                      <div className="flex flex-col items-center justify-center text-[13.3px] text-center leading-normal">
                        <p className="mb-0">Publish</p>
                        <p className="mb-0">Handbook</p>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PageHeader
        title="Manage Handbook"
        actions={
          <>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <Eye className="h-4 w-4 mr-2" />
              Preview Handbook
            </Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap hidden sm:inline-flex">
              Order of themes
            </Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Add theme
            </Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Handbook settings</span>
              <span className="sm:hidden">Settings</span>
            </Button>
          </>
        }
      />
      {/* Help Banner */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base sm:text-lg mb-1">Help</p>
            <p className="text-sm text-[#0d0e0e]">
              Select the pages to include, write or edit their content, and mark a page Ready when it matches exactly what you want. Only pages that are selected and Ready will be published. You can also create your own pages and themes.
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5] whitespace-nowrap self-start sm:self-auto">
            Read full guide
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4 mb-6">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search pages"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant={statusFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(null)}
            className={statusFilter === null ? 'bg-[#1a5948] hover:bg-[#1a5948]/90 text-white' : ''}
          >
            Show Your Pages
          </Button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></div>
            <Badge
              variant={statusFilter === 'READY' ? 'default' : 'outline'}
              className="cursor-pointer border-green-500 whitespace-nowrap"
              onClick={() => setStatusFilter(statusFilter === 'READY' ? null : 'READY')}
            >
              Ready
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0"></div>
            <Badge
              variant={statusFilter === 'NOT_READY' ? 'default' : 'outline'}
              className="cursor-pointer border-yellow-500 whitespace-nowrap"
              onClick={() =>
                setStatusFilter(statusFilter === 'NOT_READY' ? null : 'NOT_READY')
              }
            >
              Not ready
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0"></div>
            <Badge
              variant={statusFilter === 'OPTED_OUT' ? 'default' : 'outline'}
              className="cursor-pointer border-red-500 whitespace-nowrap"
              onClick={() =>
                setStatusFilter(statusFilter === 'OPTED_OUT' ? null : 'OPTED_OUT')
              }
            >
              Opted out
            </Badge>
          </div>
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
                  <>
                    <HandbookPagesTable
                      pages={filteredPages}
                      onEdit={setEditingPageId}
                      onPreview={(id) => {
                        // TODO: Implement preview
                        console.log('Preview page', id);
                      }}
                    />
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        className="border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5] bg-[#1a5948] hover:bg-[#1a5948]/90 text-white border-[#1a5948]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Page
                      </Button>
                    </div>
                  </>
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
      
      {/* Tip Section */}
      <div className="mt-6 bg-pink-50 border border-pink-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-1">Tip</p>
            <p className="text-sm text-[#0d0e0e]">
              Want to target pages to specific job types or departments? Create them first under Settings, then return here to assign visibility.
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5] whitespace-nowrap self-start sm:self-auto">
            Open Settings
          </Button>
        </div>
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

