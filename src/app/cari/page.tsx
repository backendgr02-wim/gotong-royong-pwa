import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, FileText, CalendarDays, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser, getActiveCommunity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CariPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/cari");

  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const { q } = await searchParams;
  if (!q || !q.trim()) {
    return (
      <div className="p-4">
        <Link
          href="/"
          className="mb-4 flex items-center gap-1 text-sm text-muted"
        >
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div className="mt-20 text-center text-muted">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>Ketik kata kunci untuk mencari</p>
        </div>
      </div>
    );
  }

  const query = q.trim().slice(0, 200);
  const safe = query.replace(/[%_\\]/g, "\\$&");

  const [postRes, eventRes, pengumumanRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id, judul, konten, created_at")
      .eq("community_id", komunitas.id)
      .or(`judul.ilike.%${safe}%,konten.ilike.%${safe}%`)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("events")
      .select("id, title, tanggal_mulai, lokasi")
      .eq("community_id", komunitas.id)
      .or(`title.ilike.%${safe}%,deskripsi.ilike.%${safe}%`)
      .order("tanggal_mulai", { ascending: false })
      .limit(10),
    supabase
      .from("announcements")
      .select("id, judul, isi, created_at")
      .eq("community_id", komunitas.id)
      .or(`judul.ilike.%${safe}%,isi.ilike.%${safe}%`)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const posts = postRes.data ?? [];
  const events = eventRes.data ?? [];
  const pengumuman = pengumumanRes.data ?? [];
  const total = posts.length + events.length + pengumuman.length;

  return (
    <div className="p-4">
      <Link href="/" className="mb-4 flex items-center gap-1 text-sm text-muted">
        <ArrowLeft size={16} /> Kembali
      </Link>

      <p className="mb-4 text-sm text-muted">
        Hasil untuk &quot;<strong>{query}</strong>&quot;{total > 0 && ` (${total})`}
      </p>

      {total === 0 && (
        <div className="mt-20 text-center text-muted">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>Tidak ditemukan untuk &quot;{query}&quot;</p>
        </div>
      )}

      {pengumuman.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <Megaphone size={14} /> Pengumuman
          </h2>
          <div className="space-y-2">
            {pengumuman.map((p) => (
              <Link
                key={p.id}
                href="/pengumuman"
                className="block rounded-xl border p-3 active:scale-[0.99]"
              >
                <p className="font-semibold">{p.judul}</p>
                <p className="line-clamp-2 text-xs text-muted">{p.isi}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <FileText size={14} /> Info Warga
          </h2>
          <div className="space-y-2">
            {posts.map((p) => (
              <Link
                key={p.id}
                href="/"
                className="block rounded-xl border p-3 active:scale-[0.99]"
              >
                <p className="font-semibold">{p.judul}</p>
                <p className="line-clamp-2 text-xs text-muted">{p.konten}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <CalendarDays size={14} /> Kegiatan
          </h2>
          <div className="space-y-2">
            {events.map((e) => (
              <Link
                key={e.id}
                href="/"
                className="block rounded-xl border p-3 active:scale-[0.99]"
              >
                <p className="font-semibold">{e.title}</p>
                <p className="text-xs text-muted">
                  {e.lokasi && `${e.lokasi} · `}
                  {new Date(e.tanggal_mulai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
