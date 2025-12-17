import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { EmployeesTable } from '../components/employees-table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useEmployees } from '../hooks';
import { employeesRoutes } from '../routes';
import { Employee } from '@/types/models';
import { Send, Eye, EyeOff, Power, Trash2, ArrowRight } from 'lucide-react';

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
        <div className="space-y-4">
          {/* License usage card */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">License usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Licenses in subscription</span>
                <span className="text-sm font-medium text-[#0d0e0e]">0</span>
              </div>
              <div className="border-t border-dashed border-[#adcfc5]"></div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Licenses used</span>
                <span className="text-sm font-medium text-[#0d0e0e]">0</span>
              </div>
              <div className="border-t border-dashed border-[#adcfc5]"></div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">Licenses left</span>
                <span className="text-sm font-medium text-[#0d0e0e]">0</span>
              </div>
              <div className="border-t border-dashed border-[#adcfc5]"></div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#0d0e0e]">SMS messages used</span>
                <span className="text-sm font-medium text-[#0d0e0e]">0</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1 border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5]">
                More licenses
              </Button>
              <Button variant="outline" className="flex-1 border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5]">
                Manage SMS
              </Button>
            </CardFooter>
          </Card>

          {/* Shortcuts card */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-[#adcfc5] text-left hover:bg-[#f0f7f5] transition-colors">
                <span className="text-sm text-[#0d0e0e]">Company settings</span>
                <ArrowRight className="h-4 w-4 text-[#0d0e0e]" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-[#adcfc5] text-left hover:bg-[#f0f7f5] transition-colors">
                <span className="text-sm text-[#0d0e0e]">Employment types</span>
                <ArrowRight className="h-4 w-4 text-[#0d0e0e]" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-[#adcfc5] text-left hover:bg-[#f0f7f5] transition-colors">
                <span className="text-sm text-[#0d0e0e]">Departments</span>
                <ArrowRight className="h-4 w-4 text-[#0d0e0e]" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg border border-[#adcfc5] text-left hover:bg-[#f0f7f5] transition-colors">
                <span className="text-sm text-[#0d0e0e]">Import CSV</span>
                <ArrowRight className="h-4 w-4 text-[#0d0e0e]" />
              </button>
            </CardContent>
          </Card>
        </div>
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
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-sm"
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Select className="w-full sm:w-auto sm:min-w-[160px]">
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
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded">
          <span className="text-sm">{selectedIds.length} selected</span>
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
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

