/**
 * Build DALL-E image prompts from IMAGE_STYLE_GUIDE rules.
 * Scene Structure Template (Section 10): Style Anchor → Format → Characters → Lighting → Scene → Texture → Anti-drift
 */

const STYLE_ANCHOR =
  "Soft indie children's book illustration in painterly 2D gouache and watercolor style. Visible brush texture and subtle watercolor paper grain. Muted earthy color palette with moss greens, warm ochre, burnt orange, dusty blues and soft cream tones. Gentle diffused lighting. Slightly flattened storybook perspective. Calm whimsical atmosphere. Matte finish.";

const FORMAT_COMPOSITION =
  "4:3 aspect ratio. Main subject slightly above vertical center. Clear focal point. Balanced centered composition. Foreground, midground, soft layered background. Important elements within middle 70% of frame. No cropped heads or cut-off limbs. Slightly flattened storybook depth.";

const CHARACTER_RULES =
  "Rounded shapes, soft silhouettes. Simple dot or small oval eyes. Minimal facial features. Gentle posture. Child-friendly proportions. Flat color blocks with subtle brush texture. Stylized storybook interpretation. No sharp teeth, claws, or aggressive expressions.";

const LIGHTING =
  "Soft diffused natural light. No sharp shadows. Soft atmospheric haze. Low contrast. Calm shadows.";

const TEXTURE_ENFORCEMENT =
  "Visible brush strokes. Subtle pigment variation. Watercolor paper grain. Matte finish.";

const ANTI_DRIFT =
  "Never photorealistic, 3D, glossy, cinematic, high contrast, Unreal engine look, vector clipart, stock illustration, heavy outlines, hard comic linework, or overly busy micro-detail.";

export type ImagePromptContext = {
  storyTitle?: string;
  tags?: string[];
  /** Visual consistency reference: character and setting descriptions to reuse across all images */
  visualConsistencyRef?: string;
  /** Scene role: first image = opening, later images = story progression */
  sceneRole?: "opening" | "later";
  /** Facts mode: educational illustration of the topic */
  factsMode?: boolean;
};

/** Instructions that vary by scene position to create strong visual variety across the story */
const SCENE_ROLE_PROMPTS = {
  opening:
    "OPENING SCENE - First illustration only. Wide establishing shot. Introduce characters and the story world. Set the mood and place. Welcoming, curious. This is how the story begins.",
  later:
    "LATER SCENE - CRITICAL: This must look COMPLETELY DIFFERENT from the opening. Show a NEW moment: different location, different action, or different part of the story. If the opening showed characters facing each other, show them doing something else - walking, playing, exploring, resting. Use a different composition: closer shot, different angle, or different arrangement. Different background and setting. Do NOT repeat the same scene, same pose, or same framing. This illustration advances the narrative to a new moment.",
};

/**
 * Build a DALL-E prompt for a story paragraph, following IMAGE_STYLE_GUIDE Section 10.
 * When visualConsistencyRef is provided, characters and setting stay consistent across the story.
 * When sceneRole is provided, adds instructions to vary opening vs later images.
 */
export function buildImagePrompt(
  paragraphText: string,
  context?: ImagePromptContext
): string {
  const sceneDescription = paragraphText.slice(0, 500).trim();
  const sceneLine =
    context?.sceneRole === "later"
      ? `Scene to illustrate (a NEW moment, different from the opening): ${sceneDescription}`
      : `Scene to illustrate: ${sceneDescription}`;
  const factsHint = context?.factsMode
    ? "Educational, factual illustration of the topic. Kid-friendly."
    : null;
  const parts = [
    ...(factsHint ? [factsHint] : []),
    ...(context?.tags?.length
      ? [
          `Story themes/setting: ${context.tags.join(", ")}. Ensure illustrations match these themes.`,
        ]
      : []),
    STYLE_ANCHOR,
    FORMAT_COMPOSITION,
    CHARACTER_RULES,
    ...(context?.visualConsistencyRef
      ? [
          `CHARACTER CONSISTENCY - draw the SAME characters with the SAME appearance: ${context.visualConsistencyRef}`,
        ]
      : []),
    ...(context?.sceneRole ? [SCENE_ROLE_PROMPTS[context.sceneRole]] : []),
    LIGHTING,
    sceneLine,
    TEXTURE_ENFORCEMENT,
    ANTI_DRIFT,
  ];
  return parts.join(" ");
}
