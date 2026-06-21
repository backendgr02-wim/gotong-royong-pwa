import { redirect } from "next/navigation";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { PollForm } from "@/components/features/poll-form";

export const dynamic = "force-dynamic";

export default async function BuatPollingPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/polling/baru");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");
  if (komunitas.peran === "warga") redirect("/polling");

  return <PollForm namaKomunitas={komunitas.nama} />;
}
