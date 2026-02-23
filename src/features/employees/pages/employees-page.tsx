import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { EmployeesTable } from '../components/employees-table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useEmployees } from '@/lib/api-hooks';
import { transformEmployee, type BackendEmployeeLike } from '@/lib/api-transformers';
import { employeesRoutes } from '../routes';
import { Search, ArrowUpDown, ArrowDownWideNarrow, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { employeesApi } from '../api';
import { toast } from 'sonner';

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    employeeId: string | null;
    employeeName: string;
  }>({
    isOpen: false,
    employeeId: null,
    employeeName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input to avoid excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [search]);

  // Use server-side search when search query exists
  // The hook now handles companyId from auth context automatically
  const { data: apiEmployees, loading, error, refetch } = useEmployees(
    {
      search: debouncedSearch.trim() || undefined,
      limit: debouncedSearch.trim() ? 10000 : 100,
    }
  );

  // Transform API employees to model employees (API shape may be id/email or uid/mail)
  const employees = useMemo(() => {
    if (!apiEmployees) return [];
    return (apiEmployees as unknown as BackendEmployeeLike[]).map(transformEmployee);
  }, [apiEmployees]);

  // Client-side filtering (only for inactive/public filters, NOT search)
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Search is now handled server-side, so we don't filter by search here

    if (!showInactive) {
      filtered = filtered.filter((emp) => emp.status !== 'INACTIVE');
    }

    if (publicOnly) {
      filtered = filtered.filter((emp) => emp.isPublic);
    }

    return filtered;
  }, [employees, showInactive, publicOnly]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, showInactive, publicOnly]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedIds(selected ? paginatedEmployees.map((emp) => emp.id) : []);
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteDialog({
      isOpen: true,
      employeeId: id,
      employeeName: name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.employeeId) return;

    setIsDeleting(true);
    try {
      await employeesApi.deleteEmployee(deleteDialog.employeeId);
      setDeleteDialog({ isOpen: false, employeeId: null, employeeName: '' });
      // Refresh the list
      refetch();
    } catch (err) {
      console.error('Failed to delete employee:', err);
      toast.error('Failed to delete employee');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSelection = selectedIds.length > 0;

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="Manage Employees" />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading employees...</div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader title="Manage Employees" />
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error: {error.message}</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Manage Employees"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => navigate(employeesRoutes.add)}
              className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] shadow-[0_10px_20px_rgba(23,102,79,0.35)]"
            >
              Add employee
            </Button>
            <Button
              variant="outline"
              className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] bg-white"
            >
              More licenses
            </Button>
            <Button
              variant="outline"
              className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] bg-white"
            >
              View as an employee
            </Button>
          </div>
        }
      />
      {/* help banner */}
      <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-[#0d0e0e] max-w-3xl">
            <p className="text-sm mb-1">
              <span className="font-bold">Help.</span>{' '}
              Create, edit, and remove employees. Send a message with a handbook link, and re-send
              when needed. Choose which profiles are{' '}
              <span className="font-bold">Public</span> (visible in the info list) per employee or
              use the bulk visibility buttons.
            </p>
            <p className="text-sm">
              Use work emails/phones where possible so notifications arrive reliably.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[11px] py-[9px] h-auto whitespace-nowrap self-start sm:self-auto"
          >
            User Manual
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 overflow-hidden">
        <div className="flex flex-col overflow-hidden">
          {/* employee tools + table card */}
          <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] flex-1 flex flex-col overflow-hidden">
            <div className="bg-[#f2f7f5] border border-[#d6e8e1] rounded-[16px] px-4 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a85]" />
                <Input
                  placeholder="Search employees (name, email, phone)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 rounded-[999px] border border-[#c8d8d3] bg-white text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-[999px] border transition-colors ${showInactive
                    ? 'border-[#2c7860] bg-white text-[#0f172a]'
                    : 'border-transparent bg-[#e9f3ef] text-[#7b8a85]'
                    }`}
                  onClick={() => setShowInactive((v) => !v)}
                >
                  <Checkbox
                    checked={showInactive}
                    onChange={(event) => {
                      event.stopPropagation();
                      setShowInactive(event.target.checked);
                    }}
                    className="h-3 w-3 rounded-[2.5px] border-[#3d997d]"
                  />
                  <span className="text-xs font-medium">Show inactive</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-[999px] border transition-colors ${publicOnly
                    ? 'border-[#2c7860] bg-white text-[#0f172a]'
                    : 'border-transparent bg-[#e9f3ef] text-[#7b8a85]'
                    }`}
                  onClick={() => setPublicOnly((v) => !v)}
                >
                  <Checkbox
                    checked={publicOnly}
                    onChange={(event) => {
                      event.stopPropagation();
                      setPublicOnly(event.target.checked);
                    }}
                    className="h-3 w-3 rounded-[2.5px] border-[#3d997d]"
                  />
                  <span className="text-xs font-medium">Public only</span>
                </button>
              </div>
            </div>

            <CardContent className="pt-6 flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 justify-between pb-4 border-b border-dashed border-[#d5e7e1]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#0d0e0e]">Sort</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[rgba(15,23,42,0.18)] text-[#242727] rounded-[10px] px-4 py-[9px] h-auto bg-white shadow-[0_6px_14px_rgba(15,23,42,0.05)]"
                  >
                    Name
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-[#707677] rounded-full bg-white shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
                    aria-label="Toggle sort direction"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-[#1a5948] rounded-full bg-white shadow-[0_6px_14px_rgba(28,91,72,0.25)]"
                    aria-label="Advanced sort"
                  >
                    <ArrowDownWideNarrow className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[rgba(88,172,146,0.5)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[12px] bg-white"
                  >
                    Set all to private
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[rgba(88,172,146,0.5)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[12px] bg-white"
                  >
                    Set all to public
                  </Button>
                </div>
              </div>


              {!loading && !error && employees.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="text-sm text-[#6b7475]">
                    No employees yet. Try refetching or add your first employee.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="border-[#c8d8d3] text-[#0d0e0e] rounded-[10px]"
                  >
                    Refetch
                  </Button>
                </div>
              )}
              <div className="min-h-0 overflow-auto max-h-[calc(100vh-320px)]">
                <EmployeesTable
                  employees={paginatedEmployees}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                  onDelete={handleDeleteRequest}
                  onEdit={(id) => navigate(employeesRoutes.edit(id))}
                  onStatistics={(id) => navigate(employeesRoutes.statisticsDetail(id))}
                  onMessageLogs={(id) => navigate(employeesRoutes.messageLogsDetail(id))}
                  emptyStateTitle="No employees"
                  emptyStateDescription="Try refetching or add your first employee."
                />
              </div>
              {filteredEmployees.length > itemsPerPage && (
                <div className="flex items-center justify-between pt-6 mt-4 border-t border-[#d5e7e1] px-2">
                  <div className="text-sm text-[#6b7475]">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-[#c8d8d3] text-[#0d0e0e] rounded-[10px] px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-sm text-[#0d0e0e] font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="border-[#c8d8d3] text-[#0d0e0e] rounded-[10px] px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* bulk actions bar */}
          <div className="bg-white border border-[#e5efea] rounded-[16px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div
              className="flex items-center gap-3 cursor-pointer h-10"
              onClick={() => {
                if (hasSelection) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(filteredEmployees.map((emp) => emp.id));
                }
              }}
            >
              <div
                className={`h-4 w-4 rounded-[4px] border ${hasSelection ? 'bg-[#1a5948] border-[#1a5948]' : 'bg-transparent border-[#cfd6d4]'
                  }`}
              />
              <span
                className={`text-sm whitespace-nowrap ${hasSelection ? 'text-[#484b4b]' : 'text-[#9fa4a4]'
                  }`}
              >
                {selectedIds.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection}
                className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13.3px] px-5 h-10 bg-white"
              >
                Send message
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection}
                className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13.3px] px-5 h-10 bg-white"
              >
                Set selected public
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection}
                className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13.3px] px-5 h-10 bg-white"
              >
                Set selected private
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection}
                className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13.3px] px-5 h-10 bg-white"
              >
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection}
                className="border-[rgba(88,172,146,0.5)] rounded-[999px] text-[13.3px] px-5 h-10 bg-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* license usage card */}
          <Card className="bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_12px_30px_rgba(15,23,42,0.08)] rounded-[12px]">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[#0f172a]">License usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex justify-between items-center py-2 border-b border-dashed border-[rgba(88,172,146,0.5)]">
                <span className="text-sm text-[#0f172a]">Licenses in subscription</span>
                <span className="text-sm font-bold text-[#0f172a]">5</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-[rgba(88,172,146,0.5)]">
                <span className="text-sm text-[#0f172a]">Licenses used</span>
                <span className="text-sm font-bold text-[#0f172a]">4</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-[rgba(88,172,146,0.5)]">
                <span className="text-sm text-[#0f172a]">Licenses left</span>
                <span className="text-sm font-bold text-[#0f172a]">1</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#0f172a]">SMS messages used</span>
                <span className="text-sm font-bold text-[#0f172a]">0</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-2 justify-end">
              <Button
                variant="outline"
                className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] rounded-[10px]"
              >
                More licenses
              </Button>
              <Button
                variant="outline"
                className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] rounded-[10px]"
              >
                Manage SMS
              </Button>
            </CardFooter>
          </Card>

          {/* shortcuts card */}
          <Card className="bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_12px_30px_rgba(15,23,42,0.08)] rounded-[12px]">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[#0f172a]">Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Company settings',
                'Employment types',
                'Departments',
                'Import CSV',
              ].map((label) => (
                <button
                  key={label}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[10px] border border-[rgba(88,172,146,0.5)] text-left hover:bg-[#f0f7f5] transition-colors"
                >
                  <span className="text-sm text-[#0d0e0e]">{label}</span>
                  <span className="text-base leading-[1] text-[#1d1f1f]">⇢</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteDialog((prev) => ({ ...prev, isOpen }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-amber-600">Delete Employee</DialogTitle>
            </div>
            <DialogDescription className="py-4">
              Are you sure you want to delete <strong>{deleteDialog.employeeName}</strong>? This action cannot be undone.
              The employee will be moved to the trash and their access will be revoked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, employeeId: null, employeeName: '' })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};
