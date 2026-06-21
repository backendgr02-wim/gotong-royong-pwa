import { redirect } from "next/navigation";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { DonasiForm } from "@/components/features/donasi-form";

export const dynamic = "force-dynamic";

export default async function DonasiBaruPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/donasi/baru");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  return <DonasiForm namaKomunitas={komunitas.nama} rekening={null} />;
}
