import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle, PenLine, Users } from "lucide-react";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Card } from "@/components/ui/card";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getFeed } from "@/lib/posts";
import { toggleSuka } from "@/actions/posts";

export const dynamic = "force-dynamic";

function inisial(nama: string): string {
  const p = nama.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function waktuSingkat(iso: string): string {
  const d = new Date(iso);
  const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const jam = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return `${tgl} · ${jam}`;
}

export default async function Komunitas() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/komunitas");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const feed = await getFeed(komunitas.id, user.id);

  return (
    <div>
      <ScreenHeader title="Komunitas" subtitle={komunitas.nama}>
        <Users size={22} />
      </ScreenHeader>

      <div className="space-y-3 p-4">
        {/* Tulis postingan */}
        <Link href="/komunitas/baru" className="block">
          <Card className="flex items-center gap-3 p-4 active:scale-[0.99]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              <PenLine size={16} />
            </span>
            <span className="text-sm text-muted">Tulis sesuatu untuk warga…</span>
          </Card>
        </Link>

        {feed.length > 0 ? (
          feed.map((p) => (
            <Card key={p.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-subtle text-xs font-bold text-primary">
                  {inisial(p.authorNama)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.authorNama}</p>
                  <p className="text-[11px] text-muted">{waktuSingkat(p.createdAt)}</p>
                </div>
              </div>

              <Link href={`/komunitas/${p.id}`} className="block space-y-2">
                <p className="whitespace-pre-line text-sm text-ink/90">{p.isi}</p>
                {p.fotoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.fotoUrl}
                    alt="Foto postingan"
                    className="w-full rounded-xl object-cover max-h-72 bg-gray-50"
                  />
                )}
              </Link>

              <div className="flex items-center gap-4 border-t border-outline pt-3">
                <form action={toggleSuka}>
                  <input type="hidden" name="postId" value={p.id} />
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      p.sayaSuka ? "text-primary" : "text-muted"
                    }`}
                  >
                    <Heart size={16} fill={p.sayaSuka ? "currentColor" : "none"} /> {p.suka}
                  </button>
                </form>
                <Link
                  href={`/komunitas/${p.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted"
                >
                  <MessageCircle size={16} /> {p.komentar}
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-muted">
              Belum ada postingan. Jadilah yang pertama berbagi untuk warga 🌱
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
