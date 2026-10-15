import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { HelpBanner } from '@/components/ui/help-banner';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '../hooks';
import { accountApi } from '../api';
import type { SubscriptionData } from '../api';
import { toast } from 'sonner';
import { marketingLinks } from '@/lib/marketing-links';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Format an ISO date string (YYYY-MM-DD) as DD/MM/YYYY */
const formatDate = (iso: string | null): string => {
    if (!iso) return '–';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

/** All available language add-ons. Names live in account.json (subscription.languages.name.<code>). */
const AVAILABLE_LANGUAGES: readonly { code: string; isDefault?: boolean; wip?: boolean }[] = [
    { code: 'da', isDefault: true },
    { code: 'en' },
    { code: 'en-uk', wip: true },
    { code: 'nl', wip: true },
    { code: 'fr', wip: true },
    { code: 'de', wip: true },
];

/** Language code → name in the UI language (e.g. "en" → "Engelsk (USA)" in Danish). */
const useLanguageName = () => {
    const { t } = useTranslation('account');
    return React.useCallback(
        (code: string): string => t(`subscription.languages.name.${code}`, { defaultValue: code }),
        [t],
    );
};

/** Format a count for the UI language (2500 → "2.500" in Danish). */
const useFormatNumber = () => {
    const { i18n } = useTranslation();
    return React.useCallback(
        (n: number): string => {
            try {
                return new Intl.NumberFormat(i18n.language).format(n);
            } catch {
                return String(n);
            }
        },
        [i18n.language],
    );
};

const PRIMARY_BTN_STYLE: React.CSSProperties = {
    backgroundColor: 'var(--cf-primary-btn, #3d997d)',
    color: 'var(--cf-primary-btn-text, #ffffff)',
};

const openContactPage = () => window.open(marketingLinks.contact, '_blank', 'noopener,noreferrer');

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

// ─── Modal building blocks ──────────────────────────────────────────────────

interface ModalShellProps {
    title: string;
    onClose: () => void;
    /** While a request is in flight the dialog can't be closed. */
    busy?: boolean;
    children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ title, onClose, busy = false, children }) => {
    const { t } = useTranslation('account');

    React.useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !busy) onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [busy, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-sm max-h-[90vh] overflow-y-auto p-6"
            >
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-[#0d0e0e]">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label={t('subscription.purchase.close')}
                        className="text-[#6b7280] hover:text-[#0d0e0e] transition-colors disabled:opacity-40"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

/** "What you're about to buy" — label/value rows shown on the confirm step. */
const PurchaseSummary: React.FC<{ rows: { label: string; value: React.ReactNode }[] }> = ({ rows }) => (
    <dl className="rounded-lg border border-gray-200 bg-gray-50 divide-y divide-gray-200 mb-4">
        {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
                <dt className="text-[#6b7280]">{row.label}</dt>
                <dd className="text-right font-semibold text-[#0d0e0e]">{row.value}</dd>
            </div>
        ))}
    </dl>
);

/** Final step after a successful purchase: says exactly what was bought. */
const PurchaseDone: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    const { t } = useTranslation('account');
    return (
        <>
            <div role="status" className="flex items-start gap-3 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-3 mt-3 mb-6">
                <CheckCircle2 className="h-5 w-5 text-[#2f946f] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#0d0e0e]">{message}</p>
            </div>
            <div className="flex items-center justify-end">
                <Button size="sm" onClick={onClose} className="px-5 py-2 h-auto text-sm rounded-lg" style={PRIMARY_BTN_STYLE}>
                    {t('subscription.purchase.close')}
                </Button>
            </div>
        </>
    );
};

type PurchaseStep = 'edit' | 'confirm' | 'done';

// ─── Add Languages Modal ────────────────────────────────────────────────────

interface AddLanguagesModalProps {
    open: boolean;
    onClose: () => void;
    currentLanguages: string[];
    onSaved: (languages: string[]) => void;
}

