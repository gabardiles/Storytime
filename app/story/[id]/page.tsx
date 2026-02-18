"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTonesForDisplay } from "@/lib/tones";
import { ImageLightbox } from "@/components/ImageLightbox";
import { ImageIcon, Play, Pause, Loader2 } from "lucide-react";
import { useLanguage, LanguageToggle } from "@/lib/LanguageContext";

function getImageCountForChapter(_lengthKey: string): number {
  return 2;
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
  context_json?: { includeImages?: boolean };
};

export default function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useLanguage();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string>("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const generateMediaTriggered = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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


  async function onContinue() {
    setContinuing(true);
    setContinueError(null);
    try {
      const res = await fetch(`/api/stories/${storyId}/continue`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setContinueError(json?.error || t("create.failedGenerate"));
        return;
      }
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
        <Link href="/library" className="text-muted-foreground hover:text-foreground transition-colors">
          {t("story.backLibrary")}
        </Link>
        <Link href="/create" className="text-muted-foreground hover:text-foreground transition-colors">
          {t("story.createNew")}
        </Link>
        <div className="ml-auto">
          <LanguageToggle />
        </div>
      </nav>

      <h1 className="text-2xl font-bold mb-2">{displayTitle}</h1>
      <p className="text-muted-foreground text-sm mb-8">
        {t("story.toneLabel")} {formatTonesForDisplay(story.tone)} · {t("story.lengthLabel")} {story.length_key}
        {(story.context_json as { voiceError?: string })?.voiceError && (
          <span className="ml-2 inline-block text-amber-600 dark:text-amber-400">
            {t("story.voiceFailed")}
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
                      getImageCountForChapter(story.length_key)
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

      <div className="mt-8 flex flex-col gap-4">
        {continueError && (
          <p className="text-sm text-destructive">{continueError}</p>
        )}
        <Button
          onClick={onContinue}
          disabled={continuing}
        >
          {continuing ? t("story.generatingNext") : t("story.nextPart")}
        </Button>
      </div>
    </main>
  );
}
