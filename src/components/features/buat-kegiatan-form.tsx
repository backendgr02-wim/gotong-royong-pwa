"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buatKegiatan } from "@/actions/events";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary";

/** Form pengurus membuat kegiatan/kajian. */
export function BuatKegiatanForm({
  defaultMulai,
  namaKomunitas,
}: {
  defaultMulai: string;
  namaKomunitas: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(buatKegiatan, null);

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/kegiatan" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{namaKomunitas}</p>
            <h1 className="text-xl font-bold">Buat Kegiatan</h1>
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
                placeholder="contoh: Kerja Bakti Minggu Pagi"
                className={inputCls}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="jenis" className="block text-sm font-medium">
                Jenis
              </label>
              <select id="jenis" name="jenis" defaultValue="kegiatan" className={inputCls}>
                <option value="kegiatan">Kegiatan</option>
                <option value="kajian">Kajian</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="mulai" className="block text-sm font-medium">
                Waktu mulai
              </label>
              <input
                id="mulai"
                name="mulai"
                type="datetime-local"
                defaultValue={defaultMulai}
                required
                className={inputCls}
              />
              <p className="text-xs text-muted">Waktu mengikuti zona WIB (Asia/Jakarta).</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="lokasi" className="block text-sm font-medium">
                Lokasi <span className="text-muted">(opsional)</span>
              </label>
              <input
                id="lokasi"
                name="lokasi"
                type="text"
                maxLength={160}
                placeholder="contoh: Halaman Masjid Al-Ikhlas"
                className={inputCls}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="deskripsi" className="block text-sm font-medium">
                Keterangan <span className="text-muted">(opsional)</span>
              </label>
              <textarea
                id="deskripsi"
                name="deskripsi"
                rows={3}
                maxLength={1000}
                placeholder="Jelaskan kegiatan secara singkat…"
                className={inputCls}
              />
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan Kegiatan"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
