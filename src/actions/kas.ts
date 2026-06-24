"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { kasSchema } from "@/lib/validation";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

/**
 * Catat satu transaksi kas (pemasukan/penyaluran). HANYA pengurus.
 * Segel rantai-hash & jejak audit dikerjakan trigger DB (migrasi 0003) — action tetap sederhana.
 * Penegak otorisasi sebenarnya = RLS `kas_insert` (is_pengurus); cek peran di sini hanya untuk
 * pesan yang ramah ke pengguna.
 */
export async function catatKas(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const komunitas = await getActiveCommunity();
    if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };
    if (komunitas.peran === "warga") {
      return { error: "Hanya pengurus yang boleh mencatat kas." };
    }

    const parsed = kasSchema.safeParse({
      jenis: formData.get("jenis"),
      nominal: formData.get("nominal"),
      keterangan: formData.get("keterangan"),
      tgl: formData.get("tgl"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Data kas tidak valid." };
    }

    const ip = await getClientIp();
    if (!(await checkRateLimit(`catatKas:${ip ?? "unknown"}`, { limit: 10 })).allowed)
      return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

    const supabase = await createClient();
    const { error } = await supabase.from("kas_entries").insert({
      community_id: komunitas.id,
      jenis: parsed.data.jenis,
      nominal: parsed.data.nominal,
      keterangan: parsed.data.keterangan,
      tgl: parsed.data.tgl,
      dibuat_oleh: user.id,
    });
    if (error) return { error: error.message };

    revalidatePath("/");
    revalidatePath("/laporan-kas");
    redirect("/laporan-kas");
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("catatKas:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

export type KeaslianState = { ok?: boolean; message?: string } | null;

/**
 * Cek keaslian rantai-hash kas komunitas aktif (tombol "Cek Keaslian" di Laporan Kas).
 * Memanggil RPC `verify_kas_chain` (migrasi 0003). Bila migrasi belum dijalankan, beri pesan ramah.
 */
export async function cekKeaslian(): Promise<KeaslianState> {
  try {
    const komunitas = await getActiveCommunity();
    if (!komunitas) return { ok: false, message: "Komunitas aktif tidak ditemukan." };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("verify_kas_chain", { community: komunitas.id });
    if (error) {
      return { ok: false, message: "Fitur verifikasi belum aktif (migrasi 0003 belum dijalankan)." };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (row?.ok) {
      return { ok: true, message: "✓ Segel utuh — tidak ada catatan kas yang diam-diam diubah." };
    }
    return { ok: false, message: "⚠ Segel terputus — ada catatan kas yang berubah. Mohon ditinjau pengurus." };
  } catch (e) {
    console.error("cekKeaslian:", e);
    return { ok: false, message: "Terjadi kesalahan saat verifikasi." };
  }
}
