"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const navLinks = [
  { name: "Kursus", href: "/courses" },
  { name: "Alur Belajar", href: "/paths" },
  { name: "AI Tutor", href: "/ai-tutor" },
  { name: "Papan Skor", href: "/leaderboard" },
  { name: "Sertifikasi", href: "/certification" },
  { name: "Kontak", href: "/contact" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useGSAP(() => {
    if (isOpen) {
      gsap.to(menuRef.current, {
        x: 0,
        duration: 0.8,
        ease: "power4.inOut",
      });
      gsap.fromTo(
        linkRefs.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.4,
        }
      );
    } else {
      gsap.to(menuRef.current, {
        x: "100%",
        duration: 0.8,
        ease: "power4.inOut",
      });
    }
  }, [isOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 py-6 px-8 flex justify-between items-center mix-blend-difference text-white">
        <Link href="/" className="font-heading text-2xl font-bold tracking-wider hover:text-accent transition-colors">
          NETVORA<span className="text-accent">.</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hidden md:block text-sm uppercase tracking-widest font-medium hover:text-accent transition-colors">
            Login / Dashboard
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Fullscreen Menu */}
      <div
        ref={menuRef}
        className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] translate-x-full flex flex-col justify-center px-8 md:px-24"
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors text-white"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="flex flex-col gap-6 md:gap-8 max-w-4xl">
          {navLinks.map((link, i) => (
            <Link
              key={link.name}
              href={link.href}
              ref={(el) => {
                linkRefs.current[i] = el;
              }}
              onClick={() => setIsOpen(false)}
              className="font-heading text-5xl md:text-7xl font-bold uppercase hover:text-accent transition-colors w-fit"
            >
              {link.name}
            </Link>
          ))}
        </div>
        
        <div className="absolute bottom-12 left-8 md:left-24">
          <Link href="/login" className="text-xl text-white/70 hover:text-white uppercase tracking-widest transition-colors border-b border-accent pb-1">
            Access Dashboard →
          </Link>
        </div>
      </div>
    </>
  );
}
