"use client";

import { useEffect, useState, useCallback } from "react";
import { getQueueCount, processQueue } from "@/lib/idb";

/** Maps saved action type → import dynamically at process time. */
function buildFormData(payload: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (typeof File !== "undefined" && v instanceof File) {
      fd.append(k, v);
    } else {
      fd.append(k, String(v ?? ""));
    }
  }
  return fd;
}

export function NetworkStatus({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [showBanner, setShowBanner] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  const replay = useCallback(async () => {
    const count = await getQueueCount();
    setQueueCount(count);
    if (count === 0) return;

    const result = await processQueue(async (action) => {
      switch (action.type) {
        case "reaksiPost":
        case "votePolling":
        case "rsvpEvent": {
          const fd = buildFormData(action.payload);
          await fetch(window.location.origin, {
            method: "POST",
            body: fd,
            headers: { Accept: "text/html" },
          });
          break;
        }
        default:
          break;
      }
    });

    if (result.synced > 0 || result.failed > 0) {
      const remaining = await getQueueCount();
      setQueueCount(remaining);
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true);
      setShowBanner(true);
      await replay();
      setTimeout(() => setShowBanner(false), 4000);
    };
    const handleOffline = async () => {
      setOnline(false);
      setShowBanner(true);
      const count = await getQueueCount();
      setQueueCount(count);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [replay]);

  return (
    <>
      {!online && (
        <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md">
          Kamu sedang offline
          {queueCount > 0 && ` · ${queueCount} aksi tertunda`}
        </div>
      )}
      {online && showBanner && (
        <div className="fixed inset-x-0 top-0 z-50 bg-emerald-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md">
          Koneksi tersambung kembali
          {queueCount > 0 && ` · ${queueCount} aksi tersisa`}
        </div>
      )}
      {children}
    </>
  );
}
