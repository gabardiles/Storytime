#!/usr/bin/env node
/**
 * Minify Google service account JSON for Vercel env vars.
 * Usage: node scripts/minify-google-credentials.js path/to/your-key.json
 *
 * Output: single-line JSON to copy into GOOGLE_APPLICATION_CREDENTIALS_JSON
 */

const fs = require("fs");
const path = process.argv[2];

if (!path) {
  console.error("Usage: node scripts/minify-google-credentials.js <path-to-key.json>");
  console.error("Example: node scripts/minify-google-credentials.js ~/Downloads/my-project-abc123.json");
  process.exit(1);
}

const resolved = path.replace(/^~/, process.env.HOME || process.env.USERPROFILE || "");
if (!fs.existsSync(resolved)) {
  console.error("File not found:", resolved);
  process.exit(1);
}

try {
  const raw = fs.readFileSync(resolved, "utf-8");
  const parsed = JSON.parse(raw);
  const minified = JSON.stringify(parsed);
  console.log("\n--- Copy everything below (single line) into Vercel env var ---\n");
  console.log(minified);
  console.log("\n--- End ---\n");
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
