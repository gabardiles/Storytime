/**
 * Generate a visual consistency reference from story text.
 * Used to keep characters and setting consistent across all images in a story.
 */
import OpenAI from "openai";

export async function generateVisualConsistencyRef(
  paragraphs: string[],
  options?: { language?: string }
): Promise<string> {
  const text = paragraphs.join("\n\n").slice(0, 2000);
  const language = options?.language ?? "English";

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You create a visual reference for a children's book illustrator. Output a single paragraph (2-4 sentences, max 120 words) that will be used for EVERY illustration in the same story. Characters must look IDENTICAL in every image.

Include:
1. Each main character ONLY: species, exact colors, distinctive features (e.g. "orange fur, white chest patch"), face/eye style. Be very specific so the illustrator draws the same character every time.
2. General palette: "Muted earthy tones, moss greens, ochre, soft cream" (or similar).
3. Note: "Same character design in every scene. Setting and location CAN vary between illustrations - each scene may show a different moment in a different place."

Do NOT lock the setting to one place. The story may move. Characters stay the same; where they are can change.

Write in ${language}. Example: "Whiskers: small fox, orange fur, white chest, round brown eyes, soft ears. Squeaky: tiny gray mouse, pink ears. Muted palette: moss green, ochre, cream. Same character designs; setting varies by scene."`,
      },
      {
        role: "user",
        content: `Story text:\n\n${text}\n\nCreate the visual consistency reference:`,
      },
    ],
    temperature: 0.5,
    max_tokens: 200,
  });

  const ref = completion.choices?.[0]?.message?.content?.trim();
  if (!ref) return "";
  return ref.slice(0, 400);
}
