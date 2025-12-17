import React, { useState, useMemo } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { Card, CardContent } from '@/components/ui/card';
import { ContactsTable } from '../components/contacts-table';
import { AddExistingEmployeeModal } from '../components/add-existing-employee-modal';
import { AddExternalContactModal } from '../components/add-external-contact-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useContacts } from '../hooks';
import { Eye, EyeOff, Plus, Upload, Download } from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false);
  const [addExternalModalOpen, setAddExternalModalOpen] = useState(false);
  const { data: contacts } = useContacts({ search });

  const employeeContacts = contacts.filter((c) => c.isEmployeeContact);
  const externalContacts = contacts.filter((c) => c.isExternalContact);

  // Calculate visibility stats
  const visibilityStats = useMemo(() => {
    const publicProfiles = contacts.filter((c) => c.isPublic).length;
    const inactive = contacts.filter((c) => c.status === 'INACTIVE').length;
    return {
      publicProfiles,
      inactive,
      employee: employeeContacts.length,
      external: externalContacts.length,
      total: contacts.length,
    };
  }, [contacts, employeeContacts.length, externalContacts.length]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean, contactList: typeof contacts) => {
    setSelectedIds(selected ? contactList.map((c) => c.id) : []);
  };

  return (
    <PageShell
      sidebar={
        <div className="space-y-3 w-full">
          {/* Visibility card */}
          <Card className="bg-white border border-[rgba(15,23,42,0.08)] shadow-[0px_12px_30px_0px_rgba(15,23,42,0.08)] w-full">
            <CardContent className="p-[15px] space-y-[8px]">
              <div className="flex items-start justify-between pb-[2px] pt-px">
                <h3 className="text-[14px] font-bold text-[#0d0e0e]">Visibility</h3>
                <p className="text-[12px] italic text-[#5d6262] text-right">{visibilityStats.total} contacts listed</p>
              </div>
              <div className="space-y-0">
                <div className="flex justify-between items-center py-[9px] pb-[11px] border-b border-dashed border-[rgba(88,172,146,0.5)]">
                  <span className="text-[13.8px] text-[#0d0e0e]">Public profiles</span>
                  <span className="text-[14px] font-bold text-[#0d0e0e] text-center">{visibilityStats.publicProfiles}</span>
                </div>
                <div className="flex justify-between items-center py-[9px] pb-[11px] border-b border-dashed border-[rgba(88,172,146,0.5)]">
                  <span className="text-[14px] text-[#0d0e0e]">Inactive contacts</span>
                  <span className="text-[14px] font-bold text-[#0d0e0e] text-center">{visibilityStats.inactive}</span>
                </div>
                <div className="flex justify-between items-center py-[9px] pb-[11px] border-b border-dashed border-[rgba(88,172,146,0.5)]">
                  <span className="text-[13.8px] text-[#0d0e0e]">Employee contacts</span>
                  <span className="text-[14px] font-bold text-[#0d0e0e] text-center">{visibilityStats.employee}</span>
                </div>
                <div className="flex justify-between items-center py-[9px] pb-[11px] border-b border-dashed border-[rgba(88,172,146,0.5)]">
                  <span className="text-[14px] text-[#0d0e0e]">External contacts</span>
                  <span className="text-[14px] font-bold text-[#0d0e0e] text-center">{visibilityStats.external}</span>
                </div>
              </div>
              <div className="flex gap-[8px] justify-end pt-[2px]">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[15px] py-[11px] h-auto text-[13.3px]"
                >
                  Set all to private
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[15px] py-[11px] h-auto text-[13.3px]"
                >
                  Set all to public
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Guides card */}
          <Card className="bg-white border border-[rgba(15,23,42,0.08)] shadow-[0px_12px_30px_0px_rgba(15,23,42,0.08)] w-full">
            <CardContent className="p-[15px] space-y-[8px]">
              <div className="pb-[2px] pt-px">
                <h3 className="text-[14px] font-bold text-[#0d0e0e]">Help Guides</h3>
              </div>
              <div className="flex flex-col gap-[8px]">
                <button className="bg-white border border-[rgba(88,172,146,0.5)] rounded-[10px] px-[13px] py-[7px] flex items-center justify-between hover:bg-[#f0f7f5] transition-colors">
                  <span className="text-[13.3px] text-[#0d0e0e]">How to add contacts</span>
                  <span className="text-[16px] text-[#1d1f1f]">⇢</span>
                </button>
                <button className="bg-white border border-[rgba(88,172,146,0.5)] rounded-[10px] px-[13px] py-[7px] flex items-center justify-between hover:bg-[#f0f7f5] transition-colors">
                  <span className="text-[13.3px] text-[#0d0e0e]">How to edit employee profiles</span>
                  <span className="text-[16px] text-[#1d1f1f]">⇢</span>
                </button>
                <button className="bg-white border border-[rgba(88,172,146,0.5)] rounded-[10px] px-[13px] py-[7px] flex items-center justify-between hover:bg-[#f0f7f5] transition-colors">
                  <span className="text-[13.3px] text-[#0d0e0e]">How to add relatives information</span>
                  <span className="text-[16px] text-[#1d1f1f]">⇢</span>
                </button>
                <button className="bg-white border border-[rgba(88,172,146,0.5)] rounded-[10px] px-[13px] py-[7px] flex items-center justify-between hover:bg-[#f0f7f5] transition-colors">
                  <span className="text-[13.3px] text-[#0d0e0e]">How to import contacts</span>
                  <span className="text-[16px] text-[#1d1f1f]">⇢</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PageHeader
        title="Manage Contacts"
        actions={
          <>
            <Button variant="outline" onClick={() => setAddExternalModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add external contact
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </>
        }
      />
      <HelpBanner />
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            <Label htmlFor="show-inactive">Show inactive</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="public-only"
              checked={publicOnly}
              onChange={(e) => setPublicOnly(e.target.checked)}
            />
            <Label htmlFor="public-only">Public only</Label>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select>
            <option>Sort by</option>
            <option>Name</option>
            <option>Email</option>
            <option>Function</option>
          </Select>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">All Contacts</h3>
        <ContactsTable
          contacts={contacts}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={(selected) => handleSelectAll(selected, contacts)}
        />
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">External Contacts</h3>
        <ContactsTable
          contacts={externalContacts}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={(selected) => handleSelectAll(selected, externalContacts)}
        />
      </div>
      {selectedIds.length > 0 && (
        <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded">
          <span className="text-sm">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Set selected to public
            </Button>
            <Button variant="outline" size="sm">
              <EyeOff className="h-4 w-4 mr-2" />
              Set selected to private
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add selected as contacts
            </Button>
          </div>
        </div>
      )}
      <AddExistingEmployeeModal
        open={addEmployeeModalOpen}
        onOpenChange={setAddEmployeeModalOpen}
        onConfirm={(data) => {
          // TODO: Implement add existing employee
          console.log('Add existing employee', data);
        }}
      />
      <AddExternalContactModal
        open={addExternalModalOpen}
        onOpenChange={setAddExternalModalOpen}
        onConfirm={(data) => {
          // TODO: Implement add external contact
          console.log('Add external contact', data);
        }}
      />
    </PageShell>
  );
};

