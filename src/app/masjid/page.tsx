import Link from "next/link";
import type { Metadata } from "next";
import {
  Landmark,
  TrendingUp,
  Clock,
  CalendarDays,
  Megaphone,
  HeartHandshake,
  ArrowRight,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Masjid",
  description:
    "Kelola kas masjid, jadwal sholat, kajian, pengumuman, dan donasi — transparan dan modern.",
};

const fitur = [
  { icon: TrendingUp, label: "Kas Masjid", desc: "Catat pemasukan & penyaluran dana masjid secara transparan.", href: "/laporan-kas" },
  { icon: Clock, label: "Jadwal Sholat", desc: "Waktu sholat otomatis sesuai lokasi masjid, metode Kemenag.", href: "/" },
  { icon: CalendarDays, label: "Kajian & Kegiatan", desc: "Buat & sebarkan jadwal kajian, tabligh akbar, dan kegiatan masjid.", href: "/kegiatan" },
  { icon: Megaphone, label: "Pengumuman", desc: "Sampaikan informasi penting ke jamaah secara cepat.", href: "/pengumuman" },
  { icon: HeartHandshake, label: "Donasi & Infak", desc: "Donasi manual + upload bukti transfer untuk transparansi.", href: "/donasi" },
  { icon: Users, label: "Profil Masjid", desc: "Halaman publik masjid dengan QR code untuk dibagikan.", href: "/#" },
];

export default function LandingMasjid() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-8 text-white">
        <p className="text-xs text-white/70">Platform Komunitas</p>
        <h1 className="mt-1 text-2xl font-bold">Masjid</h1>
        <p className="mt-2 text-sm text-white/80">
          Kelola masjid secara digital — transparan, modern, dan terjangkau.
        </p>
      </header>

      <div className="space-y-4 p-4">
        <Card className="bg-gradient-to-br from-primary to-primary-deep text-center text-white">
          <Landmark size={40} className="mx-auto text-white" />
          <h2 className="mt-3 text-xl font-bold">Fitur Lengkap untuk Masjid</h2>
          <p className="mt-1 text-sm text-white/80">
            Dari kas hingga kajian, semua dalam satu aplikasi gratis.
          </p>
          <Link
            href="/pilih-peran"
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-primary-deep active:scale-[0.97]"
          >
            Mulai Sekarang <ArrowRight size={16} />
          </Link>
        </Card>

        <div className="space-y-3">
          {fitur.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.label} href={f.href}>
                <Card className="flex items-start gap-4 active:scale-[0.99]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success-subtle text-primary">
                    <Icon size={24} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{f.label}</p>
                    <p className="text-sm text-muted">{f.desc}</p>
                  </div>
                  <ArrowRight size={18} className="mt-2 shrink-0 text-muted" />
                </Card>
              </Link>
            );
          })}
        </div>

        <p className="pt-2 text-center text-xs text-muted">
          Gratis selamanya. Cukup punya domain sendiri.
        </p>
      </div>
    </div>
  );
}
