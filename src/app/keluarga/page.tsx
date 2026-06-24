import Link from "next/link";
import type { Metadata } from "next";
import { Home, Check, BookOpen, Heart, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Keluarga",
  description:
    "Pantau ibadah & amalan harian keluarga, dan nikmati konten edukasi Islami.",
};

export default function LandingKeluarga() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-8 text-white">
        <p className="text-xs text-white/70">Platform Komunitas</p>
        <h1 className="mt-1 text-2xl font-bold">Keluarga</h1>
        <p className="mt-2 text-sm text-white/80">
          Pantau amalan harian dan tumbuhkan kebiasaan baik sekeluarga.
        </p>
      </header>

      <div className="space-y-4 p-4">
        <Card className="bg-gradient-to-br from-primary to-primary-deep text-center text-white">
          <Home size={40} className="mx-auto text-white" />
          <h2 className="mt-3 text-xl font-bold">Mutabaah Harian</h2>
          <p className="mt-1 text-sm text-white/80">
            Checklist ibadah & amalan harian untuk diri sendiri dan keluarga.
          </p>
          <Link
            href="/pilih-peran"
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-primary-deep active:scale-[0.97]"
          >
            Mulai Mutabaah <ArrowRight size={16} />
          </Link>
        </Card>

        <Card className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success-subtle text-primary">
            <Check size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Checklist Harian</p>
            <p className="text-sm text-muted">
              Catat shalat, tilawah, dzikir, sedekah, dan amalan lainnya.
            </p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success-subtle text-primary">
            <BookOpen size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Konten Edukasi</p>
            <p className="text-sm text-muted">
              Artikel dan pengingat untuk tumbuh bersama sebagai keluarga.
            </p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success-subtle text-primary">
            <Heart size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Fitur Lainnya</p>
            <p className="text-sm text-muted">
              Informasi dan kegiatan edukatif untuk keluarga. Lainnya menyusul.
            </p>
          </div>
        </Card>

        <p className="pt-2 text-center text-xs text-muted">
          Gratis selamanya. Cukup punya domain sendiri.
        </p>
      </div>
    </div>
  );
}
