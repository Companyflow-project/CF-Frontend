import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('employees');

  return (
    <div className="w-full">
      <Table className="w-full table-fixed text-[13px]">
        <TableHeader className="bg-[#f5fbf8]">
          <TableRow className="border-b border-[#dbe8e1]">
            <TableHead className="text-[#1a5948] font-semibold tracking-wide h-12 w-[180px] pl-6">{t('messageLogs.colDate')}</TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide h-12 w-[180px]">{t('messageLogs.colName')}</TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide h-12 w-[220px]">{t('messageLogs.colEmail')}</TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide h-12">{t('messageLogs.colMessage')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:last:border-b">
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12">
                <EmptyState />
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id} className="border-b border-[#ebf3ef] hover:bg-[#f6fbf9]">
                <TableCell className="py-5 pl-6 text-[#111827] font-medium align-top">
                  {log.date}
                </TableCell>
                <TableCell className="py-5 text-[#111827] font-medium align-top">
                  {log.name}
                </TableCell>
                <TableCell className="py-5 text-[#374151] align-top">
                  {log.email}
                </TableCell>
                <TableCell className="py-5 text-[#374151] leading-relaxed align-top pr-6">
                  <div className="whitespace-pre-wrap break-words italic text-gray-600">
                    {log.message}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

