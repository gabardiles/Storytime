import { createServerClient } from "@supabase/ssr";

export async function createMiddlewareClient(request: Request) {
  let supabaseResponse = new Response();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get("cookie")?.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=").trim() };
          }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            supabaseResponse.headers.append(
              "Set-Cookie",
              `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`
            )
          );
        },
      },
    }
  );
  return { supabase, supabaseResponse };
}
