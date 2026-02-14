import { loadRuleset, LengthKey, RulesetId } from "./rulesets";
import { getLanguageOption } from "./languages";

export type StoryContextInput = {
  userInput: string;
  tags: string[];
  tone: string;
  lengthKey: LengthKey;
  rulesetId: RulesetId;
  storyRules?: string;
  instructionsFromFile?: string;
  language?: string;
};

export type StorySpec = {
  tone: string;
  lengthKey: LengthKey;
  paragraphCount: number;
  rules: ReturnType<typeof loadRuleset>;
  context: {
    userInput: string;
    tags: string[];
  };
  globalStyleHint: string;
  storyRules: string;
  instructionsFromFile: string;
  language: string;
};

export function buildStorySpec(input: StoryContextInput): StorySpec {
  const rules = loadRuleset(input.rulesetId);
  const paragraphCount =
    rules.paragraphCountByLength[input.lengthKey] ?? 8;

  const globalStyleHint = `Tone: ${input.tone}. Bedtime-safe, calm pacing, simple language, gentle conflict, soothing ending.`;

  const instructionsFromFile = input.instructionsFromFile ?? "";
  const language = input.language ?? "en";
  const langOption = getLanguageOption(language);

  return {
    tone: input.tone,
    lengthKey: input.lengthKey,
    paragraphCount,
    rules,
    context: { userInput: input.userInput, tags: input.tags },
    globalStyleHint,
    storyRules: input.storyRules ?? "",
    instructionsFromFile,
    language: langOption.promptName,
  };
}

export function buildOpenAIPrompt(
  spec: StorySpec,
  chapterIndex: number,
  recap?: string
): string {
  return [
    `Write a bedtime story chapter.`,
    `Write the story entirely in ${spec.language}.`,
    `Chapter index: ${chapterIndex}`,
    recap ? `Recap so far: ${recap}` : "",
    `User input: ${spec.context.userInput}`,
    `Tags: ${spec.context.tags.join(", ")}`,
    `Style: ${spec.globalStyleHint}`,
    spec.instructionsFromFile
      ? `Global rules (from instructions.md):\n${spec.instructionsFromFile}`
      : "",
    spec.storyRules ? `Story rules (user):\n${spec.storyRules}` : "",
    `Output exactly ${spec.paragraphCount} paragraphs.`,
    `Each paragraph should be 2-5 sentences.`,
    `Keep it kid-safe. End the final paragraph calm and sleepy.`,
    `Return JSON array of strings. No extra text.`,
  ]
    .filter(Boolean)
    .join("\n");
}
