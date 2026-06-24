import { createClient } from "@/lib/supabase/server";

/**
 * Akses pengumuman terpusat. Beranda menampilkan yang ter-pin (Kartu Unggulan);
 * `/pengumuman` menampilkan semua. RLS: anggota lihat semua, anon hanya yang `pinned`.
 */

export type Announcement = {
  id: string;
  judul: string;
  isi: string;
  pinned: boolean;
  fotoUrl: string | null;
  authorId: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  judul: string;
  isi: string;
  pinned: boolean;
  foto_url: string | null;
  author_id: string | null;
  created_at: string;
};

function mapRow(d: Row): Announcement {
  return {
    id: d.id,
    judul: d.judul,
    isi: d.isi,
    pinned: d.pinned,
    fotoUrl: d.foto_url ?? null,
    authorId: d.author_id ?? null,
    createdAt: d.created_at,
  };
}

const COLS = "id, judul, isi, pinned, foto_url, author_id, created_at";

/** Pengumuman ter-pin terbaru (untuk Kartu Unggulan Beranda), atau null. */
export async function getPinnedAnnouncement(communityId: string): Promise<Announcement | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select(COLS)
    .eq("community_id", communityId)
    .eq("pinned", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<Row>()
    .maybeSingle();
  return data ? mapRow(data) : null;
}

/** Semua pengumuman (yang ter-pin di atas, lalu terbaru). */
export async function getAnnouncements(communityId: string, limit = 50): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select(COLS)
    .eq("community_id", communityId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Row[]>();
  return (data ?? []).map((d) => mapRow(d));
}
