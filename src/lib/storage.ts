import { createClient } from "@/lib/supabase/server";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

export async function uploadBuktiTransfer(
  file: File,
  userId: string,
): Promise<{ path: string; signedUrl: string } | { error: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFilename(`${Date.now()}_${userId.slice(0, 8)}.${ext}`);
  const filePath = `${userId}/${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("donation-proofs")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) return { error: uploadError.message };

  const { data: signed } = await supabase.storage
    .from("donation-proofs")
    .createSignedUrl(filePath, 60 * 24 * 7);
  if (!signed) return { error: "Gagal membuat tautan akses." };

  return { path: filePath, signedUrl: signed.signedUrl };
}

/** Upload gambar postingan ke bucket publik `post-images`. Kembalikan URL publik langsung. */
export async function uploadPostImage(
  file: File,
  userId: string,
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFilename(`${Date.now()}_${userId.slice(0, 8)}.${ext}`);
  const filePath = `${userId}/${safeName}`;

  if (file.size > 5 * 1024 * 1024) return { error: "Maksimal 5 MB." };
  if (!file.type.startsWith("image/")) return { error: "Hanya file gambar." };

  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) return { error: uploadError.message };

  const { data: publik } = supabase.storage.from("post-images").getPublicUrl(filePath);
  return { path: filePath, publicUrl: publik.publicUrl };
}

/** Upload avatar ke bucket publik `avatars`. Kembalikan URL publik. */
export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFilename(`avatar_${userId.slice(0, 8)}.${ext}`);
  const filePath = `${userId}/${safeName}`;

  if (file.size > 2 * 1024 * 1024) return { error: "Maksimal 2 MB." };
  if (!file.type.startsWith("image/")) return { error: "Hanya file gambar." };

  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });
  if (uploadError) return { error: uploadError.message };

  const { data: publik } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return { path: filePath, publicUrl: publik.publicUrl };
}

/** Upload foto laporan ke bucket privat `report-images`. Kembalikan signed URL 30 hari. */
export async function uploadReportImage(
  file: File,
  userId: string,
): Promise<{ path: string; signedUrl: string } | { error: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFilename(`${Date.now()}_${userId.slice(0, 8)}.${ext}`);
  const filePath = `${userId}/${safeName}`;

  if (file.size > 5 * 1024 * 1024) return { error: "Maksimal 5 MB." };
  if (!file.type.startsWith("image/")) return { error: "Hanya file gambar." };

  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("report-images")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) return { error: uploadError.message };

  const { data: signed } = await supabase.storage
    .from("report-images")
    .createSignedUrl(filePath, 60 * 24 * 30);
  if (!signed) return { error: "Gagal membuat tautan akses." };

  return { path: filePath, signedUrl: signed.signedUrl };
}
