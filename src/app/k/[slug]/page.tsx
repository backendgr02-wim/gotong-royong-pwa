import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Clock,
  CalendarDays,
  MapPin,
  Phone,
  Megaphone,
  TrendingUp,
  TrendingDown,
  LogIn,
  House,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { fetchPrayerTimes, sholatBerikutnya } from "@/lib/prayer";
import { formatRupiah } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { QrKomunitas } from "@/components/features/qr-komunitas";

// Halaman publik ber-data → render saat diminta (Next 16).
export const dynamic = "force-dynamic";

type Community = {
  id: string;
  nama: string;
  jenis: "rt" | "rw" | "masjid";
  kelurahan: string | null;
  deskripsi: string | null;
  lat: number | null;
  lng: number | null;
  slug_publik: string;
};

const JENIS_LABEL: Record<string, string> = { rt: "RT", rw: "RW", masjid: "Masjid" };

async function getCommunity(slug: string): Promise<Community | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("id, nama, jenis, kelurahan, deskripsi, lat, lng, slug_publik")
    .eq("slug_publik", slug)
    .returns<Community>()
    .maybeSingle();
  return data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCommunity(slug);
  if (!c) return { title: "Komunitas tidak ditemukan — Gotong Royong" };
  const judul = `${JENIS_LABEL[c.jenis] ?? ""} ${c.nama}`.trim();
  const desc = c.deskripsi || `Profil ${judul}: transparansi kas, jadwal, kegiatan & kontak.`;
  return {
    title: `${judul} — Gotong Royong`,
    description: desc,
    openGraph: { title: judul, description: desc, type: "profile" },
  };
}

function jamKegiatan(iso: string): string {
  const d = new Date(iso);
  const tgl = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
  const jam = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return `${tgl} · ${jam} WIB`;
}

