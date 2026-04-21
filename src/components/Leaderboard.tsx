"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Trophy, Hexagon, Crown } from "lucide-react";
import { badgeToneClass, deriveBadges } from "@/utils/badges";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Leader = {
  id: string;
  username: string | null;
  full_name: string | null;
  xp: number;
  avatar_url?: string | null;
  badges?: string[] | null;
};

export function Leaderboard({ leaders = [] }: { leaders?: Leader[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const rows = gsap.utils.toArray<HTMLElement>(".leaderboard-row");
    
    gsap.fromTo(
      rows,
      { x: -50, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      }
    );

    // Highlight top 1
    gsap.to(".rank-1-glow", {
      opacity: 0.5,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 bg-background relative z-10 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <Trophy className="w-12 h-12 text-accent mb-6" />
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-white uppercase tracking-tight mb-4">
            Top Engineers <br/>
            <span className="text-white/40">This Month</span>
          </h2>
        </div>

          {leaders.length === 0 ? (
            <div className="text-center text-white/30 border border-dashed border-white/10 p-16">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Leaderboard kosong.</p>
              <p className="text-sm mt-2">XP akan muncul setelah siswa mulai aktif.</p>
            </div>
          ) : (
          <div className="space-y-3">
            {leaders.map((user, index) => (
              <div 
                key={user.id}
                className={`leaderboard-row relative flex items-center justify-between p-4 md:p-6 rounded-sm border overflow-hidden ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-500/15 via-[#FF2D2D]/10 to-white/5 border-yellow-400/30 shadow-[0_0_30px_rgba(255,196,0,0.12)]"
                    : index === 1
                      ? "bg-white/7 border-white/10"
                      : index === 2
                        ? "bg-white/5 border-white/10"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                } transition-colors`}
              >
                {index === 0 && (
                  <div className="rank-1-glow absolute inset-0 bg-yellow-400/20 blur-xl opacity-0 pointer-events-none" />
                )}

                <div className="flex items-center gap-4 md:gap-8 relative z-10">
                    <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center relative shrink-0">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.username ?? user.full_name ?? "Avatar"} fill unoptimized sizes="64px" className="object-cover rounded-full" />
                      ) : (
                        <>
                        {index === 0 ? (
                          <Hexagon className="w-full h-full text-yellow-400 fill-yellow-400/15 absolute inset-0" />
                        ) : (
                          <Hexagon className="w-full h-full text-white/20 absolute inset-0" />
                        )}
                        <span className={`font-heading font-bold text-lg md:text-2xl ${index === 0 ? "text-yellow-300" : "text-white"}`}>
                          {index + 1}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      {index === 0 && <Crown className="w-4 h-4 text-yellow-300" />}
                      <span className={`font-mono text-base md:text-xl font-medium ${index < 3 ? "text-white" : "text-white/90"}`}>
                        {user.username ?? user.full_name ?? "Anonymous"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {deriveBadges({ xp: user.xp, badges: user.badges ?? [] }).map((badge) => (
                        <span key={badge.key} className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${badgeToneClass(badge.tone)}`}>
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right relative z-10">
                  <span className={`block font-heading font-bold text-2xl md:text-3xl ${index === 0 ? "text-yellow-200" : "text-white"}`}>
                    {user.xp.toLocaleString()} <span className="text-sm md:text-base text-accent uppercase tracking-widest">XP</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
