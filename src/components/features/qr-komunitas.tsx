"use client";

import { useEffect, useRef, useState } from "react";
import { Download, X, QrCode } from "lucide-react";
import type { QRCodeToDataURLOptions } from "qrcode";

/**
 * Tombol + modal QR Code untuk halaman publik komunitas.
 * Generate QR dari slug → URL publik komunitas.
 */
export function QrKomunitas({ slug, nama }: { slug: string; nama: string }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/k/${slug}`;

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    let cancelled = false;

    import("qrcode").then((mod) => {
      if (cancelled) return;
      const opts: QRCodeToDataURLOptions = {
        width: 280,
        margin: 2,
        color: { dark: "#064e3b", light: "#ffffff" },
      };
      mod.default.toCanvas(canvasRef.current, url, opts);
    });

    return () => { cancelled = true; };
  }, [open, url]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white active:scale-[0.97]"
      >
        <QrCode size={14} /> QR
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-primary-deep">QR {nama}</h3>
              <button type="button" onClick={() => setOpen(false)}>
                <X size={20} className="text-muted" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">Arahkan kamera untuk bergabung</p>
            <canvas ref={canvasRef} className="mx-auto mt-4 rounded-xl" width={280} height={280} />
            <p className="mt-2 truncate text-[10px] text-muted">{url}</p>
            <button
              type="button"
              onClick={download}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white active:scale-[0.99]"
            >
              <Download size={16} /> Unduh QR
            </button>
          </div>
        </div>
      )}
    </>
  );
}