const AddLanguagesModal: React.FC<AddLanguagesModalProps> = ({ open, onClose, currentLanguages, onSaved }) => {
    const { t } = useTranslation('account');
    const languageName = useLanguageName();
    const [selected, setSelected] = useState<Set<string>>(new Set(currentLanguages));
    const [step, setStep] = useState<PurchaseStep>('edit');
    const [saving, setSaving] = useState(false);
    const [failed, setFailed] = useState(false);
    const [done, setDone] = useState<{ languages: string[]; purchased: boolean } | null>(null);

    // Reset only when the dialog opens. currentLanguages changes after a save
    // (onSaved), and resetting then would throw away the confirmation step.
    React.useEffect(() => {
        if (!open) return;
        setSelected(new Set(currentLanguages));
        setStep('edit');
        setSaving(false);
        setFailed(false);
        setDone(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

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

    // The default language is always on; keep the list in a stable order.
    const languages = AVAILABLE_LANGUAGES.filter((l) => l.isDefault || selected.has(l.code)).map((l) => l.code);
    const added = AVAILABLE_LANGUAGES.filter((l) => !l.isDefault && languages.includes(l.code) && !currentLanguages.includes(l.code)).map((l) => l.code);
    const removed = currentLanguages.filter((c) => !languages.includes(c));
    const hasChanges = added.length > 0 || removed.length > 0;
    const isPurchase = added.length > 0;
    const names = (codes: string[]) => codes.map(languageName).join(', ');

    const handleConfirm = async () => {
        setSaving(true);
        setFailed(false);
        try {
            const result = await accountApi.updateCompanyLanguages(languages);
            const saved = result?.languages ?? languages;
            onSaved(saved);
            setDone({ languages: saved, purchased: isPurchase });
            setStep('done');
        } catch {
            setFailed(true);
        } finally {
            setSaving(false);
        }
    };

    if (step === 'done' && done) {
        return (
            <ModalShell
                title={done.purchased ? t('subscription.purchase.doneTitle') : t('subscription.languages.modal.success')}
                onClose={onClose}
            >
                <PurchaseDone message={t('subscription.languages.done', { languages: names(done.languages) })} onClose={onClose} />
            </ModalShell>
        );
    }

    if (step === 'confirm') {
        const rows = [
            ...(added.length > 0 ? [{ label: t('subscription.languages.confirm.added'), value: names(added) }] : []),
            ...(removed.length > 0 ? [{ label: t('subscription.languages.confirm.removed'), value: names(removed) }] : []),
            { label: t('subscription.languages.confirm.result'), value: names(languages) },
        ];
        return (
            <ModalShell
                title={isPurchase ? t('subscription.purchase.confirmTitle') : t('subscription.languages.confirm.titleChange')}
                onClose={onClose}
                busy={saving}
            >
                <p className="text-sm text-[#6b7280] mb-4">{t('subscription.purchase.confirmIntro')}</p>
                <PurchaseSummary rows={rows} />
                {isPurchase && <p className="text-xs text-[#6b7280] mb-6">{t('subscription.purchase.billingNote')}</p>}
                {failed && (
                    <p role="alert" className="text-sm text-red-600 mb-4">{t('subscription.languages.modal.error')}</p>
                )}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStep('edit')}
                        disabled={saving}
                        className="px-5 py-2 h-auto text-sm rounded-lg"
                    >
                        {t('subscription.purchase.cancel')}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleConfirm}
                        disabled={saving}
                        className="px-5 py-2 h-auto text-sm rounded-lg"
                        style={PRIMARY_BTN_STYLE}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                {t('subscription.languages.modal.adding')}
                            </>
                        ) : isPurchase ? (
                            t('subscription.purchase.confirm')
                        ) : (
                            t('subscription.languages.confirm.confirmChange')
                        )}
                    </Button>
                </div>
            </ModalShell>
        );
    }

    return (
        <ModalShell title={t('subscription.languages.modal.title')} onClose={onClose}>
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
                                {languageName(lang.code)}
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
                    onClick={openContactPage}
                    className="px-5 py-2 h-auto text-sm rounded-lg"
                >
                    {t('subscription.languages.modal.contactUs')}
                </Button>
                <Button
                    size="sm"
                    onClick={() => setStep('confirm')}
                    disabled={!hasChanges}
                    className="px-5 py-2 h-auto text-sm rounded-lg"
                    style={PRIMARY_BTN_STYLE}
                >
                    {isPurchase || !hasChanges
                        ? t('subscription.languages.modal.add')
                        : t('subscription.languages.modal.save')}
                </Button>
            </div>
        </ModalShell>
    );
};

