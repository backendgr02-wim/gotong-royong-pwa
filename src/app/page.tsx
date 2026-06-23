import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  MessageSquare,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  CalendarDays,
  MapPin,
  HeartHandshake,
  Check,
  ArrowRight,
  Megaphone,
  Pin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getKasSummary } from "@/lib/kas";
import { getUpcomingEvents } from "@/lib/events";
import { getPinnedAnnouncement } from "@/lib/announcements";
import { countUnread } from "@/lib/notifications";
import { fetchPrayerTimes, sholatBerikutnya } from "@/lib/prayer";
import { formatRupiahSingkat } from "@/lib/utils";
import { toggleMutabaah } from "@/actions/mutabaah";

// Halaman ber-auth & ber-data → wajib dinamis (Next 16).
export const dynamic = "force-dynamic";

const kategori = ["Donasi", "Keluarga", "Masjid", "Pasar", "B & B", "RT/RW"];

/** Tanggal Asia/Jakarta (YYYY-MM-DD) agar centang mutabaah sesuai hari lokal. */
function tanggalJakarta(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function tglIndo(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function jamKegiatan(iso: string): string {
  const d = new Date(iso);
  const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const jam = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return `${tgl} · ${jam}`;
}

export default async function Beranda() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/");

  // --- Komunitas aktif (sumber tunggal: lib/auth) ---
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  // --- Transparansi kas (sumber tunggal: lib/kas) ---
  const { saldo, masuk, keluar, updateTerakhir, jumlah } = await getKasSummary(komunitas.id);
  const adaKas = jumlah > 0;

  // --- Jadwal sholat (Aladhan/Kemenag). Fallback: Cilandak, Jakarta Selatan. ---
  const lat = komunitas.lat ?? -6.2607;
  const lng = komunitas.lng ?? 106.7816;
  const times = await fetchPrayerTimes(lat, lng);
  const berikutnya = times ? sholatBerikutnya(times) : null;

  // --- Kegiatan mendatang (sumber tunggal: lib/events) ---
  const events = await getUpcomingEvents(komunitas.id, user.id, 3);

  // --- Pengumuman ter-pin (Kartu Unggulan) ---
  const pengumuman = await getPinnedAnnouncement(komunitas.id);

  // --- Notifikasi belum dibaca (badge bell) ---
  const unread = await countUnread(user.id);

  // --- Mutabaah harian ---
  const today = tanggalJakarta();
  const { data: items } = await supabase
    .from("mutabaah_items")
    .select("id, label, urutan")
    .or(`community_id.is.null,community_id.eq.${komunitas.id}`)
    .order("urutan", { ascending: true });
  const { data: logs } = await supabase
    .from("mutabaah_logs")
    .select("item_id, done")
    .eq("profile_id", user.id)
    .eq("tanggal", today);
  const doneSet = new Set((logs ?? []).filter((l) => l.done).map((l) => l.item_id));
  const totalItems = items?.length ?? 0;
  const totalDone = (items ?? []).filter((i) => doneSet.has(i.id)).length;

  return (
    <div>
      {/* Header hijau */}
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/70">
              {komunitas.kelurahan || komunitas.jenis.toUpperCase()}
            </p>
            <h1 className="text-2xl font-bold">{komunitas.nama}</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/pesan" aria-label="Pesan">
              <MessageSquare size={22} />
            </Link>
            <Link href="/pesan" aria-label="Notifikasi" className="relative">
              <Bell size={22} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm text-muted">
          <Search size={18} />
          <span>Cari ilmu, ustadz, komunitas, warung…</span>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {/* Kartu Unggulan: pengumuman ter-pin (NYATA) */}
        {pengumuman && (
          <Link href="/pengumuman">
            <Card className="border border-primary/30 bg-success-subtle active:scale-[0.99]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                  <Megaphone size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    <Pin size={11} /> Pengumuman
                  </p>
                  <p className="truncate font-bold">{pengumuman.judul}</p>
                  <p className="line-clamp-2 text-xs text-muted">{pengumuman.isi}</p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Transparansi keuangan (NYATA) */}
        <Card className="bg-finance text-white">
          <p className="text-[10px] font-medium tracking-wide text-white/70">
            TRANSPARANSI KEUANGAN · {komunitas.nama.toUpperCase()}
          </p>
          <p className="mt-1 text-3xl font-bold">{formatRupiahSingkat(saldo)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="flex items-center gap-1 text-[10px] text-white/70">
                <TrendingUp size={12} /> Pemasukan
              </p>
              <p className="font-bold">{formatRupiahSingkat(masuk)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="flex items-center gap-1 text-[10px] text-white/70">
                <TrendingDown size={12} /> Disalurkan
              </p>
              <p className="font-bold">{formatRupiahSingkat(keluar)}</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-white/60">
            {adaKas
              ? `Update terakhir: ${tglIndo(updateTerakhir)} · ${jumlah} catatan`
              : "Belum ada catatan kas. Pengurus dapat menambah di menu Aksi."}
          </p>
          <Link
            href="/laporan-kas"
            className="mt-3 flex items-center justify-center gap-1 rounded-2xl bg-white/15 py-2.5 text-xs font-bold text-white active:scale-[0.99]"
          >
            Lihat Laporan <ArrowRight size={14} />
          </Link>
        </Card>

        {/* Jadwal sholat (NYATA — Aladhan/Kemenag) */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <Clock size={18} className="text-primary" /> Jadwal Sholat
            </h2>
            {berikutnya && (
              <span className="rounded-full bg-success-subtle px-3 py-1 text-xs font-semibold text-primary">
                {berikutnya.nama} {berikutnya.jam}
              </span>
            )}
          </div>
          {times ? (
            <div className="mt-3 grid grid-cols-5 gap-1 text-center">
              {(
                [
                  ["Subuh", times.Subuh],
                  ["Dzuhur", times.Dzuhur],
                  ["Ashar", times.Ashar],
                  ["Maghrib", times.Maghrib],
                  ["Isya", times.Isya],
                ] as const
              ).map(([nama, jam]) => {
                const aktif = berikutnya?.nama === nama;
                return (
                  <div
                    key={nama}
                    className={`rounded-xl py-2 ${aktif ? "bg-primary text-white" : "bg-gray-100"}`}
                  >
                    <p className="text-[10px] opacity-80">{nama}</p>
                    <p className="text-sm font-bold">{jam}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">Jadwal sholat belum dapat dimuat.</p>
          )}
        </Card>

        {/* Kategori (navigasi statis) */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          {kategori.map((k, i) => {
            const href = i === 0 ? "/donasi" : "#";
            const Wrapper = i === 0 ? Link : "div";
            return (
              <Wrapper key={k} href={href as string} className="flex w-16 shrink-0 flex-col items-center gap-1">
                <div
                  className={`flex h-13 w-13 items-center justify-center rounded-full ${
                    i === 0
                      ? "border-2 border-primary bg-success-subtle text-primary"
                      : "bg-gray-100 text-muted"
                  } p-3`}
                >
                  <HeartHandshake size={22} />
                </div>
                <span className="text-center text-[10px]">{k}</span>
              </Wrapper>
            );
          })}
        </div>

        {/* Kegiatan mendatang (NYATA) */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <CalendarDays size={18} className="text-primary" /> Kegiatan Mendatang
            </h2>
            <Link href="/kegiatan" className="flex items-center gap-0.5 text-xs font-semibold text-primary">
              Lihat semua <ArrowRight size={13} />
            </Link>
          </div>
          {events.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-subtle text-primary">
                    <CalendarDays size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.judul}</p>
                    <p className="text-xs text-muted">
                      {jamKegiatan(e.mulai)}
                      {e.lokasi ? (
                        <span className="inline-flex items-center gap-1">
                          {" · "}
                          <MapPin size={11} /> {e.lokasi}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Belum ada kegiatan terjadwal. Pengurus dapat membuat di menu Aksi.
            </p>
          )}
        </Card>

        {/* Mutabaah harian (NYATA — bisa dicentang) */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Mutabaah Harian</h2>
            <span className="text-xs font-semibold text-primary">
              {totalDone}/{totalItems}
            </span>
          </div>
          <p className="text-xs text-muted">Pantau ibadah &amp; amalan harianmu</p>
          {totalItems > 0 ? (
            <ul className="mt-4 space-y-2">
              {(items ?? []).map((m) => {
                const done = doneSet.has(m.id);
                return (
                  <li key={m.id}>
                    <form action={toggleMutabaah}>
                      <input type="hidden" name="itemId" value={m.id} />
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition active:scale-[0.99] hover:bg-gray-50"
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            done
                              ? "border-primary bg-primary text-white"
                              : "border-outline text-transparent"
                          }`}
                        >
                          <Check size={14} strokeWidth={3} />
                        </span>
                        <span
                          className={`flex-1 text-sm font-medium ${done ? "text-muted line-through" : ""}`}
                        >
                          {m.label}
                        </span>
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Daftar amalan belum tersedia.</p>
          )}
        </Card>

        <p className="pt-2 text-center text-xs text-muted">
          Data nyata dari komunitasmu · jadwal sholat metode Kemenag RI.
        </p>
      </div>
    </div>
  );
}
