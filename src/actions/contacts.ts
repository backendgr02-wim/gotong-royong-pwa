"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

const contactSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  peran: z.string().min(1, "Peran wajib diisi").max(100),
  noHp: z.string().max(20).optional().default(""),
});

export async function tambahKontak(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const komunitas = await getActiveCommunity();
    if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };
    if (komunitas.peran === "warga") return { error: "Hanya pengurus yang bisa mengelola kontak." };

    const parsed = contactSchema.safeParse({
      nama: formData.get("nama"),
      peran: formData.get("peran"),
      noHp: formData.get("noHp"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

    const ip = await getClientIp();
    if (!checkRateLimit(`tambahKontak:${ip}`, { limit: 20 }).allowed)
      return { error: "Terlalu banyak permintaan." };

    const supabase = await createClient();
    const { error } = await supabase.from("contacts").insert({
      community_id: komunitas.id,
      nama: parsed.data.nama,
      peran: parsed.data.peran,
      no_hp: parsed.data.noHp || null,
    });

    if (error) return { error: error.message };
    revalidatePath("/kontak/atur");
    return { ok: true, message: "Kontak berhasil ditambahkan." };
  } catch (e) {
    console.error("tambahKontak:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

export async function hapusKontak(formData: FormData): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;

    const komunitas = await getActiveCommunity();
    if (!komunitas || komunitas.peran === "warga") return;

    const id = formData.get("id");
    if (typeof id !== "string") return;

    const supabase = await createClient();
    await supabase.from("contacts").delete().eq("id", id).eq("community_id", komunitas.id);
    revalidatePath("/kontak/atur");
  } catch (e) {
    console.error("hapusKontak:", e);
  }
}
