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
  onDelete?: (id: string, name: string) => void;
  onEdit?: (id: string) => void;
  onStatistics?: (id: string) => void;
  onMessageLogs?: (id: string) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  /** Email of the currently logged-in user — used to lock self-row actions */
  currentUserEmail?: string;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  employees,
  selectedIds,
  onSelect,
  onSelectAll,
  onDelete,
  onEdit,
  onStatistics,
  onMessageLogs,
  emptyStateTitle = 'No data yet.',
  emptyStateDescription,
  currentUserEmail,
}) => {
  // For the header checkbox: exclude self-row from the count so it can never be "all selected"
  const selectableEmployees = employees.filter(
    (e) => !currentUserEmail || e.email.toLowerCase() !== currentUserEmail.toLowerCase()
  );
  const allSelected = selectableEmployees.length > 0 && selectableEmployees.every((e) => selectedIds.includes(e.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

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
                  if (el) el.indeterminate = someSelected;
                }}
                className="rounded-[4px] border-[#3d997d] h-4 w-4"
              />
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[16%]">
              <div className="flex items-center gap-1 truncate">
                Name
                <span className="text-[#f77c19] text-xs shrink-0">↑</span>
              </div>
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[20%]">
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
            <TableHead className="text-[#1a5948] font-semibold tracking-wide text-center w-[8%] align-middle">
              Messages
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide text-center w-[12%] align-middle">
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
              const isSelf = !!(currentUserEmail && employee.email.toLowerCase() === currentUserEmail.toLowerCase());

              return (
                <TableRow
                  key={employee.id}
                  className={`border-b border-[#ebf3ef] hover:bg-[#f6fbf9] ${isSelf ? 'bg-[#fafcfb]' : ''}`}
                >
                  <TableCell className="w-[4%]">
                    <Checkbox
                      checked={!isSelf && selectedIds.includes(employee.id)}
                      onChange={() => !isSelf && onSelect(employee.id)}
                      disabled={isSelf}
                      className={`rounded-[4px] h-4 w-4 ${isSelf ? 'border-[#c8d4d0] opacity-40 cursor-not-allowed' : 'border-[#3d997d]'}`}
                    />
                  </TableCell>
                  <TableCell className="w-[16%]">
                    <div className="truncate" title={employee.name}>
                      <p className="font-semibold text-[#111827] truncate">{employee.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.04em] text-[#7b8a85] truncate">
                        {employee.isPublic ? 'Public profile' : 'Private profile'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#111b18] w-[20%] break-words" title={employee.email}>
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
                  <TableCell className="w-[8%] align-middle p-0">
                    <div className="flex items-center justify-center w-full h-full text-[#111b18]">
                      {employee.messagesCount ?? 0}
                    </div>
                  </TableCell>
                  {/* Actions */}
                  <TableCell className="w-[12%] align-middle">
                    <div className="flex items-center justify-center gap-1">
                      {/* Edit — only visible when handler is provided (admin) */}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md bg-[#e7f5ef] text-[#2c7860] hover:bg-[#d0ebe0]"
                          aria-label="Edit"
                          onClick={() => onEdit(employee.id)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {/* Message — always visible */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md bg-[#e8f0fe] text-[#2060d7] hover:bg-[#d4e4fc]"
                        aria-label="Message"
                        onClick={() => onMessageLogs?.(employee.id)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                      {/* Statistics — hidden for self */}
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md bg-[#fff1e8] text-[#ee7623] hover:bg-[#ffe4d1]"
                          aria-label="Statistics"
                          onClick={() => onStatistics?.(employee.id)}
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {/* Delete — hidden for self and non-admin */}
                      {!isSelf && onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md bg-[#ffecef] text-[#d5384b] hover:bg-[#ffd9df]"
                          aria-label="Delete"
                          onClick={() => onDelete(employee.id, employee.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
