"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Crown, Sparkles, Trophy } from "lucide-react";
import { BadgeMark } from "@/components/BadgeMark";
import { RankEmblem } from "@/components/RankEmblem";
import { badgeToneClass, deriveBadges } from "@/utils/badges";
import { getLeaderboardRank, getXpProgress, getXpRank, leaderboardRankClass, xpRankClass } from "@/utils/rank";

type Leader = {
  id: string;
  username: string | null;
  full_name: string | null;
  xp: number;
  avatar_url?: string | null;
  badges?: string[] | null;
};

export function LeaderboardSpotlight({ leaders }: { leaders: Leader[] }) {
  const topLeaders = useMemo(() => leaders.slice(0, 3), [leaders]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (topLeaders.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % topLeaders.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [topLeaders.length]);

  if (topLeaders.length === 0) return null;

  return (
    <section className="mb-8 md:mb-10 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03),rgba(255,45,45,0.08))] p-5 md:p-7 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,215,0,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.12),_transparent_32%)]" />
      <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent animate-leaderboard-shine" />

      <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.36em] text-[10px] mb-2">Top 3 Spotlight</p>
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
            Sorotan juara berpindah otomatis.
          </h3>
          <p className="text-white/45 text-sm mt-2 max-w-2xl">
            Badge Top 1, Top 2, dan Top 3 bergantian jadi pusat perhatian supaya leaderboard terasa hidup dan mewah.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 border border-white/10 bg-black/20 text-white/70 text-[10px] uppercase tracking-[0.24em]">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          Fokus aktif: Top {activeIndex + 1}
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {topLeaders.map((user, index) => {
          const rank = index + 1;
          const leaderboardRank = getLeaderboardRank(rank);
          const xpRank = getXpRank(user.xp);
          const xpProgress = getXpProgress(user.xp);
          const badges = deriveBadges({ xp: user.xp, badges: user.badges }, 2);
          const displayName = user.username ?? user.full_name ?? "Anonymous";
          const initials = displayName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
          const isActive = activeIndex === index;

          return (
            <article
              key={user.id}
              className={`group relative overflow-hidden rounded-[1.5rem] border p-5 md:p-6 transition-all duration-500 ${
                rank === 1
                  ? "border-yellow-400/30 bg-gradient-to-br from-yellow-500/15 via-[#FF2D2D]/10 to-white/5 shadow-[0_0_50px_rgba(255,215,0,0.14)]"
                  : rank === 2
                    ? "border-slate-300/20 bg-gradient-to-br from-slate-300/10 via-white/5 to-slate-300/10"
                    : "border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-white/5 to-orange-500/10"
              } ${isActive ? "scale-[1.015] -translate-y-1" : "opacity-90"}`}
            >
              <div className={`absolute inset-0 ${isActive ? "bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_36%)]" : ""}`} />
              <div className={`absolute inset-x-8 top-0 h-px ${isActive ? "bg-gradient-to-r from-transparent via-white/80 to-transparent animate-leaderboard-shine" : "bg-gradient-to-r from-transparent via-white/30 to-transparent"}`} />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="relative flex items-center gap-3">
                    <div className={`relative w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-full overflow-hidden border bg-black/40 flex items-center justify-center ${isActive ? "animate-leaderboard-float" : ""} ${rank === 1 ? "border-yellow-300/40" : rank === 2 ? "border-slate-200/30" : "border-orange-300/30"}`}>
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={displayName} fill unoptimized sizes="64px" className="object-cover" />
                      ) : (
                        <span className="font-black text-base md:text-lg text-white">{initials}</span>
                      )}
                    </div>
                    <RankEmblem tone={xpRank.tone} label={`Rank ${xpRank.label}`} size={isActive ? 58 : 54} className="shrink-0" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {rank === 1 && <Crown className="w-4 h-4 text-yellow-300" />}
                      <p className={`font-black text-xl md:text-2xl tracking-tight ${rank === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-300" : rank === 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-white to-slate-300" : "text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-white to-orange-300"}`}>
                        {displayName}
                      </p>
                    </div>
                    <p className="text-white/40 text-sm">{user.username ?? user.full_name ?? "Anonymous"}</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 border text-[10px] font-bold uppercase tracking-[0.24em] ${leaderboardRankClass(leaderboardRank.tone)}`}>
                      #{rank} {leaderboardRank.label}
                    </span>
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 mt-2 ml-2 border text-[10px] font-bold uppercase tracking-[0.24em] ${xpRankClass(xpRank.tone)}`}>
                      <RankEmblem tone={xpRank.tone} label={`Rank ${xpRank.label}`} size={20} />
                      Rank: {xpRank.label}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-3xl md:text-4xl text-white">
                    {user.xp.toLocaleString()} <span className="text-sm md:text-base text-accent uppercase tracking-widest">XP</span>
                  </p>
                  <p className="text-white/35 text-[10px] uppercase tracking-[0.24em] mt-2">
                    Target: {xpProgress.nextLabel && xpProgress.nextMinXp !== null ? `${xpProgress.nextLabel} (${xpProgress.nextMinXp.toLocaleString("id-ID")} XP)` : "Tier maksimum"}
                  </p>
                </div>
              </div>

              <div className="relative mt-5 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span key={badge.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] uppercase tracking-[0.24em] ${badgeToneClass(badge.tone)}`}>
                    <BadgeMark badge={badge} size={14} />
                    {badge.label}
                  </span>
                ))}
              </div>

              <div className="relative mt-5">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/35 mb-2">
                  <span>Progress ke tier berikutnya</span>
                  <span>{xpProgress.progress}%</span>
                </div>
                <div className="h-2.5 bg-white/5 border border-white/10 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${rank === 1 ? "from-yellow-400 via-white to-yellow-300" : rank === 2 ? "from-slate-200 via-white to-slate-300" : "from-orange-300 via-white to-orange-200"} transition-all duration-500`}
                    style={{ width: `${xpProgress.progress}%` }}
                  />
                </div>
              </div>

              <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-[0.24em] text-white/20">
                <Trophy className="w-3.5 h-3.5 inline-block mr-1" />
                Elite slot
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
