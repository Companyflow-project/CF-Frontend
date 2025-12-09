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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someSelected;
                }
              }}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telephone</TableHead>
          <TableHead>Employment</TableHead>
          <TableHead>Recent visits</TableHead>
          <TableHead>Messages</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8}>
              <EmptyState />
            </TableCell>
          </TableRow>
        ) : (
          employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(employee.id)}
                  onChange={() => onSelect(employee.id)}
                />
              </TableCell>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.telephone || '-'}</TableCell>
              <TableCell>
                {employee.employmentTitle || employee.employmentType || '-'}
              </TableCell>
              <TableCell>
                {employee.recentVisitAt
                  ? new Date(employee.recentVisitAt).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>{employee.messagesCount || 0}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

