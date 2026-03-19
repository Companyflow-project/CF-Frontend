import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HelpBanner } from '@/components/ui/help-banner';
import { ColorPicker } from '@/components/ui/color-picker';
import { toast } from 'sonner';
import { useCompanyAppearance, useUpdateCompanyAppearance } from '../hooks';
import { useAppearance, DEFAULT_CONSOLE_COLORS } from '@/context/appearance-context';

const CONSOLE_COLOR_KEYS = [
  'cfNavBg',
  'cfNavText',
  'cfPageHeadline',
  'cfPageSubhead',
  'cfCardBg',
  'cfCardHeading',
  'cfCardBtn',
  'cfCardBtnText',
  'cfCardText',
  'cfCardIcon',
  'cfPrimaryBtn',
  'cfPrimaryBtnText',
  'cfSecondaryBtn',
  'cfSecondaryBtnText',
  'cfLinks',
] as const;

interface ColorSetting {
    id: string;
    label: string;
    description: string;
    value: string;
}

const isValidHex = (value: string): boolean =>
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);

export const AppearancePage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('account');
    const { t: tCommon } = useTranslation('common');
    const [pictureType, setPictureType] = useState<'own' | 'small' | 'photographs'>('own');
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

    const { data: appearanceData } = useCompanyAppearance();
    const updateAppearanceMutation = useUpdateCompanyAppearance();
    const { refresh: refreshAppearance } = useAppearance();

    const [colors, setColors] = useState<ColorSetting[]>(() =>
        CONSOLE_COLOR_KEYS.map((id) => ({
            id,
            label: t(`appearance.color.${id}`),
            description: t(`appearance.color.${id}.desc`),
            value: DEFAULT_CONSOLE_COLORS[id],
        }))
    );

    useEffect(() => {
        if (appearanceData) {
            const validTypes = ['own', 'small', 'photographs'] as const;
            const loaded = appearanceData.pictureType;
            setPictureType(validTypes.includes(loaded as any) ? loaded as typeof validTypes[number] : 'own');

            if (appearanceData.colors) {
                setColors(prevColors => prevColors.map(color => ({
                    ...color,
                    value: appearanceData.colors[color.id] || color.value
                })));
            }
        }
    }, [appearanceData]);

    const handleColorChange = (id: string, newValue: string) => {
        setColors(colors.map(color =>
            color.id === id ? { ...color, value: newValue } : color
        ));
    };

    const handleColorSquareClick = (id: string) => {
        setSelectedColorId(id);
        setIsColorPickerOpen(true);
    };

    const handleResetColors = () => {
        if (window.confirm(t('appearance.resetConfirm'))) {
            setColors(colors.map(color => ({ ...color, value: DEFAULT_CONSOLE_COLORS[color.id] || '#3d997d' })));
            toast.success(t('appearance.resetSuccess'));
        }
    };

    const handleSaveUpdates = () => {
        const invalidColors = colors.filter(c => !isValidHex(c.value));
        if (invalidColors.length > 0) {
            toast.error(t('appearance.invalidColors', { names: invalidColors.map(c => c.label).join(', ') }));
            return;
        }

        const colorsPayload = colors.reduce((acc, color) => {
            acc[color.id] = color.value;
            return acc;
        }, {} as Record<string, string>);

        updateAppearanceMutation.mutate({
            pictureType,
            colors: colorsPayload
        }, {
            onSuccess: () => {
                refreshAppearance();
                toast.success(t('appearance.saveSuccess'));
            },
            onError: () => {
                toast.error(t('appearance.saveFailed'));
            }
        });
    };

    return (
        <PageShell>
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/account')}
                            className="h-9 px-3"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            {tCommon('back')}
                        </Button>
                        <h1 className="text-2xl font-bold text-[#0d0e0e]">{t('appearance.title')}</h1>
                    </div>
                </div>

                <HelpBanner className="mb-6">
                    {t('appearance.helpBanner')}
                </HelpBanner>

                {/* Pictures Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-[#0d0e0e] mb-4">{t('appearance.pictures')}</h2>

                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            {t('appearance.picturesFor')}
                        </p>
                        <p className="text-xs text-gray-500">
                            {t('appearance.picturesChoose')}
                        </p>

                        <div className="flex items-center gap-6">
                            {(['own', 'small', 'photographs'] as const).map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="pictureType"
                                        value={type}
                                        checked={pictureType === type}
                                        onChange={(e) => setPictureType(e.target.value as any)}
                                        className="w-4 h-4 text-[#2f946f] focus:ring-[#2f946f]"
                                    />
                                    <span className="text-sm text-[#0d0e0e]">
                                        {t(`appearance.${type === 'own' ? 'ownPictures' : type === 'small' ? 'smallPictures' : 'photographs'}`)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Colors Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-[#0d0e0e] mb-4">{t('appearance.colors')}</h2>

                    <div className="space-y-1">
                        {colors.map((color) => (
                            <div key={color.id} className="grid grid-cols-[200px_120px_1fr] gap-4 items-center py-3 border-b border-gray-100 last:border-0">
                                <Label className="text-sm font-semibold text-[#0d0e0e]">
                                    {color.label}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleColorSquareClick(color.id)}
                                        className="w-6 h-6 rounded flex-shrink-0 border border-gray-300 cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all"
                                        style={{ backgroundColor: color.value }}
                                        title={t('appearance.colorPicker')}
                                    />
                                    <Input
                                        type="text"
                                        value={color.value}
                                        onChange={(e) => handleColorChange(color.id, e.target.value)}
                                        className={`h-8 w-[85px] font-mono text-xs ${!isValidHex(color.value) ? 'border-red-400 focus:ring-red-400' : ''}`}
                                        placeholder="#3D997D"
                                    />
                                </div>
                                <p className="text-sm text-gray-500">
                                    {color.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={handleResetColors}
                        className="px-6"
                    >
                        {t('appearance.resetColors')}
                    </Button>
                    <Button
                        onClick={handleSaveUpdates}
                        disabled={updateAppearanceMutation.isPending}
                        className="px-6"
                        style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                    >
                        {updateAppearanceMutation.isPending ? tCommon('saving') : t('appearance.saveUpdates')}
                    </Button>
                </div>

                {/* Color Picker Dialog */}
                {selectedColorId && (
                    <ColorPicker
                        open={isColorPickerOpen}
                        onOpenChange={setIsColorPickerOpen}
                        value={colors.find(c => c.id === selectedColorId)?.value || DEFAULT_CONSOLE_COLORS[selectedColorId] || '#3d997d'}
                        onChange={(newColor) => handleColorChange(selectedColorId, newColor)}
                    />
                )}
            </div>
        </PageShell>
    );
};
