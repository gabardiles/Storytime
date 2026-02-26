"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Settings as SettingsIcon, Volume2, ImageIcon, Star } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getTierForVoiceId } from "@/lib/voices";
import { getVoicesForLanguage, getCanonicalVoiceIdForLanguage } from "@/lib/voiceList";
import type { StoryDefaults } from "@/lib/db";

const UI_LANGUAGES = [
  { id: "en" as const, flag: "🇺🇸", label: "English" },
  { id: "sv" as const, flag: "🇸🇪", label: "Svenska" },
  { id: "es" as const, flag: "🇪🇸", label: "Español" },
];

const LENGTH_KEYS = ["micro", "short", "medium", "long"] as const;
type LengthKey = (typeof LENGTH_KEYS)[number];

export function Settings({ className }: { className?: string }) {
  const { locale, setLocale, refetchLocale, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [storyDefaults, setStoryDefaults] = useState<StoryDefaults>({});
  const [storyDefaultsLoaded, setStoryDefaultsLoaded] = useState(false);
  const [savingStoryDefaults, setSavingStoryDefaults] = useState(false);

  const loadPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/user-preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.story_defaults && typeof data.story_defaults === "object") {
          setStoryDefaults(data.story_defaults);
        }
        setStoryDefaultsLoaded(true);
      }
    } catch {
      setStoryDefaultsLoaded(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      refetchLocale();
      loadPrefs();
    }
  }, [open, loadPrefs, refetchLocale]);

  async function saveStoryDefaults() {
    setSavingStoryDefaults(true);
    try {
      await fetch("/api/user-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_defaults: storyDefaults }),
      });
    } finally {
      setSavingStoryDefaults(false);
    }
  }

  const lengthKey = (storyDefaults.lengthKey ?? "medium") as LengthKey;
  const voiceId = storyDefaults.voiceId ?? "walter";
  const voiceTier = getTierForVoiceId(voiceId);
  const includeVoice = storyDefaults.includeVoice ?? true;
  const includeImages = storyDefaults.includeImages ?? true;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={() => setOpen(true)}
        title={t("settings.title")}
        aria-label={t("settings.title")}
      >
        <SettingsIcon className="size-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent animateFromCenter forceCentered>
          <DialogHeader>
            <DialogTitle>{t("settings.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Language */}
            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <div className="flex gap-1.5">
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
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label>{t("settings.theme")}</Label>
              <div className="flex gap-2 flex-wrap">
                {(["light", "dark", "system"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={theme === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTheme(value);
                      fetch("/api/user-preferences", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ theme: value }),
                      }).catch(() => {});
                    }}
                  >
                    {value === "light"
                      ? t("settings.themeLight")
                      : value === "dark"
                        ? t("settings.themeDark")
                        : t("settings.themeSystem")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Story defaults – always reserve space; show skeleton until loaded */}
            <div className="space-y-4 border-t pt-4 min-h-[320px]">
              <Label className="text-base">{t("settings.storyDefaults")}</Label>
              {storyDefaultsLoaded ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("create.extraOptions")}
                  </p>
                  <div className="grid gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm">{t("create.language")}</Label>
                      <div className="flex gap-1.5">
                        {UI_LANGUAGES.map((lang) => {
                          const storyLang = storyDefaults.language ?? locale;
                          const selected = storyLang === lang.id;
                          return (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() =>
                                setStoryDefaults((prev) => ({
                                  ...prev,
                                  language: lang.id,
                                }))
                              }
                              className={`flex items-center justify-center w-10 h-10 rounded-lg border text-xl transition-colors ${
                                selected
                                  ? "border-primary bg-primary/10 ring-2 ring-primary"
                                  : "border-border hover:bg-accent/50"
                              }`}
                              title={lang.label}
                              aria-label={lang.label}
                            >
                              {lang.flag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">{t("create.length")}</Label>
                      <Select
                        value={lengthKey}
                        onValueChange={(v) =>
                          setStoryDefaults((prev) => ({
                            ...prev,
                            lengthKey: v as LengthKey,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LENGTH_KEYS.map((key) => (
                            <SelectItem key={key} value={key}>
                              {t(`create.length.${key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">{t("create.narrator")}</Label>
                      <Select
                        value={getCanonicalVoiceIdForLanguage(voiceId, locale)}
                        onValueChange={(v) =>
                          setStoryDefaults((prev) => ({
                            ...prev,
                            voiceId: v,
                            voiceTier: getTierForVoiceId(v),
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getVoicesForLanguage(locale).map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              <span className="flex items-center gap-1.5">
                                {v.tier === "premium" && <Star className="size-3.5 fill-amber-400 text-amber-500 shrink-0" aria-hidden />}
                                {v.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setStoryDefaults((prev) => ({
                            ...prev,
                            includeVoice: !prev.includeVoice,
                          }))
                        }
                        className={`flex items-center justify-center w-12 h-12 rounded-lg border transition-colors ${
                          includeVoice
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/50 hover:bg-muted"
                        }`}
                        title={t("create.voiceNarration")}
                        aria-label={t("create.toggleVoice")}
                        aria-pressed={includeVoice}
                      >
                        <Volume2 className="size-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStoryDefaults((prev) => ({
                            ...prev,
                            includeImages: !prev.includeImages,
                          }))
                        }
                        className={`flex items-center justify-center w-12 h-12 rounded-lg border transition-colors ${
                          includeImages
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/50 hover:bg-muted"
                        }`}
                        title={t("create.illustrations")}
                        aria-label={t("create.toggleIllustrations")}
                        aria-pressed={includeImages}
                      >
                        <ImageIcon className="size-6" />
                      </button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={saveStoryDefaults}
                    disabled={savingStoryDefaults}
                  >
                    {savingStoryDefaults ? "…" : t("settings.saveDefaults")}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.savedDefaultsNote")}
                  </p>
                </>
              ) : (
                <>
                  <Skeleton className="h-4 w-48" />
                  <div className="grid gap-3">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-16" />
                      <div className="flex gap-1.5">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-28 rounded-md" />
                  <Skeleton className="h-3 w-64" />
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
