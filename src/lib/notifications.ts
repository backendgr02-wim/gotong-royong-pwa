import { createClient } from "@/lib/supabase/server";

/**
 * Kotak masuk in-app (layar Pesan). RLS `notif_select`/`notif_update` = milik sendiri.
 * Pembuatan notifikasi dilakukan trigger DB (SECURITY DEFINER) — lihat `0004_notification_triggers.sql`.
 */

export type Notifikasi = {
  id: string;
  judul: string;
  isi: string | null;
  link: string | null;
  dibaca: boolean;
  createdAt: string;
};

/** Daftar notifikasi user (terbaru dulu). */
export async function getNotifications(userId: string, limit = 50): Promise<Notifikasi[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, judul, isi, link, dibaca, created_at")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((n) => ({
    id: n.id,
    judul: n.judul,
    isi: n.isi ?? null,
    link: n.link ?? null,
    dibaca: n.dibaca,
    createdAt: n.created_at,
  }));
}

/** Jumlah notifikasi belum dibaca (untuk badge titik merah). */
export async function countUnread(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", userId)
    .eq("dibaca", false);
  return count ?? 0;
}
