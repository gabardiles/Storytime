import { NextResponse } from "next/server";
import { loadInstructions } from "@/lib/instructions";
import { buildStorySpec, buildOpenAIPrompt } from "@/lib/storySpec";
import { generateParagraphs, generateStoryTitleAndSummary } from "@/lib/textGen";
import { generateAudioForParagraph } from "@/lib/tts";
import {
  insertStory,
  insertChapter,
  insertParagraphs,
  markChapterDone,
  markStoryDone,
  updateStory,
} from "@/lib/db";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { getLanguageOption } from "@/lib/languages";

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
    const voiceId = body.voiceId ?? "default";
    const language = body.language ?? "en";
    const langOption = getLanguageOption(language);

    const spec = buildStorySpec({
      tone,
      lengthKey,
      rulesetId,
      userInput,
      tags,
      storyRules,
      language,
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
        language,
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
      chapterIndex: 1,
      storyRules: spec.storyRules,
      instructionsFromFile: spec.instructionsFromFile,
      language: spec.language,
    });

    const paragraphInserts = [];
    for (let idx = 0; idx < paragraphs.length; idx++) {
      const text = paragraphs[idx];
      const audioUrl = await generateAudioForParagraph(text, {
        userId: user.id,
        storyId,
        chapterId,
        paragraphIndex: idx + 1,
        voiceOptionId: voiceId,
        languageCode: langOption.languageCode,
      });
      paragraphInserts.push({
        chapterId,
        paragraphIndex: idx + 1,
        text,
        audioUrl,
      });
    }

    await insertParagraphs(paragraphInserts);
    await markChapterDone(chapterId);

    const firstParagraph = paragraphs[0] ?? "";
    const { title, summary } = await generateStoryTitleAndSummary(firstParagraph, {
      language: spec.language,
    });
    await updateStory(storyId, {
      title,
      context_json: {
        userInput,
        tags,
        storyRules,
        voiceId,
        language,
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
        summary,
        openaiResponse: paragraphs,
      },
    });
    await markStoryDone(storyId);

    return NextResponse.json({ storyId, chapterId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
