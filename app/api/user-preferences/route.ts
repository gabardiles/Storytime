import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import type { StoryDefaults } from "@/lib/db";

const VALID_UI_LANGS = ["en", "sv", "es"] as const;
const VALID_THEMES = ["light", "dark", "system"] as const;

export async function GET() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("ui_language, theme, story_defaults")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({
        ui_language: "en",
        theme: null,
        story_defaults: null,
      });
    }
    console.error("Failed to get user preferences:", error);
    return NextResponse.json({ ui_language: "en", theme: null, story_defaults: null });
  }

  return NextResponse.json({
    ui_language: data?.ui_language ?? "en",
    theme: data?.theme ?? null,
    story_defaults: data?.story_defaults ?? null,
  });
}

export async function PUT(request: Request) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ui_language?: string; theme?: string; story_defaults?: StoryDefaults | null } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lang = body.ui_language;
  if (lang !== undefined && !VALID_UI_LANGS.includes(lang as (typeof VALID_UI_LANGS)[number])) {
    return NextResponse.json(
      { error: "Invalid language. Must be 'en', 'sv', or 'es'." },
      { status: 400 }
    );
  }
  const theme = body.theme;
  if (theme !== undefined && theme !== null && !VALID_THEMES.includes(theme as (typeof VALID_THEMES)[number])) {
    return NextResponse.json(
      { error: "Invalid theme. Must be 'light', 'dark', or 'system'." },
      { status: 400 }
    );
  }

  const { data: current, error: fetchError } = await supabase
    .from("user_preferences")
    .select("ui_language, theme, story_defaults")
    .eq("user_id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Failed to fetch current preferences:", fetchError);
    return NextResponse.json({ error: "Failed to save preference" }, { status: 500 });
  }

  const merged = {
    user_id: user.id,
    ui_language: lang ?? (current?.ui_language as string) ?? "en",
    theme: theme !== undefined ? theme : (current?.theme ?? null),
    story_defaults: body.story_defaults !== undefined ? body.story_defaults : (current?.story_defaults ?? null),
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: upsertError } = await supabase
    .from("user_preferences")
    .upsert(merged, { onConflict: "user_id" })
    .select("ui_language, theme, story_defaults")
    .single();

  if (upsertError) {
    console.error("Failed to save user preferences:", upsertError);
    return NextResponse.json({ error: "Failed to save preference" }, { status: 500 });
  }

  return NextResponse.json({
    ui_language: updated?.ui_language ?? "en",
    theme: updated?.theme ?? null,
    story_defaults: updated?.story_defaults ?? null,
  });
}
