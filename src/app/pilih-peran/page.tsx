"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Landmark,
  Home,
  BookOpen,
  Building2,
  Store,
  Sparkles,
  HeartHandshake,
  Bike,
} from "lucide-react";

type Role = {
  id: string;
  label: string;
  icon: typeof Landmark;
  gradient: string;
  emoji: string;
};

const ROLES: Role[] = [
  { id: "masjid", label: "Masjid", icon: Landmark, gradient: "from-emerald-500 to-teal-500", emoji: "🕌" },
  { id: "keluarga", label: "Keluarga", icon: Home, gradient: "from-teal-500 to-cyan-500", emoji: "🏠" },
  { id: "pesantren", label: "Pesantren", icon: BookOpen, gradient: "from-indigo-500 to-violet-500", emoji: "📚" },
  { id: "rtrw", label: "RT / RW", icon: Building2, gradient: "from-violet-500 to-purple-500", emoji: "🏘️" },
  { id: "umkm", label: "UMKM Pasar", icon: Store, gradient: "from-green-500 to-emerald-500", emoji: "🛒" },
  { id: "belajar", label: "Belajar & Bertumbuh", icon: Sparkles, gradient: "from-sky-500 to-indigo-500", emoji: "🌱" },
  { id: "donasi", label: "Bersedekah & Berdonasi", icon: HeartHandshake, gradient: "from-pink-500 to-rose-500", emoji: "🤲" },
  { id: "ojol", label: "Pelaku Ojek Online", icon: Bike, gradient: "from-cyan-500 to-teal-500", emoji: "🏍️" },
];

export default function PilihPeran() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function lanjutkan() {
    if (selected.size === 0) return;
    localStorage.setItem("selectedRoles", JSON.stringify(Array.from(selected)));
    router.push("/masuk");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white px-4 pt-14 pb-8">
      {/* Header */}
      <div className="mb-2 text-center">
        <h1 className="text-3xl font-bold text-primary-deep">Gotong Royong</h1>
        <p className="mt-1 text-sm italic text-muted">
          &quot;Bersama Ilmu, Bergerak Nyata&quot;
        </p>
      </div>

      <p className="mb-6 mt-6 text-center text-sm text-muted">
        Pilih aktivitas yang paling menggambarkan peran Anda saat ini.
        <br />
        Kami akan menyesuaikan tampilan aplikasi agar lebih relevan.
      </p>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Apa yang sedang Anda kelola?
      </p>

      {/* Grid Peran */}
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((role) => {
          const aktif = selected.has(role.id);
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              onClick={() => toggle(role.id)}
              className={`relative flex flex-col items-center gap-2 rounded-2xl p-4 text-center text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.97] ${
                aktif
                  ? `bg-gradient-to-br ${role.gradient} ring-2 ring-white ring-offset-2 ring-offset-transparent`
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Icon size={28} className={aktif ? "text-white" : "text-gray-400"} />
              <span>{role.label}</span>
              {aktif && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-primary-deep shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tombol Lanjutkan */}
      <div className="mt-auto pt-8">
        <button
          onClick={lanjutkan}
          disabled={selected.size === 0}
          className={`w-full rounded-2xl py-3.5 text-center text-base font-bold text-white transition-all ${
            selected.size === 0
              ? "bg-gray-200 text-gray-400"
              : "bg-primary shadow-sm active:scale-[0.98]"
          }`}
        >
          {selected.size > 0
            ? `${selected.size} peran dipilih — Lanjutkan`
            : "Pilih peran Anda"}
        </button>
      </div>
    </div>
  );
}
