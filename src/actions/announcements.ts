"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { pengumumanSchema } from "@/lib/validation";
import type { ActionState } from "./auth";

/** Buat pengumuman. HANYA pengurus (penegak sebenarnya = RLS `announcements_write_pengurus`). */
export async function buatPengumuman(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Harus masuk dulu." };

  const komunitas = await getActiveCommunity();
  if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };
  if (komunitas.peran === "warga") {
    return { error: "Hanya pengurus yang boleh membuat pengumuman." };
  }

  const parsed = pengumumanSchema.safeParse({
    judul: formData.get("judul"),
    isi: formData.get("isi"),
    pinned: formData.get("pinned") ?? false,
    fotoUrl: formData.get("fotoUrl") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data pengumuman tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    community_id: komunitas.id,
    judul: parsed.data.judul,
    isi: parsed.data.isi,
    pinned: parsed.data.pinned,
    foto_url: parsed.data.fotoUrl || null,
    author_id: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/pengumuman");
  revalidatePath("/");
  redirect("/pengumuman");
}
