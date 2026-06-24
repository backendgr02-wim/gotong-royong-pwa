"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { donasiSchema, verifikasiDonasiSchema } from "@/lib/validation";
import { uploadBuktiTransfer } from "@/lib/storage";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

/** Wrapper untuk <form action={...}> — TypeScript friendly. Delegasi ke verifikasiDonasi. */
export async function verifikasiDonasiAction(formData: FormData): Promise<void> {
  await verifikasiDonasi(null, formData);
}

/** Buat donasi/iuran (warga). Honeypot anti-bot via `website`. Upload foto bukti. */
export async function buatDonasi(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
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
    if (parsed.data.website) redirect("/donasi");

    const ip = await getClientIp();
    if (!(await checkRateLimit(`buatDonasi:${ip ?? "unknown"}`, { limit: 5 })).allowed)
      return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

    const supabase = await createClient();

    let buktiUrl: string | null = null;
    const file = formData.get("bukti") as File | null;
    if (file && file.size > 0) {
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
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("buatDonasi:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/** Verifikasi atau tolak donasi (pengurus). Saat diverifikasi trigger DB auto-buat kas_entry. */
export async function verifikasiDonasi(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const ip = await getClientIp();
    if (!(await checkRateLimit(`verifikasiDonasi:${ip ?? "unknown"}`, { limit: 10 })).allowed)
      return { error: "Terlalu banyak permintaan." };

    const parsed = verifikasiDonasiSchema.safeParse({
      donationId: formData.get("donationId"),
      status: formData.get("status"),
      catatan: formData.get("catatan") ?? "",
    });
    if (!parsed.success) return { error: "Data tidak valid." };

    const komunitas = await getActiveCommunity();
    if (!komunitas) return { error: "Komunitas tidak ditemukan." };

    const peran = komunitas.peran;
    if (peran !== "pengurus" && peran !== "dkm" && peran !== "admin") {
      return { error: "Hanya pengurus yang bisa verifikasi donasi." };
    }

    const supabase = await createClient();

    // Verifikasi donasi milik komunitas ini dan masih menunggu
    const { data: donation } = await supabase
      .from("donations")
      .select("id, status")
      .eq("id", parsed.data.donationId)
      .eq("community_id", komunitas.id)
      .single();

    if (!donation) return { error: "Donasi tidak ditemukan." };
    if (donation.status !== "menunggu") return { error: "Donasi sudah diverifikasi sebelumnya." };

    // Update atomic: hanya jika status masih menunggu
    const { error } = await supabase
      .from("donations")
      .update({
        status: parsed.data.status,
        catatan: parsed.data.catatan || null,
        verifikator_id: user.id,
      })
      .eq("id", parsed.data.donationId)
      .eq("status", "menunggu");

    if (error) return { error: error.message };

    revalidatePath("/donasi");
    return { message: "Status donasi berhasil diperbarui." };
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("verifikasiDonasi:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}
