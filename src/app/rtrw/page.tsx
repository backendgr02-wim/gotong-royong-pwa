import Link from "next/link";
import type { Metadata } from "next";
import {
  Building2,
  TrendingUp,
  HeartHandshake,
  AlertTriangle,
  Vote,
  Megaphone,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "RT / RW",
  description:
    "Kelola kas RT/RW, iuran warga, laporan masalah, polling, dan pengumuman — transparan dan efisien.",
};

const fitur = [
  { icon: TrendingUp, label: "Kas RT / RW", desc: "Catat pemasukan & pengeluaran dana warga secara transparan.", href: "/laporan-kas" },
  { icon: HeartHandshake, label: "Iuran Warga", desc: "Iuran bulanan & donasi warga dengan bukti transfer.", href: "/donasi" },
  { icon: AlertTriangle, label: "Lapor RT / RW", desc: "Laporkan masalah lingkungan dengan foto dan lokasi.", href: "/lapor" },
  { icon: Vote, label: "Polling Warga", desc: "Adakan voting untuk keputusan bersama warga.", href: "/polling" },
  { icon: Megaphone, label: "Pengumuman", desc: "Sampaikan informasi penting ke seluruh warga.", href: "/pengumuman" },
  { icon: Users, label: "Warga", desc: "Direktori anggota dan kontak warga satu lingkungan.", href: "/anggota" },
];

export default function LandingRtrw() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-8 text-white">
        <p className="text-xs text-white/70">Platform Komunitas</p>
        <h1 className="mt-1 text-2xl font-bold">RT / RW</h1>
        <p className="mt-2 text-sm text-white/80">
          Kelola lingkungan secara digital — transparan, efisien, dan gratis.
        </p>
      </header>

      <div className="space-y-4 p-4">
        <Card className="bg-gradient-to-br from-primary to-primary-deep text-center text-white">
          <Building2 size={40} className="mx-auto text-white" />
          <h2 className="mt-3 text-xl font-bold">Fitur Lengkap untuk RT / RW</h2>
          <p className="mt-1 text-sm text-white/80">
            Dari kas hingga laporan warga, semua dalam satu aplikasi gratis.
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
