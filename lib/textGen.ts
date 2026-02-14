import OpenAI from "openai";

export async function generateParagraphs(spec: {
  paragraphCount: number;
  globalStyleHint: string;
  userInput: string;
  tags: string[];
  chapterIndex: number;
  recap?: string;
  storyRules?: string;
  instructionsFromFile?: string;
  language?: string;
}): Promise<string[]> {
  const language = spec.language ?? "English";
  const prompt = [
    `Write a bedtime story chapter.`,
    `Write the story entirely in ${language}.`,
    `Chapter index: ${spec.chapterIndex}`,
    spec.recap ? `Recap so far: ${spec.recap}` : "",
    `User input: ${spec.userInput}`,
    `Tags: ${spec.tags.join(", ")}`,
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

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You respond only with valid JSON. No markdown, no code blocks, no extra text. Just the raw JSON array.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 4096,
  });

  let content: string =
    completion.choices?.[0]?.message?.content ?? "[]";

  // Strip markdown code blocks if present (e.g. ```json ... ```)
  content = content.trim();
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  let arr: unknown;
  try {
    arr = JSON.parse(content);
  } catch {
    throw new Error(
      `LLM did not return JSON array. Got: ${content.slice(0, 200)}`
    );
  }

  if (!Array.isArray(arr) || !arr.every((p) => typeof p === "string")) {
    throw new Error(`LLM JSON invalid shape.`);
  }
  return arr as string[];
}

export async function generateStoryTitleAndSummary(
  firstParagraph: string,
  options?: { language?: string }
): Promise<{ title: string; summary: string }> {
  const language = options?.language ?? "English";
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          `You respond only with valid JSON. No markdown. Return {"title": "...", "summary": "..."}. Title: 5-10 words, catchy. Summary: 1-2 sentences, ~80-120 characters, enough to understand the story context. Return both title and summary in ${language}.`,
      },
      {
        role: "user",
        content: `Story opening: "${firstParagraph.slice(0, 500)}"\n\nReturn JSON with title and summary in ${language}.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 150,
  });

  let content = completion.choices?.[0]?.message?.content ?? "{}";
  content = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(content) as { title?: string; summary?: string };
    return {
      title: (parsed.title ?? "Untitled Story").slice(0, 100),
      summary: (parsed.summary ?? firstParagraph.slice(0, 80)).slice(0, 150),
    };
  } catch {
    return {
      title: firstParagraph.split(/[.!?]/)[0]?.slice(0, 50) ?? "Untitled Story",
      summary: firstParagraph.slice(0, 80),
    };
  }
}
