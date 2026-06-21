import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16: "Middleware" kini bernama "Proxy" (fungsi tetap sama).
 * Tugas di sini: menyegarkan token sesi Supabase pada tiap request agar tidak kedaluwarsa.
 * JANGAN dipakai untuk otorisasi berat — itu tugas RLS + cek di server.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Jika Supabase BELUM dikonfigurasi (.env kosong, mis. sebelum provisioning),
  // lewati refresh sesi agar aplikasi TETAP JALAN (UI statis) — bukan error di semua halaman.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Wajib: memicu refresh sesi bila perlu.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Semua route kecuali aset statis & gambar.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
