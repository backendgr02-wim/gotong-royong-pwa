import { createClient } from "@/lib/supabase/server";

/**
 * Akses kegiatan/kajian terpusat. Dipakai Beranda (preview) & halaman `/kegiatan`.
 * Akses lewat klien @supabase/ssr → RLS menegakkan otorisasi (events publik per desain;
 * RSVP hanya terbaca anggota komunitas). Selalu di-scope `community_id` (multi-tenant).
 */

export type EventItem = {
  id: string;
  judul: string;
  jenis: "kajian" | "kegiatan";
  mulai: string;
  lokasi: string | null;
  deskripsi: string | null;
  peserta: number;
  sayaHadir: boolean;
};

/** Kegiatan mendatang (mulai ≥ sekarang) + jumlah peserta + apakah user ini sudah RSVP. */
export async function getUpcomingEvents(
  communityId: string,
  userId?: string,
  limit = 50,
): Promise<EventItem[]> {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, judul, jenis, mulai, lokasi, deskripsi")
    .eq("community_id", communityId)
    .gte("mulai", new Date().toISOString())
    .order("mulai", { ascending: true })
    .limit(limit);

  const list = events ?? [];
  if (list.length === 0) return [];

  const ids = list.map((e) => e.id);
  const { data: rsvps } = await supabase
    .from("event_rsvp")
    .select("event_id, profile_id")
    .eq("community_id", communityId)
    .in("event_id", ids);

  const countByEvent = new Map<string, number>();
  const mine = new Set<string>();
  for (const r of rsvps ?? []) {
    countByEvent.set(r.event_id, (countByEvent.get(r.event_id) ?? 0) + 1);
    if (userId && r.profile_id === userId) mine.add(r.event_id);
  }

  return list.map((e) => ({
    id: e.id,
    judul: e.judul,
    jenis: e.jenis,
    mulai: e.mulai,
    lokasi: e.lokasi ?? null,
    deskripsi: e.deskripsi ?? null,
    peserta: countByEvent.get(e.id) ?? 0,
    sayaHadir: mine.has(e.id),
  }));
}