export default async function HalamanPublik({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCommunity(slug);
  if (!c) notFound();

  const user = await getUser();
  const supabase = await createClient();

  // Ringkasan kas publik (RINGKAS via RPC — bukan baris mentah).
  const { data: kasData } = await supabase.rpc("public_kas_summary", { slug });
  const raw = Array.isArray(kasData) ? kasData[0] : kasData;
  const kas: { total: number; pemasukan: number; penyaluran: number; update_terakhir: string | null } | undefined =
    raw
      ? { total: Number(raw.total) || 0, pemasukan: Number(raw.pemasukan) || 0, penyaluran: Number(raw.penyaluran) || 0, update_terakhir: raw.update_terakhir ?? null }
      : undefined;

  // Kegiatan mendatang (events = info publik).
  const { data: events } = await supabase
    .from("events")
    .select("id, judul, mulai, lokasi, jenis")
    .eq("community_id", c.id)
    .gte("mulai", new Date().toISOString())
    .order("mulai", { ascending: true })
    .limit(5);

  // Pengumuman ter-pin (anon hanya boleh yang pinned).
  const { data: pengumuman } = await supabase
    .from("announcements")
    .select("id, judul, isi, created_at")
    .eq("community_id", c.id)
    .eq("pinned", true)
    .order("created_at", { ascending: false })
    .limit(5);

  // Kontak darurat (publik).
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, nama, peran, no_hp")
    .eq("community_id", c.id)
    .limit(20);

  // Jadwal sholat (fallback Jakarta Selatan bila lat/lng kosong).
  const times = await fetchPrayerTimes(c.lat ?? -6.2607, c.lng ?? 106.7816, new Date(), c.id);
  const berikutnya = times ? sholatBerikutnya(times) : null;

  const saldo = Number(kas?.total ?? 0);
  const masuk = Number(kas?.pemasukan ?? 0);
  const keluar = Number(kas?.penyaluran ?? 0);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-bg">
      {/* Bar atas */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-bold text-primary-deep">Gotong Royong</span>
        <div className="flex items-center gap-2">
          <QrKomunitas slug={slug} nama={c.nama} />
          {user ? (
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
            >
              <House size={14} /> Buka Beranda
            </Link>
          ) : (
            <Link
              href="/masuk"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
            >
              <LogIn size={14} /> Masuk
            </Link>
          )}
        </div>
      </div>

      {/* Header komunitas */}
      <header className="rounded-b-[28px] bg-header px-5 pt-4 pb-6 text-white">
        <p className="text-xs text-white/70">
          {JENIS_LABEL[c.jenis] ?? c.jenis}
          {c.kelurahan ? ` · ${c.kelurahan}` : ""}
        </p>
        <h1 className="text-2xl font-bold">{c.nama}</h1>
        {c.deskripsi && <p className="mt-2 text-sm text-white/80">{c.deskripsi}</p>}
      </header>

      <div className="space-y-4 p-4">
        {/* Transparansi kas (ringkas) */}
        <Card className="bg-finance text-white">
          <p className="text-[10px] font-medium tracking-wide text-white/70">
            TRANSPARANSI KEUANGAN
          </p>
          <p className="mt-1 text-3xl font-bold">{formatRupiah(saldo)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="flex items-center gap-1 text-[10px] text-white/70">
                <TrendingUp size={12} /> Pemasukan
              </p>
              <p className="font-bold">{formatRupiah(masuk)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="flex items-center gap-1 text-[10px] text-white/70">
                <TrendingDown size={12} /> Disalurkan
              </p>
              <p className="font-bold">{formatRupiah(keluar)}</p>
            </div>
          </div>
        </Card>

        {/* Jadwal sholat */}
        {times && (
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
            <div className="mt-3 grid grid-cols-5 gap-1 text-center">
              {(
                [
                  ["Subuh", times.Subuh],
                  ["Dzuhur", times.Dzuhur],
                  ["Ashar", times.Ashar],
                  ["Maghrib", times.Maghrib],
                  ["Isya", times.Isya],
                ] as const
              ).map(([n, j]) => (
                <div key={n} className="rounded-xl bg-gray-100 py-2">
                  <p className="text-[10px] opacity-80">{n}</p>
                  <p className="text-sm font-bold">{j}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pengumuman ter-pin */}
        {pengumuman && pengumuman.length > 0 && (
          <Card>
            <h2 className="flex items-center gap-2 font-bold">
              <Megaphone size={18} className="text-primary" /> Pengumuman
            </h2>
            <ul className="mt-3 space-y-3">
              {pengumuman.map((a) => (
                <li key={a.id}>
                  <p className="text-sm font-semibold">{a.judul}</p>
                  <p className="line-clamp-3 text-xs text-muted">{a.isi}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Kegiatan mendatang */}
        <Card>
          <h2 className="flex items-center gap-2 font-bold">
            <CalendarDays size={18} className="text-primary" /> Kegiatan Mendatang
          </h2>
          {events && events.length > 0 ? (
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
            <p className="mt-2 text-sm text-muted">Belum ada kegiatan terjadwal.</p>
          )}
        </Card>

        {/* Kontak darurat */}
        {contacts && contacts.length > 0 && (
          <Card>
            <h2 className="flex items-center gap-2 font-bold">
              <Phone size={18} className="text-primary" /> Kontak Penting
            </h2>
            <ul className="mt-3 divide-y divide-outline">
              {contacts.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{k.nama}</p>
                    <p className="text-xs text-muted">{k.peran}</p>
                  </div>
                  {k.no_hp && (
                    <a
                      href={`tel:${k.no_hp}`}
                      className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-3 py-1.5 text-xs font-bold text-primary"
                    >
                      <Phone size={13} /> Telepon
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <p className="pb-6 pt-1 text-center text-xs text-muted">
          Halaman publik · jadwal sholat metode Kemenag RI · tanpa data pribadi warga.
        </p>
      </div>
    </div>
  );
}
