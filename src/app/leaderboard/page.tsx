import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { createClient } from "@/utils/supabase/server";
import { Trophy, Hexagon, BadgeCheck } from "lucide-react";
import { badgeToneClass, deriveBadges } from "@/utils/badges";
import { getLeaderboardRank, getXpProgress, getXpRank, leaderboardRankClass, xpRankClass } from "@/utils/rank";
import Link from "next/link";
import Image from "next/image";
import { RankEmblem } from "@/components/RankEmblem";

export const metadata = {
  title: "Leaderboard | Netvora Academy",
  description: "Top network engineers ranked by XP.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: leaders } = await supabase
    .from("profiles")
    .select("id, username, full_name, xp, avatar_url, badges, class_id, role")
    .order("xp", { ascending: false })
    .limit(20);

  const rankedLeaders = (leaders ?? []).filter((leader) => leader.role !== "teacher" && leader.role !== "admin");

  const classIds = [...new Set(rankedLeaders.map((leader) => leader.class_id).filter((value): value is string => Boolean(value)))];
  const classMap = new Map<string, string>();
  if (classIds.length > 0) {
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name")
      .in("id", classIds);

    (classes ?? []).forEach((item) => classMap.set(item.id, item.name));
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-48 pb-20 px-6 md:px-12 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-accent/5 blur-[120px] rounded-full -translate-y-1/2" />
        <div className="container mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-8 relative z-10">
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center">
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
        <div className="container mx-auto max-w-5xl">
          {!rankedLeaders || rankedLeaders.length === 0 ? (
            <div className="text-center text-white/30 border border-dashed border-white/10 p-24 bg-white/[0.02]">
              <Trophy className="w-16 h-16 mx-auto mb-6 opacity-20" />
              <p className="text-xl font-bold mb-2">Leaderboard Kosong</p>
              <p className="text-sm">Daftar dan mulai belajar untuk masuk leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankedLeaders.map((user, i) => {
                const rank = i + 1;
                const leaderboardRank = getLeaderboardRank(rank);
                const xpRank = getXpRank(user.xp);
                const xpProgress = getXpProgress(user.xp);
                const badges = deriveBadges({ xp: user.xp, badges: Array.isArray(user.badges) ? user.badges : [] });
                const displayName = user.username ?? user.full_name ?? "Anonymous";
                const initials = displayName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
                const className = user.class_id ? classMap.get(user.class_id) ?? "-" : "-";

                return (
                  <Link key={user.id} href={`/profile/${user.id}`}
                    className={`relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 md:p-6 border transition-all ${
                      rank === 1 ? "bg-gradient-to-r from-yellow-500/20 via-[#FF2D2D]/15 to-yellow-500/20 border-yellow-400/30 shadow-[0_0_40px_rgba(255,215,0,0.12)]"
                        : rank === 2 ? "bg-gradient-to-r from-slate-300/10 via-white/5 to-slate-300/10 border-slate-300/20"
                        : rank === 3 ? "bg-gradient-to-r from-orange-500/10 via-white/5 to-orange-500/10 border-orange-400/20"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                    }`}>
                    {rank === 1 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,215,0,0.12),_transparent_35%)]" />}
                    <div className="relative flex items-center gap-5">
                      <div className="relative w-14 h-14 shrink-0">
                        <Hexagon className={`w-full h-full absolute ${rank === 1 ? "text-yellow-300 fill-yellow-300/15" : rank === 2 ? "text-slate-200/70 fill-slate-200/10" : rank === 3 ? "text-orange-300 fill-orange-300/10" : "text-white/10"}`} />
                        <div className="absolute inset-1 rounded-full overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt={displayName} fill unoptimized sizes="56px" className="object-cover" />
                          ) : (
                            <span className={`font-black text-lg ${rank === 1 ? "text-yellow-200" : "text-white"}`}>{initials}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className={`font-black text-xl md:text-2xl tracking-tight ${rank === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-300" : rank === 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-white to-slate-300" : rank === 3 ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-white to-orange-300" : "text-white group-hover:text-[#FF2D2D] transition-colors"}`}>
                          {displayName}
                        </p>
                        <p className="text-white/40 text-sm">{className}</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 mt-3 border text-[10px] font-bold uppercase tracking-[0.24em] ${leaderboardRankClass(leaderboardRank.tone)}`}>
                          #{rank} {leaderboardRank.label}
                        </span>
                        <span className={`inline-flex items-center gap-2 px-2.5 py-1 mt-3 ml-2 border text-[10px] font-bold uppercase tracking-[0.24em] ${xpRankClass(xpRank.tone)}`}>
                          <RankEmblem tone={xpRank.tone} label={`Rank ${xpRank.label}`} size={24} />
                          Rank: {xpRank.label}
                        </span>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.24em] mt-3">
                          Target: {xpProgress.nextLabel && xpProgress.nextMinXp !== null ? `${xpProgress.nextLabel} (${xpProgress.nextMinXp.toLocaleString("id-ID")} XP)` : "Tier maksimum"}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {badges.map((badge) => (
                            <span key={badge.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] uppercase tracking-[0.24em] ${badgeToneClass(badge.tone)}`}>
                              <BadgeCheck className="w-3 h-3" />
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="relative text-right">
                      <p className="font-black text-3xl md:text-4xl text-white">{user.xp.toLocaleString()}</p>
                      <p className="text-[#FF2D2D] text-xs font-bold uppercase tracking-widest">XP</p>
                    </div>
                  </Link>
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
