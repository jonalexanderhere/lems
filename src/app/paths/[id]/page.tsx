import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Layers3 } from "lucide-react";

type PathDefinition = {
  title: string;
  subtitle: string;
  duration: string;
  modules: string[];
  outcomes: string[];
};

const PATHS: Record<string, PathDefinition> = {
  "network-fundamentals": {
    title: "Network Fundamentals",
    subtitle: "Understanding the structure of modern networks from the very first packet.",
    duration: "24 Hours",
    modules: [
      "OSI model and TCP/IP overview",
      "IP addressing and subnetting basics",
      "Switching, routing, and default gateway",
      "DNS, DHCP, and ARP essentials",
      "NAT and simple packet flow",
      "Basic troubleshooting workflow",
    ],
    outcomes: [
      "Read and explain a simple network diagram",
      "Configure a small LAN from scratch",
      "Solve address and connectivity issues",
    ],
  },
  "security-fundamentals": {
    title: "Security Fundamentals",
    subtitle: "Starting with safe habits, access control, and the language of risk.",
    duration: "26 Hours",
    modules: [
      "Security principles and threat types",
      "Authentication, authorization, and MFA",
      "Firewall basics and ACL concepts",
      "Password hygiene and secure practice",
      "Phishing, social engineering, and awareness",
      "Logging and incident reporting",
    ],
    outcomes: [
      "Recognize common security risks",
      "Apply basic hardening practices",
      "Read logs with a security mindset",
    ],
  },
  "linux-fundamentals": {
    title: "Linux Fundamentals",
    subtitle: "A clean command-line path for students who are still learning the shell.",
    duration: "22 Hours",
    modules: [
      "Filesystem navigation and shell basics",
      "File permissions and ownership",
      "Processes and services",
      "Package management and updates",
      "Networking tools on Linux",
      "Log inspection and basic automation",
    ],
    outcomes: [
      "Navigate Linux comfortably",
      "Start and stop services",
      "Inspect logs and troubleshoot common issues",
    ],
  },
  "infrastructure-fundamentals": {
    title: "Infrastructure Fundamentals",
    subtitle: "The operational basics behind servers, monitoring, and backups.",
    duration: "20 Hours",
    modules: [
      "Server roles and service planning",
      "Backup concepts and restore checks",
      "Monitoring basics and alerting",
      "Storage, disks, and uptime",
      "Documentation and change tracking",
      "Simple deployment workflow",
    ],
    outcomes: [
      "Describe a basic infrastructure stack",
      "Build backup and restore habits",
      "Understand why monitoring matters",
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(PATHS).map((id) => ({ id }));
}

export default async function PathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const path = PATHS[id];

  if (!path) notFound();

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-40 pb-16 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto max-w-5xl">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.3em] text-sm mb-4">Foundation Path</p>
          <h1 className="font-black uppercase tracking-tighter text-5xl md:text-6xl lg:text-7xl leading-none max-w-4xl" style={{ fontFamily: "var(--font-grotesk)" }}>
            {path.title}
          </h1>
          <p className="text-white/50 text-xl max-w-3xl mt-6">{path.subtitle}</p>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8">
          <div className="p-8 bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-5 h-5 text-[#FF2D2D]" />
              <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                Modules Dasar
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {path.modules.map((module, index) => (
                <div key={module} className="flex gap-3 p-4 bg-black/20 border border-white/5">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs font-bold text-white/70 shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-white/80">{module}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-8 bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Clock3 className="w-5 h-5 text-[#FF2D2D]" />
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                  Ringkasan
                </h2>
              </div>
              <p className="text-white/60">{path.duration}</p>
            </div>

            <div className="p-8 bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Layers3 className="w-5 h-5 text-[#FF2D2D]" />
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                  Hasil Belajar
                </h2>
              </div>
              <div className="space-y-3">
                {path.outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-start gap-3 text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-1" />
                    <p>{outcome}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
            >
              Masuk Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
