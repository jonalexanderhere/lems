"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Stagger text animation
    tl.fromTo(
      ".hero-text",
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power4.out", delay: 0.2 }
    );
    
    // Fade in CTA
    tl.fromTo(
      ".hero-cta",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.4"
    );

    // Subtle parallax effect on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 20;
      const yPos = (clientY / window.innerHeight - 0.5) * 20;

      gsap.to(".hero-bg", {
        x: xPos,
        y: yPos,
        duration: 2,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-background"
    >
      {/* Background with slight red tint and grid/glow */}
      <div className="hero-bg absolute inset-0 z-0 scale-110">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-background to-background" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-12 flex flex-col items-center md:items-start text-center md:text-left mt-16">
        <div ref={textRef} className="overflow-hidden">
          <h1 className="hero-text font-heading text-6xl md:text-8xl lg:text-[10rem] font-bold leading-[0.85] tracking-tighter uppercase text-white mb-2">
            Train Like
          </h1>
          <h1 className="hero-text font-heading text-6xl md:text-8xl lg:text-[10rem] font-bold leading-[0.85] tracking-tighter uppercase text-white">
            An <span className="text-accent">Engineer.</span>
          </h1>
        </div>
        
        <p className="hero-text mt-8 max-w-2xl text-lg md:text-xl text-white/70 font-light">
          Real networking. Real systems. AI-powered learning for future professionals. Build infrastructure that scales.
        </p>

        <div className="hero-cta mt-12 flex flex-col sm:flex-row gap-6">
          <Link 
            href="/courses" 
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent text-white font-bold uppercase tracking-widest overflow-hidden"
          >
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
            <span className="relative z-10 group-hover:text-background transition-colors duration-500 delay-75">Start Learning</span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:text-background transition-colors duration-500 delay-75 group-hover:translate-x-1" />
            
            {/* Red Glow Effect */}
            <div className="absolute -inset-1 bg-accent/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
          </Link>
          
          <Link 
            href="/login" 
            className="group inline-flex items-center justify-center px-8 py-4 border border-white/20 text-white font-medium uppercase tracking-widest hover:border-white/60 transition-colors"
          >
            Enter Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
