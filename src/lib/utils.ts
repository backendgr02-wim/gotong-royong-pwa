import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ubah `datetime-local` (WIB/+07:00) ke instant UTC ISO.
 * Mengembalikan null jika kosong/invalid.
 */
export function waktuJakartaKeUtc(local: string): string | null {
  let m = local.trim();
  if (m === "") return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(m)) m += ":00";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(m)) return null;
  const d = new Date(`${m}+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Format Rupiah singkat untuk kartu transparansi (mis. 22600000 -> "Rp 22,6 jt"). */
export function formatRupiahSingkat(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n}`;
}

/** Format Rupiah penuh (mis. 1500000 -> "Rp 1.500.000"). */
export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}
