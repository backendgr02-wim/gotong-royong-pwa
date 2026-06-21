import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, BarChart3, Check, Clock } from "lucide-react";
import { getUser, getActiveCommunity } from "@/lib/auth";
import { getPolls } from "@/lib/polls";
import { vote } from "@/actions/polls";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function tglIndo(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export default async function PollingList() {
  const user = await getUser();
  if (!user) redirect("/masuk?redirect=/polling");
  const komunitas = await getActiveCommunity();
  if (!komunitas) redirect("/onboarding");

  const polls = await getPolls(komunitas.id, user.id);
  const isPengurus = komunitas.peran !== "warga";

  return (
    <div>
      <header className="rounded-b-[28px] bg-header px-4 pt-12 pb-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Kembali" className="-ml-1 p-1">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="text-xs text-white/70">{komunitas.nama}</p>
            <h1 className="text-xl font-bold">Polling Warga</h1>
          </div>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {isPengurus && (
          <Link href="/polling/baru" className="block">
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-sm active:scale-[0.99]">
              <Plus size={18} /> Buat Polling
            </div>
          </Link>
        )}

        {polls.length > 0 ? (
          polls.map((p) => {
            const sudahVote = p.pilihanSaya !== null;
            const tampilHasil = sudahVote || p.selesai;
            return (
              <Card key={p.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold">{p.pertanyaan}</h2>
                  {p.selesai && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-muted">
                      Selesai
                    </span>
                  )}
                </div>

                {tampilHasil ? (
                  <ul className="space-y-2">
                    {p.opsi.map((opsi, i) => {
                      const jml = p.hasil[i] ?? 0;
                      const persen = p.totalSuara > 0 ? Math.round((jml / p.totalSuara) * 100) : 0;
                      const dipilih = p.pilihanSaya === i;
                      return (
                        <li key={i}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className={`font-medium ${dipilih ? "text-primary" : ""}`}>
                              {dipilih && <Check size={12} className="mr-0.5 inline" />}
                              {opsi}
                            </span>
                            <span className="text-muted">
                              {persen}% · {jml}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${dipilih ? "bg-primary" : "bg-primary/40"}`}
                              style={{ width: `${persen}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="space-y-2">
                    {p.opsi.map((opsi, i) => (
                      <li key={i}>
                        <form action={vote}>
                          <input type="hidden" name="pollId" value={p.id} />
                          <input type="hidden" name="opsiIndex" value={i} />
                          <button
                            type="submit"
                            className="w-full rounded-2xl border border-outline px-4 py-2.5 text-left text-sm font-medium transition active:scale-[0.99] hover:border-primary hover:bg-success-subtle"
                          >
                            {opsi}
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="flex items-center gap-2 text-[11px] text-muted">
                  <BarChart3 size={12} /> {p.totalSuara} suara
                  {p.berakhir && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {p.selesai ? "berakhir" : "sampai"} {tglIndo(p.berakhir)}
                    </span>
                  )}
                </p>
              </Card>
            );
          })
        ) : (
          <Card>
            <p className="flex items-center gap-2 text-sm text-muted">
              <BarChart3 size={16} /> Belum ada polling.
              {isPengurus ? " Tekan “Buat Polling”." : " Nantikan dari pengurus."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
