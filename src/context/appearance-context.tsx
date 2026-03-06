import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, type CompanyAppearance } from '@/features/account/api';
import { useAuth } from './auth-context';

/**
 * Maps each color key from the appearance settings to a CSS custom property name.
 * These variables are set on <html> and consumed by handbook rendering surfaces.
 */
const COLOR_CSS_VAR_MAP: Record<string, string> = {
  topBottom: '--hb-top-bottom',
  headlines: '--hb-headlines',
  bodyText: '--hb-body-text',
  lightBackground: '--hb-light-background',
  confirmationButton: '--hb-confirmation-button',
  topButton: '--hb-top-button',
  textOnTopButtons: '--hb-text-on-top-buttons',
  structureButton: '--hb-structure-button',
  cancelButton: '--hb-cancel-button',
  bigButton: '--hb-big-button',
  buttonText: '--hb-button-text',
  frameColor: '--hb-frame-color',
  htmlBackground: '--hb-html-background',
  pageBackground: '--hb-page-background',
  links: '--hb-links',
};

/** Default color values used when no appearance settings are configured. */
export const DEFAULT_APPEARANCE_COLORS: Record<string, string> = {
  topBottom: '#1a5948',
  headlines: '#1a5948',
  bodyText: '#374151',
  lightBackground: '#f8faf9',
  confirmationButton: '#2f946f',
  topButton: '#3d997d',
  textOnTopButtons: '#ffffff',
  structureButton: '#3d997d',
  cancelButton: '#dc2626',
  bigButton: '#3d997d',
  buttonText: '#ffffff',
  frameColor: '#e5efea',
  htmlBackground: '#f9fafb',
  pageBackground: '#ffffff',
  links: '#3d997d',
};

interface AppearanceContextType {
  appearance: CompanyAppearance | null;
  loading: boolean;
  /** Get a resolved color value (saved or default) */
  getColor: (key: string) => string;
  /** Invalidate cached appearance (call after saving new settings) */
  refresh: () => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: appearance = null, isLoading: loading } = useQuery({
    queryKey: ['company-appearance'],
    queryFn: () => accountApi.getCompanyAppearance(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getColor = useMemo(() => {
    const colors = appearance?.colors ?? {};
    return (key: string): string => colors[key] || DEFAULT_APPEARANCE_COLORS[key] || '#000000';
  }, [appearance]);

  // Inject CSS custom properties on <html> whenever appearance changes
  useEffect(() => {
    const root = document.documentElement;

    for (const [key, cssVar] of Object.entries(COLOR_CSS_VAR_MAP)) {
      const value = getColor(key);
      root.style.setProperty(cssVar, value);
    }

    return () => {
      // Clean up on unmount
      for (const cssVar of Object.values(COLOR_CSS_VAR_MAP)) {
        root.style.removeProperty(cssVar);
      }
    };
  }, [getColor]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['company-appearance'] });
  };

  return (
    <AppearanceContext.Provider value={{ appearance, loading, getColor, refresh }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = (): AppearanceContextType => {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};
