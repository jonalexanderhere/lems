import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ArrowRight, Clock, Users, Zap } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Learning Paths | Netvora Academy",
  description: "Structured learning paths to master networking and cybersecurity.",
};

const paths = [
  {
    id: "network-engineer",
    title: "Network Engineer",
    subtitle: "From zero to CCNA-ready",
    courses: 6,
    duration: "80 Hours",
    level: "Beginner → Advanced",
    color: "from-blue-900/40 to-transparent",
    border: "border-blue-500/30",
    accent: "text-blue-400",
  },
  {
    id: "cybersec-analyst",
    title: "Cybersecurity Analyst",
    subtitle: "Defend, detect, respond",
    courses: 7,
    duration: "96 Hours",
    level: "Intermediate → Advanced",
    color: "from-[#FF2D2D]/20 to-transparent",
    border: "border-[#FF2D2D]/30",
    accent: "text-[#FF2D2D]",
  },
  {
    id: "sysadmin-linux",
    title: "Linux SysAdmin",
    subtitle: "Master server infrastructure",
    courses: 5,
    duration: "64 Hours",
    level: "Beginner → Intermediate",
    color: "from-green-900/30 to-transparent",
    border: "border-green-500/30",
    accent: "text-green-400",
  },
  {
    id: "cloud-networking",
    title: "Cloud & DevOps Networking",
    subtitle: "Scale infrastructure at cloud speed",
    courses: 8,
    duration: "110 Hours",
    level: "Intermediate → Advanced",
    color: "from-purple-900/30 to-transparent",
    border: "border-purple-500/30",
    accent: "text-purple-400",
  },
];

export default function PathsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />
      <section className="pt-40 pb-16 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.3em] text-sm mb-4">Structured Training</p>
          <h1 className="font-black uppercase tracking-tighter text-6xl md:text-8xl leading-none" style={{ fontFamily: "var(--font-grotesk)" }}>
            Learning Paths
          </h1>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {paths.map((path) => (
            <Link
              key={path.id}
              href={`/paths/${path.id}`}
              className={`group relative p-8 md:p-12 border ${path.border} bg-gradient-to-br ${path.color} hover:bg-white/5 transition-all duration-300 overflow-hidden`}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2 ${path.accent}`} style={{ fontFamily: "var(--font-grotesk)" }}>
                    {path.title}
                  </h2>
                  <p className="text-white/60 text-lg">{path.subtitle}</p>
                </div>
                <ArrowRight className={`w-8 h-8 ${path.accent} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
              </div>
              <div className="flex gap-6 text-sm text-white/50">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" />{path.courses} Courses</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{path.duration}</span>
                <span className="flex items-center gap-2"><Zap className="w-4 h-4" />{path.level}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
