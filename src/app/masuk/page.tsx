"use client";

import { useActionState, useTransition, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signInWithGoogle, type ActionState } from "@/actions/auth";
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
  const [googlePending, startGoogle] = useTransition();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  function handleGoogle() {
    setGoogleError(null);
    startGoogle(async () => {
      const result = await signInWithGoogle();
      if (result?.url) {
        window.location.href = result.url;
      } else if (result?.error) {
        setGoogleError(result.error);
      }
    });
  }

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
          <div className="space-y-5">
            <Button
              variant="outline"
              className="flex w-full items-center justify-center gap-3"
              disabled={googlePending}
              onClick={handleGoogle}
            >
              <GoogleIcon />
              {googlePending ? "Memproses…" : "Lanjutkan dengan Google"}
            </Button>

            <div className="flex items-center gap-3">
              <hr className="flex-1 border-outline" />
              <span className="text-xs text-muted">atau</span>
              <hr className="flex-1 border-outline" />
            </div>

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
              {(state?.error || googleError || errorParam) && (
                <p className="text-sm text-red-600">
                  {(state?.error ?? googleError) ??
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
          </div>
        )}
      </Card>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
