import React from 'react';
import { useState } from 'react';
import { Globe } from 'lucide-react';

const STORAGE_KEY = 'handbook-lang';

function getStoredLang(): 'da' | 'en' {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === 'en') return 'en';
    } catch { /* SSR / private browsing */ }
    return 'da';
}

export function useHandbookLang() {
    const [lang, setLangState] = useState<'da' | 'en'>(getStoredLang);

    const setLang = (next: 'da' | 'en') => {
        setLangState(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    };

    return [lang, setLang] as const;
}

interface LanguageToggleProps {
    value: 'da' | 'en';
    onChange: (lang: 'da' | 'en') => void;
    disabled?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ value, onChange, disabled }) => {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-1.5 py-1 shadow-sm">
            <Globe className="h-3.5 w-3.5 text-gray-400 ml-1.5" />
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange('da')}
                className={`
                    relative rounded-full px-3 py-1 text-xs font-medium transition-all duration-200
                    ${value === 'da'
                        ? 'bg-[#0d0e0e] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                DA
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange('en')}
                className={`
                    relative rounded-full px-3 py-1 text-xs font-medium transition-all duration-200
                    ${value === 'en'
                        ? 'bg-[#0d0e0e] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                EN
            </button>
        </div>
    );
};
