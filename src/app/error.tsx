"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-5xl">⚠️</span>
      <h1 className="text-xl font-bold text-ink">Gagal memuat halaman</h1>
      <p className="max-w-xs text-sm text-muted">
        {error.message || "Coba refresh atau kembali nanti."}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          Kembali
        </Button>
        <Button onClick={reset}>Muat Ulang</Button>
      </div>
    </div>
  );
}
