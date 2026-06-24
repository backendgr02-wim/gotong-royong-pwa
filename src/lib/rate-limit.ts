import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Rate limiter hybrid: in-memory untuk dev/single-instance,
 * dan opsi distributed via Supabase untuk serverless (Cloudflare Workers).
 * Pilih mode via env RATE_LIMIT_DISTRIBUTED=true.
 */

// ========== In-Memory (fallback / dev) ==========
const store = new Map<string, { count: number; resetAt: number }>();
let cleanupCounter = 0;

export function checkRateLimitMemory(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): { allowed: boolean } {
  const limit = opts.limit ?? 10;
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();
  const entry = store.get(key);

  cleanupCounter++;
  if (cleanupCounter % 100 === 0) {
    const cutoff = now - 120_000;
    for (const [k, v] of store) {
      if (v.resetAt < cutoff) store.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count++;
  return { allowed: entry.count <= limit };
}

// ========== Distributed via Supabase (serverless-safe) ==========
export async function checkRateLimitDistributed(
  identifier: string,
  opts: { limit?: number; windowMs?: number } = {},
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = opts.limit ?? 10;
  const windowSec = Math.ceil((opts.windowMs ?? 60_000) / 1000);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSec;

  const supabase = await createClient();

  await supabase.from("rate_limits").delete().lt("created_at", windowStart);

  await supabase.from("rate_limits").insert({
    identifier,
    window_start: windowStart,
  });

  const { count } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .gte("created_at", windowStart);

  const total = count ?? 0;
  return {
    allowed: total <= limit,
    remaining: Math.max(0, limit - total),
  };
}

// ========== Default async wrapper (distributed via Supabase jika tersedia, fallback in-memory) ==========
const useDistributed = process.env.RATE_LIMIT_DISTRIBUTED === "true";

export async function checkRateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): Promise<{ allowed: boolean }> {
  if (useDistributed) {
    const result = await checkRateLimitDistributed(key, opts);
    return { allowed: result.allowed };
  }
  return checkRateLimitMemory(key, opts);
}

export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}
