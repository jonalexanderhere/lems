"use client";

import { Trophy, Hexagon } from "lucide-react";

type Leader = {
  id: string;
  username: string | null;
  full_name: string | null;
  xp: number;
};

export function LiveLeaderboard({ leaders }: { leaders: Leader[] }) {
  return (
    <section className="py-24 bg-background relative z-10 overflow-hidden border-t border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <Trophy className="w-12 h-12 text-accent mb-6" />
            <h2 className="text-4xl md:text-6xl font-heading font-bold text-white uppercase tracking-tight mb-4">
              Engineer Terbaik <br />
              <span className="text-white/40">Bulan Ini</span>
            </h2>
          </div>

          {leaders.length === 0 ? (
            <div className="text-center text-white/30 border border-dashed border-white/10 p-16">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Papan skor masih kosong.</p>
              <p className="text-sm mt-2">Jadilah yang pertama mendapatkan XP!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaders.map((user, i) => {
                const rank = i + 1;
                return (
                  <div
                    key={user.id}
                    className={`relative flex items-center justify-between p-4 md:p-6 rounded-sm border ${
                      rank === 1
                        ? "bg-accent/10 border-accent/30 shadow-[0_0_30px_rgba(255,45,45,0.1)]"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-4 md:gap-8">
                      <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center relative">
                        <Hexagon className={`w-full h-full absolute inset-0 ${rank === 1 ? "text-accent fill-accent/20" : "text-white/20"}`} />
                        <span className={`font-heading font-bold text-lg md:text-2xl relative z-10 ${rank === 1 ? "text-accent" : "text-white"}`}>{rank}</span>
                      </div>
                      <span className="font-mono text-base md:text-xl font-medium text-white">
                        {user.username ?? user.full_name ?? "Anonymous"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-heading font-bold text-2xl md:text-3xl text-white">
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
