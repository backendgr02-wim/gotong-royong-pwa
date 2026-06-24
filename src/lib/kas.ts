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

  // Aggregate di Postgres — bukan fetch 10K rows
  const { data: sums } = await supabase
    .from("kas_entries")
    .select("jenis, sum_nominal:nominal.sum()")
    .eq("community_id", communityId);
  const masuk = Number((sums ?? []).find((r) => r.jenis === "masuk")?.sum_nominal ?? 0);
  const keluar = Number((sums ?? []).find((r) => r.jenis === "keluar")?.sum_nominal ?? 0);

  const { data: maxRow } = await supabase
    .from("kas_entries")
    .select("tgl")
    .eq("community_id", communityId)
    .order("tgl", { ascending: false })
    .limit(1);

  const { count } = await supabase
    .from("kas_entries")
    .select("id", { count: "exact", head: true })
    .eq("community_id", communityId);

  const updateTerakhir = maxRow?.[0]?.tgl ?? null;
  const jumlah = count ?? 0;
  return { saldo: masuk - keluar, masuk, keluar, updateTerakhir, jumlah };
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

  const { data } = await q
    .order("tgl", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

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
