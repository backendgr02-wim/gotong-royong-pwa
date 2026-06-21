import { redirect } from "next/navigation";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { BuatPostForm } from "@/components/features/buat-post-form";

export const dynamic = "force-dynamic";

export default async function BuatPostPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/komunitas/baru");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");
  // Semua anggota boleh memposting (RLS posts_insert: is_member).

  return <BuatPostForm namaKomunitas={komunitas.nama} />;
}
