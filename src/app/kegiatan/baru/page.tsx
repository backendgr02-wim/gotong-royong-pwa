import { redirect } from "next/navigation";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { BuatKegiatanForm } from "@/components/features/buat-kegiatan-form";

export const dynamic = "force-dynamic";

export default async function BuatKegiatanPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/kegiatan/baru");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");
  if (komunitas.peran === "warga") redirect("/kegiatan");

  // Default waktu: hari ini 19:00 WIB (boleh diubah pengguna).
  const tgl = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const defaultMulai = `${tgl}T19:00`;

  return <BuatKegiatanForm defaultMulai={defaultMulai} namaKomunitas={komunitas.nama} />;
}
