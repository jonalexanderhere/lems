"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Trophy, TrendingUp, Hexagon } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const leaderboard = [
  { rank: 1, username: "sys_admin_99", xp: "14,500", trend: "up" },
  { rank: 2, username: "net_hacker_zero", xp: "13,250", trend: "up" },
  { rank: 3, username: "cyber_sec_pro", xp: "12,800", trend: "down" },
  { rank: 4, username: "cisco_master", xp: "11,400", trend: "up" },
  { rank: 5, username: "linux_guru", xp: "10,950", trend: "same" },
];

export function Leaderboard() {
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

          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div 
                key={user.rank}
                className={`leaderboard-row relative flex items-center justify-between p-4 md:p-6 rounded-sm border ${
                  user.rank === 1 
                    ? "bg-accent/10 border-accent/30 shadow-[0_0_30px_rgba(255,45,45,0.1)]" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                } transition-colors`}
              >
                {user.rank === 1 && (
                  <div className="rank-1-glow absolute inset-0 bg-accent/20 blur-xl opacity-0 pointer-events-none" />
                )}

                <div className="flex items-center gap-4 md:gap-8 relative z-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center relative">
                    {user.rank === 1 ? (
                      <Hexagon className="w-full h-full text-accent fill-accent/20 absolute inset-0" />
                    ) : (
                      <Hexagon className="w-full h-full text-white/20 absolute inset-0" />
                    )}
                    <span className={`font-heading font-bold text-lg md:text-2xl ${user.rank === 1 ? 'text-accent' : 'text-white'}`}>
                      {user.rank}
                    </span>
                  </div>
                  
                  <span className="font-mono text-base md:text-xl font-medium text-white">
                    {user.username}
                  </span>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                  <div className="hidden md:flex items-center gap-2 text-white/50">
                    <TrendingUp className={`w-4 h-4 ${user.trend === 'up' ? 'text-green-500' : user.trend === 'down' ? 'text-red-500' : ''}`} />
                  </div>
                  <div className="text-right">
                    <span className="block font-heading font-bold text-2xl md:text-3xl text-white">
                      {user.xp} <span className="text-sm md:text-base text-accent uppercase tracking-widest">XP</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
