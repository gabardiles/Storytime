import { loadRuleset, LengthKey, RulesetId } from "./rulesets";
import { getLanguageOption } from "./languages";
import { parseTones, hasInformatical } from "./tones";
import { buildTagDirectivesBlock } from "./tags";

export type StoryContextInput = {
  userInput: string;
  tags: string[];
  tone: string;
  lengthKey: LengthKey;
  rulesetId: RulesetId;
  storyRules?: string;
  instructionsFromFile?: string;
  language?: string;
  factsOnly?: boolean;
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
  tagDirectives: string;
  globalStyleHint: string;
  storyRules: string;
  instructionsFromFile: string;
  language: string;
  factsOnly: boolean;
};

export function buildStorySpec(input: StoryContextInput): StorySpec {
  const rules = loadRuleset(input.rulesetId);
  const paragraphCount =
    rules.paragraphCountByLength[input.lengthKey] ?? 8;

  const toneList = parseTones(input.tone);
  const toneLabel = toneList.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(" + ");
  const factsOnly = input.factsOnly === true && hasInformatical(toneList);

  let globalStyleHint: string;
  if (factsOnly) {
    globalStyleHint = `FACTS MODE: Do NOT write a story. Write a collection of accurate, kid-friendly facts. Extract topics from the user input (animals, objects, nature, space, etc.). For each topic, provide true facts: diet, habitat, behavior, relationships with other animals, what they eat, what they don't see as prey, etc. Example: "A boa eating a cat and making friends" → topics: boas (diet, prey, social behavior). Each paragraph = facts about a topic or subtopic. Kid-safe, educational tone. Tone: ${toneLabel}. Present facts in a warm, soothing way if cozy is selected.`;
  } else {
    globalStyleHint = `Tone: ${toneLabel}. Bedtime-safe, calm pacing, simple language, gentle conflict, soothing ending.`;
    if (hasInformatical(toneList)) {
      globalStyleHint += ` INFORMATICAL: Weave in real, accurate facts about the key topic (animals, objects, nature) like a kids' science video. Vary how you share info: "Did you know...?", "In real life, ...", "Here's something cool: ...", "Some [animals] actually...", or naturally describe traits as the story unfolds. Include true details: what they really eat, how they look (colors, scales, fur, size), how they move, where they live, and fun behaviors. Describe real traits—e.g. snakes shed their skin, owls can turn their heads almost all the way around, lizards can regrow tails. Weave facts into the narrative so they feel part of the story, not a lecture. Make it a learning session that stays fun and story-driven.`;
    }
  }

  const instructionsFromFile = input.instructionsFromFile ?? "";
  const language = input.language ?? "en";
  const langOption = getLanguageOption(language);

  return {
    tone: input.tone,
    lengthKey: input.lengthKey,
    paragraphCount,
    rules,
    context: { userInput: input.userInput, tags: input.tags },
    tagDirectives: buildTagDirectivesBlock(input.tags),
    globalStyleHint,
    storyRules: input.storyRules ?? "",
    instructionsFromFile,
    language: langOption.promptName,
    factsOnly,
  };
}

export function buildOpenAIPrompt(
  spec: StorySpec,
  chapterIndex: number,
  recap?: string
): string {
  const opening = spec.factsOnly
    ? `Write a collection of facts about the topics. Do NOT write a story. Extract topics from the user input and provide accurate, kid-friendly facts.`
    : `Write a bedtime story chapter.`;
  return [
    opening,
    spec.factsOnly
      ? `Write the facts entirely in ${spec.language}.`
      : `Write the story entirely in ${spec.language}.`,
    `Chapter index: ${chapterIndex}`,
    recap ? `Recap so far: ${recap}` : "",
    `User input: ${spec.context.userInput}`,
    spec.tagDirectives
      ? `TAG DIRECTIVES (mandatory — follow these for selected tags):\n${spec.tagDirectives}`
      : "",
    `Style: ${spec.globalStyleHint}`,
    spec.instructionsFromFile
      ? `Global rules (from instructions.md):\n${spec.instructionsFromFile}`
      : "",
    spec.storyRules ? `Story rules (user):\n${spec.storyRules}` : "",
    `Output exactly ${spec.paragraphCount} paragraphs.`,
    `Each paragraph should be 2-5 sentences.`,
    spec.factsOnly
      ? `Keep it kid-safe.`
      : `Keep it kid-safe. End the final paragraph calm and sleepy.`,
    `Return JSON array of strings. No extra text.`,
  ]
    .filter(Boolean)
    .join("\n");
}
