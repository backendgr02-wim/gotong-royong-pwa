"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buatPost } from "@/actions/posts";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Form anggota menulis postingan (teks). Foto menyusul (sub-langkah Storage). */
export function BuatPostForm({ namaKomunitas }: { namaKomunitas: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(buatPost, null);

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/komunitas" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{namaKomunitas}</p>
            <h1 className="text-xl font-bold">Buat Postingan</h1>
          </div>
        </div>
      </header>

      <div className="p-4">
        <Card>
          <form action={action} className="space-y-4">
            {/* Honeypot anti-bot (disembunyikan dari manusia). */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="space-y-1">
              <label htmlFor="isi" className="block text-sm font-medium">
                Apa yang ingin kamu bagikan?
              </label>
              <textarea
                id="isi"
                name="isi"
                rows={5}
                required
                minLength={1}
                maxLength={2000}
                placeholder="Tulis cerita, info, atau ajakan untuk warga…"
                className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
              />
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Mengirim…" : "Bagikan"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
