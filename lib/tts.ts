import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { supabaseServer } from "./supabase-server";
import { getVoiceConfig, type VoiceTier } from "./voices";

/** Map app language codes to Google TTS language codes */
const LANGUAGE_TO_GOOGLE: Record<string, string> = {
  en: "en-US",
  sv: "sv-SE",
  es: "es-ES",
};

/**
 * For non-English, map narrator choice (voiceOptionId) to a Google Cloud TTS voice.
 * Spanish (es-ES): Neural2 A/E/H female, F/G male. Swedish (sv-SE): Wavenet A–G.
 * Unknown IDs fall back to first voice for that language.
 */
const NON_ENGLISH_VOICE_MAP: Record<
  string,
  Partial<Record<string, string>>
> = {
  "es-ES": {
    lily: "es-ES-Neural2-A",
    emma: "es-ES-Neural2-E",
    walter: "es-ES-Neural2-F",
    zephyr: "es-ES-Neural2-A",
    achernar: "es-ES-Neural2-E",
    kore: "es-ES-Neural2-H",
    charon: "es-ES-Neural2-F",
    puck: "es-ES-Neural2-G",
    leda: "es-ES-Neural2-H",
  },
  "sv-SE": {
    lily: "sv-SE-Wavenet-A",
    emma: "sv-SE-Wavenet-B",
    walter: "sv-SE-Wavenet-C",
    zephyr: "sv-SE-Wavenet-A",
    achernar: "sv-SE-Wavenet-D",
    kore: "sv-SE-Wavenet-F",
    charon: "sv-SE-Wavenet-E",
    puck: "sv-SE-Wavenet-G",
    leda: "sv-SE-Wavenet-A",
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

  // For non-English, use language-specific voices (multiple female/male). No Gemini for these locales.
  const useStandardForLanguage = googleLang !== "en-US";
  const voiceName = useStandardForLanguage
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
  // Only use Gemini model for English; for Spanish/Swedish etc. use standard API only.
  if (config.model && !useStandardForLanguage) {
    voiceParams.modelName = config.model;
  }

  const inputParams: { text: string; prompt?: string } = { text };
  if (config.engine === "gemini" && !useStandardForLanguage) {
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
