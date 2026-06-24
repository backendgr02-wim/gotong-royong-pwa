import { createClient } from "@/lib/supabase/server";

export type Member = {
  id: string;
  nama: string;
  peran: string;
  noHp: string | null;
  avatarUrl: string | null;
};

/**
 * Daftar anggota aktif suatu komunitas.
 * Join memberships → profiles untuk mendapatkan nama & kontak.
 */
export async function getMembers(communityId: string): Promise<Member[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select(`
      id,
      peran,
      profile:profiles!inner(id, nama, no_hp, avatar_url)
    `)
    .eq("community_id", communityId)
    .eq("status", "aktif")
    .order("peran", { ascending: true })
    .limit(200);

  if (!data) return [];

  return data.map((m: Record<string, unknown>) => {
    const profile = m.profile as Record<string, unknown> | null;
    return {
      id: m.id as string,
      nama: (profile?.nama as string) ?? "Tanpa Nama",
      peran: m.peran as string,
      noHp: (profile?.no_hp as string) ?? null,
      avatarUrl: (profile?.avatar_url as string) ?? null,
    };
  });
}
