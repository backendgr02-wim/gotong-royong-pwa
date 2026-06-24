"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { profilSchema } from "@/lib/validation";
import { uploadAvatar } from "@/lib/storage";
import type { ActionState } from "./auth";

/**
 * Simpan profil pengguna (nama_depan, nama_belakang, bio, no_wa). Hanya untuk user sendiri.
 * RLS `profiles_update` memastikan hanya bisa ubah row milik sendiri.
 */
export async function simpanProfil(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
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
    const { error } = await supabase.from("profiles").update({
      nama: parsed.data.nama,
      no_hp: parsed.data.noHp || null,
    }).eq("id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/profil");
    redirect("/profil");
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("simpanProfil:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/**
 * Simpan/ubah foto avatar. Upload ke bucket `avatars`, simpan URL-nya di tabel profiles.
 * Ukuran maks 2 MB.
 */
export async function simpanAvatar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const file = formData.get("avatar") as File | null;
    if (!file || file.size === 0) return { error: "Pilih file avatar." };
    if (file.size > 2 * 1024 * 1024) return { error: "Ukuran avatar maksimal 2 MB." };
    if (!file.type.startsWith("image/")) return { error: "File harus berupa gambar." };

    const result = await uploadAvatar(file, user.id);
    if ("error" in result) return { error: result.error };

    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update({ avatar_url: result.publicUrl }).eq("id", user.id);
    if (error) return { error: error.message };

    revalidatePath("/profil");
    redirect("/profil");
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("simpanAvatar:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
