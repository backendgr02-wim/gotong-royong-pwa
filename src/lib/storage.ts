import { createClient } from "@/lib/supabase/server";

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png":  [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])],
  "image/gif":  [new Uint8Array([0x47, 0x49, 0x46, 0x38])],
  "image/avif": [new Uint8Array([0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66])],
};

export function validateImageMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some(sig => {
    if (buffer.length < sig.length) return false;
    return sig.every((byte, i) => {
      if (sig[4] === 0x00 && sig[5] === 0x00 && sig[6] === 0x00 && sig[7] === 0x00 && i >= 4 && i <= 7) return true;
      return buffer[i] === byte;
    });
  });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

type UploadOpts = {
  bucket: string;
  maxSize: number;
  upsert: boolean;
  namePrefix: string;
  signedUrlDays?: number;
};

type UploadResult =
  | { path: string; publicUrl?: string; signedUrl?: string }
  | { error: string };

async function uploadImage(file: File, userId: string, opts: UploadOpts): Promise<UploadResult> {
  if (file.size > opts.maxSize) return { error: "Maksimal " + (opts.maxSize / (1024 * 1024)) + " MB." };
  if (!file.type.startsWith("image/")) return { error: "Hanya file gambar." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFilename(`${opts.namePrefix}_${userId.slice(0, 8)}.${ext}`);
  const filePath = `${userId}/${safeName}`;

  const buffer = new Uint8Array(await file.arrayBuffer());
  if (!validateImageMagicBytes(buffer, file.type)) {
    return { error: "File tidak dikenali sebagai gambar (magic bytes tidak cocok)." };
  }

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(opts.bucket)
    .upload(filePath, buffer, { contentType: file.type, upsert: opts.upsert });
  if (uploadError) return { error: uploadError.message };

  if (opts.signedUrlDays) {
    const { data: signed } = await supabase.storage
      .from(opts.bucket)
      .createSignedUrl(filePath, 60 * 24 * opts.signedUrlDays);
    if (!signed) return { error: "Gagal membuat tautan akses." };
    return { path: filePath, signedUrl: signed.signedUrl };
  }

  const { data: publik } = supabase.storage.from(opts.bucket).getPublicUrl(filePath);
  return { path: filePath, publicUrl: publik.publicUrl };
}

export async function uploadBuktiTransfer(
  file: File,
  userId: string,
): Promise<{ path: string; signedUrl: string } | { error: string }> {
  return uploadImage(file, userId, {
    bucket: "donation-proofs",
    maxSize: 5 * 1024 * 1024,
    upsert: false,
    namePrefix: Date.now().toString(),
    signedUrlDays: 7,
  }) as Promise<{ path: string; signedUrl: string } | { error: string }>;
}

export async function uploadPostImage(
  file: File,
  userId: string,
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  return uploadImage(file, userId, {
    bucket: "post-images",
    maxSize: 5 * 1024 * 1024,
    upsert: false,
    namePrefix: Date.now().toString(),
  }) as Promise<{ path: string; publicUrl: string } | { error: string }>;
}

export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  return uploadImage(file, userId, {
    bucket: "avatars",
    maxSize: 2 * 1024 * 1024,
    upsert: true,
    namePrefix: "avatar",
  }) as Promise<{ path: string; publicUrl: string } | { error: string }>;
}

export async function uploadReportImage(
  file: File,
  userId: string,
): Promise<{ path: string; signedUrl: string } | { error: string }> {
  return uploadImage(file, userId, {
    bucket: "report-images",
    maxSize: 5 * 1024 * 1024,
    upsert: false,
    namePrefix: Date.now().toString(),
    signedUrlDays: 30,
  }) as Promise<{ path: string; signedUrl: string } | { error: string }>;
}
