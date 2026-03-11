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
import { useAppearance, DEFAULT_APPEARANCE_COLORS } from '@/context/appearance-context';

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

    const [colors, setColors] = useState<ColorSetting[]>(() => [
        { id: 'topBottom', label: t('appearance.color.topBottom'), description: t('appearance.color.topBottom.desc'), value: DEFAULT_APPEARANCE_COLORS.topBottom },
        { id: 'headlines', label: t('appearance.color.headlines'), description: t('appearance.color.headlines.desc'), value: DEFAULT_APPEARANCE_COLORS.headlines },
        { id: 'bodyText', label: t('appearance.color.bodyText'), description: t('appearance.color.bodyText.desc'), value: DEFAULT_APPEARANCE_COLORS.bodyText },
        { id: 'lightBackground', label: t('appearance.color.lightBackground'), description: t('appearance.color.lightBackground.desc'), value: DEFAULT_APPEARANCE_COLORS.lightBackground },
        { id: 'confirmationButton', label: t('appearance.color.confirmationButton'), description: t('appearance.color.confirmationButton.desc'), value: DEFAULT_APPEARANCE_COLORS.confirmationButton },
        { id: 'topButton', label: t('appearance.color.topButton'), description: t('appearance.color.topButton.desc'), value: DEFAULT_APPEARANCE_COLORS.topButton },
        { id: 'textOnTopButtons', label: t('appearance.color.textOnTopButtons'), description: t('appearance.color.textOnTopButtons.desc'), value: DEFAULT_APPEARANCE_COLORS.textOnTopButtons },
        { id: 'structureButton', label: t('appearance.color.structureButton'), description: t('appearance.color.structureButton.desc'), value: DEFAULT_APPEARANCE_COLORS.structureButton },
        { id: 'cancelButton', label: t('appearance.color.cancelButton'), description: t('appearance.color.cancelButton.desc'), value: DEFAULT_APPEARANCE_COLORS.cancelButton },
        { id: 'bigButton', label: t('appearance.color.bigButton'), description: t('appearance.color.bigButton.desc'), value: DEFAULT_APPEARANCE_COLORS.bigButton },
        { id: 'buttonText', label: t('appearance.color.buttonText'), description: t('appearance.color.buttonText.desc'), value: DEFAULT_APPEARANCE_COLORS.buttonText },
        { id: 'frameColor', label: t('appearance.color.frameColor'), description: t('appearance.color.frameColor.desc'), value: DEFAULT_APPEARANCE_COLORS.frameColor },
        { id: 'htmlBackground', label: t('appearance.color.htmlBackground'), description: t('appearance.color.htmlBackground.desc'), value: DEFAULT_APPEARANCE_COLORS.htmlBackground },
        { id: 'pageBackground', label: t('appearance.color.pageBackground'), description: t('appearance.color.pageBackground.desc'), value: DEFAULT_APPEARANCE_COLORS.pageBackground },
        { id: 'links', label: t('appearance.color.links'), description: t('appearance.color.links.desc'), value: DEFAULT_APPEARANCE_COLORS.links },
    ]);

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
            setColors(colors.map(color => ({ ...color, value: DEFAULT_APPEARANCE_COLORS[color.id] || '#3d997d' })));
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

                {/* Help Banner */}
                <HelpBanner className="mb-6">
                    {t('appearance.helpBanner')}
                </HelpBanner>

                {/* Pictures Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-[#0d0e0e] mb-4">{t('appearance.pictures')}</h2>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">
                            {t('appearance.picturesFor')}
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                            {t('appearance.picturesChoose')}
                        </p>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="pictureType"
                                    value="own"
                                    checked={pictureType === 'own'}
                                    onChange={(e) => setPictureType(e.target.value as any)}
                                    className="w-4 h-4 text-[#2f946f] focus:ring-[#2f946f]"
                                />
                                <span className="text-sm text-[#0d0e0e]">{t('appearance.ownPictures')}</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="pictureType"
                                    value="small"
                                    checked={pictureType === 'small'}
                                    onChange={(e) => setPictureType(e.target.value as any)}
                                    className="w-4 h-4 text-[#2f946f] focus:ring-[#2f946f]"
                                />
                                <span className="text-sm text-[#0d0e0e]">{t('appearance.smallPictures')}</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="pictureType"
                                    value="photographs"
                                    checked={pictureType === 'photographs'}
                                    onChange={(e) => setPictureType(e.target.value as any)}
                                    className="w-4 h-4 text-[#2f946f] focus:ring-[#2f946f]"
                                />
                                <span className="text-sm text-[#0d0e0e]">{t('appearance.photographs')}</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Colors Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-[#0d0e0e] mb-4">{t('appearance.colors')}</h2>

                    <div className="space-y-4">
                        {colors.map((color) => (
                            <div key={color.id} className="grid grid-cols-1 md:grid-cols-[200px_120px_1fr] gap-4 items-center py-3 border-b border-gray-100 last:border-0">
                                <Label className="text-sm font-medium text-[#0d0e0e]">
                                    {color.label}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleColorSquareClick(color.id)}
                                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all"
                                        style={{ backgroundColor: color.value }}
                                        title={t('appearance.colorPicker')}
                                    />
                                    <Input
                                        type="text"
                                        value={color.value}
                                        onChange={(e) => handleColorChange(color.id, e.target.value)}
                                        className={`h-9 w-24 font-mono text-xs ${!isValidHex(color.value) ? 'border-red-400 focus:ring-red-400' : ''}`}
                                        placeholder="#3d997d"
                                    />
                                </div>
                                <p className="text-sm text-gray-600">
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
                        className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white px-6"
                    >
                        {updateAppearanceMutation.isPending ? tCommon('saving') : t('appearance.saveUpdates')}
                    </Button>
                </div>

                {/* Color Picker Dialog */}
                {selectedColorId && (
                    <ColorPicker
                        open={isColorPickerOpen}
                        onOpenChange={setIsColorPickerOpen}
                        value={colors.find(c => c.id === selectedColorId)?.value || DEFAULT_APPEARANCE_COLORS[selectedColorId] || '#3d997d'}
                        onChange={(newColor) => handleColorChange(selectedColorId, newColor)}
                    />
                )}
            </div>
        </PageShell>
    );
};