// ─── Buy licences / SMS credits ─────────────────────────────────────────────

type QuantityProduct = 'licenses' | 'sms';

/**
 * Per-product minimum (mirrors the backend's validation) and purchase call.
 * i18n keys live under subscription.<product>.*.
 */
const QUANTITY_PRODUCTS: Record<
    QuantityProduct,
    { min: number; buy: (quantity: number) => Promise<{ added: number; newTotal: number }> }
> = {
    licenses: {
        min: 5,
        buy: async (quantity) => {
            const result = await accountApi.addLicenses(quantity);
            return { added: result.licensesAdded, newTotal: result.newTotal };
        },
    },
    sms: {
        min: 25,
        buy: async (quantity) => {
            const result = await accountApi.addSmsCredits(quantity);
            return { added: result.smsCreditsAdded, newTotal: result.newTotal };
        },
    },
};

type QuantityError = 'empty' | 'notWhole' | 'belowMin';

/**
 * Check what was typed without changing it: the amount bought is always the
 * amount the customer typed and confirmed (no clamping to the minimum).
 */
const parseQuantity = (raw: string, min: number): { value: number | null; error: QuantityError | null } => {
    const trimmed = raw.trim();
    if (trimmed === '') return { value: null, error: 'empty' };
    if (!/^\d+$/.test(trimmed)) return { value: null, error: 'notWhole' };
    const value = Number(trimmed);
    if (!Number.isSafeInteger(value)) return { value: null, error: 'notWhole' };
    if (value < min) return { value, error: 'belowMin' };
    return { value, error: null };
};

interface BuyQuantityModalProps {
    product: QuantityProduct;
    open: boolean;
    onClose: () => void;
    /** Current total on the subscription, shown as "before → after" on the confirm step. */
    currentTotal: number;
    onPurchased: () => void;
}

