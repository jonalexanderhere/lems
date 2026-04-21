"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background pt-32 pb-12 relative overflow-hidden border-t border-white/5">
      {/* Background glow for CTA */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-accent/10 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        
        {/* Second CTA Section */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-32">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-white uppercase tracking-tighter leading-[0.95] mb-6">
            You do not need more theory. <br/>
            <span className="text-accent">You need execution.</span>
          </h2>
          <p className="text-lg md:text-xl text-white/60 font-light mb-12">
            Build real skills. Start now.
          </p>
          <Link 
            href="/signup" 
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-accent text-white font-bold uppercase tracking-widest overflow-hidden hover:scale-105 transition-transform duration-300"
          >
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
            <span className="relative z-10 group-hover:text-background transition-colors duration-500 delay-75">Join Platform</span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:text-background transition-colors duration-500 delay-75 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Final Contact Section & Links */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 border-t border-white/10 pt-12">
          
          <div className="w-full md:w-auto">
            <h3 className="text-xl md:text-2xl font-heading font-bold text-white uppercase tracking-tight mb-6">
              Ready to become <br/>an engineer?
            </h3>
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center px-6 py-3 border border-white/20 text-white font-medium uppercase tracking-widest hover:bg-white hover:text-background transition-colors"
            >
              Start Learning
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm font-medium uppercase tracking-widest text-white/50 w-full md:w-auto">
            <Link href="/courses" className="hover:text-accent transition-colors">Courses</Link>
            <Link href="/contact" className="hover:text-accent transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-accent transition-colors">Terms</Link>
          </div>
          
        </div>
        
        <div className="mt-16 flex flex-col md:flex-row justify-between items-center gap-4 text-white/30 text-xs uppercase tracking-widest border-t border-white/5 pt-8">
          <div>&copy; {new Date().getFullYear()} Netvora Academy. Seluruh Hak Cipta Dilindungi.</div>
          <div className="font-bold text-accent">Dibuat oleh Ghifari Azhar</div>
        </div>
      </div>
    </footer>
  );
}
