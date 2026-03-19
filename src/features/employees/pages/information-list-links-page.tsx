import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { employeesRoutes } from '../routes';




interface OtherLink {
    id: number;
    text: string;
    url: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PREDEFINED_KEYS = [
    { key: 'travelAllowance', placeholder: 'https://example.com/travel-allowance' },
    { key: 'firePlan', placeholder: 'https://example.com/fire-plan' },
    { key: 'gdpr', placeholder: 'https://example.com/gdpr' },
    { key: 'intranet', placeholder: 'https://example.com/intranet' },
    { key: 'worksheets', placeholder: 'https://example.com/worksheet' },
    { key: 'homepage', placeholder: 'https://example.com' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export const InformationListLinksPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('employees');
    const { t: tCommon } = useTranslation('common');

    // Build translated labels using useMemo so they update on language change
    const predefinedLabels = useMemo(
        () =>
            PREDEFINED_KEYS.map(({ key, placeholder }) => ({
                label: t(`infoListLinks.${key}`),
                key,
                placeholder,
            })),
        [t],
    );

    // Predefined links: keyed by slug, value is the URL string
    const [predefined, setPredefined] = useState<Record<string, string>>(
        Object.fromEntries(PREDEFINED_KEYS.map((l) => [l.key, '']))
    );

    // Other / custom links
    const [otherLinks, setOtherLinks] = useState<OtherLink[]>([
        { id: 1, text: '', url: '' },
    ]);

    const [saving, setSaving] = useState(false);
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
        setOtherLinks((prev) => [
            ...prev,
            { id: Date.now(), text: '', url: '' },
        ]);
    };

    const handleRemoveOtherLink = (id: number) => {
        setOtherLinks((prev) => prev.filter((l) => l.id !== id));
    };

    // ── Save logic ────────────────────────────────────────────────────────────

    const buildPayload = () => ({
        predefinedLinks: predefined,
        otherLinks: otherLinks.filter((l) => l.text.trim() || l.url.trim()),
    });

    const handleSave = async () => {
        setSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);
        try {
            // TODO: wire to real API endpoint when available
            // await employeesApi.saveInfoListLinks(buildPayload());
            console.log('Saving info list links:', buildPayload());
            setSuccessMessage(t('infoListLinks.linksSaved'));
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : t('infoListLinks.failedToSave'));
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAndAdd = async () => {
        await handleSave();
        // Append a fresh empty row after saving
        setOtherLinks((prev) => [...prev, { id: Date.now(), text: '', url: '' }]);
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
                        <span className="font-bold">Help.</span>{' '}
                        {t('infoListLinks.helpDesc')}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[11px] py-[9px] h-auto whitespace-nowrap self-start sm:self-auto"
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
                                            aria-label="Remove link"
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
                            onClick={handleSave}
                            disabled={saving}
                            className="border-[rgba(15,23,42,0.15)] text-[#0d0e0e] rounded-[999px] px-6 h-10 text-[13.3px] bg-white hover:bg-gray-50"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </Button>
                        <Button
                            onClick={handleSaveAndAdd}
                            disabled={saving}
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
