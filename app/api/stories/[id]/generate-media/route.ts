import { NextResponse } from "next/server";

/** Vercel: extend timeout for TTS + images + title (~60–180s) */
export const maxDuration = 300;
import {
  getStoryFull,
  getStoryByIdAndUser,
  updateParagraph,
  updateStory,
  markChapterDone,
  markStoryDone,
} from "@/lib/db";
import { generateAudioForParagraph } from "@/lib/tts";
import {
  getImageCountForChapter,
  getParagraphIndicesForImages,
  generateImageForParagraph,
} from "@/lib/imageGen";
import { generateVisualConsistencyRef } from "@/lib/imageConsistency";
import { generateStoryTitleAndSummary } from "@/lib/textGen";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { getLanguageOption } from "@/lib/languages";
import type { VoiceTier } from "@/lib/voices";

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

    const ownership = await getStoryByIdAndUser(storyId, user.id);
    if (!ownership) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const story = await getStoryFull(storyId);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.status === "done") {
      return NextResponse.json({ ok: true, status: "done" });
    }

    const ctx = (story.context_json ?? {}) as Record<string, unknown>;
    const voiceId = (ctx.voiceId as string) ?? "lily";
    const rawTier = (ctx.voiceTier as string) ?? "standard";
    const voiceTier: VoiceTier =
      rawTier === "premium" || rawTier === "premium-plus" ? rawTier : "standard";
    const language = (ctx.language as string) ?? "en";
    const includeImages = (ctx.includeImages as boolean) !== false;
    const includeVoice = (ctx.includeVoice as boolean) !== false;
    const factsOnly = (ctx.factsOnly as boolean) === true;
    const tags = (ctx.tags as string[]) ?? [];
    const langOption = getLanguageOption(language);
    const storySpec = ctx.storySpec as { paragraphCount?: number } | undefined;
    const paragraphCount = storySpec?.paragraphCount ?? 8;

    const chapters = (story.chapters ?? []) as {
      id: string;
      chapter_index: number;
      paragraphs?: { id: string; paragraph_index: number; text: string; audio_url?: string | null; image_url?: string | null }[];
    }[];

    const firstChapter = chapters[0];
    if (!firstChapter?.paragraphs?.length) {
      return NextResponse.json({ error: "No paragraphs to process" }, { status: 400 });
    }

    const paragraphs = firstChapter.paragraphs
      .sort((a, b) => a.paragraph_index - b.paragraph_index)
      .map((p) => p.text);

    const chapterId = firstChapter.id;
    const lengthKey = story.length_key as "micro" | "short" | "medium" | "long";
    const imageIndices = getParagraphIndicesForImages(
      paragraphs.length,
      getImageCountForChapter(lengthKey)
    );

    // Run voice (Google TTS) and images (OpenAI) in parallel—different services
    const voiceTask = includeVoice
      ? (async () => {
          const results = await Promise.all(
            paragraphs.map((text, idx) =>
              generateAudioForParagraph(text, {
                userId: user.id,
                storyId,
                chapterId,
                paragraphIndex: idx + 1,
                voiceOptionId: voiceId,
                voiceTier,
                languageCode: langOption.languageCode,
              }).catch((err) => {
                console.error(`TTS failed for paragraph ${idx + 1}:`, err);
                return null;
              })
            )
          );
          for (let idx = 0; idx < results.length; idx++) {
            const audioUrl = results[idx];
            if (audioUrl) {
              await updateParagraph(chapterId, idx + 1, { audioUrl });
            }
          }
        })()
      : Promise.resolve();

    const imageTask =
      includeImages && imageIndices.length > 0
        ? (async () => {
            const visualConsistencyRef = await generateVisualConsistencyRef(paragraphs, {
              language: langOption.promptName,
            });
            let coverImageUrl: string | undefined;
            for (let i = 0; i < imageIndices.length; i++) {
              const idx = imageIndices[i];
              const text = paragraphs[idx];
              const paragraphIndex = idx + 1;
              try {
                const { imageUrl, imagePrompt } = await generateImageForParagraph(text, {
                  storyId,
                  chapterId,
                  paragraphIndex,
                  userId: user.id,
                  visualConsistencyRef,
                  imageIndexInStory: i,
                  tags,
                  factsMode: factsOnly,
                });
                if (!coverImageUrl) coverImageUrl = imageUrl;
                await updateParagraph(chapterId, paragraphIndex, { imageUrl, imagePrompt });
              } catch (err) {
                console.error(`Image generation failed for paragraph ${paragraphIndex}:`, err);
              }
            }
            return { visualConsistencyRef, coverImageUrl };
          })()
        : Promise.resolve({ visualConsistencyRef: undefined as string | undefined, coverImageUrl: undefined as string | undefined });

    const [, imageResult] = await Promise.all([voiceTask, imageTask]);
    const { visualConsistencyRef, coverImageUrl } = imageResult ?? {};

    await markChapterDone(chapterId);

    const firstParagraph = paragraphs[0] ?? "";
    const { title, summary } = await generateStoryTitleAndSummary(firstParagraph, {
      language: langOption.promptName,
    });

    const updatedContext = {
      ...ctx,
      visualConsistencyRef,
      coverImageUrl,
      summary,
      openaiResponse: paragraphs,
    };
    await updateStory(storyId, {
      title,
      context_json: updatedContext,
    });
    await markStoryDone(storyId);

    return NextResponse.json({ ok: true, status: "done" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
