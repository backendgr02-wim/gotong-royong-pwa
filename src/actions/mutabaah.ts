"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { toggleMutabaahSchema } from "@/lib/validation";

/** Tanggal hari ini di zona Asia/Jakarta (format YYYY-MM-DD untuk kolom `tanggal`). */
function tanggalJakarta(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/**
 * Centang/hapus-centang satu item mutabaah untuk HARI INI (per pengguna).
 * Dipakai langsung sebagai `<form action={toggleMutabaah}>` di Beranda.
 * RLS `mutabaah_logs`: hanya milik sendiri (profile_id = auth.uid()).
 */
export async function toggleMutabaah(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const parsed = toggleMutabaahSchema.safeParse({ itemId: formData.get("itemId") });
  if (!parsed.success) return;

  const supabase = await createClient();
  const tanggal = tanggalJakarta();

  const { data: existing } = await supabase
    .from("mutabaah_logs")
    .select("id, done")
    .eq("profile_id", user.id)
    .eq("item_id", parsed.data.itemId)
    .eq("tanggal", tanggal)
    .maybeSingle();

  if (existing) {
    await supabase.from("mutabaah_logs").update({ done: !existing.done }).eq("id", existing.id);
  } else {
    await supabase.from("mutabaah_logs").insert({
      profile_id: user.id,
      item_id: parsed.data.itemId,
      tanggal,
      done: true,
    });
  }

  revalidatePath("/");
}
