import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { supabaseServer } from "./supabase-server";
import { getVoiceConfig, getTierForVoiceId, type VoiceTier } from "./voices";

/** Map app language codes to Google TTS language codes */
const LANGUAGE_TO_GOOGLE: Record<string, string> = {
  en: "en-US",
  sv: "sv-SE",
  es: "es-ES",
};

/**
 * For standard-tier narrators in non-English only; each narrator gets a unique voice.
 * Premium (Gemini) voices use the same voice in all languages. Spanish: Neural2 A/E/H (F), F/G (M).
 * Swedish: Wavenet A–G. Unknown IDs fall back to DEFAULT_NON_ENGLISH_VOICE.
 */
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

function getGoogleClient(): TextToSpeechClient {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsJson?.trim()) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. Add it in Vercel env vars (minified JSON, single line). Or set SKIP_TTS=true to disable voice."
    );
  }
  try {
    const credentials = JSON.parse(credentialsJson);
    return new TextToSpeechClient({ credentials });
  } catch {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON is invalid JSON. Paste the full service account JSON as a single line (no newlines)."
    );
  }
}

const BEDTIME_PROMPT =
  "Read aloud in a warm, soothing bedtime story tone.";

export type SynthesizeOptions = {
  voiceOptionId?: string;
  voiceTier?: VoiceTier;
  languageCode?: string;
};

/**
 * Synthesize speech to MP3 bytes. Does not store to Supabase.
 * Used for voice preview and by generateAudioForParagraph.
 */
export async function synthesizeToBuffer(
  text: string,
  options: SynthesizeOptions = {}
): Promise<Uint8Array> {
  if (process.env.SKIP_TTS === "true" || process.env.SKIP_TTS === "1") {
    throw new Error("TTS is disabled");
  }

  const voiceOptionId = options.voiceOptionId ?? "lily";
  const tier = options.voiceTier ?? "standard";
  const config = getVoiceConfig(tier, voiceOptionId);

  const googleLang =
    LANGUAGE_TO_GOOGLE[options.languageCode ?? "en"] ?? "en-US";

  const client = getGoogleClient();

  // Premium (Gemini) voices: use the same voice for all languages (en, sv, es) so narrator stays consistent.
  // Standard tier in non-English: use language-specific Neural2/Wavenet voices from the map.
  const useGeminiForLanguage =
    !!config.model && ["en-US", "sv-SE", "es-ES"].includes(googleLang);
  const voiceName = useGeminiForLanguage
    ? config.voiceName
    : googleLang !== "en-US"
      ? (NON_ENGLISH_VOICE_MAP[googleLang]?.[voiceOptionId] ??
          DEFAULT_NON_ENGLISH_VOICE[googleLang] ??
          "en-US-Neural2-F")
      : config.voiceName;

  const voiceParams: {
    languageCode: string;
    name: string;
    modelName?: string;
  } = {
    languageCode: googleLang,
    name: voiceName,
  };
  if (config.model && useGeminiForLanguage) {
    voiceParams.modelName = config.model;
  }

  const inputParams: { text: string; prompt?: string } = { text };
  if (config.engine === "gemini" && useGeminiForLanguage) {
    inputParams.prompt = BEDTIME_PROMPT;
  }

  // Spanish: use a slow rate for clearer, calmer narration.
  const speakingRate = googleLang === "es-ES" ? 0.7 : 1.1;

  const [response] = await client.synthesizeSpeech({
    input: inputParams,
    voice: voiceParams,
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate,
    },
  });

  const audioContent = response.audioContent;
  if (!audioContent || !(audioContent instanceof Uint8Array)) {
    throw new Error("Google TTS did not return audio");
  }

  return audioContent;
}

export async function generateAudioForParagraph(
  text: string,
  options: {
    userId: string;
    storyId: string;
    chapterId: string;
    paragraphIndex: number;
    voiceId?: string;
    voiceOptionId?: string;
    voiceTier?: VoiceTier;
    languageCode?: string;
  }
): Promise<string | null> {
  if (process.env.SKIP_TTS === "true" || process.env.SKIP_TTS === "1") {
    return null;
  }

  const audioContent = await synthesizeToBuffer(text, {
    voiceOptionId: options.voiceId ?? options.voiceOptionId,
    voiceTier: options.voiceTier,
    languageCode: options.languageCode,
  });

  const supabase = supabaseServer();
  const storagePath = `${options.userId}/${options.storyId}/${options.chapterId}_${options.paragraphIndex}.mp3`;

  const { error } = await supabase.storage
    .from("story-audio")
    .upload(storagePath, audioContent, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase storage upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("story-audio").getPublicUrl(storagePath);

  return publicUrl;
}
