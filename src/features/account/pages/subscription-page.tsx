import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { HelpBanner } from '@/components/ui/help-banner';
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '../hooks';
import { accountApi } from '../api';
import type { SubscriptionData } from '../api';
import { toast } from 'sonner';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Format an ISO date string (YYYY-MM-DD) as DD/MM/YYYY */
const formatDate = (iso: string | null): string => {
    if (!iso) return '–';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

/** All available language add-ons */
const AVAILABLE_LANGUAGES: readonly { code: string; label: string; isDefault?: boolean; wip?: boolean }[] = [
    { code: 'da', label: 'Danish', isDefault: true },
    { code: 'en', label: 'English (US)' },
    { code: 'en-uk', label: 'English (UK)', wip: true },
    { code: 'nl', label: 'Dutch', wip: true },
    { code: 'fr', label: 'French', wip: true },
    { code: 'de', label: 'German', wip: true },
];

/** Map language codes to display names */
const langLabel = (code: string) =>
    AVAILABLE_LANGUAGES.find((l) => l.code === code)?.label ?? code;

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

// ─── Add Languages Modal ────────────────────────────────────────────────────

interface AddLanguagesModalProps {
    open: boolean;
    onClose: () => void;
    currentLanguages: string[];
    onSaved: (languages: string[]) => void;
}

const AddLanguagesModal: React.FC<AddLanguagesModalProps> = ({ open, onClose, currentLanguages, onSaved }) => {
    const { t } = useTranslation('account');
    const [selected, setSelected] = useState<Set<string>>(new Set(currentLanguages));
    const [saving, setSaving] = useState(false);

    // Reset selection when modal opens
    React.useEffect(() => {
        if (open) setSelected(new Set(currentLanguages));
    }, [open, currentLanguages]);

    if (!open) return null;

    const toggle = (code: string) => {
        const lang = AVAILABLE_LANGUAGES.find((l) => l.code === code);
        if (!lang || lang.isDefault || lang.wip) return; // Can't toggle default or WIP
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const languages = Array.from(selected);
            await accountApi.updateCompanyLanguages(languages);
            toast.success(t('subscription.languages.modal.success'));
            onSaved(languages);
            onClose();
        } catch {
            toast.error(t('subscription.languages.modal.error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-sm max-h-[90vh] overflow-y-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-[#0d0e0e]">
                        {t('subscription.languages.modal.title')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[#6b7280] hover:text-[#0d0e0e] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="text-sm text-[#6b7280] mb-5">
                    {t('subscription.languages.modal.description')}
                </p>

                {/* Language checkboxes */}
                <div className="space-y-3 mb-6">
                    {AVAILABLE_LANGUAGES.map((lang) => {
                        const isDefault = lang.isDefault === true;
                        const isWip = lang.wip === true;
                        const isDisabled = isDefault || isWip;
                        const isChecked = isDefault || selected.has(lang.code);

                        return (
                            <label
                                key={lang.code}
                                className={`flex items-center gap-3 text-sm ${isDisabled ? 'text-[#9ca3af]' : 'text-[#0d0e0e] cursor-pointer'}`}
                                title={isWip ? t('subscription.languages.wip') : undefined}
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isDisabled}
                                    onChange={() => toggle(lang.code)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#3d997d] focus:ring-[#3d997d] disabled:opacity-50"
                                />
                                <span>
                                    {lang.label}
                                    {isDefault && (
                                        <span className="text-[#9ca3af] ml-1">({t('subscription.languages.default')})</span>
                                    )}
                                    {isWip && (
                                        <span className="text-[#f59e0b] ml-1 text-xs">({t('subscription.languages.wip')})</span>
                                    )}
                                </span>
                            </label>
                        );
                    })}
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://companyflow.digibida.com/contact-us/', '_blank', 'noopener,noreferrer')}
                        className="px-5 py-2 h-auto text-sm rounded-lg"
                    >
                        {t('subscription.languages.modal.contactUs')}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white px-5 py-2 h-auto text-sm rounded-lg"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                {t('subscription.languages.modal.adding')}
                            </>
                        ) : (
                            t('subscription.languages.modal.add')
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ─── Add Licenses Modal ─────────────────────────────────────────────────────

const MIN_LICENSES = 5;

interface AddLicensesModalProps {
    open: boolean;
    onClose: () => void;
    onAdded: (added: number, newTotal: number) => void;
}

const AddLicensesModal: React.FC<AddLicensesModalProps> = ({ open, onClose, onAdded }) => {
    const { t } = useTranslation('account');
    const [count, setCount] = useState(MIN_LICENSES);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (open) setCount(MIN_LICENSES);
    }, [open]);

    if (!open) return null;

    const handleSave = async () => {
        if (count < MIN_LICENSES) return;
        setSaving(true);
        try {
            const result = await accountApi.addLicenses(count);
            toast.success(t('subscription.licenses.modal.success', { count }));
            onAdded(result.licensesAdded, result.newTotal);
            onClose();
        } catch {
            toast.error(t('subscription.licenses.modal.error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-sm max-h-[90vh] overflow-y-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-[#0d0e0e]">
                        {t('subscription.licenses.modal.title')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[#6b7280] hover:text-[#0d0e0e] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="text-sm text-[#6b7280] mb-5">
                    {t('subscription.licenses.modal.description')}
                </p>

                {/* Number input */}
                <div className="mb-6">
                    <input
                        type="number"
                        min={MIN_LICENSES}
                        step={1}
                        value={count}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) setCount(Math.max(MIN_LICENSES, val));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#0d0e0e] focus:outline-none focus:ring-2 focus:ring-[#3d997d] focus:border-transparent"
                    />
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://companyflow.digibida.com/contact-us/', '_blank', 'noopener,noreferrer')}
                        className="px-5 py-2 h-auto text-sm rounded-lg"
                    >
                        {t('subscription.licenses.modal.contactUs')}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || count < MIN_LICENSES}
                        className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white px-5 py-2 h-auto text-sm rounded-lg"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                {t('subscription.licenses.modal.adding')}
                            </>
                        ) : (
                            t('subscription.licenses.modal.add')
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ─── Add SMS Credits Modal ──────────────────────────────────────────────────

const MIN_SMS_CREDITS = 25;

interface AddSmsCreditsModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddSmsCreditsModal: React.FC<AddSmsCreditsModalProps> = ({ open, onClose, onSuccess }) => {
    const { t } = useTranslation('account');
    const [count, setCount] = useState(MIN_SMS_CREDITS);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (open) setCount(MIN_SMS_CREDITS);
    }, [open]);

    if (!open) return null;

    const handleSave = async () => {
        if (count < MIN_SMS_CREDITS) return;
        setSaving(true);
        try {
            await accountApi.addSmsCredits(count);
            toast.success(t('subscription.sms.modal.success', { count }));
            onSuccess();
            onClose();
        } catch {
            toast.error(t('subscription.sms.modal.error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-sm max-h-[90vh] overflow-y-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-[#0d0e0e]">
                        {t('subscription.sms.modal.title')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[#6b7280] hover:text-[#0d0e0e] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="text-sm text-[#6b7280] mb-5">
                    {t('subscription.sms.modal.description')}
                </p>

                {/* Number input */}
                <div className="mb-6">
                    <input
                        type="number"
                        min={MIN_SMS_CREDITS}
                        step={1}
                        value={count}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) setCount(Math.max(MIN_SMS_CREDITS, val));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#0d0e0e] focus:outline-none focus:ring-2 focus:ring-[#3d997d] focus:border-transparent"
                    />
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://companyflow.digibida.com/contact-us/', '_blank', 'noopener,noreferrer')}
                        className="px-5 py-2 h-auto text-sm rounded-lg"
                    >
                        {t('subscription.sms.modal.contactUs')}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || count < MIN_SMS_CREDITS}
                        className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white px-5 py-2 h-auto text-sm rounded-lg"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                {t('subscription.sms.modal.adding')}
                            </>
                        ) : (
                            t('subscription.sms.modal.add')
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ─── Page ────────────────────────────────────────────────────────────────────

export const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('account');
    const { t: tCommon } = useTranslation('common');
    const { user } = useAuth();
    const companyId = user?.companyId ? String(user.companyId) : undefined;

    const { data, isLoading, isError, refetch } = useSubscription(companyId);

    const [langModalOpen, setLangModalOpen] = useState(false);
    const [licModalOpen, setLicModalOpen] = useState(false);
    const [smsCreditsModalOpen, setSmsCreditsModalOpen] = useState(false);
    const [companyLanguages, setCompanyLanguages] = useState<string[]>(user?.companyLanguages ?? ['da']);

    // Sync when user data changes
    React.useEffect(() => {
        if (user?.companyLanguages) setCompanyLanguages(user.companyLanguages);
    }, [user?.companyLanguages]);

    // ─── Build rows from API data ─────────────────────────────────────────────────

    function buildRows(data: SubscriptionData): SubscriptionRow[] {
        const remainingLabel =
            data.subscriptionRemainingMonths !== null
                ? `${data.subscriptionRemainingMonths} ${t('subscription.month', { count: data.subscriptionRemainingMonths })}`
                : '–';

        return [
            {
                category: t('subscription.row.product'),
                about: <span className="text-sm text-[#374151]">{data.productName}</span>,
                actions: [
                    { label: t('subscription.action.upgrade'), onClick: () => { } },
                ],
            },
            {
                category: t('subscription.row.subscription'),
                about: (
                    <div className="text-sm text-[#374151] space-y-0.5 leading-relaxed">
                        <p>{t('subscription.row.subscription')}:</p>
                        <p>{t('subscription.row.start', { date: formatDate(data.subscriptionStart) })}</p>
                        <p>{t('subscription.row.end', { date: formatDate(data.subscriptionEnd) })}</p>
                        <p>{t('subscription.row.remaining', { label: remainingLabel })}</p>
                    </div>
                ),
                actions: [],
            },
            {
                category: t('subscription.row.licenses'),
                about: (
                    <span className="text-sm text-[#374151]">
                        {t('subscription.row.licensesUsed', { used: data.licensesUsed, total: data.licensesTotal })}
                    </span>
                ),
                actions: [
                    {
                        label: t('subscription.action.moreLicenses'),
                        onClick: () => setLicModalOpen(true),
                    },
                ],
            },
            {
                category: t('subscription.row.messages'),
                about: (
                    <span className="text-sm text-[#374151]">
                        {t('subscription.row.smsUsed', {
                            used: data.smsUsed,
                            users: data.smsUsedByUsers,
                            userLabel: t('subscription.user', { count: data.smsUsedByUsers }),
                        })}
                        {data.smsCreditsTotal > 0 && ` ${t('subscription.row.smsCap', { cap: data.smsCreditsTotal })}`}
                    </span>
                ),
                actions: [
                    { label: t('subscription.action.moreSms'), onClick: () => setSmsCreditsModalOpen(true) },
                ],
            },
            {
                category: t('subscription.row.languages'),
                about: (
                    <span className="text-sm text-[#374151]">
                        {companyLanguages.map((c) => langLabel(c)).join(', ')}
                    </span>
                ),
                actions: [
                    { label: t('subscription.action.addLanguages'), onClick: () => setLangModalOpen(true) },
                ],
            },
            {
                category: t('subscription.row.additionalManuals'),
                about: <span className="text-sm text-[#374151]">{data.additionalManualsTotal}</span>,
                actions: [
                    { label: t('subscription.action.buyManuals'), onClick: () => { } },
                    { label: t('subscription.action.readMore'), onClick: () => window.open('https://companyflow.digibida.com/extra-handbook/', '_blank', 'noopener,noreferrer') },
                ],
            },
            {
                category: t('subscription.row.whistleblower'),
                about: (
                    <span className="text-sm text-[#374151]">
                        {data.whistleblowerAccess ? t('subscription.row.active') : '0'}
                    </span>
                ),
                actions: [
                    { label: t('subscription.action.readMore'), onClick: () => window.open('https://companyflow.digibida.com/whistleblowerordning/', '_blank', 'noopener,noreferrer') },
                ],
            },
            {
                category: t('subscription.row.employmentTypes'),
                about: <span className="text-sm text-[#374151]">{data.employmentTypesTotal}</span>,
                actions: [
                    { label: t('subscription.action.create'), onClick: () => navigate('/account/employment-types') },
                ],
            },
            {
                category: t('subscription.row.departments'),
                about: <span className="text-sm text-[#374151]">{data.departmentsTotal}</span>,
                actions: [
                    { label: t('subscription.action.create'), onClick: () => navigate('/account/departments') },
                ],
            },
            {
                category: t('subscription.row.sop'),
                about: <span className="text-sm text-[#374151]">{data.sopTotal}</span>,
                actions: [
                    { label: t('subscription.action.readMore'), onClick: () => { } },
                ],
            },
        ];
    }

    const rows = data ? buildRows(data) : [];

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
                    {tCommon('back')}
                </Button>
                <h1 className="text-2xl font-bold text-[#0d0e0e]">{t('subscription.title')}</h1>
            </div>

            {/* Help Banner */}
            <HelpBanner className="mb-6">
                {t('subscription.helpBanner')}
            </HelpBanner>

            {/* Loading state */}
            {isLoading && (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm">{t('subscription.loading')}</span>
                </div>
            )}

            {/* Error state */}
            {isError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-5 text-sm text-red-600">
                    {t('subscription.error')}
                </div>
            )}

            {/* Subscription Table */}
            {data && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_1.5fr_2fr] border-b border-gray-200 px-6 py-3">
                        <span className="text-sm font-semibold text-[#2f946f]">{t('subscription.col.category')}</span>
                        <span className="text-sm font-semibold text-[#2f946f]">{t('subscription.col.about')}</span>
                        <span className="text-sm font-semibold text-[#2f946f]">{t('subscription.col.actions')}</span>
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

            {/* Add Languages Modal */}
            <AddLanguagesModal
                open={langModalOpen}
                onClose={() => setLangModalOpen(false)}
                currentLanguages={companyLanguages}
                onSaved={setCompanyLanguages}
            />

            {/* Add Licenses Modal */}
            <AddLicensesModal
                open={licModalOpen}
                onClose={() => setLicModalOpen(false)}
                onAdded={() => refetch()}
            />

            {/* Add SMS Credits Modal */}
            <AddSmsCreditsModal
                open={smsCreditsModalOpen}
                onClose={() => setSmsCreditsModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </PageShell>
    );
};
