"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type Locale, getTranslations } from "./i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (lang: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    fetch("/api/user-preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ui_language === "sv") setLocaleState("sv");
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback((lang: Locale) => {
    setLocaleState(lang);
    document.documentElement.lang = lang;
    fetch("/api/user-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ui_language: lang }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useMemo(() => getTranslations(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

const UI_LANGUAGES: { id: Locale; flag: string; label: string }[] = [
  { id: "en", flag: "🇺🇸", label: "English" },
  { id: "sv", flag: "🇸🇪", label: "Svenska" },
];

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={`flex gap-1.5 ${className ?? ""}`}>
      {UI_LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          type="button"
          onClick={() => setLocale(lang.id)}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border text-xl transition-colors ${
            locale === lang.id
              ? "border-primary bg-primary/10 ring-2 ring-primary"
              : "border-border hover:bg-accent/50"
          }`}
          title={lang.label}
          aria-label={lang.label}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
}
