import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Award, Fingerprint, Eye } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Certification | Netvora Academy",
  description: "Earn verifiable industry-style certifications from Netvora Academy.",
};

const certifications = [
  { id: "NV-NET-001", title: "Certified Network Engineer", level: "Foundation", color: "border-blue-500/30 from-blue-900/20" },
  { id: "NV-SEC-001", title: "Certified Cybersecurity Analyst", level: "Professional", color: "border-[#FF2D2D]/30 from-[#FF2D2D]/10" },
  { id: "NV-SYS-001", title: "Certified Linux SysAdmin", level: "Associate", color: "border-green-500/30 from-green-900/20" },
  { id: "NV-ADV-001", title: "Certified Infrastructure Architect", level: "Expert", color: "border-yellow-500/30 from-yellow-900/20" },
];

export default function CertificationPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-40 pb-16 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.3em] text-sm mb-4">Official Credentials</p>
          <h1 className="font-black uppercase tracking-tighter text-5xl md:text-6xl lg:text-7xl leading-none mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>
            Certification
          </h1>
          <p className="text-white/50 text-xl max-w-2xl">
            Earn proof of your skills. All Netvora certificates are auto-generated, uniquely numbered, and cryptographically verifiable.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 md:px-12 border-b border-white/5">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Award, title: "Industry-style design", desc: "Certificates built to impress employers and clients." },
            { icon: Fingerprint, title: "Auto-generated", desc: "Instantly created upon course or path completion." },
            { icon: ShieldCheck, title: "Verifiable online", desc: "Each certificate has a unique ID and verification page." },
          ].map((f, i) => (
            <div key={i} className="flex gap-4 p-6 bg-white/5 border border-white/10">
              <f.icon className="w-8 h-8 text-[#FF2D2D] shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-white/50">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cert Cards */}
      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-10" style={{ fontFamily: "var(--font-grotesk)" }}>Available Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certifications.map((cert) => (
              <div key={cert.id} className={`relative p-8 border bg-gradient-to-br ${cert.color} to-transparent overflow-hidden group`}>
                <div className="flex justify-between items-start mb-6">
                  <ShieldCheck className="w-10 h-10 text-[#FF2D2D]" />
                  <span className="font-mono text-white/30 text-xs">{cert.id}</span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-grotesk)" }}>{cert.title}</h3>
                <p className="text-white/50 mb-6">{cert.level} Level</p>
                <div className="flex gap-3">
                  <Link href="/courses" className="flex items-center gap-2 px-4 py-2 bg-[#FF2D2D] text-white text-sm font-bold uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                    <Award className="w-4 h-4" /> Earn It
                  </Link>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-bold uppercase tracking-wide hover:bg-white/20 transition-colors">
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
