import { createClient } from "@/lib/supabase/server";

export type DonasiStatus = "menunggu" | "terverifikasi" | "ditolak";
export type DonasiJenis = "donasi" | "iuran";

function toDonasiStatus(s: string): DonasiStatus {
  if (s === "menunggu" || s === "terverifikasi" || s === "ditolak") return s;
  return "menunggu";
}

function toDonasiJenis(s: string): DonasiJenis {
  if (s === "donasi" || s === "iuran") return s;
  return "donasi";
}

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

  const ids = [...new Set(list.map((r) => r.donatur_id).filter((x): x is string => !!x))];
  const namaById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id, nama").in("id", ids);
    for (const p of profs ?? []) namaById.set(p.id, p.nama);
  }

  return list.map((r) => ({
    id: r.id,
    donaturId: r.donatur_id,
    donaturNama: namaById.get(r.donatur_id) ?? "Warga",
    jenis: toDonasiJenis(r.jenis),
    nominal: Number(r.nominal) || 0,
    buktiUrl: r.bukti_url ?? null,
    status: toDonasiStatus(r.status),
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
    jenis: toDonasiJenis(r.jenis),
    nominal: Number(r.nominal) || 0,
    buktiUrl: r.bukti_url ?? null,
    status: toDonasiStatus(r.status),
    verifikatorId: r.verifikator_id ?? null,
    catatan: r.catatan ?? null,
    periode: r.periode ?? null,
    createdAt: r.created_at,
  }));
}

/** Ringkasan donasi komunitas (aggregate di database, efisien). */
export async function getDonasiSummary(communityId: string): Promise<DonasiSummary> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_donasi_summary", {
    community_id_param: communityId,
  });
  if (data) return data;
  return { totalDonasi: 0, totalIuran: 0, menunggu: 0, totalNominal: 0 };
}
