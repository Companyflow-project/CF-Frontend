import React, { useState, useEffect } from 'react';
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

interface ColorSetting {
    id: string;
    label: string;
    description: string;
    value: string;
}

export const AppearancePage: React.FC = () => {
    const navigate = useNavigate();
    const [pictureType, setPictureType] = useState<'none' | 'small' | 'photographs'>('none');
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

    const { data: appearanceData } = useCompanyAppearance();
    const updateAppearanceMutation = useUpdateCompanyAppearance();

    const [colors, setColors] = useState<ColorSetting[]>([
        { id: 'topBottom', label: 'Top and bottom', description: 'Top of page behind company name or logo', value: '#3D99FD' },
        { id: 'headlines', label: 'Headlines', description: 'Headings on pages and sections in h9', value: '#3D99FD' },
        { id: 'bodyText', label: 'Body text', description: 'Plain text, paragraphs, lists', value: '#3D99FD' },
        { id: 'lightBackground', label: 'Light background', description: 'Lighter background e.g. in certain forms', value: '#3D99FD' },
        { id: 'confirmationButton', label: 'Confirmation button', description: 'Most buttons, e.g. confirm, save, next, previous', value: '#3D99FD' },
        { id: 'topButton', label: 'Top button', description: 'The buttons on the right of the top of the page', value: '#3D99FD' },
        { id: 'textOnTopButtons', label: 'Text on top buttons', description: 'Text on buttons in header (top right)', value: '#3D99FD' },
        { id: 'structureButton', label: 'Structure button', description: 'Structure Control Buttons (All Pages)', value: '#3D99FD' },
        { id: 'cancelButton', label: 'Cancel button', description: 'Cancel and delete buttons', value: '#3D99FD' },
        { id: 'bigButton', label: 'Big button', description: 'Buttons on the employee control panel', value: '#3D99FD' },
        { id: 'buttonText', label: 'Button text', description: 'Text on buttons', value: '#3D99FD' },
        { id: 'frameColor', label: 'Frame color', description: 'Thin lines around cards/ fields and surfaces', value: '#3D99FD' },
        { id: 'htmlBackground', label: 'HTML background', description: 'Full screen background color', value: '#3D99FD' },
        { id: 'pageBackground', label: 'Page background', description: 'Background color of the page content', value: '#3D99FD' },
        { id: 'links', label: 'Links', description: 'The color of link text on manual pages', value: '#3D99FD' },
    ]);

    useEffect(() => {
        if (appearanceData) {
            setPictureType(appearanceData.pictureType as any || 'none');

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
        if (window.confirm('Are you sure you want to reset all colors to default?')) {
            setColors(colors.map(color => ({ ...color, value: '#3D99FD' })));
            toast.success('Colors reset to default');
        }
    };

    const handleSaveUpdates = () => {
        const colorsPayload = colors.reduce((acc, color) => {
            acc[color.id] = color.value;
            return acc;
        }, {} as Record<string, string>);

        updateAppearanceMutation.mutate({
            pictureType,
            colors: colorsPayload
        }, {
            onSuccess: () => {
                toast.success('Appearance settings saved successfully');
            },
            onError: () => {
                toast.error('Failed to save appearance settings');
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
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-[#0d0e0e]">Appearance</h1>
                    </div>
                </div>

                {/* Help Banner */}
                <HelpBanner className="mb-6">
                    Here you can set visual elements in your handbook. You must choose whether to display images in Diagona texts, what type of images they should be, and whether you want to use special colors on the pages.
                </HelpBanner>

                {/* Pictures Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-[#0d0e0e] mb-4">Pictures</h2>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">
                            Pictures for CompanyFlow's texts
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                            Choose what types of illustrations you want for CompanyFlow's texts in the handbook.
                        </p>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="pictureType"
                                    value="none"
                                    checked={pictureType === 'none'}
                                    onChange={(e) => setPictureType(e.target.value as any)}
                                    className="w-4 h-4 text-[#2f946f] focus:ring-[#2f946f]"
                                />
                                <span className="text-sm text-[#0d0e0e]">Own pictures</span>
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
                                <span className="text-sm text-[#0d0e0e]">Small pictures</span>
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
                                <span className="text-sm text-[#0d0e0e]">Photographs</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Colors Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-[#0d0e0e] mb-4">Colors</h2>

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
                                        title="Click to open color picker"
                                    />
                                    <Input
                                        type="text"
                                        value={color.value}
                                        onChange={(e) => handleColorChange(color.id, e.target.value)}
                                        className="h-9 w-24 font-mono text-xs"
                                        placeholder="#3D99FD"
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
                        Reset colors
                    </Button>
                    <Button
                        onClick={handleSaveUpdates}
                        disabled={updateAppearanceMutation.isPending}
                        className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white px-6"
                    >
                        {updateAppearanceMutation.isPending ? 'Saving...' : 'Save updates'}
                    </Button>
                </div>

                {/* Color Picker Dialog */}
                {selectedColorId && (
                    <ColorPicker
                        open={isColorPickerOpen}
                        onOpenChange={setIsColorPickerOpen}
                        value={colors.find(c => c.id === selectedColorId)?.value || '#3D99FD'}
                        onChange={(newColor) => handleColorChange(selectedColorId, newColor)}
                    />
                )}
            </div>
        </PageShell>
    );
};
