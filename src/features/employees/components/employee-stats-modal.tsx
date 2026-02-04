import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { EmployeePageViewStat } from '@/types/models';

interface EmployeeStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: EmployeePageViewStat[];
  employeeName?: string;
  onSendFollowUp?: () => void;
}

export const EmployeeStatsModal: React.FC<EmployeeStatsModalProps> = ({
  open,
  onOpenChange,
  stats,
  employeeName,
  onSendFollowUp,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {employeeName ? `Statistics - ${employeeName}` : 'Page View Statistics'}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pages</TableHead>
                <TableHead>Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((stat) => (
                  <TableRow key={stat.pageId}>
                    <TableCell>{stat.pageTitle}</TableCell>
                    <TableCell>{stat.views}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          {onSendFollowUp && (
            <Button onClick={onSendFollowUp}>Send Follow Up</Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

