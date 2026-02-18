import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { getUserPreferences, upsertUserPreferences } from "@/lib/db";

export async function GET() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prefs = await getUserPreferences(user.id);
    return NextResponse.json({ ui_language: prefs?.ui_language ?? "en" });
  } catch (err) {
    console.error("Failed to get user preferences:", err);
    return NextResponse.json({ ui_language: "en" });
  }
}

export async function PUT(request: Request) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const lang = body.ui_language;
  if (lang !== "en" && lang !== "sv") {
    return NextResponse.json(
      { error: "Invalid language. Must be 'en' or 'sv'." },
      { status: 400 }
    );
  }

  try {
    await upsertUserPreferences(user.id, { ui_language: lang });
    return NextResponse.json({ ui_language: lang });
  } catch (err) {
    console.error("Failed to save user preferences:", err);
    return NextResponse.json(
      { error: "Failed to save preference" },
      { status: 500 }
    );
  }
}
