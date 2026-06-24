import { redirect } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Card } from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";
import { tandaiDibaca, tandaiSemuaDibaca } from "@/actions/notifications";

export const dynamic = "force-dynamic";

function waktu(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString(
    "id-ID",
    { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" },
  )}`;
}

export default async function Pesan() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/pesan");

  const items = await getNotifications(user.id);
  const adaBelumDibaca = items.some((n) => !n.dibaca);

  return (
    <div>
      <ScreenHeader title="Kotak Masuk" subtitle="Notifikasi & pemberitahuan" />
      <div className="space-y-3 p-4">
        {adaBelumDibaca && (
          <form action={tandaiSemuaDibaca}>
            <button
              type="submit"
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary"
            >
              <CheckCheck size={15} /> Tandai semua dibaca
            </button>
          </form>
        )}

        {items.length > 0 ? (
          items.map((n) => (
            <form key={n.id} action={tandaiDibaca}>
              <input type="hidden" name="notifId" value={n.id} />
              {n.link && <input type="hidden" name="link" value={n.link} />}
              <button
                type="submit"
                className={`flex w-full items-start gap-3 rounded-3xl p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition active:scale-[0.99] ${
                  n.dibaca ? "bg-surface" : "bg-success-subtle"
                }`}
              >
                <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <Bell size={16} />
                  {!n.dibaca && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-red-500" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{n.judul}</span>
                  {n.isi && <span className="block text-xs text-muted">{n.isi}</span>}
                  <span className="mt-0.5 block text-[10px] text-muted">{waktu(n.createdAt)}</span>
                </span>
              </button>
            </form>
          ))
        ) : (
          <Card>
            <p className="flex items-center gap-2 text-sm text-muted">
              <Bell size={16} /> Belum ada notifikasi. Kabar pengumuman &amp; status laporan akan muncul
              di sini.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
