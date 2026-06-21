import { createClient } from "@/lib/supabase/server";

/** User Supabase saat ini (atau null). Aman dipanggil di Server Component/Action. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Daftar keanggotaan aktif user beserta komunitasnya. */
export async function getMemberships() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("memberships")
    .select("id, peran, status, community:communities(id, nama, jenis, slug_publik)")
    .eq("profile_id", user.id)
    .eq("status", "aktif");
  return data ?? [];
}

export type Peran = "warga" | "pengurus" | "dkm" | "admin";

export type ActiveCommunity = {
  id: string;
  nama: string;
  jenis: "rt" | "rw" | "masjid";
  kelurahan: string | null;
  lat: number | null;
  lng: number | null;
  peran: Peran;
};

/**
 * Komunitas aktif pengguna saat ini (keanggotaan aktif PERTAMA) + peran-nya, atau null.
 * SUMBER KEBENARAN TUNGGAL "komunitas aktif" — semua halaman ber-data memakai ini, jangan
 * menyalin query membership/komunitas di tempat lain (cegah salah-sinkron multi-tenant).
 * Mengembalikan null bila belum login atau belum punya keanggotaan/komunitas (pemanggil yang
 * memutuskan redirect — biasanya ke /masuk atau /onboarding).
 */
export async function getActiveCommunity(): Promise<ActiveCommunity | null> {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("memberships")
    .select("peran, community:communities(id, nama, jenis, kelurahan, lat, lng)")
    .eq("profile_id", user.id)
    .eq("status", "aktif")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const c = Array.isArray(data.community) ? data.community[0] : data.community;
  if (!c) return null;

  return {
    id: c.id,
    nama: c.nama,
    jenis: c.jenis,
    kelurahan: c.kelurahan ?? null,
    lat: c.lat ?? null,
    lng: c.lng ?? null,
    peran: data.peran as Peran,
  };
}
