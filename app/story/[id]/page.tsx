"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTonesForDisplay } from "@/lib/tones";
import { ImageLightbox } from "@/components/ImageLightbox";
import { ImageIcon, Play, Pause, Loader2, WandSparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Settings } from "@/components/Settings";
import { useCoins, CoinBalance, GoldCoinIcon } from "@/lib/CoinContext";
import { calculateChapterCost } from "@/lib/coinPricing";

function getImageCountForChapter(_lengthKey: string, chapterIndex: number): number {
  return chapterIndex === 1 ? 1 : 0;
}

function getParagraphIndicesForImages(paragraphCount: number, imageCount: number): number[] {
  if (paragraphCount <= 0 || imageCount <= 0) return [];
  if (imageCount >= paragraphCount) return Array.from({ length: paragraphCount }, (_, i) => i);
  if (imageCount === 1) return [0];
  const indices: number[] = [];
  for (let i = 0; i < imageCount; i++) {
    indices.push(Math.round((i * (paragraphCount - 1)) / (imageCount - 1)));
  }
  return indices;
}

type Paragraph = {
  id: string;
  paragraph_index: number;
  text: string;
  audio_url?: string | null;
  audioUrl?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
};

type Chapter = {
  id: string;
  chapter_index: number;
  paragraphs: Paragraph[];
};

type Story = {
  id: string;
  title?: string | null;
  tone: string;
  length_key: string;
  status: string;
  chapters: Chapter[];
  context_json?: {
    includeImages?: boolean;
    includeVoice?: boolean;
    voiceTier?: string;
  };
};

