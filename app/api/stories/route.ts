import { NextResponse } from "next/server";

/** Vercel: extend timeout for LLM paragraph generation (~15–30s) */
export const maxDuration = 60;
import { loadInstructions } from "@/lib/instructions";
import { buildStorySpec, buildOpenAIPrompt } from "@/lib/storySpec";
import { generateParagraphs } from "@/lib/textGen";
import {
  insertStory,
  insertChapter,
  insertParagraphs,
} from "@/lib/db";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { getLanguageOption } from "@/lib/languages";
import { buildTagDirectivesBlock } from "@/lib/tags";
import { getBalance, calculateChapterCost, deductCoins } from "@/lib/coins";
import type { VoiceTier } from "@/lib/voices";

export async function POST(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const tone = body.tone ?? "cozy";
    const lengthKey = body.lengthKey ?? "short";
    const rulesetId = body.rulesetId ?? "default";
    const userInput = body.userInput ?? "";
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const storyRules = body.storyRules ?? "";
    const voiceId = body.voiceId ?? "lily";
    const voiceTier: VoiceTier =
      body.voiceTier === "premium" ? "premium" : "standard";
    const language = body.language ?? "en";
    const includeImages = body.includeImages !== false;
    const includeVoice = body.includeVoice !== false;
    const factsOnly = body.factsOnly === true;
    const langOption = getLanguageOption(language);

    const lengthKeyTyped = lengthKey as "micro" | "short" | "medium" | "long";
    const coinCost = calculateChapterCost(true, includeVoice, includeImages, voiceTier, lengthKeyTyped);
    const balance = await getBalance(user.id);
    if (balance < coinCost) {
      return NextResponse.json(
        { error: "Insufficient coins", coinCost, balance },
        { status: 402 }
      );
    }

    const spec = buildStorySpec({
      tone,
      lengthKey,
      rulesetId,
      userInput,
      tags,
      storyRules,
      language,
      factsOnly,
      instructionsFromFile: loadInstructions(),
    });

    const initialPrompt = buildOpenAIPrompt(spec, 1);
    const storyId = await insertStory({
      userId: user.id,
      tone,
      lengthKey,
      rulesetId,
      contextJson: {
        userInput,
        tags,
        storyRules,
        voiceId,
        voiceTier,
        language,
        includeImages,
        includeVoice,
        factsOnly,
        globalStyleHint: spec.globalStyleHint,
        rulesVersion: spec.rules?.version ?? 1,
        initialPrompt,
        storySpec: {
          tone: spec.tone,
          lengthKey: spec.lengthKey,
          paragraphCount: spec.paragraphCount,
          globalStyleHint: spec.globalStyleHint,
          context: spec.context,
        },
      },
    });

    const chapterId = await insertChapter(storyId, 1);

    const paragraphs = await generateParagraphs({
      paragraphCount: spec.paragraphCount,
      globalStyleHint: spec.globalStyleHint,
      userInput,
      tags,
      tagDirectives: spec.tagDirectives,
      chapterIndex: 1,
      storyRules: spec.storyRules,
      instructionsFromFile: spec.instructionsFromFile,
      language: spec.language,
      factsOnly: spec.factsOnly,
    });

    const paragraphInserts = paragraphs.map((text, idx) => ({
      chapterId,
      paragraphIndex: idx + 1,
      text,
      audioUrl: null as string | null,
    }));
    await insertParagraphs(paragraphInserts);

    await deductCoins(user.id, coinCost, "story_create", storyId, `First chapter of story ${storyId}`);

    return NextResponse.json({ storyId, chapterId, coinCost });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
