"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./bottom-nav";

// Route tanpa bottom-nav (layar penuh): login, onboarding, halaman publik komunitas.
const BARE_ROUTES = ["/masuk", "/onboarding", "/auth", "/k/", "/~offline"];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((r) => pathname.startsWith(r));

  if (bare) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
