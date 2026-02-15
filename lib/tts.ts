import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { supabaseServer } from "./supabase-server";
import { getVoiceConfig, type VoiceTier } from "./voices";

/** Map app language codes to Google TTS language codes */
const LANGUAGE_TO_GOOGLE: Record<string, string> = {
  en: "en-US",
  sv: "sv-SE",
};

/** Fallback voices for non-English (no Neural2 for all languages) */
const LANGUAGE_FALLBACK_VOICES: Record<string, string> = {
  "en-US": "en-US-Neural2-F",
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

  const voiceName =
    config.engine === "standard" && googleLang !== "en-US"
      ? LANGUAGE_FALLBACK_VOICES[googleLang] ?? "en-US-Neural2-F"
      : config.voiceName;

  const voiceParams: {
    languageCode: string;
    name: string;
    modelName?: string;
  } = {
    languageCode: googleLang,
    name: voiceName,
  };
  if (config.model) {
    voiceParams.modelName = config.model;
  }

  const inputParams: { text: string; prompt?: string } = { text };
  if (config.engine === "gemini") {
    inputParams.prompt = BEDTIME_PROMPT;
  }

  const [response] = await client.synthesizeSpeech({
    input: inputParams,
    voice: voiceParams,
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 1.1,
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
