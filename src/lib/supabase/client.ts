import { createBrowserClient } from "@supabase/ssr";

/**
 * Klien Supabase untuk SISI BROWSER (Client Components).
 * Aman memakai publishable key karena RLS yang menjaga akses data.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
