"use client";

import { useActionState, useState } from "react";
import { createCommunity, joinCommunity } from "@/actions/community";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Community = { id: string; nama: string; jenis: string; kelurahan: string | null };

export function OnboardingClient({ communities }: { communities: Community[] }) {
  const [mode, setMode] = useState<"gabung" | "buat">("gabung");
  const [joinState, joinAction, joinPending] = useActionState<ActionState, FormData>(
    joinCommunity,
    null,
  );
  const [createState, createAction, createPending] = useActionState<ActionState, FormData>(
    createCommunity,
    null,
  );

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <h1 className="text-xl font-bold text-primary-deep">Selamat datang 👋</h1>
      <p className="mt-1 text-sm text-muted">Pilih atau buat komunitas (RT/RW/Masjid) kamu.</p>

      <div className="mt-5 flex gap-2 rounded-2xl bg-gray-100 p-1">
        <button
          onClick={() => setMode("gabung")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold ${mode === "gabung" ? "bg-surface text-primary shadow-sm" : "text-muted"}`}
        >
          Gabung
        </button>
        <button
          onClick={() => setMode("buat")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold ${mode === "buat" ? "bg-surface text-primary shadow-sm" : "text-muted"}`}
        >
          Buat Baru
        </button>
      </div>

      {mode === "gabung" ? (
        <div className="mt-4 space-y-3">
          {communities.length === 0 && (
            <p className="text-sm text-muted">
              Belum ada komunitas. Buat yang pertama lewat tab “Buat Baru”.
            </p>
          )}
          {communities.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{c.nama}</p>
                <p className="text-xs text-muted">
                  {c.jenis.toUpperCase()}
                  {c.kelurahan ? ` · ${c.kelurahan}` : ""}
                </p>
              </div>
              <form action={joinAction}>
                <input type="hidden" name="communityId" value={c.id} />
                <Button type="submit" disabled={joinPending} className="min-h-10 px-4 text-xs">
                  Gabung
                </Button>
              </form>
            </Card>
          ))}
          {joinState?.error && <p className="text-sm text-red-600">{joinState.error}</p>}
        </div>
      ) : (
        <Card className="mt-4">
          <form action={createAction} className="space-y-3">
            <input
              name="nama"
              required
              placeholder="Nama komunitas (mis. RT 05 / Masjid Al-Ikhlas)"
              className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
            />
            <select
              name="jenis"
              className="w-full rounded-2xl border border-outline px-4 py-3 text-base"
              defaultValue="rt"
            >
              <option value="rt">RT</option>
              <option value="rw">RW</option>
              <option value="masjid">Masjid</option>
            </select>
            <input
              name="kelurahan"
              placeholder="Kelurahan (opsional)"
              className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
            />
            <textarea
              name="deskripsi"
              rows={3}
              placeholder="Deskripsi singkat (opsional)"
              className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
            />
            {createState?.error && <p className="text-sm text-red-600">{createState.error}</p>}
            <Button type="submit" disabled={createPending} className="w-full">
              {createPending ? "Membuat…" : "Buat Komunitas (saya jadi pengurus)"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
