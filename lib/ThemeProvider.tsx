"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function ThemeSyncFromApi() {
  const { setTheme } = useTheme();
  useEffect(() => {
    fetch("/api/user-preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.theme) setTheme(data.theme);
      })
      .catch(() => {});
  }, [setTheme]);
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeSyncFromApi />
      {children}
    </NextThemesProvider>
  );
}
