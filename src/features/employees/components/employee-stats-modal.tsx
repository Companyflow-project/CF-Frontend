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
      <DialogContent className="max-w-4xl w-[90vw]">
        <DialogHeader className="pb-4 border-b border-[#ebf3ef]">
          <DialogTitle className="text-xl font-bold text-[#0f172a]">
            {employeeName ? `Statistics - ${employeeName}` : 'Page View Statistics'}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto my-4 rounded-[12px] border border-[#d6e8e1]">
          <Table>
            <TableHeader className="bg-[#f5fbf8]">
              <TableRow className="border-b border-[#d6e8e1]">
                <TableHead className="text-[#1a5948] font-semibold py-3 pl-4">Pages</TableHead>
                <TableHead className="text-[#1a5948] font-semibold py-3 pr-4 text-right">Visits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-12">
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((stat, idx) => (
                  <TableRow key={idx} className="border-b border-[#ebf3ef] last:border-0 hover:bg-[#f6fbf9]">
                    <TableCell className="py-4 pl-4">
                      <div className="font-semibold text-[#111827]">{stat.title}</div>
                      <div className="text-xs text-[#7b8a85] mt-0.5">{stat.url}</div>
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-right align-top">
                      <div className="font-bold text-[#1a5948]">{stat.views}</div>
                      <div className="text-[10px] text-[#7b8a85] mt-1">{stat.lastViewed}</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="flex gap-2 border-t border-[#ebf3ef] pt-4">
          <Button variant="outline" className="rounded-[999px] px-6 border-[rgba(15,23,42,0.1)] text-[#0d0e0e]" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onSendFollowUp && (
            <Button className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px] px-6 shadow-[0_10px_20px_rgba(23,102,79,0.35)]" onClick={onSendFollowUp}>
              Send Follow Up
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

