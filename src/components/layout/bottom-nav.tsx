"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, MessageCircle, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Tab = { href: string; label: string; icon: LucideIcon; center?: boolean };

const tabs: Tab[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/komunitas", label: "Komunitas", icon: Users },
  { href: "/aksi", label: "", icon: Plus, center: true },
  { href: "/pesan", label: "Notifikasi", icon: MessageCircle },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (!loggedIn) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md items-center justify-around border-t border-outline bg-surface px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = pathname === t.href;

        if (t.center) {
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-label="Aksi"
              className="-mt-7 flex flex-col items-center gap-0.5"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95">
                <Icon size={26} />
              </span>
              <span className="text-[11px] text-muted">Aksi</span>
            </Link>
          );
        }

        return (
          <Link
            key={t.href}
            href={t.href}
            aria-label={t.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px]",
              active ? "font-semibold text-primary" : "text-muted",
            )}
          >
            <Icon size={22} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
