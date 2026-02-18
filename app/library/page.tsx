import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import StoryList from "./StoryList";
import LibraryHeader, { LibraryFooter } from "./LibraryHeader";

export default async function LibraryPage() {
  let user: { id: string; email?: string } | null = null;
  try {
    const supabase = await createRouteHandlerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  const sb = supabaseServer();
  const { data: stories } = await sb
    .from("stories")
    .select("id, title, tone, length_key, status, created_at, context_json")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto flex flex-col">
      <LibraryHeader />
      <StoryList stories={stories ?? []} />
      <LibraryFooter email={user.email} />
    </main>
  );
}
