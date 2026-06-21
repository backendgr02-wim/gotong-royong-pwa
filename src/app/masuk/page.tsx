"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Bungkus content biar bisa pakai useSearchParams tanpa error di prerender. */
export default function Masuk() {
  return (
    <Suspense fallback={<div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center p-6" />}>
      <MasukContent />
    </Suspense>
  );
}

function MasukContent() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(signIn, null);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-primary-deep">Gotong Royong</h1>
        <p className="mt-1 text-sm text-muted">Masuk untuk bergabung dengan komunitasmu</p>
      </div>

      <Card>
        {state?.ok ? (
          <p className="text-sm text-primary-dark">{state.message}</p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                required
                placeholder="nama@email.com"
                className="w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary"
              />
            </div>
            {(state?.error || errorParam) && (
              <p className="text-sm text-red-600">
                {state?.error ??
                  (errorParam === "auth"
                    ? "Gagal masuk: tautan tidak valid atau kedaluwarsa. Coba lagi."
                    : "Terjadi kesalahan. Coba lagi.")}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Mengirim…" : "Kirim Tautan Masuk"}
            </Button>
            <p className="text-center text-xs text-muted">
              Tanpa kata sandi — kami kirim tautan masuk ke email kamu.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
