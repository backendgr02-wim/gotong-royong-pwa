"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { catatKas } from "@/actions/kas";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export function CatatKasForm({
  defaultTanggal,
  namaKomunitas,
}: {
  defaultTanggal: string;
  namaKomunitas: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(catatKas, null);
  const [jenis, setJenis] = useState<"masuk" | "keluar">("masuk");
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) toast("error", state.error);
  }, [state, toast]);

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

            <FormField label="Nominal (Rp)">
              <input
                name="nominal"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                placeholder="contoh: 50000"
                className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
              />
            </FormField>

            <FormField label="Keterangan">
              <input
                name="keterangan"
                type="text"
                required
                minLength={3}
                maxLength={200}
                placeholder="contoh: Iuran warga RT 03 bulan Juni"
                className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
              />
            </FormField>

            <FormField label="Tanggal">
              <input
                name="tgl"
                type="date"
                defaultValue={defaultTanggal}
                required
                className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
              />
            </FormField>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan Catatan"}
            </Button>
            <p className="text-center text-xs text-muted">
              Setiap catatan otomatis disegel & tercatat demi transparansi.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
