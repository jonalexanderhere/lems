"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, Award, ShieldCheck, Fingerprint } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  { icon: Award, text: "Industry-style design" },
  { icon: Fingerprint, text: "Auto-generated upon completion" },
  { icon: ShieldCheck, text: "Cryptographically verifiable" }
];

export function Certification() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 70%",
      }
    });

    tl.fromTo(
      ".cert-text",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    )
    .fromTo(
      ".cert-feature",
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
      "-=0.4"
    )
    .fromTo(
      ".cert-visual",
      { rotationY: 20, rotationX: 10, opacity: 0, scale: 0.9 },
      { rotationY: 0, rotationX: 0, opacity: 1, scale: 1, duration: 1.5, ease: "power4.out" },
      "-=0.8"
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 md:py-32 bg-background relative border-t border-white/5 overflow-hidden perspective-1000">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-24">
          
          <div className="flex-1 w-full cert-visual relative group perspective-1000">
            {/* Holographic Glow */}
            <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Certificate Card */}
            <div className="relative aspect-[1.414/1] bg-[#0f0f0f] border border-white/10 p-8 shadow-2xl transition-transform duration-700 transform-gpu group-hover:rotate-y-6 group-hover:-rotate-x-2 flex flex-col justify-between overflow-hidden">
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="font-heading font-bold text-2xl tracking-wider text-white">NETVORA<span className="text-accent">.</span></div>
                  <div className="text-white/40 text-xs tracking-widest uppercase mt-1">Academy of Engineering</div>
                </div>
                <div className="w-16 h-16 rounded-full border border-accent/30 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-accent" />
                </div>
              </div>

              <div className="text-center relative z-10">
                <div className="text-white/50 text-sm tracking-widest uppercase mb-4">Certificate of Completion</div>
                <h3 className="font-heading font-bold text-3xl md:text-5xl text-white tracking-tight leading-tight">
                  Advanced Cisco Routing
                </h3>
              </div>

              <div className="flex justify-between items-end relative z-10">
                <div>
                  <div className="text-white/50 text-xs uppercase tracking-widest mb-1">Awarded to</div>
                  <div className="font-mono text-xl text-white">net_hacker_zero</div>
                </div>
                <div className="text-right">
                  <div className="text-white/50 text-xs uppercase tracking-widest mb-1">Verification ID</div>
                  <div className="font-mono text-accent text-sm">NV-8472-910X</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full space-y-10 lg:pl-12">
            <div className="space-y-4">
              <h2 className="cert-text text-5xl md:text-7xl font-heading font-bold text-white uppercase tracking-tight leading-[0.9]">
                Earn proof.<br/>
                <span className="text-white/40">Not just knowledge.</span>
              </h2>
            </div>

            <div className="space-y-6 pt-4">
              {features.map((feat, i) => (
                <div key={i} className="cert-feature flex items-center gap-4 text-white/80">
                  <CheckCircle2 className="w-6 h-6 text-accent shrink-0" />
                  <span className="text-lg md:text-xl font-medium tracking-wide">{feat.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
