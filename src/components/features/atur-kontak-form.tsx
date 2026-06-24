"use client";

import { useActionState, useEffect } from "react";
import { ArrowLeft, Phone, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { tambahKontak, hapusKontak } from "@/actions/contacts";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type Contact = { id: string; nama: string; peran: string; noHp: string | null };

export function AturKontakForm({
  namaKomunitas,
  contacts,
}: {
  namaKomunitas: string;
  contacts: Contact[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(tambahKontak, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.ok) toast("success", state.message ?? "Kontak tersimpan!");
    if (state?.error) toast("error", state.error);
  }, [state, toast]);

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{namaKomunitas}</p>
            <h1 className="text-xl font-bold">Atur Kontak Penting</h1>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {/* Form tambah */}
        <Card className="p-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Plus size={18} className="text-primary" /> Tambah Kontak
          </h2>
          <form action={action} className="mt-3 space-y-3">
            <input
              name="nama"
              placeholder="Nama"
              required
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              name="peran"
              placeholder="Peran (mis: Ketua RT, Keamanan)"
              required
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              name="noHp"
              type="tel"
              placeholder="Nomor HP (opsional)"
              className="w-full rounded-xl border border-outline bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white active:scale-[0.99] disabled:opacity-50"
            >
              {pending ? "Menyimpan..." : "Simpan Kontak"}
            </button>
          </form>
        </Card>

        {/* Daftar kontak */}
        {contacts.length === 0 ? (
          <Card className="p-6 text-center">
            <Phone size={32} className="mx-auto text-muted" />
            <p className="mt-2 font-semibold">Belum ada kontak</p>
            <p className="mt-1 text-sm text-muted">
              Tambahkan kontak penting seperti ketua RT, keamanan, atau posko.
            </p>
          </Card>
        ) : (
          <div className="divide-y divide-outline rounded-xl border bg-surface">
            {contacts.map((k) => (
              <div key={k.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{k.nama}</p>
                  <p className="text-xs text-muted">{k.peran}</p>
                </div>
                <form action={hapusKontak}>
                  <input type="hidden" name="id" value={k.id} />
                  <button
                    type="submit"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
