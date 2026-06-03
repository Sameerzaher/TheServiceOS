"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { heUi } from "@/config/locale/he/strings";

type Locale = "he" | "en";
type LocaleStrings = typeof heUi;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: LocaleStrings;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("he");

  useEffect(() => {
    const stored = localStorage.getItem("serviceos.locale") as Locale;
    if (stored === "he" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    if (locale === "en") {
      root.setAttribute("lang", "en");
      root.setAttribute("dir", "ltr");
    } else {
      root.setAttribute("lang", "he");
      root.setAttribute("dir", "rtl");
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("serviceos.locale", newLocale);
  };

  // For now, always use Hebrew (English translation can be added later)
  const t = heUi;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
