"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buildStorySpec, buildOpenAIPrompt } from "@/lib/storySpec";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Minus, Hourglass, Volume2, ImageIcon, WandSparkles, Play, Loader2, FlaskConical, Check } from "lucide-react";
import {
  getVoicesForTier,
  type VoiceTier,
} from "@/lib/voices";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { TONE_OPTIONS } from "@/lib/tones";
import { serializeTones } from "@/lib/tones";
import { getTagsForUI } from "@/lib/tags";
import { useLanguage } from "@/lib/LanguageContext";
import { useCoins, CoinBalance, GoldCoinIcon } from "@/lib/CoinContext";
import { calculateChapterCost } from "@/lib/coinPricing";

const LENGTH_KEYS = ["micro", "short", "medium", "long"] as const;

const TAGS = getTagsForUI();

export type CreateStoryFormProps = {
  /** When true, back button and success use callbacks instead of router. Use inside library modal. */
  isModal?: boolean;
  /** Called when user closes the form (e.g. back). Only used when isModal is true. */
  onClose?: () => void;
  /** Called when a story is created. Only used when isModal is true. Parent can close create modal and open story. */
  onStoryCreated?: (storyId: string) => void;
};

export function CreateStoryForm({ isModal = false, onClose, onStoryCreated }: CreateStoryFormProps) {
  const router = useRouter();
  const { locale, t } = useLanguage();

  useEffect(() => {
    setLanguage(locale);
  }, [locale]);

  const LENGTH_OPTIONS: { key: typeof LENGTH_KEYS[number]; label: string; minutes: number }[] = [
    { key: "micro", label: t("create.length.micro"), minutes: 1 },
    { key: "short", label: t("create.length.short"), minutes: 2 },
    { key: "medium", label: t("create.length.medium"), minutes: 4 },
    { key: "long", label: t("create.length.long"), minutes: 6 },
  ];

  const [tones, setTones] = useState<string[]>(["cozy"]);
  const [lengthKey, setLengthKey] = useState<"micro" | "short" | "medium" | "long">(
    "medium"
  );
  const [voiceTier, setVoiceTier] = useState<VoiceTier>("standard");
  const [voiceId, setVoiceId] = useState<string>("walter");
  const [language, setLanguage] = useState<string>(locale);

  const [userInput, setUserInput] = useState("");
  const [storyRules, setStoryRules] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeVoice, setIncludeVoice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugOpen, setDebugOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [factsOnly, setFactsOnly] = useState(false);
  const { balance, refreshBalance } = useCoins();

  const coinCost = calculateChapterCost(true, includeVoice, includeImages, voiceTier, lengthKey);
  const canAfford = balance === null || balance >= coinCost;

  function toggleTag(id: string) {
    setTags((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function playPreview() {
    setPreviewError("");
    if (previewLoading || previewPlaying) return;
    setPreviewLoading(true);
    try {
      const url = `/api/voice-preview?voiceId=${encodeURIComponent(voiceId)}&voiceTier=${encodeURIComponent(voiceTier)}&language=${encodeURIComponent(language)}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 503) {
          setPreviewError(t("create.previewUnavailable"));
        } else {
          const json = await res.json().catch(() => ({}));
          setPreviewError((json?.error as string) || `${t("create.previewFailed")} (${res.status}).`);
        }
        return;
      }
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPreviewPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      setPreviewPlaying(true);
      await audio.play();
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : `${t("create.previewFailed")}.`);
    } finally {
      setPreviewLoading(false);
    }
  }

  function toggleTone(id: string) {
    if (factsOnly && id !== "informatical") {
      setFactsOnly(false);
    }
    setTones((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      const result = next.length > 0 ? next : ["cozy"];
      if (!result.includes("informatical")) {
        setFactsOnly(false);
      }
      return result;
    });
  }

  async function onGenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone: factsOnly ? "informatical" : serializeTones(tones),
          lengthKey,
          rulesetId: "default",
          userInput,
          storyRules,
          tags: factsOnly ? [] : tags,
          voiceTier,
          voiceId,
          language,
          includeImages,
          includeVoice,
          factsOnly,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 402) {
          await refreshBalance();
          throw new Error(t("coins.notEnough"));
        }
        throw new Error(json?.error || t("create.failedGenerate"));
      }
      await refreshBalance();
      if (isModal && onStoryCreated) {
        onStoryCreated(json.storyId);
      } else {
        router.push(`/story/${json.storyId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("create.failedGenerate"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-background px-8 py-6 shadow-lg">
            <Hourglass className="size-10 animate-pulse text-primary" />
            <p className="text-lg font-medium">{t("create.creating")}</p>
          </div>
        </div>
      )}
      <nav className="flex items-center gap-4 mb-8">
        {isModal && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("create.backLibrary")}
          </button>
        ) : (
          <Link
            href="/library"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("create.backLibrary")}
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          <CoinBalance />
        </div>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("create.title")}</h1>
        <Button variant="outline" size="sm" onClick={() => setDebugOpen(true)}>
          {t("create.debug")}
        </Button>
      </div>

      {debugOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setDebugOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l shadow-xl overflow-hidden flex flex-col z-10">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">{t("create.pocDebug")}</h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDebugOpen(false)}
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {t("create.formValues")}
                </h3>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(
                    {
                      tones,
                      effectiveTone: factsOnly ? "informatical" : serializeTones(tones),
                      effectiveTags: factsOnly ? [] : tags,
                      lengthKey,
                      language,
                      voiceTier,
                      voiceId,
                      includeImages,
                      includeVoice,
                      factsOnly,
                      userInput,
                      storyRules,
                      tags,
                    },
                    null,
                    2
                  )}
                </pre>
              </section>
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {t("create.storySpec")}
                </h3>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(
                    buildStorySpec({
                      tone: factsOnly ? "informatical" : serializeTones(tones),
                      lengthKey,
                      rulesetId: "default",
                      userInput,
                      storyRules,
                      tags: factsOnly ? [] : tags,
                      language,
                      factsOnly,
                    }),
                    null,
                    2
                  )}
                </pre>
              </section>
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {t("create.openaiPrompt")}
                </h3>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {buildOpenAIPrompt(
                    buildStorySpec({
                      tone: factsOnly ? "informatical" : serializeTones(tones),
                      lengthKey,
                      rulesetId: "default",
                      userInput,
                      storyRules,
                      tags: factsOnly ? [] : tags,
                      language,
                      factsOnly,
                    }),
                    1
                  )}
                </pre>
              </section>
              <p className="text-xs text-muted-foreground">
                {t("create.openaiNote")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>{t("create.tone")}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TONE_OPTIONS.map((tone) => {
              const Icon = tone.icon;
              const selected = tones.includes(tone.id);
              return (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => toggleTone(tone.id)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border min-h-[88px] sm:min-h-[96px] transition-colors ${
                    selected
                      ? "border-primary bg-[linear-gradient(to_bottom_right,var(--primary-light),var(--primary-dark))] text-primary-foreground"
                      : "border-border bg-background hover:bg-accent/50"
                  }`}
                  title={t(`tone.${tone.id}.desc`)}
                >
                  <Icon className="size-7 sm:size-8" strokeWidth={1} />
                  <span className="font-medium text-sm sm:text-base">{t(`tone.${tone.id}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {tones.includes("informatical") && (
          <div className="flex flex-col items-center justify-center py-4">
            <button
              type="button"
              onClick={() => {
                setFactsOnly((prev) => {
                  if (!prev) setTones(["informatical"]);
                  return !prev;
                });
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 min-w-[160px] min-h-[120px] px-6 py-4 transition-colors ${
                factsOnly
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-background hover:bg-accent/50"
              }`}
              aria-pressed={factsOnly}
              aria-label={t("create.factsOnlyDesc")}
            >
              <div className="relative">
                <FlaskConical
                  className={`size-10 sm:size-12 ${factsOnly ? "opacity-90" : ""}`}
                  strokeWidth={1.5}
                />
                {factsOnly && (
                  <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary-foreground text-primary">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              <span className="font-medium text-base">{t("create.factsOnly")}</span>
              <span className="text-xs opacity-90 text-center">
                {t("create.factsOnlyDesc")}
              </span>
            </button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="userInput">{t("create.wordsLabel")}</Label>
          <div className="rounded-lg border-2 border-primary-muted bg-transparent">
            <Textarea
              id="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={4}
              placeholder={t("create.wordsPlaceholder")}
              className="border-0 shadow-none focus-visible:ring-primary-muted/50"
            />
          </div>
        </div>

        {!factsOnly && (
          <div className="space-y-2">
            <Label>{t("create.tags")}</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => {
                const selected = tags.includes(tag.id);
                const label = locale === "es" ? tag.nameEs : locale === "sv" ? tag.nameSv : tag.name;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border-border bg-background hover:bg-accent/50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-10">
          <Accordion type="single" collapsible className="rounded-lg border">
            <AccordionItem value="extra" className="border-none">
              <AccordionTrigger className="flex w-full items-center justify-between px-4 py-3 hover:no-underline [&[data-state=open]_.icon-plus]:hidden [&[data-state=open]_.icon-minus]:block">
                <span className="text-sm font-medium">{t("create.extraOptions")}</span>
                <Plus className="icon-plus size-4 text-muted-foreground shrink-0" />
                <Minus className="icon-minus hidden size-4 text-muted-foreground shrink-0" />
              </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-1 space-y-4">
              <div className="space-y-2">
                <Label>{t("create.language")}</Label>
                <div className="flex gap-2">
                  {LANGUAGE_OPTIONS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      className={`flex items-center justify-center w-12 h-12 rounded-lg border text-2xl transition-colors ${
                        language === l.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary"
                          : "border-border hover:bg-accent/50"
                      }`}
                      title={l.name}
                      aria-label={l.name}
                    >
                      {l.flag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voiceTier">{t("create.voiceQuality")}</Label>
                  <Select
                    value={voiceTier}
                    onValueChange={(v) => {
                      const tier = v as VoiceTier;
                      setVoiceTier(tier);
                      const voices = getVoicesForTier(tier);
                      setVoiceId(voices[0].id);
                    }}
                  >
                    <SelectTrigger id="voiceTier" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">{t("create.voiceTier.standard")}</SelectItem>
                      <SelectItem value="premium">{t("create.voiceTier.premium")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voice">{t("create.narrator")}</Label>
                  <div className="flex gap-2">
                    <Select value={voiceId} onValueChange={setVoiceId}>
                      <SelectTrigger id="voice" className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getVoicesForTier(voiceTier).map((v) => (
                          <SelectItem key={v.id} value={v.id} description={v.description}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={playPreview}
                      disabled={previewLoading || previewPlaying || !includeVoice}
                      title={t("create.previewVoice")}
                      aria-label={t("create.previewVoice")}
                    >
                      {previewLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Play className="size-4" />
                      )}
                    </Button>
                  </div>
                  {previewError && (
                    <p className="text-xs text-destructive">{previewError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">{t("create.length")}</Label>
                <Select
                  value={lengthKey}
                  onValueChange={(v) => setLengthKey(v as "micro" | "short" | "medium" | "long")}
                >
                  <SelectTrigger id="length" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENGTH_OPTIONS.map((o) => (
                      <SelectItem key={o.key} value={o.key}>
                        {o.label} (~{o.minutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("create.include")}</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIncludeVoice((prev) => !prev)}
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
                    onClick={() => setIncludeImages((prev) => !prev)}
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

              <div className="space-y-2">
                <Label htmlFor="storyRules">{t("create.storyRules")}</Label>
                <Textarea
                  id="storyRules"
                  value={storyRules}
                  onChange={(e) => setStoryRules(e.target.value)}
                  rows={3}
                  placeholder={t("create.storyRulesPlaceholder")}
                  className="min-h-20"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!canAfford && (
          <p className="text-sm text-destructive font-medium">{t("coins.notEnough")}</p>
        )}
        <Button
          onClick={onGenerate}
          disabled={loading || !canAfford}
          className="group relative h-20 w-full gap-2 overflow-hidden bg-primary text-base text-primary-foreground transition-colors hover:bg-transparent disabled:hover:bg-primary"
          size="lg"
        >
          <span className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--primary-light),var(--primary),var(--primary-dark),var(--primary))] bg-[length:200%_100%] opacity-0 transition-opacity group-hover:opacity-100 group-hover:animate-[gradient-roll_1.5s_linear_infinite] group-disabled:opacity-0" />
          <WandSparkles className="size-5 shrink-0 group-hover:animate-[wiggle_0.5s_ease-in-out_infinite] group-disabled:animate-none" strokeWidth={1} />
          {loading ? t("create.generating") : (
            <span className="flex items-center gap-2">
              {t("create.generate")}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-sm">
                <GoldCoinIcon size={16} />
                {coinCost}
              </span>
            </span>
          )}
        </Button>
      </div>
    </main>
  );
}
