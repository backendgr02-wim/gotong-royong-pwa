/**
 * Verifikasi token Turnstile (Cloudflare) di sisi server.
 * Dipanggil dari Server Action setelah client mengirim token dari widget Turnstile.
 * Kalau token tidak ada (belum terpasang di client), return true (bypass).
 */
export async function verifyTurnstile(
  token: string | null,
  ip?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!token) return { success: true };
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn("TURNSTILE_SECRET_KEY not set — skipping verification");
    return { success: true };
  }

  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    });
    if (ip) body.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = await res.json();
    return { success: data.success === true, error: data.error?.join(", ") };
  } catch (e) {
    console.error("verifyTurnstile:", e);
    return { success: false, error: "Gagal verifikasi keamanan. Coba lagi." };
  }
}
