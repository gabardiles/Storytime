import { NextResponse } from "next/server";
import { getStoryFull, getStoryByIdAndUser } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase-server";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownership = await getStoryByIdAndUser(id, user.id);
    if (!ownership) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const sb = supabaseServer();
    const { error } = await sb.from("stories").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownership = await getStoryByIdAndUser(id, user.id);
    if (!ownership) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const data = await getStoryFull(id);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
