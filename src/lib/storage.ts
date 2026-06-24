import { createClient } from "@/lib/supabase/server";

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png":  [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  "image/gif":  [new Uint8Array([0x47, 0x49, 0x46, 0x38])],
  "image/avif": [new Uint8Array([0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66])],
};

export function validateImageMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

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
  if (file.size > 5 * 1024 * 1024) return { error: "Maksimal 5 MB." };
  if (!file.type.startsWith("image/")) return { error: "Hanya file gambar." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFilename(`${Date.now()}_${userId.slice(0, 8)}.${ext}`);
  const filePath = `${userId}/${safeName}`;

  const buffer = new Uint8Array(await file.arrayBuffer());
  if (!validateImageMagicBytes(buffer, file.type)) {
    return { error: "File tidak dikenali sebagai gambar (magic bytes tidak cocok)." };
  }

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

  const buffer = new Uint8Array(await file.arrayBuffer());

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

  const buffer = new Uint8Array(await file.arrayBuffer());

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

  const buffer = new Uint8Array(await file.arrayBuffer());

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
