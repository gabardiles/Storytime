/**
 * Google Cloud TTS voice options for story narration.
 * Standard: Neural2/WaveNet. Premium: Gemini TTS.
 */

/** Standard tier: Neural2 and WaveNet voices (free / low cost) */
export const STANDARD_VOICES = [
  {
    id: "lily",
    name: "Lily",
    voiceName: "en-US-Neural2-F",
    description: "Clear, friendly female narrator",
    previewText: "My name is Lily.",
  },
  {
    id: "grandpa",
    name: "Grandpa",
    voiceName: "en-US-Neural2-D",
    description: "Wise, gentle storyteller",
    previewText: "My name is Grandpa.",
  },
  {
    id: "emma",
    name: "Emma",
    voiceName: "en-US-Neural2-C",
    description: "Articulate female narrator",
    previewText: "My name is Emma.",
  },
  {
    id: "walter",
    name: "Walter",
    voiceName: "en-US-Wavenet-D",
    description: "Slow, soothing male",
    previewText: "My name is Walter.",
  },
] as const;

/** Premium tier: Gemini TTS voices (Flash or Pro) */
export const PREMIUM_VOICES = [
  { id: "zephyr", name: "Zephyr", voiceName: "Zephyr", description: "Bright, clear female", previewText: "My name is Zephyr." },
  { id: "achernar", name: "Achernar", voiceName: "Achernar", description: "Soft, warm female", previewText: "My name is Achernar." },
  { id: "kore", name: "Kore", voiceName: "Kore", description: "Strong, firm female", previewText: "My name is Kore." },
  { id: "charon", name: "Charon", voiceName: "Charon", description: "Deep male", previewText: "My name is Charon." },
  { id: "puck", name: "Puck", voiceName: "Puck", description: "Friendly male", previewText: "My name is Puck." },
  { id: "leda", name: "Leda", voiceName: "Leda", description: "Warm female narrator", previewText: "My name is Leda." },
] as const;

/** @deprecated Use STANDARD_VOICES. Kept for backward compatibility. */
export const VOICE_OPTIONS = STANDARD_VOICES;

export type VoiceTier = "standard" | "premium" | "premium-plus";
export type VoiceOptionId =
  | (typeof STANDARD_VOICES)[number]["id"]
  | (typeof PREMIUM_VOICES)[number]["id"];

/** Legacy ID mapping for backward compatibility */
const LEGACY_ID_MAP: Record<string, string> = {
  default: "lily",
  "old-man": "grandpa",
  adam: "emma",
  "old-slow-man": "walter",
};

export function getVoicesForTier(tier: VoiceTier) {
  if (tier === "standard") return STANDARD_VOICES;
  return PREMIUM_VOICES;
}

export type VoiceConfig = {
  engine: "standard" | "gemini";
  voiceName: string;
  model?: "gemini-2.5-flash-tts" | "gemini-2.5-pro-tts";
};

export function getVoiceConfig(
  tier: VoiceTier,
  voiceOptionId: string
): VoiceConfig {
  const resolvedId = LEGACY_ID_MAP[voiceOptionId] ?? voiceOptionId;

  if (tier === "standard") {
    const option = STANDARD_VOICES.find((v) => v.id === resolvedId);
    const envOverride =
      resolvedId === "lily" ? process.env.GOOGLE_TTS_VOICE_NAME : undefined;
    const voiceName =
      envOverride ?? option?.voiceName ?? STANDARD_VOICES[0].voiceName;
    return { engine: "standard", voiceName };
  }

  const option = PREMIUM_VOICES.find((v) => v.id === resolvedId);
  const voiceName = option?.voiceName ?? PREMIUM_VOICES[0].voiceName;
  const model =
    tier === "premium-plus" ? "gemini-2.5-pro-tts" : "gemini-2.5-flash-tts";
  return { engine: "gemini", voiceName, model };
}

export function getVoiceName(voiceOptionId: string): string {
  const config = getVoiceConfig("standard", voiceOptionId);
  return config.voiceName;
}

export function getPreviewText(voiceOptionId: string, tier: VoiceTier): string {
  const voices = getVoicesForTier(tier);
  const voice = voices.find((v) => v.id === voiceOptionId);
  return voice?.previewText ?? "My name is Lily.";
}
