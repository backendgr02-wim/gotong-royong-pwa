import { redirect } from "next/navigation";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DonasiForm } from "@/components/features/donasi-form";

export const dynamic = "force-dynamic";

export default async function DonasiBaruPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/donasi/baru");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const supabase = await createClient();
  const { data: komunitasData } = await supabase
    .from("communities")
    .select("rekening_tujuan, nominal_iuran_default")
    .eq("id", komunitas.id)
    .maybeSingle();

  return (
    <DonasiForm
      namaKomunitas={komunitas.nama}
      rekening={komunitasData?.rekening_tujuan ?? null}
    />
  );
}
