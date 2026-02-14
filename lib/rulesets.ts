import defaultRules from "@/rulesets/default.json";

export type RulesetId = "default";
export type LengthKey = "micro" | "short" | "medium" | "long";

export type Ruleset = {
  version: number;
  paragraphCountByLength: Record<LengthKey, number>;
  style: Record<string, string | boolean>;
  structure: { beats: string[] };
};

export function loadRuleset(id: RulesetId): Ruleset {
  if (id === "default") return defaultRules as Ruleset;
  return defaultRules as Ruleset;
}
