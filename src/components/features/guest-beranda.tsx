"use client";

import Link from "next/link";
import {
  TrendingUp,
  Clock,
  CalendarDays,
  HeartHandshake,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

export function GuestBeranda() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/70">Platform Komunitas</p>
            <h1 className="text-2xl font-bold">Gotong Royong</h1>
          </div>
          <Link
            href="/masuk"
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold active:scale-[0.97]"
          >
            <LogIn size={16} /> Masuk
          </Link>
        </div>
        <p className="mt-2 text-sm text-white/80 italic">
          &quot;Bersama Ilmu, Bergerak Nyata&quot;
        </p>
      </header>

      <div className="space-y-4 p-4">
        <Card className="bg-gradient-to-br from-primary to-primary-deep text-center text-white">
          <Logo size={48} className="mx-auto text-white" />
          <h2 className="mt-3 text-xl font-bold">
            Komunitasmu dalam Satu Aplikasi
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Transparansi kas, jadwal sholat, pengumuman, donasi, dan kegiatan
            komunitas — ringan, gratis, untuk semua.
          </p>
          <Link
            href="/pilih-peran"
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-primary-deep active:scale-[0.97]"
          >
            Mulai Sekarang <ArrowRight size={16} />
          </Link>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: TrendingUp,
              label: "Kas Komunitas",
              desc: "Catat & pantau keuangan",
            },
            {
              icon: Clock,
              label: "Jadwal Sholat",
              desc: "Metode Kemenag RI",
            },
            {
              icon: CalendarDays,
              label: "Kegiatan",
              desc: "RSVP & pengingat",
            },
            {
              icon: HeartHandshake,
              label: "Donasi & Iuran",
              desc: "Transfer + foto bukti",
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.label} className="p-4 text-center">
                <Icon size={24} className="mx-auto text-primary" />
                <p className="mt-2 text-sm font-bold">{f.label}</p>
                <p className="text-xs text-muted">{f.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
