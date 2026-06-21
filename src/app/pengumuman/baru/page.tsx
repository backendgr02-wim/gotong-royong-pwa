import { redirect } from "next/navigation";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { BuatPengumumanForm } from "@/components/features/buat-pengumuman-form";

export const dynamic = "force-dynamic";

export default async function BuatPengumumanPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/pengumuman/baru");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");
  if (komunitas.peran === "warga") redirect("/pengumuman");

  return <BuatPengumumanForm namaKomunitas={komunitas.nama} />;
}
