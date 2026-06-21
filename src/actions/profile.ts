"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { profilSchema } from "@/lib/validation";
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
