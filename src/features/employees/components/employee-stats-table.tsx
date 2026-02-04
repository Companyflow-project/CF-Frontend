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
import { EmptyState } from '@/components/common/empty-state';
import { BarChart3, MessageSquare } from 'lucide-react';
import { EmployeeSummaryStat } from '@/types/models';

interface EmployeeStatsTableProps {
  stats: EmployeeSummaryStat[];
  onViewStats?: (employeeId: string) => void;
  onSendMessage?: (employeeId: string) => void;
}

export const EmployeeStatsTable: React.FC<EmployeeStatsTableProps> = ({
  stats,
  onViewStats,
  onSendMessage,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Page Views</TableHead>
          <TableHead>Last Visit</TableHead>
          <TableHead>Messages</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stats.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>
              <EmptyState />
            </TableCell>
          </TableRow>
        ) : (
          stats.map((stat) => (
            <TableRow key={stat.employeeId}>
              <TableCell>{stat.name}</TableCell>
              <TableCell>{stat.pageViews}</TableCell>
              <TableCell>
                {stat.lastVisitAt
                  ? new Date(stat.lastVisitAt).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>{stat.messagesCount}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {onViewStats && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewStats(stat.employeeId)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  )}
                  {onSendMessage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSendMessage(stat.employeeId)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

