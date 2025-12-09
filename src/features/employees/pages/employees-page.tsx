import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { SidebarCard } from '@/components/common/sidebar-card';
import { EmployeesTable } from '../components/employees-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useEmployees } from '../hooks';
import { employeesRoutes } from '../routes';
import { Employee } from '@/types/models';
import { Send, Eye, EyeOff, Power, Trash2 } from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data: employees } = useEmployees({ search });

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedIds(selected ? employees.map((emp: Employee) => emp.id) : []);
  };

  return (
    <PageShell
      sidebar={
        <>
          <SidebarCard title="License usage">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Used</span>
                <span>0 / 10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </SidebarCard>
          <SidebarCard title="Shortcuts">
            <div className="space-y-1 text-sm">
              <button className="text-left hover:underline">Add employee</button>
              <button className="text-left hover:underline">Import CSV</button>
              <button className="text-left hover:underline">Export data</button>
            </div>
          </SidebarCard>
        </>
      }
    >
      <PageHeader
        title="Manage Employees"
        actions={
          <>
            <Button onClick={() => navigate(employeesRoutes.add)}>Add employee</Button>
            <Button variant="outline">More licenses</Button>
            <Button variant="outline">View as an employee</Button>
          </>
        }
      />
      <HelpBanner />
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search employees..."
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
            <option>Recent visit</option>
          </Select>
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Set all to private/public
          </Button>
        </div>
      </div>
      <EmployeesTable
        employees={employees}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
      />
      {selectedIds.length > 0 && (
        <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded">
          <span className="text-sm">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send message
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Set selected public
            </Button>
            <Button variant="outline" size="sm">
              <EyeOff className="h-4 w-4 mr-2" />
              Set selected private
            </Button>
            <Button variant="outline" size="sm">
              <Power className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

