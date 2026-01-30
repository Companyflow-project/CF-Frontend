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
  onDelete: (id: string, name: string) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  employees,
  selectedIds,
  onSelect,
  onSelectAll,
  onDelete,
  emptyStateTitle = 'No data yet.',
  emptyStateDescription,
}) => {
  const allSelected = employees.length > 0 && selectedIds.length === employees.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < employees.length;

  return (
    <Table className="w-full table-fixed text-[13px]">
      <TableHeader className="bg-[#f5fbf8]">
        <TableRow className="border-b border-[#dbe8e1]">
          <TableHead className="w-[4%] min-w-0">
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
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[17%] min-w-0">
            <div className="flex items-center gap-1 truncate">
              Name
              <span className="text-[#f77c19] text-xs shrink-0">↑</span>
            </div>
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[19%] min-w-0">
            Email
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[13%] min-w-0">
            Telephone
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[13%] min-w-0">
            Employment
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[9%] min-w-0">
            Recent visits
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[7%] min-w-0">
            Messages
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide text-center w-[18%] min-w-0">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr]:last:border-b">
        {employees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8}>
              <EmptyState title={emptyStateTitle} description={emptyStateDescription} />
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
                <TableCell className="w-[4%]">
                  <Checkbox
                    checked={selectedIds.includes(employee.id)}
                    onChange={() => onSelect(employee.id)}
                    className="rounded-[4px] border-[#3d997d] h-4 w-4"
                  />
                </TableCell>
                <TableCell className="min-w-0 max-w-0 w-[17%]">
                  <div className="truncate" title={employee.name}>
                    <p className="font-semibold text-[#111827] truncate">{employee.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.04em] text-[#7b8a85] truncate">
                      {employee.isPublic ? 'Public profile' : 'Private profile'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-[#111b18] min-w-0 max-w-0 w-[19%] truncate" title={employee.email}>
                  {employee.email}
                </TableCell>
                <TableCell
                  className={`min-w-0 max-w-0 w-[13%] truncate ${phone ? 'text-[#111b18]' : 'text-[#9fa4a4] text-xs'}`}
                  title={phone || 'Not available'}
                >
                  {phone || 'Not available'}
                </TableCell>
                <TableCell className="text-[#111b18] min-w-0 max-w-0 w-[13%] truncate" title={employee.employmentTitle || employee.employmentType || '-'}>
                  {employee.employmentTitle || employee.employmentType || '-'}
                </TableCell>
                <TableCell className="text-[#111b18] min-w-0 max-w-0 w-[9%] truncate" title={employee.recentVisitAt || 'Never'}>
                  {employee.recentVisitAt || 'Never'}
                </TableCell>
                <TableCell className="text-[#111b18] min-w-0 max-w-0 w-[7%]">
                  {employee.messagesCount ?? 0}
                </TableCell>
                <TableCell className="text-right min-w-0 w-[18%]">
                  <div className="inline-flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-[#e7f5ef] text-[#2c7860] shrink-0"
                      aria-label="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-[#e8f0fe] text-[#2060d7] shrink-0"
                      aria-label="Message"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-[#fff1e8] text-[#ee7623] shrink-0"
                      aria-label="Statistics"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-[#ffecef] text-[#d5384b] shrink-0"
                      aria-label="Delete"
                      onClick={() => onDelete(employee.id, employee.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
