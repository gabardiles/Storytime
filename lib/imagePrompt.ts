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
};

/**
 * Build a DALL-E prompt for a story paragraph, following IMAGE_STYLE_GUIDE Section 10.
 * When visualConsistencyRef is provided, characters and setting stay consistent across the story.
 */
export function buildImagePrompt(
  paragraphText: string,
  context?: ImagePromptContext
): string {
  const sceneDescription = paragraphText.slice(0, 500).trim();
  const parts = [
    STYLE_ANCHOR,
    FORMAT_COMPOSITION,
    CHARACTER_RULES,
    ...(context?.visualConsistencyRef
      ? [
          `CHARACTER AND SCENE CONSISTENCY - draw the SAME characters with the SAME appearance in every image: ${context.visualConsistencyRef}`,
        ]
      : []),
    LIGHTING,
    `Scene to illustrate: ${sceneDescription}`,
    TEXTURE_ENFORCEMENT,
    ANTI_DRIFT,
  ];
  return parts.join(" ");
}
