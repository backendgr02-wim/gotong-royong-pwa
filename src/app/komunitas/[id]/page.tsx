import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, MessageCircle, Trash2 } from "lucide-react";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getPost } from "@/lib/posts";
import { toggleSuka, hapusPost } from "@/actions/posts";
import { Card } from "@/components/ui/card";
import { KomentarForm } from "@/components/features/komentar-form";

export const dynamic = "force-dynamic";

function inisial(nama: string): string {
  const p = nama.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[p.length - 1]![0]!).toUpperCase();
}

function waktu(iso: string): string {
  const d = new Date(iso);
  const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const jam = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return `${tgl} · ${jam}`;
}

export default async function DetailPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/masuk?redirect=/komunitas/${id}`);
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const data = await getPost(id, user.id);
  if (!data) notFound();
  const { post, komentar } = data;

  const bolehHapus = post.authorId === user.id || komunitas.peran !== "warga";

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/komunitas" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-xl font-bold">Info Warga</h1>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {/* Info Warga */}
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-subtle text-sm font-bold text-primary">
              {inisial(post.authorNama)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{post.authorNama}</p>
              <p className="text-[11px] text-muted">{waktu(post.createdAt)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="whitespace-pre-line text-sm text-ink/90">{post.isi}</p>
            {post.fotoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={post.fotoUrl}
                alt="Foto postingan"
                className="w-full rounded-xl object-cover max-h-96 bg-gray-50"
              />
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-outline pt-3">
            <form action={toggleSuka}>
              <input type="hidden" name="postId" value={post.id} />
              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  post.sayaSuka ? "text-primary" : "text-muted"
                }`}
              >
                <Heart size={16} fill={post.sayaSuka ? "currentColor" : "none"} /> {post.suka}
              </button>
            </form>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
              <MessageCircle size={16} /> {post.komentar}
            </span>
            {bolehHapus && (
              <form action={hapusPost} className="ml-auto">
                <input type="hidden" name="postId" value={post.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
                >
                  <Trash2 size={15} /> Hapus
                </button>
              </form>
            )}
          </div>
        </Card>

        {/* Komentar */}
        <Card className="space-y-4">
          <h2 className="font-bold">Komentar ({post.komentar})</h2>

          <KomentarForm postId={post.id} />

          {komentar.length > 0 ? (
            <ul className="space-y-3">
              {komentar.map((k) => (
                <li key={k.id} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-muted">
                    {inisial(k.authorNama)}
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl bg-bg px-3 py-2">
                    <p className="text-xs font-semibold">{k.authorNama}</p>
                    <p className="whitespace-pre-line text-sm text-ink/90">{k.isi}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{waktu(k.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Belum ada komentar. Jadilah yang pertama.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
