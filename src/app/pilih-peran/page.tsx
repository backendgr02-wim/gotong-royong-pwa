"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Landmark,
  Home,
  Building2,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";

type Role = {
  id: string;
  label: string;
  icon: typeof Landmark;
  desc: string;
  tags: string[];
};

const ROLES: Role[] = [
  {
    id: "masjid",
    label: "Masjid",
    icon: Landmark,
    desc: "Kelola dan ikuti seluruh aktivitas masjid dalam satu tempat",
    tags: ["Masjid", "Tabungan Kurban", "Kajian", "Donasi Masjid"],
  },
  {
    id: "keluarga",
    label: "Keluarga",
    icon: Home,
    desc: "Membangun keluarga sakinah, pendidikan anak, dan rumah tangga",
    tags: ["Parenting", "Hafalan Anak", "Rumah Tangga"],
  },
  {
    id: "rtrw",
    label: "RT / RW",
    icon: Building2,
    desc: "Mengelola kegiatan warga dan pembangunan lingkungan",
    tags: ["RT/RW", "Kerja Bakti"],
  },
  {
    id: "donasi",
    label: "Bersedekah & Berdonasi",
    icon: HeartHandshake,
    desc: "Berpartisipasi dalam program sosial dan amal",
    tags: ["Donasi"],
  },
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
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-[#064e3b]">
      {/* Header */}
      <header className="px-5 pt-16 pb-24 text-center text-white">
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">
          Selamat Datang di Gotong Royong
        </h1>
        <p className="mt-2 text-lg font-semibold italic text-[#95d3ba]">
          &quot;Bersama Ilmu, Bergerak Nyata&quot;
        </p>
        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-white/10 bg-white/10 px-6 py-5">
          <p className="text-[17px] leading-relaxed text-white/90">
            Pilih aktivitas yang paling menggambarkan peran Anda saat ini. Kami
            akan menyesuaikan tampilan aplikasi agar lebih relevan.
          </p>
        </div>
      </header>

      {/* Role Cards */}
      <main className="relative -mt-10 px-5 pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[28px] font-bold text-white">
            Apa yang sedang Anda kelola?
          </h2>
          <p className="mt-1 text-[15px] text-white/70">
            Pilih satu atau lebih peran Anda
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {ROLES.map((role) => {
              const aktif = selected.has(role.id);
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggle(role.id)}
                  className={`flex items-start gap-5 rounded-2xl p-6 text-left transition-all active:scale-[0.99] ${
                    aktif
                      ? "border-2 border-[#064e3b] bg-green-50 shadow-md"
                      : "border border-transparent bg-[#f8f9fa] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  {/* Icon Circle */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100/60 text-[#064e3b] shadow-sm">
                    <Icon size={28} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-[#064e3b]">
                        {role.label}
                      </h3>
                      <div
                        className={`mt-1 h-6 w-6 shrink-0 rounded-full border-2 transition-all ${
                          aktif
                            ? "border-[#064e3b] bg-[#064e3b] shadow-[inset_0_0_0_4px_#f0fdf4]"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{role.desc}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {role.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${
                            aktif
                              ? "border-green-200 bg-green-100 text-[#064e3b]"
                              : "border-[#064e3b]/10 bg-[#064e3b]/5 text-[#064e3b]"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="mt-12 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white">
              {selected.size} peran dipilih
            </p>
            <button
              type="button"
              onClick={lanjutkan}
              disabled={selected.size === 0}
              className={`inline-flex min-w-[280px] items-center justify-center gap-3 rounded-full px-10 py-4 text-lg font-semibold shadow-xl transition-all active:scale-95 ${
                selected.size === 0
                  ? "bg-white/20 text-white/50"
                  : "bg-[#064e3b] text-white hover:bg-[#002117]"
              }`}
            >
              Lanjutkan
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/30 bg-[#f7f9fb] px-6 py-5">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-xs font-bold uppercase tracking-widest text-[#064e3b]">
            Gotong Royong
          </p>
          <p className="text-xs text-gray-500">
            &copy; 2026 Gotong Royong. Nurturing Community Growth.
          </p>
        </div>
      </footer>
    </div>
  );
}
