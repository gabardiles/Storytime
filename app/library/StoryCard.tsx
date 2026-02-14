"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoIcon, Trash2Icon } from "lucide-react";

type Story = {
  id: string;
  title: string | null;
  tone: string;
  length_key: string;
  status: string;
  created_at: string;
  context_json: Record<string, unknown> | null;
};

export default function StoryCard({
  story,
  onDelete,
}: {
  story: Story;
  onDelete: (id: string) => void;
}) {
  const [debugOpen, setDebugOpen] = useState(false);
  const ctx = story.context_json ?? {};
  const summary = (ctx.summary as string) ?? "";
  const initialPrompt = (ctx.initialPrompt as string) ?? "";
  const storySpec = ctx.storySpec ?? {};
  const openaiResponse = (ctx.openaiResponse as string[]) ?? [];
  const formValues = {
    tone: story.tone,
    lengthKey: story.length_key,
    userInput: ctx.userInput ?? "",
    tags: (ctx.tags as string[]) ?? [],
  };

  return (
    <>
      <Card className="hover:bg-accent/30 transition-colors">
        <CardContent className="flex items-start gap-3 p-4">
          <Link href={`/story/${story.id}`} className="flex-1 min-w-0 block">
            <div className="font-medium">
              {story.title ?? `Story ${story.id.slice(0, 8)}…`}
            </div>
            {summary && (
              <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {summary}
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-1">
              {new Date(story.created_at).toLocaleString()} · {story.tone} ·{" "}
              {story.length_key}
            </div>
          </Link>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDebugOpen(true);
              }}
              aria-label="Debug info"
            >
              <InfoIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm("Delete this story?")) onDelete(story.id);
              }}
              aria-label="Delete story"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <h2 className="font-semibold">Debug info</h2>
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
                  Form values (tone, length, words, tags)
                </h3>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(formValues, null, 2)}
                </pre>
              </section>
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Story spec
                </h3>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(storySpec, null, 2)}
                </pre>
              </section>
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  OpenAI prompt (chapter 1)
                </h3>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {initialPrompt || "(No prompt stored)"}
                </pre>
              </section>
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  OpenAI response (paragraphs)
                </h3>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {openaiResponse.length > 0
                    ? JSON.stringify(openaiResponse, null, 2)
                    : "(No response stored)"}
                </pre>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
