import { NextResponse } from "next/server";

/**
 * Debug endpoint to check TTS configuration.
 * Call from browser: GET /api/debug/tts-config
 * Returns config status without exposing secrets.
 */
export async function GET() {
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

  return NextResponse.json({
    skipTts,
    hasCredentials,
    credentialsValid,
    ttsEnabled: !skipTts && hasCredentials && credentialsValid,
  });
}
