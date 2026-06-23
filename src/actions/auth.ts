"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { masukSchema } from "@/lib/validation";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export type ActionState = { error?: string; message?: string; ok?: boolean } | null;

/** Kirim tautan/kode masuk via email (OTP magic link Supabase — gratis). */
export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = masukSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Email tidak valid." };

  const ip = await getClientIp();
  if (!checkRateLimit(`signIn:${ip}`, { limit: 5 }).allowed)
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
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/masuk");
}
