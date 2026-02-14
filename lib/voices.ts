/**
 * ElevenLabs voice options for story narration.
 * Voice IDs from ElevenLabs premade voices.
 */
export const VOICE_OPTIONS = [
  {
    id: "default",
    name: "Default",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel - warm female
    description: "Warm, friendly narrator",
  },
  {
    id: "old-man",
    name: "Grandpa (old man)",
    voiceId: "JBFqnCBsd6RMkjVDRZzb", // George - mature male, good for storytelling
    description: "Wise, gentle storyteller",
  },
  {
    id: "adam",
    name: "Adam",
    voiceId: "pNInz6obpgDQGcFmaJgB",
    description: "Clear male voice",
  },
  {
    id: "old-slow-man",
    name: "Old slow man",
    voiceId: "WL407qSICo0Q6gjDHRJq",
    description: "Slow, soothing old man",
  },
] as const;

export type VoiceOptionId = (typeof VOICE_OPTIONS)[number]["id"];

export function getVoiceId(voiceOptionId: string): string {
  const option = VOICE_OPTIONS.find((v) => v.id === voiceOptionId);
  const optionVoiceId = option?.voiceId ?? VOICE_OPTIONS[0].voiceId;

  // Only use env override when user selected "default" (allows custom default voice)
  if (voiceOptionId === "default" && process.env.ELEVENLABS_VOICE_ID) {
    return process.env.ELEVENLABS_VOICE_ID;
  }

  return optionVoiceId;
}
