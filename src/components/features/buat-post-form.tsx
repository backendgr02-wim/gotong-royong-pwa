"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, X, Upload } from "lucide-react";
import { buatPost } from "@/actions/posts";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";

export function BuatPostForm({ namaKomunitas }: { namaKomunitas: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(buatPost, null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.ok) toast("success", state.message ?? "Info terkirim!");
    if (state?.error) toast("error", state.error);
  }, [state, toast]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    }
  }

  function hapusFile() {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/komunitas" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{namaKomunitas}</p>
            <h1 className="text-xl font-bold">Buat Info</h1>
          </div>
        </div>
      </header>

      <div className="p-4">
        <Card>
          <form action={action} className="space-y-4">
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <FormField label="Apa yang ingin kamu bagikan?">
              <textarea
                name="isi"
                rows={5}
                required
                minLength={1}
                maxLength={2000}
                placeholder="Tulis cerita, info, atau ajakan untuk warga…"
                className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
              />
            </FormField>

            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-outline px-4 py-8 text-sm text-muted hover:border-primary hover:text-primary">
                <Upload size={20} />
                {preview ? "Ganti foto" : "Tambahkan foto (opsional)"}
                <input
                  type="file"
                  name="foto"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile}
                />
              </label>

              {preview && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Pratinjau"
                    className="max-h-48 w-full rounded-xl object-contain bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={hapusFile}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Mengirim…" : "Bagikan"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
