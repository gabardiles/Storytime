import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { supabaseServer } from "./supabase-server";
import { getVoiceName } from "./voices";

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

function getGoogleVoiceName(
  voiceOptionId: string,
  languageCode?: string
): string {
  const googleLang =
    LANGUAGE_TO_GOOGLE[languageCode ?? "en"] ?? "en-US";
  const isEnglish = googleLang === "en-US";

  if (isEnglish) {
    return getVoiceName(voiceOptionId);
  }
  return LANGUAGE_FALLBACK_VOICES[googleLang] ?? "en-US-Neural2-F";
}

function getGoogleClient(): TextToSpeechClient {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson);
      return new TextToSpeechClient({ credentials });
    } catch {
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS_JSON is invalid JSON"
      );
    }
  }
  return new TextToSpeechClient();
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
    languageCode?: string;
  }
): Promise<string | null> {
  if (process.env.SKIP_TTS === "true" || process.env.SKIP_TTS === "1") {
    return null;
  }

  const voiceOptionId = options.voiceId ?? options.voiceOptionId ?? "default";
  const voiceName = getGoogleVoiceName(voiceOptionId, options.languageCode);
  const googleLang =
    LANGUAGE_TO_GOOGLE[options.languageCode ?? "en"] ?? "en-US";

  const client = getGoogleClient();

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: googleLang,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 0.95,
    },
  });

  const audioContent = response.audioContent;
  if (!audioContent || !(audioContent instanceof Uint8Array)) {
    throw new Error("Google TTS did not return audio");
  }

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
