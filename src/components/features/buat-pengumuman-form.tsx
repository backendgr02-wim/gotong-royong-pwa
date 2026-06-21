"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Pin } from "lucide-react";
import { buatPengumuman } from "@/actions/announcements";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary";

/** Form pengurus membuat pengumuman (opsional disematkan = tampil publik & jadi Kartu Unggulan). */
export function BuatPengumumanForm({ namaKomunitas }: { namaKomunitas: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(buatPengumuman, null);

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/pengumuman" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{namaKomunitas}</p>
            <h1 className="text-xl font-bold">Buat Pengumuman</h1>
          </div>
        </div>
      </header>

      <div className="p-4">
        <Card>
          <form action={action} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="judul" className="block text-sm font-medium">
                Judul
              </label>
              <input
                id="judul"
                name="judul"
                type="text"
                required
                minLength={3}
                maxLength={120}
                placeholder="contoh: Jadwal Ronda Malam Pekan Ini"
                className={inputCls}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="isi" className="block text-sm font-medium">
                Isi
              </label>
              <textarea
                id="isi"
                name="isi"
                rows={5}
                required
                minLength={3}
                maxLength={2000}
                placeholder="Tulis isi pengumuman…"
                className={inputCls}
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-outline px-4 py-3">
              <input type="checkbox" name="pinned" value="on" className="h-5 w-5 accent-[var(--color-primary)]" />
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Pin size={15} className="text-primary" /> Sematkan (tampil di Beranda &amp; halaman publik)
              </span>
            </label>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Menyimpan…" : "Terbitkan Pengumuman"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
