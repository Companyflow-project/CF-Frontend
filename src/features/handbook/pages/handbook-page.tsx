import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useHandbookSections, useHandbookPages } from '../hooks';
import { handbookRoutes } from '../routes';
import { Plus, Search } from 'lucide-react';

export const HandbookPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: sections, loading: sectionsLoading, error: sectionsError } = useHandbookSections();
  const { data: pages } = useHandbookPages(activeSection || undefined);

  const filteredPages = pages.filter((page) => {
    if (statusFilter && page.status !== statusFilter) return false;
    if (search && !page.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Calculate progress stats
  const progressStats = useMemo(() => {
    // Cast to string to support legacy status values without strict union overlap errors
    const selected = pages.filter((p) => String(p.status) !== 'OPTED_OUT').length;
    const ready = pages.filter((p) => String(p.status) === 'READY').length;
    const notReady = pages.filter((p) => String(p.status) === 'NOT_READY').length;
    const optedOut = pages.filter((p) => String(p.status) === 'OPTED_OUT').length;
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
              className="rounded-[999px] px-5 py-[11px] h-auto text-[13px] shadow-[0_12px_24px_rgba(13,94,67,0.35)]"
              style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
            >
              Preview Handbook
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[rgba(16,66,51,0.12)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[13px] bg-white"
              onClick={() => navigate(handbookRoutes.addTheme)}
            >
              Add theme
            </Button>
          </div>
        }
      />
      {/* help banner */}
      <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-[#0d0e0e] max-w-3xl">
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
            Read Full Guide
          </Button>
        </div>
      </div>

      {/* main content + right sidebar layout */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:items-start">
        <div>
          <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)]">
            {/* search / filters header strip */}
            <div className="bg-[#f2f7f5] border border-[#d6e8e1] rounded-[16px] mx-4 mt-4 px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a85]" />
                <Input
                  placeholder="Search pages"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 rounded-[999px] border border-[#c8d8d3] bg-white text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 md:ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                  className={`rounded-[999px] px-5 h-11 text-sm ${statusFilter === null
                      ? 'border-transparent'
                      : 'border-[#c8d8d3] text-[#0d0e0e] bg-white'
                    }`}
                  style={statusFilter === null ? { backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' } : undefined}
                >
                  Show Your Pages
                </Button>
                <div className="flex items-center gap-4 text-sm text-[#7b8a85]">
                  {[
                    { label: 'Ready', color: '#2f946f', value: 'READY' },
                    { label: 'Not ready', color: '#f2a900', value: 'NOT_READY' },
                    { label: 'Opted out', color: '#ec5f60', value: 'OPTED_OUT' },
                  ].map((status) => (
                    <button
                      type="button"
                      key={status.value}
                      onClick={() =>
                        setStatusFilter(statusFilter === status.value ? null : status.value)
                      }
                      className="flex items-center gap-2"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: status.color,
                          opacity: statusFilter === status.value ? 1 : 0.5,
                        }}
                      />
                      <span
                        className={
                          statusFilter === status.value ? 'font-semibold text-[#0d0e0e]' : undefined
                        }
                      >
                        {status.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <CardContent className="pt-6">
              {sectionsLoading ? (
                <div className="text-center py-12 text-gray-500">Loading handbook sections...</div>
              ) : sectionsError ? (
                <div className="text-center py-12 text-red-500">
                  Error loading sections: {sectionsError.message}
                </div>
              ) : sections.length > 0 ? (
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
                            <div className="mt-5 flex flex-wrap justify-end gap-2">
                              <Button
                                className="rounded-[999px] px-6 py-2 h-auto text-sm shadow-[0_10px_20px_rgba(13,94,67,0.3)]"
                                style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
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
          <Card className="bg-white w-full border border-[#e5efea] rounded-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-[#0d0e0e]">Your progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { label: 'Pages selected', value: progressStats.selected },
                { label: 'Ready', value: progressStats.ready },
                { label: 'Not ready', value: progressStats.notReady },
                { label: 'Opted out', value: progressStats.optedOut },
              ].map((item, index) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center py-3 text-sm text-[#0d0e0e]">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  {index < 3 && <div className="border-t border-dashed border-[#cde1d9]" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bulk actions card */}
          <Card className="bg-white w-full border border-[#e5efea] rounded-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-[#0d0e0e]">Bulk actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {['Mark as Ready', 'Mark as Not ready', 'Opt out', 'Include'].map((action) => (
                  <Button
                    key={action}
                    variant="outline"
                    className="border-[#cce3da] text-[#0d0e0e] rounded-[999px] text-sm py-2"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Remember and action card */}
          <Card className="bg-white w-full border border-[#e5efea] rounded-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <CardContent className="pt-6 space-y-4 min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0d0e0e] mb-2">Reminder:</p>
                <p className="text-sm text-[#0d0e0e] break-words">
                  Only pages that are <strong>selected</strong> and marked{' '}
                  <strong>Ready</strong> will be visible to employees after you publish. You can
                  always edit later.
                </p>
              </div>
              <div className="border-t border-[#cde1d9] pt-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                  <div className="flex flex-col text-[#0d0e0e] text-base font-medium leading-tight flex-shrink-0">
                  </div>
                  <div className="flex flex-row flex-wrap gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPageId(null)}
                      className="bg-white border border-[#cce3da] text-[#0d0e0e] rounded-[999px] px-4 py-2 h-auto w-full sm:w-auto"
                    >
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPublishModalOpen(true)}
                      className="rounded-[999px] px-4 py-2 h-auto w-full sm:w-auto"
                      style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                    >
                      Publish Handbook
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* tip section */}
      <div className="mt-6 bg-[#fff9f0] border border-[#f59e0b] border-l-[6px] rounded-[16px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-1">Tip.</p>
            <p className="text-sm text-[#0d0e0e]">
              Want to target pages to specific job types or departments? Create them first under{' '}
              <span className="font-semibold">Settings</span>, then return here to assign visibility.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-[rgba(16,66,51,0.12)] text-[#0d0e0e] rounded-[999px] px-4 py-2 h-auto"
          >
            Open Settings
          </Button>
        </div>
      </div>

      <PublishHandbookModal
        open={publishModalOpen}
        onOpenChange={setPublishModalOpen}
        onConfirm={() => {
          // TODO: Implement publish
          console.log('Publish Handbook');
          setPublishModalOpen(false);
        }}
      />
    </PageShell>
  );
};
