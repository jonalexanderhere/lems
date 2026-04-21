"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bot, Terminal, ShieldAlert, Code2, ArrowRight } from "lucide-react";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  { icon: Terminal, text: "Jelaskan konsep jaringan" },
  { icon: ShieldAlert, text: "Bantu config Cisco/Linux" },
  { icon: Code2, text: "Debug kode infrastruktur" }
];

export function AITutorTeaser() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 70%",
      }
    });

    tl.fromTo(
      ".ai-text",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    )
    .fromTo(
      ".ai-feature",
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
      "-=0.4"
    )
    .fromTo(
      ".ai-visual",
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1, ease: "power4.out" },
      "-=0.8"
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 md:py-32 bg-background relative border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          <div className="flex-1 w-full space-y-10">
            <div className="space-y-4">
              <div className="ai-text inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent font-medium text-sm mb-4">
                <Bot className="w-4 h-4" />
                <span>Akses Beta</span>
              </div>
              <h2 className="ai-text text-5xl md:text-7xl font-heading font-bold text-white uppercase tracking-tight leading-[0.9]">
                Mentor AI Anda.<br/>
                <span className="text-white/40">Selalu Aktif.</span>
              </h2>
              <p className="ai-text text-xl md:text-2xl text-white/60 font-light max-w-lg mt-6">
                Tanya. Debug. Belajar lebih cepat. AI khusus yang dilatih untuk networking, sysadmin, dan cybersecurity.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              {features.map((feat, i) => (
                <div key={i} className="ai-feature flex items-center gap-4 text-white/80">
                  <div className="w-12 h-12 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent">
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-lg md:text-xl font-medium tracking-wide">{feat.text}</span>
                </div>
              ))}
            </div>

            <div className="ai-text pt-8">
              <Link 
                href="/ai-tutor" 
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-background font-bold uppercase tracking-widest overflow-hidden"
              >
                <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-500 delay-75">Tanya AI Sekarang</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:text-white transition-colors duration-500 delay-75 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full ai-visual relative">
            <div className="aspect-square md:aspect-[4/3] rounded-sm bg-white/5 border border-white/10 p-6 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                <Bot className="w-6 h-6 text-accent" />
                <span className="font-heading font-bold uppercase tracking-widest text-white/80 text-sm">Netvora Intelligence</span>
              </div>
              
              <div className="flex-1 grid gap-4 content-start">
                <div className="p-4 bg-white/5 rounded-sm border border-white/5 text-white/70 text-sm">
                  AI tutor siap dipakai langsung dari halaman khusus.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {features.map((feat) => (
                    <div key={feat.text} className="p-3 bg-accent/10 border border-accent/20 rounded-sm text-white text-sm">
                      <feat.icon className="w-4 h-4 text-accent mb-2" />
                      {feat.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
