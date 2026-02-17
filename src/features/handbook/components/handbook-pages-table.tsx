import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { HandbookPageSummary } from '@/types/models';

interface HandbookPagesTableProps {
  pages: HandbookPageSummary[];
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

  if (pages.length === 0) {
    return (
      <div className="border border-[#d6e8e1] rounded-[16px] bg-white p-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pages.map((page) => (
        <div
          key={page.id}
          className="flex flex-col gap-3 rounded-[18px] border border-[#d6e8e1] bg-[#f4fbf8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selectedPages.has(page.id)}
              onChange={() => handleSelect(page.id)}
              className="h-4 w-4 rounded border-2 border-[#1a5948] text-[#1a5948] focus:ring-[#1a5948] mt-1"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-semibold text-[#0d0e0e]">{page.title}</span>
                <Badge className="bg-[#e3f3ec] text-[#1a5948] border border-[#c2e2d4] text-[11px] uppercase tracking-wide">
                  Premade
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#6b7475]">
                <span className="h-2 w-2 rounded-full bg-[#1a5948]" />
                Visible to all employees
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              status={page.status}
              className="rounded-[999px] px-4 py-1 text-xs font-semibold"
            />
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(page.id)}
                className="border-[#cce3da] text-[#0d0e0e] rounded-[999px] px-4"
              >
                Edit
              </Button>
            )}
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview(page.id)}
                className="border-[#cce3da] text-[#0d0e0e] rounded-[999px] px-4"
              >
                Sneak peek
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
