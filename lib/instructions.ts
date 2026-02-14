import { readFileSync } from "fs";
import { join } from "path";

export function loadInstructions(): string {
  try {
    const path = join(process.cwd(), "rulesets", "instructions.md");
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
}
