import { redirect } from "next/navigation";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getContacts } from "@/lib/contacts";
import { AturKontakForm } from "@/components/features/atur-kontak-form";

export const dynamic = "force-dynamic";

export default async function AturKontakPage() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/kontak/atur");

  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");
  if (komunitas.peran === "warga") redirect("/");

  const contacts = await getContacts(komunitas.id);

  return <AturKontakForm namaKomunitas={komunitas.nama} contacts={contacts} />;
}
