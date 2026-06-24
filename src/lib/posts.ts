import { createClient } from "@/lib/supabase/server";

/**
 * Akses feed komunitas terpusat (postingan warga). Dipakai `/komunitas` & detail `/komunitas/[id]`.
 * RLS: hanya anggota komunitas yang bisa baca/tulis (posts/reactions/comments di-scope community_id).
 * Postingan `tersembunyi` (moderasi) tidak ditampilkan.
 */

export type PostItem = {
  id: string;
  isi: string;
  fotoUrl: string | null;
  createdAt: string;
  authorId: string | null;
  authorNama: string;
  suka: number;
  sayaSuka: boolean;
  komentar: number;
};

export type Komentar = {
  id: string;
  isi: string;
  createdAt: string;
  authorId: string | null;
  authorNama: string;
};

async function namaProfil(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unik = [...new Set(ids.filter(Boolean))];
  if (unik.length === 0) return map;
  const { data } = await supabase.from("profiles").select("id, nama").in("id", unik);
  for (const p of data ?? []) map.set(p.id, p.nama);
  return map;
}

/** Daftar postingan komunitas (terbaru dulu) + nama penulis, jumlah suka/komentar, & status suka user. */
export async function getFeed(
  communityId: string,
  userId?: string,
  limit = 30,
): Promise<PostItem[]> {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, isi, foto_url, created_at, author_id")
    .eq("community_id", communityId)
    .eq("tersembunyi", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  const list = posts ?? [];
  if (list.length === 0) return [];

  const ids = list.map((p) => p.id);
  const namaById = await namaProfil(
    supabase,
    list.map((p) => p.author_id).filter((x): x is string => !!x),
  );

  const { data: reacts } = await supabase
    .from("post_reactions")
    .select("post_id, profile_id")
    .eq("community_id", communityId)
    .in("post_id", ids);
  const sukaCount = new Map<string, number>();
  const sayaSuka = new Set<string>();
  for (const r of reacts ?? []) {
    sukaCount.set(r.post_id, (sukaCount.get(r.post_id) ?? 0) + 1);
    if (userId && r.profile_id === userId) sayaSuka.add(r.post_id);
  }

  const { data: coms } = await supabase
    .from("post_comments")
    .select("post_id")
    .eq("community_id", communityId)
    .in("post_id", ids);
  const komCount = new Map<string, number>();
  for (const c of coms ?? []) komCount.set(c.post_id, (komCount.get(c.post_id) ?? 0) + 1);

  return list.map((p) => ({
    id: p.id,
    isi: p.isi,
    fotoUrl: p.foto_url ?? null,
    createdAt: p.created_at,
    authorId: p.author_id ?? null,
    authorNama: (p.author_id && namaById.get(p.author_id)) || "Warga",
    suka: sukaCount.get(p.id) ?? 0,
    sayaSuka: sayaSuka.has(p.id),
    komentar: komCount.get(p.id) ?? 0,
  }));
}

/** Satu postingan + daftar komentarnya (untuk halaman detail). Null bila tak ada / tersembunyi. */
export async function getPost(
  postId: string,
  userId?: string,
): Promise<{ post: PostItem; komentar: Komentar[] } | null> {
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("posts")
    .select("id, isi, foto_url, created_at, author_id, community_id, tersembunyi")
    .eq("id", postId)
    .maybeSingle();
  if (!p || p.tersembunyi) return null;

  const { data: reacts } = await supabase
    .from("post_reactions")
    .select("profile_id")
    .eq("post_id", postId);
  const suka = (reacts ?? []).length;
  const sayaSuka = !!userId && (reacts ?? []).some((r) => r.profile_id === userId);

  const { data: coms } = await supabase
    .from("post_comments")
    .select("id, isi, created_at, profile_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  const comList = coms ?? [];

  const namaById = await namaProfil(supabase, [
    ...(p.author_id ? [p.author_id] : []),
    ...comList.map((c) => c.profile_id).filter((x): x is string => !!x),
  ]);

  return {
    post: {
      id: p.id,
      isi: p.isi,
      fotoUrl: p.foto_url ?? null,
      createdAt: p.created_at,
      authorId: p.author_id ?? null,
      authorNama: (p.author_id && namaById.get(p.author_id)) || "Warga",
      suka,
      sayaSuka,
      komentar: comList.length,
    },
    komentar: comList.map((c) => ({
      id: c.id,
      isi: c.isi,
      createdAt: c.created_at,
      authorId: c.profile_id ?? null,
      authorNama: (c.profile_id && namaById.get(c.profile_id)) || "Warga",
    })),
  };
}
