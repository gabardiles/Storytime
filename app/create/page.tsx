"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buildStorySpec, buildOpenAIPrompt } from "@/lib/storySpec";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { VOICE_OPTIONS } from "@/lib/voices";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { TONE_OPTIONS, serializeTones } from "@/lib/tones";

const TAGS = [
  "Animals",
  "Space",
  "Forest",
  "Ocean",
  "Friendship",
  "Bravery",
  "Magic",
  "Funny",
  "Cozy",
];

export default function CreatePage() {
  const router = useRouter();
  const [tones, setTones] = useState<string[]>(["cozy"]);
  const [lengthKey, setLengthKey] = useState<"micro" | "short" | "medium" | "long">(
    "short"
  );
  const [voiceId, setVoiceId] = useState<string>("default");
  const [language, setLanguage] = useState<string>("en");
  const [userInput, setUserInput] = useState("");
  const [storyRules, setStoryRules] = useState("");
  const [storyRulesOpen, setStoryRulesOpen] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeVoice, setIncludeVoice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugOpen, setDebugOpen] = useState(false);

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function toggleTone(id: string) {
    setTones((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      return next.length > 0 ? next : ["cozy"];
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
          tone: serializeTones(tones),
          lengthKey,
          rulesetId: "default",
          userInput,
          storyRules,
          tags,
          voiceId,
          language,
          includeImages,
          includeVoice,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(json?.error || "Failed");
      }
      router.push(`/story/${json.storyId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate story");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
      <nav className="flex items-center gap-4 mb-8">
        <Link
          href="/library"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Library
        </Link>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create story</h1>
        <Button variant="outline" size="sm" onClick={() => setDebugOpen(true)}>
          Debug
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
              <h2 className="font-semibold">POC Debug</h2>
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
                  {JSON.stringify(
                    { tones, lengthKey, language, voiceId, includeImages, includeVoice, userInput, storyRules, tags },
                    null,
                    2
                  )}
                </pre>
              </section>
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Story spec (built from form)
                </h3>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(
                    buildStorySpec({
                      tone: serializeTones(tones),
                      lengthKey,
                      rulesetId: "default",
                      userInput,
                      storyRules,
                      tags,
                      language,
                    }),
                    null,
                    2
                  )}
                </pre>
              </section>
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  OpenAI prompt (chapter 1)
                </h3>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {buildOpenAIPrompt(
                    buildStorySpec({
                      tone: serializeTones(tones),
                      lengthKey,
                      rulesetId: "default",
                      userInput,
                      storyRules,
                      tags,
                      language,
                    }),
                    1
                  )}
                </pre>
              </section>
              <p className="text-xs text-muted-foreground">
                OpenAI response appears in library after generating.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Tone</Label>
          <p className="text-sm text-muted-foreground">
            Pick one or more. Combine e.g. Info + Adventure.
          </p>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((t) => {
              const Icon = t.icon;
              const selected = tones.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTone(t.id)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-accent/50"
                  }`}
                  title={t.description}
                >
                  <Icon className="size-5" />
                  <span className="font-medium">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice">Narrator voice</Label>
          <Select value={voiceId} onValueChange={setVoiceId}>
            <SelectTrigger id="voice" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} — {v.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="length">Length</Label>
          <Select
            value={lengthKey}
            onValueChange={(v) => setLengthKey(v as "micro" | "short" | "medium" | "long")}
          >
            <SelectTrigger id="length" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="micro">Micro</SelectItem>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="long">Long</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <Label htmlFor="includeVoice" className="cursor-pointer flex-1">
            Include voice narration
          </Label>
          <button
            id="includeVoice"
            type="button"
            role="switch"
            aria-checked={includeVoice}
            onClick={() => setIncludeVoice((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              includeVoice ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow ring-0 transition-transform ${
                includeVoice ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <Label htmlFor="includeImages" className="cursor-pointer flex-1">
            Include illustrations
          </Label>
          <button
            id="includeImages"
            type="button"
            role="switch"
            aria-checked={includeImages}
            onClick={() => setIncludeImages((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              includeImages ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow ring-0 transition-transform ${
                includeImages ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userInput">Words or ideas for your story</Label>
          <Textarea
            id="userInput"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={4}
            placeholder="e.g. a little rabbit, a magical forest, a friendly owl..."
          />
        </div>

        <Collapsible open={storyRulesOpen} onOpenChange={setStoryRulesOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-6 py-4 text-left font-medium hover:bg-accent/50 transition-colors"
              >
                Story rules
                {storyRulesOpen ? (
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="border-t pt-4">
                <Textarea
                  value={storyRules}
                  onChange={(e) => setStoryRules(e.target.value)}
                  rows={4}
                  placeholder="e.g. It's Halloween themed. Santa is always the bad guy..."
                  className="min-h-24"
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <Button
                key={t}
                type="button"
                variant={tags.includes(t) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTag(t)}
                className="rounded-full"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          onClick={onGenerate}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? "Generating your story…" : "Generate"}
        </Button>
      </div>
    </main>
  );
}
