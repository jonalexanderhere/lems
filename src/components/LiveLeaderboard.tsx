"use client";

import { Trophy, Hexagon, BadgeCheck } from "lucide-react";
import { badgeToneClass, deriveBadges } from "@/utils/badges";

type Leader = {
  id: string;
  username: string | null;
  full_name: string | null;
  xp: number;
  avatar_url?: string | null;
  badges?: string[] | null;
};

function rankTreatment(rank: number) {
  if (rank === 1) {
    return "bg-gradient-to-r from-yellow-500/20 via-[#FF2D2D]/15 to-yellow-500/20 border-yellow-400/30 shadow-[0_0_50px_rgba(255,215,0,0.15)]";
  }
  if (rank === 2) return "bg-gradient-to-r from-slate-300/10 via-white/5 to-slate-300/10 border-slate-300/20";
  if (rank === 3) return "bg-gradient-to-r from-orange-500/10 via-white/5 to-orange-500/10 border-orange-400/20";
  return "bg-white/5 border-white/10 hover:bg-white/8";
}

export function LiveLeaderboard({ leaders }: { leaders: Leader[] }) {
  return (
    <section className="py-24 bg-background relative z-10 overflow-hidden border-t border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <Trophy className="w-12 h-12 text-accent mb-6" />
            <h2 className="text-4xl md:text-6xl font-heading font-black text-white uppercase tracking-tight mb-4">
              Rank <br />
              <span className="text-white/40">Crowned</span>
            </h2>
          </div>

          {leaders.length === 0 ? (
            <div className="text-center text-white/30 border border-dashed border-white/10 p-16 bg-white/[0.02]">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Papan skor masih kosong.</p>
              <p className="text-sm mt-2">Jadilah yang pertama mendapatkan XP!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaders.map((user, i) => {
                const rank = i + 1;
                const badges = deriveBadges({ xp: user.xp, badges: user.badges });
                const displayName = user.username ?? user.full_name ?? "Anonymous";
                const initials = displayName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <div
                    key={user.id}
                    className={`relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 md:p-6 border ${rankTreatment(rank)} transition-all`}
                  >
                    {rank === 1 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,215,0,0.12),_transparent_35%)]" />}
                    <div className="relative flex items-center gap-4 md:gap-6">
                      <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                        <Hexagon className={`w-full h-full absolute inset-0 ${rank === 1 ? "text-yellow-300 fill-yellow-300/15" : rank === 2 ? "text-slate-200/70 fill-slate-200/10" : rank === 3 ? "text-orange-300 fill-orange-300/10" : "text-white/20"}`} />
                        <div className="absolute inset-1 rounded-full overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className={`font-black text-lg ${rank === 1 ? "text-yellow-200" : "text-white"}`}>{initials}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className={`font-black text-xl md:text-2xl tracking-tight ${rank === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-300" : rank === 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-white to-slate-300" : rank === 3 ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-white to-orange-300" : "text-white"}`}>
                          {displayName}
                        </p>
                        <p className="text-white/40 text-sm">#{rank} {rank === 1 ? "Champion" : rank === 2 ? "Runner-up" : rank === 3 ? "Podium" : "Engineer"}</p>
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
                      <span className="block font-heading font-black text-3xl md:text-4xl text-white">
                        {user.xp.toLocaleString()} <span className="text-sm md:text-base text-accent uppercase tracking-widest">XP</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
