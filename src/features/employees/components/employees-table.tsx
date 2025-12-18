import React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { Edit, MessageSquare, BarChart3, Trash2 } from 'lucide-react';
import { Employee } from '@/types/models';

interface EmployeesTableProps {
  employees: Employee[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  employees,
  selectedIds,
  onSelect,
  onSelectAll,
}) => {
  const allSelected = employees.length > 0 && selectedIds.length === employees.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < employees.length;

  return (
    <Table className="min-w-[900px] text-[13px]">
      <TableHeader className="bg-[#f5fbf8]">
        <TableRow className="border-b border-[#dbe8e1]">
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someSelected;
                }
              }}
              className="rounded-[4px] border-[#3d997d] h-4 w-4"
            />
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide">
            <div className="flex items-center gap-1">
              Name
              <span className="text-[#f77c19] text-xs">↑</span>
            </div>
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide">Email</TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[220px]">
            Telephone
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide">Employment</TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[200px] whitespace-nowrap">
            Recent visits
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide">Messages</TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide text-center">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr]:last:border-b">
        {employees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8}>
              <EmptyState />
            </TableCell>
          </TableRow>
        ) : (
          employees.map((employee) => {
            const phone =
              employee.telephone || employee.mobileNumber || employee.alternateNumber;

            return (
              <TableRow
                key={employee.id}
                className="border-b border-[#ebf3ef] hover:bg-[#f6fbf9]"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(employee.id)}
                    onChange={() => onSelect(employee.id)}
                    className="rounded-[4px] border-[#3d997d] h-4 w-4"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-[#111827]">{employee.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.04em] text-[#7b8a85]">
                      {employee.isPublic ? 'Public profile' : 'Private profile'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-[#111b18]">{employee.email}</TableCell>
                <TableCell
                  className={
                    phone
                      ? 'text-[#111b18] w-[220px] whitespace-nowrap'
                      : 'text-[#9fa4a4] text-xs w-[220px]'
                  }
                >
                  {phone || 'Not available'}
                </TableCell>
                <TableCell className="text-[#111b18]">
                  {employee.employmentTitle || employee.employmentType || '-'}
                </TableCell>
                <TableCell className="text-[#111b18] w-[200px] whitespace-nowrap">
                  {employee.recentVisitAt || 'Never'}
                </TableCell>
                <TableCell className="text-[#111b18]">
                  {employee.messagesCount ?? 0}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-[#e7f5ef] text-[#2c7860]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-[#e8f0fe] text-[#2060d7]"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-[#fff1e8] text-[#ee7623]"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full bg-[#ffecef] text-[#d5384b]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
