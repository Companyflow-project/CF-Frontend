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

  return (
    <Badge variant={getVariant()} className={cn(className)}>
      {getStatusLabel()}
    </Badge>
  );
};

