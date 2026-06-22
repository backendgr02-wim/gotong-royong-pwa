"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { donasiSchema, verifikasiDonasiSchema } from "@/lib/validation";
import { uploadBuktiTransfer } from "@/lib/storage";
import type { ActionState } from "./auth";

/** Buat donasi/iuran (warga). Honeypot anti-bot via `website`. Upload foto bukti. */
export async function buatDonasi(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Harus masuk dulu." };

  const komunitas = await getActiveCommunity();
  if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };

  const parsed = donasiSchema.safeParse({
    jenis: formData.get("jenis"),
    nominal: formData.get("nominal"),
    periode: formData.get("periode"),
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data donasi tidak valid." };
  }
  if (parsed.data.website) redirect("/donasi"); // honeypot terisi → bot

  const supabase = await createClient();

  let buktiUrl: string | null = null;
  const file = formData.get("bukti") as File | null;
  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: "Ukuran foto maksimal 5 MB." };
    if (!file.type.startsWith("image/")) return { error: "File harus berupa gambar." };
    const result = await uploadBuktiTransfer(file, user.id);
    if ("error" in result) return { error: result.error };
    buktiUrl = result.signedUrl;
  }

  const { error } = await supabase.from("donations").insert({
    community_id: komunitas.id,
    donatur_id: user.id,
    jenis: parsed.data.jenis,
    nominal: parsed.data.nominal,
    periode: parsed.data.periode || null,
    status: "menunggu",
    bukti_url: buktiUrl,
  });
  if (error) return { error: error.message };

  revalidatePath("/donasi");
  redirect("/donasi");
}

/** Verifikasi atau tolak donasi (pengurus). Saat diverifikasi → trigger DB auto-buat kas_entry. */
export async function verifikasiDonasi(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const parsed = verifikasiDonasiSchema.safeParse({
    donationId: formData.get("donationId"),
    status: formData.get("status"),
    catatan: formData.get("catatan") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("donations")
    .update({
      status: parsed.data.status,
      catatan: parsed.data.catatan || null,
      verifikator_id: user.id,
    })
    .eq("id", parsed.data.donationId);

  revalidatePath("/donasi");
}
