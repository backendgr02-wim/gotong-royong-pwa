import { redirect } from "next/navigation";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { LaporForm } from "@/components/features/lapor-form";

export const dynamic = "force-dynamic";

export default async function BuatLaporPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/lapor/baru");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");
  // Semua anggota boleh melapor (RLS reports_insert: pelapor = auth.uid + is_member).

  return <LaporForm namaKomunitas={komunitas.nama} />;
}
