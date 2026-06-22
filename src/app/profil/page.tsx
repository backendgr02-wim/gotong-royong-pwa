import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, ChevronRight, Building2, ShieldCheck, HandCoins } from "lucide-react";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getUser, getMemberships } from "@/lib/auth";
import { signOut } from "@/actions/auth";
import { ProfilForm } from "@/components/features/profil-form";
import { AvatarForm } from "@/components/features/avatar-form";

export const dynamic = "force-dynamic";

const PERAN_LABEL: Record<string, string> = {
  warga: "Warga",
  pengurus: "Pengurus",
  dkm: "DKM",
  admin: "Admin",
};

function inisial(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Membership = {
  id: string;
  peran: string;
  community: { id: string; nama: string; jenis: string; slug_publik: string } | null;
};

export default async function Profil() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/profil");

  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profiles")
    .select("nama, no_hp, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const rawMemberships = (await getMemberships()) as unknown as Membership[];
  const memberships = rawMemberships.map((m) => ({
    ...m,
    community: Array.isArray(m.community) ? m.community[0] : m.community,
  }));

  const nama = profil?.nama || user.email?.split("@")[0] || "Warga";
  const peranUtama = memberships[0]?.peran;

  return (
    <div>
      <ScreenHeader title="Profil" subtitle="Akun & aktivitas" />
      <div className="space-y-4 p-4">
        {/* Kartu profil + avatar */}
        <Card className="flex items-center gap-4">
          <div className="relative shrink-0">
            {profil?.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profil.avatar_url}
                alt={nama}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {inisial(nama)}
              </span>
            )}
            <AvatarForm />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{nama}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            {peranUtama && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success-subtle px-2 py-0.5 text-[10px] font-semibold text-primary">
                <ShieldCheck size={11} /> {PERAN_LABEL[peranUtama] ?? peranUtama}
              </span>
            )}
          </div>
        </Card>

        {/* Edit profil */}
        <Card>
          <h2 className="mb-3 font-bold">Edit Profil</h2>
          <ProfilForm defaultNama={profil?.nama ?? ""} defaultNoHp={profil?.no_hp ?? ""} />
        </Card>

        {/* Komunitas saya */}
        <Card>
          <h2 className="mb-2 font-bold">Komunitas Saya</h2>
          {memberships.length > 0 ? (
            <ul className="divide-y divide-outline">
              {memberships.map((m) =>
                m.community ? (
                  <li key={m.id}>
                    <Link
                      href={`/k/${m.community.slug_publik}`}
                      className="flex items-center gap-3 py-3 active:opacity-70"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-subtle text-primary">
                        <Building2 size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {m.community.nama}
                        </span>
                        <span className="block text-xs text-muted">
                          {m.community.jenis.toUpperCase()} · {PERAN_LABEL[m.peran] ?? m.peran}
                        </span>
                      </span>
                      <ChevronRight size={18} className="text-muted" />
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted">Belum tergabung di komunitas mana pun.</p>
          )}
        </Card>

        {/* Donasi Saya */}
        <Link
          href="/donasi?tab=saya"
          className="flex items-center gap-3 rounded-2xl border border-outline p-4 active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <HandCoins size={18} />
          </span>
          <span className="flex-1">
            <span className="block font-bold">Donasi Saya</span>
            <span className="block text-xs text-muted">Riwayat donasi &amp; iuran</span>
          </span>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        {/* Keluar */}
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-outline py-3 text-sm font-bold text-red-600 active:scale-[0.99]"
          >
            <LogOut size={18} /> Keluar
          </button>
        </form>
      </div>
    </div>
  );
}
