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

const VALID_LOCALES: Locale[] = ["en", "sv", "es"];

function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && VALID_LOCALES.includes(value as Locale);
}

type LanguageContextValue = {
  locale: Locale;
  setLocale: (lang: Locale) => void;
  refetchLocale: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  refetchLocale: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const refetchLocale = useCallback(() => {
    fetch("/api/user-preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ui_language?: string } | null) => {
        if (data && isValidLocale(data.ui_language)) {
          setLocaleState(data.ui_language);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refetchLocale();
  }, [refetchLocale]);

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
    () => ({ locale, setLocale, refetchLocale, t }),
    [locale, setLocale, refetchLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

const UI_LANGUAGES: { id: Locale; flag: string; label: string }[] = [
  { id: "en", flag: "🇺🇸", label: "English" },
  { id: "sv", flag: "🇸🇪", label: "Svenska" },
  { id: "es", flag: "🇪🇸", label: "Español" },
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
