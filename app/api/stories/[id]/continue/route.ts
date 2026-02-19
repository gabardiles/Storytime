import { NextResponse } from "next/server";

/** Vercel: extend timeout for paragraphs + TTS + images (~60–120s) */
export const maxDuration = 300;
import { loadRuleset } from "@/lib/rulesets";
import { loadInstructions } from "@/lib/instructions";
import {
  getStoryFull,
  insertChapter,
  insertParagraphs,
  markChapterDone,
} from "@/lib/db";

import { generateParagraphs } from "@/lib/textGen";
import { generateAudioForParagraph } from "@/lib/tts";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { getLanguageOption } from "@/lib/languages";
import { buildTagDirectivesBlock } from "@/lib/tags";
import type { VoiceTier } from "@/lib/voices";
import { getBalance, calculateChapterCost, deductCoins } from "@/lib/coins";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;

    const body = await req.json().catch(() => ({}));
    const directionInput = typeof body.directionInput === "string"
      ? body.directionInput.trim().slice(0, 500)
      : "";

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const story = await getStoryFull(storyId);

    if (!story || story.user_id !== user.id) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const chapters = (story.chapters ?? []) as {
      id: string;
      chapter_index: number;
      paragraphs?: { text: string }[];
    }[];
    const nextIndex = chapters.length + 1;

    const ctx = (story.context_json ?? {}) as Record<string, unknown>;
    const userInput = (ctx.userInput as string) ?? "";
    const tags = (ctx.tags as string[]) ?? [];
    const storyRules = (ctx.storyRules as string) ?? "";
    const voiceId = (ctx.voiceId as string) ?? "lily";
    const rawTier = (ctx.voiceTier as string) ?? "standard";
    const voiceTier: VoiceTier =
      rawTier === "premium" || rawTier === "premium-plus" ? rawTier : "standard";
    const language = (ctx.language as string) ?? "en";
    const includeVoice = (ctx.includeVoice as boolean) !== false;
    const factsOnly = (ctx.factsOnly as boolean) === true;

    const lengthKeyTyped = (story.length_key ?? "medium") as "micro" | "short" | "medium" | "long";
    const coinCost = calculateChapterCost(false, includeVoice, false, voiceTier, lengthKeyTyped);
    const balance = await getBalance(user.id);
    if (balance < coinCost) {
      return NextResponse.json(
        { error: "Insufficient coins", coinCost, balance },
        { status: 402 }
      );
    }
    const langOption = getLanguageOption(language);
    const globalStyleHint =
      (ctx.globalStyleHint as string) ?? `Tone: ${story.tone}. Bedtime-safe.`;

    const lastChapter = chapters[chapters.length - 1];
    const lastText = (lastChapter?.paragraphs ?? [])
      .map((p: { text: string }) => p.text)
      .join("\n");
    const recap = lastText.slice(0, 1200);

    const chapterId = await insertChapter(storyId, nextIndex);

    const rules = loadRuleset("default");
    const paragraphCount =
      rules.paragraphCountByLength[story.length_key as "micro" | "short" | "medium" | "long"] ?? 2;

    const paragraphs = await generateParagraphs({
      paragraphCount,
      globalStyleHint,
      userInput,
      tags,
      tagDirectives: buildTagDirectivesBlock(tags),
      chapterIndex: nextIndex,
      recap,
      storyRules,
      instructionsFromFile: loadInstructions(),
      language: langOption.promptName,
      factsOnly,
      directionInput,
    });

    const paragraphInserts = [];
    for (let idx = 0; idx < paragraphs.length; idx++) {
      const text = paragraphs[idx];
      let audioUrl: string | null = null;
      if (includeVoice) {
        try {
          audioUrl = await generateAudioForParagraph(text, {
            userId: user.id,
            storyId,
            chapterId,
            paragraphIndex: idx + 1,
            voiceOptionId: voiceId,
            voiceTier,
            languageCode: langOption.languageCode,
          });
        } catch (err) {
          console.error(`TTS failed for paragraph ${idx + 1}:`, err);
        }
      }
      paragraphInserts.push({
        chapterId,
        paragraphIndex: idx + 1,
        text,
        audioUrl,
      });
    }

    await insertParagraphs(paragraphInserts);
    await markChapterDone(chapterId);

    await deductCoins(user.id, coinCost, "chapter_continue", chapterId, `Chapter ${nextIndex} of story ${storyId}`);

    return NextResponse.json({
      storyId,
      chapterId,
      chapterIndex: nextIndex,
      coinCost,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
