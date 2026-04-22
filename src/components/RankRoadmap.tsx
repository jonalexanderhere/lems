import { XP_TIERS } from "@/utils/rank";
import { RankEmblem } from "@/components/RankEmblem";
import { ArrowRight, Crown, Target } from "lucide-react";

export function RankRoadmap() {
  return (
    <section className="py-24 bg-background relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,45,45,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_30%)]" />
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-[#FF2D2D] text-xs font-bold uppercase tracking-[0.28em] mb-3">Progress Rank</p>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                Semua rank yang bisa dicapai
              </h2>
              <p className="text-white/45 mt-3 max-w-2xl">
                Dari level awal sampai tier tertinggi, semua jalur rank ditampilkan dengan target XP yang jelas supaya siswa tahu langkah berikutnya.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10">
              <Crown className="w-5 h-5 text-yellow-300" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Total rank</p>
                <p className="font-bold text-white">{XP_TIERS.length} tier aktif</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {XP_TIERS.map((tier, index) => (
              <div key={tier.label} className={`p-5 border ${index === 0 ? "border-yellow-400/30 bg-yellow-500/5" : "border-white/10 bg-white/5"} relative overflow-hidden`}>
                {index === 0 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,215,0,0.14),_transparent_42%)]" />}
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.24em] mb-2">Tier {String(XP_TIERS.length - index).padStart(2, "0")}</p>
                    <h3 className="text-xl font-black text-white">{tier.label}</h3>
                    <p className="mt-1 text-sm text-white/50">
                      Mulai dari {tier.minXp.toLocaleString("id-ID")} XP
                    </p>
                  </div>
                  <RankEmblem tone={tier.tone} label={tier.label} size={44} />
                </div>
                <div className="mt-4 h-1.5 bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF2D2D] via-yellow-400 to-emerald-400"
                    style={{ width: `${Math.max(18, 100 - index * 8)}%` }}
                  />
                </div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-white/35 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  Tujuan berikutnya
                  <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
