import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { HandbookPage } from '@/types/models';

interface HandbookPagesTableProps {
  pages: HandbookPage[];
  onEdit?: (pageId: string) => void;
  onPreview?: (pageId: string) => void;
}

export const HandbookPagesTable: React.FC<HandbookPagesTableProps> = ({
  pages,
  onEdit,
  onPreview,
}) => {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  const handleSelect = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="min-w-[200px]">Title</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedPages.has(page.id)}
                        onChange={() => handleSelect(page.id)}
                        className="h-4 w-4 rounded border-2 border-[#1a5948] text-[#1a5948] focus:ring-[#1a5948]"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-[#0d0e0e] break-words">{page.title}</span>
                      <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs whitespace-nowrap">
                        Premade
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={page.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(page.id)}
                          className="border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5] whitespace-nowrap"
                        >
                          Edit
                        </Button>
                      )}
                      {onPreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPreview(page.id)}
                          className="border-[#adcfc5] text-[#0d0e0e] hover:bg-[#f0f7f5] whitespace-nowrap"
                        >
                          Sneak peek
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

