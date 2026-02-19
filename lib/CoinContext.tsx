"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type CoinContextValue = {
  balance: number | null;
  refreshBalance: () => Promise<void>;
};

const CoinContext = createContext<CoinContextValue>({
  balance: null,
  refreshBalance: async () => {},
});

export function useCoins() {
  return useContext(CoinContext);
}

export function CoinProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null);

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/coins");
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance ?? 0);
      }
    } catch {
      // silently fail — balance stays as-is
    }
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const value = useMemo(
    () => ({ balance, refreshBalance }),
    [balance, refreshBalance]
  );

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function GoldCoinIcon({ size = 24 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Coin edge / thickness */}
      <ellipse cx="50" cy="54" rx="44" ry="8" fill="#C8962E" />
      {/* Main coin face */}
      <circle cx="50" cy="48" r="44" fill={`url(#${gradientId})`} />
      {/* Inner ring */}
      <circle cx="50" cy="48" r="36" fill="none" stroke="#C8962E" strokeWidth="2" opacity="0.5" />
      {/* Dot border - round coords so server/client match (avoid hydration mismatch) */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2 - Math.PI / 2;
        const cx = round2(50 + Math.cos(angle) * 40);
        const cy = round2(48 + Math.sin(angle) * 40);
        return <circle key={i} cx={cx} cy={cy} r="1.8" fill="#C8962E" opacity="0.45" />;
      })}
      {/* Radial dashes */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const x1 = round2(50 + Math.cos(angle) * 26);
        const y1 = round2(48 + Math.sin(angle) * 26);
        const x2 = round2(50 + Math.cos(angle) * 33);
        const y2 = round2(48 + Math.sin(angle) * 33);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D4A843" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        );
      })}
      {/* Center circle */}
      <circle cx="50" cy="48" r="16" fill="none" stroke="#D4A843" strokeWidth="2" opacity="0.45" />
      {/* Star emblem */}
      <path
        d="M50 36l3.5 7.1 7.8 1.1-5.6 5.5 1.3 7.8L50 53.8l-7 3.7 1.3-7.8-5.6-5.5 7.8-1.1z"
        fill="#D4A843"
        opacity="0.6"
      />
      <defs>
        <radialGradient id={gradientId} cx="40%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#F5D97E" />
          <stop offset="50%" stopColor="#E8C44A" />
          <stop offset="100%" stopColor="#C8962E" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function CoinBalance({ className }: { className?: string }) {
  const { balance } = useCoins();
  const { t } = useLanguage();
  const [popupOpen, setPopupOpen] = useState(false);

  if (balance === null) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setPopupOpen(true)}
        className={`flex items-center gap-1.5 rounded-lg bg-muted/80 px-2.5 py-1.5 text-sm font-medium hover:bg-muted transition-colors ${className ?? ""}`}
        title={t("coins.popup.title")}
      >
        <GoldCoinIcon size={24} />
        <span>{balance}</span>
      </button>
      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent animateFromCenter className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("coins.popup.title")}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 pt-1 text-sm leading-relaxed text-muted-foreground">
                <p>{t("coins.popup.intro")}</p>
                <div className="space-y-1.5">
                  <p className="font-medium text-foreground">{t("coins.popup.whatAffects")}</p>
                  <p>{t("coins.popup.length")}</p>
                  <p>{t("coins.popup.voice")}</p>
                  <p>{t("coins.popup.firstChapter")}</p>
                </div>
                <div className="space-y-3 pt-1 border-t border-border pt-3">
                  <p className="font-medium text-foreground">{t("coins.popup.examples")}</p>
                  <div className="space-y-1.5">
                    <p>
                      <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                        {t("coins.popup.exampleShortTitle")}
                      </span>
                    </p>
                    <p>{t("coins.popup.exampleShortDesc")}</p>
                    <p className="flex items-center gap-1">
                      <span>2</span>
                      <GoldCoinIcon size={16} />
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p>
                      <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                        {t("coins.popup.exampleMediumTitle")}
                      </span>
                    </p>
                    <p>{t("coins.popup.exampleMediumDesc")}</p>
                    <p className="flex items-center gap-1">
                      <span>4</span>
                      <GoldCoinIcon size={16} />
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p>
                      <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                        {t("coins.popup.exampleLongTitle")}
                      </span>
                    </p>
                    <p>{t("coins.popup.exampleLongDesc")}</p>
                    <p className="flex flex-wrap items-center gap-1">
                      <span>4</span>
                      <GoldCoinIcon size={16} />
                      <span className="text-muted-foreground">+</span>
                      <span>3</span>
                      <GoldCoinIcon size={16} />
                      <span className="text-muted-foreground">+</span>
                      <span>3</span>
                      <GoldCoinIcon size={16} />
                      <span className="text-muted-foreground">=</span>
                      <span>10</span>
                      <GoldCoinIcon size={16} />
                    </p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
