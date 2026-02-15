import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import StoryList from "./StoryList";

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
    <main className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto flex flex-col">
      <nav className="mb-8">
        <h1 className="text-2xl font-bold">Library</h1>
      </nav>

      <StoryList stories={stories ?? []} />

      <footer className="mt-auto pt-8 flex flex-col items-center gap-2 text-center">
        {user.email && (
          <p className="text-sm text-muted-foreground">{user.email}</p>
        )}
        <a
          href="/api/auth/signout"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </a>
      </footer>
    </main>
  );
}
