import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';

export type SortDirection = 'asc' | 'desc';

type SortableTableHeadProps<TColumn extends string> = {
  column: TColumn;
  activeColumn: TColumn;
  direction: SortDirection;
  onSort: (column: TColumn) => void;
  className?: string;
  children: React.ReactNode;
};

export function SortableTableHead<TColumn extends string>({
  column,
  activeColumn,
  direction,
  onSort,
  className,
  children,
}: SortableTableHeadProps<TColumn>) {
  const isActive = activeColumn === column;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 hover:text-gray-800 transition-colors"
      >
        <span>{children}</span>
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}

export function toggleSort<TColumn extends string>(
  currentColumn: TColumn,
  currentDirection: SortDirection,
  nextColumn: TColumn,
): { column: TColumn; direction: SortDirection } {
  if (currentColumn !== nextColumn) {
    return { column: nextColumn, direction: 'asc' };
  }

  return {
    column: nextColumn,
    direction: currentDirection === 'asc' ? 'desc' : 'asc',
  };
}
