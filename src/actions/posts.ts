"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { postSchema, komentarSchema } from "@/lib/validation";
import { uploadPostImage } from "@/lib/storage";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./auth";

/**
 * Buat postingan feed. RLS `posts_insert` memastikan hanya anggota komunitas.
 */
export async function buatPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const komunitas = await getActiveCommunity();
    if (!komunitas) return { error: "Komunitas aktif tidak ditemukan." };

    const parsed = postSchema.safeParse({
      isi: formData.get("isi"),
      fotoUrl: formData.get("fotoUrl") ?? "",
      website: formData.get("website") ?? "",
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Data postingan tidak valid." };
    }
    if (parsed.data.website) redirect("/");

    const ip = await getClientIp();
    if (!(await checkRateLimit(`buatPost:${ip ?? "unknown"}`, { limit: 5 })).allowed)
      return { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." };

    const supabase = await createClient();

    let fotoUrl: string | null = null;
    const file = formData.get("gambar") as File | null;
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) return { error: "Ukuran gambar maksimal 10 MB." };
      const result = await uploadPostImage(file, komunitas.id);
      if ("error" in result) return { error: result.error };
      fotoUrl = result.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      community_id: komunitas.id,
      author_id: user.id,
      isi: parsed.data.isi,
      foto_url: fotoUrl,
    });
    if (error) return { error: error.message };

    revalidatePath("/");
    redirect("/");
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("buatPost:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/**
 * Toggle suka pada post (atomic DELETE-then-INSERT, cegah race condition).
 */
export async function toggleSuka(formData: FormData): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;

    const postId = formData.get("postId");
    if (typeof postId !== "string" || !postId) return;

    const supabase = await createClient();
    const { data: post } = await supabase
      .from("posts")
      .select("community_id")
      .eq("id", postId)
      .maybeSingle();
    if (!post) return;

    const { data: deleted } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id)
      .eq("jenis", "suka")
      .select("id");

    if (!deleted || deleted.length === 0) {
      const { error } = await supabase.from("post_reactions").insert({
        post_id: postId,
        community_id: post.community_id,
        profile_id: user.id,
        jenis: "suka",
      });
      if (error) {
        console.error("toggleSuka insert:", error.message);
        return;
      }
    }

    revalidatePath("/");
  } catch (e) {
    console.error("toggleSuka:", e);
  }
}

/**
 * Tambah komentar ke post. Dipakai sebagai `<form action={tambahKomentar}>`.
 */
export async function tambahKomentar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Harus masuk dulu." };

    const parsed = komentarSchema.safeParse({
      postId: formData.get("postId"),
      isi: formData.get("isi"),
    });
    if (!parsed.success) return { error: "Komentar tidak valid." };

    const supabase = await createClient();
    const { data: post } = await supabase
      .from("posts")
      .select("community_id")
      .eq("id", parsed.data.postId)
      .maybeSingle();
    if (!post) return { error: "Postingan tidak ditemukan." };

    const { error } = await supabase.from("post_comments").insert({
      post_id: parsed.data.postId,
      community_id: post.community_id,
      profile_id: user.id,
      isi: parsed.data.isi,
    });
    if (error) return { error: error.message };

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && "digest" in e) throw e;
    console.error("tambahKomentar:", e);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/**
 * Hapus postingan (pembuat atau pengurus). RLS `posts_delete` memeriksa kepemilikan atau is_pengurus.
 */
export async function hapusPost(formData: FormData): Promise<void> {
  try {
    const user = await getUser();
    if (!user) return;

    const postId = formData.get("postId");
    if (typeof postId !== "string" || !postId) return;

    const supabase = await createClient();
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      console.error("hapusPost:", error.message);
      return;
    }

    revalidatePath("/");
  } catch (e) {
    console.error("hapusPost:", e);
  }
}
