"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { catatKas } from "@/actions/kas";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Form pengurus mencatat satu transaksi kas (pemasukan/penyaluran). */
export function CatatKasForm({
  defaultTanggal,
  namaKomunitas,
}: {
  defaultTanggal: string;
  namaKomunitas: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(catatKas, null);
  const [jenis, setJenis] = useState<"masuk" | "keluar">("masuk");

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/laporan-kas" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{namaKomunitas}</p>
            <h1 className="text-xl font-bold">Catat Kas</h1>
          </div>
        </div>
      </header>

      <div className="p-4">
        <Card>
          <form action={action} className="space-y-4">
            <input type="hidden" name="jenis" value={jenis} />

            {/* Pilih jenis */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setJenis("masuk")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold transition",
                  jenis === "masuk"
                    ? "border-primary bg-success-subtle text-primary"
                    : "border-outline text-muted",
                )}
              >
                <TrendingUp size={16} /> Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setJenis("keluar")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold transition",
                  jenis === "keluar"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-outline text-muted",
                )}
              >
                <TrendingDown size={16} /> Penyaluran
              </button>
            </div>

            <div className="space-y-1">
              <label htmlFor="nominal" className="block text-sm font-medium">
                Nominal (Rp)
              </label>
              <input
                id="nominal"
                name="nominal"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                placeholder="contoh: 50000"
                className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="keterangan" className="block text-sm font-medium">
                Keterangan
              </label>
              <input
                id="keterangan"
                name="keterangan"
                type="text"
                required
                minLength={3}
                maxLength={200}
                placeholder="contoh: Iuran warga RT 03 bulan Juni"
                className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="tgl" className="block text-sm font-medium">
                Tanggal
              </label>
              <input
                id="tgl"
                name="tgl"
                type="date"
                defaultValue={defaultTanggal}
                required
                className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
              />
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan Catatan"}
            </Button>
            <p className="text-center text-xs text-muted">
              Setiap catatan otomatis disegel & tercatat (siapa &amp; kapan) demi transparansi.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
