"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { buatKomunitasSchema, gabungKomunitasSchema } from "@/lib/validation";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

/** Buat komunitas baru. Trigger DB otomatis menjadikan pembuat sebagai 'pengurus'. */
export async function createCommunity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const parsed = buatKomunitasSchema.safeParse({
      nama: formData.get("nama"),
      jenis: formData.get("jenis"),
      kelurahan: formData.get("kelurahan"),
      deskripsi: formData.get("deskripsi"),
    });
    if (!parsed.success) return { error: "Data komunitas tidak valid." };

    const ip = await getClientIp();
    if (!checkRateLimit(`createCommunity:${ip}`, { limit: 3 }).allowed)
      return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

    const supabase = await createClient();
    const slug = `${slugify(parsed.data.nama)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("communities").insert({
      nama: parsed.data.nama,
      jenis: parsed.data.jenis,
      kelurahan: parsed.data.kelurahan || null,
      deskripsi: parsed.data.deskripsi || null,
      slug_publik: slug,
    });
    if (error) return { error: error.message };

    redirect("/");
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("createCommunity:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/** Gabung komunitas yang sudah ada (sebagai 'warga'). */
export async function joinCommunity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const parsed = gabungKomunitasSchema.safeParse({ communityId: formData.get("communityId") });
    if (!parsed.success) return { error: "Komunitas tidak valid." };

    const ip = await getClientIp();
    if (!checkRateLimit(`joinCommunity:${ip}`, { limit: 10 }).allowed)
      return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

    const supabase = await createClient();
    const { error } = await supabase.from("memberships").insert({
      community_id: parsed.data.communityId,
      profile_id: user.id,
      peran: "warga",
      status: "aktif",
    });
    if (error) return { error: error.message };

    redirect("/");
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("joinCommunity:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
