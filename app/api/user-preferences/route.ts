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
    return NextResponse.json({
      ui_language: prefs?.ui_language ?? "en",
      theme: prefs?.theme ?? null,
      story_defaults: prefs?.story_defaults ?? null,
    });
  } catch (err) {
    console.error("Failed to get user preferences:", err);
    return NextResponse.json({ ui_language: "en", theme: null, story_defaults: null });
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
  if (lang !== undefined && lang !== "en" && lang !== "sv") {
    return NextResponse.json(
      { error: "Invalid language. Must be 'en' or 'sv'." },
      { status: 400 }
    );
  }
  const theme = body.theme;
  if (theme !== undefined && theme !== null && !["light", "dark", "system"].includes(theme)) {
    return NextResponse.json(
      { error: "Invalid theme. Must be 'light', 'dark', or 'system'." },
      { status: 400 }
    );
  }
  const storyDefaults = body.story_defaults;

  try {
    const current = await getUserPreferences(user.id);
    const prefs: Parameters<typeof upsertUserPreferences>[1] = {
      ui_language: lang ?? current?.ui_language ?? "en",
      theme: theme !== undefined ? theme : current?.theme ?? undefined,
      story_defaults: storyDefaults !== undefined ? storyDefaults : current?.story_defaults ?? undefined,
    };
    await upsertUserPreferences(user.id, prefs);
    const updated = await getUserPreferences(user.id);
    return NextResponse.json({
      ui_language: updated?.ui_language ?? "en",
      theme: updated?.theme ?? null,
      story_defaults: updated?.story_defaults ?? null,
    });
  } catch (err) {
    console.error("Failed to save user preferences:", err);
    return NextResponse.json(
      { error: "Failed to save preference" },
      { status: 500 }
    );
  }
}
