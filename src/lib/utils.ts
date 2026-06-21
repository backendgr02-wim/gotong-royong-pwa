/**
 * Penggabung className ringan (tanpa dependensi tambahan).
 * Bisa diganti ke clsx + tailwind-merge bila nanti pakai shadcn/ui penuh.
 */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
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
