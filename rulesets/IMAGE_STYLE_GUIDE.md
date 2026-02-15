# AI Bedtime Stories — Image Style Guide

**Visual Consistency Rules** · Version 1.0

---

## 1. Core Style Identity (Must Always Be Included)

All generated images must follow this foundational style. **This paragraph defines the world. It must never be shortened or altered.**

> Soft indie children's book illustration in painterly 2D gouache and watercolor style. Visible brush texture and subtle watercolor paper grain. Muted earthy color palette with moss greens, warm ochre, burnt orange, dusty blues and soft cream tones. Gentle diffused lighting. Slightly flattened storybook perspective. Calm whimsical atmosphere. Matte finish.

**Never:**
- Photorealistic
- 3D
- Glossy
- Cinematic
- High contrast

---

## 2. Target Age & Emotional Tone

| Setting | Value |
|--------|-------|
| **Audience** | 4–8 years old |
| **Primary goal** | Wonder and magical curiosity |
| **Bedtime energy** | Calm, safe, gentle |

**Images must feel:**
- Safe
- Curious
- Soft
- Magical but never intense
- Calm in visual energy

**Avoid:**
- Visual chaos
- Fear
- Harsh tension
- Aggressive movement
- Dark horror-like shadows

If the story contains conflict, the visual tone must remain gentle.

---

## 3. Format & Composition Rules

| Setting | Value |
|--------|-------|
| **Aspect ratio** | 4:3 |
| **Layout** | Designed for mobile with text below the image |

**Composition:**
- Main subject slightly above vertical center
- Clear focal point
- Balanced centered or slightly weighted composition
- Foreground, midground, soft layered background
- Important elements within middle 70% of frame
- No cropped heads or cut-off limbs
- No extreme perspective distortion

**Perspective:**
- Slightly flattened
- Storybook depth
- No dramatic camera angles

---

## 4. Color System

Palette must remain muted and earthy.

**Allowed core tones:**
- Moss green, forest green, sage
- Warm ochre, burnt orange, muted terracotta
- Dusty blue
- Soft cream, warm ivory
- Deep blue-green (for night)
- Charcoal navy (not black)

**Never use:**
- Neon colors
- Hyper-saturated tones
- Pure black
- Pure white
- Bright digital gradients

**Special cases:**
- Snow → warm ivory
- Night sky → deep blue-green
- Shadows → soft cool tones, never harsh

---

## 5. Lighting System

**Lighting range:** 3–5 (soft atmospheric, never dramatic)

| Time | Treatment |
|------|-----------|
| **Day** | Diffused natural light, no sharp shadows, soft atmospheric haze |
| **Golden hour** | Warm soft glow, gentle light accents, calm shadows |
| **Night** | Deep blue-green tones, soft window glow, subtle stars, low contrast |

**Never:**
- Spotlight lighting
- Rim lighting
- HDR contrast
- Cinematic drama

---

## 6. Character Design Rules

**All characters must follow:**
- Rounded shapes, soft silhouettes
- Simple dot or small oval eyes
- Minimal facial features
- No visible sharp teeth
- No sharp claws
- No aggressive expressions
- Gentle posture
- Child-friendly proportions

**Texture:**
- Flat color blocks
- Subtle brush texture overlay
- Very light shading only

**Anthropomorphic characters:**
- Clothing must be subtle
- Same muted palette
- No logos
- No modern graphic fashion
- No high-detail accessories

**Natural animals:**
- Stylized anatomy
- Storybook interpretation
- Not realistic wildlife illustration

**Characters must never look:**
- Pixar 3D
- Anime
- Hyper realistic
- Over-detailed

---

## 7. Environment Rules

**Worlds may vary:** Forest, ocean, jungle, desert, city, fantasy realm.

**All environments must:**
- Maintain painterly 2D style
- Use muted palette
- Keep calm lighting
- Include visible brush strokes
- Avoid realism

**Environmental density:**
- Lean airy and readable (Direction A)
- Not overly cluttered
- Decorative but calm

**Magic elements:**
- Subtle glow
- Gentle visual cues
- No explosive effects
- No intense particle effects

---

## 8. Texture Enforcement

Every image must include:
- Visible brush strokes
- Subtle pigment variation
- Watercolor paper grain
- Matte finish

**If image appears smooth or digital → regenerate.**

---

## 9. Anti-Drift Rules

**Always avoid:**
- Photorealistic rendering
- 3D render style
- Unreal engine look
- Glossy lighting
- High contrast shadows
- Hyper detailed fur
- Vector clipart style
- Stock illustration look
- Heavy outlines
- Hard comic linework
- Overly busy micro-detail

**Never remove the style anchor paragraph from the prompt. Never shorten it. Never simplify it.**

Consistency depends on repetition.

---

## 10. Scene Structure Template (For API Prompts)

Each image request must follow this structure, in order:

1. Style Anchor (Section 1)
2. Format & Composition line
3. Character rules line
4. Lighting specification
5. Scene description from story
6. Texture enforcement line
7. Anti-drift negative reinforcement

**Structure order must remain identical for all generations.**

---

## 11. Quality Checklist Before Accepting Image

- [ ] Does it look hand-painted?
- [ ] Is the palette muted and earthy?
- [ ] Is lighting soft and calm?
- [ ] Are characters rounded and gentle?
- [ ] Is there visible brush texture?
- [ ] Does it feel safe for bedtime?
- [ ] Would it belong in the same illustrated book as previous images?

**If any answer is no → regenerate.**

---

## 12. Brand Positioning Summary

**Visual identity is:**
- Soft indie Scandinavian picture book aesthetic
- Painterly 2D
- Calm magical curiosity
- Gentle natural worlds
- Handcrafted feel
- Non-digital, non-cinematic

This is not generic AI art. This is a cohesive illustrated universe.


## Mechanical & Space Scenes (Drift Control)

When the scene includes vehicles, robots, machines, spaceships, or space environments, the model tends to drift toward cinematic/3D/glossy rendering. To prevent this, ALWAYS enforce extra simplification.

### Mechanical Object Rendering Rules
- Vehicles and machines must be **storybook-simple**, rounded, and hand-painted.
- Use **flat gouache color blocks** with **minimal shading**.
- **No reflections**, **no metallic realism**, **no chrome**, **no glossy paint**.
- Avoid complex surface details: no panels, bolts, vents, headlights, or realistic textures.
- Keep details to a minimum: 1–2 simple accents max.
- Matte finish, visible brush strokes, paper grain always.

Add this line to prompts when vehicles appear:
"very simplified shapes, flat gouache color blocks, minimal shading, no reflections, no realistic metallic surfaces, storybook interpretation"

### Space / Night Sky Rendering Rules
- Space must feel **calm and bedtime-safe**, not epic or cinematic.
- Background: **muted deep blue-green / dusty blue**, soft haze, gentle star dots.
- Moon: **soft glow**, low contrast, lightly textured, not highly detailed or photoreal.
- Avoid strong light beams, engine flares, dramatic starfields, or realistic planets.

Add this line to prompts for space scenes:
"soft low-contrast night sky, muted stars, gentle glow, no dramatic lighting, no realistic space rendering"

### Hard Avoid (Space/Vehicle Drift)
Always avoid:
- cinematic lighting, HDR, rim light, bloom
- realistic metallic surfaces
- 3D render look
- hyper-detailed moon textures
- realistic Earth/planets
- dramatic rocket flames and motion blur

If the image looks glossy, cinematic, or over-rendered → regenerate.
