"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { laporSchema, laporStatusSchema } from "@/lib/validation";
import { uploadReportImage } from "@/lib/storage";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

/**
 * Buat laporan warga. Upload foto (wajib) + deskripsi. Honeypot via `website`.
 * RLS `reports_insert` memastikan hanya anggota komunitas.
 */
export async function buatLapor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const komunitas = await getActiveCommunity();
    if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };

    const parsed = laporSchema.safeParse({
      kategori: formData.get("kategori"),
      deskripsi: formData.get("deskripsi"),
      fotoUrl: formData.get("fotoUrl") ?? "",
      lat: formData.get("lat"),
      lng: formData.get("lng"),
      website: formData.get("website") ?? "",
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Data laporan tidak valid." };
    }
    if (parsed.data.website) redirect("/lapor");

    const ip = await getClientIp();
    if (!checkRateLimit(`buatLapor:${ip}`, { limit: 5 }).allowed)
      return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

    const supabase = await createClient();

    let fotoUrl: string | null = null;
    const file = formData.get("gambar") as File | null;
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) return { error: "Ukuran gambar maksimal 10 MB." };
      const result = await uploadReportImage(file, user.id);
      if ("error" in result) return { error: result.error };
      fotoUrl = result.signedUrl;
    }

    const { error } = await supabase.from("reports").insert({
      community_id: komunitas.id,
      pelapor_id: user.id,
      kategori: parsed.data.kategori,
      deskripsi: parsed.data.deskripsi,
      foto_url: fotoUrl,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
    });
    if (error) return { error: error.message };

    revalidatePath("/lapor");
    redirect("/lapor");
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("buatLapor:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/**
 * Ubah status laporan (diproses/selesai/ditolak). HANYA pengurus.
 * Dipakai sebagai `<form action={ubahStatusLapor}>`.
 */
export async function ubahStatusLapor(formData: FormData): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;

    const parsed = laporStatusSchema.safeParse({
      reportId: formData.get("reportId"),
      status: formData.get("status"),
    });
    if (!parsed.success) return;

    const supabase = await createClient();
    await supabase
      .from("reports")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.reportId);

    revalidatePath("/lapor");
  } catch (e) {
    console.error("ubahStatusLapor:", e);
  }
}
