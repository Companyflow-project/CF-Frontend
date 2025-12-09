import React, { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { SidebarCard } from '@/components/common/sidebar-card';
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
        <>
          <SidebarCard title="Visibility">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Public profiles</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span>Inactive</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span>Employee</span>
                <span>{employeeContacts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>External</span>
                <span>{externalContacts.length}</span>
              </div>
            </div>
          </SidebarCard>
          <SidebarCard title="Help Guides">
            <div className="space-y-1 text-sm">
              <button className="text-left hover:underline">How to add contacts</button>
              <button className="text-left hover:underline">Import contacts</button>
              <button className="text-left hover:underline">Export contacts</button>
              <button className="text-left hover:underline">Contact permissions</button>
            </div>
          </SidebarCard>
        </>
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

