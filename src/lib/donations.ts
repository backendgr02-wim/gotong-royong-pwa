import { createClient } from "@/lib/supabase/server";

export type DonasiStatus = "menunggu" | "terverifikasi" | "ditolak";
export type DonasiJenis = "donasi" | "iuran";

export type Donation = {
  id: string;
  donaturId: string;
  donaturNama: string;
  jenis: DonasiJenis;
  nominal: number;
  buktiUrl: string | null;
  status: DonasiStatus;
  verifikatorId: string | null;
  catatan: string | null;
  periode: string | null;
  createdAt: string;
};

export type DonasiSummary = {
  totalDonasi: number;
  totalIuran: number;
  menunggu: number;
  totalNominal: number;
};

/** Semua donasi di komunitas (pengurus). Terbaru dulu. */
export async function getDonations(communityId: string, limit = 50): Promise<Donation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("id, donatur_id, jenis, nominal, bukti_url, status, verifikator_id, catatan, periode, created_at")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const list = data ?? [];
  if (list.length === 0) return [];

  const ids = [...new Set(list.map((r) => r.donatur_id).filter(Boolean))] as string[];
  const namaById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id, nama").in("id", ids);
    for (const p of profs ?? []) namaById.set(p.id, p.nama);
  }

  return list.map((r) => ({
    id: r.id,
    donaturId: r.donatur_id,
    donaturNama: namaById.get(r.donatur_id) ?? "Warga",
    jenis: r.jenis as DonasiJenis,
    nominal: Number(r.nominal) || 0,
    buktiUrl: r.bukti_url ?? null,
    status: r.status as DonasiStatus,
    verifikatorId: r.verifikator_id ?? null,
    catatan: r.catatan ?? null,
    periode: r.periode ?? null,
    createdAt: r.created_at,
  }));
}

/** Donasi milik user sendiri. */
export async function getDonationsSaya(userId: string): Promise<Donation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("id, donatur_id, jenis, nominal, bukti_url, status, verifikator_id, catatan, periode, created_at")
    .eq("donatur_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((r) => ({
    id: r.id,
    donaturId: r.donatur_id,
    donaturNama: "",
    jenis: r.jenis as DonasiJenis,
    nominal: Number(r.nominal) || 0,
    buktiUrl: r.bukti_url ?? null,
    status: r.status as DonasiStatus,
    verifikatorId: r.verifikator_id ?? null,
    catatan: r.catatan ?? null,
    periode: r.periode ?? null,
    createdAt: r.created_at,
  }));
}

/** Ringkasan donasi komunitas. */
export async function getDonasiSummary(communityId: string): Promise<DonasiSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("jenis, status, nominal")
    .eq("community_id", communityId);

  let totalDonasi = 0;
  let totalIuran = 0;
  let menunggu = 0;
  let totalNominal = 0;
  for (const d of data ?? []) {
    const n = Number(d.nominal) || 0;
    if (d.status === "menunggu") menunggu++;
    if (d.status === "terverifikasi") {
      totalNominal += n;
      if (d.jenis === "donasi") totalDonasi += n;
      else totalIuran += n;
    }
  }
  return { totalDonasi, totalIuran, menunggu, totalNominal };
}
