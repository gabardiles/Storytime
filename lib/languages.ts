/**
 * Language options for story generation and TTS.
 */
export const LANGUAGE_OPTIONS = [
  {
    id: "en",
    name: "English",
    promptName: "English",
    languageCode: "en",
    flag: "🇺🇸",
  },
  {
    id: "sv",
    name: "Swedish",
    promptName: "Swedish",
    languageCode: "sv",
    flag: "🇸🇪",
  },
  {
    id: "es",
    name: "Spanish",
    promptName: "Spanish",
    languageCode: "es",
    flag: "🇪🇸",
  },
] as const;

export type LanguageId = (typeof LANGUAGE_OPTIONS)[number]["id"];

export function getLanguageOption(languageId: string) {
  const option = LANGUAGE_OPTIONS.find((l) => l.id === languageId);
  return option ?? LANGUAGE_OPTIONS[0];
}
