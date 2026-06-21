import { createClient } from "@/lib/supabase/server";

/**
 * Akses kas terpusat — SUMBER KEBENARAN TUNGGAL untuk angka transparansi.
 * Beranda, halaman Laporan Kas, dan halaman publik komunitas WAJIB memakai helper ini supaya
 * rumus saldo (masuk − keluar) tidak ditulis ulang di banyak tempat (cegah salah-sinkron angka).
 * Akses lewat klien @supabase/ssr → RLS `kas_select` (anggota) tetap menegakkan otorisasi.
 */

export type KasEntry = {
  id: string;
  jenis: "masuk" | "keluar";
  nominal: number;
  keterangan: string;
  tgl: string; // YYYY-MM-DD
  dibuatOleh: string | null;
  createdAt: string;
};

export type KasSummary = {
  saldo: number;
  masuk: number;
  keluar: number;
  updateTerakhir: string | null; // tgl YYYY-MM-DD
  jumlah: number; // banyaknya catatan
};

/** Ringkasan kas (saldo, total masuk/keluar, update terakhir, jumlah catatan) per komunitas. */
export async function getKasSummary(communityId: string): Promise<KasSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kas_entries")
    .select("jenis, nominal, tgl")
    .eq("community_id", communityId);

  let masuk = 0;
  let keluar = 0;
  let updateTerakhir: string | null = null;
  const rows = data ?? [];
  for (const k of rows) {
    const n = Number(k.nominal) || 0;
    if (k.jenis === "masuk") masuk += n;
    else keluar += n;
    if (!updateTerakhir || k.tgl > updateTerakhir) updateTerakhir = k.tgl;
  }
  return { saldo: masuk - keluar, masuk, keluar, updateTerakhir, jumlah: rows.length };
}

/**
 * Daftar transaksi kas (terbaru dulu) per komunitas. Filter opsional per bulan (YYYY-MM).
 * Mengembalikan baris ter-normalisasi (camelCase) agar UI tak menyentuh nama kolom DB langsung.
 */
export async function getKasEntries(
  communityId: string,
  opts: { bulan?: string } = {},
): Promise<KasEntry[]> {
  const supabase = await createClient();
  let q = supabase
    .from("kas_entries")
    .select("id, jenis, nominal, keterangan, tgl, dibuat_oleh, created_at")
    .eq("community_id", communityId);

  if (opts.bulan && /^\d{4}-\d{2}$/.test(opts.bulan)) {
    q = q.gte("tgl", `${opts.bulan}-01`).lte("tgl", `${opts.bulan}-31`);
  }

  const { data } = await q.order("tgl", { ascending: false }).order("created_at", {
    ascending: false,
  });

  return (data ?? []).map((k) => ({
    id: k.id,
    jenis: k.jenis,
    nominal: Number(k.nominal) || 0,
    keterangan: k.keterangan,
    tgl: k.tgl,
    dibuatOleh: k.dibuat_oleh ?? null,
    createdAt: k.created_at,
  }));
}
