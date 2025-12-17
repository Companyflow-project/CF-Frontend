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
import { Plus, Search } from 'lucide-react';

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
    <PageShell>
      <PageHeader
        title="Manage Handbook"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[12px] px-[14px] py-[11px] h-auto text-[13.3px] whitespace-nowrap"
            >
              Preview Handbook
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[rgba(88,172,146,0.5)] text-[#0d0e0e] rounded-[10px] px-[15px] py-[11px] h-auto whitespace-nowrap"
            >
              Order of themes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[rgba(88,172,146,0.5)] text-[#0d0e0e] rounded-[10px] px-[15px] py-[11px] h-auto whitespace-nowrap"
            >
              Add theme
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[rgba(88,172,146,0.5)] text-[#0d0e0e] rounded-[10px] px-[15px] py-[11px] h-auto whitespace-nowrap"
            >
              Handbook settings
            </Button>
          </div>
        }
      />
      {/* help banner */}
      <div className="mb-6 bg-white rounded-[12px] border border-[#f59e0b] border-l-[6px] shadow-[0_12px_30px_rgba(15,23,42,0.08)] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm sm:text-base text-[#0d0e0e] max-w-3xl">
            <span className="font-bold">Help.</span>{' '}
            Select the pages to include, write or edit their content, and mark a page{' '}
            <span className="italic">Ready</span> when it matches exactly what you want. Only pages
            that are <span className="font-bold">selected</span> and{' '}
            <span className="font-bold">Ready</span> will be published. You can also create your own
            pages and themes.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[11px] py-[9px] h-auto whitespace-nowrap self-start sm:self-auto"
          >
            Read full guide
          </Button>
        </div>
      </div>

      {/* main content + right sidebar layout */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:items-start">
        <div>
          <Card className="bg-white border border-white rounded-[14px] shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            {/* search / filters header strip */}
            <div className="bg-[rgba(209,222,218,0.12)] border-b border-[rgba(88,172,146,0.5)] px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search pages"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button
                variant={statusFilter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(null)}
                className={statusFilter === null ? 'bg-[#1a5948] hover:bg-[#1a5948]/90 text-white' : ''}
              >
                Show Your Pages
              </Button>
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                  <Badge
                    variant={statusFilter === 'READY' ? 'default' : 'outline'}
                    className="cursor-pointer border-green-500 whitespace-nowrap"
                    onClick={() => setStatusFilter(statusFilter === 'READY' ? null : 'READY')}
                  >
                    Ready
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0" />
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
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
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

            <CardContent className="pt-4">
              {sections.length > 0 ? (
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
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
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
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No handbook sections yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* right sidebar column */}
        <div className="space-y-4 w-full max-w-full">
          {/* Your progress card */}
          <Card className="bg-white w-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Your progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Pages selected</span>
                <span className="text-sm font-medium text-[#0d0e0e]">
                  {progressStats.selected}
                </span>
              </div>
              <div className="border-t border-dashed border-[#adcfc5]" />
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Ready</span>
                <span className="text-sm font-medium text-[#0d0e0e]">
                  {progressStats.ready}
                </span>
              </div>
              <div className="border-t border-dashed border-[#adcfc5]" />
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Not ready</span>
                <span className="text-sm font-medium text-[#0d0e0e]">
                  {progressStats.notReady}
                </span>
              </div>
              <div className="border-t border-dashed border-[#adcfc5]" />
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Opted out</span>
                <span className="text-sm font-medium text-[#0d0e0e]">
                  {progressStats.optedOut}
                </span>
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
                  Only pages that are <strong>selected</strong> and marked{' '}
                  <strong>Ready</strong> will be visible to employees after you publish. You can
                  always edit later.
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
      </div>
      
      {/* tip section */}
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

