"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-emerald-50 px-4 text-center">
      <div className="flex size-24 items-center justify-center rounded-full bg-emerald-100">
        <svg className="size-12 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 0 1 0 12.728m-1.414-1.414a6 6 0 0 0 0-8.486m-1.414 1.414a3 3 0 0 1 0 4.243M5.636 18.364a9 9 0 0 1 0-12.728m0 0L3 3m0 0L.636.636M3 3l2.636 2.636M21 21l-2.636-2.636M3 3l18 18" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-emerald-900">Tidak Ada Koneksi</h1>
      <p className="max-w-xs text-emerald-700">
        Kamu sedang offline. Beberapa fitur mungkin tidak tersedia sampai koneksi kembali.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
      >
        Coba Lagi
      </button>
    </div>
  );
}
