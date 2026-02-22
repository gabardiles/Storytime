import type { VoiceTier } from "./voices";

export type LengthKey = "micro" | "short" | "medium" | "long";

/** First chapter base coins by length (with standard voice + cover image). Premium adds 1. */
const FIRST_CHAPTER_BASE: Record<LengthKey, number> = {
  micro: 1,
  short: 2,
  medium: 3,
  long: 4,
};

/** Continuation chapter base coins by length (standard voice). Premium adds 1. */
const CONTINUATION_BASE: Record<LengthKey, number> = {
  micro: 1,
  short: 1,
  medium: 2,
  long: 3,
};

/**
 * Calculate how many gold coins a chapter costs.
 * Length has a strong impact: longer chapters cost more (more text + voice).
 *
 * First chapter (with cover image): micro 1–2, short 2–3, medium 3–4, long 4–5 coins (standard vs premium voice).
 * Continuation: micro 1–2, short 1–2, medium 2–3, long 3–4 coins.
 * Text-only (no voice): 1 coin.
 */
export function calculateChapterCost(
  isFirstChapter: boolean,
  includeVoice: boolean,
  includeImages: boolean,
  voiceTier: VoiceTier,
  lengthKey: LengthKey = "medium"
): number {
  if (!includeVoice) return 1;

  const isPremium = voiceTier === "premium";
  const base =
    isFirstChapter && includeImages
      ? FIRST_CHAPTER_BASE[lengthKey]
      : CONTINUATION_BASE[lengthKey];
  return base + (isPremium ? 1 : 0);
}
