"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { pollSchema, voteSchema } from "@/lib/validation";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

/**
 * Buat polling baru (pengurus). Hanya satu pilihan — RLS `polls_insert` memeriksa is_pengurus.
 */
export async function buatPolling(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const komunitas = await getActiveCommunity();
    if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };
    if (komunitas.peran === "warga") {
      return { error: "Hanya pengurus yang boleh membuat polling." };
    }

    const parsed = pollSchema.safeParse({
      pertanyaan: formData.get("pertanyaan"),
      opsi: formData.getAll("opsi"),
      berakhir: formData.get("berakhir"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Data polling tidak valid." };
    }

    const ip = await getClientIp();
    if (!(await checkRateLimit(`buatPolling:${ip ?? "unknown"}`, { limit: 3 })).allowed)
      return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

    const supabase = await createClient();
    const { error } = await supabase.from("polls").insert({
      community_id: komunitas.id,
      pertanyaan: parsed.data.pertanyaan,
      opsi: parsed.data.opsi,
      berakhir: parsed.data.berakhir || null,
      dibuat_oleh: user.id,
    });
    if (error) return { error: error.message };

    revalidatePath("/");
    revalidatePath("/polling");
    redirect("/polling");
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("buatPolling:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/**
 * Vote satu pilihan di polling. Idempoten — upsert dengan unique constraint cegah duplikat.
 */
export async function vote(formData: FormData): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;

    const parsed = voteSchema.safeParse({
      pollId: formData.get("pollId"),
      opsiIndex: formData.get("opsiIndex"),
    });
    if (!parsed.success) return;

    const supabase = await createClient();

    const { data: poll } = await supabase
      .from("polls")
      .select("community_id")
      .eq("id", parsed.data.pollId)
      .maybeSingle();
    if (!poll) return;

    const { error } = await supabase.from("poll_votes").upsert(
      {
        poll_id: parsed.data.pollId,
        community_id: poll.community_id,
        profile_id: user.id,
        opsi_index: parsed.data.opsiIndex,
      },
      { onConflict: "poll_votes_uniq" },
    );
    if (error) {
      console.error("vote:", error.message);
      return;
    }

    revalidatePath("/polling");
  } catch (e) {
    console.error("vote:", e);
  }
}
