"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { kegiatanSchema, rsvpSchema } from "@/lib/validation";
import { waktuJakartaKeUtc } from "@/lib/utils";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

/** Buat kegiatan/kajian. HANYA pengurus (penegak sebenarnya = RLS `events_write_pengurus`). */
export async function buatKegiatan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
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

    const ip = await getClientIp();
    if (!checkRateLimit(`buatKegiatan:${ip}`, { limit: 5 }).allowed)
      return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

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
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("buatKegiatan:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/**
 * Toggle kehadiran (RSVP) sebuah kegiatan. Dipakai sebagai `<form action={toggleRsvp}>`.
 * RLS `event_rsvp` memastikan hanya anggota & hanya RSVP milik sendiri.
 */
export async function toggleRsvp(formData: FormData): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;

    const parsed = rsvpSchema.safeParse({ eventId: formData.get("eventId") });
    if (!parsed.success) return;

    const supabase = await createClient();
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
  } catch (e) {
    console.error("toggleRsvp:", e);
  }
}
