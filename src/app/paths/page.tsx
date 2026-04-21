import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArrowRight, Clock, Layers3, ShieldCheck, Server } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Learning Paths | Netvora Academy",
  description: "Basic learning paths to help students master the fundamentals first.",
};

const paths = [
  {
    id: "network-fundamentals",
    title: "Network Fundamentals",
    subtitle: "IP, switch, router, and traffic basics",
    modules: 6,
    duration: "24 Hours",
    level: "Foundation",
    accent: "text-blue-300",
    border: "border-blue-500/30",
    glow: "from-blue-500/10",
  },
  {
    id: "security-fundamentals",
    title: "Security Fundamentals",
    subtitle: "Threats, access control, and safe practice",
    modules: 6,
    duration: "26 Hours",
    level: "Foundation",
    accent: "text-[#FF2D2D]",
    border: "border-[#FF2D2D]/30",
    glow: "from-[#FF2D2D]/10",
  },
  {
    id: "linux-fundamentals",
    title: "Linux Fundamentals",
    subtitle: "Command line, services, files, permissions",
    modules: 6,
    duration: "22 Hours",
    level: "Foundation",
    accent: "text-emerald-300",
    border: "border-emerald-500/30",
    glow: "from-emerald-500/10",
  },
  {
    id: "infrastructure-fundamentals",
    title: "Infrastructure Fundamentals",
    subtitle: "Backup, monitoring, and server basics",
    modules: 6,
    duration: "20 Hours",
    level: "Foundation",
    accent: "text-violet-300",
    border: "border-violet-500/30",
    glow: "from-violet-500/10",
  },
];

export default function PathsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-40 pb-16 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.3em] text-sm mb-4">Basic Learning Paths</p>
          <h1 className="font-black uppercase tracking-tighter text-5xl md:text-6xl lg:text-7xl leading-none max-w-3xl" style={{ fontFamily: "var(--font-grotesk)" }}>
            Mulai dari <span className="text-[#FF2D2D]">dasar</span>, baru naik level.
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mt-6">
            Jalur belajar ini sengaja dibuat foundation-first supaya siswa tidak langsung loncat ke materi advance sebelum paham dasar jaringan, keamanan, dan Linux.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {paths.map((path) => (
            <Link
              key={path.id}
              href={`/paths/${path.id}`}
              className={`group relative overflow-hidden border ${path.border} bg-white/5 hover:bg-white/8 transition-all duration-300`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${path.glow} to-transparent opacity-60`} />
              <div className="relative p-8 md:p-10 flex flex-col gap-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] ${path.accent}`}>
                      <ShieldCheck className="w-4 h-4" />
                      Foundation Path
                    </span>
                    <h2 className={`text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none ${path.accent}`} style={{ fontFamily: "var(--font-grotesk)" }}>
                      {path.title}
                    </h2>
                    <p className="text-white/60 text-lg max-w-md">{path.subtitle}</p>
                  </div>
                  <ArrowRight className={`w-8 h-8 ${path.accent} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm text-white/50">
                  <div className="p-4 bg-black/20 border border-white/5">
                    <Layers3 className="w-4 h-4 text-white/40 mb-2" />
                    <p className="text-white font-bold">{path.modules}</p>
                    <p className="text-xs uppercase tracking-widest">Modules</p>
                  </div>
                  <div className="p-4 bg-black/20 border border-white/5">
                    <Clock className="w-4 h-4 text-white/40 mb-2" />
                    <p className="text-white font-bold">{path.duration}</p>
                    <p className="text-xs uppercase tracking-widest">Duration</p>
                  </div>
                  <div className="p-4 bg-black/20 border border-white/5">
                    <Server className="w-4 h-4 text-white/40 mb-2" />
                    <p className="text-white font-bold">{path.level}</p>
                    <p className="text-xs uppercase tracking-widest">Level</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