/** Three steps: type an amount → confirm exactly what is bought → see what was bought. */
const BuyQuantityModal: React.FC<BuyQuantityModalProps> = ({ product, open, onClose, currentTotal, onPurchased }) => {
    const { t } = useTranslation('account');
    const formatNumber = useFormatNumber();
    const inputId = React.useId();
    const { min, buy } = QUANTITY_PRODUCTS[product];
    const k = `subscription.${product}`;

    const [raw, setRaw] = useState('');
    const [showError, setShowError] = useState(false);
    const [step, setStep] = useState<PurchaseStep>('edit');
    const [saving, setSaving] = useState(false);
    const [failed, setFailed] = useState(false);
    const [result, setResult] = useState<{ added: number; newTotal: number } | null>(null);

    React.useEffect(() => {
        if (!open) return;
        setRaw('');
        setShowError(false);
        setStep('edit');
        setSaving(false);
        setFailed(false);
        setResult(null);
    }, [open]);

    if (!open) return null;

    const quantityLabel = (n: number) => t(`${k}.quantity`, { count: n, n: formatNumber(n) });
    const { value, error } = parseQuantity(raw, min);
    const errorText =
        error === 'empty'
            ? t('subscription.purchase.errorEmpty')
            : error === 'notWhole'
                ? t('subscription.purchase.errorWhole')
                : error === 'belowMin'
                    ? t('subscription.purchase.errorMin', { quantity: quantityLabel(min) })
                    : null;
    const errorVisible = showError && errorText !== null;

    const handleContinue = () => {
        if (error !== null || value === null) {
            setShowError(true);
            return;
        }
        setFailed(false);
        setStep('confirm');
    };

    const handleConfirm = async () => {
        if (error !== null || value === null) return;
        setSaving(true);
        setFailed(false);
        try {
            const res = await buy(value);
            setResult(res);
            setStep('done');
            onPurchased();
        } catch {
            setFailed(true);
        } finally {
            setSaving(false);
        }
    };

    if (step === 'done' && result) {
        return (
            <ModalShell title={t('subscription.purchase.doneTitle')} onClose={onClose}>
                <PurchaseDone
                    message={t('subscription.purchase.done', {
                        quantity: quantityLabel(result.added),
                        total: quantityLabel(result.newTotal),
                    })}
                    onClose={onClose}
                />
            </ModalShell>
        );
    }

    if (step === 'confirm' && value !== null) {
        return (
            <ModalShell title={t('subscription.purchase.confirmTitle')} onClose={onClose} busy={saving}>
                <p className="text-sm text-[#6b7280] mb-4">{t('subscription.purchase.confirmIntro')}</p>
                <PurchaseSummary
                    rows={[
                        { label: t('subscription.purchase.quantity'), value: quantityLabel(value) },
                        { label: t('subscription.purchase.addedTo'), value: t('subscription.purchase.target') },
                        {
                            label: t(`${k}.confirm.totalLabel`),
                            value: t('subscription.purchase.totalChange', {
                                from: formatNumber(currentTotal),
                                to: formatNumber(currentTotal + value),
                            }),
                        },
                    ]}
                />
                <p className="text-xs text-[#6b7280] mb-6">{t('subscription.purchase.billingNote')}</p>
                {failed && <p role="alert" className="text-sm text-red-600 mb-4">{t('subscription.purchase.failed')}</p>}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStep('edit')}
                        disabled={saving}
                        className="px-5 py-2 h-auto text-sm rounded-lg"
                    >
                        {t('subscription.purchase.cancel')}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleConfirm}
                        disabled={saving}
                        className="px-5 py-2 h-auto text-sm rounded-lg"
                        style={PRIMARY_BTN_STYLE}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                {t('subscription.purchase.confirming')}
                            </>
                        ) : (
                            t('subscription.purchase.confirm')
                        )}
                    </Button>
                </div>
            </ModalShell>
        );
    }

    return (
        <ModalShell title={t(`${k}.modal.title`)} onClose={onClose}>
            <p className="text-sm text-[#6b7280] mb-5">{t(`${k}.modal.description`)}</p>

            <div className="mb-6">
                <label htmlFor={inputId} className="block text-sm font-medium text-[#0d0e0e] mb-1.5">
                    {t(`${k}.modal.fieldLabel`)}
                </label>
                {/* Plain text + numeric keyboard: a type="number" field changes its value on scroll/arrow keys. */}
                <input
                    id={inputId}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    onBlur={() => {
                        if (raw.trim() !== '') setShowError(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleContinue();
                        }
                    }}
                    aria-invalid={errorVisible}
                    aria-describedby={`${inputId}-hint`}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-[#0d0e0e] focus:outline-none focus:ring-2 focus:border-transparent ${errorVisible ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-[#3d997d]'}`}
                />
                <p
                    id={`${inputId}-hint`}
                    role={errorVisible ? 'alert' : undefined}
                    className={`mt-1.5 text-xs ${errorVisible ? 'text-red-600' : 'text-[#6b7280]'}`}
                >
                    {errorVisible ? errorText : t('subscription.purchase.minHint', { quantity: quantityLabel(min) })}
                </p>
            </div>

            <div className="flex items-center justify-end gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={openContactPage}
                    className="px-5 py-2 h-auto text-sm rounded-lg"
                >
                    {t(`${k}.modal.contactUs`)}
                </Button>
                <Button
                    size="sm"
                    onClick={handleContinue}
                    disabled={error !== null}
                    className="px-5 py-2 h-auto text-sm rounded-lg"
                    style={PRIMARY_BTN_STYLE}
                >
                    {t(`${k}.modal.add`)}
                </Button>
            </div>
        </ModalShell>
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
    const languageName = useLanguageName();
    const formatNumber = useFormatNumber();

    // ?add=licenses (from "Tilføj flere licenser" on the Konto page) opens the licence dialog.
    const [searchParams, setSearchParams] = useSearchParams();
    const [langModalOpen, setLangModalOpen] = useState(false);
    const [licModalOpen, setLicModalOpen] = useState(searchParams.get('add') === 'licenses');
    const [smsCreditsModalOpen, setSmsCreditsModalOpen] = useState(false);

    const closeLicModal = () => {
        setLicModalOpen(false);
        if (searchParams.has('add')) {
            const next = new URLSearchParams(searchParams);
            next.delete('add');
            setSearchParams(next, { replace: true });
        }
    };

    /** The backend sends the product name in English; show it in the UI language. */
    const productLabel = (name: string | null | undefined): string => {
        if (name === 'Free Trial') return t('subscription.product.freeTrial');
        if (name === 'Standard') return t('subscription.product.standard');
        return name || '–';
    };
    const [companyLanguages, setCompanyLanguages] = useState<string[]>(user?.companyLanguages ?? ['da']);
    const [wbRequesting, setWbRequesting] = useState(false);
    // Extra handbooks and SOP are bought through CompanyFlow, not self-served,
    // so these buttons raise a request rather than opening a purchase page —
    // the same way licences, SMS credits, languages and whistleblower do.
    const [productRequesting, setProductRequesting] = useState<'manuals' | 'sop' | null>(null);

    const handleRequestProduct = async (product: 'manuals' | 'sop') => {
        setProductRequesting(product);
        try {
            await accountApi.requestProduct(product);
            toast.success(t('subscription.request.requested'));
        } catch {
            toast.error(t('subscription.request.requestError'));
        } finally {
            setProductRequesting(null);
        }
    };

    const handleRequestWhistleblower = async () => {
        setWbRequesting(true);
        try {
            await accountApi.requestWhistleblowerAccess();
            toast.success(t('subscription.whistleblower.requested'));
        } catch {
            toast.error(t('subscription.whistleblower.requestError'));
        } finally {
            setWbRequesting(false);
        }
    };

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
                about: <span className="text-sm text-[#374151]">{productLabel(data.productName)}</span>,
                actions: [],
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
                        {t('subscription.row.licensesUsed', { used: formatNumber(data.licensesUsed), total: formatNumber(data.licensesTotal) })}
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
                        {data.smsCreditsTotal > 0 && ` ${t('subscription.row.smsCap', { cap: formatNumber(data.smsCreditsTotal) })}`}
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
                        {companyLanguages.map(languageName).join(', ')}
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
                    {
                        label: productRequesting === 'manuals'
                            ? t('subscription.request.requesting')
                            : t('subscription.request.manuals'),
                        onClick: () => handleRequestProduct('manuals'),
                    },
                    { label: t('subscription.action.readMore'), onClick: () => window.open(marketingLinks.extraHandbook, '_blank', 'noopener,noreferrer') },
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
                    ...(data.whistleblowerAccess
                        ? []
                        : [{
                            label: wbRequesting
                                ? t('subscription.whistleblower.requesting')
                                : t('subscription.whistleblower.request'),
                            onClick: handleRequestWhistleblower,
                        }]),
                    { label: t('subscription.action.readMore'), onClick: () => window.open(marketingLinks.whistleblower, '_blank', 'noopener,noreferrer') },
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
                    {
                        label: productRequesting === 'sop'
                            ? t('subscription.request.requesting')
                            : t('subscription.request.sop'),
                        onClick: () => handleRequestProduct('sop'),
                    },
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

            {/* Buy licences / SMS credits — need the current totals for the confirm step */}
            {data && (
                <>
                    <BuyQuantityModal
                        product="licenses"
                        open={licModalOpen}
                        onClose={closeLicModal}
                        currentTotal={data.licensesTotal}
                        onPurchased={() => refetch()}
                    />
                    <BuyQuantityModal
                        product="sms"
                        open={smsCreditsModalOpen}
                        onClose={() => setSmsCreditsModalOpen(false)}
                        currentTotal={data.smsCreditsTotal}
                        onPurchased={() => refetch()}
                    />
                </>
            )}
        </PageShell>
    );
};
