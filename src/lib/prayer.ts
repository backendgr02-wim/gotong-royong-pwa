/**
 * Jadwal sholat via Aladhan API (gratis, tanpa API key).
 * method=20 = Kementerian Agama RI (KEMENAG) — sesuai standar Indonesia.
 * Hasil baca di-cache 1 jam oleh Next; selain itu disimpan ke tabel `prayer_cache` harian.
 */
export type PrayerTimes = {
  Subuh: string;
  Dzuhur: string;
  Ashar: string;
  Maghrib: string;
  Isya: string;
};

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  date: Date = new Date(),
): Promise<PrayerTimes | null> {
  const d = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${d}?latitude=${lat}&longitude=${lng}&method=20`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const t = json?.data?.timings;
    if (!t) return null;
    return {
      Subuh: t.Fajr,
      Dzuhur: t.Dhuhr,
      Ashar: t.Asr,
      Maghrib: t.Maghrib,
      Isya: t.Isha,
    };
  } catch {
    return null;
  }
}

/** Tentukan sholat berikutnya dari sekarang (untuk kartu "Sholat Berikutnya"). */
export function sholatBerikutnya(
  times: PrayerTimes,
  now: Date = new Date(),
): { nama: string; jam: string } | null {
  const urut: [keyof PrayerTimes, string][] = [
    ["Subuh", times.Subuh],
    ["Dzuhur", times.Dzuhur],
    ["Ashar", times.Ashar],
    ["Maghrib", times.Maghrib],
    ["Isya", times.Isya],
  ];
  const menitSekarang = now.getHours() * 60 + now.getMinutes();
  for (const [nama, jam] of urut) {
    const [h, m] = jam.split(":").map(Number);
    if (h! * 60 + m! >= menitSekarang) return { nama, jam };
  }
  return { nama: "Subuh", jam: times.Subuh }; // sudah lewat Isya → besok Subuh
}
