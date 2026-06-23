"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { profilSchema } from "@/lib/validation";
import { uploadAvatar } from "@/lib/storage";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

/**
 * Simpan perubahan profil diri sendiri (nama, no HP). RLS `profiles_update_self`
 * (id = auth.uid) adalah penegak sebenarnya. TANPA NIK / data sensitif (ADR-005).
 */
export async function simpanProfil(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Harus masuk dulu." };

  const parsed = profilSchema.safeParse({
    nama: formData.get("nama"),
    noHp: formData.get("noHp") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data profil tidak valid." };
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`simpanProfil:${ip}`, { limit: 5 }).allowed)
    return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ nama: parsed.data.nama, no_hp: parsed.data.noHp || null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profil");
  revalidatePath("/");
  return { ok: true, message: "Profil tersimpan." };
}

/** Upload & simpan foto profil. Hapus avatar lama jika ada (upsert=true di bucket). */
export async function simpanAvatar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Harus masuk dulu." };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Pilih file gambar." };

  const ipAv = await getClientIp();
  if (!checkRateLimit(`simpanAvatar:${ipAv}`, { limit: 5 }).allowed)
    return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

  const result = await uploadAvatar(file, user.id);
  if ("error" in result) return { error: result.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: result.publicUrl })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profil");
  revalidatePath("/");
  return { ok: true, message: "Foto profil diperbarui." };
}
