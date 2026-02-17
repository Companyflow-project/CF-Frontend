import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { handbookApi } from '../api';
import { handbookRoutes } from '../routes';
import { useAuth } from '@/context/auth-context';

export const ManageHandbookPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const canEditHandbook = user?.role === 'ADMIN' || user?.role === 'company_admin';

    const handleAddPage = () => {
        if (!canEditHandbook) {
            alert("You don't have permission to create handbook pages.");
            return;
        }

        // Do not create the page immediately; send the user
        // to the pages view where they can add a page and
        // only persist it when clicking "Save page".
        navigate(handbookRoutes.pages);
    };

    const ActionCard: React.FC<{
        title: string;
        description: string;
        actions: Array<{ label: string; onClick: () => void; variant?: 'default' | 'outline' }>;
    }> = ({ title, description, actions }) => (
        <Card className="bg-white border border-[#e5efea] rounded-[18px] shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-[#0d0e0e]">{title}</CardTitle>
                <CardDescription className="text-sm text-[#6b7280] mt-1">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-sm font-medium transition-all ${action.variant === 'default'
                            ? 'bg-[#d4f4e6] text-[#1a5948] hover:bg-[#c0edd9]'
                            : 'bg-white border border-[#e5efea] text-[#0d0e0e] hover:bg-[#f6fbf9]'
                            }`}
                    >
                        <span>{action.label}</span>
                        <ArrowRight className="h-4 w-4" />
                    </button>
                ))}
            </CardContent>
        </Card>
    );

    return (
        <PageShell>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0b0c0c]">Manage Handbook</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <Button className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px] px-5 py-[11px] h-auto text-[13px] shadow-[0_10px_20px_rgba(23,102,79,0.35)]">
                        Preview Handbook
                    </Button>
                    <Button
                        variant="outline"
                        className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[13px] bg-white"
                    >
                        Handbook settings
                    </Button>
                </div>
            </div>

            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Handbook Card */}
                <ActionCard
                    title="Handbook"
                    description="Add people, set roles, and manage access."
                    actions={[
                        {
                            label: 'View All Pages →',
                            onClick: () => navigate('/handbook/pages'),
                            variant: 'default',
                        },
                        {
                            label: 'Add theme',
                            onClick: () => navigate('/handbook/add-theme'),
                            variant: 'outline',
                        },
                        {
                            label: 'Add page',
                            onClick: handleAddPage,
                            variant: 'outline',
                        },
                    ]}
                />

                {/* Publish Handbook Card */}
                <ActionCard
                    title="Publish Handbook"
                    description="This is where you publish and grant access to the handbook."
                    actions={[
                        {
                            label: 'Publish →',
                            onClick: () => {
                                // Handle publish action
                                console.log('Publish handbook');
                            },
                            variant: 'default',
                        },
                        {
                            label: 'Add message to employees',
                            onClick: () => navigate('/handbook/add-message'),
                            variant: 'outline',
                        },
                        {
                            label: 'Grant access to employees',
                            onClick: () => navigate('/handbook/grant-access'),
                            variant: 'outline',
                        },
                    ]}
                />

                {/* Print Handbook Card */}
                <ActionCard
                    title="Print Handbook"
                    description="View and print the handbook."
                    actions={[
                        {
                            label: 'Print Handbook→',
                            onClick: () => window.print(),
                            variant: 'default',
                        },
                        {
                            label: 'View printer-friendly version',
                            onClick: () => navigate('/handbook/print-view'),
                            variant: 'outline',
                        },
                        {
                            label: 'View table of contents',
                            onClick: () => navigate('/handbook/table-of-contents'),
                            variant: 'outline',
                        },
                    ]}
                />

                {/* Others Card */}
                <ActionCard
                    title="Others"
                    description="View other actions."
                    actions={[
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
        </PageShell>
    );
};
