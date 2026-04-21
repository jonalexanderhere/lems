"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ShieldCheck,
  Zap,
  Globe,
  Users,
  BookOpen,
  Award,
  Star,
  CheckCircle2,
  TrendingUp,
  Cpu,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const trustBadges = [
  {
    icon: ShieldCheck,
    label: "Kurikulum Terverifikasi",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  {
    icon: Zap,
    label: "Powered by GPT-4o",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
  },
  {
    icon: Globe,
    label: "Akses 24/7 Online",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
  },
  {
    icon: Award,
    label: "Sertifikat Resmi",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
  },
  {
    icon: Cpu,
    label: "Lab Simulator Nyata",
    color: "text-[#FF2D2D]",
    bg: "bg-[#FF2D2D]/10 border-[#FF2D2D]/20",
  },
  {
    icon: TrendingUp,
    label: "Tingkat Kelulusan 94%",
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/20",
  },
];

const stats = [
  { value: "500+", label: "Siswa Aktif", icon: Users },
  { value: "40+", label: "Modul Kursus", icon: BookOpen },
  { value: "94%", label: "Tingkat Kelulusan", icon: TrendingUp },
  { value: "4.9★", label: "Rating Platform", icon: Star },
];

const testimonials = [
  {
    name: "Rizky Firmansyah",
    role: "Siswa XII TJKT 1",
    text: "AI Tutor-nya gila banget! Nanya soal OSPF langsung dapet penjelasan step-by-step yang beneran masuk. Belajar jadi 10x lebih cepet.",
    rating: 5,
  },
  {
    name: "Dina Rahayu",
    role: "Siswa XI TJKT 2",
    text: "Lab terminalnya realistis banget. Pertama kali bisa config Cisco switch sendiri tanpa takut salah karena ini simulasi.",
    rating: 5,
  },
  {
    name: "Pak Hendro",
    role: "Guru Jaringan SMK",
    text: "Sangat membantu manajemen kelas dan tugas. Fitur absensi wajah dan auto-grading menghemat banyak waktu saya.",
    rating: 5,
  },
];

const features = [
  "Materi Networking Cisco & Linux lengkap",
  "AI Tutor 24/7 berbasis GPT-4o",
  "Lab Terminal Simulator interaktif",
  "Absensi wajah otomatis (Face Recognition)",
  "Sistem XP & Leaderboard gamifikasi",
  "Sertifikat digital terverifikasi",
  "Dashboard guru & admin lengkap",
  "Auto-grading tugas cerdas",
];

export function TrustBadges() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Stats counter animation
    gsap.fromTo(
      ".trust-stat",
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".trust-stats-row",
          start: "top 80%",
        },
      }
    );

    // Badge pills
    gsap.fromTo(
      ".trust-badge",
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: ".trust-badges-row",
          start: "top 85%",
        },
      }
    );

    // Testimonials
    gsap.fromTo(
      ".trust-testimonial",
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".trust-testimonials-grid",
          start: "top 80%",
        },
      }
    );

    // Features checklist
    gsap.fromTo(
      ".trust-feature-item",
      { x: -20, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".trust-features-grid",
          start: "top 85%",
        },
      }
    );
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="py-24 md:py-32 bg-background relative border-t border-white/5 overflow-hidden"
    >
      {/* Subtle bg glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">

        {/* ---- SECTION HEADER ---- */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/25 rounded-full text-accent font-semibold text-sm mb-6">
            <ShieldCheck className="w-4 h-4" />
            Dipercaya oleh Siswa & Guru SMK TJKT
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-white uppercase tracking-tight leading-[0.95] mb-4">
            Kenapa Pilih{" "}
            <span className="text-accent">Netvora?</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto font-light">
            Platform pembelajaran IT paling lengkap untuk SMK TJKT. Dari teori hingga lab nyata, semuanya ada di sini.
          </p>
        </div>

        {/* ---- STATS ROW ---- */}
        <div className="trust-stats-row grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="trust-stat bg-white/5 border border-white/10 rounded-sm p-6 text-center hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300 group"
            >
              <stat.icon className="w-6 h-6 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl md:text-4xl font-heading font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-white/50 text-sm uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ---- TRUST BADGES ---- */}
        <div className="trust-badges-row flex flex-wrap justify-center gap-3 mb-20">
          {trustBadges.map((badge, i) => (
            <div
              key={i}
              className={`trust-badge flex items-center gap-2 px-4 py-2 border rounded-full font-medium text-sm transition-all hover:scale-105 cursor-default ${badge.bg} ${badge.color}`}
            >
              <badge.icon className="w-4 h-4" />
              {badge.label}
            </div>
          ))}
        </div>

        {/* ---- FEATURES CHECKLIST ---- */}
        <div className="mb-24">
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-white uppercase tracking-tight text-center mb-10">
            Semua yang Kamu Butuhkan
          </h3>
          <div className="trust-features-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {features.map((feat, i) => (
              <div
                key={i}
                className="trust-feature-item flex items-center gap-3 bg-white/5 border border-white/10 rounded-sm px-4 py-3 hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 group"
              >
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-white/80 text-sm font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- TESTIMONIALS ---- */}
        <div>
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-white uppercase tracking-tight text-center mb-10">
            Kata Mereka
          </h3>
          <div className="trust-testimonials-grid grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="trust-testimonial bg-white/5 border border-white/10 rounded-sm p-6 hover:border-white/20 transition-all duration-300 flex flex-col gap-4"
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">
                    {t.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
