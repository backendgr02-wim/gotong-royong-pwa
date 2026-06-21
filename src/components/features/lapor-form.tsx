"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Check, Loader2 } from "lucide-react";
import { buatLapor } from "@/actions/reports";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-2xl border border-outline px-4 py-3 text-base outline-none focus:border-primary";

const KATEGORI = ["Kebersihan", "Keamanan", "Jalan/Infrastruktur", "Fasilitas Umum", "Lainnya"];

/** Form anggota membuat laporan RT/RW. Lokasi GPS opsional via izin perangkat. */
export function LaporForm({ namaKomunitas }: { namaKomunitas: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(buatLapor, null);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "error">("idle");

  function ambilLokasi() {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("idle");
      },
      () => setLocStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/lapor" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{namaKomunitas}</p>
            <h1 className="text-xl font-bold">Lapor RT/RW</h1>
          </div>
        </div>
      </header>

      <div className="p-4">
        <Card>
          <form action={action} className="space-y-4">
            {/* Honeypot */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {/* Lokasi (hidden inputs terisi saat ambil lokasi) */}
            {loc && <input type="hidden" name="lat" value={loc.lat} />}
            {loc && <input type="hidden" name="lng" value={loc.lng} />}

            <div className="space-y-1">
              <label htmlFor="kategori" className="block text-sm font-medium">
                Kategori
              </label>
              <select id="kategori" name="kategori" defaultValue={KATEGORI[0]} className={inputCls}>
                {KATEGORI.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="deskripsi" className="block text-sm font-medium">
                Deskripsi masalah
              </label>
              <textarea
                id="deskripsi"
                name="deskripsi"
                rows={4}
                required
                minLength={5}
                maxLength={1000}
                placeholder="Jelaskan masalahnya (mis. lampu jalan mati di depan No. 12)…"
                className={inputCls}
              />
            </div>

            <div className="space-y-1">
              <span className="block text-sm font-medium">Lokasi (opsional)</span>
              <button
                type="button"
                onClick={ambilLokasi}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-outline px-4 text-sm font-semibold"
              >
                {locStatus === "loading" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : loc ? (
                  <Check size={16} className="text-primary" />
                ) : (
                  <MapPin size={16} className="text-primary" />
                )}
                {loc ? "Lokasi terlampir" : "Ambil Lokasi Saya"}
              </button>
              {locStatus === "error" && (
                <p className="text-xs text-red-600">Gagal mengambil lokasi (izin ditolak).</p>
              )}
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Mengirim…" : "Kirim Laporan"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
