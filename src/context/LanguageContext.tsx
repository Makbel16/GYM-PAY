import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n';
import { getSetting, setSetting } from '../services/settingsService';

interface LanguageContextType {
  language: 'en' | 'am';
  setLanguage: (lang: 'en' | 'am') => Promise<void>;
  toggleLanguage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  toggleLanguage: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'am'>('en');

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const saved = await getSetting('language', 'en');
        if (saved === 'am' || saved === 'en') {
          setLanguageState(saved);
          await i18n.changeLanguage(saved);
        }
      } catch (e) {
        console.error('Failed to load saved language', e);
      }
    }
    loadSavedLanguage();
  }, []);

  const changeLanguage = async (lang: 'en' | 'am') => {
    try {
      setLanguageState(lang);
      await i18n.changeLanguage(lang);
      await setSetting('language', lang);
    } catch (e) {
      console.error('Failed to change language', e);
    }
  };

  const toggleLanguage = async () => {
    const nextLang = language === 'en' ? 'am' : 'en';
    await changeLanguage(nextLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
