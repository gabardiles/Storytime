import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { synthesizeToBuffer } from "@/lib/tts";
import { getPreviewText } from "@/lib/voices";

export async function GET(req: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.SKIP_TTS === "true" || process.env.SKIP_TTS === "1") {
      return new NextResponse(null, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const voiceId = searchParams.get("voiceId") ?? "lily";
    const voiceTier = (searchParams.get("voiceTier") ?? "standard") as
      | "standard"
      | "premium"
      | "premium-plus";
    const language = searchParams.get("language") ?? "en";

    const previewText = getPreviewText(voiceId, voiceTier);
    const buffer = await synthesizeToBuffer(previewText, {
      voiceOptionId: voiceId,
      voiceTier,
      languageCode: language,
    });

    const body = Buffer.from(buffer);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err) {
    console.error("Voice preview error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Voice preview failed" },
      { status: 500 }
    );
  }
}
