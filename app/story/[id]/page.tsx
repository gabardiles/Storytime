"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Paragraph = {
  id: string;
  paragraph_index: number;
  text: string;
  audio_url?: string | null;
  audioUrl?: string | null;
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
        Tone: {story.tone} · Length: {story.length_key}
      </p>

      <div className="space-y-8">
        {(story.chapters ?? []).map((ch) => (
          <Card key={ch.id}>
            <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Chapter {ch.chapter_index}
            </h2>
            <div className="space-y-4">
              {(ch.paragraphs ?? []).map((p) => {
                const audioUrl = p.audio_url ?? p.audioUrl;
                return (
                <div key={p.id} className="flex gap-3 items-start">
                  <Button
                    type="button"
                    variant={playingId === p.id ? "default" : "secondary"}
                    size="icon"
                    onClick={() => audioUrl && handlePlay(p)}
                    disabled={!audioUrl}
                    className="flex-shrink-0 rounded-full"
                    aria-label={audioUrl ? (playingId === p.id ? "Pause" : "Play") : "No audio"}
                    title={!audioUrl ? "No audio for this paragraph" : undefined}
                  >
                    {playingId === p.id ? "⏸" : "▶"}
                  </Button>
                  <div className="flex-1 min-w-0">
                    {audioUrl && (
                      <audio
                        data-id={p.id}
                        src={audioUrl}
                        preload="metadata"
                        onEnded={() => setPlayingId(null)}
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
              );
              })}
            </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
