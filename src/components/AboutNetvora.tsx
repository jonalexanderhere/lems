"use client";

import { motion } from "framer-motion";
import { Terminal, Globe, Cpu, Users } from "lucide-react";

export function AboutNetvora() {
  return (
    <section className="py-24 bg-[#0A0A0A] border-y border-white/5 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h2 className="text-[#FF2D2D] font-mono text-sm uppercase tracking-widest mb-4">Filosofi Kami</h2>
          <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>
            Network + Vora
          </h3>
          <p className="text-white/60 text-lg md:text-xl leading-relaxed">
            <strong className="text-white">Netvora</strong> adalah gabungan dari kata <span className="text-white italic">Network</span> (Jaringan) dan <span className="text-white italic">Vora</span> (Eksplorasi/Pemakan Ilmu). Platform LMS modern yang dirancang khusus untuk memfasilitasi pembelajaran IT yang terstruktur, praktis, dan mendalam.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12 mt-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-8 bg-white/5 border border-white/10 hover:border-[#FF2D2D]/50 transition-colors group"
          >
            <div className="w-14 h-14 bg-[#FF2D2D]/10 flex items-center justify-center mb-6 rounded-full group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-[#FF2D2D]" />
            </div>
            <h4 className="text-xl font-bold text-white uppercase tracking-wider mb-3">Siswa SMK TJKT</h4>
            <p className="text-white/50 leading-relaxed">
              Didesain khusus untuk memenuhi kurikulum SMK jurusan TJKT (Teknik Jaringan Komputer dan Telekomunikasi) dengan praktik langsung di browser.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="p-8 bg-white/5 border border-white/10 hover:border-[#FF2D2D]/50 transition-colors group"
          >
            <div className="w-14 h-14 bg-[#FF2D2D]/10 flex items-center justify-center mb-6 rounded-full group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 text-[#FF2D2D]" />
            </div>
            <h4 className="text-xl font-bold text-white uppercase tracking-wider mb-3">Pemula IT</h4>
            <p className="text-white/50 leading-relaxed">
              Langkah pertama yang sempurna untuk siapa saja yang ingin memulai karir di dunia IT, dari dasar networking hingga keamanan cyber.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="p-8 bg-white/5 border border-white/10 hover:border-[#FF2D2D]/50 transition-colors group"
          >
            <div className="w-14 h-14 bg-[#FF2D2D]/10 flex items-center justify-center mb-6 rounded-full group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-[#FF2D2D]" />
            </div>
            <h4 className="text-xl font-bold text-white uppercase tracking-wider mb-3">Junior Developer</h4>
            <p className="text-white/50 leading-relaxed">
              Tingkatkan fundamental infrastruktur, pemahaman Linux server, dan arsitektur web modern untuk mendukung karir development.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
