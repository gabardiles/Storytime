import { supabaseServer } from "./supabase-server";

export async function insertStory(input: {
  userId: string | null;
  tone: string;
  lengthKey: string;
  rulesetId: string;
  contextJson: Record<string, unknown>;
}) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("stories")
    .insert({
      user_id: input.userId,
      tone: input.tone,
      length_key: input.lengthKey,
      ruleset_id: input.rulesetId,
      context_json: input.contextJson,
      status: "generating",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function insertChapter(storyId: string, chapterIndex: number) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("chapters")
    .insert({
      story_id: storyId,
      chapter_index: chapterIndex,
      status: "generating",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export type ParagraphInsert = {
  chapterId: string;
  paragraphIndex: number;
  text: string;
  audioUrl: string | null;
};

export async function insertParagraphs(paragraphs: ParagraphInsert[]) {
  const sb = supabaseServer();
  const payload = paragraphs.map((p) => ({
    chapter_id: p.chapterId,
    paragraph_index: p.paragraphIndex,
    text: p.text,
    audio_url: p.audioUrl,
    status: p.audioUrl ? "audio_ready" : "text_ready",
  }));

  const { error } = await sb.from("paragraphs").insert(payload);
  if (error) throw error;
}

export async function updateParagraph(
  chapterId: string,
  paragraphIndex: number,
  updates: { imageUrl: string; imagePrompt: string }
) {
  const sb = supabaseServer();
  const { error } = await sb
    .from("paragraphs")
    .update({
      image_url: updates.imageUrl,
      image_prompt: updates.imagePrompt,
    })
    .eq("chapter_id", chapterId)
    .eq("paragraph_index", paragraphIndex);
  if (error) throw error;
}

export async function markChapterDone(chapterId: string) {
  const sb = supabaseServer();
  const { error } = await sb
    .from("chapters")
    .update({ status: "done" })
    .eq("id", chapterId);
  if (error) throw error;
}

export async function markStoryDone(storyId: string) {
  const sb = supabaseServer();
  const { error } = await sb
    .from("stories")
    .update({ status: "done" })
    .eq("id", storyId);
  if (error) throw error;
}

export async function updateStory(
  storyId: string,
  updates: { title?: string; context_json?: Record<string, unknown> }
) {
  const sb = supabaseServer();
  const { error } = await sb
    .from("stories")
    .update(updates)
    .eq("id", storyId);
  if (error) throw error;
}

export async function getStoryFull(storyId: string) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("stories")
    .select(
      `
      id, user_id, title, tone, length_key, ruleset_id, context_json, status, created_at,
      chapters (
        id, chapter_index, status, created_at,
        paragraphs ( id, paragraph_index, text, audio_url, image_url, status, created_at )
      )
    `
    )
    .eq("id", storyId)
    .single();

  if (error) throw error;

  if (data?.chapters) {
    (data.chapters as { chapter_index: number }[]).sort(
      (a, b) => a.chapter_index - b.chapter_index
    );
    (data.chapters as { paragraphs?: { paragraph_index: number }[] }[]).forEach(
      (c) => {
        if (c.paragraphs) {
          c.paragraphs.sort((a, b) => a.paragraph_index - b.paragraph_index);
        }
      }
    );
  }
  return data;
}

export async function getStoryByIdAndUser(storyId: string, userId: string) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("stories")
    .select("id, user_id")
    .eq("id", storyId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data;
}
