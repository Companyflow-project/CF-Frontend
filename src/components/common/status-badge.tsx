import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  className,
}) => {
  // Map status to variant if not provided
  const getVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (variant) return variant;
    
    if (status === 'READY' || status === 'ACTIVE') {
      return 'default';
    }
    if (status === 'NOT_READY' || status === 'INACTIVE') {
      return 'secondary';
    }
    if (status === 'OPTED_OUT') {
      return 'destructive';
    }
    return 'outline';
  };

  const getStatusLabel = (): string => {
    if (status === 'READY') return 'Ready';
    if (status === 'NOT_READY') return 'Not ready';
    if (status === 'OPTED_OUT') return 'Opted out';
    return status;
  };

  const statusClasses: Record<string, string> = {
    READY: 'bg-[#e3f3ec] text-[#1a5948] border-[#b7d9c9]',
    NOT_READY: 'bg-[#fff4e2] text-[#a45c00] border-[#f0cb8b]',
    OPTED_OUT: 'bg-[#ffeceb] text-[#c0382c] border-[#f7b2ac]',
  };

  return (
    <Badge
      variant={getVariant()}
      className={cn(statusClasses[status] ?? '', className)}
    >
      {getStatusLabel()}
    </Badge>
  );
};
