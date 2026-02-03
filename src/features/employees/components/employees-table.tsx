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
import { formatRelativeTime } from '@/lib/utils';

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
    <div className="w-full">
      <Table className="w-full table-fixed text-[13px]">
        <TableHeader className="bg-[#f5fbf8]">
          <TableRow className="border-b border-[#dbe8e1]">
            <TableHead className="w-[4%]">
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
            <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[15%]">
              <div className="flex items-center gap-1 truncate">
                Name
                <span className="text-[#f77c19] text-xs shrink-0">↑</span>
              </div>
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[19%]">
              Email
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[13%]">
              Telephone
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[15%]">
              Employment
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[12%]">
              Recent visits
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide text-center w-[6%] align-middle">
              Messages
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide text-center w-[16%] align-middle">
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
                  <TableCell className="w-[15%]">
                    <div className="truncate" title={employee.name}>
                      <p className="font-semibold text-[#111827] truncate">{employee.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.04em] text-[#7b8a85] truncate">
                        {employee.isPublic ? 'Public profile' : 'Private profile'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#111b18] w-[19%] break-words" title={employee.email}>
                    <div className="line-clamp-2">{employee.email}</div>
                  </TableCell>
                  <TableCell
                    className={`w-[13%] break-words ${phone ? 'text-[#111b18]' : 'text-[#9fa4a4] text-xs'}`}
                    title={phone || 'Not available'}
                  >
                    <div className="line-clamp-2">{phone || 'Not available'}</div>
                  </TableCell>
                  <TableCell className="text-[#111b18] w-[15%] break-words" title={employee.employmentTitle || employee.employmentType || '-'}>
                    <div className="line-clamp-2">{employee.employmentTitle || employee.employmentType || '-'}</div>
                  </TableCell>
                  <TableCell className="text-[#111b18] w-[12%] truncate" title={employee.recentVisitAt || 'Never'}>
                    {formatRelativeTime(employee.recentVisitAt)}
                  </TableCell>
                  <TableCell className="w-[6%] align-middle p-0">
                    <div className="flex items-center justify-center w-full h-full text-[#111b18]">
                      {employee.messagesCount ?? 0}
                    </div>
                  </TableCell>
                  <TableCell className="w-[16%] align-middle">
                    <div className="flex flex-col gap-1 items-center justify-center mx-auto">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md bg-[#e7f5ef] text-[#2c7860] hover:bg-[#d0ebe0]"
                          aria-label="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md bg-[#e8f0fe] text-[#2060d7] hover:bg-[#d4e4fc]"
                          aria-label="Message"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md bg-[#fff1e8] text-[#ee7623] hover:bg-[#ffe4d1]"
                          aria-label="Statistics"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md bg-[#ffecef] text-[#d5384b] hover:bg-[#ffd9df]"
                          aria-label="Delete"
                          onClick={() => onDelete(employee.id, employee.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
