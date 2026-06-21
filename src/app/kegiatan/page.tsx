import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Plus, Check, Users } from "lucide-react";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getUpcomingEvents } from "@/lib/events";
import { toggleRsvp } from "@/actions/events";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function jamKegiatan(iso: string): string {
  const d = new Date(iso);
  const tgl = d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const jam = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return `${tgl} · ${jam} WIB`;
}

export default async function KegiatanPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/kegiatan");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const events = await getUpcomingEvents(komunitas.id, user.id);
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
            <h1 className="text-xl font-bold">Kegiatan &amp; Kajian</h1>
          </div>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {isPengurus && (
          <Link href="/kegiatan/baru" className="block">
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99]">
              <Plus size={18} /> Buat Kegiatan
            </div>
          </Link>
        )}

        {events.length > 0 ? (
          events.map((e) => (
            <Card key={e.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-subtle text-primary">
                  <CalendarDays size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                      {e.jenis}
                    </span>
                  </div>
                  <p className="mt-1 font-bold">{e.judul}</p>
                  <p className="text-xs text-muted">{jamKegiatan(e.mulai)}</p>
                  {e.lokasi && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <MapPin size={12} /> {e.lokasi}
                    </p>
                  )}
                  {e.deskripsi && <p className="mt-2 text-sm text-ink/80">{e.deskripsi}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-outline pt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Users size={14} /> {e.peserta} hadir
                </span>
                <form action={toggleRsvp}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <button
                    type="submit"
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition active:scale-[0.98] ${
                      e.sayaHadir
                        ? "bg-success-subtle text-primary"
                        : "bg-primary text-white"
                    }`}
                  >
                    {e.sayaHadir ? (
                      <>
                        <Check size={14} strokeWidth={3} /> Hadir
                      </>
                    ) : (
                      "Saya Hadir"
                    )}
                  </button>
                </form>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-muted">
              Belum ada kegiatan terjadwal.
              {isPengurus
                ? " Tekan “Buat Kegiatan” untuk menambah."
                : " Nantikan info dari pengurus."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
