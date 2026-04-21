"use client";

import Link from "next/link";
import { Server, Shield, Globe, Cpu, Radio, Code } from "lucide-react";

const categories = [
  { name: "Cybersecurity", icon: Shield, href: "/courses/cybersecurity" },
  { name: "Networking", icon: Globe, href: "/courses/networking" },
  { name: "System Admin", icon: Server, href: "/courses/sysadmin" },
  { name: "Telekomunikasi", icon: Radio, href: "/courses/telecom" },
  { name: "Web Development", icon: Code, href: "/courses/webdev" },
  { name: "IoT Systems", icon: Cpu, href: "/courses/iot" },
];

export function CourseCategories() {
  return (
    <section className="py-24 bg-background relative border-t border-white/5 z-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white uppercase tracking-tight">
            Specializations
          </h2>
          <Link href="/courses" className="text-accent hover:text-white uppercase tracking-widest text-sm font-medium transition-colors mt-4 md:mt-0 pb-1 border-b border-accent/30 hover:border-white">
            View All Paths
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-sm overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:border-accent hover:shadow-[0_0_30px_rgba(255,45,45,0.15)]"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-accent/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <Icon className="w-10 h-10 text-white/50 group-hover:text-white transition-colors duration-300 mb-4 relative z-10" />
                <span className="text-sm font-medium text-white/70 group-hover:text-white text-center uppercase tracking-wider relative z-10">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
