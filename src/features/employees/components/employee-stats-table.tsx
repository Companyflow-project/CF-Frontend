import React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/common/empty-state';
import { Eye, MessageCircle } from 'lucide-react';
import { EmployeeSummaryStat } from '@/types/models';
import { useTranslation } from 'react-i18next';

interface EmployeeStatsTableProps {
  stats: EmployeeSummaryStat[];
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  onViewStats?: (employeeId: string) => void;
  onSendMessage?: (employeeId: string) => void;
  /** Current user ID — used to hide messaging actions on own row */
  currentUserId?: string;
}

export const EmployeeStatsTable: React.FC<EmployeeStatsTableProps> = ({
  stats,
  selectedIds = [],
  onSelect,
  onSelectAll,
  onViewStats,
  onSendMessage,
  currentUserId,
}) => {
  const { t } = useTranslation('employees');
  const allSelected = stats.length > 0 && selectedIds.length === stats.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < stats.length;

  return (
    <div className="w-full">
      <Table className="w-full table-fixed text-[13px]">
        <TableHeader className="bg-[#f5fbf8]">
          <TableRow className="border-b border-[#dbe8e1]">
            <TableHead className="w-[60px] pl-6 h-12">
              <Checkbox
                checked={allSelected}
                onChange={(e) => onSelectAll?.(e.target.checked)}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = someSelected;
                  }
                }}
                className="rounded-[4px] border-[#3d997d] h-4 w-4"
              />
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide h-12">{t('statsTable.colName')}</TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide h-12">{t('statsTable.colPageViews')}</TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide h-12">{t('statsTable.colLastVisit')}</TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide h-12">{t('statsTable.colMessages')}</TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide h-12 text-center">{t('statsTable.colActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:last:border-b">
          {stats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12">
                <EmptyState />
              </TableCell>
            </TableRow>
          ) : (
            stats.map((stat) => {
              const isSelf = !!(currentUserId && stat.employeeId === currentUserId);
              return (
                <TableRow key={stat.employeeId} className={`border-b border-[#ebf3ef] hover:bg-[#f6fbf9] ${isSelf ? 'bg-[#fafcfb]' : ''}`}>
                  <TableCell className="pl-6 py-4">
                    <Checkbox
                      checked={!isSelf && selectedIds.includes(stat.employeeId)}
                      onChange={() => !isSelf && onSelect?.(stat.employeeId)}
                      disabled={isSelf}
                      className={`rounded-[4px] h-4 w-4 ${isSelf ? 'border-[#c8d4d0] opacity-40 cursor-not-allowed' : 'border-[#3d997d]'}`}
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-[#111827] py-4">{stat.name}</TableCell>
                  <TableCell className="text-[#111827] py-4">{stat.pageViews}</TableCell>
                  <TableCell className="text-[#111827] py-4">
                    {stat.lastVisitAt || '-'}
                  </TableCell>
                  <TableCell className="text-[#111827] py-4 text-center pr-12">{stat.messagesCount}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      {onViewStats && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewStats(stat.employeeId)}
                          className="h-7 w-7 rounded-md bg-[#e7f5ef] text-[#2c7860] hover:bg-[#d0ebe0]"
                          aria-label={t('statsTable.viewDetails')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onSendMessage && !isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onSendMessage(stat.employeeId)}
                          className="h-7 w-7 rounded-md bg-[#e8f0fe] text-[#2060d7] hover:bg-[#d4e4fc]"
                          aria-label={t('statsTable.message')}
                        >
                          <MessageCircle className="h-3.5 w-3.5 fill-current" />
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

