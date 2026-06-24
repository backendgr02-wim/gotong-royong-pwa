import { createClient } from "@/lib/supabase/server";

/**
 * Lapor RT/RW. RLS `reports_select` = anggota komunitas (transparansi);
 * buat = pelapor sendiri; ubah status = pengurus. Di-scope `community_id`.
 */

export type LaporanStatus = "baru" | "diproses" | "selesai";

function toLaporanStatus(s: string): LaporanStatus {
  if (s === "baru" || s === "diproses" || s === "selesai") return s;
  return "baru";
}

export type Laporan = {
  id: string;
  kategori: string;
  deskripsi: string;
  fotoUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: LaporanStatus;
  pelaporId: string | null;
  pelaporNama: string;
  createdAt: string;
};

/** Daftar laporan komunitas (terbaru dulu) + nama pelapor. */
export async function getReports(communityId: string, limit = 50): Promise<Laporan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("id, kategori, deskripsi, foto_url, lat, lng, status, pelapor_id, created_at")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const list = data ?? [];
  if (list.length === 0) return [];

  const ids = [...new Set(list.map((r) => r.pelapor_id).filter((x): x is string => !!x))];
  const namaById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id, nama").in("id", ids);
    for (const p of profs ?? []) namaById.set(p.id, p.nama);
  }

  return list.map((r) => ({
    id: r.id,
    kategori: r.kategori,
    deskripsi: r.deskripsi,
    fotoUrl: r.foto_url ?? null,
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    status: toLaporanStatus(r.status),
    pelaporId: r.pelapor_id ?? null,
    pelaporNama: (r.pelapor_id && namaById.get(r.pelapor_id)) || "Warga",
    createdAt: r.created_at,
  }));
}
