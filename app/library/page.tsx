import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import StoryList from "./StoryList";
import { Button } from "@/components/ui/button";

export default async function LibraryPage() {
  let user: { id: string } | null = null;
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
    <main className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      <nav className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Library</h1>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/create">+ New story</Link>
          </Button>
          <a
            href="/api/auth/signout"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </a>
        </div>
      </nav>

      <StoryList stories={stories ?? []} />
    </main>
  );
}
