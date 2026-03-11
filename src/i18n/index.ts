import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Danish translations
import daCommon from './locales/da/common.json';
import daAuth from './locales/da/auth.json';
import daConsole from './locales/da/console.json';
import daEmployees from './locales/da/employees.json';
import daHandbook from './locales/da/handbook.json';
import daAccount from './locales/da/account.json';
import daContacts from './locales/da/contacts.json';

// English translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enConsole from './locales/en/console.json';
import enEmployees from './locales/en/employees.json';
import enHandbook from './locales/en/handbook.json';
import enAccount from './locales/en/account.json';
import enContacts from './locales/en/contacts.json';

// Migrate legacy handbook-lang localStorage key to i18nextLng
try {
  const legacy = localStorage.getItem('handbook-lang');
  if (legacy && !localStorage.getItem('i18nextLng')) {
    localStorage.setItem('i18nextLng', legacy);
  }
} catch {
  // ignore — SSR or private browsing
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      da: {
        common: daCommon,
        auth: daAuth,
        console: daConsole,
        employees: daEmployees,
        handbook: daHandbook,
        account: daAccount,
        contacts: daContacts,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        console: enConsole,
        employees: enEmployees,
        handbook: enHandbook,
        account: enAccount,
        contacts: enContacts,
      },
    },
    lng: undefined, // let detector decide; falls back to 'da'
    fallbackLng: 'da',
    defaultNS: 'common',
    ns: ['common', 'auth', 'console', 'employees', 'handbook', 'account', 'contacts'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;
