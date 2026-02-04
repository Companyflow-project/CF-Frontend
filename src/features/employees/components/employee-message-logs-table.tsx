import React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/empty-state';
import { EmployeeMessageLog } from '@/types/models';

interface EmployeeMessageLogsTableProps {
  logs: EmployeeMessageLog[];
}

export const EmployeeMessageLogsTable: React.FC<EmployeeMessageLogsTableProps> = ({
  logs,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4}>
              <EmptyState />
            </TableCell>
          </TableRow>
        ) : (
          logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {new Date(log.sentAt).toLocaleDateString()}
              </TableCell>
              <TableCell>{log.employeeName}</TableCell>
              <TableCell>{log.employeeEmail}</TableCell>
              <TableCell>{log.messagePreview}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

