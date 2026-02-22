import { NextResponse } from "next/server";
import { synthesizeToBuffer } from "@/lib/tts";

/**
 * TTS config check (same as /api/debug/tts-config).
 * GET /api/tts-config - config status only
 * GET /api/tts-config?test=1 - run a short TTS test and return error if it fails
 */
export async function GET(request: Request) {
  const skipTts =
    process.env.SKIP_TTS === "true" || process.env.SKIP_TTS === "1";
  const hasCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  let credentialsValid = false;
  if (hasCredentials) {
    try {
      JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!);
      credentialsValid = true;
    } catch {
      credentialsValid = false;
    }
  }

  const ttsEnabled = !skipTts && hasCredentials && credentialsValid;
  const out: Record<string, unknown> = {
    skipTts,
    hasCredentials,
    credentialsValid,
    ttsEnabled,
  };

  const url = new URL(request.url);
  if (url.searchParams.get("test") === "1" && ttsEnabled) {
    try {
      await synthesizeToBuffer("Hi", { languageCode: "en" });
      out.testOk = true;
      out.testError = null;
    } catch (err) {
      out.testOk = false;
      out.testError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json(out);
}
