import { redirect } from "next/navigation";
import Link from "next/link";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Card } from "@/components/ui/card";
import { getUser, getActiveCommunity } from "@/lib/auth";
import {
  PenLine,
  HandCoins,
  MessageCircleQuestion,
  Megaphone,
  Wallet,
  FileText,
  CalendarPlus,
  CalendarDays,
  Users,
  BarChart3,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

// Halaman ber-auth → dinamis (Next 16).
export const dynamic = "force-dynamic";

type AksiItem = {
  label: string;
  desc: string;
  icon: LucideIcon;
  href: string;
  pengurusOnly?: boolean;
  primary?: boolean;
};

// Aksi yang sudah tersambung ke fitur nyata.
const aktif: AksiItem[] = [
  { label: "Catat Kas", desc: "Pemasukan / penyaluran", icon: Wallet, href: "/laporan-kas/baru", pengurusOnly: true, primary: true },
  { label: "Buat Kegiatan", desc: "Jadwalkan kegiatan / kajian", icon: CalendarPlus, href: "/kegiatan/baru", pengurusOnly: true, primary: true },
  { label: "Buat Pengumuman", desc: "Kabar untuk warga", icon: Megaphone, href: "/pengumuman/baru", pengurusOnly: true, primary: true },
  { label: "Buat Postingan", desc: "Bagikan cerita & ilmu", icon: PenLine, href: "/komunitas/baru", primary: true },
  { label: "Lapor RT/RW", desc: "Laporkan masalah lingkungan", icon: Megaphone, href: "/lapor/baru", primary: true },
  { label: "Donasi Cepat", desc: "Sedekah untuk sesama", icon: HandCoins, href: "/donasi/baru", primary: true },
  { label: "Riwayat Donasi", desc: "Donasi & iuran saya", icon: HandCoins, href: "/donasi" },
  { label: "Lihat Laporan Kas", desc: "Transparansi keuangan", icon: FileText, href: "/laporan-kas" },
  { label: "Kegiatan & Kajian", desc: "Lihat & konfirmasi hadir", icon: CalendarDays, href: "/kegiatan" },
  { label: "Pengumuman", desc: "Info terbaru komunitas", icon: Megaphone, href: "/pengumuman" },
  { label: "Polling Warga", desc: "Beri suara & lihat hasil", icon: BarChart3, href: "/polling" },
  { label: "Feed Komunitas", desc: "Lihat postingan warga", icon: Users, href: "/komunitas" },
];

// Belum tersambung (disambungkan per milestone berikutnya).
const akanDatang: { label: string; desc: string; icon: LucideIcon }[] = [
  { label: "Tanya Ustadz", desc: "Konsultasi syariah", icon: MessageCircleQuestion },
];

export default async function BuatAksi() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/aksi");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");
  const isPengurus = komunitas.peran !== "warga";

  const tampil = aktif.filter((a) => isPengurus || !a.pengurusOnly);

  return (
    <div>
      <ScreenHeader title="Buat Aksi" subtitle="Apa yang ingin kamu lakukan?" />
      <div className="space-y-3 p-4">
        {tampil.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.label} href={a.href}>
              <Card className="flex items-center gap-4 p-4 active:scale-[0.99]">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    a.primary ? "bg-primary text-white" : "bg-success-subtle text-primary"
                  }`}
                >
                  <Icon size={22} />
                </span>
                <span className="flex-1">
                  <span className="block font-bold">{a.label}</span>
                  <span className="block text-xs text-muted">{a.desc}</span>
                </span>
                <ArrowRight size={18} className="text-muted" />
              </Card>
            </Link>
          );
        })}

        <p className="px-1 pt-2 text-xs font-semibold text-muted">Segera hadir</p>
        {akanDatang.map((a) => {
          const Icon = a.icon;
          return (
            <Card key={a.label} className="flex items-center gap-4 p-4 opacity-60">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-muted">
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-bold">{a.label}</span>
                <span className="block text-xs text-muted">{a.desc}</span>
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
