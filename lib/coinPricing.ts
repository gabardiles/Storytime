import type { VoiceTier } from "./voices";

/**
 * Calculate how many gold coins a chapter costs.
 * Safe to import from both client and server code.
 *
 * First chapter (with cover image):
 *   - text-only (no voice, no image): 1 coin
 *   - standard voice: 2 coins
 *   - premium / premium+: 3 coins
 *
 * Continuation chapter (no image):
 *   - text-only: 1 coin
 *   - standard voice: 1 coin
 *   - premium / premium+: 2 coins
 */
export function calculateChapterCost(
  isFirstChapter: boolean,
  includeVoice: boolean,
  includeImages: boolean,
  voiceTier: VoiceTier
): number {
  if (!includeVoice) return 1;

  const isPremium = voiceTier === "premium" || voiceTier === "premium-plus";

  if (isFirstChapter && includeImages) {
    return isPremium ? 3 : 2;
  }
  return isPremium ? 2 : 1;
}