export default function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const isModal = searchParams.get("modal") === "1";
  const { balance, refreshBalance } = useCoins();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [directionInput, setDirectionInput] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string>("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const generateMediaTriggered = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsInIframe(typeof window !== "undefined" && window.self !== window.top);
  }, []);

  useEffect(() => {
    params.then((p) => setStoryId(p.id));
  }, [params]);

  async function fetchStory() {
    if (!storyId) return;
    const res = await fetch(`/api/stories/${storyId}`);
    const json = await res.json();
    if (res.ok) setStory(json);
  }

  useEffect(() => {
    if (!storyId) return;
    (async () => {
      setLoading(true);
      await fetchStory();
      setLoading(false);
    })();
  }, [storyId]);

  useEffect(() => {
    if (!storyId || !story) return;
    if (story.status === "generating" && !generateMediaTriggered.current) {
      generateMediaTriggered.current = true;
      fetch(`/api/stories/${storyId}/generate-media`, { method: "POST" }).catch(
        (err) => console.error("Generate media failed:", err)
      );
    }
    if (story.status === "generating") {
      pollIntervalRef.current = setInterval(fetchStory, 2500);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [storyId, story?.status]);


  const ctx = story?.context_json;
  const includeVoice = ctx?.includeVoice !== false;
  const voiceTier = (ctx?.voiceTier === "premium" ? "premium" : "standard") as "standard" | "premium";
  const lengthKey = (story?.length_key ?? "medium") as "micro" | "short" | "medium" | "long";
  const continueCost = calculateChapterCost(false, includeVoice, false, voiceTier, lengthKey);
  const canAffordContinue = balance === null || balance >= continueCost;

  async function onContinue() {
    setContinuing(true);
    setContinueError(null);
    try {
      const res = await fetch(`/api/stories/${storyId}/continue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directionInput: directionInput.trim().slice(0, 500) }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          await refreshBalance();
          setContinueError(t("coins.notEnough"));
          return;
        }
        setContinueError(json?.error || t("create.failedGenerate"));
        return;
      }
      await refreshBalance();
      setDirectionInput("");
      await fetchStory();
    } finally {
      setContinuing(false);
    }
  }

  function getNextParagraph(currentId: string): Paragraph | null {
    const list = (story?.chapters ?? []).flatMap((ch) => ch.paragraphs ?? []);
    const idx = list.findIndex((p) => p.id === currentId);
    if (idx === -1 || idx === list.length - 1) return null;
    const next = list[idx + 1];
    return next.audio_url ?? next.audioUrl ? next : null;
  }

  function handlePlay(paragraph: Paragraph) {
    const url = paragraph.audio_url ?? paragraph.audioUrl;
    if (!url) return;

    if (playingId === paragraph.id) {
      const audio = document.querySelector(
        `audio[data-id="${paragraph.id}"]`
      ) as HTMLAudioElement;
      if (audio) audio.pause();
      setPlayingId(null);
      return;
    }
    if (playingId) {
      const prev = document.querySelector(
        `audio[data-id="${playingId}"]`
      ) as HTMLAudioElement;
      if (prev) prev.pause();
    }
    const audio = document.querySelector(
      `audio[data-id="${paragraph.id}"]`
    ) as HTMLAudioElement;
    if (audio) {
      audio.play().catch((err) => {
        console.error("Audio play failed:", err);
        setPlayingId(null);
      });
      setPlayingId(paragraph.id);
    }
  }

  function handleAudioEnded(paragraph: Paragraph) {
    const next = getNextParagraph(paragraph.id);
    if (next) {
      handlePlay(next);
    } else {
      setPlayingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
        <p className="text-muted-foreground">{t("story.loading")}</p>
      </main>
    );
  }

  if (!story) {
    return (
      <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
        <p className="text-muted-foreground">{t("story.notFound")}</p>
        <Link href="/library" className="mt-4 text-muted-foreground hover:text-foreground hover:underline transition-colors">
          {t("story.backLibrary")}
        </Link>
      </main>
    );
  }

  const firstPara = story.chapters?.[0]?.paragraphs?.[0]?.text;
  const displayTitle =
    story.title || (firstPara ? (firstPara.length > 50 ? `${firstPara.slice(0, 50)}…` : firstPara) : t("story.fallbackTitle"));

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
      <nav className="flex items-center gap-4 mb-8">
        {isModal && isInIframe ? (
          <button
            type="button"
            onClick={() => window.parent.postMessage({ type: "story-modal-close" }, "*")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("story.backLibrary")}
          </button>
        ) : (
          <Link href="/library" className="text-muted-foreground hover:text-foreground transition-colors">
            {t("story.backLibrary")}
          </Link>
        )}
        <Link href="/create" className="text-muted-foreground hover:text-foreground transition-colors">
          {t("story.createNew")}
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <CoinBalance />
          <Settings />
        </div>
      </nav>

      <h1 className="text-2xl font-bold mb-2">{displayTitle}</h1>
      <p className="text-muted-foreground text-sm mb-8">
        {t("story.toneLabel")} {formatTonesForDisplay(story.tone)} · {t("story.lengthLabel")} {story.length_key}
        {(story.context_json as { voiceError?: string })?.voiceError && (
          <span className="ml-2 inline-block text-amber-600 dark:text-amber-400" title={(story.context_json as { voiceError?: string }).voiceError}>
            {t("story.voiceFailed")}
            <span className="block text-xs mt-0.5">{(story.context_json as { voiceError?: string }).voiceError}</span>
          </span>
        )}
        {story.status === "generating" && (
          <span className="ml-2 inline-flex items-center gap-1">
            <Loader2 className="size-3.5 animate-spin" />
            {t("story.addingMedia")}
          </span>
        )}
      </p>

      <div className="space-y-8">
        {(story.chapters ?? []).map((ch) => (
          <Card key={ch.id}>
            <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t("story.chapter")} {ch.chapter_index}
            </h2>
            <div className="space-y-4">
              {(ch.paragraphs ?? []).map((p, paraIdx) => {
                const audioUrl = p.audio_url ?? p.audioUrl;
                const imageUrl = p.image_url ?? p.imageUrl;
                const includeImages = (story.context_json as { includeImages?: boolean } | undefined)?.includeImages !== false;
                const imageIndices = includeImages
                  ? getParagraphIndicesForImages(
                      ch.paragraphs?.length ?? 0,
                      getImageCountForChapter(story.length_key, ch.chapter_index)
                    )
                  : [];
                const hasImageSlot = imageIndices.includes(paraIdx);
                return (
                <div key={p.id} className="flex flex-col gap-2">
                  {hasImageSlot && (
                    imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setLightboxImage(imageUrl)}
                        className="block w-full rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label={t("story.viewFullSize")}
                      >
                        <img
                          src={imageUrl}
                          alt=""
                          className="w-full max-w-md mx-auto aspect-square object-cover rounded-lg"
                        />
                      </button>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center gap-2 w-full max-w-md mx-auto aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30"
                        aria-hidden
                      >
                        {story.status === "generating" ? (
                          <Loader2 className="size-10 text-muted-foreground/40 animate-spin" />
                        ) : (
                          <ImageIcon className="size-12 text-muted-foreground/40" />
                        )}
                      </div>
                    )
                  )}
                <div className="flex gap-3 items-start">
                  {audioUrl && (
                    <Button
                      type="button"
                      variant={playingId === p.id ? "default" : "secondary"}
                      size="icon"
                      onClick={() => handlePlay(p)}
                      className="flex-shrink-0 rounded-full"
                      aria-label={playingId === p.id ? t("story.pause") : t("story.play")}
                    >
                      {playingId === p.id ? <Pause className="size-5" /> : <Play className="size-5" />}
                    </Button>
                  )}
                  <div className="flex-1 min-w-0">
                    {audioUrl && (
                      <audio
                        data-id={p.id}
                        src={audioUrl}
                        preload="metadata"
                        onEnded={() => handleAudioEnded(p)}
                        onPlay={() => setPlayingId(p.id)}
                        onError={(e) => {
                          console.error("Audio load failed:", e);
                          setPlayingId(null);
                        }}
                        className="hidden"
                      />
                    )}
                    <p
                      className={`leading-relaxed ${
                        playingId === p.id ? "bg-primary/10 rounded-lg p-2" : ""
                      }`}
                    >
                      {p.text}
                    </p>
                  </div>
                </div>
                </div>
              );
              })}
            </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ImageLightbox
        open={lightboxImage !== null}
        onOpenChange={(open) => !open && setLightboxImage(null)}
        src={lightboxImage ?? ""}
      />

      <div className="mt-8 flex flex-col gap-4 items-center">
        <div className="space-y-2 w-full max-w-md flex flex-col items-center text-center">
          <Label htmlFor="direction" className="text-center">{t("story.directionLabel")}</Label>
          <Input
            id="direction"
            type="text"
            value={directionInput}
            onChange={(e) => setDirectionInput(e.target.value)}
            placeholder={t("story.directionPlaceholder")}
            className="w-full"
          />
        </div>
        {continueError && (
          <p className="text-sm text-destructive">{continueError}</p>
        )}
        {!canAffordContinue && (
          <p className="text-sm text-destructive font-medium">{t("coins.notEnough")}</p>
        )}
        <Button
          onClick={onContinue}
          disabled={continuing || !canAffordContinue}
          className="group relative h-20 w-full max-w-md gap-2 overflow-hidden bg-primary text-base text-primary-foreground transition-colors hover:bg-transparent disabled:hover:bg-primary"
          size="lg"
        >
          <span className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--primary-light),var(--primary),var(--primary-dark),var(--primary))] bg-[length:200%_100%] opacity-0 transition-opacity group-hover:opacity-100 group-hover:animate-[gradient-roll_1.5s_linear_infinite] group-disabled:opacity-0" />
          <WandSparkles className="size-5 shrink-0 group-hover:animate-[wiggle_0.5s_ease-in-out_infinite] group-disabled:animate-none" strokeWidth={1} />
          {continuing ? t("story.generatingNext") : (
            <span className="flex items-center gap-2">
              {t("story.nextPart")}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-sm">
                <GoldCoinIcon size={16} />
                {continueCost}
              </span>
            </span>
          )}
        </Button>
      </div>
    </main>
  );
}
