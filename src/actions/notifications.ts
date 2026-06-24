"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

/**
 * Tandai satu notifikasi sudah dibaca. RLS `notifications_update` memastikan hanya pemilik.
 */
export async function tandaiDibaca(formData: FormData): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;

    const notifId = formData.get("notifId");
    if (typeof notifId !== "string" || !notifId) return;

    const supabase = await createClient();
    await supabase.from("notifications").update({ dibaca: true }).eq("id", notifId);
    revalidatePath("/pesan");
  } catch (e) {
    console.error("tandaiDibaca:", e);
  }
}

/**
 * Tandai SEMUA notifikasi user sudah dibaca sekaligus (tombol "Tandai Semua Dibaca").
 */
export async function tandaiSemuaDibaca(): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;

    const supabase = await createClient();
    await supabase.from("notifications").update({ dibaca: true }).eq("profile_id", user.id).is("dibaca", false);
    revalidatePath("/pesan");
  } catch (e) {
    console.error("tandaiSemuaDibaca:", e);
  }
}
