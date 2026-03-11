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
import { useAuth } from '@/context/auth-context';
import { PreviewHandbookModal } from '../components/preview-handbook-modal';
import { useHandbookTree } from '../hooks';
import { useHandbookLang } from '../components/language-toggle';

export const ManageHandbookPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const { bid, isPublished, provisioning } = useHandbookTree();
    const [lang] = useHandbookLang();

    const canEditHandbook = user?.role === 'ADMIN' || user?.role === 'company_admin';

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
        <Card className="bg-white border border-[#e5efea] rounded-[18px] shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                        {icon}
                    </div>
                    <CardTitle className="text-lg font-bold text-[#0d0e0e]">{title}</CardTitle>
                </div>
                <CardDescription className="text-sm text-[#6b7280] mt-1">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {actions.map((action, index) => {
                    const isLocked = action.adminOnly && !canEditHandbook;
                    return (
                        <div
                            key={index}
                            title={isLocked ? 'Only admins can perform this action' : undefined}
                            className={isLocked ? 'cursor-not-allowed' : undefined}
                        >
                            <button
                                onClick={isLocked ? undefined : action.onClick}
                                disabled={isLocked}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-sm font-medium transition-all ${isLocked
                                    ? 'bg-white border border-[#e5efea] text-[#9ca3af] opacity-60 cursor-not-allowed'
                                    : action.variant === 'default'
                                        ? 'bg-[#d4f4e6] text-[#1a5948] hover:bg-[#c0edd9]'
                                        : 'bg-white border border-[#e5efea] text-[#0d0e0e] hover:bg-[#f6fbf9]'
                                    }`}
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
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0b0c0c]">Manage Handbook</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={() => setPreviewModalOpen(true)}
                        className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px] px-5 py-[11px] h-auto text-[13px] shadow-[0_10px_20px_rgba(23,102,79,0.35)]"
                    >
                        Preview Handbook
                    </Button>
                </div>
            </div>

            {/* Provisioning Banner */}
            {provisioning && (
                <div className="mb-6 bg-[#fef3c7] border border-[#fde68a] rounded-[14px] px-5 py-4 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-[#d97706] animate-spin flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-[#92400e]">Setting up your handbook...</p>
                        <p className="text-sm text-[#a16207] mt-0.5">
                            We're preparing your handbook template. This usually takes a minute or two. The page will update automatically.
                        </p>
                    </div>
                </div>
            )}

            {/* Action Cards Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${provisioning ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Handbook Card */}
                <ActionCard
                    title="Handbook"
                    description="Add people, set roles, and manage access."
                    icon={<BookOpen className="h-5 w-5 text-[#1a5948]" />}
                    iconBg="bg-[#d4f4e6]"
                    actions={[
                        {
                            label: 'View All Pages →',
                            onClick: () => navigate('/handbook/pages'),
                            variant: 'default',
                        },
                        {
                            label: 'Add theme',
                            onClick: () => navigate(handbookRoutes.addTheme),
                            variant: 'outline',
                            adminOnly: true,
                        },
                        {
                            label: 'Add page',
                            onClick: () => navigate(handbookRoutes.pages),
                            variant: 'outline',
                            adminOnly: true,
                        },
                    ]}
                />

                {/* Publish Handbook Card */}
                <ActionCard
                    title="Publish Handbook"
                    description="This is where you publish and grant access to the handbook."
                    icon={<Send className="h-5 w-5 text-[#1e40af]" />}
                    iconBg="bg-[#dbeafe]"
                    actions={[
                        {
                            label: 'Publish →',
                            onClick: () => navigate(handbookRoutes.publish(String(bid ?? ''))),
                            variant: 'default',
                            adminOnly: true,
                        },
                        {
                            label: 'Add message to employees',
                            onClick: () => navigate(isPublished ? employeesRoutes.messageLogs : handbookRoutes.publish(String(bid ?? ''))),
                            variant: 'outline',
                            adminOnly: true,
                        },
                        {
                            label: 'Grant access to employees',
                            onClick: () => navigate(isPublished ? employeesRoutes.messageLogs : handbookRoutes.publish(String(bid ?? ''))),
                            variant: 'outline',
                            adminOnly: true,
                        },
                    ]}
                />

                {/* Print Handbook Card */}
                <ActionCard
                    title="Print Handbook"
                    description="View and print the handbook."
                    icon={<Printer className="h-5 w-5 text-[#7c3aed]" />}
                    iconBg="bg-[#ede9fe]"
                    actions={[
                        {
                            label: 'Print Handbook →',
                            onClick: () => navigate(handbookRoutes.printView({ lang })),
                            variant: 'default',
                        },
                        {
                            label: 'View printer-friendly version',
                            onClick: () => navigate(handbookRoutes.printView({ lang })),
                            variant: 'outline',
                        },
                        {
                            label: 'View table of contents',
                            onClick: () => navigate(handbookRoutes.tableOfContents),
                            variant: 'outline',
                        },
                    ]}
                />

                {/* Others Card */}
                <ActionCard
                    title="Others"
                    description="View other actions."
                    icon={<MoreHorizontal className="h-5 w-5 text-[#d97706]" />}
                    iconBg="bg-[#fef3c7]"
                    actions={[
                        {
                            label: 'Appearance',
                            onClick: () => navigate('/account/appearance'),
                            variant: 'outline',
                            adminOnly: true,
                        },
                        {
                            label: 'View Documents',
                            onClick: () => navigate('/handbook/documents'),
                            variant: 'outline',
                        },
                        {
                            label: 'View Notes',
                            onClick: () => navigate('/handbook/notes'),
                            variant: 'outline',
                        },
                        {
                            label: 'View Links',
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
