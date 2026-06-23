const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "DATABASE_URL",
] as const;

const optional = [
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
] as const;

export function assertEnv(): void {
  if (typeof process === "undefined") return;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Required env var ${key} is not set. Check .env.local`);
    }
  }

  for (const key of optional) {
    if (!process.env[key]) {
      console.warn(`Optional env var ${key} is not set. Related features may not work.`);
    }
  }
}
