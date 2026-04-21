import Link from "next/link";
import { Award, Eye, Fingerprint, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CertificationQuiz } from "@/app/certification/CertificationQuiz";

export const metadata = {
  title: "Certification Dashboard | Netvora Academy",
};

const certifications = [
  { id: "NV-NET-001", title: "Certified Network Engineer", level: "Foundation" },
  { id: "NV-SEC-001", title: "Certified Cybersecurity Analyst", level: "Professional" },
  { id: "NV-SYS-001", title: "Certified Linux SysAdmin", level: "Associate" },
  { id: "NV-ADV-001", title: "Certified Infrastructure Architect", level: "Expert" },
];

export default async function CertificationDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-28 pb-16 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.3em] text-sm mb-4">Dashboard Sertifikasi</p>
          <h1 className="font-black uppercase tracking-tighter text-5xl md:text-6xl lg:text-7xl leading-none mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>
            Ambil Sertifikat
          </h1>
          <p className="text-white/50 text-xl max-w-2xl">
            Masuk, kerjakan ujian 50 soal, dan buka sertifikat langsung dari dashboard.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 border-b border-white/5">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Award, title: "Standar internasional", desc: "Soal disusun untuk menguji pemahaman nyata." },
            { icon: Fingerprint, title: "Terverifikasi", desc: "Setiap sertifikat punya ID unik untuk validasi." },
            { icon: ShieldCheck, title: "Login only", desc: "Akses sertifikasi berjalan lewat dashboard." },
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

      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-10" style={{ fontFamily: "var(--font-grotesk)" }}>
            Available Certifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certifications.map((cert) => (
              <div key={cert.id} className="relative p-8 border border-white/10 bg-white/5 overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <ShieldCheck className="w-10 h-10 text-[#FF2D2D]" />
                  <span className="font-mono text-white/30 text-xs">{cert.id}</span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-grotesk)" }}>
                  {cert.title}
                </h3>
                <p className="text-white/50 mb-6">{cert.level} Level</p>
                <div className="flex gap-3">
                  <Link href="/dashboard/certification" className="flex items-center gap-2 px-4 py-2 bg-[#FF2D2D] text-white text-sm font-bold uppercase tracking-wide hover:bg-white hover:text-black transition-colors">
                    <Award className="w-4 h-4" /> Open Exam
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

      <CertificationQuiz />
      <Footer />
    </main>
  );
}
