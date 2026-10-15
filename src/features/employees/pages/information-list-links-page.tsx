import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { employeesRoutes } from '../routes';
import { openUserManual } from '@/features/user-manual/topics';
import { INFO_LIST_FIXED_LINK_KEYS, type InfoListFixedLinkKey, type InfoListLinks } from '../api';
import { useInfoListLinks, useSaveInfoListLinks } from '../hooks';

interface OtherLink {
    id: number;
    text: string;
    url: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Same labels the Info List itself uses for these links (infoList.link*). */
const FIXED_LINK_LABEL_KEYS: Record<InfoListFixedLinkKey, string> = {
    homepage: 'infoList.linkHomepage',
    drivesheet: 'infoList.linkDrivesheet',
    firePlan: 'infoList.linkFirePlan',
    gdpr: 'infoList.linkGdpr',
    intranet: 'infoList.linkIntranet',
    timesheet: 'infoList.linkTimesheet',
};

const FIXED_LINK_PLACEHOLDER = 'https://www.example.dk';

let nextRowId = 1;
const emptyRow = (): OtherLink => ({ id: nextRowId++, text: '', url: '' });

/**
 * "www.example.dk" -> "https://www.example.dk". Returns null for anything that
 * is not a usable web/mail/phone link (the backend applies the same rule).
 */
function normalizeUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value) return '';
    if (/^(mailto|tel):\S+$/i.test(value)) return value;
    if (!/^https?:\/\//i.test(value) && /^[a-z][a-z0-9+-]*:(?!\d)/i.test(value)) return null;
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`;
    try {
        const url = new URL(withScheme);
        if (!url.hostname || /\s/.test(withScheme)) return null;
    } catch {
        return null;
    }
    return withScheme;
}

const toRows = (links: InfoListLinks): OtherLink[] =>
    links.otherLinks.length > 0
        ? links.otherLinks.map((l) => ({ id: nextRowId++, text: l.title, url: l.url }))
        : [emptyRow()];

// ─── Component ────────────────────────────────────────────────────────────────

export const InformationListLinksPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('employees');
    const { t: tCommon } = useTranslation('common');

    const { data: savedLinks, isLoading, error: loadError } = useInfoListLinks();
    const saveLinks = useSaveInfoListLinks();

    // Build translated labels using useMemo so they update on language change
    const predefinedLabels = useMemo(
        () =>
            INFO_LIST_FIXED_LINK_KEYS.map((key) => ({
                label: t(FIXED_LINK_LABEL_KEYS[key]),
                key,
                placeholder: FIXED_LINK_PLACEHOLDER,
            })),
        [t],
    );

    // Predefined links: keyed by slug, value is the URL string
    const [predefined, setPredefined] = useState<Record<string, string>>(
        Object.fromEntries(INFO_LIST_FIXED_LINK_KEYS.map((key) => [key, '']))
    );

    // Other / custom links
    const [otherLinks, setOtherLinks] = useState<OtherLink[]>(() => [emptyRow()]);

    // Fill the form once the company's saved links have loaded.
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        if (!savedLinks || loaded) return;
        setPredefined(Object.fromEntries(INFO_LIST_FIXED_LINK_KEYS.map((key) => [key, savedLinks[key]])));
        setOtherLinks(toRows(savedLinks));
        setLoaded(true);
    }, [savedLinks, loaded]);

    const saving = saveLinks.isPending;
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ── Predefined handlers ──────────────────────────────────────────────────

    const handlePredefinedChange = (key: string, value: string) => {
        setPredefined((prev) => ({ ...prev, [key]: value }));
    };

    // ── Other links handlers ─────────────────────────────────────────────────

    const handleOtherChange = (id: number, field: 'text' | 'url', value: string) => {
        setOtherLinks((prev) =>
            prev.map((link) => (link.id === id ? { ...link, [field]: value } : link))
        );
    };

    const handleAddOtherLink = () => {
        setOtherLinks((prev) => [...prev, emptyRow()]);
    };

    const handleRemoveOtherLink = (id: number) => {
        setOtherLinks((prev) => prev.filter((l) => l.id !== id));
    };

    // ── Save logic ────────────────────────────────────────────────────────────

    /** Validated payload, or null after showing what needs fixing. */
    const buildPayload = () => {
        const invalid: string[] = [];
        const fixed: Record<string, string> = {};
        for (const { key, label } of predefinedLabels) {
            const url = normalizeUrl(predefined[key] ?? '');
            if (url === null) invalid.push(label);
            else fixed[key] = url;
        }
        const others: { title: string; url: string }[] = [];
        for (const link of otherLinks) {
            const title = link.text.trim();
            if (!title && !link.url.trim()) continue; // emptied row = deleted link
            const url = normalizeUrl(link.url);
            if (!url) {
                invalid.push(title || link.url.trim());
                continue;
            }
            others.push({ title, url });
        }
        if (invalid.length > 0) {
            setErrorMessage(t('infoListLinks.invalidLinks', { links: invalid.join(', ') }));
            return null;
        }
        return { ...fixed, otherLinks: others };
    };

    const handleSave = async (): Promise<boolean> => {
        setSuccessMessage(null);
        setErrorMessage(null);
        const payload = buildPayload();
        if (!payload) return false;
        try {
            const saved = await saveLinks.mutateAsync(payload);
            // Show what was stored (e.g. "https://" added, emptied rows gone).
            setPredefined(Object.fromEntries(INFO_LIST_FIXED_LINK_KEYS.map((key) => [key, saved[key]])));
            setOtherLinks(toRows(saved));
            setSuccessMessage(t('infoListLinks.linksSaved'));
            return true;
        } catch {
            setErrorMessage(t('infoListLinks.failedToSave'));
            return false;
        }
    };

    const handleSaveAndAdd = async () => {
        // Append a fresh empty row after saving (unless the last row is already empty)
        if (await handleSave()) {
            setOtherLinks((prev) => {
                const last = prev[prev.length - 1];
                return last && !last.text && !last.url ? prev : [...prev, emptyRow()];
            });
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <PageShell>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(employeesRoutes.informationList)}
                    className="flex items-center gap-1.5 rounded-[10px] border-[rgba(15,23,42,0.12)] text-[#0d0e0e] h-9 px-3 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="text-[13px] font-medium">{tCommon('back')}</span>
                </Button>
                <h1 className="text-2xl font-bold text-[#0d0e0e] tracking-tight">{t('infoListLinks.title')}</h1>
            </div>

            {/* Help banner */}
            <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-[#0d0e0e] max-w-2xl">
                        <span className="font-bold">{t('help', { ns: 'common' })}</span>{' '}
                        {t('infoListLinks.helpDesc')}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[11px] py-[9px] h-auto whitespace-nowrap self-start sm:self-auto"
                        onClick={() => openUserManual('info-list-links')}
                    >
                        {t('infoListLinks.readFullGuide')}
                    </Button>
                </div>
            </div>

            {/* Subtext */}
            <p className="text-sm text-[#374151] mb-4">
                {t('infoListLinks.subtext')}
            </p>

            {/* Success / error banners */}
            {isLoading && (
                <div className="mb-4 text-sm text-[#6b7280]">{t('infoListLinks.loading')}</div>
            )}
            {loadError && !loaded && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {t('infoListLinks.failedToLoad')}
                </div>
            )}
            {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {errorMessage}
                </div>
            )}

            {/* Main card */}
            <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)]">
                <CardContent className="pt-6 pb-6 space-y-0">

                    {/* Predefined links */}
                    <div className="divide-y divide-[#f0f4f2]">
                        {predefinedLabels.map(({ label, key, placeholder }) => (
                            <div
                                key={key}
                                className="flex items-center gap-6 py-3 first:pt-0"
                            >
                                <span className="w-44 flex-shrink-0 text-[13.5px] font-semibold text-[#111827]">
                                    {label}
                                </span>
                                <Input
                                    id={`link-${key}`}
                                    type="url"
                                    placeholder={placeholder}
                                    value={predefined[key]}
                                    onChange={(e) => handlePredefinedChange(key, e.target.value)}
                                    className="flex-1 h-9 text-sm border-[#d1d5db] bg-[#f9fafb] rounded-lg focus:bg-white transition-colors"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Other links section */}
                    <div className="pt-6">
                        <p className="text-[13.5px] font-semibold text-[#111827] mb-3">{t('infoListLinks.otherLinks')}</p>

                        {/* Column headers */}
                        <div className="flex items-center gap-3 mb-2 pl-0">
                            <span className="flex-1 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                                {t('infoListLinks.colText')}
                            </span>
                            <span className="flex-[2] text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                                {t('infoListLinks.colLink')}
                            </span>
                            <span className="w-8" />
                        </div>

                        {/* Existing / filled rows */}
                        <div className="space-y-2">
                            {otherLinks.map((link) => (
                                <div key={link.id} className="flex items-center gap-3">
                                    <Input
                                        id={`other-text-${link.id}`}
                                        type="text"
                                        placeholder={t('infoListLinks.addLabelPlaceholder')}
                                        value={link.text}
                                        onChange={(e) => handleOtherChange(link.id, 'text', e.target.value)}
                                        className="flex-1 h-9 text-sm border-[#d1d5db] bg-[#f9fafb] rounded-lg focus:bg-white transition-colors"
                                    />
                                    <Input
                                        id={`other-url-${link.id}`}
                                        type="url"
                                        placeholder={t('infoListLinks.addLinkPlaceholder')}
                                        value={link.url}
                                        onChange={(e) => handleOtherChange(link.id, 'url', e.target.value)}
                                        className="flex-[2] h-9 text-sm border-[#d1d5db] bg-[#f9fafb] rounded-lg focus:bg-white transition-colors"
                                    />
                                    {otherLinks.length > 1 ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-[#9ca3af] hover:text-red-500 hover:bg-red-50 rounded-md flex-shrink-0"
                                            aria-label={t('infoListLinks.removeLink')}
                                            onClick={() => handleRemoveOtherLink(link.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    ) : (
                                        <span className="w-8 flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add another row inline */}
                        <button
                            type="button"
                            onClick={handleAddOtherLink}
                            className="mt-3 flex items-center gap-1.5 text-xs text-[#3d997d] hover:text-[#2c7860] font-medium"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {t('infoListLinks.addAnother')}
                        </button>
                    </div>

                    {/* Note */}
                    <p className="pt-5 text-xs text-[#6b7280] leading-relaxed">
                        <span className="font-semibold text-[#374151]">{t('infoListLinks.noteTitle')}</span>{' '}
                        {t('infoListLinks.noteDesc')}
                    </p>

                    {/* Action buttons */}
                    <div className="pt-5 flex items-center justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => void handleSave()}
                            disabled={saving || !loaded}
                            className="border-[rgba(15,23,42,0.15)] text-[#0d0e0e] rounded-[999px] px-6 h-10 text-[13.3px] bg-white hover:bg-gray-50"
                        >
                            {saving ? tCommon('saving') : tCommon('save')}
                        </Button>
                        <Button
                            onClick={handleSaveAndAdd}
                            disabled={saving || !loaded}
                            className="rounded-[999px] px-6 h-10 text-[13.3px] shadow-[0_8px_20px_rgba(23,102,79,0.32)]"
                            style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                        >
                            {t('infoListLinks.saveAndAdd')}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </PageShell>
    );
};
