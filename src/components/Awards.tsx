"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const awards = [
  { title: "Best IT Learning Platform", year: "2026" },
  { title: "Innovation in Education", year: "2026" },
  { title: "Top Digital Training System", year: "2025" }
];

export function Awards() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const items = gsap.utils.toArray<HTMLElement>(".award-item");
    
    gsap.fromTo(
      items,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-12">
          {awards.map((award, i) => (
            <div key={i} className="award-item flex items-center gap-4 text-center md:text-left">
              <Star className="w-8 h-8 text-accent shrink-0 hidden md:block" />
              <div>
                <h4 className="text-xl md:text-2xl font-bold text-white leading-tight">{award.title}</h4>
                <span className="text-white/50 text-sm font-mono tracking-widest">{award.year}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
