import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone, Pin, Plus } from "lucide-react";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getAnnouncements } from "@/lib/announcements";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function tglIndo(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function PengumumanPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/pengumuman");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const items = await getAnnouncements(komunitas.id);
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
            <h1 className="text-xl font-bold">Pengumuman</h1>
          </div>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {isPengurus && (
          <Link href="/pengumuman/baru" className="block">
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99]">
              <Plus size={18} /> Buat Pengumuman
            </div>
          </Link>
        )}

        {items.length > 0 ? (
          items.map((a) => (
            <Card key={a.id} className={a.pinned ? "border border-primary/30 bg-success-subtle" : ""}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold">{a.judul}</h2>
                {a.pinned && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Pin size={11} /> Disematkan
                  </span>
                )}
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-ink/80">{a.isi}</p>
              <p className="mt-2 text-[11px] text-muted">{tglIndo(a.createdAt)}</p>
            </Card>
          ))
        ) : (
          <Card>
            <p className="flex items-center gap-2 text-sm text-muted">
              <Megaphone size={16} /> Belum ada pengumuman.
              {isPengurus ? " Tekan “Buat Pengumuman”." : " Nantikan info dari pengurus."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
