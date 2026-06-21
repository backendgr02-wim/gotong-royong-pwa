"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { kegiatanSchema, rsvpSchema } from "@/lib/validation";
import type { ActionState } from "./auth";

/**
 * Ubah waktu dari input `datetime-local` (dianggap zona Asia/Jakarta) menjadi instant UTC (ISO).
 * Cegah salah-sinkron jam: kolom `mulai` = timestamptz; tanpa offset, Postgres bisa salah 7 jam.
 */
function waktuJakartaKeUtc(local: string): string | null {
  let m = local.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(m)) m += ":00";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(m)) return null;
  const d = new Date(`${m}+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Buat kegiatan/kajian. HANYA pengurus (penegak sebenarnya = RLS `events_write_pengurus`). */
export async function buatKegiatan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Harus masuk dulu." };

  const komunitas = await getActiveCommunity();
  if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };
  if (komunitas.peran === "warga") {
    return { error: "Hanya pengurus yang boleh membuat kegiatan." };
  }

  const parsed = kegiatanSchema.safeParse({
    judul: formData.get("judul"),
    jenis: formData.get("jenis"),
    mulai: formData.get("mulai"),
    lokasi: formData.get("lokasi"),
    deskripsi: formData.get("deskripsi"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data kegiatan tidak valid." };
  }

  const mulaiIso = waktuJakartaKeUtc(parsed.data.mulai);
  if (!mulaiIso) return { error: "Waktu mulai tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    community_id: komunitas.id,
    judul: parsed.data.judul,
    jenis: parsed.data.jenis,
    mulai: mulaiIso,
    lokasi: parsed.data.lokasi || null,
    deskripsi: parsed.data.deskripsi || null,
    dibuat_oleh: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/kegiatan");
  revalidatePath("/");
  redirect("/kegiatan");
}

/**
 * Toggle kehadiran (RSVP) sebuah kegiatan. Dipakai sebagai `<form action={toggleRsvp}>`.
 * RLS `event_rsvp` memastikan hanya anggota & hanya RSVP milik sendiri.
 */
export async function toggleRsvp(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const parsed = rsvpSchema.safeParse({ eventId: formData.get("eventId") });
  if (!parsed.success) return;

  const supabase = await createClient();
  // Ambil community_id event (untuk integritas + memenuhi RLS rsvp_insert).
  const { data: ev } = await supabase
    .from("events")
    .select("community_id")
    .eq("id", parsed.data.eventId)
    .maybeSingle();
  if (!ev) return;

  const { data: existing } = await supabase
    .from("event_rsvp")
    .select("id")
    .eq("event_id", parsed.data.eventId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("event_rsvp").delete().eq("id", existing.id);
  } else {
    await supabase.from("event_rsvp").insert({
      event_id: parsed.data.eventId,
      community_id: ev.community_id,
      profile_id: user.id,
    });
  }

  revalidatePath("/kegiatan");
  revalidatePath("/");
}
