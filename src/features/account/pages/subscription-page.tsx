import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { HelpBanner } from '@/components/ui/help-banner';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '../hooks';
import type { SubscriptionData } from '../api';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Format an ISO date string (YYYY-MM-DD) as DD/MM/YYYY */
const formatDate = (iso: string | null): string => {
    if (!iso) return '–';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

// ─── Action link ─────────────────────────────────────────────────────────────

const ActionLink: React.FC<{ label: string; onClick?: () => void }> = ({ label, onClick }) => (
    <button
        onClick={onClick}
        className="inline-flex items-center gap-1 text-sm text-[#0d0e0e] underline underline-offset-2 hover:text-[#2f946f] transition-colors group"
    >
        {label}
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
    </button>
);

// ─── Row type ────────────────────────────────────────────────────────────────

interface SubscriptionAction {
    label: string;
    onClick?: () => void;
}

interface SubscriptionRow {
    category: string;
    about: React.ReactNode;
    actions: SubscriptionAction[];
}

// ─── Build rows from API data ─────────────────────────────────────────────────

function buildRows(data: SubscriptionData, navigate: ReturnType<typeof useNavigate>): SubscriptionRow[] {
    const remainingLabel =
        data.subscriptionRemainingMonths !== null
            ? `${data.subscriptionRemainingMonths} month${data.subscriptionRemainingMonths !== 1 ? 's' : ''}`
            : '–';

    return [
        {
            category: 'Product',
            about: <span className="text-sm text-[#374151]">{data.productName}</span>,
            actions: [
                { label: 'Upgrade Subscription', onClick: () => { } },
            ],
        },
        {
            category: 'Subscription',
            about: (
                <div className="text-sm text-[#374151] space-y-0.5 leading-relaxed">
                    <p>Subscription:</p>
                    <p>Start: {formatDate(data.subscriptionStart)}</p>
                    <p>End: {formatDate(data.subscriptionEnd)}</p>
                    <p>Remaining: {remainingLabel}</p>
                </div>
            ),
            actions: [],
        },
        {
            category: 'Licenses',
            about: (
                <span className="text-sm text-[#374151]">
                    {data.licensesUsed} used of {data.licensesTotal}
                </span>
            ),
            actions: [
                {
                    label: 'Add more licenses',
                    onClick: () =>
                        window.open('https://companyflow.digibida.com/contact-us/', '_blank', 'noopener,noreferrer'),
                },
            ],
        },
        {
            category: 'Messages',
            about: (
                <span className="text-sm text-[#374151]">
                    {data.smsUsed} SMS used by {data.smsUsedByUsers}{' '}
                    {data.smsUsedByUsers === 1 ? 'user' : 'users'}
                    {data.smsCreditsTotal > 0 && ` (cap: ${data.smsCreditsTotal})`}
                </span>
            ),
            actions: [
                { label: 'Add more SMS credits', onClick: () => { } },
            ],
        },
        {
            category: 'Additional manuals',
            about: <span className="text-sm text-[#374151]">{data.additionalManualsTotal}</span>,
            actions: [
                { label: 'Buy additional manuals', onClick: () => { } },
                { label: 'Read more', onClick: () => window.open('https://companyflow.digibida.com/extra-handbook/', '_blank', 'noopener,noreferrer') },
            ],
        },
        {
            category: 'Whistleblower scheme',
            about: (
                <span className="text-sm text-[#374151]">
                    {data.whistleblowerAccess ? 'Active' : '0'}
                </span>
            ),
            actions: [
                { label: 'Read more', onClick: () => window.open('https://companyflow.digibida.com/whistleblowerordning/', '_blank', 'noopener,noreferrer') },
            ],
        },
        {
            category: 'Employment types',
            about: <span className="text-sm text-[#374151]">{data.employmentTypesTotal}</span>,
            actions: [
                { label: 'Create', onClick: () => navigate('/account/employment-types') },
            ],
        },
        {
            category: 'Departments',
            about: <span className="text-sm text-[#374151]">{data.departmentsTotal}</span>,
            actions: [
                { label: 'Create', onClick: () => navigate('/account/departments') },
            ],
        },
        {
            category: 'Version control (SOP)',
            about: <span className="text-sm text-[#374151]">{data.sopTotal}</span>,
            actions: [
                { label: 'Read more', onClick: () => { } },
            ],
        },
    ];
}

// ─── Page ────────────────────────────────────────────────────────────────────

export const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const companyId = user?.companyId ? String(user.companyId) : undefined;

    const { data, isLoading, isError } = useSubscription(companyId);

    const rows = data ? buildRows(data, navigate) : [];

    return (
        <PageShell>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/account')}
                    className="h-9 px-3"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-[#0d0e0e]">Subscription</h1>
            </div>

            {/* Help Banner */}
            <HelpBanner className="mb-6">
                Here you can see an overview of your subscription. You can also upgrade, add more licenses,
                create employment types, etc. from this page.
            </HelpBanner>

            {/* Loading state */}
            {isLoading && (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm">Loading subscription details…</span>
                </div>
            )}

            {/* Error state */}
            {isError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-5 text-sm text-red-600">
                    Failed to load subscription data. Please try refreshing the page.
                </div>
            )}

            {/* Subscription Table */}
            {data && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_1.5fr_2fr] border-b border-gray-200 px-6 py-3">
                        <span className="text-sm font-semibold text-[#2f946f]">Category</span>
                        <span className="text-sm font-semibold text-[#2f946f]">About</span>
                        <span className="text-sm font-semibold text-[#2f946f]">Actions</span>
                    </div>

                    {/* Table Rows */}
                    {rows.map((row, index) => (
                        <div
                            key={index}
                            className={`grid grid-cols-[1fr_1.5fr_2fr] px-6 py-4 items-start transition-colors hover:bg-gray-50/60 ${index < rows.length - 1 ? 'border-b border-dashed border-gray-200' : ''
                                }`}
                        >
                            {/* Category */}
                            <span className="text-sm text-[#0d0e0e] font-medium">{row.category}</span>

                            {/* About */}
                            <div>{row.about}</div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                                {row.actions.map((action, actionIdx) => (
                                    <ActionLink key={actionIdx} label={action.label} onClick={action.onClick} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageShell>
    );
};
