/**
 * Tone options for story generation.
 * Multiple tones can be selected (e.g. Info + Adventure).
 */
import { Moon, Laugh, Mountain, Lightbulb } from "lucide-react";

export const TONE_OPTIONS = [
  {
    id: "cozy",
    name: "Cozy",
    icon: Moon,
    description: "Warm, gentle, bedtime-ready",
  },
  {
    id: "funny",
    name: "Funny",
    icon: Laugh,
    description: "Playful, humorous",
  },
  {
    id: "adventurous",
    name: "Adventurous",
    icon: Mountain,
    description: "Exciting, exploratory",
  },
  {
    id: "informatical",
    name: "Informatical",
    icon: Lightbulb,
    description: "Educational, science-for-kids style",
  },
] as const;

export type ToneId = (typeof TONE_OPTIONS)[number]["id"];

/** Serialize tone array for storage (DB tone column is text) */
export function serializeTones(tones: string[]): string {
  if (tones.length === 0) return "cozy";
  return tones.join(",");
}

/** Parse stored tone string back to array */
export function parseTones(tone: string | null | undefined): string[] {
  if (!tone || typeof tone !== "string") return ["cozy"];
  const arr = tone.split(",").map((s) => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : ["cozy"];
}

/** Check if informatical is in the selected tones */
export function hasInformatical(tones: string[]): boolean {
  return tones.includes("informatical");
}

/** Format stored tone string for display (e.g. "Cozy + Adventurous") */
export function formatTonesForDisplay(tone: string | null | undefined): string {
  const arr = parseTones(tone);
  return arr
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" + ");
}
