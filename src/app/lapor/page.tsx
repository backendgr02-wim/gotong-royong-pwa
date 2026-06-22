import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, MapPin, Megaphone } from "lucide-react";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getReports, type LaporanStatus } from "@/lib/reports";
import { ubahStatusLapor } from "@/actions/reports";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<LaporanStatus, string> = {
  baru: "bg-amber-100 text-amber-700",
  diproses: "bg-blue-100 text-blue-700",
  selesai: "bg-success-subtle text-primary",
};
const STATUS_LABEL: Record<LaporanStatus, string> = {
  baru: "Baru",
  diproses: "Diproses",
  selesai: "Selesai",
};

function tglIndo(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default async function LaporList() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/lapor");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const reports = await getReports(komunitas.id);
  const isPengurus = komunitas.peran !== "warga";

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{komunitas.nama}</p>
            <h1 className="text-xl font-bold">Lapor RT/RW</h1>
          </div>
        </div>
      </header>

      <div className="space-y-3 p-4">
        <Link href="/lapor/baru" className="block">
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99]">
            <Plus size={18} /> Buat Laporan
          </div>
        </Link>

        {reports.length > 0 ? (
          reports.map((r) => (
            <Card key={r.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                  {r.kategori}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[r.status]}`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="text-sm text-ink/90">{r.deskripsi}</p>
              {r.fotoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={r.fotoUrl} alt="Foto laporan" className="w-full rounded-xl object-cover max-h-48 bg-gray-50" />
              )}
              <p className="text-[11px] text-muted">
                {r.pelaporNama} · {tglIndo(r.createdAt)}
                {r.lat != null && r.lng != null && (
                  <a
                    href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-0.5 text-primary"
                  >
                    <MapPin size={11} /> Lihat lokasi
                  </a>
                )}
              </p>

              {isPengurus && (
                <form action={ubahStatusLapor} className="flex items-center gap-2 border-t border-outline pt-2">
                  <input type="hidden" name="reportId" value={r.id} />
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="min-h-9 flex-1 rounded-xl border border-outline px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="baru">Baru</option>
                    <option value="diproses">Diproses</option>
                    <option value="selesai">Selesai</option>
                  </select>
                  <button
                    type="submit"
                    className="min-h-9 rounded-xl bg-primary px-4 text-xs font-bold text-white"
                  >
                    Ubah
                  </button>
                </form>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <p className="flex items-center gap-2 text-sm text-muted">
              <Megaphone size={16} /> Belum ada laporan. Tekan “Buat Laporan” untuk melapor.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
