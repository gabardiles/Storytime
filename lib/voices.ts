/**
 * Google Cloud TTS voice options for story narration.
 * Standard: Neural2/WaveNet. Premium: Gemini TTS.
 */

/** Standard tier: Neural2 and WaveNet voices (free / low cost) */
export const STANDARD_VOICES = [
  {
    id: "lily",
    name: "Ella",
    voiceName: "en-US-Neural2-F",
    description: "Young woman, clear and friendly",
    previewText: "My name is Ella.",
    previewTextSv: "Mitt namn är Ella.",
    previewTextEs: "Mi nombre es Ella.",
  },
  {
    id: "emma",
    name: "Sophie",
    voiceName: "en-US-Neural2-C",
    description: "Calm woman, articulate",
    previewText: "My name is Sophie.",
    previewTextSv: "Mitt namn är Sophie.",
    previewTextEs: "Mi nombre es Sophie.",
  },
  {
    id: "walter",
    name: "Harry",
    voiceName: "en-US-Wavenet-D",
    description: "Older man, slow and soothing",
    previewText: "My name is Harry.",
    previewTextSv: "Mitt namn är Harry.",
    previewTextEs: "Mi nombre es Harry.",
  },
] as const;

/** Premium tier: Gemini TTS voices (Flash or Pro) */
export const PREMIUM_VOICES = [
  { id: "zephyr", name: "Erin", voiceName: "Zephyr", description: "Young woman, bright and energetic", previewText: "My name is Erin.", previewTextSv: "Mitt namn är Erin.", previewTextEs: "Mi nombre es Erin." },
  { id: "achernar", name: "Nora", voiceName: "Achernar", description: "Soft-spoken woman, warm", previewText: "My name is Nora.", previewTextSv: "Mitt namn är Nora.", previewTextEs: "Mi nombre es Nora." },
  { id: "kore", name: "Diana", voiceName: "Kore", description: "Strong woman, firm and confident", previewText: "My name is Diana.", previewTextSv: "Mitt namn är Diana.", previewTextEs: "Mi nombre es Diana." },
  { id: "charon", name: "Marcus", voiceName: "Charon", description: "Deep-voiced man, calm", previewText: "My name is Marcus.", previewTextSv: "Mitt namn är Marcus.", previewTextEs: "Mi nombre es Marcus." },
  { id: "puck", name: "Oliver", voiceName: "Puck", description: "Friendly man, upbeat", previewText: "My name is Oliver.", previewTextSv: "Mitt namn är Oliver.", previewTextEs: "Mi nombre es Oliver." },
  { id: "leda", name: "Mia", voiceName: "Leda", description: "Young girl, cheerful", previewText: "My name is Mia.", previewTextSv: "Mitt namn är Mia.", previewTextEs: "Mi nombre es Mia." },
] as const;

/** @deprecated Use STANDARD_VOICES. Kept for backward compatibility. */
export const VOICE_OPTIONS = STANDARD_VOICES;

export type VoiceTier = "standard" | "premium";
export type VoiceOptionId =
  | (typeof STANDARD_VOICES)[number]["id"]
  | (typeof PREMIUM_VOICES)[number]["id"];

/** Legacy ID mapping for backward compatibility */
const LEGACY_ID_MAP: Record<string, string> = {
  default: "walter",
  "old-man": "walter",
  grandpa: "walter",
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
  model?: "gemini-2.5-flash-tts";
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
  return { engine: "gemini", voiceName, model: "gemini-2.5-flash-tts" };
}

export function getVoiceName(voiceOptionId: string): string {
  const config = getVoiceConfig("standard", voiceOptionId);
  return config.voiceName;
}

export function getPreviewText(voiceOptionId: string, tier: VoiceTier, language?: string): string {
  const voices = getVoicesForTier(tier);
  const voice = voices.find((v) => v.id === voiceOptionId);
  if (!voice) return "My name is Ella.";
  if (language === "es") return voice.previewTextEs;
  if (language === "sv") return voice.previewTextSv;
  return voice.previewText;
}
