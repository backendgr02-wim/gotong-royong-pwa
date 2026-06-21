"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { postSchema, komentarSchema, postRefSchema } from "@/lib/validation";
import type { ActionState } from "./auth";

/** Ambil community_id sebuah post (untuk integritas + memenuhi RLS reaksi/komentar). */
async function communityIdPost(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
): Promise<string | null> {
  const { data } = await supabase.from("posts").select("community_id").eq("id", postId).maybeSingle();
  return data?.community_id ?? null;
}

/** Buat postingan warga (teks). HANYA anggota. Honeypot anti-bot via field `website`. */
export async function buatPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Harus masuk dulu." };

  const komunitas = await getActiveCommunity();
  if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };

  const parsed = postSchema.safeParse({
    isi: formData.get("isi"),
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Postingan tidak valid." };
  }
  // Honeypot terisi → kemungkinan bot; pura-pura sukses tanpa menyimpan.
  if (parsed.data.website) redirect("/komunitas");

  const supabase = await createClient();
  const { error } = await supabase.from("posts").insert({
    community_id: komunitas.id,
    author_id: user.id,
    isi: parsed.data.isi,
  });
  if (error) return { error: error.message };

  revalidatePath("/komunitas");
  redirect("/komunitas");
}

/** Suka / batal-suka satu postingan. Dipakai sebagai `<form action={toggleSuka}>`. */
export async function toggleSuka(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const parsed = postRefSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) return;

  const supabase = await createClient();
  const communityId = await communityIdPost(supabase, parsed.data.postId);
  if (!communityId) return;

  const { data: existing } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("post_id", parsed.data.postId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("post_reactions").insert({
      post_id: parsed.data.postId,
      community_id: communityId,
      profile_id: user.id,
      jenis: "suka",
    });
  }

  revalidatePath("/komunitas");
  revalidatePath(`/komunitas/${parsed.data.postId}`);
}

/** Tambah komentar pada sebuah postingan. HANYA anggota. */
export async function tambahKomentar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Harus masuk dulu." };

  const parsed = komentarSchema.safeParse({
    postId: formData.get("postId"),
    isi: formData.get("isi"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Komentar tidak valid." };
  }

  const supabase = await createClient();
  const communityId = await communityIdPost(supabase, parsed.data.postId);
  if (!communityId) return { error: "Postingan tidak ditemukan." };

  const { error } = await supabase.from("post_comments").insert({
    post_id: parsed.data.postId,
    community_id: communityId,
    profile_id: user.id,
    isi: parsed.data.isi,
  });
  if (error) return { error: error.message };

  revalidatePath(`/komunitas/${parsed.data.postId}`);
  revalidatePath("/komunitas");
  return { ok: true, message: "Komentar terkirim." };
}

/** Hapus postingan. RLS `posts_delete` membatasi: hanya penulis atau pengurus. */
export async function hapusPost(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const parsed = postRefSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", parsed.data.postId);

  revalidatePath("/komunitas");
  redirect("/komunitas");
}
