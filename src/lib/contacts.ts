import { createClient } from "@/lib/supabase/server";

export type Contact = {
  id: string;
  nama: string;
  peran: string;
  noHp: string | null;
};

/** Daftar kontak penting suatu komunitas (publik). */
export async function getContacts(communityId: string): Promise<Contact[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("id, nama, peran, no_hp")
    .eq("community_id", communityId)
    .limit(50);

  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    nama: r.nama,
    peran: r.peran,
    noHp: r.no_hp ?? null,
  }));
}
