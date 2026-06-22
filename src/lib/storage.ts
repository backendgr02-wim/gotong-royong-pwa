import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY!;

function serviceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET, {
    auth: { persistSession: false },
  });
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
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = sanitizeFilename(`${Date.now()}_${userId.slice(0, 8)}.${ext}`);
  const filePath = `${userId}/${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = serviceClient();
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
