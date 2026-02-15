import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { redirect } from "next/navigation";

export default async function HomePage() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/library");
    }
  } catch {
    // Cookie corruption, missing env, or auth error – treat as logged out
  }
  redirect("/login");
}
