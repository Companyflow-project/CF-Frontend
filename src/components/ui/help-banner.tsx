import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { manualTopicFor, openUserManual } from '@/features/user-manual/topics';

interface HelpBannerProps {
    className?: string;
    children?: React.ReactNode;
    onUserManualClick?: () => void;
    /** User manual guide to open; defaults to the guide for the current page. */
    manualTopic?: string;
}

export const HelpBanner: React.FC<HelpBannerProps> = ({
    className,
    children,
    onUserManualClick,
    manualTopic,
}) => {
    const { t } = useTranslation('common');
    const { pathname } = useLocation();
    return (
        <div className={cn(
            "relative bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden",
            className
        )}>
            {/* Orange Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#f59e0b]" />

            <div className="flex-1 pl-3 text-sm text-[#0d0e0e] leading-relaxed">
                <span className="font-bold mr-1">{t('help')}</span>
                {children}
            </div>

            <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-8 text-xs font-medium text-gray-700 bg-white border-gray-200 hover:bg-gray-50 rounded-md shadow-sm"
                onClick={onUserManualClick ?? (() => openUserManual(manualTopic ?? manualTopicFor(pathname)))}
            >
                {t('userManual')}
            </Button>
        </div>
    );
};
