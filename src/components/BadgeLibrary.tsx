import { BadgeMark } from "@/components/BadgeMark";
import { BADGE_FAMILIES, FEATURED_BADGES } from "@/utils/badges";
import { BadgeCheck, Sparkles } from "lucide-react";

export function BadgeLibrary() {
  return (
    <section className="py-24 bg-background relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,45,45,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.08),_transparent_30%)]" />
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-[#FF2D2D] text-xs font-bold uppercase tracking-[0.28em] mb-3">Badge Library</p>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                Semua lencana yang bisa dibuka
              </h2>
              <p className="text-white/45 mt-3 max-w-2xl">
                Ada 1000 lencana otomatis yang tersebar di berbagai keluarga pencapaian, ditambah badge spesial untuk milestone, sertifikasi, dan peringkat terbaik.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10">
              <Sparkles className="w-5 h-5 text-cyan-300" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Total otomatis</p>
                <p className="font-bold text-white">1000 lencana milestone</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {BADGE_FAMILIES.map((family) => (
              <div key={family.key} className={`p-5 border ${family.tone === "special" ? "border-cyan-300/30 bg-cyan-500/5" : "border-white/10 bg-white/5"} relative overflow-hidden`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/35 mb-2">{family.total} milestone</p>
                    <h3 className="text-xl font-black text-white">{family.title}</h3>
                    <p className="mt-2 text-sm text-white/50">{family.description}</p>
                  </div>
                  <BadgeMark badge={{ key: `${family.key}:preview`, label: family.title, tone: family.tone }} size={46} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {family.sampleLabels.map((sample) => (
                    <span key={sample} className="px-2.5 py-1 border border-white/10 bg-black/20 text-[10px] uppercase tracking-[0.24em] text-white/75">
                      {sample}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {FEATURED_BADGES.map((badge) => (
              <div key={badge.key} className="p-5 border border-white/10 bg-white/5 flex items-center gap-4">
                <BadgeMark badge={badge} size={44} />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/35 mb-1">Badge spesial</p>
                  <p className="font-bold text-white">{badge.label}</p>
                </div>
                <BadgeCheck className="w-4 h-4 text-white/30 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
