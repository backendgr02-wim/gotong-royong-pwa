/**
 * Jadwal sholat via `prayer_cache` (tabel Supabase) dengan fallback Aladhan API.
 * method=20 = Kementerian Agama RI (KEMENAG) — sesuai standar Indonesia.
 * Dipanggil tiap render Beranda → cache menghindari CPU/memory spike di Worker.
 */
export type PrayerTimes = {
  Subuh: string;
  Dzuhur: string;
  Ashar: string;
  Maghrib: string;
  Isya: string;
};

function tanggalHariIni(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${t}`;
}

function tanggalAladhan(): string {
  const d = new Date();
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
}

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  date: Date = new Date(),
  communityId?: string,
): Promise<PrayerTimes | null> {
  // 1. Coba baca dari cache Supabase
  if (communityId) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const hari = tanggalHariIni();
    const { data: cached } = await supabase
      .from("prayer_cache")
      .select("waktu")
      .eq("community_id", communityId)
      .eq("tanggal", hari)
      .maybeSingle();
    if (cached?.waktu) {
      const w = cached.waktu as Record<string, string>;
      if (w.Subuh && w.Dzuhur && w.Ashar && w.Maghrib && w.Isya) {
        return w as PrayerTimes;
      }
    }
  }

  // 2. Fallback: Aladhan API
  const d = tanggalAladhan();
  const url = `https://api.aladhan.com/v1/timings/${d}?latitude=${lat}&longitude=${lng}&method=20`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const t = json?.data?.timings;
    if (!t) return null;
    const times: PrayerTimes = {
      Subuh: t.Fajr,
      Dzuhur: t.Dhuhr,
      Ashar: t.Asr,
      Maghrib: t.Maghrib,
      Isya: t.Isha,
    };

    // 3. Simpan ke cache (tidak blokir)
    if (communityId) {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase2 = await createClient();
        await supabase2.from("prayer_cache").upsert(
          {
            community_id: communityId,
            tanggal: tanggalHariIni(),
            waktu: times,
          },
          { onConflict: "community_id,tanggal", ignoreDuplicates: true },
        );
      } catch {
        // cache gagal simpan → tidak kritis
      }
    }

    return times;
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
