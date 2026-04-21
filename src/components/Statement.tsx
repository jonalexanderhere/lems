"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Statement() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    const lines = gsap.utils.toArray<HTMLElement>(".statement-line");
    
    lines.forEach((line) => {
      gsap.fromTo(
        line,
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: line,
            start: "top 90%",
            end: "bottom 60%",
            scrub: 1,
          }
        }
      );
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-32 md:py-48 bg-background relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="max-w-5xl mx-auto space-y-16 md:space-y-24">
          
          <div className="space-y-2 font-heading font-bold text-4xl md:text-6xl lg:text-7xl uppercase tracking-tighter leading-[0.9]">
            <div className="overflow-hidden py-2"><h2 className="statement-line text-white">LEARN HARD.</h2></div>
            <div className="overflow-hidden py-2"><h2 className="statement-line text-white">BUILD REAL.</h2></div>
            <div className="overflow-hidden py-2"><h2 className="statement-line text-accent">NO THEORY ONLY.</h2></div>
          </div>

          <div className="space-y-8 md:space-y-12 pl-4 md:pl-8 border-l-2 border-accent/30">
            <div className="overflow-hidden">
              <p className="statement-line text-xl md:text-3xl text-white/60 font-light leading-tight">
                This is not school. <br />
                <span className="text-white font-medium">This is system training.</span>
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="statement-line text-xl md:text-3xl text-white/60 font-light leading-tight">
                We create network engineers. <br />
                <span className="text-white font-medium">Not just students.</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
