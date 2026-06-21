"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { buatPolling } from "@/actions/polls";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary";

const MAKS_OPSI = 8;

/** Form pengurus membuat polling dengan opsi dinamis (2–8). */
export function PollForm({ namaKomunitas }: { namaKomunitas: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(buatPolling, null);
  const [opsi, setOpsi] = useState<string[]>(["", ""]);

  function ubahOpsi(i: number, v: string) {
    setOpsi((arr) => arr.map((o, idx) => (idx === i ? v : o)));
  }
  function tambahOpsi() {
    setOpsi((arr) => (arr.length < MAKS_OPSI ? [...arr, ""] : arr));
  }
  function hapusOpsi(i: number) {
    setOpsi((arr) => (arr.length > 2 ? arr.filter((_, idx) => idx !== i) : arr));
  }

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/polling" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{namaKomunitas}</p>
            <h1 className="text-xl font-bold">Buat Polling</h1>
          </div>
        </div>
      </header>

      <div className="p-4">
        <Card>
          <form action={action} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="pertanyaan" className="block text-sm font-medium">
                Pertanyaan
              </label>
              <input
                id="pertanyaan"
                name="pertanyaan"
                type="text"
                required
                minLength={3}
                maxLength={200}
                placeholder="contoh: Kapan kerja bakti bulan ini?"
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium">Pilihan (2–{MAKS_OPSI})</span>
              {opsi.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    name="opsi"
                    type="text"
                    value={o}
                    onChange={(e) => ubahOpsi(i, e.target.value)}
                    required
                    maxLength={100}
                    placeholder={`Pilihan ${i + 1}`}
                    className={inputCls}
                  />
                  {opsi.length > 2 && (
                    <button
                      type="button"
                      onClick={() => hapusOpsi(i)}
                      aria-label="Hapus pilihan"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-outline text-muted"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              {opsi.length < MAKS_OPSI && (
                <button
                  type="button"
                  onClick={tambahOpsi}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  <Plus size={16} /> Tambah pilihan
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="berakhir" className="block text-sm font-medium">
                Batas waktu <span className="text-muted">(opsional, WIB)</span>
              </label>
              <input id="berakhir" name="berakhir" type="datetime-local" className={inputCls} />
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Menyimpan…" : "Terbitkan Polling"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
