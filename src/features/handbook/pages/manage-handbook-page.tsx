import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowRight,
    Lock,
    BookOpen,
    Send,
    Printer,
    MoreHorizontal,
    Loader2,
} from 'lucide-react';
import { handbookRoutes } from '../routes';
import { employeesRoutes } from '@/features/employees/routes';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { isAdminRole } from '@/lib/utils';
import { PreviewHandbookModal } from '../components/preview-handbook-modal';
import { useHandbookTree } from '../hooks';

export const ManageHandbookPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, i18n } = useTranslation('handbook');
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const { bid, isPublished, provisioning } = useHandbookTree();
    const lang = i18n.language as 'da' | 'en';

    const canEditHandbook = isAdminRole(user?.role);

    const ActionCard: React.FC<{
        title: string;
        description: string;
        icon: React.ReactNode;
        iconBg: string;
        actions: Array<{
            label: string;
            onClick: () => void;
            variant?: 'default' | 'outline';
            adminOnly?: boolean;
        }>;
    }> = ({ title, description, icon, iconBg, actions }) => (
        <Card className="border border-[#e5efea] rounded-[18px] shadow-[0_4px_12px_rgba(15,23,42,0.06)]" style={{ backgroundColor: 'var(--cf-card-bg, #ffffff)' }}>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                        {icon}
                    </div>
                    <CardTitle className="text-lg font-bold" style={{ color: 'var(--cf-card-heading, #0d0e0e)' }}>{title}</CardTitle>
                </div>
                <CardDescription className="text-sm mt-1" style={{ color: 'var(--cf-card-text, #6b7280)' }}>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {actions.map((action, index) => {
                    const isLocked = action.adminOnly && !canEditHandbook;
                    return (
                        <div
                            key={index}
                            title={isLocked ? t('manage.adminOnly') : undefined}
                            className={isLocked ? 'cursor-not-allowed' : undefined}
                        >
                            <button
                                onClick={isLocked ? undefined : action.onClick}
                                disabled={isLocked}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-sm font-medium transition-all ${isLocked
                                    ? 'bg-white border border-[#e5efea] text-[#9ca3af] opacity-60 cursor-not-allowed'
                                    : action.variant === 'default'
                                        ? ''
                                        : 'bg-white border border-[#e5efea] hover:bg-[#f6fbf9]'
                                    }`}
                                style={
                                    !isLocked && action.variant === 'default'
                                        ? { backgroundColor: 'var(--cf-card-btn, #d4f4e6)', color: 'var(--cf-card-btn-text, #1a5948)' }
                                        : !isLocked && action.variant !== 'default'
                                            ? { color: 'var(--cf-card-heading, #0d0e0e)' }
                                            : undefined
                                }
                            >
                                <span>{action.label}</span>
                                {isLocked ? (
                                    <Lock className="h-3.5 w-3.5 text-[#9ca3af]" />
                                ) : (
                                    <ArrowRight className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );

    return (
        <PageShell>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0b0c0c]">{t('manage.title')}</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={() => setPreviewModalOpen(true)}
                        className="rounded-[999px] px-5 py-[11px] h-auto text-[13px] shadow-[0_10px_20px_rgba(23,102,79,0.35)]"
                        style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                    >
                        {t('manage.previewHandbook')}
                    </Button>
                </div>
            </div>

            {/* Provisioning Banner */}
            {provisioning && (
                <div className="mb-6 bg-[#fef3c7] border border-[#fde68a] rounded-[14px] px-5 py-4 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-[#d97706] animate-spin flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-[#92400e]">{t('manage.provisioningTitle')}</p>
                        <p className="text-sm text-[#a16207] mt-0.5">
                            {t('manage.provisioningDesc')}
                        </p>
                    </div>
                </div>
            )}

            {/* Action Cards Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${provisioning ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Handbook Card */}
                <ActionCard
                    title={t('manage.handbookTitle')}
                    description={t('manage.handbookDesc')}
                    icon={<BookOpen className="h-5 w-5 text-[#1a5948]" />}
                    iconBg="bg-[#d4f4e6]"
                    actions={[
                        {
                            label: t('manage.viewAllPages'),
                            onClick: () => navigate('/handbook/pages'),
                            variant: 'default',
                        },
                        {
                            label: t('manage.addTheme'),
                            onClick: () => navigate(handbookRoutes.addTheme),
                            variant: 'outline',
                            adminOnly: true,
                        },
                        {
                            label: t('manage.addPage'),
                            onClick: () => navigate(handbookRoutes.pages),
                            variant: 'outline',
                            adminOnly: true,
                        },
                    ]}
                />

                {/* Publish Handbook Card */}
                <ActionCard
                    title={t('manage.publishTitle')}
                    description={t('manage.publishDesc')}
                    icon={<Send className="h-5 w-5 text-[#1e40af]" />}
                    iconBg="bg-[#dbeafe]"
                    actions={[
                        {
                            label: t('manage.publish'),
                            onClick: () => navigate(handbookRoutes.publish(String(bid ?? ''))),
                            variant: 'default',
                            adminOnly: true,
                        },
                        {
                            label: t('manage.addMessage'),
                            onClick: () => navigate(isPublished ? employeesRoutes.messageLogs : handbookRoutes.publish(String(bid ?? ''))),
                            variant: 'outline',
                            adminOnly: true,
                        },
                        {
                            label: t('manage.grantAccess'),
                            onClick: () => navigate(isPublished ? employeesRoutes.messageLogs : handbookRoutes.publish(String(bid ?? ''))),
                            variant: 'outline',
                            adminOnly: true,
                        },
                    ]}
                />

                {/* Print Handbook Card */}
                <ActionCard
                    title={t('manage.printTitle')}
                    description={t('manage.printDesc')}
                    icon={<Printer className="h-5 w-5 text-[#7c3aed]" />}
                    iconBg="bg-[#ede9fe]"
                    actions={[
                        {
                            label: t('manage.printHandbook'),
                            onClick: () => navigate(handbookRoutes.printView({ lang })),
                            variant: 'default',
                        },
                        {
                            label: t('manage.viewPrinterFriendly'),
                            onClick: () => navigate(handbookRoutes.printView({ lang })),
                            variant: 'outline',
                        },
                        {
                            label: t('manage.viewToc'),
                            onClick: () => navigate(handbookRoutes.tableOfContents),
                            variant: 'outline',
                        },
                    ]}
                />

                {/* Others Card */}
                <ActionCard
                    title={t('manage.othersTitle')}
                    description={t('manage.othersDesc')}
                    icon={<MoreHorizontal className="h-5 w-5 text-[#d97706]" />}
                    iconBg="bg-[#fef3c7]"
                    actions={[
                        {
                            label: t('manage.appearance'),
                            onClick: () => navigate('/account/appearance'),
                            variant: 'outline',
                            adminOnly: true,
                        },
                        {
                            label: t('manage.viewDocuments'),
                            onClick: () => navigate('/handbook/documents'),
                            variant: 'outline',
                        },
                        {
                            label: t('manage.viewNotes'),
                            onClick: () => navigate('/handbook/notes'),
                            variant: 'outline',
                        },
                        {
                            label: t('manage.viewLinks'),
                            onClick: () => navigate('/handbook/links'),
                            variant: 'outline',
                        },
                    ]}
                />
            </div>

            <PreviewHandbookModal
                isOpen={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
            />
        </PageShell>
    );
};
