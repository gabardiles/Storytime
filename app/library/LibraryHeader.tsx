"use client";

import { useLanguage, LanguageToggle } from "@/lib/LanguageContext";
import { CoinBalance } from "@/lib/CoinContext";

export default function LibraryHeader() {
  const { t } = useLanguage();
  return (
    <nav className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold">{t("library.title")}</h1>
      <div className="flex items-center gap-3">
        <CoinBalance />
        <LanguageToggle />
      </div>
    </nav>
  );
}

export function LibraryFooter({ email }: { email?: string }) {
  const { t } = useLanguage();
  return (
    <footer className="mt-auto pt-8 flex flex-col items-center gap-2 text-center">
      {email && (
        <p className="text-sm text-muted-foreground">{email}</p>
      )}
      <a
        href="/api/auth/signout"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("library.signOut")}
      </a>
    </footer>
  );
}
