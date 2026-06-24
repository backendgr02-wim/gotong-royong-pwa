import { createClient } from "@/lib/supabase/server";

/**
 * Polling/voting komunitas. RLS: anggota lihat & vote (1 suara/user, unik);
 * buat = pengurus. Hasil dihitung dari `poll_votes.opsi_index`.
 */

export type Poll = {
  id: string;
  pertanyaan: string;
  opsi: string[];
  berakhir: string | null;
  selesai: boolean; // sudah lewat tenggat?
  totalSuara: number;
  hasil: number[]; // jumlah suara per index opsi
  pilihanSaya: number | null; // index opsi yang dipilih user, atau null
};

/** Daftar polling komunitas (terbaru dulu) + hasil + pilihan user ini. */
export async function getPolls(communityId: string, userId?: string, limit = 30): Promise<Poll[]> {
  const supabase = await createClient();
  const { data: polls } = await supabase
    .from("polls")
    .select("id, pertanyaan, opsi, berakhir, created_at")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const list = polls ?? [];
  if (list.length === 0) return [];

  const ids = list.map((p) => p.id);
  const { data: votes } = await supabase
    .from("poll_votes")
    .select("poll_id, opsi_index, profile_id")
    .eq("community_id", communityId)
    .in("poll_id", ids);

  const byPoll = new Map<string, { counts: Map<number, number>; mine: number | null; total: number }>();
  for (const id of ids) byPoll.set(id, { counts: new Map(), mine: null, total: 0 });
  for (const v of votes ?? []) {
    const agg = byPoll.get(v.poll_id);
    if (!agg) continue;
    agg.counts.set(v.opsi_index, (agg.counts.get(v.opsi_index) ?? 0) + 1);
    agg.total += 1;
    if (userId && v.profile_id === userId) agg.mine = v.opsi_index;
  }

  const now = Date.now();
  return list.map((p) => {
    const opsi: string[] = Array.isArray(p.opsi) ? p.opsi : [];
    const agg = byPoll.get(p.id)!;
    return {
      id: p.id,
      pertanyaan: p.pertanyaan,
      opsi,
      berakhir: p.berakhir ?? null,
      selesai: p.berakhir ? new Date(p.berakhir).getTime() < now : false,
      totalSuara: agg.total,
      hasil: opsi.map((_, i) => agg.counts.get(i) ?? 0),
      pilihanSaya: agg.mine,
    };
  });
}
