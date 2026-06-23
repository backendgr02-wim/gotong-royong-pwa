"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { laporSchema, laporStatusSchema } from "@/lib/validation";
import { uploadReportImage } from "@/lib/storage";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

/** Buat laporan RT/RW. HANYA anggota. Lokasi GPS opsional; honeypot anti-bot via `website`. */
export async function buatLapor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Harus masuk dulu." };

  const komunitas = await getActiveCommunity();
  if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };

  const latRaw = formData.get("lat");
  const lngRaw = formData.get("lng");
  const parsed = laporSchema.safeParse({
    kategori: formData.get("kategori"),
    deskripsi: formData.get("deskripsi"),
    fotoUrl: formData.get("fotoUrl") ?? "",
    website: formData.get("website") ?? "",
    ...(latRaw ? { lat: latRaw } : {}),
    ...(lngRaw ? { lng: lngRaw } : {}),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Laporan tidak valid." };
  }
  if (parsed.data.website) redirect("/lapor"); // honeypot terisi → bot

  const ip = await getClientIp();
  if (!checkRateLimit(`buatLapor:${ip}`, { limit: 5 }).allowed)
    return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

  let fotoUrl: string | null = null;
  const file = formData.get("foto") as File | null;
  if (file && file.size > 0) {
    const upload = await uploadReportImage(file, user.id);
    if ("error" in upload) return { error: upload.error };
    fotoUrl = upload.signedUrl;
  }

  const supabase = await createClient();
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
}

/** Ubah status laporan (baru/diproses/selesai). RLS `reports_update_pengurus` (hanya pengurus). */
export async function ubahStatusLapor(formData: FormData): Promise<void> {
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
}
