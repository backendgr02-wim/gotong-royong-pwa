"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef } from "react";

export function SearchClient() {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = ref.current?.value.trim();
    if (!q) return;
    router.push(`/cari?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm text-muted">
        <Search size={18} className="shrink-0" />
        <input
          ref={ref}
          type="search"
          placeholder="Cari ilmu, ustadz, komunitas, warung…"
          className="w-full bg-transparent outline-none placeholder:text-muted"
        />
      </div>
    </form>
  );
}
