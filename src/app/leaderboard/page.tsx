import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { createClient } from "@/utils/supabase/server";
import { Trophy, Hexagon } from "lucide-react";

export const metadata = {
  title: "Leaderboard | Netvora Academy",
  description: "Top network engineers ranked by XP.",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: leaders } = await supabase
    .from("profiles")
    .select("id, username, full_name, xp, classes(name)")
    .eq("role", "student")
    .order("xp", { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-48 pb-20 px-6 md:px-12 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-accent/5 blur-[120px] rounded-full -translate-y-1/2" />
        <div className="container mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-8 relative z-10">
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center animate-pulse">
              <Trophy className="w-12 h-12 text-[#FF2D2D]" />
            </div>
            <div>
              <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.4em] text-sm mb-3 text-center md:text-left">
                Peringkat Terbaik {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </p>
              <h1 className="font-black uppercase tracking-tighter text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-center md:text-left" style={{ fontFamily: "var(--font-grotesk)" }}>
                Papan <br /><span className="text-accent">Skor.</span>
              </h1>
            </div>
          </div>
          <div className="hidden lg:block text-right max-w-xs">
            <p className="text-white/40 text-sm leading-relaxed uppercase tracking-widest font-bold">
              Engineer terpilih yang menguasai infrastruktur digital melalui dedikasi dan praktik nyata.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto max-w-4xl">
          {!leaders || leaders.length === 0 ? (
            <div className="text-center text-white/30 border border-dashed border-white/10 p-24">
              <Trophy className="w-16 h-16 mx-auto mb-6 opacity-20" />
              <p className="text-xl font-bold mb-2">Leaderboard Kosong</p>
              <p className="text-sm">Daftar dan mulai belajar untuk masuk leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaders.map((user, i) => {
                const rank = i + 1;
                return (
                  <div key={user.id}
                    className={`flex items-center justify-between p-5 md:p-6 border transition-colors ${
                      rank === 1 ? "bg-[#FF2D2D]/10 border-[#FF2D2D]/30 shadow-[0_0_30px_rgba(255,45,45,0.1)]"
                        : rank <= 3 ? "bg-white/5 border-white/10"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                    }`}>
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 flex items-center justify-center relative shrink-0">
                        <Hexagon className={`w-full h-full absolute ${rank === 1 ? "text-[#FF2D2D] fill-[#FF2D2D]/20" : rank <= 3 ? "text-white/30" : "text-white/10"}`} />
                        <span className={`font-black text-base relative z-10 ${rank === 1 ? "text-[#FF2D2D]" : "text-white"}`}>{rank}</span>
                      </div>
                      <div>
                        <p className="font-mono text-lg font-bold text-white">{user.username ?? user.full_name ?? "Anonymous"}</p>
                        <p className="text-white/40 text-sm">{(user.classes as unknown as { name: string } | null)?.name ?? "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-2xl md:text-3xl text-white">{user.xp.toLocaleString()}</p>
                      <p className="text-[#FF2D2D] text-xs font-bold uppercase tracking-widest">XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
