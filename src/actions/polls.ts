"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { pollSchema, voteSchema } from "@/lib/validation";
import { waktuJakartaKeUtc } from "@/lib/utils";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

/** Buat polling. HANYA pengurus (RLS `polls_write_pengurus`). */
export async function buatPolling(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Harus masuk dulu." };

  const komunitas = await getActiveCommunity();
  if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };
  if (komunitas.peran === "warga") {
    return { error: "Hanya pengurus yang boleh membuat polling." };
  }

  const opsi = formData
    .getAll("opsi")
    .map((o) => String(o).trim())
    .filter((o) => o.length > 0);

  const parsed = pollSchema.safeParse({
    pertanyaan: formData.get("pertanyaan"),
    opsi,
    berakhir: formData.get("berakhir") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Polling tidak valid." };
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`buatPolling:${ip}`, { limit: 5 }).allowed)
    return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

  const berakhirIso = parsed.data.berakhir ? waktuJakartaKeUtc(parsed.data.berakhir) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("polls").insert({
    community_id: komunitas.id,
    pertanyaan: parsed.data.pertanyaan,
    opsi: parsed.data.opsi,
    berakhir: berakhirIso,
    dibuat_oleh: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/polling");
  redirect("/polling");
}

/** Beri suara. HANYA anggota, 1 suara/user (unik di DB). Ditolak jika polling sudah berakhir. */
export async function vote(formData: FormData): Promise<void> {
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
    .select("community_id, opsi, berakhir")
    .eq("id", parsed.data.pollId)
    .maybeSingle();
  if (!poll) return;

  // Tolak bila tenggat lewat atau index opsi tak valid.
  if (poll.berakhir && new Date(poll.berakhir).getTime() < Date.now()) return;
  const jumlahOpsi = Array.isArray(poll.opsi) ? poll.opsi.length : 0;
  if (parsed.data.opsiIndex >= jumlahOpsi) return;

  // Satu suara per user: lewati jika sudah pernah vote.
  const { data: existing } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("poll_id", parsed.data.pollId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) return;

  await supabase.from("poll_votes").insert({
    poll_id: parsed.data.pollId,
    community_id: poll.community_id,
    profile_id: user.id,
    opsi_index: parsed.data.opsiIndex,
  });

  revalidatePath("/polling");
}
