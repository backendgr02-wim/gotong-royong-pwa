import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Users } from "lucide-react";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getMembers } from "@/lib/members";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AnggotaPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/anggota");

  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const members = await getMembers(komunitas.id);

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{komunitas.nama}</p>
            <h1 className="text-xl font-bold">Warga</h1>
          </div>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {members.length === 0 ? (
          <Card className="p-6 text-center">
            <Users size={32} className="mx-auto text-muted" />
            <p className="mt-2 font-semibold">Belum ada anggota</p>
            <p className="mt-1 text-sm text-muted">
              Anggota komunitas akan muncul di sini.
            </p>
          </Card>
        ) : (
          <div className="divide-y divide-outline rounded-xl border bg-surface">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-subtle text-sm font-bold text-primary">
                  {m.nama.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.nama}</p>
                  <p className="text-xs capitalize text-muted">{m.peran}</p>
                </div>
                {m.noHp && (
                  <a
                    href={`tel:${m.noHp}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-success-subtle text-primary"
                  >
                    <Phone size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted">
          {members.length} anggota aktif
        </p>
      </div>
    </div>
  );
}
