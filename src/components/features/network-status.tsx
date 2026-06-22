"use client";

import { useEffect, useState } from "react";

export function NetworkStatus({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    function handleOnline() {
      setOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    }
    function handleOffline() {
      setOnline(false);
      setShowBanner(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {!online && (
        <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
          Kamu sedang offline
        </div>
      )}
      {online && showBanner && (
        <div className="fixed inset-x-0 top-0 z-50 bg-emerald-500 px-4 py-2 text-center text-sm font-medium text-white">
          Koneksi tersambung kembali
        </div>
      )}
      {children}
    </>
  );
}
