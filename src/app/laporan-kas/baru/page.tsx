import { redirect } from "next/navigation";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { CatatKasForm } from "@/components/features/catat-kas-form";

// Halaman ber-auth → wajib dinamis (Next 16).
export const dynamic = "force-dynamic";

export default async function CatatKasPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/laporan-kas/baru");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");
  // Hanya pengurus yang boleh mencatat kas (penegak sebenarnya tetap RLS).
  if (komunitas.peran === "warga") redirect("/laporan-kas");

  const hariIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  return <CatatKasForm defaultTanggal={hariIni} namaKomunitas={komunitas.nama} />;
}
