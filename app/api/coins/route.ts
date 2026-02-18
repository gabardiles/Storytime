import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { getBalance } from "@/lib/coins";

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await getBalance(user.id);
    return NextResponse.json({ balance });
  } catch (err) {
    console.error("Failed to get coin balance:", err);
    return NextResponse.json({ balance: 0 });
  }
}
