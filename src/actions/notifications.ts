"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { notifRefSchema } from "@/lib/validation";

/**
 * Tandai satu notifikasi dibaca, lalu (opsional) buka tautannya. RLS `notif_update` = milik sendiri.
 * `link` hanya diikuti bila path internal (diawali "/") demi keamanan (cegah open-redirect).
 */
export async function tandaiDibaca(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const parsed = notifRefSchema.safeParse({ notifId: formData.get("notifId") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ dibaca: true })
    .eq("id", parsed.data.notifId)
    .eq("profile_id", user.id);

  revalidatePath("/pesan");
  revalidatePath("/");

  const link = formData.get("link");
  if (typeof link === "string" && link.startsWith("/")) redirect(link);
}

/** Tandai semua notifikasi sebagai dibaca. */
export async function tandaiSemuaDibaca(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ dibaca: true })
    .eq("profile_id", user.id)
    .eq("dibaca", false);

  revalidatePath("/pesan");
  revalidatePath("/");
}
