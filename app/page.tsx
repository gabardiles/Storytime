import { createRouteHandlerClient } from "@/lib/supabase-route-handler";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/library");
  }
  redirect("/login");
}
