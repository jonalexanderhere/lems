import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-[#FF2D2D]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 text-center px-6">
        <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.4em] text-sm mb-6">
          Error 404
        </p>
        <h1
          className="font-black uppercase tracking-tighter leading-none mb-8"
          style={{ fontFamily: "var(--font-grotesk)", fontSize: "clamp(6rem,20vw,16rem)" }}
        >
          LOST.
        </h1>
        <p className="text-white/50 text-xl mb-12 max-w-md mx-auto">
          This page doesn't exist. Get back on track.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-300"
        >
          ← Return Home
        </Link>
      </div>
    </main>
  );
}
