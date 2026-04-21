"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Activity, Target, BrainCircuit } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  { icon: Target, title: "Analisis Skill", desc: "Identifikasi domain terkuat dan celah kritis Anda." },
  { icon: BrainCircuit, title: "Rekomendasi AI", desc: "Alur belajar personal berdasarkan performa Anda." },
  { icon: Activity, title: "Grafik Performa", desc: "Visualisasikan pertumbuhan Anda seiring waktu dengan data presisi." }
];

export function Analytics() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 75%",
      }
    });

    tl.fromTo(
      ".analytics-header",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    )
    .fromTo(
      ".analytics-card",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: "power2.out" },
      "-=0.4"
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 md:py-32 bg-background relative z-10 border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="analytics-header text-4xl md:text-6xl font-heading font-bold text-white uppercase tracking-tight leading-[0.9] mb-6">
            Pantau Progres.<br/>
            <span className="text-accent">Perbaiki Kelemahan.</span>
          </h2>
          <p className="analytics-header text-lg md:text-xl text-white/60 font-light">
            Berhenti menebak. AI kami menganalisis setiap kuis, lab, dan interaksi untuk memberi Anda peta kemampuan networking yang jelas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feat, i) => (
            <div key={i} className="analytics-card bg-white/5 border border-white/10 p-8 rounded-sm hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{feat.title}</h3>
              <p className="text-white/60 font-light leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
