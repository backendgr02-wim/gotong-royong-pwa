import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, HandCoins, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getDonations, getDonationsSaya, getDonasiSummary, type DonasiStatus } from "@/lib/donations";
import { verifikasiDonasiAction as verifikasiDonasi } from "@/actions/donations";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<DonasiStatus, string> = {
  menunggu: "bg-amber-100 text-amber-700",
  terverifikasi: "bg-success-subtle text-primary",
  ditolak: "bg-red-100 text-red-600",
};
const STATUS_ICON: Record<DonasiStatus, typeof Clock> = {
  menunggu: Clock,
  terverifikasi: CheckCircle2,
  ditolak: XCircle,
};
const STATUS_LABEL: Record<DonasiStatus, string> = {
  menunggu: "Menunggu",
  terverifikasi: "Terverifikasi",
  ditolak: "Ditolak",
};

function tglIndo(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DonasiPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/donasi");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const isPengurus = komunitas.peran !== "warga";
  const params = await searchParams;
  const tab = params.tab ?? "semua";

  const summary = await getDonasiSummary(komunitas.id);

  let donations: Awaited<ReturnType<typeof getDonations>>;
  if (isPengurus && tab === "semua") {
    donations = await getDonations(komunitas.id);
  } else {
    donations = await getDonationsSaya(user.id, komunitas.id);
  }

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex-1">
            <p className="text-xs text-white/70">{komunitas.nama}</p>
            <h1 className="text-xl font-bold">Donasi & Iuran</h1>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <Card className="bg-finance text-white">
          <p className="text-[10px] font-medium tracking-wide text-white/70">
            TOTAL DONASI & IURAN
          </p>
          <p className="mt-1 text-3xl font-bold">{formatRupiah(summary.totalNominal)}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/10 p-2.5 text-center">
              <p className="text-[10px] text-white/70">Donasi</p>
              <p className="text-sm font-bold">{formatRupiah(summary.totalDonasi)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-2.5 text-center">
              <p className="text-[10px] text-white/70">Iuran</p>
              <p className="text-sm font-bold">{formatRupiah(summary.totalIuran)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-2.5 text-center">
              <p className="text-[10px] text-white/70">Menunggu</p>
              <p className="text-sm font-bold">{summary.menunggu}</p>
            </div>
          </div>
        </Card>

        <Link
          href="/donasi/baru"
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99]"
        >
          <Plus size={18} /> Donasi Sekarang
        </Link>

        {isPengurus && (
          <div className="flex gap-2 rounded-2xl bg-gray-100 p-1">
            <Link
              href="/donasi?tab=semua"
              className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold ${
                tab === "semua" ? "bg-white text-ink shadow-sm" : "text-muted"
              }`}
            >
              Semua
            </Link>
            <Link
              href="/donasi?tab=saya"
              className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold ${
                tab === "saya" ? "bg-white text-ink shadow-sm" : "text-muted"
              }`}
            >
              Donasi Saya
            </Link>
          </div>
        )}

        {donations.length > 0 ? (
          donations.map((d) => {
            const StatusIcon = STATUS_ICON[d.status];
            return (
              <Card key={d.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                      {d.jenis}
                    </span>
                    {d.periode && (
                      <span className="text-[11px] text-muted">{d.periode}</span>
                    )}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[d.status]}`}
                  >
                    <StatusIcon size={11} />
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{formatRupiah(d.nominal)}</span>
                  {isPengurus && d.donaturNama && tab === "semua" && (
                    <span className="text-xs text-muted">{d.donaturNama}</span>
                  )}
                </div>

                <p className="text-[11px] text-muted">{tglIndo(d.createdAt)}</p>

                {d.catatan && (
                  <p className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-muted">
                    {d.catatan}
                  </p>
                )}

                {isPengurus && d.status === "menunggu" && (
                  <form action={verifikasiDonasi} className="flex items-center gap-2 border-t border-outline pt-2">
                    <input type="hidden" name="donationId" value={d.id} />
                    <input type="hidden" name="status" value="terverifikasi" />
                    <button
                      type="submit"
                      className="min-h-9 flex-1 rounded-xl bg-primary text-xs font-bold text-white"
                    >
                      Verifikasi
                    </button>
                  </form>
                )}

                {isPengurus && d.status === "menunggu" && (
                  <form action={verifikasiDonasi} className="flex items-center gap-2">
                    <input type="hidden" name="donationId" value={d.id} />
                    <input type="hidden" name="status" value="ditolak" />
                    <input
                      type="text"
                      name="catatan"
                      placeholder="Alasan ditolak (opsional)"
                      className="min-h-9 flex-1 rounded-xl border border-outline px-3 text-xs outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      className="min-h-9 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600"
                    >
                      Tolak
                    </button>
                  </form>
                )}
              </Card>
            );
          })
        ) : (
          <Card>
            <p className="flex items-center gap-2 text-sm text-muted">
              <HandCoins size={16} /> Belum ada donasi. Tekan &ldquo;Donasi Sekarang&rdquo; untuk mulai.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
