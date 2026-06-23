"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center font-sans">
        <h1 className="text-4xl font-bold text-destructive">Terjadi Kesalahan</h1>
        <p className="max-w-md text-muted">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Muat Ulang
        </button>
      </body>
    </html>
  );
}
