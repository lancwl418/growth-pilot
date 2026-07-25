"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Locale, type Translations } from "@/lib/i18n/translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
});

const STORAGE_KEY = "gp-locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Reading persisted locale after mount is intentional (avoids SSR hydration
    // mismatch); the synchronous setState here is the deliberate pattern.
    /* eslint-disable react-hooks/set-state-in-effect */
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "zh") {
      setLocaleState(saved);
    }
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return <LanguageContext.Provider value={{ locale: "en", setLocale }}>{children}</LanguageContext.Provider>;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT(): Translations {
  const { locale } = useContext(LanguageContext);
  return translations[locale];
}
