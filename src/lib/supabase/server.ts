import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Klien Supabase untuk SISI SERVER (Server Components, Server Actions, Route Handlers).
 * Next 16: `cookies()` bersifat async → wajib di-await.
 * Memakai publishable key (legacy anon key usang akhir 2026).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { sameSite: "lax", ...options }),
            );
          } catch {
            // Dipanggil dari Server Component (tidak boleh set cookie) — diabaikan.
            // Refresh sesi terjadi via Server Actions & Route Handlers, atau via
            // client-side `createBrowserClient` (auth.getSession/getUser).
          }
        },
      },
    },
  );
}
