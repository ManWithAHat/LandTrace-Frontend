import React, { createContext, useContext, useState, useCallback } from 'react';
import { strings } from './strings';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const toggle = useCallback(() => setLang((l) => (l === 'en' ? 'hi' : 'en')), []);

  const t = useCallback((key) => strings[lang][key] ?? key, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
