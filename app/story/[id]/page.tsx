"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTonesForDisplay } from "@/lib/tones";
import { ImageLightbox } from "@/components/ImageLightbox";
import { ImageIcon } from "lucide-react";

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
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string>("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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

  async function onContinue() {
    setContinuing(true);
    setContinueError(null);
    try {
      const res = await fetch(`/api/stories/${storyId}/continue`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setContinueError(json?.error || "Failed to generate next chapter");
        return;
      }
      await fetchStory();
    } finally {
      setContinuing(false);
    }
  }

  /** Get the next paragraph with audio, or null if none */
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
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!story) {
    return (
      <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
        <p className="text-muted-foreground">Story not found.</p>
        <Link href="/library" className="mt-4 text-muted-foreground hover:text-foreground hover:underline transition-colors">
          ← Library
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
      <nav className="flex items-center gap-4 mb-8">
        <Link href="/library" className="text-muted-foreground hover:text-foreground transition-colors">
          ← Library
        </Link>
        <Link href="/create" className="text-muted-foreground hover:text-foreground transition-colors">
          Create new
        </Link>
      </nav>

      <h1 className="text-2xl font-bold mb-2">Story</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Tone: {formatTonesForDisplay(story.tone)} · Length: {story.length_key}
      </p>

      <div className="space-y-8">
        {(story.chapters ?? []).map((ch) => (
          <Card key={ch.id}>
            <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Chapter {ch.chapter_index}
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
                        aria-label="View full size"
                      >
                        <img
                          src={imageUrl}
                          alt=""
                          className="w-full max-w-md mx-auto aspect-square object-cover rounded-lg"
                        />
                      </button>
                    ) : (
                      <div
                        className="flex items-center justify-center w-full max-w-md mx-auto aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30"
                        aria-hidden
                      >
                        <ImageIcon className="size-12 text-muted-foreground/40" />
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
                      aria-label={playingId === p.id ? "Pause" : "Play"}
                    >
                      {playingId === p.id ? "⏸" : "▶"}
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
          {continuing ? "Generating next chapter…" : "Next part"}
        </Button>
      </div>
    </main>
  );
}
