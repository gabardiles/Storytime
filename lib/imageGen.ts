/**
 * Image generation for story chapters.
 * Uses DALL-E 3 and Supabase Storage, following IMAGE_STYLE_GUIDE rules.
 */
import OpenAI from "openai";
import { supabaseServer } from "./supabase-server";
import { buildImagePrompt } from "./imagePrompt";
import type { LengthKey } from "./rulesets";

/** Image count per chapter (fixed at 2) */
export function getImageCountForChapter(_lengthKey: LengthKey): number {
  return 2;
}

/** Evenly distributed paragraph indices (0-based) that get images */
export function getParagraphIndicesForImages(
  paragraphCount: number,
  imageCount: number
): number[] {
  if (paragraphCount <= 0 || imageCount <= 0) return [];
  if (imageCount >= paragraphCount) {
    return Array.from({ length: paragraphCount }, (_, i) => i);
  }
  if (imageCount === 1) return [0];
  const indices: number[] = [];
  for (let i = 0; i < imageCount; i++) {
    const idx = Math.round((i * (paragraphCount - 1)) / (imageCount - 1));
    indices.push(idx);
  }
  return indices;
}

export type GenerateImageOptions = {
  storyId: string;
  chapterId: string;
  paragraphIndex: number;
  userId: string;
  /** Visual consistency reference for character/setting across the story */
  visualConsistencyRef?: string;
  /** 0 = opening scene, 1+ = later scene */
  imageIndexInStory?: number;
};

export async function generateImageForParagraph(
  paragraphText: string,
  options: GenerateImageOptions
): Promise<{ imageUrl: string; imagePrompt: string }> {
  const sceneRole =
    options.imageIndexInStory === 0 ? "opening" : "later";
  const prompt = buildImagePrompt(paragraphText, {
    visualConsistencyRef: options.visualConsistencyRef,
    sceneRole,
  });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });

  const imageUrlFromApi = response.data?.[0]?.url;
  if (!imageUrlFromApi) {
    throw new Error("DALL-E did not return an image URL");
  }

  const imageResponse = await fetch(imageUrlFromApi);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();

  const supabase = supabaseServer();
  const storagePath = `${options.userId}/${options.storyId}/${options.chapterId}_${options.paragraphIndex}.png`;

  await supabase.storage.createBucket("story-images", { public: true }).catch(() => {});

  const { error } = await supabase.storage
    .from("story-images")
    .upload(storagePath, imageBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(
      `Supabase storage upload failed: ${error.message}. ` +
        `Ensure the 'story-images' bucket exists (Storage > New bucket) and has a public read policy. See supabase/storage-policy.sql.`
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("story-images").getPublicUrl(storagePath);

  return { imageUrl: publicUrl, imagePrompt: prompt };
}
