import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Mail, Globe, MessageSquare, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Contact | Netvora Academy",
  description: "Get in touch with Netvora Academy.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-40 pb-16 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.3em] text-sm mb-4">Get In Touch</p>
          <h1 className="font-black uppercase tracking-tighter text-5xl md:text-6xl lg:text-7xl leading-none" style={{ fontFamily: "var(--font-grotesk)" }}>
            Contact
          </h1>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>Ready to become an engineer?</h2>
              <p className="text-white/50 text-lg leading-relaxed">
                Have questions about courses, certifications, or partnerships? Reach out — we typically respond within 24 hours.
              </p>
            </div>

            <div className="space-y-6">
              <a href="mailto:contact@netvora.academy" className="flex items-center gap-4 text-white/70 hover:text-white group transition-colors">
                <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#FF2D2D]/50 transition-colors">
                  <Mail className="w-5 h-5 text-[#FF2D2D]" />
                </div>
                <span className="text-lg">contact@netvora.academy</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-white/70 hover:text-white group transition-colors">
                <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#FF2D2D]/50 transition-colors">
                  <Globe className="w-5 h-5 text-[#FF2D2D]" />
                </div>
                <span className="text-lg">@netvora.academy</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-white/70 hover:text-white group transition-colors">
                <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#FF2D2D]/50 transition-colors">
                  <Globe className="w-5 h-5 text-[#FF2D2D]" />
                </div>
                <span className="text-lg">Netvora Academy</span>
              </a>
              <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-white/70 hover:text-white group transition-colors">
                <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#FF2D2D]/50 transition-colors">
                  <MessageSquare className="w-5 h-5 text-[#FF2D2D]" />
                </div>
                <span className="text-lg">Join Discord Community</span>
              </a>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-6">
            <div>
              <label className="block text-sm uppercase tracking-widest text-white/50 mb-2">Full Name</label>
              <input type="text" placeholder="Your name" className="w-full bg-white/5 border border-white/10 px-4 py-4 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-widest text-white/50 mb-2">Email</label>
              <input type="email" placeholder="your@email.com" className="w-full bg-white/5 border border-white/10 px-4 py-4 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-sm uppercase tracking-widest text-white/50 mb-2">Message</label>
              <textarea rows={6} placeholder="Write your message..." className="w-full bg-white/5 border border-white/10 px-4 py-4 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors resize-none" />
            </div>
            <button type="button" className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
              Send Message <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}
