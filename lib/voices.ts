/**
 * Google Cloud TTS voice options for story narration.
 * Voice names from Cloud Text-to-Speech (Neural2, Chirp HD, Wavenet).
 */
export const VOICE_OPTIONS = [
  {
    id: "default",
    name: "Default",
    voiceName: "en-US-Neural2-F", // Warm female narrator
    description: "Warm, friendly narrator",
  },
  {
    id: "old-man",
    name: "Grandpa (old man)",
    voiceName: "en-US-Neural2-D", // Mature male
    description: "Wise, gentle storyteller",
  },
  {
    id: "adam",
    name: "Adam",
    voiceName: "en-US-Neural2-C",
    description: "Clear male voice",
  },
  {
    id: "old-slow-man",
    name: "Old slow man",
    voiceName: "en-US-Wavenet-D",
    description: "Slow, soothing old man",
  },
] as const;

export type VoiceOptionId = (typeof VOICE_OPTIONS)[number]["id"];

export function getVoiceName(voiceOptionId: string): string {
  const option = VOICE_OPTIONS.find((v) => v.id === voiceOptionId);
  const voiceName = option?.voiceName ?? VOICE_OPTIONS[0].voiceName;

  if (voiceOptionId === "default" && process.env.GOOGLE_TTS_VOICE_NAME) {
    return process.env.GOOGLE_TTS_VOICE_NAME;
  }

  return voiceName;
}
