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
import { StatusBadge } from '@/components/common/status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { Edit, Eye } from 'lucide-react';
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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Actions</TableHead>
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
              <TableCell>{page.title}</TableCell>
              <TableCell>
                <StatusBadge status={page.status} />
              </TableCell>
              <TableCell>
                {new Date(page.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(page.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onPreview && (
                    <Button variant="ghost" size="icon" onClick={() => onPreview(page.id)}>
                      <Eye className="h-4 w-4" />
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

