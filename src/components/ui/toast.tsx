"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastCtx = {
  toast: (kind: ToastKind, message: string) => void;
};

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

let _nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = ++_nextId;
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            role="alert"
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg drop-shadow-sm transition-all animate-in slide-in-from-top",
              t.kind === "success" && "bg-emerald-600 text-white",
              t.kind === "error" && "bg-red-600 text-white",
              t.kind === "info" && "bg-primary text-white",
            )}
          >
            {t.kind === "success" && <span className="text-lg leading-none">✓</span>}
            {t.kind === "error" && <span className="text-lg leading-none">✕</span>}
            {t.kind === "info" && <span className="text-lg leading-none">ℹ</span>}
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx>
  );
}
