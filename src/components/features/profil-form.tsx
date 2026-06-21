"use client";

import { useActionState } from "react";
import { simpanProfil } from "@/actions/profile";
import type { ActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary";

/** Form edit profil diri (nama, no HP). */
export function ProfilForm({
  defaultNama,
  defaultNoHp,
}: {
  defaultNama: string;
  defaultNoHp: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(simpanProfil, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="nama" className="block text-sm font-medium">
          Nama
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          required
          minLength={2}
          maxLength={80}
          defaultValue={defaultNama}
          className={inputCls}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="noHp" className="block text-sm font-medium">
          No HP <span className="text-muted">(opsional)</span>
        </label>
        <input
          id="noHp"
          name="noHp"
          type="tel"
          inputMode="tel"
          defaultValue={defaultNoHp}
          placeholder="08xxxxxxxxxx"
          className={inputCls}
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-primary-dark">{state.message}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan Profil"}
      </Button>
    </form>
  );
}
