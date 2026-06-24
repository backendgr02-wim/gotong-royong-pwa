import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getKasSummary, getKasEntries } from "@/lib/kas";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PrintButton } from "@/components/features/print-button";
import { CekKeaslian } from "@/components/features/cek-keaslian";

// Halaman ber-auth & ber-data → wajib dinamis (Next 16).
export const dynamic = "force-dynamic";

function tglIndo(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function labelBulan(bulan: string): string {
  const [y, m] = bulan.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

export default async function LaporanKas({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/laporan-kas");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const { bulan } = await searchParams;
  const filterBulan = bulan && /^\d{4}-\d{2}$/.test(bulan) ? bulan : undefined;

  const summary = await getKasSummary(komunitas.id);
  const entries = await getKasEntries(komunitas.id, { bulan: filterBulan });

  // Nama pencatat (RLS profiles: sesama anggota komunitas boleh dibaca).
  const ids = [...new Set(entries.map((e) => e.dibuatOleh).filter((x): x is string => !!x))];
  const namaById = new Map<string, string>();
  if (ids.length) {
    const supabase = await createClient();
    const { data: profs } = await supabase.from("profiles").select("id, nama").in("id", ids);
    for (const p of profs ?? []) namaById.set(p.id, p.nama);
  }

  const isPengurus = komunitas.peran !== "warga";

  return (
    <div>
      {/* Header */}
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white print-plain">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Kembali" className="-ml-1 p-1 no-print">
              <ArrowLeft size={22} />
            </Link>
            <div>
              <p className="text-xs text-white/70">{komunitas.nama}</p>
              <h1 className="text-xl font-bold">Laporan Kas Komunitas</h1>
            </div>
          </div>
          <PrintButton className="no-print h-10 bg-white/15 px-3 text-white hover:bg-white/25" />
        </div>
      </header>

      <div className="space-y-4 p-4">
        {/* Ringkasan */}
        <Card className="bg-finance text-white print-plain">
          <p className="text-[10px] font-medium tracking-wide text-white/70">
            RINGKASAN KAS · {komunitas.nama.toUpperCase()}
          </p>
          <p className="mt-1 text-3xl font-bold">{formatRupiah(summary.saldo)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="flex items-center gap-1 text-[10px] text-white/70">
                <TrendingUp size={12} /> Pemasukan
              </p>
              <p className="font-bold">{formatRupiah(summary.masuk)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="flex items-center gap-1 text-[10px] text-white/70">
                <TrendingDown size={12} /> Disalurkan
              </p>
              <p className="font-bold">{formatRupiah(summary.keluar)}</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-white/60">
            {summary.jumlah > 0
              ? `Update terakhir: ${summary.updateTerakhir ? tglIndo(summary.updateTerakhir) : "—"} · ${summary.jumlah} catatan`
              : "Belum ada catatan kas."}
          </p>
        </Card>

        {/* Aksi pengurus */}
        {isPengurus && (
          <Link href="/laporan-kas/baru" className="no-print block">
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99]">
              <Plus size={18} /> Catat Kas Komunitas
            </div>
          </Link>
        )}

        {/* Filter bulan */}
        <form className="no-print flex items-end gap-2" action="/laporan-kas">
          <div className="flex-1 space-y-1">
            <label htmlFor="bulan" className="block text-xs font-medium text-muted">
              Saring per bulan
            </label>
            <input
              id="bulan"
              name="bulan"
              type="month"
              defaultValue={filterBulan ?? ""}
              className="w-full rounded-2xl border border-outline px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="min-h-11 rounded-2xl border border-outline px-4 text-sm font-semibold text-ink"
          >
            Saring
          </button>
          {filterBulan && (
            <Link
              href="/laporan-kas"
              className="flex min-h-11 items-center rounded-2xl px-3 text-sm font-semibold text-primary"
            >
              Semua
            </Link>
          )}
        </form>

        {/* Daftar transaksi */}
        <Card className="print-plain">
          <h2 className="font-bold">
            Rincian Transaksi
            {filterBulan && <span className="text-muted"> · {labelBulan(filterBulan)}</span>}
          </h2>
          {entries.length > 0 ? (
            <ul className="mt-3 divide-y divide-outline">
              {entries.map((e) => {
                const masuk = e.jenis === "masuk";
                return (
                  <li key={e.id} className="flex items-start gap-3 py-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        masuk ? "bg-success-subtle text-primary" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {masuk ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{e.keterangan}</p>
                      <p className="text-xs text-muted">
                        {tglIndo(e.tgl)}
                        {e.dibuatOleh && namaById.get(e.dibuatOleh)
                          ? ` · oleh ${namaById.get(e.dibuatOleh)}`
                          : ""}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold ${masuk ? "text-primary" : "text-red-600"}`}
                    >
                      {masuk ? "+" : "−"}
                      {formatRupiah(e.nominal)}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {filterBulan
                ? "Tidak ada catatan kas pada bulan ini."
                : "Belum ada catatan kas. Pengurus dapat menambah lewat tombol Catat Kas."}
            </p>
          )}
        </Card>

        {/* Verifikasi keaslian */}
        {summary.jumlah > 0 && <CekKeaslian />}

        <p className="pt-2 text-center text-xs text-muted">
          Setiap catatan kas disegel otomatis (rantai-hash) &amp; tercatat siapa/kapan demi
          transparansi.
        </p>
      </div>
    </div>
  );
}
