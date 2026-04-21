import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white px-6 md:px-12 py-28">
      <div className="container mx-auto max-w-4xl">
        <p className="text-[#FF2D2D] uppercase tracking-[0.35em] text-xs font-bold mb-4">Privacy</p>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-8" style={{ fontFamily: "var(--font-grotesk)" }}>
          Privacy Policy
        </h1>
        <div className="space-y-5 text-white/70 leading-relaxed">
          <p>
            Netvora Academy menyimpan data akun, progres belajar, badge, dan aktivitas seperlunya untuk menjalankan layanan pembelajaran dan sertifikasi.
          </p>
          <p>
            Data profile seperti nama, kelas, foto, serta hasil sertifikasi dapat terlihat oleh pengguna lain pada fitur leaderboard dan rekam capaian jika fitur tersebut diaktifkan.
          </p>
          <p>
            Kami tidak menjual data pribadi. Akses ke data sensitif dibatasi untuk peran yang berwenang seperti guru dan admin.
          </p>
        </div>
        <div className="mt-10">
          <Link href="/" className="inline-flex items-center px-5 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-[#FF2D2D] hover:text-white transition-colors">
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
