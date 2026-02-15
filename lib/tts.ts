import { supabaseServer } from "./supabase-server";
import { getVoiceId } from "./voices";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

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
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId =
    options.voiceId ??
    (options.voiceOptionId ? getVoiceId(options.voiceOptionId) : undefined) ??
    process.env.ELEVENLABS_VOICE_ID ??
    "21m00Tcm4TlvDq8ikWAM";

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }

  const isEnglish = !options.languageCode || options.languageCode === "en";
  const body: Record<string, unknown> = {
    text,
    model_id: isEnglish ? "eleven_monolingual_v1" : "eleven_multilingual_v2",
  };
  if (!isEnglish) {
    body.language_code = options.languageCode;
  }

  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs TTS error: ${response.status} ${errText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const supabase = supabaseServer();

  const storagePath = `${options.userId}/${options.storyId}/${options.chapterId}_${options.paragraphIndex}.mp3`;

  const { error } = await supabase.storage
    .from("story-audio")
    .upload(storagePath, audioBuffer, {
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
