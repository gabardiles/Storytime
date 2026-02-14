import { NextResponse } from "next/server";
import { loadRuleset } from "@/lib/rulesets";
import { loadInstructions } from "@/lib/instructions";
import { getStoryFull, insertChapter, insertParagraphs, markChapterDone } from "@/lib/db";
import { generateParagraphs } from "@/lib/textGen";
import { generateAudioForParagraph } from "@/lib/tts";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { getLanguageOption } from "@/lib/languages";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;

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
    const voiceId = (ctx.voiceId as string) ?? "default";
    const language = (ctx.language as string) ?? "en";
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
      chapterIndex: nextIndex,
      recap,
      storyRules,
      instructionsFromFile: loadInstructions(),
      language: langOption.promptName,
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

    return NextResponse.json({
      storyId,
      chapterId,
      chapterIndex: nextIndex,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
