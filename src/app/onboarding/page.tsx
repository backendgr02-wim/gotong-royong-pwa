import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { OnboardingClient } from "@/components/features/onboarding-client";

export const dynamic = "force-dynamic";

export default async function Onboarding() {
  const user = await getUser();
  if (!user) redirect("/masuk");

  const supabase = await createClient();
  const { data: communities } = await supabase
    .from("communities")
    .select("id, nama, jenis, kelurahan")
    .order("nama");

  return <OnboardingClient communities={communities ?? []} />;
}
