import { createClient } from "@/lib/supabase/server";

export type Member = {
  id: string;
  nama: string;
  peran: string;
  noHp: string | null;
  avatarUrl: string | null;
};

type MembershipRow = {
  id: string;
  peran: string;
  profile: { id: string; nama: string; no_hp: string | null; avatar_url: string | null } | null;
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

  return (data as unknown as MembershipRow[]).map((m) => ({
    id: m.id,
    nama: m.profile?.nama ?? "Tanpa Nama",
    peran: m.peran,
    noHp: m.profile?.no_hp ?? null,
    avatarUrl: m.profile?.avatar_url ?? null,
  }));
}
