"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { masukSchema } from "@/lib/validation";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export type ActionState =
  | { error?: string; message?: string; url?: string; ok?: boolean }
  | null;

/** Kirim tautan/kode masuk via email (OTP magic link Supabase — gratis). */
export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const parsed = masukSchema.safeParse({ email: formData.get("email") });
    if (!parsed.success) return { error: "Email tidak valid." };

    const ip = await getClientIp();
    if (!(await checkRateLimit(`signIn:${ip ?? "unknown"}`, { limit: 5 })).allowed)
      return { error: "Terlalu banyak percobaan. Silakan coba lagi nanti." };

    const h = await headers();
    const origin = h.get("origin") ?? `https://${h.get("host") ?? ""}`;

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (error) return { error: error.message };
    return { ok: true, message: "Tautan masuk dikirim ke email kamu. Cek kotak masuk / spam." };
  } catch (e) {
    console.error("signIn:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/** Masuk pakai Google OAuth (1-klik, tanpa email). */
export async function signInWithGoogle(): Promise<ActionState> {
  try {
    const ip = await getClientIp();
    if (!(await checkRateLimit(`signInGoogle:${ip ?? "unknown"}`, { limit: 5 })).allowed)
      return { error: "Terlalu banyak percobaan. Silakan coba lagi nanti." };

    const h = await headers();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6789";
    const origin = h.get("origin") ?? siteUrl;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });

    if (error) return { error: error.message };
    if (!data.url) return { error: "Gagal mendapatkan tautan Google. Coba lagi." };

    return { ok: true, url: data.url };
  } catch (e) {
    console.error("signInWithGoogle:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/masuk");
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("signOut:", e);
  }
}
