"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { cekKeaslian, type KeaslianState } from "@/actions/kas";
import { Button } from "@/components/ui/button";

/** Tombol "Cek Keaslian" — memverifikasi segel rantai-hash kas (anti utak-atik). */
export function CekKeaslian() {
  const [state, setState] = useState<KeaslianState>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="no-print">
      <Button
        type="button"
        variant="ghost"
        disabled={pending}
        className="w-full"
        onClick={() => startTransition(async () => setState(await cekKeaslian()))}
      >
        <ShieldCheck size={16} /> {pending ? "Memeriksa…" : "Cek Keaslian Catatan Kas"}
      </Button>
      {state?.message && (
        <p className={`mt-2 text-center text-xs ${state.ok ? "text-primary-dark" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}
