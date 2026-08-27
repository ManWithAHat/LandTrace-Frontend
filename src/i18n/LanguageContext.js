import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings } from './strings';

const LanguageContext = createContext(null);
const LANG_STORAGE_KEY = 'landtrace_lang';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('hi');

  useEffect(() => {
    AsyncStorage.getItem(LANG_STORAGE_KEY)
      .then((stored) => {
        if (stored === 'en' || stored === 'hi') setLangState(stored);
      })
      .catch((err) => console.error('load language pref failed:', err));
  }, []);

  const setLanguage = useCallback((next) => {
    setLangState(next);
    AsyncStorage.setItem(LANG_STORAGE_KEY, next).catch((err) =>
      console.error('save language pref failed:', err)
    );
  }, []);

  const t = useCallback((key) => strings[lang][key] ?? key, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
