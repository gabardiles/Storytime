/**
 * Google Cloud TTS voice options for story narration.
 * Standard: Neural2/Wavenet. Premium: Gemini TTS.
 * Single combined list with ~50% women, ~50% men; premium marked with ★ in UI.
 */

export type VoiceTier = "standard" | "premium";

type VoiceBase = {
  id: string;
  name: string;
  voiceName: string;
  description: string;
  previewText: string;
  previewTextSv: string;
  previewTextEs: string;
};

/** Standard tier: Neural2 and Wavenet voices (free / low cost) */
const STANDARD_VOICES: (VoiceBase & { tier: "standard" })[] = [
  {
    id: "lily",
    name: "Ella",
    voiceName: "en-US-Neural2-F",
    description: "Young woman, clear and friendly",
    previewText: "My name is Ella.",
    previewTextSv: "Mitt namn är Ella.",
    previewTextEs: "Mi nombre es Ella.",
    tier: "standard",
  },
  {
    id: "emma",
    name: "Sophie",
    voiceName: "en-US-Neural2-C",
    description: "Calm woman, articulate",
    previewText: "My name is Sophie.",
    previewTextSv: "Mitt namn är Sophie.",
    previewTextEs: "Mi nombre es Sophie.",
    tier: "standard",
  },
  {
    id: "walter",
    name: "Harry",
    voiceName: "en-US-Wavenet-D",
    description: "Older man, slow and soothing",
    previewText: "My name is Harry.",
    previewTextSv: "Mitt namn är Harry.",
    previewTextEs: "Mi nombre es Harry.",
    tier: "standard",
  },
  {
    id: "rose",
    name: "Grace",
    voiceName: "en-US-Wavenet-E",
    description: "Older woman, warm and soothing",
    previewText: "My name is Grace.",
    previewTextSv: "Mitt namn är Grace.",
    previewTextEs: "Mi nombre es Grace.",
    tier: "standard",
  },
  {
    id: "george",
    name: "George",
    voiceName: "en-US-Wavenet-B",
    description: "Man, gentle and calm",
    previewText: "My name is George.",
    previewTextSv: "Mitt namn är George.",
    previewTextEs: "Mi nombre es George.",
    tier: "standard",
  },
  {
    id: "leo",
    name: "Leo",
    voiceName: "en-US-Neural2-D",
    description: "Man, calm and clear",
    previewText: "My name is Leo.",
    previewTextSv: "Mitt namn är Leo.",
    previewTextEs: "Mi nombre es Leo.",
    tier: "standard",
  },
  {
    id: "theo",
    name: "Theo",
    voiceName: "en-US-Wavenet-A",
    description: "Man, warm and steady",
    previewText: "My name is Theo.",
    previewTextSv: "Mitt namn är Theo.",
    previewTextEs: "Mi nombre es Theo.",
    tier: "standard",
  },
];

/** Premium tier: Gemini TTS voices */
const PREMIUM_VOICES: (VoiceBase & { tier: "premium" })[] = [
  { id: "zephyr", name: "Erin", voiceName: "Zephyr", description: "Young woman, bright and energetic", previewText: "My name is Erin.", previewTextSv: "Mitt namn är Erin.", previewTextEs: "Mi nombre es Erin.", tier: "premium" },
  { id: "achernar", name: "Nora", voiceName: "Achernar", description: "Soft-spoken woman, warm", previewText: "My name is Nora.", previewTextSv: "Mitt namn är Nora.", previewTextEs: "Mi nombre es Nora.", tier: "premium" },
  { id: "kore", name: "Diana", voiceName: "Kore", description: "Strong woman, firm and confident", previewText: "My name is Diana.", previewTextSv: "Mitt namn är Diana.", previewTextEs: "Mi nombre es Diana.", tier: "premium" },
  { id: "charon", name: "Marcus", voiceName: "Charon", description: "Deep-voiced man, calm", previewText: "My name is Marcus.", previewTextSv: "Mitt namn är Marcus.", previewTextEs: "Mi nombre es Marcus.", tier: "premium" },
  { id: "puck", name: "Oliver", voiceName: "Puck", description: "Friendly man, upbeat", previewText: "My name is Oliver.", previewTextSv: "Mitt namn är Oliver.", previewTextEs: "Mi nombre es Oliver.", tier: "premium" },
  { id: "leda", name: "Mia", voiceName: "Leda", description: "Young girl, cheerful", previewText: "My name is Mia.", previewTextSv: "Mitt namn är Mia.", previewTextEs: "Mi nombre es Mia.", tier: "premium" },
  { id: "gacrux", name: "Clara", voiceName: "Gacrux", description: "Older woman, warm and mature", previewText: "My name is Clara.", previewTextSv: "Mitt namn är Clara.", previewTextEs: "Mi nombre es Clara.", tier: "premium" },
];

/** All voices in one list: ~50% women, ~50% men. Order alternates for balance. */
export const ALL_VOICES: (VoiceBase & { tier: VoiceTier })[] = [
  STANDARD_VOICES[0],  // Ella F
  STANDARD_VOICES[2],  // Harry M
  STANDARD_VOICES[1],  // Sophie F
  STANDARD_VOICES[3],  // Grace F
  STANDARD_VOICES[4],  // George M
  STANDARD_VOICES[5],  // Leo M
  STANDARD_VOICES[6],  // Theo M
  PREMIUM_VOICES[0],   // Erin F
  PREMIUM_VOICES[3],   // Marcus M
  PREMIUM_VOICES[1],   // Nora F
  PREMIUM_VOICES[4],   // Oliver M
  PREMIUM_VOICES[2],   // Diana F
  PREMIUM_VOICES[5],   // Mia F
  PREMIUM_VOICES[6],   // Clara F (older)
];

export type VoiceOptionId = (typeof ALL_VOICES)[number]["id"];

/** Legacy ID mapping for backward compatibility */
const LEGACY_ID_MAP: Record<string, string> = {
  default: "walter",
  "old-man": "walter",
  grandpa: "walter",
  adam: "emma",
  "old-slow-man": "walter",
};

export function getAllVoices(): (VoiceBase & { tier: VoiceTier })[] {
  return ALL_VOICES;
}

export function getTierForVoiceId(voiceOptionId: string): VoiceTier {
  const resolved = LEGACY_ID_MAP[voiceOptionId] ?? voiceOptionId;
  const v = ALL_VOICES.find((x) => x.id === resolved);
  return v?.tier ?? "standard";
}

export function getVoicesForTier(tier: VoiceTier): (VoiceBase & { tier: VoiceTier })[] {
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
  const tier = getTierForVoiceId(voiceOptionId);
  const config = getVoiceConfig(tier, voiceOptionId);
  return config.voiceName;
}

export function getPreviewText(voiceOptionId: string, language?: string): string {
  const voice = ALL_VOICES.find((v) => v.id === (LEGACY_ID_MAP[voiceOptionId] ?? voiceOptionId));
  if (!voice) return "My name is Ella.";
  if (language === "es") return voice.previewTextEs;
  if (language === "sv") return voice.previewTextSv;
  return voice.previewText;
}
