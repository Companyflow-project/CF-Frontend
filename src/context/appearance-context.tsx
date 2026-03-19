import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, type CompanyAppearance } from '@/features/account/api';
import { useAuth } from './auth-context';

/**
 * Handbook color defaults — always injected as --hb-* CSS variables.
 * These are NOT customizable via the appearance page; handbook uses fixed defaults.
 */
const HANDBOOK_COLOR_DEFAULTS: Record<string, string> = {
  '--hb-top-bottom': '#1a5948',
  '--hb-headlines': '#1a5948',
  '--hb-body-text': '#374151',
  '--hb-light-background': '#f8faf9',
  '--hb-confirmation-button': '#2f946f',
  '--hb-top-button': '#3d997d',
  '--hb-text-on-top-buttons': '#ffffff',
  '--hb-structure-button': '#3d997d',
  '--hb-cancel-button': '#dc2626',
  '--hb-big-button': '#3d997d',
  '--hb-button-text': '#ffffff',
  '--hb-frame-color': '#e5efea',
  '--hb-html-background': '#f9fafb',
  '--hb-page-background': '#ffffff',
  '--hb-links': '#3d997d',
};

/**
 * Legacy key → default value map used by handbook components via getColor().
 * Kept so existing getColor('headlines') calls keep working.
 */
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

/** Maps console color storage keys to CSS custom property names. */
const CONSOLE_COLOR_CSS_VAR_MAP: Record<string, string> = {
  cfNavBg: '--cf-nav-bg',
  cfNavText: '--cf-nav-text',
  cfPageHeadline: '--cf-page-headline',
  cfPageSubhead: '--cf-page-subhead',
  cfCardBg: '--cf-card-bg',
  cfCardHeading: '--cf-card-heading',
  cfCardBtn: '--cf-card-btn',
  cfCardBtnText: '--cf-card-btn-text',
  cfCardText: '--cf-card-text',
  cfCardIcon: '--cf-card-icon',
  cfPrimaryBtn: '--cf-primary-btn',
  cfPrimaryBtnText: '--cf-primary-btn-text',
  cfSecondaryBtn: '--cf-secondary-btn',
  cfSecondaryBtnText: '--cf-secondary-btn-text',
  cfLinks: '--cf-links',
};

/** Default console color values. */
export const DEFAULT_CONSOLE_COLORS: Record<string, string> = {
  cfNavBg: '#000000',
  cfNavText: '#ffffff',
  cfPageHeadline: '#0b0c0c',
  cfPageSubhead: '#6b7280',
  cfCardBg: '#ffffff',
  cfCardHeading: '#0d0e0e',
  cfCardBtn: '#d4f4e6',
  cfCardBtnText: '#1a5948',
  cfCardText: '#6b7280',
  cfCardIcon: '#1a5948',
  cfPrimaryBtn: '#3d997d',
  cfPrimaryBtnText: '#ffffff',
  cfSecondaryBtn: '#e5e7eb',
  cfSecondaryBtnText: '#0d0e0e',
  cfLinks: '#3d997d',
};

interface AppearanceContextType {
  appearance: CompanyAppearance | null;
  loading: boolean;
  /** Get a resolved handbook color value (always returns defaults) */
  getColor: (key: string) => string;
  /** Get a resolved console color value (saved or default) */
  getConsoleColor: (key: string) => string;
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
    staleTime: 5 * 60 * 1000,
  });

  // Handbook getColor always returns defaults (no longer customizable)
  const getColor = useMemo(() => {
    return (key: string): string => DEFAULT_APPEARANCE_COLORS[key] || '#000000';
  }, []);

  // Console getConsoleColor reads saved values with fallback to defaults
  const getConsoleColor = useMemo(() => {
    const colors = appearance?.colors ?? {};
    return (key: string): string => colors[key] || DEFAULT_CONSOLE_COLORS[key] || '#000000';
  }, [appearance]);

  // Inject CSS custom properties on <html>
  useEffect(() => {
    const root = document.documentElement;

    // Inject handbook defaults (static)
    for (const [cssVar, value] of Object.entries(HANDBOOK_COLOR_DEFAULTS)) {
      root.style.setProperty(cssVar, value);
    }

    // Inject console colors (dynamic from saved appearance)
    for (const [key, cssVar] of Object.entries(CONSOLE_COLOR_CSS_VAR_MAP)) {
      root.style.setProperty(cssVar, getConsoleColor(key));
    }

    return () => {
      for (const cssVar of Object.values(HANDBOOK_COLOR_DEFAULTS)) {
        root.style.removeProperty(cssVar);
      }
      for (const cssVar of Object.values(CONSOLE_COLOR_CSS_VAR_MAP)) {
        root.style.removeProperty(cssVar);
      }
    };
  }, [getConsoleColor]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['company-appearance'] });
  };

  return (
    <AppearanceContext.Provider value={{ appearance, loading, getColor, getConsoleColor, refresh }}>
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
