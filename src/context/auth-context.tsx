import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '@/types/models';
import { authApi } from '@/features/auth/api';
import { clearImpersonation } from '@/features/admin/impersonation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithMagicLink: (token: string) => Promise<void>;
  setUserFromRegister: (user: User) => void;
  logout: () => Promise<void>;
  updateLanguage: (langcode: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  /** Sync i18n language — employee's assigned languages are the source of truth.
   *  If the user's preference isn't in their assigned list, fall back to 'da'. */
  const syncLanguage = useCallback((userData: User | null) => {
    if (!userData) return;
    const availableLangs = userData.employeeLanguages ?? userData.companyLanguages ?? ['da'];
    const preferred = userData.preferredLangcode ?? 'da';
    const lang = availableLangs.includes(preferred) ? preferred : 'da';
    i18n.changeLanguage(lang);
  }, [i18n]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authApi.me();
        setUser(currentUser);
        syncLanguage(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    // Clear any stale session before logging in as a new user
    localStorage.removeItem('token');
    clearImpersonation();
    try { sessionStorage.removeItem('auth_user_company'); } catch { /* ignore */ }
    setUser(null);

    const userData = await authApi.login({ email, password });
    setUser(userData);
    syncLanguage(userData);
  };

  const loginWithMagicLink = async (token: string) => {
    const userData = await authApi.magicLink(token);
    setUser(userData);
    syncLanguage(userData);
  };

  const setUserFromRegister = (user: User) => {
    setUser(user);
    syncLanguage(user);
  };

  const updateLanguage = async (langcode: string) => {
    const availableLangs = user?.employeeLanguages ?? user?.companyLanguages ?? ['da'];
    if (!availableLangs.includes(langcode)) return;
    await authApi.updateLanguage(langcode);
    i18n.changeLanguage(langcode);
    if (user) {
      setUser({ ...user, preferredLangcode: langcode });
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      // Always clear user state even if the logout API call fails
      clearImpersonation();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithMagicLink,
        setUserFromRegister,
        logout,
        updateLanguage,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
