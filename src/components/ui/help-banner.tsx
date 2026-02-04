import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HelpBannerProps {
    className?: string;
    children?: React.ReactNode;
    onUserManualClick?: () => void;
}

export const HelpBanner: React.FC<HelpBannerProps> = ({
    className,
    children,
    onUserManualClick
}) => {
    return (
        <div className={cn(
            "relative bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden",
            className
        )}>
            {/* Orange Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#f59e0b]" />

            <div className="flex-1 pl-3 text-sm text-[#0d0e0e] leading-relaxed">
                <span className="font-bold mr-1">Help.</span>
                {children}
            </div>

            <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-8 text-xs font-medium text-gray-700 bg-white border-gray-200 hover:bg-gray-50 rounded-md shadow-sm"
                onClick={onUserManualClick}
            >
                User manual
            </Button>
        </div>
    );
};
