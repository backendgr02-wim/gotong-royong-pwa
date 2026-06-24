import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy function — pengganti `middleware.ts` di Next.js 16.
 * Me-refresh sesi Supabase setiap ada request ke halaman mana pun, supaya cookie sesi
 * tidak kadaluarsa saat user lagi browsing.
 *
 * Cara kerja:
 * 1. Baca cookie dari request
 * 2. Coba refresh sesi (kalau token expired)
 * 3. Set cookie hasil refresh ke response
 *
 * Tidak memblokir request apa pun — hanya refresh token.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
