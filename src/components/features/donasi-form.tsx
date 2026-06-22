"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, HandCoins, Upload, X } from "lucide-react";
import { buatDonasi } from "@/actions/donations";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary";

export function DonasiForm({ namaKomunitas, rekening }: { namaKomunitas: string; rekening: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(buatDonasi, null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) { setPreview(null); setFileName(null); return; }
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  function hapusFile() {
    setPreview(null);
    setFileName(null);
    const el = document.getElementById("bukti-input") as HTMLInputElement;
    if (el) el.value = "";
  }

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/donasi" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{namaKomunitas}</p>
            <h1 className="text-xl font-bold">Donasi Cepat</h1>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {rekening && (
          <Card className="border border-primary/30 bg-success-subtle">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <HandCoins size={16} />
              </span>
              <div>
                <p className="text-xs font-semibold text-primary">Transfer ke rekening:</p>
                <p className="font-bold text-ink">{rekening}</p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <form action={action} className="space-y-4">
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="space-y-1">
              <label htmlFor="jenis" className="block text-sm font-medium">
                Jenis
              </label>
              <select id="jenis" name="jenis" className={inputCls}>
                <option value="donasi">Donasi</option>
                <option value="iuran">Iuran</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="nominal" className="block text-sm font-medium">
                Nominal (Rp)
              </label>
              <input
                id="nominal"
                name="nominal"
                type="number"
                min={1}
                required
                placeholder="50000"
                className={inputCls}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="periode" className="block text-sm font-medium">
                Periode (untuk iuran, opsional)
              </label>
              <input id="periode" name="periode" type="month" className={inputCls} />
            </div>

            <div className="space-y-1">
              <label htmlFor="bukti-input" className="block text-sm font-medium">
                Foto Bukti Transfer
              </label>
              {preview ? (
                <div className="relative overflow-hidden rounded-2xl border border-outline">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Pratinjau bukti transfer"
                    className="max-h-48 w-full object-contain bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={hapusFile}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                    aria-label="Hapus file"
                  >
                    <X size={14} />
                  </button>
                  <p className="truncate px-3 py-1.5 text-xs text-muted bg-white">{fileName}</p>
                </div>
              ) : (
                <label
                  htmlFor="bukti-input"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-outline py-6 text-muted hover:border-primary hover:text-primary transition"
                >
                  <Upload size={24} />
                  <span className="text-sm font-medium">Tap untuk upload foto</span>
                  <span className="text-[11px]">Maks 5 MB, format gambar</span>
                </label>
              )}
              <input
                id="bukti-input"
                name="bukti"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Mengirim…" : "Kirim Donasi"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted">
          Setelah transfer, data donasi akan menunggu verifikasi pengurus.
        </p>
      </div>
    </div>
  );
}
