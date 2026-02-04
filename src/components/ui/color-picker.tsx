import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ColorPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    onChange: (color: string) => void;
}

const PRESET_COLORS = [
    // Row 1 - Vibrant colors
    ['#00BCD4', '#0097A7', '#2196F3', '#5C6BC0', '#7E57C2', '#E91E63', '#F44336', '#FF5722', '#FF9800', '#FFC107', '#8BC34A', '#00BFA5'],
    // Row 2 - Medium tones
    ['#4DD0E1', '#26C6DA', '#42A5F5', '#7986CB', '#9575CD', '#F06292', '#EF5350', '#FF7043', '#FFB74D', '#FFD54F', '#AED581', '#4DB6AC'],
    // Row 3 - Light tones
    ['#B3E5FC', '#B2EBF2', '#90CAF9', '#B39DDB', '#CE93D8', '#F8BBD0', '#FFCCBC', '#FFE0B2', '#FFF9C4', '#E0F2F1', '#E0E0E0', '#FFFFFF'],
];

// Helper functions
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h: number, s: number, v: number) => {
    let r, g, b;
    h /= 360; s /= 100; v /= 100;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = 0; g = 0; b = 0; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
    open,
    onOpenChange,
    value,
    onChange,
}) => {
    const [activeTab, setActiveTab] = useState<'grid' | 'spectrum' | 'slider'>('grid');
    const [opacity, setOpacity] = useState(100);
    const [tempColor, setTempColor] = useState(value);
    const [savedColors, setSavedColors] = useState<string[]>(['#000000', '#2196F3', '#FF5722', '#E91E63', '#4CAF50', '#FFC107']);

    // Internal state for RGB/HSV
    const [rgb, setRgb] = useState(hexToRgb(value));
    const [hsv, setHsv] = useState(rgbToHsv(rgb.r, rgb.g, rgb.b));

    const spectrumRef = useRef<HTMLDivElement>(null);

    // Update tempColor when value changes
    useEffect(() => {
        setTempColor(value);
        const newRgb = hexToRgb(value);
        setRgb(newRgb);
        setHsv(rgbToHsv(newRgb.r, newRgb.g, newRgb.b));
    }, [value]);

    const handleColorSelect = (color: string) => {
        setTempColor(color);
        const newRgb = hexToRgb(color);
        setRgb(newRgb);
        setHsv(rgbToHsv(newRgb.r, newRgb.g, newRgb.b));
        onChange(color);

        if (!savedColors.includes(color)) {
            setSavedColors([color, ...savedColors.slice(0, 5)]);
        }
    };

    const updateColorFromRgb = (r: number, g: number, b: number) => {
        const hex = rgbToHex(r, g, b);
        setRgb({ r, g, b });
        setHsv(rgbToHsv(r, g, b));
        setTempColor(hex);
        onChange(hex);
    };

    const updateColorFromHsv = (h: number, s: number, v: number) => {
        const rgbVal = hsvToRgb(h, s, v);
        const hex = rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b);
        setHsv({ h, s, v });
        setRgb(rgbVal);
        setTempColor(hex);
        onChange(hex);
    };

    const handleSpectrumMouseDown = (e: React.MouseEvent) => {
        if (!spectrumRef.current) return;
        const rect = spectrumRef.current.getBoundingClientRect();

        const handleMove = (clientX: number, clientY: number) => {
            const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

            updateColorFromHsv(hsv.h, x * 100, (1 - y) * 100);
        };

        handleMove(e.clientX, e.clientY);

        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleAddToSaved = () => {
        if (!savedColors.includes(tempColor)) {
            setSavedColors([tempColor, ...savedColors.slice(0, 5)]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[420px] p-0 gap-0 bg-white rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="text-xl font-bold text-[#0d0e0e]">Colors</h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-5 pb-4">
                    <div className="flex items-center bg-gray-100/80 p-1 rounded-full">
                        <button
                            onClick={() => setActiveTab('grid')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === 'grid'
                                ? 'bg-white text-[#0d0e0e] shadow-sm'
                                : 'bg-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            GRID
                        </button>
                        <button
                            onClick={() => setActiveTab('spectrum')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === 'spectrum'
                                ? 'bg-white text-[#0d0e0e] shadow-sm'
                                : 'bg-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            SPECTRUM
                        </button>
                        <button
                            onClick={() => setActiveTab('slider')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === 'slider'
                                ? 'bg-white text-[#0d0e0e] shadow-sm'
                                : 'bg-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            SLIDER
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-5 pb-5">
                    {/* Tab Content */}
                    <div className="mb-4 h-[164px]">
                        {activeTab === 'grid' && (
                            <div className="bg-gray-50 rounded-xl p-2.5 space-y-1.5 h-full">
                                {PRESET_COLORS.map((row, rowIndex) => (
                                    <div key={rowIndex} className="flex gap-1.5 justify-center">
                                        {row.map((color, colIndex) => (
                                            <button
                                                key={`${rowIndex}-${colIndex}`}
                                                onClick={() => handleColorSelect(color)}
                                                className={`w-6 h-6 rounded border transition-all hover:scale-110 ${tempColor.toUpperCase() === color.toUpperCase()
                                                    ? 'border-gray-800 ring-1 ring-gray-400'
                                                    : 'border-white'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'spectrum' && (
                            <div className="space-y-4">
                                <div
                                    ref={spectrumRef}
                                    className="relative w-full h-32 rounded-lg cursor-crosshair overflow-hidden border border-gray-200"
                                    style={{
                                        backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                                    }}
                                    onMouseDown={handleSpectrumMouseDown}
                                >
                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />
                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }} />
                                    <div
                                        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg -translate-x-2 -translate-y-2 pointer-events-none"
                                        style={{
                                            left: `${hsv.s}%`,
                                            top: `${100 - hsv.v}%`,
                                            backgroundColor: tempColor
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="relative h-4 rounded-full overflow-hidden">
                                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            value={hsv.h}
                                            onChange={(e) => updateColorFromHsv(Number(e.target.value), hsv.s, hsv.v)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div
                                            className="absolute top-0 w-2 h-full bg-white border border-gray-400 rounded-sm shadow pointer-events-none -translate-x-1"
                                            style={{ left: `${(hsv.h / 360) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'slider' && (
                            <div className="space-y-4 py-2">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold w-4">R</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={rgb.r}
                                            onChange={(e) => updateColorFromRgb(Number(e.target.value), rgb.g, rgb.b)}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg cursor-pointer accent-[#2f946f]"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="255"
                                            value={rgb.r}
                                            onChange={(e) => updateColorFromRgb(Number(e.target.value), rgb.g, rgb.b)}
                                            className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold w-4">G</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={rgb.g}
                                            onChange={(e) => updateColorFromRgb(rgb.r, Number(e.target.value), rgb.b)}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg cursor-pointer accent-[#2f946f]"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="255"
                                            value={rgb.g}
                                            onChange={(e) => updateColorFromRgb(rgb.r, Number(e.target.value), rgb.b)}
                                            className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold w-4">B</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={rgb.b}
                                            onChange={(e) => updateColorFromRgb(rgb.r, rgb.g, Number(e.target.value))}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg cursor-pointer accent-[#2f946f]"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="255"
                                            value={rgb.b}
                                            onChange={(e) => updateColorFromRgb(rgb.r, rgb.g, Number(e.target.value))}
                                            className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Common Controls (Opacity & Saved Colors) */}
                    <div className="space-y-4">
                        {/* Opacity Slider */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Opacity
                                </label>
                                <div className="px-2 py-0.5 border border-gray-200 rounded-full text-[10px] font-medium min-w-[36px] text-center">
                                    {opacity}%
                                </div>
                            </div>
                            <div className="relative h-6 rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: `linear-gradient(to right, rgba(255,255,255,0.2), ${tempColor})`,
                                    }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={opacity}
                                    onChange={(e) => setOpacity(Number(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow pointer-events-none"
                                    style={{ left: `calc(${opacity}% - 8px)` }}
                                />
                            </div>
                        </div>

                        {/* Saved Colors */}
                        <div className="space-y-2 pt-1 border-t border-gray-100">
                            <div className="flex items-start gap-3 pt-2">
                                {/* Large preview */}
                                <div
                                    className="w-14 h-14 rounded-lg shadow-sm flex-shrink-0 border border-gray-100"
                                    style={{ backgroundColor: tempColor }}
                                />

                                {/* Saved colors and hex */}
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-xs font-semibold text-[#0d0e0e]">
                                        Saved colors
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                        {savedColors.map((color, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleColorSelect(color)}
                                                className={`w-7 h-7 rounded-full border transition-all hover:scale-110 shadow-sm ${tempColor.toUpperCase() === color.toUpperCase()
                                                    ? 'border-gray-800 ring-1 ring-gray-400'
                                                    : 'border-white'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                        <button
                                            onClick={handleAddToSaved}
                                            className="w-7 h-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-all text-sm"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="text-xs text-[#0d0e0e]">
                                        Hex: <span className="font-bold font-mono">{tempColor.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
