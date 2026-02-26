/**
 * Client-safe voice list helpers: per-language list with no duplicate voices.
 * Used by CreateStoryForm and Settings. Does not import tts (server-only).
 */

import { getAllVoices, getVoiceConfig, getTierForVoiceId } from "./voices";

const LANGUAGE_TO_GOOGLE: Record<string, string> = {
  en: "en-US",
  sv: "sv-SE",
  es: "es-ES",
};

/** Same as tts NON_ENGLISH_VOICE_MAP: standard-tier only, one voice per narrator. */
const NON_ENGLISH_VOICE_MAP: Record<
  string,
  Partial<Record<string, string>>
> = {
  "es-ES": {
    lily: "es-ES-Neural2-A",
    emma: "es-ES-Neural2-E",
    walter: "es-ES-Neural2-F",
    rose: "es-ES-Neural2-H",
    george: "es-ES-Neural2-F",
    leo: "es-ES-Neural2-G",
    theo: "es-ES-Neural2-G",
  },
  "sv-SE": {
    lily: "sv-SE-Wavenet-A",
    emma: "sv-SE-Wavenet-B",
    walter: "sv-SE-Wavenet-C",
    rose: "sv-SE-Wavenet-D",
    george: "sv-SE-Wavenet-E",
    leo: "sv-SE-Wavenet-F",
    theo: "sv-SE-Wavenet-G",
  },
};

const DEFAULT_NON_ENGLISH_VOICE: Record<string, string> = {
  "es-ES": "es-ES-Neural2-A",
  "sv-SE": "sv-SE-Wavenet-A",
};

/**
 * Backend voice name used for this narrator in the given language (for deduping the list).
 */
export function getEffectiveVoiceName(
  voiceOptionId: string,
  languageCode: string
): string {
  const googleLang = LANGUAGE_TO_GOOGLE[languageCode] ?? "en-US";
  const config = getVoiceConfig(getTierForVoiceId(voiceOptionId), voiceOptionId);
  const useGemini =
    !!config.model && ["en-US", "sv-SE", "es-ES"].includes(googleLang);
  if (useGemini) return config.voiceName;
  if (googleLang !== "en-US") {
    return (
      NON_ENGLISH_VOICE_MAP[googleLang]?.[voiceOptionId] ??
      DEFAULT_NON_ENGLISH_VOICE[googleLang] ??
      "en-US-Neural2-F"
    );
  }
  return config.voiceName;
}

/**
 * Voices to show in the narrator dropdown for this language. No duplicates: only one option per actual voice.
 */
export function getVoicesForLanguage(languageCode: string): ReturnType<typeof getAllVoices> {
  const all = getAllVoices();
  const seen = new Set<string>();
  return all.filter((v) => {
    const key = getEffectiveVoiceName(v.id, languageCode);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * If the current voiceId is a duplicate for this language (same voice as another option),
 * returns the canonical option id to show (first in list order). Otherwise returns voiceId.
 */
export function getCanonicalVoiceIdForLanguage(
  voiceId: string,
  languageCode: string
): string {
  const list = getVoicesForLanguage(languageCode);
  const effective = getEffectiveVoiceName(voiceId, languageCode);
  const found = list.find((v) => getEffectiveVoiceName(v.id, languageCode) === effective);
  return found?.id ?? voiceId;
}
